import { ICONS, EMOJI_TO_ICON } from './icons'

const SIZES = { xxs: 18, xs: 20, sm: 24, md: 28, lg: 32, xl: 40, xxl: 64 }

function resolveSize(size) {
  if (typeof size === 'number') return size
  return SIZES[size] ?? SIZES.md
}

export function Icon({ name, size = 'md', strokeWidth = 2, style, ...props }) {
  const px = resolveSize(size)
  const iconKey = ICONS[name] ? name : EMOJI_TO_ICON[name]
  const Component = iconKey ? ICONS[iconKey] : null

  if (!Component) {
    return <span style={{ fontSize: px, lineHeight: 1, ...style }}>{name}</span>
  }

  return (
    <Component
      width={px}
      height={px}
      strokeWidth={strokeWidth}
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...props}
    />
  )
}
