import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { AppStateProvider, useAppState } from './context/AppState.jsx'
import LiquidTransition from './components/LiquidTransition.jsx'
import Home from './screens/Home.jsx'
import Survey from './screens/Survey.jsx'
import CourseResults from './screens/CourseResults.jsx'
import AiCourse from './screens/AiCourse.jsx'
import CourseDetail from './screens/CourseDetail.jsx'
import MySchedule from './screens/MySchedule.jsx'

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
    </AppStateProvider>
  )
}
