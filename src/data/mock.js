export const TAB_ICONS = {
  home: 'M4 11 L12 4 l8 7 v8 a1 1 0 0 1 -1 1 h-14 a1 1 0 0 1 -1 -1 Z',
  map: 'M9 3 L3 6 v15 l6 -3 6 3 6 -3 V3 l-6 3 Z M9 3 v15 M15 6 v15',
  me: 'M12 11 a4 4 0 1 0 .01 0 M5 21 a7 7 0 0 1 14 0',
}

export const NAV_TABS = [
  { key: 'home', label: '홈', icon: TAB_ICONS.home, path: '/' },
  { key: 'course', label: '추천코스', icon: TAB_ICONS.map, path: '/results' },
  { key: 'schedule', label: '내 일정', icon: TAB_ICONS.me, path: '/schedule' },
]

