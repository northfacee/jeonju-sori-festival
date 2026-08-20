import { Routes, Route, Navigate, useLocation, useNavigationType } from 'react-router-dom'
import { AppStateProvider } from './context/AppState.jsx'
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

  return (
    <div key={location.pathname} className={`route-view ${back ? 'is-back' : ''}`}>
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
    </AppStateProvider>
  )
}
