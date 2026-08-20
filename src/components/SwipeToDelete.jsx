import { useRef, useState } from 'react'

const CONFIRM_AT = 80 // 이만큼 왼쪽으로 끌면 삭제 확정
const MAX_DRAG = 116 // 더 끌어도 여기까지만 밀린다

export default function SwipeToDelete({ children, onDelete, label = '삭제' }) {
  const [dx, setDx] = useState(0)
  const [snapping, setSnapping] = useState(false)
  const [height, setHeight] = useState(null)
  const [collapsing, setCollapsing] = useState(false)

  const rootRef = useRef(null)
  const startX = useRef(null)
  const startY = useRef(null)
  const axis = useRef(null) // 'x' | 'y' — 세로 스크롤과 가로 스와이프를 구분

  const beginRemove = () => {
    const el = rootRef.current
    if (!el) return onDelete()
    // 높이를 고정한 뒤 다음 프레임에 0으로 줄여야 트랜지션이 걸린다.
    setHeight(el.offsetHeight)
    setSnapping(true)
    setDx(-el.offsetWidth)
    requestAnimationFrame(() => requestAnimationFrame(() => setCollapsing(true)))
  }

  const onPointerDown = (e) => {
    if (collapsing) return
    startX.current = e.clientX
    startY.current = e.clientY
    axis.current = null
    setSnapping(false)
  }

  const onPointerMove = (e) => {
    if (startX.current == null || collapsing) return
    const moveX = e.clientX - startX.current
    const moveY = e.clientY - startY.current

    if (!axis.current) {
      if (Math.abs(moveX) < 6 && Math.abs(moveY) < 6) return
      axis.current = Math.abs(moveX) > Math.abs(moveY) ? 'x' : 'y'
      if (axis.current === 'x') e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    if (axis.current !== 'x') return

    setDx(Math.max(Math.min(0, moveX), -MAX_DRAG))
  }

  const onPointerUp = () => {
    if (collapsing) return
    const swiped = axis.current === 'x'
    startX.current = null
    axis.current = null
    if (swiped && dx <= -CONFIRM_AT) {
      beginRemove()
      return
    }
    setSnapping(true)
    setDx(0)
  }

  // 높이 트랜지션이 끝나는 시점에 실제로 목록에서 제거한다.
  const onTransitionEnd = (e) => {
    if (e.propertyName === 'height' && collapsing) onDelete()
  }

  return (
    <div
      ref={rootRef}
      className={`swipe-item ${collapsing ? 'is-collapsing' : ''}`}
      style={height != null ? { height: collapsing ? 0 : height } : undefined}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="swipe-bg" aria-hidden="true">
        <span className="swipe-bg-label">{label}</span>
      </div>
      <div
        // 미는 중에는 카드가 눌린 것처럼 작아지면 안 된다(누르는 반응과 스와이프가 겹친다).
        className={`swipe-fg ${snapping ? 'is-snapping' : ''} ${dx !== 0 ? 'is-dragging' : ''}`}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        // 스와이프 도중 카드가 눌리는 걸 막는다(선택 토글 방지).
        onClickCapture={(e) => {
          if (dx !== 0) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
