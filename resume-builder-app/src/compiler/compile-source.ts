import { parse as parseYaml } from 'yaml'
import { compileLegacy, compileNewSchema, isLegacyFormat } from './index'
import type { RenderModel } from '../models'
import type { ResumeDocument } from '../schema'

export interface DiagnosticItem {
  severity: 'error' | 'warning' | 'info'
  message: string
  line?: number
}

export type SourceStatus = 'new-schema' | 'legacy-adapted' | 'invalid'

export interface CompileResult {
  model: RenderModel | null
  diagnostics: DiagnosticItem[]
  sourceStatus: SourceStatus
}

/**
 * Pure YAML → RenderModel compile step, shared by the paste-in-browser editor
 * (App.tsx) and the file-linked live preview (FileOpenRoute.tsx) so both
 * stay in sync on format detection / error messages.
 */
export function compileResumeSource(
  source: string,
  langOverride?: 'zh' | 'en' | null,
): CompileResult {
  const diagnostics: DiagnosticItem[] = []

  let parsed: unknown
  try {
    parsed = parseYaml(source)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown parse error'
    diagnostics.push({
      severity: 'error',
      message: `YAML syntax error: ${message}`,
    })
    return { model: null, diagnostics, sourceStatus: 'invalid' }
  }

  if (!parsed || typeof parsed !== 'object') {
    diagnostics.push({
      severity: 'error',
      message: 'YAML parsed to empty or non-object value',
    })
    return { model: null, diagnostics, sourceStatus: 'invalid' }
  }

  if (isLegacyFormat(parsed)) {
    const model = compileLegacy(parsed, langOverride ?? undefined)
    diagnostics.push({
      severity: 'info',
      message: 'Legacy yamlresume format detected and adapted',
    })
    return { model, diagnostics, sourceStatus: 'legacy-adapted' }
  }

  const doc = parsed as Record<string, unknown>
  if (doc.schema && doc.document && doc.basics && doc.sections) {
    const model = compileNewSchema(
      parsed as ResumeDocument,
      langOverride ?? undefined,
    )
    return { model, diagnostics, sourceStatus: 'new-schema' }
  }

  diagnostics.push({
    severity: 'error',
    message:
      'Unknown YAML structure — expected new schema (schema + document + basics + sections) or legacy format (content.basics)',
  })
  return { model: null, diagnostics, sourceStatus: 'invalid' }
}
