// 홈 히어로 캐러셀에 쓰는 카드. bg는 블러 배경 전용 축소본(원본을 흐리면 모바일에서 무겁다).
// video가 있는 카드는 사진 대신 영상을 재생하고, image는 그때 포스터(자동재생 실패 시 화면)로 쓰인다.
export const HERO_CARDS = [
  {
    id: 'bookfair',
    title: '제9회 전주독서대전',
    subtitle: '달려라 책',
    meta: '9월 11일(금) ~ 9월 13일(일) · 전주한벽문화관·완판본문화관 일원',
    // 사진이 아니라 포스터다. 잘라내면 로고와 주최 정보가 날아가므로 통째로 보여준다.
    poster: true,
    image: '/hero/bookfair.jpg',
    bg: '/hero/bookfair-bg.jpg',
  },
  {
    id: 'sori',
    title: '2026 전주세계소리축제',
    subtitle: '소리의 숨결, 모아 판으로',
    meta: '8월 12일(수) ~ 8월 16일(일) · 한국소리문화의전당',
    video: '/hero/sori.mp4',
    image: '/hero/sori-video-poster.jpg',
    bg: '/hero/sori-video-bg.jpg',
  },
  {
    id: 'gunsan',
    title: '2026 군산 국가유산 야행',
    subtitle: '근대 문화유산 빛의 거리를 걷다',
    meta: '8월 14일(금) ~ 8월 22일(토) · 군산 원도심 일원',
    video: '/hero/gunsan.mp4',
    image: '/hero/gunsan-video-poster.jpg',
    bg: '/hero/gunsan-video-bg.jpg',
  },
  {
    id: 'muju',
    title: '무주 반딧불이',
    subtitle: '여름밤 반딧불이가 내려앉는 곳',
    meta: '무주 반디랜드 일원',
    image: '/hero/muju.jpg',
    bg: '/hero/muju-bg.jpg',
  },
]
