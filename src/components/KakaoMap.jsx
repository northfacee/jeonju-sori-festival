import { useEffect, useRef, useState } from 'react'

const APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY

let sdkPromise = null
function loadKakaoMaps(appKey) {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve(window.kakao)
      return
    }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao))
    script.onerror = () => reject(new Error('카카오맵 SDK 로드에 실패했습니다'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

function pinElement(label, selected) {
  const el = document.createElement('div')
  el.style.cssText = `width:26px;height:26px;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;cursor:pointer;background:${
    selected ? '#3366ff' : '#fff'
  };color:${selected ? '#fff' : 'rgba(55,56,60,0.61)'};border:1.5px solid ${
    selected ? '#3366ff' : 'rgba(112,115,124,0.35)'
  };box-shadow:0 2px 6px rgba(0,0,0,0.18)`
  el.textContent = String(label)
  return el
}

function dotElement() {
  const el = document.createElement('div')
  el.style.cssText =
    'width:14px;height:14px;border-radius:999px;background:#3366ff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)'
  return el
}

export default function KakaoMap({ points, selectedIndex, onSelect, height = 200, interactive = true, variant = 'pin' }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const [status, setStatus] = useState(APP_KEY ? 'loading' : 'missing-key')

  useEffect(() => {
    if (!APP_KEY || !containerRef.current) return
    let cancelled = false
    loadKakaoMaps(APP_KEY)
      .then((kakao) => {
        if (cancelled || !containerRef.current) return
        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(points[0].lat, points[0].lon),
          level: variant === 'preview' ? 6 : 5,
        })
        map.setDraggable(interactive)
        map.setZoomable(interactive)
        mapRef.current = map
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'ready' || !window.kakao || !mapRef.current) return
    const kakao = window.kakao
    const map = mapRef.current

    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    const positions = points.map((p) => new kakao.maps.LatLng(p.lat, p.lon))
    points.forEach((p, i) => {
      const el = variant === 'preview' ? dotElement() : pinElement(p.label ?? i + 1, selectedIndex === i)
      if (onSelect) el.addEventListener('click', () => onSelect(i))
      const overlay = new kakao.maps.CustomOverlay({
        position: positions[i],
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    })

    if (positions.length > 1) {
      const bounds = new kakao.maps.LatLngBounds()
      positions.forEach((pos) => bounds.extend(pos))
      map.setBounds(bounds, 40, 40, 40, 40)
    } else {
      map.setCenter(positions[0])
    }
  }, [status, points, selectedIndex, onSelect, variant])

  if (!APP_KEY) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: 'center',
          justifyContent: 'center',
          background: '#eef0f3',
          color: 'rgba(55,56,60,0.61)',
          fontSize: 12,
          fontWeight: 500,
          textAlign: 'center',
          padding: 12,
        }}
      >
        <span>카카오맵 API 키가 설정되지 않았어요</span>
        <span>.env의 VITE_KAKAO_MAP_KEY를 채워주세요</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#eef0f3',
          color: 'rgba(55,56,60,0.61)',
          fontSize: 12,
          textAlign: 'center',
          padding: 12,
        }}
      >
        지도를 불러오지 못했어요. 카카오 디벨로퍼스에 이 도메인이 등록되어 있는지 확인해주세요.
      </div>
    )
  }

  return <div ref={containerRef} style={{ height, width: '100%' }} />
}
