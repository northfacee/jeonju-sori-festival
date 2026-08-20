import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { directionsUrl, nextStopOf, progressOf, stopKey } from '../data/schedule.js'
import BottomNav from '../components/BottomNav.jsx'

export default function MySchedule() {
  const navigate = useNavigate()
  const { schedule, removeCourse, toggleStopDone, toggleAlarm, setActiveCourse } = useAppState()
  const { courses, doneStopKeys, alarmOffCourseIds, activeCourseId } = schedule

  const active = courses.find((c) => c.id === activeCourseId) || courses[0] || null

  if (!active) {
    return (
      <div className="screen">
        <div className="home-header">
          <div className="home-header-row">
            <div className="home-title">내 일정</div>
          </div>
        </div>
        <div className="screen-body">
          <div className="empty-state">
            <div className="empty-title">아직 저장한 일정이 없어요</div>
            <div className="empty-desc">AI 코스를 만들고 "내 일정에 저장"을 누르면 여기에 쌓여요.</div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/survey/1')}>
              AI 코스 만들러 가기
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  const { done, total, pct } = progressOf(active, doneStopKeys)
  const next = nextStopOf(active, doneStopKeys)
  const alarmOff = alarmOffCourseIds.includes(active.id)
  const others = courses.filter((c) => c.id !== active.id)

  return (
    <div className="screen">
      <div className="home-header">
        <div className="home-header-row">
          <div className="home-title">내 일정</div>
        </div>
      </div>

      <div className="screen-body">
        {next ? (
          <div className="next-card">
            <div className="next-tag">
              <span className="next-tag-dot" />
              <span className="next-tag-label">다음 일정 · {next.stop.dateLabel || active.dateLabel}</span>
            </div>
            <div className="next-name">{next.stop.name}</div>
            <div className="next-meta">
              {next.stop.venue?.name}
              {next.stop.hall ? ` · ${next.stop.hall}` : ''}
              {next.stop.time ? ` · ${next.stop.time}–${next.stop.timeEnd}` : ''}
            </div>
            <div className="next-actions">
              <a
                className="btn-mid-primary"
                href={directionsUrl(next.stop)}
                target="_blank"
                rel="noopener noreferrer"
              >
                길찾기 시작
              </a>
              <button className="btn-mid-white" onClick={() => toggleAlarm(active.id)}>
                {alarmOff ? '일정 알림 켜기' : '일정 알림 끄기'}
              </button>
            </div>
          </div>
        ) : (
          <div className="next-card next-card-done">
            <div className="next-name">일정을 모두 마쳤어요 🎉</div>
            <div className="next-meta">{active.name} · {total}개 일정 완료</div>
          </div>
        )}

        <div className="section-head">
          <div className="section-title">{active.name}</div>
          <div className="section-count">
            {done} / {total} 완료
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-list">
            {active.stops.map((stop, i) => {
              const key = stopKey(active.id, stop, i)
              const isDone = doneStopKeys.includes(key)
              const isNext = next?.index === i
              return (
                <button
                  key={key}
                  className={`progress-row progress-row-btn ${isDone ? 'is-done' : ''} ${isNext ? 'is-next' : ''}`}
                  onClick={() => toggleStopDone(key)}
                  aria-pressed={isDone}
                >
                  <span className="progress-dot">{isDone ? '✓' : isNext ? '·' : ''}</span>
                  <span className="progress-name">{stop.name}</span>
                  <span className="progress-time">{stop.time || ''}</span>
                </button>
              )
            })}
          </div>
        </div>

        {others.length > 0 && (
          <>
            <div className="section-title" style={{ marginBottom: 12 }}>
              저장한 다른 코스
            </div>
            <div className="list-col">
              {others.map((course) => {
                const p = progressOf(course, doneStopKeys)
                return (
                  <div key={course.id} className="saved-row">
                    <button className="saved-main" onClick={() => setActiveCourse(course.id)}>
                      <div className="saved-name">{course.name}</div>
                      <div className="saved-meta">
                        {course.dateLabel} · {p.done}/{p.total} 완료
                      </div>
                    </button>
                    <button
                      className="saved-remove"
                      onClick={() => removeCourse(course.id)}
                      aria-label={`${course.name} 삭제`}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <button className="text-btn-danger" onClick={() => removeCourse(active.id)}>
          이 코스를 내 일정에서 빼기
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
