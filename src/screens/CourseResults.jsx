import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { COURSES, courseTags, courseStatRows } from '../data/courses.js'
import TopBar from '../components/TopBar.jsx'

export default function CourseResults() {
  const navigate = useNavigate()
  const { courseId, setCourseId } = useAppState()
  const picked = COURSES.find((c) => c.id === courseId) || COURSES[0]

  return (
    <div className="screen">
      <TopBar title="추천 코스" />
      <div className="screen-body">
        <div className="hero-heading">
          2026 전주세계소리축제
          <br />
          실제 일정으로 짠 코스 {COURSES.length}개
        </div>
        <div className="answer-tags">
          {['한국소리문화의전당', '전주대사습청', '덕진공원', '팔복예술공장'].map((label) => (
            <div key={label} className="pill-tag">
              {label}
            </div>
          ))}
        </div>

        <div className="list-col">
          {COURSES.map((c) => {
            const selected = courseId === c.id
            const tags = courseTags(c)
            const stats = courseStatRows(c)
            return (
              <button
                key={c.id}
                className={`course-card ${selected ? 'is-selected' : ''}`}
                onClick={() => setCourseId(c.id)}
              >
                <div className="course-card-head">
                  <div className="course-card-name-wrap">
                    <div className="course-card-name">{c.name}</div>
                    {c.best && (
                      <div className="tag-badge" style={{ background: '#fff0e8', color: '#c94a00' }}>
                        추천
                      </div>
                    )}
                  </div>
                  <div className={`course-check ${selected ? 'is-selected' : ''}`}>✓</div>
                </div>
                <div className="course-card-meta">
                  {c.dateLabel} · {c.summary}
                </div>
                <div className="course-card-tags">
                  {tags.map(([label, bg, fg]) => (
                    <div key={label} className="tag-chip" style={{ background: bg, color: fg }}>
                      {label}
                    </div>
                  ))}
                </div>
                <div className="course-card-stats">
                  {stats.map(([k, v]) => (
                    <div key={k} className="course-stat">
                      <div className="course-stat-k">{k}</div>
                      <div className="course-stat-v">{v}</div>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="sticky-cta">
        <button className="sticky-cta-btn" onClick={() => navigate(`/course/${picked.id}`)}>
          {picked.name} 자세히 보기
        </button>
      </div>
    </div>
  )
}
