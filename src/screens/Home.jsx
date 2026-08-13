import { useNavigate } from 'react-router-dom'
import { FESTIVAL } from '../data/festival.js'
import { NIGHT_TOUR_EVENTS } from '../data/nightTour.js'
import BottomNav from '../components/BottomNav.jsx'

const NIGHT_TOUR_SOURCE_URL = 'https://tour.jeonju.go.kr/index.jeonju?menuCd=DOM_000000102007000000'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="screen">
      <div className="screen-body">
        <div className="card banner-card banner-card-lg">
          <div className="banner-art">
            <img className="banner-poster" src="/festival-poster.png" alt="2026 전주세계소리축제 포스터" />
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
            </div>
          </div>
        </div>

        <div className="section-head">
          <div className="section-title">2026 전주 야간관광</div>
          <button
            className="section-link"
            onClick={() => window.open(NIGHT_TOUR_SOURCE_URL, '_blank', 'noopener,noreferrer')}
          >
            전체
          </button>
        </div>
        <div className="feed-list">
          {NIGHT_TOUR_EVENTS.map((event) => {
            const isFree = event.price === '무료입장'
            return (
              <button
                key={event.id}
                className="feed-card"
                onClick={() => window.open(NIGHT_TOUR_SOURCE_URL, '_blank', 'noopener,noreferrer')}
              >
                <img className="feed-thumb" src={event.image} alt={event.name} />
                <div className="feed-main">
                  <div className="feed-name-row">
                    <div className="feed-name">{event.name}</div>
                    <div
                      className="tag-badge"
                      style={
                        isFree
                          ? { background: '#d9ffe6', color: '#009632' }
                          : { background: '#eaf2fe', color: '#3366ff' }
                      }
                    >
                      {event.price}
                    </div>
                  </div>
                  <div className="feed-meta">
                    {event.period} · {event.place}
                  </div>
                  <div className="feed-saved">{event.desc}</div>
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
