import type { RenderEntry } from '../../../models/render-model'
import { formatDate } from '../format-date'
import { inlineMdProps } from '../inline-md'
import { useLayoutTokensContext } from '../../layout/LayoutOptionsContext'

/**
 * Combines an entry's structured fields into one Tech-Compact title line:
 * Work -> "**Company**, Location (_Position_)", Projects -> "**Name**: tagline",
 * Education -> just "**Institution**" (degree/area/GPA render on their own row below).
 */
function composeTitleLine(entry: RenderEntry): string {
  switch (entry.kind) {
    case 'work': {
      const location = entry.location ? `, ${entry.location}` : ''
      return `**${entry.title}**${location} (_${entry.position}_)`
    }
    case 'project':
      return entry.description
        ? `**${entry.title}**: ${entry.description}`
        : `**${entry.title}**`
    case 'education':
      return `**${entry.title}**`
  }
}

/** Tech-Compact entry head: combined bold/italic title line, GPA right-aligned for education. */
export function TechCompactEntryHead({
  entry,
  lang,
}: {
  entry: RenderEntry
  lang: string
}) {
  const { font, lineHeight, spacing, colors } = useLayoutTokensContext()
  const displayStart = formatDate(entry.startDate, lang)
  const displayEnd = entry.endDate ? formatDate(entry.endDate, lang) : undefined

  return (
    <div style={{ marginBottom: spacing.entryHeadMarginBottom }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <span
          className="md-inline"
          style={{
            fontSize: font.entryTitle,
            color: colors.entry,
            lineHeight: lineHeight.entry,
          }}
          {...inlineMdProps(composeTitleLine(entry))}
        />
        <span
          style={{
            fontSize: font.entryDate,
            fontWeight: 700,
            color: colors.subtle,
            whiteSpace: 'nowrap',
            flexShrink: 0,
            lineHeight: lineHeight.entry,
          }}
        >
          {displayStart}
          {displayEnd ? ` – ${displayEnd}` : ''}
        </span>
      </div>
      {entry.kind === 'education' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 8,
            marginTop: spacing.entrySubMarginTop,
          }}
        >
          <span
            style={{
              fontSize: font.entrySub,
              color: colors.meta,
              fontStyle: 'italic',
              lineHeight: lineHeight.entry,
            }}
          >
            {entry.degree} · {entry.area}
          </span>
          {entry.gpa && (
            <span
              style={{
                fontSize: font.entrySub,
                fontWeight: 700,
                color: colors.meta,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                lineHeight: lineHeight.entry,
              }}
            >
              GPA: {entry.gpa}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
