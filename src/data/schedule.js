// 내 일정에 저장되는 코스의 공통 형태와, 저장/진행 상태를 다루는 헬퍼.
// 목업 코스(COURSES)와 AI 생성 코스는 원본 모양이 달라서 여기서 하나로 맞춘다.

function slugify(text) {
  return String(text)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣-]/g, '')
    .slice(0, 40)
}

// 목업 코스 stop에는 id가 없어서 인덱스를 섞어 안정적인 키를 만든다.
export function stopKey(courseId, stop, index) {
  return `${courseId}::${stop.id || `${index}-${stop.name}`}`
}

export function courseFromMock(course) {
  return {
    id: course.id,
    name: course.name,
    dateLabel: course.dateLabel,
    summary: course.summary,
    stops: course.stops,
    source: 'mock',
  }
}

export function courseFromAi(aiCourse) {
  const stops = aiCourse.days.flatMap((day) => day.stops.map(effectiveStop))
  const dates = aiCourse.days.map((day) => day.date).join('_')
  return {
    id: `ai-${slugify(aiCourse.title)}-${dates}`,
    name: aiCourse.title,
    dateLabel: aiCourse.days.map((day) => day.dateLabel).join(' · '),
    summary: aiCourse.reason,
    stops,
    source: 'ai',
  }
}

// 소상공인 홍보 가게를 고른 정류지는 그 가게가 실제 일정이 된다.
// 카드에는 양쪽을 다 보여줘야 해서 원본은 그대로 두고, 지도·저장·길찾기처럼
// "한 곳"이 필요한 곳에서만 이걸로 바꿔 쓴다.
export function effectiveStop(stop) {
  if (!stop.promo || stop.chosen !== 'promo') return stop
  const p = stop.promo
  return {
    ...stop,
    name: p.name,
    venue: { key: stop.venue?.key, name: p.name, address: p.address, lat: p.lat, lon: p.lon },
    desc: p.desc,
  }
}

// 날짜별로 묶는다. 목업 코스 stop에는 날짜가 없어서 그럴 땐 한 묶음이 된다.
// items의 index는 course.stops 기준 원래 위치 — stopKey가 어긋나지 않게 유지해야 한다.
export function groupByDay(course) {
  const groups = []
  const byKey = new Map()

  course.stops.forEach((stop, index) => {
    const key = stop.date || stop.dateLabel || '__single__'
    if (!byKey.has(key)) {
      const group = { key, label: stop.dateLabel || course.dateLabel || '', items: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    byKey.get(key).items.push({ stop, index })
  })

  return groups
}

// 다음 일정 = 마지막으로 체크한 곳보다 뒤에 있는, 아직 체크하지 않은 첫 정류지.
//
// 그냥 "체크 안 한 첫 정류지"로 잡으면 안 된다. 17시를 건너뛰고 18시를 다녀온
// 사람에게 17시가 계속 다음 일정으로 남는다. 뒤엣것을 체크했다는 건 앞엣것은
// 이미 지나갔다는 뜻이다.
//
// 뒤에 남은 게 없으면(마지막 것을 먼저 체크한 경우) 앞으로 돌아가 못 한 것 중
// 가장 이른 것을 집는다. 그러지 않으면 하나 체크했는데 다 끝난 것처럼 보인다.
export function nextStopOf(course, doneKeys) {
  const done = course.stops.map((stop, i) => doneKeys.includes(stopKey(course.id, stop, i)))
  const lastDone = done.lastIndexOf(true)
  const after = done.findIndex((isDone, i) => i > lastDone && !isDone)
  const index = after !== -1 ? after : done.indexOf(false)
  return index === -1 ? null : { stop: course.stops[index], index }
}

export function progressOf(course, doneKeys) {
  const done = course.stops.filter((stop, i) => doneKeys.includes(stopKey(course.id, stop, i))).length
  const total = course.stops.length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

// 카카오맵 길찾기 딥링크. 좌표가 없으면 이름으로만 검색되게 둔다.
export function directionsUrl(stop) {
  const venue = stop.venue || {}
  const name = encodeURIComponent(venue.name || stop.name)
  if (venue.lat != null && venue.lon != null) {
    return `https://map.kakao.com/link/to/${name},${venue.lat},${venue.lon}`
  }
  return `https://map.kakao.com/link/search/${name}`
}
