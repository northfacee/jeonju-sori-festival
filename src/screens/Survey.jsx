import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { SURVEY_STEPS } from '../data/survey.js'
import { NIGHT_TOUR_EVENTS } from '../data/nightTour.js'
import { DATE_LABELS } from '../data/stopPool.js'
import { QuestionIcon } from '../components/surveyIcons.jsx'
import TopBar from '../components/TopBar.jsx'
import CoachMark from '../components/CoachMark.jsx'
import { isCoachSeen, markCoachSeen } from '../lib/coachMarks.js'

const TOTAL_STEPS = SURVEY_STEPS.length + 1

// 답을 고르고 나서 다음 문항으로 넘어가기까지. 이 사이에 지금 장이 위로 빠진다.
// app.css의 survey-page-out 길이와 같아야 한다. 길면 손끝이 굼떠지고,
// 짧으면 빠지는 게 안 보인 채 화면만 바뀐다.
const LEAVE_MS = 150

// 이 프로그램이 축제 기간 중 실제로 여는 날. "5월부터 11월까지 매주 금·토"보다
// "내가 가 있는 날에 여는가"가 먼저 궁금하다. 축제는 8월 안에 다 끝나므로
// 달은 한 번만 적는다.
function openDays(activeDates) {
  if (activeDates.length === 0) return null
  const labels = activeDates.map((d) => DATE_LABELS[d] || d)
  const month = labels[0].split(' ')[0]
  return `${month} ${labels.map((l) => l.split(' ').slice(1).join(' ')).join('·')}`
}

export default function Survey() {
  const { step } = useParams()
  const navigate = useNavigate()
  const { answers, setAnswer } = useAppState()

  const index = Math.max(1, Math.min(TOTAL_STEPS, Number(step) || 1)) - 1
  const isNightTourStep = index === SURVEY_STEPS.length

  // 야간관광 단계는 처음 보는 사람에게 무엇을 고르는 화면인지 한 번 설명한다.
  const [showNightCoach, setShowNightCoach] = useState(() => !isCoachSeen('night-tour'))
  const closeNightCoach = () => {
    markCoachSeen('night-tour')
    setShowNightCoach(false)
  }
  const current = isNightTourStep ? null : SURVEY_STEPS[index]

  // 지금 장이 빠지는 중인지. 빠지는 동안에는 이 장을 더 누를 수 없다(app.css).
  const [leaving, setLeaving] = useState(false)
  // 연출이 화면에 반영되기 전에 한 번 더 눌리면 이동이 두 번 예약돼 문항을
  // 하나 건너뛴다. 상태는 다음 그림까지 기다려야 해서 여기선 ref로 막는다.
  const goingRef = useRef(false)

  const choose = (optionId) => {
    setAnswer(current.key, optionId)
    if (goingRef.current) return
    goingRef.current = true
    setLeaving(true)
    setTimeout(() => {
      navigate(`/survey/${index + 2}`)
    }, LEAVE_MS)
  }

  const toggleNightTour = (eventId) => {
    const prev = answers.nightTourIds || []
    const next = prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    setAnswer('nightTourIds', next)
  }

  return (
    <div className="screen">
      <TopBar title={`질문 ${index + 1} / ${TOTAL_STEPS}`} />
      <div className="survey-progress">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`survey-progress-dot ${i <= index ? 'is-done' : ''} ${i === index ? 'is-current' : ''}`}
          />
        ))}
      </div>

      {isNightTourStep ? (
        <div className="screen-body survey-page">
          <div className="survey-question">야간관광 프로그램도 코스에 넣을까요?</div>
          <div className="survey-sub">원하는 만큼 골라주세요. 안 골라도 코스는 그대로 만들어드려요.</div>

          <div className="survey-options">
            {NIGHT_TOUR_EVENTS.map((event) => {
              const selected = (answers.nightTourIds || []).includes(event.id)
              const days = openDays(event.activeDates)
              return (
                <button
                  key={event.id}
                  className={`option-card option-card-tall ${selected ? 'is-selected' : ''}`}
                  onClick={() => toggleNightTour(event.id)}
                >
                  <img className="option-thumb" src={event.image} alt={event.name} />
                  <div className="option-main">
                    {/* 장소와 값은 문장이 아니라 값이다. 이름 옆에 칸으로 붙여두면
                        카드를 훑을 때 같은 자리에서 같은 색으로 잡혀 비교가 빨라진다.
                        이름이 길어 한 줄에 안 들어가면 아래로 내려간다. */}
                    <div className="option-head">
                      <div className="option-title">{event.name}</div>
                      {/* 두 칸은 함께 움직인다. 따로 흐르게 두면 카드마다 두 줄·세 줄로
                          갈려서 목록이 들쭉날쭉해진다. */}
                      <div className="option-tags">
                        <span className="option-tag is-place">{event.place}</span>
                        <span className="option-tag is-price">{event.price}</span>
                      </div>
                    </div>
                    {/* 이름과 값만 있으면 무엇을 하는 곳인지 알 수 없다. */}
                    <div className="option-desc">{event.desc}</div>
                    {days ? (
                      <div className="option-when">축제 기간 중 {days} 운영</div>
                    ) : (
                      // 여는 날이 축제 기간과 안 겹치면 코스에 들어갈 수 없다. 골라놓고 안 나오면
                      // 빠진 줄 알기 때문에, 왜 안 나오는지 미리 적어둔다.
                      <div className="option-when is-off">축제 기간에는 운영하지 않아요 (9~10월 프로그램)</div>
                    )}
                  </div>
                  <div className={`option-radio ${selected ? 'is-selected' : ''}`}>{selected ? '✓' : ''}</div>
                </button>
              )
            })}
          </div>

          <button
            className="btn-primary survey-next"
            style={{ width: '100%', marginTop: 8 }}
            onClick={() => navigate('/ai-course')}
          >
            다음
          </button>

          {showNightCoach && (
            <CoachMark
              targetSelector=".option-card"
              title="야간관광도 코스에 넣을 수 있어요"
              description="축제 기간에 실제로 운영하는 야간 프로그램이에요. 여러 개 골라도 되고, 안 골라도 코스는 그대로 만들어드려요."
              onClose={closeNightCoach}
            />
          )}
        </div>
      ) : (
        <div className={`screen-body survey-page ${leaving ? 'is-leaving' : ''}`}>
          <div className="survey-question">{current.question}</div>
          <div className="survey-sub">{current.sub}</div>

          <div className="survey-options">
            {current.options.map((opt) => {
              const selected = answers[current.key] === opt.id
              return (
                <button
                  key={opt.id}
                  className={`option-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => choose(opt.id)}
                >
                  <div className="option-icon">
                    <QuestionIcon name={opt.icon} stroke={selected ? '#3366ff' : '#171717'} />
                  </div>
                  <div className="option-main">
                    <div className="option-title">{opt.label}</div>
                    <div className="option-desc">{opt.desc}</div>
                  </div>
                  <div className={`option-radio ${selected ? 'is-selected' : ''}`}>{selected ? '✓' : ''}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
