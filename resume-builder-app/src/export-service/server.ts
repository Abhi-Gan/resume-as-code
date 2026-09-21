/**
 * Local PDF Export Service
 *
 * A lightweight Express server that owns a long-lived Chromium browser instance
 * and exposes a POST /api/export endpoint to generate PDFs from the normalized
 * render model via the app's dedicated print route.
 */
import express from 'express'
import cors from 'cors'
import puppeteer, { type Browser } from 'puppeteer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildContentDisposition,
  buildExportFilename,
} from '../export/build-filename'
import { PAPER_SIZES } from '../app/renderer/constants'
import { DEFAULT_PAPER_SIZE, PAPER_SIZE_IDS, type PaperSizeId } from '../models'

const PORT = Number(process.env.EXPORT_PORT) || 3001
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

// data/resumes/ lives at the repo root, three levels up from
// resume-builder-app/src/export-service/. No __dirname in ESM, so derive it
// from import.meta.url instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RESUMES_DIR = path.resolve(__dirname, '../../../data/resumes')

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    console.log('[export] Launching browser...')
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--font-render-hinting=none',
      ],
    })
    console.log('[export] Browser launched')
  }
  return browser
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

let exportInProgress = false

app.post('/api/export', async (req, res) => {
  if (exportInProgress) {
    console.log('[export] Rejected: export already in progress')
    res.status(429).json({
      error: 'An export task is already running. Please wait and try again.',
    })
    return
  }

  exportInProgress = true
  const startTime = Date.now()
  const { model, options } = req.body

  if (!model) {
    exportInProgress = false
    res.status(400).json({ error: "Missing 'model' in request body" })
    return
  }

  const filename =
    typeof req.body.filename === 'string' && req.body.filename.trim()
      ? req.body.filename.trim()
      : buildExportFilename(model)

  console.log(`[export] Starting export: ${filename}`)

  try {
    const b = await getBrowser()
    const page = await b.newPage()

    const rawPaperSize = options?.layout?.paperSize
    const paperSize: PaperSizeId = PAPER_SIZE_IDS.includes(
      rawPaperSize as PaperSizeId,
    )
      ? (rawPaperSize as PaperSizeId)
      : DEFAULT_PAPER_SIZE
    const { widthPx, heightPx } = PAPER_SIZES[paperSize]

    // Match the preview paper size so print CSS and pagination stay aligned.
    await page.setViewport({
      width: widthPx,
      height: heightPx,
      deviceScaleFactor: 1,
    })

    // Capture console from the browser page for debugging
    page.on('console', (msg) => {
      console.log(`[export:page] ${msg.type()}: ${msg.text()}`)
    })
    page.on('pageerror', (err) => {
      console.error(`[export:page] PAGE ERROR: ${err.message}`)
    })

    // Navigate to the print route
    const printUrl = `${APP_URL}/print`
    console.log(`[export] Navigating to ${printUrl}...`)
    await page.goto(printUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log(
      `[export] Page loaded (${Date.now() - startTime}ms). Injecting model...`,
    )

    // Reset export flags before rendering a new document.
    await page.evaluate(() => {
      const win = window as unknown as Record<string, unknown>
      win.__RESUME_EXPORT_READY__ = false
      win.__RESUME_LAYOUT_READY__ = false
    })

    // Inject the render model and preview options into the page
    await page.evaluate(
      (modelData, exportOptions) => {
        const win = window as unknown as Record<string, unknown>
        win.__RESUME_MODEL__ = modelData
        if (exportOptions) {
          win.__RESUME_EXPORT_OPTIONS__ = exportOptions
        }
        window.dispatchEvent(new CustomEvent('resume-model-ready'))
      },
      model,
      options ?? null,
    )
    console.log(`[export] Model injected (${Date.now() - startTime}ms)`)

    // Wait for the app to signal export readiness (with extended timeout)
    console.log('[export] Waiting for __RESUME_EXPORT_READY__...')
    await page.waitForFunction(
      () =>
        (window as unknown as Record<string, unknown>)
          .__RESUME_EXPORT_READY__ === true,
      { timeout: 20000, polling: 100 },
    )
    console.log(
      `[export] Export ready signal received (${Date.now() - startTime}ms)`,
    )

    // Align layout with print CSS before generating the PDF.
    await page.emulateMediaType('print')

    // Wait for fonts to settle
    await page.evaluate(() => document.fonts.ready)

    // Small extra delay for final layout stabilization
    await new Promise((r) => setTimeout(r, 300))

    // Generate PDF
    console.log(`[export] Generating PDF...`)
    // preferCSSPageSize gives the @page CSS rule (set dynamically in
    // PrintStyles.tsx) priority; `format` here is just a matching fallback.
    const pdf = await page.pdf({
      format: PAPER_SIZES[paperSize].pdfFormat,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await page.close()

    const elapsed = Date.now() - startTime
    console.log(
      `[export] ✓ PDF generated (${pdf.length} bytes, ${elapsed}ms total)`,
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', buildContentDisposition(filename))
    res.send(Buffer.from(pdf))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown export error'
    console.error(
      `[export] ✗ Export failed (${Date.now() - startTime}ms): ${message}`,
    )
    res.status(500).json({ error: message })
  } finally {
    exportInProgress = false
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', browserConnected: browser?.connected ?? false })
})

/**
 * Local file bridge for data/resumes/*.yml — lets the browser preview a
 * resume that's being edited on disk (e.g. in VS Code) without copy/pasting
 * its YAML into the in-browser editor. Read-only: the app never writes back.
 */

/** Resolve `name` to an actual file in RESUMES_DIR, or null if it doesn't
 * exist. Matches against a directory listing rather than joining the path
 * directly, so a name containing `..` or `/` can never escape RESUMES_DIR. */
function resolveResumeFile(name: string): string | null {
  const files = safeListResumeFiles()
  const filename = files.includes(`${name}.yml`)
    ? `${name}.yml`
    : files.includes(name)
      ? name
      : null
  return filename ? path.join(RESUMES_DIR, filename) : null
}

function safeListResumeFiles(): string[] {
  try {
    return fs.readdirSync(RESUMES_DIR).filter((f) => f.endsWith('.yml'))
  } catch {
    return []
  }
}

app.get('/api/resumes', (_req, res) => {
  const files = safeListResumeFiles()
  const entries = files.map((filename) => {
    const stat = fs.statSync(path.join(RESUMES_DIR, filename))
    return { name: filename.replace(/\.yml$/, ''), mtimeMs: stat.mtimeMs }
  })
  entries.sort((a, b) => b.mtimeMs - a.mtimeMs)
  res.json(entries)
})

app.get('/api/resumes/:name', (req, res) => {
  const filePath = resolveResumeFile(req.params.name)
  if (!filePath) {
    res.status(404).json({ error: `Resume file not found: ${req.params.name}` })
    return
  }
  const content = fs.readFileSync(filePath, 'utf-8')
  const stat = fs.statSync(filePath)
  res.json({ content, mtimeMs: stat.mtimeMs })
})

app.get('/api/resumes/:name/watch', (req, res) => {
  const filePath = resolveResumeFile(req.params.name)
  if (!filePath) {
    res.status(404).json({ error: `Resume file not found: ${req.params.name}` })
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('retry: 2000\n\n')

  const sendUpdate = () => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const stat = fs.statSync(filePath)
      res.write(
        `data: ${JSON.stringify({ content, mtimeMs: stat.mtimeMs })}\n\n`,
      )
    } catch (err) {
      res.write(
        `data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'read failed' })}\n\n`,
      )
    }
  }

  // Send the current content immediately so the client doesn't need a
  // separate initial fetch before it starts watching.
  sendUpdate()

  // Watch the directory rather than the file itself: editors that save
  // atomically (write a temp file, then rename it over the original) can
  // silently invalidate a single-file fs.watch handle after the first save.
  const targetName = path.basename(filePath)
  let debounceTimer: NodeJS.Timeout | null = null
  const watcher = fs.watch(RESUMES_DIR, (_eventType, filename) => {
    if (filename !== targetName) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(sendUpdate, 150)
  })

  const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 20000)

  req.on('close', () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    clearInterval(heartbeat)
    watcher.close()
  })
})

app.listen(PORT, () => {
  console.log(`📄 PDF export service running on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  if (browser) await browser.close()
  process.exit(0)
})
process.on('SIGTERM', async () => {
  if (browser) await browser.close()
  process.exit(0)
})
