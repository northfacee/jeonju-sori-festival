// 앱이 다룰 축제 목록. 프로그램 데이터는 서버가 들고 있고(backend/app/data),
// 여기에는 화면에서 고를 때 필요한 것만 둔다.
//
// key는 서버의 축제 이름과 같아야 한다(backend/app/services/festival_data.py의 FESTIVALS).
export const FESTIVALS = [
  {
    key: 'bookfair',
    name: '제9회 전주독서대전',
    short: '독서대전',
    dateLabel: '9월 11일(금) ~ 9월 13일(일)',
    place: '전주한벽문화관 일원',
    // 야간관광 프로그램이 없는 축제는 설문에서 그 질문을 건너뛴다.
    hasNightTour: false,
  },
  {
    key: 'sori',
    name: '2026 전주세계소리축제',
    short: '소리축제',
    dateLabel: '8월 12일(수) ~ 8월 16일(일)',
    place: '한국소리문화의전당',
    hasNightTour: true,
  },
]

export const DEFAULT_FESTIVAL = FESTIVALS[0].key

export function festivalOf(key) {
  return FESTIVALS.find((f) => f.key === key) || FESTIVALS[0]
}
