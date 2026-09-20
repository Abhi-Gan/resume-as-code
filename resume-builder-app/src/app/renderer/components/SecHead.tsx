import { useLayoutTokensContext } from '../../layout/LayoutOptionsContext'

/** Full-width section divider with label. */
export function SecHead({ title }: { title: string }) {
  const { font, lineHeight, spacing, colors, letterSpacing } =
    useLayoutTokensContext()

  return (
    <div
      className="sec-head"
      style={{ marginBottom: spacing.secHeadMarginBottom }}
    >
      <p
        style={{
          fontSize: font.sectionHead,
          fontWeight: 700,
          letterSpacing: letterSpacing.sectionHead,
          textTransform: 'uppercase',
          color: colors.sectionHead,
          lineHeight: lineHeight.sectionHead,
        }}
      >
        {title}
      </p>
      <div
        style={{
          height: 1,
          backgroundColor: colors.rule,
          marginTop: spacing.secHeadRuleMarginTop,
        }}
      />
    </div>
  )
}
