import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { SURVEY_STEPS } from '../data/survey.js'
import { NIGHT_TOUR_EVENTS } from '../data/nightTour.js'
import { QuestionIcon } from '../components/surveyIcons.jsx'
import TopBar from '../components/TopBar.jsx'
import CoachMark from '../components/CoachMark.jsx'
import { isCoachSeen, markCoachSeen } from '../lib/coachMarks.js'

const TOTAL_STEPS = SURVEY_STEPS.length + 1

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

  const choose = (optionId) => {
    setAnswer(current.key, optionId)
    setTimeout(() => {
      navigate(`/survey/${index + 2}`)
    }, 220)
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
          <div key={i} className={`survey-progress-dot ${i <= index ? 'is-done' : ''}`} />
        ))}
      </div>

      {isNightTourStep ? (
        <div className="screen-body">
          <div className="survey-question">야간관광 프로그램도 코스에 넣을까요?</div>
          <div className="survey-sub">원하는 만큼 골라주세요. 안 골라도 코스는 그대로 만들어드려요.</div>

          <div>
            {NIGHT_TOUR_EVENTS.map((event) => {
              const selected = (answers.nightTourIds || []).includes(event.id)
              return (
                <button
                  key={event.id}
                  className={`option-card ${selected ? 'is-selected' : ''}`}
                  onClick={() => toggleNightTour(event.id)}
                >
                  <img className="option-thumb" src={event.image} alt={event.name} />
                  <div className="option-main">
                    <div className="option-title">{event.name}</div>
                    <div className="option-desc">
                      {event.period} · {event.price}
                    </div>
                  </div>
                  <div className={`option-radio ${selected ? 'is-selected' : ''}`}>{selected ? '✓' : ''}</div>
                </button>
              )
            })}
          </div>

          <button
            className="btn-primary"
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
        <div className="screen-body">
          <div className="survey-question">{current.question}</div>
          <div className="survey-sub">{current.sub}</div>

          <div>
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
