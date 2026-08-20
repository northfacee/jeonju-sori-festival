import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
  // 카드 폭은 CSS가 정하므로 여기서 비율을 다시 쓰지 않고 직접 잰다. 양쪽에 적어두면
  // CSS만 고쳤을 때 카드가 어긋난다.
  const viewportRef = useRef(null)
  const slideRef = useRef(null)
  const [size, setSize] = useState({ viewportW: 0, slideW: 0 })

  useLayoutEffect(() => {
    const vp = viewportRef.current
    const slide = slideRef.current
    if (!vp || !slide) return
    const measure = () => setSize({ viewportW: vp.clientWidth, slideW: slide.offsetWidth })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(vp)
    ro.observe(slide)
    return () => ro.disconnect()
  }, [])

  // 영상은 한 편에 1MB가 넘는다. 처음부터 다 받으면 홈 화면 진입만으로 데이터를 크게 쓰니
  // 실제로 본 카드만 받는다. 안 받은 카드는 포스터 사진이 대신 보여서 티가 나지 않는다.
  const [fetched, setFetched] = useState(() => new Set([HERO_CARDS[0].id]))
  useEffect(() => {
    const id = HERO_CARDS[index].id
    setFetched((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [index])

  // 보이는 카드의 영상만 재생한다. 안 보이는 영상까지 돌면 발열·배터리만 잡아먹는다.
  const videoRefs = useRef({})
  useEffect(() => {
    const sync = () => {
      Object.entries(videoRefs.current).forEach(([id, el]) => {
        if (!el) return
        if (id !== HERO_CARDS[index].id || document.hidden) {
          el.pause()
          return
        }
        // React가 muted를 속성으로만 넣는 경우가 있어 직접 켠다. 음소거가 아니면 자동재생이 막힌다.
        el.muted = true
        // 저전력 모드처럼 브라우저가 재생을 막으면 포스터가 그대로 남는다. 실패는 그냥 둔다.
        el.play().catch(() => {})
      })
    }

    sync()
    // 브라우저는 탭을 가리거나 앱을 벗어나면 영상을 자기 마음대로 멈춘다.
    // 그대로 두면 돌아왔을 때 정지 화면이라, 다시 보일 때 직접 이어준다.
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
    // fetched도 봐야 한다. 처음 넘어간 카드는 src가 이 다음 렌더에 붙어서,
    // index만 보면 src 없는 영상에 play()를 걸고 끝나버린다.
  }, [index, fetched])

  const count = HERO_CARDS.length
  const { viewportW, slideW } = size
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
              <div
                key={card.id}
                ref={i === 0 ? slideRef : null}
                className={`hero-slide ${i === index ? 'is-active' : ''}`}
              >
                <div className="hero-card">
                  {card.video ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[card.id] = el
                      }}
                      className="hero-card-img hero-card-video"
                      // src를 아직 안 붙인 카드는 포스터만 보인다. 넘겨서 보는 순간 받기 시작한다.
                      src={fetched.has(card.id) ? card.video : undefined}
                      poster={card.image}
                      muted
                      loop
                      playsInline
                      preload="auto"
                      aria-label={card.title}
                    />
                  ) : (
                    <img className="hero-card-img" src={card.image} alt={card.title} draggable="false" />
                  )}
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
