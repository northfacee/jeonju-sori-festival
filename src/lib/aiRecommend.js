export async function fetchAiCourse(answers, festival) {
  const res = await fetch('/api/build-course', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // festival을 안 보내면 서버가 소리축제로 짠다(기존 동작 그대로).
    body: JSON.stringify({ answers, festival }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `코스 생성 서버 오류 (${res.status})`)
  }
  return res.json() // { title, reason, stops }
}
