// 코치마크는 한 번 보고 나면 다시 띄우지 않는다.
const PREFIX = 'jeonju-coach:'

export function isCoachSeen(key) {
  try {
    return localStorage.getItem(PREFIX + key) === '1'
  } catch {
    // 저장소를 못 읽으면 매번 뜨는 게 더 성가시므로 "이미 봤다"로 친다.
    return true
  }
}

export function markCoachSeen(key) {
  try {
    localStorage.setItem(PREFIX + key, '1')
  } catch {
    // 저장 실패는 무시 — 다음에 한 번 더 보일 뿐이다.
  }
}
