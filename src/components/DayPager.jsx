import { useLayoutEffect, useRef, useState } from 'react'

const CHANGE_AT = 56 // 이만큼 끌면 옆 페이지로 넘어간다
const EDGE_RESISTANCE = 0.32 // 첫/마지막 페이지에서 더 끌 때의 저항

export default function DayPager({ index, count, onChange, children }) {
  const [dx, setDx] = useState(0)
  const [snapping, setSnapping] = useState(false)
  const [height, setHeight] = useState(null)

  const viewportRef = useRef(null)
  const pageRefs = useRef([])
  const startX = useRef(null)
  const startY = useRef(null)
  const axis = useRef(null)

  // 페이지마다 정류지 수가 달라서, 보이는 페이지 높이에 뷰포트를 맞춘다.
  useLayoutEffect(() => {
    const el = pageRefs.current[index]
    if (el) setHeight(el.offsetHeight)
  }, [index, children])

  const onPointerDown = (e) => {
    if (count <= 1) return
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
          // 합성 이벤트 등으로 캡처가 안 되어도 드래그 자체는 계속 동작한다.
        }
      }
    }
    if (axis.current !== 'x') return

    // 양 끝에서는 저항을 줘서 더 끌리지 않는 느낌을 준다.
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
      if (next >= 0 && next < count) onChange(next)
    }
    setDx(0)
  }

  return (
    <div
      ref={viewportRef}
      className="day-pager-viewport"
      style={height != null ? { height } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={`day-pager-track ${snapping ? 'is-snapping' : ''}`}
        style={{ transform: `translateX(calc(${-index * 100}% + ${dx}px))` }}
      >
        {children.map((page, i) => (
          <div
            key={i}
            className="day-pager-page"
            ref={(el) => (pageRefs.current[i] = el)}
            aria-hidden={i !== index}
          >
            {page}
          </div>
        ))}
      </div>
    </div>
  )
}
