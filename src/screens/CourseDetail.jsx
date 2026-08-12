import { useParams, useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { COURSES } from '../data/courses.js'
import CourseTimeline from '../components/CourseTimeline.jsx'
import { BookmarkIcon } from '../components/icons.jsx'
import TopBar from '../components/TopBar.jsx'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { stopIndex, setStopIndex } = useAppState()
  const course = COURSES.find((c) => c.id === id) || COURSES[0]

  return (
    <div className="screen">
      <TopBar title={course.name} />
      <div className="screen-body">
        <div className="survey-sub" style={{ marginTop: -4, marginBottom: 16 }}>
          {course.dateLabel} · {course.summary}
        </div>

        <CourseTimeline
          stops={course.stops}
          selectedIndex={stopIndex - 1}
          onSelect={(i) => setStopIndex(i + 1)}
          onTicket={(stop) => navigate('/ticket', { state: { stop, otherStops: course.stops } })}
        />
      </div>

      <div className="sticky-cta row">
        <button className="btn-icon-square" aria-label="저장">
          <BookmarkIcon />
        </button>
        <button className="sticky-cta-btn" onClick={() => navigate('/schedule')}>
          내 일정에 저장
        </button>
      </div>
    </div>
  )
}
