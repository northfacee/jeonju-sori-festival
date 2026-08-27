import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { directionsUrl, groupByDay, nextStopOf, progressOf, stopKey } from '../data/schedule.js'
import BottomNav from '../components/BottomNav.jsx'
import DayPager from '../components/DayPager.jsx'
import { preloadKakaoShare, shareCourse } from '../lib/share.js'

export default function MySchedule() {
  const navigate = useNavigate()
  const { schedule, removeCourse, toggleStopDone, setActiveCourse } = useAppState()
  const { courses, doneStopKeys, activeCourseId } = schedule

  const active = courses.find((c) => c.id === activeCourseId) || courses[0] || null

  // null이면 "아직 사용자가 안 넘김" — 다음 일정이 있는 날을 자동으로 보여준다.
  const [dayIndexRaw, setDayIndexRaw] = useState(null)
  // 공유가 카카오톡이나 기기 공유 시트로 넘어가면 화면에 알릴 게 없지만,
  // 클립보드 복사로 내려간 경우엔 아무 일도 안 일어난 것처럼 보여서 한 줄 띄운다.
  const [shareNote, setShareNote] = useState('')

  // 누를 때 SDK를 받으면 그 사이에 "방금 눌렀다"는 자격이 만료돼 공유 시트가 막힌다.
  // 화면에 들어올 때 미리 받아둔다.
  useEffect(() => {
    preloadKakaoShare()
  }, [])
  useEffect(() => setDayIndexRaw(null), [activeCourseId])

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
  const others = courses.filter((c) => c.id !== active.id)
  const groups = groupByDay(active)

  // 코스를 바꾸면 1일차부터, 그리고 다음 일정이 있는 날을 먼저 펴준다.
  const initialDay = Math.max(
    0,
    groups.findIndex((g) => g.items.some((it) => it.index === next?.index)),
  )
  const dayIndex = Math.min(dayIndexRaw ?? initialDay, groups.length - 1)

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
              {/* 길찾기 하나만 남아 줄을 다 쓴다(.btn-mid-primary가 flex:1). */}
              <a
                className="btn-mid-primary"
                href={directionsUrl(next.stop)}
                target="_blank"
                rel="noopener noreferrer"
              >
                길찾기 시작
              </a>
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

          {groups.length > 1 && (
            <div className="day-pager-head">
              <button
                className="day-pager-nav"
                onClick={() => setDayIndexRaw(dayIndex - 1)}
                disabled={dayIndex === 0}
                aria-label="이전 날"
              >
                ‹
              </button>
              <div className="day-pager-title">
                <span className="day-pager-day">Day {dayIndex + 1}</span>
                <span className="day-pager-date">{groups[dayIndex].label}</span>
              </div>
              <button
                className="day-pager-nav"
                onClick={() => setDayIndexRaw(dayIndex + 1)}
                disabled={dayIndex === groups.length - 1}
                aria-label="다음 날"
              >
                ›
              </button>
            </div>
          )}

          <DayPager index={dayIndex} count={groups.length} onChange={setDayIndexRaw}>
            {groups.map((group) => (
              <div className="progress-list" key={group.key}>
                {group.items.map(({ stop, index }) => {
                  const key = stopKey(active.id, stop, index)
                  const isDone = doneStopKeys.includes(key)
                  const isNext = next?.index === index
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
            ))}
          </DayPager>

          {groups.length > 1 && (
            <div className="day-pager-dots">
              {groups.map((group, i) => (
                <button
                  key={group.key}
                  className={`day-pager-dot ${i === dayIndex ? 'is-active' : ''}`}
                  onClick={() => setDayIndexRaw(i)}
                  aria-label={`${i + 1}일차 보기`}
                />
              ))}
            </div>
          )}
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

        <button
          className="btn-kakao"
          onClick={async () => {
            const how = await shareCourse(active)
            // 클립보드로 내려간 경우엔 아무 일도 안 일어난 것처럼 보이므로 알려준다.
            if (how === 'copied') setShareNote('일정을 복사했어요. 카카오톡에 붙여넣어 주세요.')
            else if (how === 'failed') setShareNote('공유에 실패했어요. 잠시 후 다시 시도해주세요.')
            else setShareNote('')
          }}
        >
          카카오톡으로 공유하기
        </button>
        {shareNote && <div className="share-note">{shareNote}</div>}

        <button className="btn-danger" onClick={() => removeCourse(active.id)}>
          이 코스를 내 일정에서 빼기
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
