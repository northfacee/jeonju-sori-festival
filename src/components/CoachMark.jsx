import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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

    let settled = 0
    let prev = null
    let centered = false

    // 안내가 뜬 동안에는 화면을 붙잡아둔다. 손가락으로 밀리면 스포트라이트와 말풍선이
    // 같이 따라다녀서 읽는 중에 화면이 출렁인다.
    // overflow를 막는 대신 제스처만 막는다 — overflow를 끄면 스크롤바가 사라지며
    // 폭이 바뀌어 스포트라이트가 어긋나고, 코드로 옮기는 스크롤도 같이 막힌다.
    const blockScroll = (e) => e.preventDefault()
    window.addEventListener('wheel', blockScroll, { passive: false })
    window.addEventListener('touchmove', blockScroll, { passive: false })

    const measure = () => {
      const el = document.querySelector(targetSelector)
      if (el) {
        // 대상을 화면 가운데로 끌어온 다음에 자리를 잰다. 아래쪽에 있는 대상을
        // 그대로 두면 말풍선이 화면 밖으로 밀려 잘린다.
        if (!centered) {
          centered = true
          el.scrollIntoView({ block: 'center', behavior: 'instant' })
        }
        const r = el.getBoundingClientRect()
        // 화면 밖이면 아직 렌더가 덜 된 것으로 보고 조금 더 기다린다.
        if (r.width > 0 && r.height > 0) {
          const next = { top: r.top, left: r.left, width: r.width, height: r.height }
          // 화면 전환 애니메이션이 도는 중에 한 번 재고 끝내면, 밀려 있던 위치를
          // 그대로 붙잡아 스포트라이트가 대상에서 어긋난다. 몇 프레임 연속 같은
          // 자리로 나올 때까지 계속 다시 잰다.
          const same =
            prev && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.left - next.left) < 0.5
          if (!same) setRect(next)
          settled = same ? settled + 1 : 0
          prev = next
          if (settled >= 3) return
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
    // 화면 전환은 끝자락에서 아주 조금씩 움직여서, 프레임 비교만으로는 1px쯤 남기고
    // "멈췄다"고 판단해버린다. 끝나는 순간 한 번 더 재서 정확히 맞춘다.
    window.addEventListener('animationend', onChange, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('animationend', onChange, true)
      window.removeEventListener('wheel', blockScroll)
      window.removeEventListener('touchmove', blockScroll)
      // 안내가 끝나면 맨 위로 돌려놓는다. 뒤에 다른 안내가 이어지는 경우에는
      // 그쪽이 곧바로 자기 대상으로 다시 옮기는데, 둘 다 화면에 그려지기 전에
      // 끝나므로 맨 위로 갔다 오는 중간 모습은 보이지 않는다.
      window.scrollTo({ top: 0, behavior: 'instant' })
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

  // body 바로 아래에 띄운다. 화면 전환 애니메이션처럼 위쪽 요소에 transform이 걸리면
  // position:fixed의 기준이 그 요소로 바뀌어 스포트라이트가 엉뚱한 데를 비춘다.
  return createPortal(
    <div className="coach" onClick={onClose} role="dialog" aria-label={title}>
      <div className="coach-spot" style={spot} />
      <div className={`coach-bubble ${below ? 'is-below' : 'is-above'}`} style={bubbleStyle}>
        <div className="coach-title">{title}</div>
        <div className="coach-desc">{description}</div>
        <button className="coach-btn" onClick={onClose}>
          알겠어요
        </button>
      </div>
    </div>,
    document.body,
  )
}
