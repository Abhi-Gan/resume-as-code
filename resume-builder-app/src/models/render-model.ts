/**
 * Normalized render model — the single input contract for the resume renderer.
 * Both new-schema YAML and legacy yamlresume-style YAML must compile into this
 * model before preview or export. No legacy assumptions leak past this boundary.
 */

// ── Header ──────────────────────────────────────────────────────────────────

export interface RenderSocialLink {
  label: string
  url: string
}

export interface RenderHeader {
  name: string
  headline: string
  contactLine1: string
  contactLine2: string
  /** Candidate location (e.g. "Palo Alto, CA"), empty string if unset. */
  location: string
  summary: string[]
  socialLinks: RenderSocialLink[]
}

// ── Section Variants ────────────────────────────────────────────────────────

/**
 * Entry kinds are a discriminated union, not one generic shape — Work,
 * Education, and Project items are genuinely different in the schema
 * (position/location vs. degree/area/gpa vs. description), and that
 * distinction needs to survive to the renderer so template-specific
 * decisions (GPA placement, combined title lines) have real data to work
 * with instead of pre-baked strings. See models/render-model.ts's own
 * history in the tech-compact-template branch for the full rationale.
 */
export interface RenderWorkEntry {
  kind: 'work'
  id: string
  /** Company name — never pre-combined with location/position. */
  title: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  bullets: string[]
  keywords: string[]
}

export interface RenderEducationEntry {
  kind: 'education'
  id: string
  /** Institution name. */
  title: string
  degree: string
  area: string
  gpa?: string
  startDate: string
  endDate?: string
  bullets: string[]
}

export interface RenderProjectEntry {
  kind: 'project'
  id: string
  /** Project name. */
  title: string
  /** Tagline source — combined with title for Tech-Compact, shown separately for Jake. */
  description?: string
  startDate: string
  endDate?: string
  bullets: string[]
  keywords: string[]
}

export type RenderEntry =
  | RenderWorkEntry
  | RenderEducationEntry
  | RenderProjectEntry

export interface RenderSkill {
  id: string
  name: string
  level: string
  keywords: string[]
}

export interface RenderCertificate {
  id: string
  name: string
  issuer: string
  date: string
}

export interface RenderAward {
  id: string
  name: string
  awarder: string
  date: string
  bullets: string[]
}

export interface RenderLabelRow {
  id: string
  label: string
  value: string
}

/**
 * Section wrappers are discriminated by `kind` too, not just their entries —
 * this is the stronger guarantee: a WorkSection's `entries` can only ever
 * type-check as RenderWorkEntry[], so the compiler can't accidentally
 * cross-wire an Education entry into a Work section.
 */
export interface WorkSection {
  id: string
  title: string
  variant: 'entries'
  kind: 'work'
  entries: RenderWorkEntry[]
}

export interface EducationSection {
  id: string
  title: string
  variant: 'entries'
  kind: 'education'
  entries: RenderEducationEntry[]
}

export interface ProjectsSection {
  id: string
  title: string
  variant: 'entries'
  kind: 'project'
  entries: RenderProjectEntry[]
}

export interface SkillsSection {
  id: string
  title: string
  variant: 'skills'
  skills: RenderSkill[]
}

export interface CertificatesSection {
  id: string
  title: string
  variant: 'certificates'
  certificates: RenderCertificate[]
}

export interface LangAndInterestsSection {
  id: string
  title: string
  variant: 'langAndInterests'
  rows: RenderLabelRow[]
}

export interface AwardsSection {
  id: string
  title: string
  variant: 'awards'
  awards: RenderAward[]
}

export type RenderSection =
  | WorkSection
  | EducationSection
  | ProjectsSection
  | SkillsSection
  | CertificatesSection
  | LangAndInterestsSection
  | AwardsSection

// ── Root Model ──────────────────────────────────────────────────────────────

/** Physical paper size, shared by the schema, compiler, and renderer layers. */
export type PaperSizeId = 'a4' | 'letter'

/** Fallback used whenever a paper size is absent or fails validation. */
export const DEFAULT_PAPER_SIZE: PaperSizeId = 'a4'

/** tracks the valid paper size IDs for runtime validation; see PAPER_SIZE_IDS below */
const PAPER_SIZE_ID_WITNESS: Record<PaperSizeId, true> = {
  a4: true,
  letter: true,
}

/** Runtime-checkable list of every valid PaperSizeId, for input validation. */
export const PAPER_SIZE_IDS = Object.keys(
  PAPER_SIZE_ID_WITNESS,
) as PaperSizeId[]

/** Resume template/layout variant, shared by the schema, compiler, and renderer layers. */
export type TemplateId = 'jake' | 'techCompact'

/** Fallback used whenever a template id is absent or fails validation. */
export const DEFAULT_TEMPLATE_ID: TemplateId = 'jake'

/** tracks the valid template IDs for runtime validation; see TEMPLATE_IDS below */
const TEMPLATE_ID_WITNESS: Record<TemplateId, true> = {
  jake: true,
  techCompact: true,
}

/** Runtime-checkable list of every valid TemplateId, for input validation. */
export const TEMPLATE_IDS = Object.keys(TEMPLATE_ID_WITNESS) as TemplateId[]

export interface RenderModel {
  /** BCP 47 language tag (e.g. 'en', 'zh-hans', 'zh', 'es', 'fr', 'no') */
  lang: string
  /** Optional document title from YAML `document.title` */
  documentTitle?: string
  /** Physical paper size from YAML `layout.page.size`, defaults to 'a4' at the compiler boundary. */
  paperSize: PaperSizeId
  /** Template/layout variant from YAML `layout.template`, defaults to 'jake' at the compiler boundary. */
  templateId: TemplateId
  header: RenderHeader
  sections: RenderSection[]
}
