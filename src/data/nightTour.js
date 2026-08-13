// 2026 전주 야간관광 프로그램 — 전주시 공식 관광 사이트(tour.jeonju.go.kr) 안내 기준
// 출처: https://tour.jeonju.go.kr/index.jeonju?menuCd=DOM_000000102007000000
//
// activeDates: 축제 기간(08-12~08-16) 중 실제로 그 프로그램이 열리는 날짜만 나열.
// - 달빛한잔/윤슬마켓/맛있는 전주심야극장: "매주 금·토" 운영 → 08-14(금), 08-15(토)
// - 나이트투어: 윤슬마켓 일정과 연계 진행 → 마찬가지로 08-14, 08-15
// - 야간연회: 실제 운영일이 9~10월(9.4~10.9)뿐이라 축제 기간(8월)에는 해당 없음 → 빈 배열
export const NIGHT_TOUR_EVENTS = [
  {
    id: 'moonlight-pub',
    name: '달빛한잔',
    tag: '#전주천야경 #스트리트펍',
    period: '5.22(금) ~ 11.14(토) · 매주 금·토',
    place: '완판본문화관 및 오목교',
    venue: {
      key: 'wanpanbon',
      name: '완판본문화관',
      address: '전북특별자치도 전주시 완산구 전주천동로 24',
      lat: 35.8118038,
      lon: 127.159205,
    },
    price: '무료입장',
    desc: '전주천의 야경과 함께 즐기는 스트리트 펍',
    image: '/night-tour/night01.jpg',
    activeDates: ['08-14', '08-15'],
  },
  {
    id: 'yunseul-market',
    name: '윤슬마켓',
    tag: '#지역작가 #플리마켓',
    period: '5.22(금) ~ 11.14(토) · 매주 금·토',
    place: '완판본문화관 및 오목교',
    venue: {
      key: 'wanpanbon',
      name: '완판본문화관',
      address: '전북특별자치도 전주시 완산구 전주천동로 24',
      lat: 35.8118038,
      lon: 127.159205,
    },
    price: '무료입장',
    desc: '전주의 지역작가와 함께하는 감성적인 플리마켓',
    image: '/night-tour/night02.jpg',
    activeDates: ['08-14', '08-15'],
  },
  {
    id: 'night-tour-bus',
    name: '나이트투어',
    tag: '#스냅사진 #버스투어',
    period: '야간관광 프로그램 일정과 연계 진행',
    place: '관광명소(덕진공원) - 윤슬마켓 행사장',
    venue: {
      key: 'deokjin',
      name: '덕진공원',
      address: '전북특별자치도 전주시 덕진구 권삼득로 390-1',
      lat: 35.8473769,
      lon: 127.121664,
    },
    price: '1인 5,000원',
    desc: '전주의 관광명소와 야간관광 행사를 연계한 버스투어',
    image: '/night-tour/night03.jpg',
    activeDates: ['08-14', '08-15'],
  },
  {
    id: 'midnight-theater',
    name: '맛있는 전주심야극장',
    tag: '#캠핑장감성 #영화 #음식',
    period: '6.5(금) ~ 11.28(토) · 매주 금·토',
    place: '한옥마을 트래디라운지',
    venue: {
      key: 'tradilounge',
      name: '트래디라운지',
      address: '전북특별자치도 전주시 완산구 어진길 29',
      lat: 35.8171497,
      lon: 127.1497119,
    },
    price: '1인 13,000원',
    desc: '음식과 영화의 도시 전주에서 즐기는 특별한 경험',
    image: '/night-tour/night04.jpg',
    activeDates: ['08-14', '08-15'],
  },
  {
    id: 'night-banquet',
    name: '야간연회',
    tag: '#야간연회 #퓨전공연',
    period: '9.4(금)·9.5(토)·9.19(토) / 10.2(금)~10.4(일)·10.9(금)',
    place: '완판본문화관',
    venue: {
      key: 'wanpanbon',
      name: '완판본문화관',
      address: '전북특별자치도 전주시 완산구 전주천동로 24',
      lat: 35.8118038,
      lon: 127.159205,
    },
    price: '1인 15,000원',
    desc: '판소리·소설·잡가를 현대적으로 재해석한 공연과 셰프의 정찬을 함께 즐기는 디너쇼',
    image: '/night-tour/night05.jpg',
    activeDates: [],
  },
]
