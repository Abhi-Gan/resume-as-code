import type { ReactNode } from 'react'
import { inlineMdProps } from '../inline-md'
import { SocialIcon } from './SocialIcon'
import type { HeaderProps } from './JakeHeader'

export type { HeaderProps }

/** Tech-Compact template: centered name, single centered contact line, no headline row. */
export function TechCompactHeader({
  header,
  tokens,
  showSocialIcons,
}: HeaderProps) {
  const { font, lineHeight, spacing, colors } = tokens

  const contactParts: ReactNode[] = []
  if (header.contactLine1) {
    contactParts.push(<span key="contact-main">{header.contactLine1}</span>)
  }
  for (const link of header.socialLinks) {
    contactParts.push(
      <a
        key={link.label}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: colors.meta,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {showSocialIcons && <SocialIcon network={link.label.split(':')[0]} />}
        {link.label}
      </a>,
    )
  }
  if (header.location) {
    contactParts.push(<span key="location">{header.location}</span>)
  }

  return (
    <header key="header" className="paginate-block" style={{ marginBottom: 0 }}>
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: font.name,
            fontWeight: 700,
            color: colors.name,
            letterSpacing: '-0.01em',
            lineHeight: lineHeight.name,
          }}
        >
          {header.name}
        </p>
        <p
          style={{
            fontSize: font.contact,
            color: colors.meta,
            lineHeight: lineHeight.contact,
            marginTop: spacing.headlineMarginTop,
          }}
        >
          {contactParts.map((part, i) => (
            <span key={i}>
              {i > 0 && ' | '}
              {part}
            </span>
          ))}
        </p>
      </div>
      {header.summary.length > 0 && (
        <div
          style={{ marginTop: spacing.summaryMarginTop, textAlign: 'center' }}
        >
          {header.summary.map((s, i) => (
            <p
              key={i}
              className="md-inline"
              style={{
                fontSize: font.summary,
                color: colors.meta,
                lineHeight: lineHeight.summary,
              }}
              {...inlineMdProps(s)}
            />
          ))}
        </div>
      )}
    </header>
  )
}
