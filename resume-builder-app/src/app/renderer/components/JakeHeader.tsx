import type { RenderHeader } from '../../../models/render-model'
import type { LayoutTokens } from '../../layout/use-layout-tokens'
import { inlineMdProps } from '../inline-md'
import { SocialIcon } from './SocialIcon'

export interface HeaderProps {
  header: RenderHeader
  tokens: LayoutTokens
  showSocialIcons: boolean
}

/** Default template: name + headline left, contact block right-aligned. */
export function JakeHeader({ header, tokens, showSocialIcons }: HeaderProps) {
  const { font, lineHeight, spacing, colors } = tokens
  return (
    <header key="header" className="paginate-block" style={{ marginBottom: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
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
              fontSize: font.headline,
              color: colors.meta,
              marginTop: spacing.headlineMarginTop,
              lineHeight: lineHeight.headline,
            }}
          >
            {header.headline}
          </p>
        </div>
        <div
          style={{
            textAlign: 'right',
            flexShrink: 1,
            paddingTop: spacing.contactPaddingTop,
            maxWidth: '50%',
          }}
        >
          <p
            style={{
              fontSize: font.contact,
              color: colors.meta,
              lineHeight: lineHeight.contact,
            }}
          >
            {header.contactLine1}
          </p>
          <p
            style={{
              fontSize: font.contact,
              color: colors.meta,
              lineHeight: lineHeight.contact,
              overflowWrap: 'break-word',
            }}
          >
            {header.socialLinks.map((link, i) => (
              <span key={link.label}>
                {i > 0 && ' · '}
                <a
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
                  {showSocialIcons && (
                    <SocialIcon network={link.label.split(':')[0]} />
                  )}
                  {link.label}
                </a>
              </span>
            ))}
          </p>
        </div>
      </div>
      {header.summary.length > 0 && (
        <div style={{ marginTop: spacing.summaryMarginTop }}>
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
