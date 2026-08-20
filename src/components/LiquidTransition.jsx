import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '../context/AppState.jsx'

// 화면이 완전히 덮인 지점(애니메이션 진행 기준). 여기서 다음 화면으로 바꿔두면
// 방울이 빠질 때 새 화면이 드러난다.
const NAVIGATE_AT = 1000
// 애니메이션이 아예 돌지 않는 경우를 대비한 최후 보루. 이게 없으면 오버레이가 남는다.
const FALLBACK = 4000

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

    let navTimer = 0
    let navigated = false
    const go = () => {
      if (navigated) return
      navigated = true
      navigate(liquid.to)
    }

    // 넘어가는 시점은 타이머로 부르되, 정말 덮였는지는 애니메이션 진행으로 확인한다.
    // 타이머만 믿으면 탭이 뒤로 갔다 온 경우 아직 덮이지도 않았는데 화면이 바뀐다.
    // 덜 왔으면 남은 만큼 타이머를 다시 건다 — 탭이 숨으면 멈춰버리는 rAF와 달리
    // 타이머는 느려질 뿐 계속 돌아서, 숨은 채로 끝나도 결국 넘어간다.
    const armNavigate = () => {
      const anim = last?.getAnimations?.()[0]
      const at = anim?.currentTime
      if (at == null || at >= NAVIGATE_AT) return go()
      navTimer = setTimeout(armNavigate, Math.max(50, NAVIGATE_AT - at))
    }
    navTimer = setTimeout(armNavigate, NAVIGATE_AT)

    const onEnd = () => {
      go()
      endLiquid()
    }
    last?.addEventListener('animationend', onEnd)
    const fallback = setTimeout(onEnd, FALLBACK)

    return () => {
      clearTimeout(navTimer)
      clearTimeout(fallback)
      last?.removeEventListener('animationend', onEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liquid])

  if (!liquid) return null

  const r = liquid.rect
  // 방울은 누른 버튼 한가운데서 솟아난다.
  const style = {
    '--lq-x': `${r.left + r.width / 2}px`,
    '--lq-y': `${r.top + r.height / 2}px`,
  }

  // body 바로 아래에 띄운다. 화면 전환이 transform을 쓰기 때문에 그 안에 있으면
  // position:fixed의 기준이 화면 요소로 바뀌어 자리가 어긋난다.
  return createPortal(
    <div className="liquid" style={style} ref={rootRef} aria-hidden="true">
      {BLOBS.map((n) => (
        <span key={n} className={`liquid-blob liquid-blob-${n}`} />
      ))}
    </div>,
    document.body,
  )
}
