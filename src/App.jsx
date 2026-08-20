import { Routes, Route } from 'react-router-dom'
import { AppStateProvider } from './context/AppState.jsx'
import Home from './screens/Home.jsx'
import Survey from './screens/Survey.jsx'
import CourseResults from './screens/CourseResults.jsx'
import AiCourse from './screens/AiCourse.jsx'
import CourseDetail from './screens/CourseDetail.jsx'
import MySchedule from './screens/MySchedule.jsx'

export default function App() {
  return (
    <AppStateProvider>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/survey/:step" element={<Survey />} />
          <Route path="/results" element={<CourseResults />} />
          <Route path="/ai-course" element={<AiCourse />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/schedule" element={<MySchedule />} />
        </Routes>
      </div>
    </AppStateProvider>
  )
}
