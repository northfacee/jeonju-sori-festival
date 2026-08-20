// 코스를 카카오톡으로 공유한다.
//
// 카카오 SDK 공유는 지도와 마찬가지로 developers.kakao.com에 도메인이 등록돼 있어야
// 동작한다. 아직 등록 안 된 도메인에서도 버튼이 먹통이 되면 안 되므로, 안 되면
// 기기 공유 시트로, 그것도 없으면 링크 복사로 차례차례 내려간다.
//
// 중요: 누른 순간에 기다리면 안 된다. 공유 시트와 클립보드는 "사용자가 방금 눌렀다"는
// 자격이 있어야 열리는데, SDK를 내려받는 동안 그 자격이 만료돼 둘 다 막힌다.
// 그래서 SDK는 화면에 들어올 때 미리 받아두고, 누른 순간에는 이미 있는 것만 쓴다.

const SDK_SRC = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js'
// 지도와 같은 JavaScript 앱 키를 쓴다.
const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

let loading = null

export function preloadKakaoShare() {
  if (!APP_KEY || window.Kakao || loading) return
  loading = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    script.onload = () => {
      try {
        if (!window.Kakao.isInitialized()) window.Kakao.init(APP_KEY)
      } catch {
        // 초기화 실패하면 그냥 다른 방법으로 공유한다.
      }
      resolve()
    }
    script.onerror = resolve
    document.head.appendChild(script)
  })
}

// 받는 사람이 링크만 눌러서는 남의 일정을 볼 수 없다(코스는 각자 기기에만 저장된다).
// 그래서 코스 내용 자체를 글로 담아 보낸다.
export function courseAsText(course) {
  const lines = course.stops.map((stop, i) => {
    const time = stop.time ? `${stop.time} ` : ''
    return `${i + 1}. ${time}${stop.name}`
  })
  return [course.name, course.dateLabel, '', ...lines].join('\n')
}

export function shareCourse(course) {
  const url = window.location.origin
  const text = courseAsText(course)
  const summary = `${course.dateLabel} · 정류지 ${course.stops.length}곳`

  // 1) 카카오톡으로 바로 보내기 — 미리 받아둔 SDK가 준비됐을 때만.
  const Kakao = window.Kakao
  if (Kakao?.isInitialized?.()) {
    try {
      Kakao.Share.sendDefault({
        objectType: 'text',
        text: `${text}\n\n${summary}`,
        link: { mobileWebUrl: url, webUrl: url },
      })
      return Promise.resolve('kakao')
    } catch {
      // 아래 방법으로 넘어간다.
    }
  }

  // 2) 기기 공유 시트 (여기에도 카카오톡이 뜬다)
  if (navigator.share) {
    return navigator
      .share({ title: course.name, text, url })
      .then(() => 'system')
      // 사용자가 시트를 그냥 닫은 경우는 실패가 아니다.
      .catch((err) => (err?.name === 'AbortError' ? 'cancelled' : copyToClipboard(text, url)))
  }

  // 3) 마지막 수단 — 클립보드에 복사
  return copyToClipboard(text, url)
}

function copyToClipboard(text, url) {
  return navigator.clipboard
    .writeText(`${text}\n\n${url}`)
    .then(() => 'copied')
    .catch(() => 'failed')
}
