import { useEffect, useState } from 'react'

const SPOT_PAD = 6
const BUBBLE_H = 170 // 아래/위 중 어디에 띄울지 판단할 때 쓰는 대략 높이

/**
 * 대상 요소를 스포트라이트로 비추고 설명 말풍선을 띄우는 코치마크.
 * 대상은 selector로 찾는다(중간 컴포넌트를 거쳐 ref를 넘기지 않으려고).
 */
export default function CoachMark({ targetSelector, title, description, onClose }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    let raf = 0
    let tries = 0

    const measure = () => {
      const el = document.querySelector(targetSelector)
      if (el) {
        const r = el.getBoundingClientRect()
        // 화면 밖이면 아직 렌더가 덜 된 것으로 보고 조금 더 기다린다.
        if (r.width > 0 && r.height > 0) {
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
          return
        }
      }
      if (tries++ < 90) raf = requestAnimationFrame(measure)
    }

    measure()
    const onChange = () => {
      const el = document.querySelector(targetSelector)
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [targetSelector])

  if (!rect) return null

  const spot = {
    top: rect.top - SPOT_PAD,
    left: rect.left - SPOT_PAD,
    width: rect.width + SPOT_PAD * 2,
    height: rect.height + SPOT_PAD * 2,
  }

  // 아래 공간이 모자라면 대상 위쪽에 띄운다.
  const below = spot.top + spot.height + BUBBLE_H < window.innerHeight
  const bubbleStyle = below
    ? { top: spot.top + spot.height + 12 }
    : { bottom: window.innerHeight - spot.top + 12 }

  // 앱이 480px 폭 가운데 정렬이라 말풍선도 그 폭에 맞춘다.
  const screen = document.querySelector('.screen')?.getBoundingClientRect()
  if (screen) {
    bubbleStyle.left = screen.left + 20
    bubbleStyle.width = screen.width - 40
  } else {
    bubbleStyle.left = 20
    bubbleStyle.right = 20
  }

  return (
    <div className="coach" onClick={onClose} role="dialog" aria-label={title}>
      <div className="coach-spot" style={spot} />
      <div className={`coach-bubble ${below ? 'is-below' : 'is-above'}`} style={bubbleStyle}>
        <div className="coach-title">{title}</div>
        <div className="coach-desc">{description}</div>
        <button className="coach-btn" onClick={onClose}>
          알겠어요
        </button>
      </div>
    </div>
  )
}
