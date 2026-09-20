import { useState, useEffect } from 'react'
import { ResumeRenderer } from '../renderer'
import { resolveFontFamily } from '../renderer/font-family'
import type { RenderModel } from '../../models'
import {
  layoutFromLegacyOptions,
  type LayoutOptions,
} from '../layout/layout-options'

export interface ExportRenderOptions {
  layout?: LayoutOptions
  /** @deprecated Use layout.enabled */
  optimized?: boolean
  /** @deprecated Use layout.spacingScale */
  spacingScale?: number
  showSocialIcons?: boolean
}

interface ExportPayload {
  model: RenderModel
  options?: ExportRenderOptions
}

/**
 * Print Route — dedicated route rendered by the Puppeteer export service.
 * No editor chrome. Same rendering components as preview.
 * Signals readiness via window.__RESUME_EXPORT_READY__ after model is loaded,
 * fonts have settled, and PaginatedPaper has finished measuring.
 */
export function PrintRoute() {
  const [payload, setPayload] = useState<ExportPayload | null>(null)

  useEffect(() => {
    const readPayload = (): ExportPayload | null => {
      const win = window as unknown as Record<string, unknown>
      const injected = win.__RESUME_MODEL__ as RenderModel | undefined
      if (!injected) return null
      return {
        model: injected,
        options: win.__RESUME_EXPORT_OPTIONS__ as
          | ExportRenderOptions
          | undefined,
      }
    }

    const handler = () => {
      const next = readPayload()
      if (next) {
        console.log('[PrintRoute] Model received via event')
        setPayload(next)
      }
    }

    window.addEventListener('resume-model-ready', handler)

    const existing = readPayload()
    if (existing) {
      console.log('[PrintRoute] Model already present on window')
      setPayload(existing)
    }

    return () => window.removeEventListener('resume-model-ready', handler)
  }, [])

  useEffect(() => {
    if (!payload) return
    console.log('[PrintRoute] Model set, waiting for fonts + layout...')

    // Recompute live (not payload.model.fontFamily) so the exported PDF's
    // preloaded font matches what ResumeRendererBody will actually render,
    // even if the export request's layout.templateId overrides the model's
    // compiled default.
    const layout = layoutFromLegacyOptions(payload.options)
    const family = resolveFontFamily(payload.model.lang, layout.templateId)
    const weights = [400, 500, 600, 700]

    Promise.all(
      weights.map((weight) =>
        document.fonts.load(`${weight} 16px ${family}`).catch(() => undefined),
      ),
    )
      .then(() => document.fonts.ready)
      .then(() => {
        const waitForLayout = () =>
          new Promise<void>((resolve) => {
            const check = () => {
              if (
                (window as unknown as Record<string, unknown>)
                  .__RESUME_LAYOUT_READY__ === true
              ) {
                resolve()
                return
              }
              setTimeout(check, 50)
            }
            check()
          })

        return waitForLayout()
      })
      .then(() => {
        console.log('[PrintRoute] Signaling __RESUME_EXPORT_READY__')
        ;(
          window as unknown as Record<string, unknown>
        ).__RESUME_EXPORT_READY__ = true
      })
  }, [payload])

  if (!payload) {
    return (
      <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
        Waiting for document…
      </div>
    )
  }

  const { model, options } = payload
  const layout = layoutFromLegacyOptions(options)

  return (
    <ResumeRenderer
      model={model}
      layout={layout}
      showSocialIcons={options?.showSocialIcons}
    />
  )
}
