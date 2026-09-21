import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router'
import {
  AlertTriangle,
  CircleX,
  FileWarning,
  Info,
  Radio,
  RadioTower,
} from 'lucide-react'
import { ResumeRenderer } from '../renderer'
import {
  compileResumeSource,
  type DiagnosticItem,
  type SourceStatus,
} from '../../compiler/compile-source'
import type { RenderModel } from '../../models'
import { buildExportFilename } from '../../export/build-filename'
import { AppToolbar } from '../components/AppToolbar'
import { PreviewZoomControls } from '../components/PreviewZoomControls'
import {
  DEFAULT_LAYOUT_OPTIONS,
  type LayoutOptions,
} from '../layout/layout-options'

type ConnectionStatus = 'connecting' | 'live' | 'disconnected'

interface WatchEvent {
  content?: string
  mtimeMs?: number
  error?: string
}

/**
 * Live, read-only preview driven by a file in data/resumes/ instead of the
 * in-browser Monaco editor. VS Code (or any editor) is the source of truth —
 * saving the file re-renders the preview via an SSE stream from the local
 * export service, so there's no browser/disk copy to keep in sync by hand.
 */
export function FileOpenRoute() {
  const { name = '' } = useParams<{ name: string }>()

  const [renderModel, setRenderModel] = useState<RenderModel | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([])
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>('new-schema')
  const [notFound, setNotFound] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    ...DEFAULT_LAYOUT_OPTIONS,
  })
  const [langOverride, setLangOverride] = useState<'zh' | 'en' | null>(null)
  const [previewZoom, setPreviewZoom] = useState(1.0)
  const [showSocialIcons, setShowSocialIcons] = useState(true)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting')
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const lastValidModel = useRef<RenderModel | null>(null)
  const lastSourceRef = useRef<string>('')
  const hasSeededLayout = useRef(false)

  const applyContent = useCallback(
    (content: string, forceLang?: 'zh' | 'en' | null) => {
      lastSourceRef.current = content
      const effectiveLang = forceLang !== undefined ? forceLang : langOverride
      const result = compileResumeSource(content, effectiveLang)
      setDiagnostics(result.diagnostics)
      setSourceStatus(result.sourceStatus)
      if (result.model) {
        setRenderModel(result.model)
        lastValidModel.current = result.model
        if (!hasSeededLayout.current) {
          hasSeededLayout.current = true
          setLayoutOptions((prev) => ({
            ...prev,
            paperSize: result.model!.paperSize,
            templateId: result.model!.templateId,
          }))
        }
      }
    },
    [langOverride],
  )

  const handleLangChange = useCallback(
    (lang: 'zh' | 'en' | null) => {
      setLangOverride(lang)
      applyContent(lastSourceRef.current, lang)
    },
    [applyContent],
  )

  // Subscribe to the file's live stream. The first SSE message doubles as
  // the initial load, so no separate fetch is needed.
  useEffect(() => {
    if (!name) return
    hasSeededLayout.current = false
    setConnectionStatus('connecting')
    setNotFound(false)

    const source = new EventSource(
      `/api/resumes/${encodeURIComponent(name)}/watch`,
    )

    source.onopen = () => setConnectionStatus('live')
    source.onerror = () => setConnectionStatus('disconnected')
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as WatchEvent
        if (payload.error) {
          if (/not found|ENOENT/i.test(payload.error)) setNotFound(true)
          return
        }
        if (typeof payload.content === 'string') {
          setConnectionStatus('live')
          setLastUpdated(payload.mtimeMs ?? Date.now())
          applyContent(payload.content)
        }
      } catch {
        // Ignore malformed/heartbeat frames.
      }
    }

    return () => source.close()
    // Re-subscribe only when the file name changes; lang changes are
    // handled by recompiling the already-loaded source in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  useEffect(() => {
    fetch(`/api/resumes/${encodeURIComponent(name)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true)
          return null
        }
        return res.json()
      })
      .catch(() => null)
    // The GET above is a cheap existence probe only — the SSE stream above
    // delivers the actual content and drives every re-render.
  }, [name])

  const handleExport = useCallback(async () => {
    if (!renderModel || sourceStatus === 'invalid') return
    if (isExporting) {
      alert('An export task is already in progress. Please wait and try again.')
      return
    }
    setIsExporting(true)
    const filename = buildExportFilename(renderModel)
    try {
      const resp = await fetch('http://localhost:3001/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: renderModel,
          filename,
          options: { layout: layoutOptions, showSocialIcons },
        }),
      })
      if (resp.ok) {
        const blob = await resp.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      } else if (resp.status === 429) {
        alert(
          'An export task is already running on the server. Please wait and try again.',
        )
      } else {
        const errText = await resp.text()
        alert(`Export failed: ${errText}`)
      }
    } catch {
      alert(
        'Export service unavailable. Please ensure the export service is running (pnpm dev).',
      )
    } finally {
      setIsExporting(false)
    }
  }, [renderModel, sourceStatus, isExporting, layoutOptions, showSocialIcons])

  const displayModel = renderModel ?? lastValidModel.current

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-center">
        <FileWarning className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No file named "{name}" in data/resumes/.
        </p>
        <Link to="/" className="text-sm text-primary underline">
          Back to paste mode
        </Link>
      </div>
    )
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <AppToolbar
        sourceStatus={sourceStatus}
        diagnosticCount={diagnostics.length}
        langOverride={langOverride}
        onLangChange={handleLangChange}
        showSocialIcons={showSocialIcons}
        onShowSocialIconsChange={setShowSocialIcons}
        layoutOptions={layoutOptions}
        onLayoutChange={setLayoutOptions}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <div className="no-print flex h-8 shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-3 text-xs text-muted-foreground">
        {connectionStatus === 'live' ? (
          <Radio className="size-3.5 text-emerald-600" />
        ) : (
          <RadioTower className="size-3.5 animate-pulse text-amber-600" />
        )}
        <span>
          Live from <code className="font-mono">data/resumes/{name}.yml</code>
          {connectionStatus === 'disconnected' && ' — reconnecting…'}
        </span>
        {lastUpdated && (
          <span className="text-muted-foreground/70">
            · updated {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
        <div className="flex-1" />
        <Link to="/" className="underline hover:text-foreground">
          Switch to paste mode
        </Link>
      </div>

      {diagnostics.length > 0 && (
        <div className="no-print shrink-0 overflow-auto border-b border-border bg-muted/60 px-3 py-2">
          {diagnostics.map((d, i) => {
            const Icon =
              d.severity === 'error'
                ? CircleX
                : d.severity === 'warning'
                  ? AlertTriangle
                  : Info
            const toneClass =
              d.severity === 'error'
                ? 'text-destructive'
                : d.severity === 'warning'
                  ? 'text-amber-600'
                  : 'text-blue-600'
            return (
              <div
                key={i}
                className={`flex items-start gap-1.5 text-xs leading-relaxed break-words ${toneClass}`}
              >
                <Icon className="mt-0.5 shrink-0 size-3.5" />
                <span>{d.message}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex-1 relative overflow-auto bg-workspace">
        {displayModel ? (
          <div
            style={{
              transform: `scale(${previewZoom})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease',
            }}
          >
            <ResumeRenderer
              model={displayModel}
              layout={layoutOptions}
              showSocialIcons={showSocialIcons}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Waiting for {name}.yml…
          </div>
        )}

        <PreviewZoomControls zoom={previewZoom} onZoomChange={setPreviewZoom} />
      </div>
    </div>
  )
}
