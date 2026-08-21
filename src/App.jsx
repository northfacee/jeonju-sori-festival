import { useLayoutEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AppStateProvider, useAppState } from './context/AppState.jsx'
import LiquidTransition from './components/LiquidTransition.jsx'
import Home from './screens/Home.jsx'
import Survey from './screens/Survey.jsx'
import CourseResults from './screens/CourseResults.jsx'
import AiCourse from './screens/AiCourse.jsx'
import CourseDetail from './screens/CourseDetail.jsx'
import MySchedule from './screens/MySchedule.jsx'

// 주소에 값이 박히는 화면들. /survey/1..6은 한 화면이라 속도를 잴 때는 하나로 묶는다.
// 여기 없는 주소는 주소 그대로 잡힌다 — 잘게 쪼개질 뿐 틀리게 세지는 않는다.
const ROUTE_PATTERNS = [
  [/^\/survey\/[^/]+$/, '/survey/[step]'],
  [/^\/course\/[^/]+$/, '/course/[id]'],
]

// Vercel 계측. 화면에 아무것도 그리지 않는다.
function Insights() {
  const { pathname } = useLocation()
  const route = ROUTE_PATTERNS.find(([re]) => re.test(pathname))?.[1] ?? pathname

  return (
    <>
      {/* 방문 수는 주소를 그대로 센다. 질문 여섯 개가 따로 잡혀야
          몇 번째에서 그만두는지가 보인다. */}
      <Analytics />
      {/* 속도는 반대로 묶는다. 같은 화면이 여섯 줄로 쪼개지면 줄마다 표본이 적어
          수치를 믿기 어렵다. */}
      <SpeedInsights route={route} />
    </>
  )
}

// 화면이 바뀔 때마다 새로 그려지도록 경로를 key로 준다. 그래야 등장 애니메이션이 다시 돈다.
// 뒤로 갈 때는 들어온 반대 방향에서 나와야 앞뒤 관계가 몸에 익는다.
function RoutedScreen() {
  const location = useLocation()
  const back = useNavigationType() === 'POP'
  const { liquid } = useAppState()

  // 연출이 도는 중에는 화면이 옆으로 밀려 들어오면 안 된다. 방울 밑에서
  // 두 가지가 같이 움직이면 지저분하다.
  //
  // 설문은 좌우로 밀지 않는다. 문항 사이는 "다른 화면으로 갔다"가 아니라
  // "같은 자리에서 한 장 넘겼다"라서, 머리(진행 칸·제목줄)는 두고 본문만
  // 위아래로 움직인다. 그 연출은 Survey 화면이 직접 갖고 있다.
  const isSurvey = location.pathname.startsWith('/survey')

  // 화면이 바뀌면 맨 위에서 시작한다. 그냥 두면 앞 화면에서 내려둔 만큼을 그대로
  // 물려받아서, 새 화면의 중간이 첫 화면으로 보인다(코스 화면에서 873px 내려간 뒤
  // 내 일정으로 가면 521px 자리에서 열렸다).
  // 그리기 전에 옮겨야 잘못된 자리가 한 프레임 비치지 않으므로 layout 효과를 쓴다.
  // 코치마크는 이 다음 프레임에 자기 대상으로 다시 옮기므로 서로 부딪히지 않는다.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const cls = ['route-view', back ? 'is-back' : '', liquid ? 'is-covered' : '', isSurvey ? 'is-survey' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div key={location.pathname} className={cls}>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        {/* 히어로 화면을 시험하던 주소. 그동안 열어보던 링크가 빈 화면이 되지 않게 넘겨준다. */}
        <Route path="/home-test" element={<Navigate to="/" replace />} />
        <Route path="/survey/:step" element={<Survey />} />
        <Route path="/results" element={<CourseResults />} />
        <Route path="/ai-course" element={<AiCourse />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/schedule" element={<MySchedule />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <div className="app-shell">
        <RoutedScreen />
      </div>
      {/* 화면 전환보다 오래 살아야 해서 route 바깥에 둔다. */}
      <LiquidTransition />
      <Insights />
    </AppStateProvider>
  )
}
