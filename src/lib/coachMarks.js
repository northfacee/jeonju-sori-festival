// 코치마크를 다시 보여줄지 정하는 곳.
//
// 시범 단계라 페이지에 들어올 때마다 안내가 뜨게 해뒀다. 정식 배포 때는
// 아래를 false로 바꾸면 "한 번 본 안내는 다시 안 뜬다"로 돌아간다.
// (이미 아는 기능을 매번 가리면 성가시므로 그때는 false가 맞다.)
const SHOW_EVERY_TIME = true

const PREFIX = 'jeonju-coach:'

export function isCoachSeen(key) {
  if (SHOW_EVERY_TIME) return false
  try {
    return localStorage.getItem(PREFIX + key) === '1'
  } catch {
    // 저장소를 못 읽으면 매번 뜨는 게 더 성가시므로 "이미 봤다"로 친다.
    return true
  }
}

export function markCoachSeen(key) {
  if (SHOW_EVERY_TIME) return
  try {
    localStorage.setItem(PREFIX + key, '1')
  } catch {
    // 저장 실패는 무시 — 다음에 한 번 더 보일 뿐이다.
  }
}
