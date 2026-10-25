import type { ReactNode } from 'react'
import type { ItemId } from '../game/types'

const Svg = ({ children, size = 24, vb = '0 0 24 24' }: { children: ReactNode; size?: number; vb?: string }) => (
  <svg width={size} height={size} viewBox={vb} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
    {children}
  </svg>
)

const HEART = 'M12 21.3 3.6 13.2C1.2 10.9 1.2 7 3.6 4.9c2.2-1.9 5.4-1.6 7.3.6L12 6.7l1.1-1.2c1.9-2.2 5.1-2.5 7.3-.6 2.4 2.1 2.4 6 0 8.3Z'

/** A heart filled by 0–4 quarters, drawn as a pie like the original. */
export function Heart({ quarters, size = 22 }: { quarters: number; size?: number }) {
  const id = `h${quarters}`
  const angle = (quarters / 4) * Math.PI * 2
  const x = 12 + 14 * Math.sin(angle)
  const y = 12 - 14 * Math.cos(angle)
  const pie =
    quarters >= 4 ? 'M-4-4H28V28H-4Z' : quarters <= 0 ? '' : `M12 12 12 -2 A14 14 0 ${quarters > 2 ? 1 : 0} 1 ${x} ${y}Z`
  return (
    <Svg size={size}>
      <defs>
        <clipPath id={id}>
          <path d={pie} />
        </clipPath>
      </defs>
      <path d={HEART} fill="#3a0d10" stroke="#f7e7c6" strokeWidth="1.3" />
      <path d={HEART} fill="#e8303a" clipPath={`url(#${id})`} />
      {quarters > 0 && <path d="M6 7.2c1-1.2 2.6-1.4 3.6-.6" stroke="#ffb3b3" strokeWidth="1.4" fill="none" strokeLinecap="round" clipPath={`url(#${id})`} />}
    </Svg>
  )
}

export const RUPEE_COLORS = { green: '#3ccf5a', blue: '#3a7bf0', red: '#ef3b3b', purple: '#a34ee8', gold: '#f2c94c' }

export function Rupee({ color = 'green', size = 22 }: { color?: keyof typeof RUPEE_COLORS; size?: number }) {
  const c = RUPEE_COLORS[color]
  return (
    <Svg size={size}>
      <path d="M12 1 18 6v12l-6 5-6-5V6Z" fill={c} stroke="#0b1a10" strokeWidth="1" />
      <path d="M12 4.5 15 7v10l-3 2.5L9 17V7Z" fill="#fff" opacity=".35" />
      <path d="M12 1v3.5M6 6l3 1M18 6l-3 1" stroke="#fff" strokeWidth=".8" opacity=".6" />
    </Svg>
  )
}

export const PieceOfHeart = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d={HEART} fill="#3a0d10" stroke="#f7e7c6" strokeWidth="1" opacity=".5" />
    <path d="M12 12 12 6.7 13.1 5.5c1.9-2.2 5.1-2.5 7.3-.6 1.3 1.1 1.9 2.7 1.9 4.3L12 12Z" fill="#e8303a" stroke="#f7e7c6" strokeWidth="1" />
  </Svg>
)

export const HeartContainer = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d={HEART} fill="#e8303a" stroke="#f2c94c" strokeWidth="1.6" />
    <path d={HEART} fill="none" stroke="#fff" strokeWidth=".6" opacity=".6" transform="translate(12 12) scale(.7) translate(-12 -12)" />
    <path d="M6 7.2c1-1.2 2.6-1.4 3.6-.6" stroke="#ffd0d0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </Svg>
)

export const SmallKey = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="6" r="4" fill="none" stroke="#c9ccd6" strokeWidth="2.2" />
    <path d="M12 10v12M12 17h4M12 20.5h3" stroke="#c9ccd6" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
)

export const BossKey = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 1.5 16 5l-4 4-4-4Z" fill="#f2c94c" stroke="#8a6410" strokeWidth=".8" />
    <circle cx="12" cy="5" r="1.4" fill="#e8303a" />
    <path d="M12 9v13M12 15h5M12 19h4" stroke="#f2c94c" strokeWidth="2.6" strokeLinecap="round" />
  </Svg>
)

