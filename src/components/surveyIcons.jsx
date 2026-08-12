const PATHS = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  sunrise: (
    <>
      <path d="M12 4v4" />
      <path d="M5.6 9.6l1.4 1.4M18.4 9.6l-1.4 1.4M2.5 16h3M18.5 16h3" />
      <path d="M6 16a6 6 0 0 1 12 0" />
      <path d="M2.5 20h19" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18v2.5M21 18v2.5M3 13h18" />
      <path d="M7 13v-1.5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V13" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17.5" cy="9.2" r="2.4" />
      <path d="M15.2 13a5 5 0 0 1 5.8 4.6" />
    </>
  ),
  heart: <path d="M12 20 4.6 13.1a5 5 0 0 1 7-7.1L12 6.4l.4-.4a5 5 0 0 1 7 7.1Z" />,
  family: (
    <>
      <circle cx="8" cy="7" r="2.6" />
      <circle cx="16" cy="7" r="2.6" />
      <circle cx="12" cy="15.6" r="1.8" />
      <path d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0" />
    </>
  ),
  walk: (
    <>
      <circle cx="14.2" cy="4.4" r="1.6" />
      <path d="M12 8l-3 3 1 6M12 8l3 2 2 5M9 11l-3 2M13 10l1.5 3-3 3" />
    </>
  ),
  bus: (
    <>
      <rect x="3" y="5" width="18" height="11" rx="2" />
      <path d="M3 10h18" />
      <circle cx="7.5" cy="18" r="1.4" />
      <circle cx="16.5" cy="18" r="1.4" />
    </>
  ),
  car: (
    <>
      <path d="M4 16 5.5 10.5a2 2 0 0 1 2-1.5h9a2 2 0 0 1 2 1.5L20 16" />
      <rect x="2.5" y="16" width="19" height="3.5" rx="1.5" />
      <circle cx="7" cy="19.5" r="1.3" />
      <circle cx="17" cy="19.5" r="1.3" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.3a2.5 2.5 0 0 1 5 0c0 1.4-1.1 2-2.5 2.5s-2.5 1.1-2.5 2.5a2.5 2.5 0 0 0 5 0" />
    </>
  ),
  scale: <path d="M12 3v18M6 7h12M4 7l2.5 5a2.5 2.5 0 0 1-5 0Zm14 0l2.5 5a2.5 2.5 0 0 1-5 0Z" />,
  gift: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="1.5" />
      <path d="M3 13h18M12 9v12" />
      <path d="M12 9c-2-3-6-3-6-.5S9 9 12 9Zm0 0c2-3 6-3 6-.5S15 9 12 9Z" />
    </>
  ),
}

export function QuestionIcon({ name, size = 22, stroke = '#171717' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  )
}
