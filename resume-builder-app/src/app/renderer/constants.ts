import type { PaperFormat } from 'puppeteer'
import {
  DEFAULT_PAPER_SIZE,
  type PaperSizeId,
  type TemplateId,
} from '../../models/render-model'

/**
 * Structural shape for a color palette — widened to `string` rather than
 * derived via `as const`, so sibling palettes (Jake, Tech-Compact) can each
 * specify their own hex values without TypeScript demanding they match the
 * first palette's exact literal strings.
 */
export interface ColorPalette {
  name: string
  sectionHead: string
  entry: string
  body: string
  meta: string
  subtle: string
  rule: string
  ruleLight: string
}

/** Design tokens frozen from the Figma Make template baseline. */
export const Colors: ColorPalette = {
  name: '#000000',
  sectionHead: '#000000',
  entry: '#111111',
  body: '#333333',
  meta: '#666666',
  subtle: '#999999',
  rule: '#000000',
  ruleLight: '#CCCCCC',
}

/**
 * Tech-Compact uses all-black text throughout (no gray hierarchy) to match
 * the reference template. Divider lines (rule/ruleLight) are decorative,
 * not text, so they're shared with the default palette unchanged.
 */
export const TECH_COMPACT_COLORS: ColorPalette = {
  name: '#000000',
  sectionHead: '#000000',
  entry: '#000000',
  body: '#000000',
  meta: '#000000',
  subtle: '#000000',
  rule: Colors.rule,
  ruleLight: Colors.ruleLight,
}

/**
 * Per-template color registry: adding a template means adding one entry
 * here — Record<TemplateId, V> forces every id to be accounted for.
 */
export const TEMPLATE_COLORS: Record<TemplateId, ColorPalette> = {
  jake: Colors,
  techCompact: TECH_COMPACT_COLORS,
}

export type { PaperSizeId }
export { DEFAULT_PAPER_SIZE }

/**
 * Physical paper dimensions and per-consumer format spellings, keyed by
 * paper size id. Single source of truth for CSS `@page` keywords and
 * Puppeteer's `page.pdf({ format })` values, so adding a size only means
 * adding one entry here (TypeScript enforces every PaperSizeId has one).
 */
export const PAPER_SIZES: Record<
  PaperSizeId,
  {
    widthPx: number
    heightPx: number
    /** CSS `@page { size: ... }` keyword. */
    cssPageSize: string
    /** Puppeteer `page.pdf({ format })` value. */
    pdfFormat: PaperFormat
  }
> = {
  a4: { widthPx: 794, heightPx: 1123, cssPageSize: 'A4', pdfFormat: 'A4' },
  /** US Letter: 8.5in x 11in @ 96dpi. */
  letter: {
    widthPx: 816,
    heightPx: 1056,
    cssPageSize: 'letter',
    pdfFormat: 'Letter',
  },
}

/** A4 paper dimensions at 96 dpi. Kept as the default/back-compat export. */
export const Paper = {
  ...PAPER_SIZES.a4,
  /** Default uniform margin on all four sides. */
  marginPx: 40,
} as const

/** CSS padding value for the paper content inset. */
export function paperPaddingCss(marginPx = Paper.marginPx): string {
  return `${marginPx}px`
}

/** Inline styles for a paper sheet at the given size (border-box). */
export function paperSheetStyle(
  marginPx = Paper.marginPx,
  paperSize: PaperSizeId = DEFAULT_PAPER_SIZE,
): {
  width: number
  height: number
  minHeight: number
  padding: string
  boxSizing: 'border-box'
} {
  const { widthPx, heightPx } = PAPER_SIZES[paperSize]
  return {
    width: widthPx,
    height: heightPx,
    minHeight: heightPx,
    padding: paperPaddingCss(marginPx),
    boxSizing: 'border-box',
  }
}

/** Vertical gap between resume sections (and after the header). */
export const SectionSpacing = 9

export function usablePageHeight(
  marginPx = Paper.marginPx,
  paperSize: PaperSizeId = DEFAULT_PAPER_SIZE,
): number {
  return PAPER_SIZES[paperSize].heightPx - marginPx * 2
}
