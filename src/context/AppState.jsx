import { createContext, useContext, useEffect, useState } from 'react'

const AppStateContext = createContext(null)

const STORAGE_KEY = 'jeonju-schedule-v1'
const EMPTY_SCHEDULE = { courses: [], doneStopKeys: [], alarmOffCourseIds: [], activeCourseId: null }

function loadSchedule() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...EMPTY_SCHEDULE, ...JSON.parse(raw) }
  } catch {
    // 저장소를 못 읽어도(시크릿 모드 등) 앱은 빈 일정으로 그대로 돌아가야 한다.
  }
  return EMPTY_SCHEDULE
}

export function AppStateProvider({ children }) {
  const [courseId, setCourseId] = useState('hanok-sori')
  const [stopIndex, setStopIndex] = useState(3)
  const [answers, setAnswers] = useState({})
  const [aiCourse, setAiCourse] = useState(null) // { title, reason, days } | null
  // aiCourse를 만들어낸 설문 답변의 서명. 같은 답변으로 다시 들어오면 재생성하지 않는다
  // (재생성하면 사용자가 스와이프로 지운 정류지가 되살아난다).
  const [aiCourseKey, setAiCourseKey] = useState(null)
  const [schedule, setSchedule] = useState(loadSchedule)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
    } catch {
      // 저장 실패는 무시한다 — 화면 동작에는 영향이 없다.
    }
  }, [schedule])

  const setAnswer = (key, optionId) => setAnswers((prev) => ({ ...prev, [key]: optionId }))

  const saveCourse = (course) =>
    setSchedule((prev) => {
      const exists = prev.courses.some((c) => c.id === course.id)
      return {
        ...prev,
        courses: exists ? prev.courses.map((c) => (c.id === course.id ? course : c)) : [course, ...prev.courses],
        activeCourseId: course.id,
      }
    })

  const removeCourse = (id) =>
    setSchedule((prev) => {
      const courses = prev.courses.filter((c) => c.id !== id)
      return {
        ...prev,
        courses,
        // 코스를 지우면 그 코스의 체크 기록도 같이 지운다.
        doneStopKeys: prev.doneStopKeys.filter((key) => !key.startsWith(`${id}::`)),
        alarmOffCourseIds: prev.alarmOffCourseIds.filter((cid) => cid !== id),
        activeCourseId: prev.activeCourseId === id ? (courses[0]?.id ?? null) : prev.activeCourseId,
      }
    })

  const toggleStopDone = (key) =>
    setSchedule((prev) => ({
      ...prev,
      doneStopKeys: prev.doneStopKeys.includes(key)
        ? prev.doneStopKeys.filter((k) => k !== key)
        : [...prev.doneStopKeys, key],
    }))

  const toggleAlarm = (id) =>
    setSchedule((prev) => ({
      ...prev,
      alarmOffCourseIds: prev.alarmOffCourseIds.includes(id)
        ? prev.alarmOffCourseIds.filter((cid) => cid !== id)
        : [...prev.alarmOffCourseIds, id],
    }))

  const setActiveCourse = (id) => setSchedule((prev) => ({ ...prev, activeCourseId: id }))

  const value = {
    courseId,
    setCourseId,
    stopIndex,
    setStopIndex,
    answers,
    setAnswer,
    aiCourse,
    setAiCourse,
    aiCourseKey,
    setAiCourseKey,
    schedule,
    saveCourse,
    removeCourse,
    toggleStopDone,
    toggleAlarm,
    setActiveCourse,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
