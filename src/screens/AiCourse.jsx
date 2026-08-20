import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { answerTagsFrom } from '../data/survey.js'
import { fetchAiCourse } from '../lib/aiRecommend.js'
import { courseFromAi } from '../data/schedule.js'
import CourseTimeline from '../components/CourseTimeline.jsx'
import CourseLoading from '../components/CourseLoading.jsx'
import CoachMark from '../components/CoachMark.jsx'
import { isCoachSeen, markCoachSeen } from '../lib/coachMarks.js'
import TopBar from '../components/TopBar.jsx'

const MIN_LOADING_MS = 5000

export default function AiCourse() {
  const navigate = useNavigate()
  const { answers, aiCourse, setAiCourse, aiCourseKey, setAiCourseKey, saveCourse } = useAppState()
  const hasAnswers = Object.keys(answers).length > 0
  const signature = JSON.stringify(answers)
  const hasFreshCourse = Boolean(aiCourse) && aiCourseKey === signature
  const [status, setStatus] = useState(hasFreshCourse ? 'done' : hasAnswers ? 'loading' : 'no-answers')
  const [error, setError] = useState('')
  const [dayIndices, setDayIndices] = useState([])

  // 결과가 나온 뒤 안내를 두 개 띄운다. 한꺼번에 겹치면 못 읽으니 위에서 아래 순서로
  // 하나씩 — 스와이프 삭제(첫 카드) 먼저, 닫으면 가게 선택(반반 카드).
  const [showSwipeCoach, setShowSwipeCoach] = useState(() => !isCoachSeen('swipe-delete'))
  const [showChooseCoach, setShowChooseCoach] = useState(() => !isCoachSeen('choose-place'))
  const closeSwipeCoach = () => {
    markCoachSeen('swipe-delete')
    setShowSwipeCoach(false)
  }
  const closeChooseCoach = () => {
    markCoachSeen('choose-place')
    setShowChooseCoach(false)
  }

  useEffect(() => {
    if (!hasAnswers) return
    // 같은 답변으로 만든 코스가 이미 있으면 그대로 쓴다.
    if (hasFreshCourse) {
      setStatus('done')
      return
    }
    setStatus('loading')

    let cancelled = false

    // 로딩 연출을 끝까지 보여주기 위한 최소 노출 시간. 응답이 이보다 빨리 와도 기다린다.
    const minWait = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS))

    Promise.all([fetchAiCourse(answers), minWait])
      .then(([result]) => {
        if (cancelled) return
        setAiCourse(result)
        setAiCourseKey(signature)
        setDayIndices(result.days.map(() => 0))
        setStatus('done')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnswers, signature, hasFreshCourse])

  if (status === 'no-answers') {
    return (
      <div className="screen">
        <TopBar title="AI 맞춤 코스" />
        <div className="screen-body">
          <div className="survey-question">아직 답변이 없어요</div>
          <div className="survey-sub">먼저 5가지 질문에 답해주시면 AI가 코스를 새로 짜드려요.</div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/survey/1')}>
            질문 시작하기
          </button>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="screen">
        <TopBar title="AI 맞춤 코스" />
        <div className="screen-body">
          <div className="answer-tags">
            {answerTagsFrom(answers).map((label) => (
              <div key={label} className="pill-tag">
                {label}
              </div>
            ))}
          </div>
          <CourseLoading answers={answers} />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="screen">
        <TopBar title="AI 맞춤 코스" />
        <div className="screen-body">
          <div className="ai-callout ai-callout-error">
            <span className="ai-callout-badge">AI 코스 생성 실패</span>
            <span>{error}</span>
          </div>
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              setAiCourseKey(null)
              setStatus('loading')
            }}
          >
            다시 시도하기
          </button>
        </div>
      </div>
    )
  }

  // 스와이프로 정류지를 빼면 그 날의 stops에서만 제거하고, 선택 인덱스가
  // 목록 밖으로 나가지 않게 당겨준다.
  const removeStop = (dayIdx, stop) => {
    setAiCourse((prev) => ({
      ...prev,
      days: prev.days.map((day, i) =>
        i === dayIdx ? { ...day, stops: day.stops.filter((s) => (s.id || s.name) !== (stop.id || stop.name)) } : day,
      ),
    }))
    setDayIndices((prev) => {
      const next = [...prev]
      const remaining = (aiCourse.days[dayIdx]?.stops.length ?? 1) - 1
      next[dayIdx] = Math.max(0, Math.min(next[dayIdx] ?? 0, remaining - 1))
      return next
    })
  }

  // 반반 카드에서 고른 가게가 실제 일정이 된다(지도·저장·길찾기 모두 이걸 따라간다).
  const chooseStopPlace = (dayIdx, stop, which) => {
    setAiCourse((prev) => ({
      ...prev,
      days: prev.days.map((day, i) =>
        i === dayIdx
          ? {
              ...day,
              stops: day.stops.map((s) =>
                (s.id || s.name) === (stop.id || stop.name) ? { ...s, chosen: which } : s,
              ),
            }
          : day,
      ),
    }))
  }

  const { title, reason, days } = aiCourse

  return (
    <div className="screen">
      <TopBar title={title} />
      <div className="screen-body">
        <div className="ai-callout" style={{ marginBottom: 4 }}>
          <span className="ai-callout-badge">AI 추천</span>
          <p className="ai-callout-text">{reason}</p>
        </div>
        <div className="answer-tags" style={{ marginTop: 12, marginBottom: 4 }}>
          {answerTagsFrom(answers).map((label) => (
            <div key={label} className="pill-tag">
              {label}
            </div>
          ))}
        </div>

        {days.map((day, dayIdx) => (
          <div key={day.dayNumber} style={{ marginTop: 24 }}>
            <div className="hero-heading" style={{ fontSize: 20, marginBottom: 2 }}>
              Day {day.dayNumber} · {day.dateLabel}
            </div>
            {day.stops.length === 0 ? (
              <div className="survey-sub">이 날은 조건에 맞는 프로그램을 찾지 못했어요.</div>
            ) : (
              <CourseTimeline
                stops={day.stops}
                selectedIndex={dayIndices[dayIdx] ?? 0}
                onSelect={(i) =>
                  setDayIndices((prev) => {
                    const next = [...prev]
                    next[dayIdx] = i
                    return next
                  })
                }
                onDelete={(stop) => removeStop(dayIdx, stop)}
                onChoose={(stop, which) => chooseStopPlace(dayIdx, stop, which)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sticky-cta">
        <button
          className="sticky-cta-btn"
          onClick={() => {
            saveCourse(courseFromAi(aiCourse))
            navigate('/schedule')
          }}
        >
          내 일정에 저장
        </button>
      </div>

      {showSwipeCoach && days.some((d) => d.stops.length > 0) && (
        <CoachMark
          targetSelector=".swipe-item"
          title="빼고 싶은 일정은 밀어서 삭제"
          description="마음에 들지 않는 일정은 카드를 왼쪽으로 밀면 코스에서 뺄 수 있어요."
          onClose={closeSwipeCoach}
        />
      )}

      {!showSwipeCoach && showChooseCoach && days.some((d) => d.stops.some((s) => s.promo)) && (
        <CoachMark
          targetSelector=".stop-card-split"
          title="식당·카페는 두 곳 중에 고르세요"
          description="왼쪽은 AI 추천, 오른쪽은 근처 소상공인 가게예요. 원하는 쪽을 누르면 그 가게로 일정이 짜여요."
          onClose={closeChooseCoach}
        />
      )}
    </div>
  )
}
