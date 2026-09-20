import type { TemplateId } from '../../models/render-model'

const CJK_LANGS = new Set(['zh-hans', 'zh-hant-hk', 'zh-hant-tw', 'zh'])

const CJK_FONT_FAMILY =
  "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"
const JAKE_FONT_FAMILY = "'Inter', system-ui, -apple-system, sans-serif"

/**
 * Calibri isn't a web-safe font (Microsoft-licensed), so this falls back
 * through to arial / sans-serif. Resolves to Calibri directly on machines that have MS Office
 * installed, otherwise degrades gracefully.
 */
const TECH_COMPACT_FONT_FAMILY = 'Calibri, Arial, sans-serif'

/**
 * Per-template font registry (non-CJK only — CJK languages always use
 * CJK_FONT_FAMILY regardless of template, since Calibri/Inter have no CJK
 * glyphs). Adding a template means adding one entry here.
 */
const TEMPLATE_FONT_FAMILY: Record<TemplateId, string> = {
  jake: JAKE_FONT_FAMILY,
  techCompact: TECH_COMPACT_FONT_FAMILY,
}

/** Resolves the CSS font-family for a resume, based on language and template. */
export function resolveFontFamily(
  lang: string,
  templateId: TemplateId,
): string {
  if (CJK_LANGS.has(lang)) return CJK_FONT_FAMILY
  return TEMPLATE_FONT_FAMILY[templateId]
}
