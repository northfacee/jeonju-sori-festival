export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="rgba(55,56,60,0.61)" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16 l4 4" />
    </svg>
  )
}

export function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="rgba(55,56,60,0.61)" strokeWidth="2" strokeLinecap="round">
      <path d="M7 16 v-5 a5 5 0 0 1 10 0 v5 l1.5 2 H5.5 Z" />
      <path d="M10 20 a2 2 0 0 0 4 0" />
    </svg>
  )
}


export function DiscountIcon({ size = 28, stroke = '#ff5e00' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 11 a9 9 0 1 0 .01 0 M20 15 v10 M23.5 17.5 q-3.5 -2 -6 0 t 3 4 t 3 4 t -6 0" />
    </svg>
  )
}

export function FeedGlyph({ path, size = 26, stroke }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

export function TabGlyph({ path, size = 24, stroke }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}
