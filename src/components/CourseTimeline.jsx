import { courseStats, spreadStopPoints } from '../data/courses.js'
import { directionsUrl, effectiveStop } from '../data/schedule.js'
import KakaoMap from './KakaoMap.jsx'
import SwipeToDelete from './SwipeToDelete.jsx'

export function badgeFor(s) {
  if (s.kind === 'food') return { label: '식사', bg: '#fff0e8', fg: '#c94a00' }
  if (s.kind === 'cafe') return { label: '카페', bg: '#eaf2fe', fg: '#005eeb' }
  if (s.kind === 'night-tour') return { label: '야간관광', bg: '#f3e8ff', fg: '#7c3aed' }
  return s.free ? { label: '무료', bg: '#d9ffe6', fg: '#009632' } : { label: '유료', bg: '#fff0e8', fg: '#c94a00' }
}

// 홍보 가게는 stop이 아니라 정보 묶음이라, 길찾기 링크를 만들려고 stop 모양으로 감싼다.
function promoAsStop(promo) {
  return {
    name: promo.name,
    venue: { name: promo.name, address: promo.address, lat: promo.lat, lon: promo.lon },
  }
}

function splitCard(s, i, selected, badge, onSelect, onChoose) {
  // 아직 안 고른 정류지는 어느 쪽에도 표시를 넣지 않는다. 들어오자마자 한쪽이 초록이면
  // 이미 정해진 것처럼 보여서 고를 수 있다는 걸 모르고 지나친다.
  // (고르지 않아도 일정에는 AI 추천 쪽이 들어간다 — effectiveStop 참고)
  const chosen = s.chosen
  const halves = [
    { key: 'ours', tag: 'AI 추천', name: s.name, meta: s.venue.name, target: s },
    { key: 'promo', tag: '소상공인 홍보', name: s.promo.name, meta: s.promo.address, target: promoAsStop(s.promo) },
  ]

  return (
    <div className={`stop-card stop-card-split ${selected ? 'is-selected' : ''}`}>
      <div className="stop-split-head">
        <div className={`stop-num ${selected ? 'is-selected' : ''}`}>{i + 1}</div>
        <div className="stop-time">
          {s.time}–{s.timeEnd}
        </div>
        <div className="stop-perk" style={{ background: badge.bg, color: badge.fg }}>
          <span className="stop-perk-dot" />
          {badge.label}
        </div>
      </div>

      <div className="stop-split-body">
        {halves.map((half, idx) => {
          const isChosen = chosen === half.key
          return (
            <div key={half.key} className="stop-half-wrap">
              {idx > 0 && <div className="stop-split-line" />}
              <button
                className={`stop-half ${isChosen ? 'is-chosen' : ''}`}
                aria-pressed={isChosen}
                onClick={() => {
                  onSelect(i)
                  onChoose?.(s, half.key)
                }}
              >
                <span className="stop-half-top">
                  <span className={`stop-half-tag ${half.key === 'promo' ? 'is-promo' : ''}`}>{half.tag}</span>
                  {isChosen && <span className="stop-half-check">✓ 일정에 포함</span>}
                </span>
                <span className="stop-half-name">{half.name}</span>
                <span className="stop-half-meta">{half.meta}</span>
                {selected && (
                  <a
                    className="stop-half-go"
                    href={directionsUrl(half.target)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    길찾기
                  </a>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CourseTimeline({ stops, selectedIndex, onSelect, onDelete, onChoose, showDate = false }) {
  // 지도에는 실제로 일정에 들어간 가게(홍보를 골랐으면 그쪽)를 찍는다.
  const shown = stops.map(effectiveStop)
  const stats = courseStats({ stops: shown })
  const points = spreadStopPoints(shown)

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
          const card = (
            <button
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

          // 소상공인 홍보가 붙은 정류지는 카드를 좌우로 반 나눠 두 가게를 같이 보여준다.
          const node = s.promo ? splitCard(s, i, selected, badge, onSelect, onChoose) : card

          const key = s.id || s.name
          if (!onDelete) return <div key={key}>{node}</div>

          return (
            <SwipeToDelete key={key} onDelete={() => onDelete(s, i)}>
              {node}
            </SwipeToDelete>
          )
        })}
      </div>
    </>
  )
}
