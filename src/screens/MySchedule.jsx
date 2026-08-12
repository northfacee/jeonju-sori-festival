import { COURSES } from '../data/courses.js'
import BottomNav from '../components/BottomNav.jsx'

const MAIN_COURSE_ID = 'hanok-sori'
const SAVED_IDS = ['deokjin-fringe', 'family-street']

export default function MySchedule() {
  const course = COURSES.find((c) => c.id === MAIN_COURSE_ID)
  const savedCourses = SAVED_IDS.map((id) => COURSES.find((c) => c.id === id))

  const nowIndex = course.stops.findIndex((s) => s.name.includes('쇼팽'))
  const doneCount = nowIndex
  const pct = Math.round((doneCount / course.stops.length) * 100)
  const next = course.stops[nowIndex]

  return (
    <div className="screen">
      <div className="home-header">
        <div className="home-header-row">
          <div className="home-title">내 일정</div>
        </div>
      </div>

      <div className="screen-body">
        <div className="next-card">
          <div className="next-tag">
            <span className="next-tag-dot" />
            <span className="next-tag-label">오늘의 다음 일정 · {course.dateLabel}</span>
          </div>
          <div className="next-name">{next.name}</div>
          <div className="next-meta">
            {next.venue.name}
            {next.hall ? ` · ${next.hall}` : ''} · {next.time}–{next.timeEnd}
          </div>
          <div className="next-actions">
            <button className="btn-mid-primary">길찾기 시작</button>
            <button className="btn-mid-white">일정 알림 끄기</button>
          </div>
        </div>

        <div className="section-head">
          <div className="section-title">오늘 진행률</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#3366ff' }}>
            {doneCount} / {course.stops.length} 완료
          </div>
        </div>
        <div className="progress-card">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-list">
            {course.stops.map((s, i) => {
              const done = i < nowIndex
              const now = i === nowIndex
              return (
                <div key={s.name} className="progress-row">
                  <div
                    className="progress-dot"
                    style={{
                      background: done ? '#00bf40' : now ? '#3366ff' : 'transparent',
                      border: done || now ? 'none' : '1.5px solid rgba(112,115,124,0.22)',
                      color: done || now ? '#fff' : 'transparent',
                    }}
                  >
                    {done ? '✓' : now ? '·' : ''}
                  </div>
                  <div
                    className="progress-name"
                    style={{
                      color: done ? 'rgba(55,56,60,0.61)' : '#171717',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {s.name}
                  </div>
                  <div className="progress-time">{s.time}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="section-title" style={{ marginBottom: 12 }}>
          저장한 코스
        </div>
        <div className="list-col">
          {savedCourses.map((s) => (
            <button key={s.id} className="saved-row">
              <div className="feed-main">
                <div className="saved-name">{s.name}</div>
                <div className="saved-meta">
                  {s.dateLabel} · {s.summary}
                </div>
              </div>
              <div className="saved-chevron">›</div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
