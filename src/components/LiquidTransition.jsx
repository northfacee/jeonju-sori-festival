import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'

// 화면이 완전히 덮인 지점(애니메이션 진행 기준). 여기서 다음 화면으로 바꿔두면
// 방울이 빠질 때 새 화면이 드러난다.
// 이 값은 CSS의 .liquid-cue 길이와 같아야 한다.
const NAVIGATE_AT = 2050
// 애니메이션이 아예 돌지 않는 경우를 대비한 최후 보루. 이게 없으면 오버레이가 남는다.
const FALLBACK = 5300

// 크기와 방향이 조금씩 다른 방울들이 겹쳐서 퍼진다. 같은 색이라 겹친 자리는 안 보이고,
// 뭉친 덩어리의 가장자리만 울퉁불퉁하게 남아 액체처럼 읽힌다.
const BLOBS = [1, 2, 3, 4, 5]

export default function LiquidTransition() {
  const navigate = useNavigate()
  const { liquid, endLiquid } = useAppState()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!liquid) return
    // 가장 늦게까지 남는 방울. 이게 끝나면 연출이 끝난 것이다.
    const last = rootRef.current?.querySelector('.liquid-blob-1')

    let navigated = false
    const go = () => {
      if (navigated) return
      navigated = true
      navigate(liquid.to)
    }

    // 넘어가는 시점은 타이머가 아니라 "신호용 요소"의 애니메이션이 끝나는 순간으로 잡는다.
    // 그 애니메이션은 방울과 같은 타임라인을 타므로, 브라우저가 탭을 뒤로 돌려 전체가
    // 느려져도 화면이 덮인 시점과 정확히 같이 온다. 타이머로 재면 백그라운드에서
    // 최소 1초로 묶여버려서, 다시 걸수록 오히려 뒤로 밀린다.
    const cue = rootRef.current?.querySelector('.liquid-cue')
    cue?.addEventListener('animationend', go)

    const onEnd = () => {
      go()
      endLiquid()
    }
    last?.addEventListener('animationend', onEnd)
    const fallback = setTimeout(onEnd, FALLBACK)

    return () => {
      clearTimeout(fallback)
      cue?.removeEventListener('animationend', go)
      last?.removeEventListener('animationend', onEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquid])

  if (!liquid) return null

  const r = liquid.rect
  // 방울은 누른 버튼 한가운데서 솟아나고, 도입부의 테두리 빛은 버튼 자리에 그대로 겹친다.
  const style = {
    '--lq-x': `${r.left + r.width / 2}px`,
    '--lq-y': `${r.top + r.height / 2}px`,
    '--lq-left': `${r.left}px`,
    '--lq-top': `${r.top}px`,
    '--lq-w': `${r.width}px`,
    '--lq-h': `${r.height}px`,
  }

  // body 바로 아래에 띄운다. 화면 전환이 transform을 쓰기 때문에 그 안에 있으면
  // position:fixed의 기준이 화면 요소로 바뀌어 자리가 어긋난다.
  return createPortal(
    <div className="liquid" style={style} ref={rootRef} aria-hidden="true">
      {BLOBS.map((n) => (
        <span key={n} className={`liquid-blob liquid-blob-${n}`} />
      ))}
      {/* 누른 버튼 테두리가 먼저 밝아지고, 그 자리에서 방울이 솟는다. */}
      <span className="liquid-glow" />
      {/* 안 보이는 신호용. 이 애니메이션이 끝나는 순간이 "화면이 덮였다"는 뜻이다. */}
      <span className="liquid-cue" />
    </div>,
    document.body,
  )
}