export const DungeonMap = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M3 5 9 3l6 2 6-2v16l-6 2-6-2-6 2Z" fill="#e9d8a6" stroke="#7a5a2a" strokeWidth="1" />
    <path d="M9 3v16M15 5v16" stroke="#7a5a2a" strokeWidth=".8" />
    <path d="M5 13h3v-3h4v5h5" stroke="#b03030" strokeWidth="1.2" fill="none" />
  </Svg>
)

export const Compass = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9.5" fill="#2f4a8a" stroke="#f2c94c" strokeWidth="2" />
    <path d="M12 4.5 14 12h-4Z" fill="#e8303a" />
    <path d="M12 19.5 10 12h4Z" fill="#e6e6e6" />
    <circle cx="12" cy="12" r="1.3" fill="#f2c94c" />
  </Svg>
)

export const SkulltulaToken = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 2 20 7v10l-8 5-8-5V7Z" fill="#f2c94c" stroke="#8a6410" strokeWidth="1" />
    <circle cx="12" cy="11" r="4.2" fill="#8a6410" />
    <circle cx="10.4" cy="10.4" r="1" fill="#f2c94c" />
    <circle cx="13.6" cy="10.4" r="1" fill="#f2c94c" />
    <path d="M7 8 9 10M17 8l-2 2M7 15l2-2M17 15l-2-2" stroke="#8a6410" strokeWidth="1.2" />
  </Svg>
)

const Sword = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M18.5 2.5 21.5 5.5 9 18 6 15Z" fill="#dfe6ee" stroke="#6a7a8a" strokeWidth=".8" />
    <path d="M4 13l7 7M5.5 18.5 3 21" stroke="#7a4a22" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M4 13l7 7" stroke="#3c7a3a" strokeWidth="2.6" strokeLinecap="round" />
  </Svg>
)

const Shield = ({ size = 48 }: { size?: number }) => (
  <Svg size={size}>
    <path d="M12 2c3 1.5 6 2 8 2v8c0 5-4 8.5-8 10-4-1.5-8-5-8-10V4c2 0 5-.5 8-2Z" fill="#8a5a2a" stroke="#3a220e" strokeWidth="1.2" />
    <path d="M12 6v12M7 10h10" stroke="#3a220e" strokeWidth="1" opacity=".5" />
    <circle cx="12" cy="11" r="2.6" fill="#c0392b" />
  </Svg>
)

const Stone = ({ size = 48, color, accent }: { size?: number; color: string; accent: string }) => (
  <Svg size={size}>
    <path d="M12 3 18 9 12 21 6 9Z" fill={color} stroke={accent} strokeWidth="1" />
    <path d="M12 3 14 9 12 21 10 9Z" fill="#fff" opacity=".25" />
    <path d="M5 8c2-3 12-3 14 0" stroke="#f2c94c" strokeWidth="1.6" fill="none" />
  </Svg>
)

const Wallet = ({ size = 48, color }: { size?: number; color: string }) => (
  <Svg size={size}>
    <path d="M6 7c-1 4-1 9 1 13h10c2-4 2-9 1-13Z" fill={color} stroke="#3a220e" strokeWidth="1" />
    <path d="M7 7c1-2 9-2 10 0M9 4.5c1 1 5 1 6 0" stroke="#3a220e" strokeWidth="1.2" fill="none" />
    <path d="M12 11l2 2-2 3-2-3Z" fill="#3ccf5a" />
  </Svg>
)

export function ItemIcon({ item, size = 48 }: { item: ItemId; size?: number }) {
  switch (item) {
    case 'kokiri-sword': return <Sword size={size} />
    case 'deku-shield': return <Shield size={size} />
    case 'kokiri-emerald': return <Stone size={size} color="#2ec27e" accent="#0e5a36" />
    case 'goron-ruby': return <Stone size={size} color="#e8303a" accent="#6a0e12" />
    case 'zora-sapphire': return <Stone size={size} color="#3a7bf0" accent="#0e2a6a" />
    case 'adult-wallet': return <Wallet size={size} color="#c0392b" />
    case 'giant-wallet': return <Wallet size={size} color="#7a3ab0" />
  }
}

export const Fairy = ({ size = 22 }: { size?: number }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="6" fill="#bfe8ff" opacity=".35" />
    <circle cx="12" cy="12" r="3.4" fill="#fff" />
    <path d="M12 11c-3-5-8-4-8-1s5 3 8 1ZM12 11c3-5 8-4 8-1s-5 3-8 1Z" fill="#d8f2ff" opacity=".8" />
  </Svg>
)
