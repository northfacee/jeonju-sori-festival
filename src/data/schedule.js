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
  const stops = aiCourse.days.flatMap((day) => day.stops)
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

// 아직 체크하지 않은 첫 정류지 = 다음 일정.
export function nextStopOf(course, doneKeys) {
  const index = course.stops.findIndex((stop, i) => !doneKeys.includes(stopKey(course.id, stop, i)))
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
