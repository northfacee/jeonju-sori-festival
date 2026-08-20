import { useEffect, useMemo, useState } from 'react'

// 백엔드 진행 상황과 무관하게 도는 연출용 애니메이션. 링이 100%에 닿고 나서
// 잠깐 머무를 수 있도록, 화면 최소 노출 시간(AiCourse의 MIN_LOADING_MS)보다 조금 짧게 잡는다.
const DURATION = 4600

// backend/app/graph/build.py의 노드 순서와 1:1로 대응시킨다.
function stepsFor(answers) {
  const steps = ['답변 정리하고 날짜 고르기', '축제 프로그램 시간표 대조', '근처 맛집·카페 찾기']
  if ((answers.nightTourIds || []).length > 0) steps.push('야간관광 프로그램 배치')
  if (answers.duration && answers.duration !== 'day') steps.push('묵을 숙소 찾기')
  steps.push('코스 이름과 추천 이유 정리')
  return steps
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M4.5 10.5l3.5 3.5 7.5-7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const RADIUS = 54
const CIRC = 2 * Math.PI * RADIUS

export default function CourseLoading({ answers }) {
  const [elapsed, setElapsed] = useState(0)

  // CSS transition으로 보간하면 값이 매 프레임 바뀌는 걸 못 따라가 눈에 띄게 뒤처진다.
  // 그래서 transition 없이 rAF로 직접 매 프레임 그린다.
  useEffect(() => {
    const start = Date.now()
    let raf = 0
    const tick = () => {
      const now = Date.now() - start
      setElapsed(now)
      if (now < DURATION) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const steps = useMemo(() => stepsFor(answers), [answers])

  const progress = Math.min(100, (elapsed / DURATION) * 100)
  const doneCount = Math.min(steps.length, Math.floor(progress / (100 / steps.length)))
  const done = progress >= 100

  return (
    <div className="loading-panel">
      <div className="loading-bar-track">
        <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="loading-ring-wrap">
        <svg className="loading-ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="loading-ring-track" cx="60" cy="60" r={RADIUS} />
          <circle
            className="loading-ring-bar"
            cx="60"
            cy="60"
            r={RADIUS}
            style={{ strokeDasharray: CIRC, strokeDashoffset: CIRC * (1 - progress / 100) }}
          />
        </svg>
        <div className="loading-ring-pct">{Math.round(progress)}%</div>
      </div>

      <div className="loading-title">{done ? '코스가 거의 다 나왔어요' : '답변을 코스로 바꾸는 중'}</div>

      <div className="loading-steps">
        {steps.map((label, i) => {
          const isDone = i < doneCount
          const isCurrent = i === doneCount && !done
          return (
            <div key={label} className={`loading-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}>
              <span className="loading-step-mark">{isDone ? <CheckIcon /> : <span className="loading-step-dot" />}</span>
              <span className="loading-step-label">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
