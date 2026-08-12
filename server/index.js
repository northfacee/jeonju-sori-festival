try {
  process.loadEnvFile()
} catch {
  // .env가 없으면 무시 — 배포 환경에선 플랫폼이 직접 env를 주입함
}

import express from 'express'
import { buildCourse } from './lib/buildCourse.js'

const PORT = process.env.PORT || 8787

const app = express()
app.use(express.json())

app.post('/api/build-course', async (req, res) => {
  try {
    const result = await buildCourse(req.body?.answers)
    res.json(result)
  } catch (err) {
    console.error('[build-course] failed:', err)
    res.status(err.status || 500).json({ error: err.message || '코스 생성에 실패했습니다.' })
  }
})

app.listen(PORT, () => {
  console.log(`AI trip builder listening on http://localhost:${PORT}`)
})
