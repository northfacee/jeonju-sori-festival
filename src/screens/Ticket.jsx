import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { COURSES } from '../data/courses.js'
import { FESTIVAL } from '../data/festival.js'
import { buildQrCells } from '../data/mock.js'
import TopBar from '../components/TopBar.jsx'

const DEFAULT_COURSE = COURSES.find((c) => c.id === 'hanok-sori')

export default function Ticket() {
  const location = useLocation()
  const qrCells = useMemo(() => buildQrCells(), [])

  const state = location.state || {}
  const otherStops = state.otherStops || DEFAULT_COURSE.stops
  const stop = state.stop || otherStops.find((s) => !s.kind && !s.free) || otherStops[0]
  const otherFree = otherStops.filter((s) => !s.kind && s.free && s.name !== stop.name).slice(0, 3)

  return (
    <div className="screen">
      <TopBar title="예매 확인" />
      <div className="screen-body">
        <div className="store-card">
          <div className="store-head">
            <div>
              <div className="store-district">
                {stop.venue.name}
                {stop.hall ? ` · ${stop.hall}` : ''}
              </div>
              <div className="store-name">{stop.name}</div>
            </div>
            <div className="status-badge" style={!stop.free ? { background: '#fff0e8', color: '#c94a00' } : undefined}>
              {stop.free ? '무료' : '유료'}
            </div>
          </div>

          <div className="coupon-highlight">
            <div>
              <div className="coupon-amount" style={{ fontSize: 20 }}>
                {stop.dateLabel || DEFAULT_COURSE.dateLabel} {stop.time}–{stop.timeEnd}
              </div>
              <div className="coupon-cond">{stop.venue.address}</div>
            </div>
          </div>

          <div className="qr-wrap">
            <div className="qr-grid">
              {qrCells.map((on, i) => (
                <div key={i} className="qr-cell" style={{ background: on ? '#171717' : '#fff' }} />
              ))}
            </div>
          </div>
          <div className="qr-hint">현장 수령 시 예매번호와 신분증을 확인해요</div>
          <div className="qr-timer" style={{ color: 'rgba(55,56,60,0.61)', fontWeight: 500 }}>
            {FESTIVAL.pickupPolicy}
          </div>
        </div>

        {otherFree.length > 0 && (
          <>
            <div className="section-title" style={{ marginBottom: 12 }}>
              같은 코스, 놓치면 아쉬운 무료 공연
            </div>
            <div className="list-col">
              {otherFree.map((s) => (
                <div key={s.id || s.name} className="coupon-row">
                  <div className="feed-main">
                    <div className="feed-name-row">
                      <div className="feed-name">{s.name}</div>
                      <div className="tag-badge" style={{ background: '#d9ffe6', color: '#009632' }}>
                        무료
                      </div>
                    </div>
                    <div className="feed-meta">
                      {s.venue.name}
                      {s.hall ? ` · ${s.hall}` : ''} · {s.time}–{s.timeEnd}
                    </div>
                  </div>
                  <div className="coupon-row-btn" style={{ background: '#3366ff', color: '#fff', border: 'none' }}>
                    일정 추가
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
