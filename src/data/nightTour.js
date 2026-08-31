// 2026 전주 야간관광 프로그램 — 전주시 공식 관광 사이트(tour.jeonju.go.kr) 안내 기준
// 출처: https://tour.jeonju.go.kr/index.jeonju?menuCd=DOM_000000102007000000
//
// activeDates: 축제별로, 그 축제 기간 중 실제로 이 프로그램이 열리는 날짜.
// 야간관광은 5~11월 내내 도니 축제마다 겹치는 날이 다르다.
//   소리축제 08-12~08-16 → 금·토는 08-14, 08-15
//   독서대전 09-11~09-13 → 금·토는 09-11, 09-12
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
    desc: '전주천 야경 보면서 술과 스낵을 즐기는 야외 펍. 음악도 함께 흐른다.',
    image: '/night-tour/night01.jpg',
    activeDates: { sori: ['08-14', '08-15'], bookfair: ['09-11', '09-12'] },
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
    desc: '전주천변에서 지역 작가의 수공예 소품과 굿즈를 파는 플리마켓.',
    image: '/night-tour/night02.jpg',
    activeDates: { sori: ['08-14', '08-15'], bookfair: ['09-11', '09-12'] },
  },
  {
    id: 'night-tour-bus',
    name: '나이트투어',
    tag: '#스냅사진 #버스투어',
    period: '야간관광 프로그램 일정과 연계 진행',
    place: '덕진공원 → 윤슬마켓 행사장',
    venue: {
      key: 'deokjin',
      name: '덕진공원',
      address: '전북특별자치도 전주시 덕진구 권삼득로 390-1',
      lat: 35.8473769,
      lon: 127.121664,
    },
    price: '1인 5,000원',
    desc: '덕진공원을 걸으며 스냅사진을 찍고 행사장까지 데려다주는 버스투어.',
    image: '/night-tour/night03.jpg',
    activeDates: { sori: ['08-14', '08-15'], bookfair: ['09-11', '09-12'] },
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
    desc: '캠핑장처럼 꾸민 한옥에서 영화와 음식을 함께. 상영작은 달마다 바뀐다.',
    image: '/night-tour/night04.jpg',
    activeDates: { sori: ['08-14', '08-15'], bookfair: ['09-11', '09-12'] },
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
    desc: '판소리·잡가를 현대적으로 풀어낸 공연에 셰프의 정찬이 함께 나오는 디너쇼.',
    image: '/night-tour/night05.jpg',
    activeDates: { sori: [], bookfair: [] },
  },
]
