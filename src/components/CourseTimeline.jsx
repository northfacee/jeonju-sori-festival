import { courseStats, spreadStopPoints } from '../data/courses.js'
import { directionsUrl } from '../data/schedule.js'
import KakaoMap from './KakaoMap.jsx'

export function badgeFor(s) {
  if (s.kind === 'stay') return { label: '숙소', bg: '#eef0ff', fg: '#4338ca' }
  if (s.kind === 'food') return { label: '식사', bg: '#fff0e8', fg: '#c94a00' }
  if (s.kind === 'cafe') return { label: '카페', bg: '#eaf2fe', fg: '#005eeb' }
  if (s.kind === 'night-tour') return { label: '야간관광', bg: '#f3e8ff', fg: '#7c3aed' }
  return s.free ? { label: '무료', bg: '#d9ffe6', fg: '#009632' } : { label: '유료', bg: '#fff0e8', fg: '#c94a00' }
}

export default function CourseTimeline({ stops, selectedIndex, onSelect, showDate = false }) {
  const stats = courseStats({ stops })
  const points = spreadStopPoints(stops)

  return (
    <>
      <div className="map-card">
        <KakaoMap points={points} selectedIndex={selectedIndex} onSelect={onSelect} />
        <div className="map-legend">
          이동 {stats.distanceKm > 0 ? `${stats.distanceKm}km` : '도보권 내'} · 공연 {stats.stopCount}개
          {stats.foodCount > 0 ? ` · 맛집·카페 ${stats.foodCount}곳` : ` · 무료 ${stats.freeCount}개`}
        </div>
      </div>

      <div className="list-col">
        {stops.map((s, i) => {
          const selected = selectedIndex === i
          const badge = badgeFor(s)
          return (
            <button
              key={s.id || s.name}
              className={`stop-card ${selected ? 'is-selected' : ''}`}
              onClick={() => onSelect(i)}
            >
              <div className="stop-row">
                <div className={`stop-num ${selected ? 'is-selected' : ''}`}>{i + 1}</div>
                <div className="stop-main">
                  <div className="stop-top">
                    <div className="stop-name">{s.name}</div>
                    <div className="stop-time">
                      {s.time}–{s.timeEnd}
                    </div>
                    <div className="stop-perk" style={{ background: badge.bg, color: badge.fg }}>
                      <span className="stop-perk-dot" />
                      {badge.label}
                    </div>
                  </div>
                  <div className="stop-meta">
                    {showDate && s.dateLabel ? `${s.dateLabel} · ` : ''}
                    {s.venue.name}
                    {s.hall ? ` · ${s.hall}` : ''}
                  </div>
                  {selected && (
                    <>
                      {s.desc && <div className="stop-why">{s.desc}</div>}
                      <div className="stop-actions">
                        <a
                          className="btn-mid-primary"
                          href={directionsUrl(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          길찾기
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
