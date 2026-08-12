// 2026 전주세계소리축제 실제 공식 프로그램 일정을 기반으로 구성한 코스.
// 각 공연명·날짜·시간·장소·무료/유료 여부는 sorifestival.com 공식 일정표(2026-08 기준) 그대로입니다.
import { VENUES, haversineKm } from './festival.js'

export const COURSES = [
  {
    id: 'hanok-sori',
    name: '한옥마을 프린지 + 본전당 밤',
    best: true,
    dateLabel: '8월 15일(토)',
    summary: '낮엔 한옥마을 골목 무대, 저녁엔 소리문화의전당 본공연',
    stops: [
      {
        name: '[소리 프린지] 이븐타이드',
        venue: VENUES.daesaseup,
        time: '13:00',
        timeEnd: '13:30',
        free: true,
        desc: '전주대사습청 앞마당에서 열리는 낮 소리프린지의 첫 무대입니다.',
      },
      {
        name: '[소리 프린지] 아쟁앙상블 난새',
        venue: VENUES.daesaseup,
        time: '14:30',
        timeEnd: '15:00',
        free: true,
        desc: '한옥마을 한복판, 전주대사습청에서 이어지는 국악 앙상블 무대.',
      },
      {
        kind: 'cafe',
        name: '교동다원',
        venue: VENUES.gyodongdawon,
        time: '15:10',
        timeEnd: '15:35',
        desc: '20년 넘은 한옥마을 전통 찻집. 대표 메뉴는 발효차인 황차예요. 공연 사이 한옥마을에서 잠깐 쉬어가기 좋아요.',
      },
      {
        kind: 'food',
        name: '삼백집(전주본점)',
        venue: VENUES.samback,
        time: '15:40',
        timeEnd: '16:20',
        desc: '1947년부터 이어진 전주 콩나물국밥 노포. 소리문화의전당으로 이동하기 전 요기하기 좋은 위치예요.',
      },
      {
        name: '[한국×폴란드] 쇼팽&아리랑',
        venue: VENUES.sori,
        hall: '명인홀',
        time: '17:00',
        timeEnd: '18:00',
        free: false,
        desc: '쇼팽과 아리랑을 한 무대에서 잇는 한국×폴란드 협연. 유료 공연이라 사전예매가 필요해요.',
      },
      {
        name: '고창농악 만두레 풍장굿',
        venue: VENUES.sori,
        hall: '놀이마당',
        time: '18:00',
        timeEnd: '19:00',
        free: true,
        desc: '전당 야외 놀이마당에서 열리는 무료 농악 공연.',
      },
      {
        name: '악단광칠',
        venue: VENUES.sori,
        hall: '놀이마당',
        time: '21:00',
        timeEnd: '22:00',
        free: true,
        desc: '놀이마당 무료 공연으로 하루를 마무리합니다.',
      },
    ],
  },
  {
    id: 'sori-frontier',
    name: '판소리·창극의 밤',
    best: false,
    dateLabel: '8월 13일(목)',
    summary: '놀이마당 무료 공연으로 시작해 창극, 심야 소리프론티어까지',
    stops: [
      {
        name: '강릉단오굿',
        venue: VENUES.sori,
        hall: '놀이마당',
        time: '18:00',
        timeEnd: '19:00',
        free: true,
        desc: '국가무형유산 강릉단오굿을 야외 무대에서 무료로 만나요.',
      },
      {
        name: '[캐나다] 재니스 조 리 & 더 큐티즈 밴드',
        venue: VENUES.sori,
        hall: '놀이마당',
        time: '19:00',
        timeEnd: '19:40',
        free: true,
        desc: '해외 아티스트와 국악이 만나는 놀이마당 무료 무대.',
      },
      {
        name: "창작 국악극 '아버지의 해방일지'",
        venue: VENUES.sori,
        hall: '연지홀',
        time: '19:30',
        timeEnd: '21:30',
        free: false,
        desc: '남원시립국악단의 창작 국악극. 유료 공연입니다.',
      },
      {
        name: '[소리 프론티어] 오름새',
        venue: VENUES.woojin,
        time: '22:10',
        timeEnd: '22:40',
        free: true,
        desc: '우진문화공간에서 열리는 심야 무료 무대로 하루를 마무리합니다.',
      },
    ],
  },
  {
    id: 'deokjin-fringe',
    name: '덕진공원 소리프린지',
    best: false,
    dateLabel: '8월 16일(일)',
    summary: '연화정도서관 앞, 한 자리에서 즐기는 무료 버스킹',
    stops: [
      {
        name: '[소리 프린지] 이현',
        venue: VENUES.deokjin,
        time: '13:30',
        timeEnd: '14:00',
        free: true,
        desc: '덕진공원 연화정도서관 앞, 물 위 도서관을 배경으로 하는 무대.',
      },
      {
        name: '[소리 프린지] 미지',
        venue: VENUES.deokjin,
        time: '14:00',
        timeEnd: '14:30',
        free: true,
        desc: '같은 자리에서 이어지는 다음 무대.',
      },
      {
        name: '[소리 프린지] 하프스트링 아띠랑스',
        venue: VENUES.deokjin,
        time: '15:30',
        timeEnd: '16:00',
        free: true,
        desc: '현악 앙상블이 꾸미는 무대.',
      },
      {
        name: '[소리 프린지] 무작판',
        venue: VENUES.deokjin,
        time: '16:30',
        timeEnd: '17:00',
        free: true,
        desc: '해질 무렵 분위기를 살리는 무대.',
      },
      {
        name: '[소리 프린지] 아르미',
        venue: VENUES.deokjin,
        time: '17:00',
        timeEnd: '17:30',
        free: true,
        desc: '이 날의 마지막 무대로 하루를 마무리합니다.',
      },
    ],
  },
  {
    id: 'family-street',
    name: '가족 체험 + 거리공연',
    best: false,
    dateLabel: '8월 14일(금)',
    summary: '낮엔 팔복예술공장 어린이 프로그램, 밤엔 전북대 구정문 버스킹',
    stops: [
      {
        name: "베이비 드라마 '개똥이의 모험'",
        venue: VENUES.palbok,
        time: '10:00',
        timeEnd: '11:00',
        free: false,
        desc: '유아 동반 가족을 위한 공연형 프로그램. 유료 예매가 필요해요.',
      },
      {
        name: "유아특별프로그램 '사라진 소리선을 찾아서'",
        venue: VENUES.palbok,
        time: '13:30',
        timeEnd: '15:10',
        free: false,
        desc: '팔복예술공장에서 진행되는 체험형 유아 프로그램.',
      },
      {
        name: '[월드뮤직 워크숍] 마지카 밴드',
        venue: VENUES.palbok,
        time: '16:00',
        timeEnd: '17:00',
        free: true,
        desc: '한국×이집트 마지카 밴드와 함께하는 무료 워크숍.',
      },
      {
        kind: 'food',
        name: '한국관 본점',
        venue: VENUES.hangukgwan,
        time: '17:30',
        timeEnd: '18:15',
        desc: '1971년부터 이어진 전주비빔밥 노포. 팔복예술공장에서 구정문으로 가는 길에 있어 저녁 식사로 들르기 좋아요.',
      },
      {
        kind: 'cafe',
        name: '메가커피 전북대구정문점',
        venue: VENUES.megacoffee,
        time: '18:30',
        timeEnd: '18:50',
        desc: '구정문 거리공연장 바로 앞 카페. 프린지 시작 전 커피 한 잔 하기 좋아요.',
      },
      {
        name: '[소리 프린지] 오투',
        venue: VENUES.jbnu,
        time: '19:00',
        timeEnd: '19:30',
        free: true,
        desc: '전북대학교 구정문 거리에서 열리는 밤 프린지 무대.',
      },
      {
        name: '[소리 프린지] 박종훈 재즈 트리오',
        venue: VENUES.jbnu,
        time: '20:00',
        timeEnd: '20:30',
        free: true,
        desc: '재즈로 마무리하는 구정문 거리공연.',
      },
    ],
  },
]

