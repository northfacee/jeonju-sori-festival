// 2026 전주세계소리축제 (제25회) — 실제 공식 정보 기반
// 출처: sorifestival.com 공식 프로그램 일정, 한국소리문화의전당(sori21.co.kr),
//       위키백과 "한국소리문화의전당", OpenStreetMap Nominatim 지오코딩

export const VENUES = {
  sori: {
    key: 'sori',
    name: '한국소리문화의전당',
    address: '전북특별자치도 전주시 덕진구 소리로 31',
    lat: 35.8556538,
    lon: 127.1384931,
  },
  daesaseup: {
    key: 'daesaseup',
    name: '전주대사습청',
    address: '전북특별자치도 전주시 완산구 한지길 56',
    lat: 35.8165,
    lon: 127.1538,
  },
  woojin: {
    key: 'woojin',
    name: '우진문화공간',
    address: '전북특별자치도 전주시 덕진구 전주천동로 376',
    lat: 35.8360688,
    lon: 127.1298383,
  },
  deokjin: {
    key: 'deokjin',
    name: '덕진공원 연화정도서관',
    address: '전북특별자치도 전주시 덕진구 권삼득로 390-1',
    lat: 35.8473769,
    lon: 127.121664,
  },
  palbok: {
    key: 'palbok',
    name: '팔복예술공장',
    address: '전북특별자치도 전주시 덕진구 구렛들1길 46',
    lat: 35.8574188,
    lon: 127.1056379,
  },
  jbnu: {
    key: 'jbnu',
    name: '전북대학교 구정문',
    address: '전북특별자치도 전주시 덕진구 명륜4길 일대',
    lat: 35.8435,
    lon: 127.1266,
  },
  // 코스 이동 구간에 넣는 실제 식당·카페 (전부 실주소 기반)
  samback: {
    key: 'samback',
    name: '삼백집(전주본점)',
    address: '전북특별자치도 전주시 완산구 고사동 455-2',
    lat: 35.8205,
    lon: 127.1445,
  },
  gyodongdawon: {
    key: 'gyodongdawon',
    name: '교동다원',
    address: '전북특별자치도 전주시 완산구 은행로 65-5',
    lat: 35.8165,
    lon: 127.1525,
  },
  hangukgwan: {
    key: 'hangukgwan',
    name: '한국관 본점',
    address: '전북특별자치도 전주시 덕진구 기린대로 425',
    lat: 35.8380882,
    lon: 127.1327534,
  },
  megacoffee: {
    key: 'megacoffee',
    name: '메가커피 전북대구정문점',
    address: '전북특별자치도 전주시 덕진구 명륜4길 23',
    lat: 35.8435,
    lon: 127.1264,
  },
}

export const FESTIVAL = {
  name: '2026 전주세계소리축제',
  edition: '제25회',
  theme: '소리의 숨결, 모아 판으로',
  dateLabel: '8월 12일(수) – 8월 16일(일)',
  programLabel: '8개 분야 66개 프로그램 · 126회 공연',
  ticketLabel: '무료 공연 다수 · 유료 공연은 인터파크 사전예매',
  pickupPolicy:
    '사전예매 관객은 공연 시작 2시간 전부터 공연이 열리는 공연장에서 예매번호와 신분증을 확인한 뒤 티켓을 받을 수 있습니다.',
  venue: VENUES.sori,
}

export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const c = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  return Math.round(2 * R * Math.asin(Math.sqrt(c)) * 10) / 10
}
