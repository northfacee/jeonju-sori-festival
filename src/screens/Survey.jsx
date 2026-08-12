import { useNavigate, useParams } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { SURVEY_STEPS } from '../data/survey.js'
import { QuestionIcon } from '../components/surveyIcons.jsx'
import TopBar from '../components/TopBar.jsx'

export default function Survey() {
  const { step } = useParams()
  const navigate = useNavigate()
  const { answers, setAnswer } = useAppState()

  const index = Math.max(1, Math.min(SURVEY_STEPS.length, Number(step) || 1)) - 1
  const current = SURVEY_STEPS[index]
  const isLast = index === SURVEY_STEPS.length - 1

  const choose = (optionId) => {
    setAnswer(current.key, optionId)
    setTimeout(() => {
      navigate(isLast ? '/ai-course' : `/survey/${index + 2}`)
    }, 220)
  }

  return (
    <div className="screen">
      <TopBar title={`질문 ${index + 1} / ${SURVEY_STEPS.length}`} />
      <div className="survey-progress">
        {SURVEY_STEPS.map((s, i) => (
          <div key={s.key} className={`survey-progress-dot ${i <= index ? 'is-done' : ''}`} />
        ))}
      </div>

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
    </div>
  )
}
