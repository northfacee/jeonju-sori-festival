import { buildCourse } from '../server/lib/buildCourse.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 지원합니다.' })
    return
  }
  try {
    const result = await buildCourse(req.body?.answers)
    res.status(200).json(result)
  } catch (err) {
    console.error('[build-course] failed:', err)
    res.status(err.status || 500).json({ error: err.message || '코스 생성에 실패했습니다.' })
  }
}
