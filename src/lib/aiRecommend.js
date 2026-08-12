export async function fetchAiCourse(answers) {
  const res = await fetch('/api/build-course', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `코스 생성 서버 오류 (${res.status})`)
  }
  return res.json() // { title, reason, stops }
}
