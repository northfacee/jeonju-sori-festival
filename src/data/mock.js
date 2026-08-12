export const TAB_ICONS = {
  home: 'M4 11 L12 4 l8 7 v8 a1 1 0 0 1 -1 1 h-14 a1 1 0 0 1 -1 -1 Z',
  map: 'M9 3 L3 6 v15 l6 -3 6 3 6 -3 V3 l-6 3 Z M9 3 v15 M15 6 v15',
  ticket: 'M4 8 h16 v3 a2 2 0 0 0 0 4 v3 H4 v-3 a2 2 0 0 0 0 -4 Z M12 8 v11',
  me: 'M12 11 a4 4 0 1 0 .01 0 M5 21 a7 7 0 0 1 14 0',
}

export const NAV_TABS = [
  { key: 'home', label: '홈', icon: TAB_ICONS.home, path: '/' },
  { key: 'course', label: '코스', icon: TAB_ICONS.map, path: '/results' },
  { key: 'ticket', label: '티켓', icon: TAB_ICONS.ticket, path: '/ticket' },
  { key: 'schedule', label: '내 일정', icon: TAB_ICONS.me, path: '/schedule' },
]

// 2026 전주세계소리축제가 실제로 밝힌 8개 프로그램 분야 중 이 앱에서 다루는 항목만 추림
export const CHIP_LABELS = ['전체', '판소리', '월드뮤직', '프린지', '가족']

// 장식용 QR 패턴(실제 예매 정보가 아닌 화면 목업용 픽셀 그리드)
const QR_SEED = 'sorifestival-2026-myeoingin-chopin-arirang'

export function buildQrCells() {
  return Array.from({ length: 81 }, (_, i) => {
    const r = Math.floor(i / 9)
    const c = i % 9
    const corner = (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3)
    const ring = corner && (r % 3 === 0 || c % 3 === 0 || (r === 1 && c === 1) || (r === 1 && c === 7) || (r === 7 && c === 1))
    return corner ? ring : QR_SEED.charCodeAt(i % QR_SEED.length) % 2 === 0
  })
}
