import { useState, useEffect } from 'react'
import { Icon } from '@iconify-icon/react'
import { resolveSocialIcon, type IconifyIconData } from '../social-icon-map'

/** Lazily loads a Font Awesome Brands icon by network name and renders it inline. */
export function SocialIcon({ network }: { network: string }) {
  const [icon, setIcon] = useState<IconifyIconData | null>(null)

  useEffect(() => {
    let cancelled = false
    resolveSocialIcon(network).then((mod) => {
      if (!cancelled && mod) setIcon(mod)
    })
    return () => {
      cancelled = true
    }
  }, [network])

  if (!icon) return null

  return <Icon icon={icon} style={{ width: 10, height: 10, flexShrink: 0 }} />
}
