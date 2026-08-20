import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HERO_CARDS } from '../data/heroCards.js'
import BottomNav from '../components/BottomNav.jsx'

const CHANGE_AT = 48 // 이만큼 끌면 옆 카드로 넘어간다
const EDGE_RESISTANCE = 0.32

export default function HomeTest() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [dx, setDx] = useState(0)
  const [snapping, setSnapping] = useState(false)

  const startX = useRef(null)
  const startY = useRef(null)
  const axis = useRef(null)

  // %로 밀면 트랙 너비와 슬라이드 실제 폭이 달라 매 장마다 어긋난다. 픽셀로 계산한다.
  const viewportRef = useRef(null)
  const [viewportW, setViewportW] = useState(0)

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => setViewportW(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const count = HERO_CARDS.length
  const slideW = viewportW * 0.86
  // 활성 카드를 가운데 두면 양옆이 똑같이 살짝 보인다.
  const offset = (viewportW - slideW) / 2

  const onPointerDown = (e) => {
    startX.current = e.clientX
    startY.current = e.clientY
    axis.current = null
    setSnapping(false)
  }

  const onPointerMove = (e) => {
    if (startX.current == null) return
    const moveX = e.clientX - startX.current
    const moveY = e.clientY - startY.current

    if (!axis.current) {
      if (Math.abs(moveX) < 6 && Math.abs(moveY) < 6) return
      axis.current = Math.abs(moveX) > Math.abs(moveY) ? 'x' : 'y'
      if (axis.current === 'x') {
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          // 캡처 실패해도 드래그는 계속 동작한다.
        }
      }
    }
    if (axis.current !== 'x') return

    const atStart = index === 0 && moveX > 0
    const atEnd = index === count - 1 && moveX < 0
    setDx(atStart || atEnd ? moveX * EDGE_RESISTANCE : moveX)
  }

  const onPointerUp = () => {
    const swiped = axis.current === 'x'
    startX.current = null
    axis.current = null
    setSnapping(true)

    if (swiped && Math.abs(dx) >= CHANGE_AT) {
      const next = dx < 0 ? index + 1 : index - 1
      if (next >= 0 && next < count) setIndex(next)
    }
    setDx(0)
  }

  const active = HERO_CARDS[index]

  return (
    <div className="screen hero-screen">
      {/* 배경: 현재 카드 이미지를 흐리게 깐다. 카드가 바뀌면 크로스페이드된다. */}
      <div className="hero-bg-layer" aria-hidden="true">
        {HERO_CARDS.map((card, i) => (
          <div
            key={card.id}
            className={`hero-bg ${i === index ? 'is-active' : ''}`}
            style={{ backgroundImage: `url(${card.bg})` }}
          />
        ))}
        <div className="hero-bg-scrim" />
      </div>

      <div className="hero-body">
        <div className="hero-brand">
          <span className="hero-brand-mark">SORI</span>
          <span className="hero-brand-sub">전주세계소리축제</span>
        </div>

        <div
          ref={viewportRef}
          className="hero-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className={`hero-track ${snapping ? 'is-snapping' : ''}`}
            style={{ transform: `translateX(${offset - index * slideW + dx}px)` }}
          >
            {HERO_CARDS.map((card, i) => (
              <div key={card.id} className={`hero-slide ${i === index ? 'is-active' : ''}`}>
                <div className="hero-card">
                  <img className="hero-card-img" src={card.image} alt={card.title} draggable="false" />
                  <div className="hero-card-shade" />
                  <div className="hero-card-text">
                    <div className="hero-card-count">
                      {i + 1} <span>/ {count}</span>
                    </div>
                    <div className="hero-card-title">{card.title}</div>
                    <div className="hero-card-sub">{card.subtitle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-dots">
          {HERO_CARDS.map((card, i) => (
            <button
              key={card.id}
              className={`hero-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => {
                setSnapping(true)
                setIndex(i)
              }}
              aria-label={`${card.title} 보기`}
            />
          ))}
        </div>

        <div className="hero-meta">{active.meta}</div>

        <button className="hero-cta" onClick={() => navigate('/survey/1')}>
          AI 코스 추천받기
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