export function courseStats(course) {
  const venueKeys = [...new Set(course.stops.map((s) => s.venue.key))]
  const showStops = course.stops.filter((s) => !s.kind)
  const foodStops = course.stops.filter((s) => s.kind === 'food' || s.kind === 'cafe')
  const freeCount = showStops.filter((s) => s.free).length
  let distanceKm = 0
  for (let i = 1; i < course.stops.length; i++) {
    const a = course.stops[i - 1].venue
    const b = course.stops[i].venue
    if (a.key !== b.key) distanceKm += haversineKm(a, b)
  }
  return {
    venueCount: venueKeys.length,
    freeCount,
    stopCount: showStops.length,
    foodCount: foodStops.length,
    distanceKm: Math.round(distanceKm * 10) / 10,
  }
}

export function courseTags(course) {
  const stats = courseStats(course)
  const tags = [
    [`공연 ${stats.stopCount}개`, 'rgba(112,115,124,0.08)', 'rgba(55,56,60,0.61)'],
    [`무료 ${stats.freeCount}개`, '#d9ffe6', '#009632'],
  ]
  if (stats.foodCount > 0) tags.push([`맛집·카페 ${stats.foodCount}곳`, '#fff0e8', '#c94a00'])
  else tags.push([`${stats.venueCount}개 장소`, '#eaf2fe', '#005eeb'])
  return tags
}

export function courseStatRows(course) {
  const stats = courseStats(course)
  return [
    ['이동 거리', stats.distanceKm > 0 ? `${stats.distanceKm}km` : '전당 내부'],
    ['장소', `${stats.venueCount}곳`],
    ['무료 공연', `${stats.freeCount}개`],
  ]
}

// 같은 장소(예: 한국소리문화의전당 내 여러 공연장)에 여러 정류지가 몰릴 때
// 지도에서 겹쳐 클릭할 수 없게 되는 문제를 막기 위해 살짝 원형으로 흩어 놓는다.
// 실제 좌표를 왜곡하지 않도록 반경은 약 40m 이내로 제한.
export function spreadStopPoints(stops) {
  const groups = new Map()
  stops.forEach((s, i) => {
    const key = `${s.venue.lat},${s.venue.lon}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(i)
  })

  return stops.map((s, i) => {
    const key = `${s.venue.lat},${s.venue.lon}`
    const group = groups.get(key)
    const size = group.length
    if (size <= 1) {
      return { lat: s.venue.lat, lon: s.venue.lon, label: i + 1 }
    }
    const j = group.indexOf(i)
    const angle = (2 * Math.PI * j) / size
    const r = 0.00035
    return {
      lat: s.venue.lat + r * Math.sin(angle),
      lon: s.venue.lon + r * Math.cos(angle),
      label: i + 1,
    }
  })
}
