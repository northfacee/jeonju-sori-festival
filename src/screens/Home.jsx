import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'
import { CHIP_LABELS } from '../data/mock.js'
import { COURSES, courseStats } from '../data/courses.js'
import { FESTIVAL, VENUES } from '../data/festival.js'
import { SearchIcon, BellIcon, BookmarkIcon, FeedGlyph } from '../components/icons.jsx'
import KakaoMap from '../components/KakaoMap.jsx'
import BottomNav from '../components/BottomNav.jsx'

const FEED_ICONS = {
  'hanok-sori': { icon: 'M9 20 A11 11 0 0 0 31 20 M7 20 h26 M13 30 q7 3.5 14 0', tint: '#eaf2fe', fg: '#3366ff' },
  'deokjin-fringe': {
    icon: 'M27 24 A11 11 0 0 1 16 9 a12 12 0 1 0 11 15 Z',
    tint: '#fff0e8',
    fg: '#c94a00',
  },
  'family-street': {
    icon: 'M14 18 a4 4 0 1 0 .01 0 M27 17 a3.4 3.4 0 1 0 .01 0 M7 31 a7 7 0 0 1 14 0 M22 31 a5.5 5.5 0 0 1 11 0',
    tint: '#d9ffe6',
    fg: '#009632',
  },
}

const FEED_IDS = ['hanok-sori', 'deokjin-fringe', 'family-street']

export default function Home() {
  const navigate = useNavigate()
  const { chip, setChip } = useAppState()
  const feedCourses = FEED_IDS.map((id) => COURSES.find((c) => c.id === id))

  return (
    <div className="screen">
      <div className="home-header">
        <div className="home-header-row">
          <div className="home-title">전주 소리축제</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn" aria-label="검색">
              <SearchIcon />
            </button>
            <button className="icon-btn" aria-label="알림">
              <BellIcon />
              <span className="dot" />
            </button>
          </div>
        </div>
        <div className="chip-row">
          {CHIP_LABELS.map((label) => (
            <button
              key={label}
              className={`chip ${chip === label ? 'is-active' : ''}`}
              onClick={() => setChip(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="screen-body">
        <div className="card banner-card">
          <div className="banner-art">
            <KakaoMap
              points={[{ lat: VENUES.sori.lat, lon: VENUES.sori.lon }]}
              interactive={false}
              variant="preview"
              height={132}
            />
            <div className="banner-badge">{FESTIVAL.edition} · 개막</div>
          </div>
          <div className="banner-body">
            <div className="banner-date">{FESTIVAL.dateLabel}</div>
            <div className="banner-name">{FESTIVAL.name}</div>
            <div className="banner-meta">
              {FESTIVAL.venue.name} · {FESTIVAL.programLabel}
            </div>
            <div className="banner-actions">
              <button className="btn-primary" onClick={() => navigate('/survey/1')}>
                AI 코스 추천받기
              </button>
              <button className="btn-icon-square" aria-label="저장">
                <BookmarkIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="section-head">
          <div className="section-title">지금 인기 있는 코스</div>
          <button className="section-link" onClick={() => navigate('/results')}>
            전체
          </button>
        </div>
        <div className="feed-list">
          {feedCourses.map((course) => {
            const meta = FEED_ICONS[course.id]
            const stats = courseStats(course)
            return (
              <button key={course.id} className="feed-card" onClick={() => navigate(`/course/${course.id}`)}>
                <div className="feed-icon" style={{ background: meta.tint }}>
                  <FeedGlyph path={meta.icon} stroke={meta.fg} />
                </div>
                <div className="feed-main">
                  <div className="feed-name-row">
                    <div className="feed-name">{course.name}</div>
                    <div className="tag-badge" style={{ background: '#d9ffe6', color: '#009632' }}>
                      무료 {stats.freeCount}개
                    </div>
                  </div>
                  <div className="feed-meta">
                    {course.dateLabel} · {course.summary}
                  </div>
                  <div className="feed-saved">공연 {stats.stopCount}개 · {stats.venueCount}개 장소</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
