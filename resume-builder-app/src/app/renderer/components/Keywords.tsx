import { useLayoutTokensContext } from '../../layout/LayoutOptionsContext'

/** Inline keyword list separated by middle-dots. */
export function Keywords({ items }: { items: string[] }) {
  const { font, lineHeight, spacing, colors } = useLayoutTokensContext()

  if (!items.length) return null
  return (
    <p
      style={{
        fontSize: font.keyword,
        color: colors.subtle,
        paddingTop: spacing.keywordPaddingTop,
        lineHeight: lineHeight.keyword,
      }}
    >
      {items.join(' · ')}
    </p>
  )
}
