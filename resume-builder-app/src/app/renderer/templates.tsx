import type { ReactNode } from 'react'
import type { TemplateId, RenderEntry } from '../../models/render-model'
import { JakeHeader, type HeaderProps } from './components/JakeHeader'
import { TechCompactHeader } from './components/TechCompactHeader'
import { EntryHead } from './components/EntryHead'
import { TechCompactEntryHead } from './components/TechCompactEntryHead'
import { Keywords } from './components/Keywords'

export type { HeaderProps }

type HeaderComponent = (props: HeaderProps) => ReactNode

export interface TemplateDefinition {
  Header: HeaderComponent
  renderEntryHead(entry: RenderEntry, lang: string): ReactNode
  getEntryBullets(entry: RenderEntry): string[]
  renderEntryKeywords(entry: RenderEntry): ReactNode | null
}

/**
 * Fields with a genuinely neutral default that both templates want unless
 * they explicitly override it. `renderEntryHead` isn't here — jake and
 * techCompact each need their own composition, neither is "more default"
 * than the other, so both specify it explicitly (no sibling derives from
 * the other, per the earlier discussion).
 */
const TEMPLATE_SHARED_DEFAULTS = {
  getEntryBullets: (entry: RenderEntry): string[] => entry.bullets,
  renderEntryKeywords: (entry: RenderEntry): ReactNode | null =>
    'keywords' in entry && entry.keywords.length > 0 ? (
      <Keywords items={entry.keywords} />
    ) : null,
}

const jakeTemplate: TemplateDefinition = {
  ...TEMPLATE_SHARED_DEFAULTS,
  Header: JakeHeader,
  renderEntryHead: (entry, lang) => {
    const sub =
      entry.kind === 'work'
        ? entry.position
        : entry.kind === 'education'
          ? `${entry.degree} · ${entry.area}`
          : (entry.description ?? '')
    return (
      <EntryHead
        title={entry.title}
        sub={sub}
        start={entry.startDate}
        end={entry.endDate}
        lang={lang}
      />
    )
  },
}

const techCompactTemplate: TemplateDefinition = {
  ...TEMPLATE_SHARED_DEFAULTS,
  Header: TechCompactHeader,
  renderEntryHead: (entry, lang) => (
    <TechCompactEntryHead entry={entry} lang={lang} />
  ),
  getEntryBullets: (entry) =>
    'keywords' in entry && entry.keywords.length > 0
      ? [`*${entry.keywords.join(', ')}*`, ...entry.bullets]
      : entry.bullets,
  // Folded into the first bullet above — never a separate line for this template.
  renderEntryKeywords: () => null,
}

/**
 * Per-template registry: the single place that maps a TemplateId to its
 * complete rendering behavior. Adding a template means adding one entry
 * here — Record<TemplateId, V> forces every id to be accounted for, so a
 * missing entry is a compile error, not a silent fallback.
 */
export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  jake: jakeTemplate,
  techCompact: techCompactTemplate,
}
