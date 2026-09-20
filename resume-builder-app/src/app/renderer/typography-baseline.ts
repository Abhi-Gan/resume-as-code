import type { TemplateId } from '../../models/render-model'

/**
 * Structural shape for a typography baseline — widened to `number`/`string`
 * rather than derived via `as const`, so sibling baselines (Jake,
 * Tech-Compact) can each specify their own values without TypeScript
 * demanding they match the first baseline's exact literal numbers.
 */
export interface TypographyBaselineShape {
  font: {
    name: number
    headline: number
    contact: number
    summary: number
    sectionHead: number
    entryTitle: number
    entryDate: number
    entrySub: number
    body: number
    skillName: number
    skillLevel: number
    skillKeywords: number
    certName: number
    certMeta: number
    keyword: number
    langLabel: number
    langValue: number
  }
  lineHeight: {
    name: number
    headline: number
    contact: number
    summary: number
    sectionHead: number
    entry: number
    body: number
    keyword: number
    skillKeywords: number
  }
  letterSpacing: {
    sectionHead: string
  }
  spacing: {
    sectionGap: number
    headlineMarginTop: number
    contactPaddingTop: number
    summaryMarginTop: number
    secHeadMarginBottom: number
    secHeadRuleMarginTop: number
    entryHeadMarginBottom: number
    entrySubMarginTop: number
    keywordPaddingTop: number
    bulletMarginBottom: number
    bulletGap: number
    skillRowGap: number
    certRowGap: number
    langRowGap: number
    continuationPaddingTop: number
  }
}

/** Frozen Figma Make template typography and spacing baseline (Jake). */
export const TypographyBaseline: TypographyBaselineShape = {
  font: {
    name: 22,
    headline: 10.5,
    contact: 9,
    summary: 9.5,
    sectionHead: 8,
    entryTitle: 11,
    entryDate: 9,
    entrySub: 10,
    body: 9.5,
    skillName: 9.5,
    skillLevel: 8,
    skillKeywords: 9,
    certName: 9.5,
    certMeta: 8.5,
    keyword: 8.5,
    langLabel: 8.5,
    langValue: 9.5,
  },
  lineHeight: {
    name: 1.1,
    headline: 1.3,
    contact: 1.7,
    summary: 1.6,
    sectionHead: 1,
    entry: 1.3,
    body: 1.45,
    keyword: 1.4,
    skillKeywords: 1.45,
  },
  letterSpacing: {
    sectionHead: '0.22em',
  },
  spacing: {
    sectionGap: 9,
    headlineMarginTop: 3,
    contactPaddingTop: 2,
    summaryMarginTop: 9,
    secHeadMarginBottom: 5,
    secHeadRuleMarginTop: 3,
    entryHeadMarginBottom: 2,
    entrySubMarginTop: 1,
    keywordPaddingTop: 3,
    bulletMarginBottom: 1,
    bulletGap: 5,
    skillRowGap: 3,
    certRowGap: 2.5,
    langRowGap: 3,
    continuationPaddingTop: 5,
  },
}

/**
 * Tech-Compact typography baseline: name at 15px, every other text role at
 * 10px flat (uniform size is part of this template's dense, single-size
 * look), and section headers use normal letter-spacing instead of Jake's
 * wide 0.22em tracking. Spacing/lineHeight otherwise match Jake's for now.
 */
export const TechCompactTypographyBaseline: TypographyBaselineShape = {
  ...TypographyBaseline,
  font: {
    name: 15,
    headline: 10,
    contact: 10,
    summary: 10,
    sectionHead: 10,
    entryTitle: 10,
    entryDate: 10,
    entrySub: 10,
    body: 10,
    skillName: 10,
    skillLevel: 10,
    skillKeywords: 10,
    certName: 10,
    certMeta: 10,
    keyword: 10,
    langLabel: 10,
    langValue: 10,
  },
  letterSpacing: {
    sectionHead: 'normal',
  },
  spacing: {
    sectionGap: 5,
    headlineMarginTop: 4,
    contactPaddingTop: 2,
    summaryMarginTop: 9,
    secHeadMarginBottom: 5,
    secHeadRuleMarginTop: 3,
    entryHeadMarginBottom: 2,
    entrySubMarginTop: 1,
    keywordPaddingTop: 3,
    bulletMarginBottom: 1,
    bulletGap: 5,
    skillRowGap: 3,
    certRowGap: 2.5,
    langRowGap: 3,
    continuationPaddingTop: 5,
  },
}

/**
 * Per-template typography registry: adding a template means adding one
 * entry here — Record<TemplateId, V> forces every id to be accounted for.
 */
export const TEMPLATE_TYPOGRAPHY: Record<TemplateId, TypographyBaselineShape> =
  {
    jake: TypographyBaseline,
    techCompact: TechCompactTypographyBaseline,
  }
