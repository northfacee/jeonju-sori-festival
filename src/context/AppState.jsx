import { createContext, useContext, useState } from 'react'

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [courseId, setCourseId] = useState('hanok-sori')
  const [stopIndex, setStopIndex] = useState(3)
  const [answers, setAnswers] = useState({})
  const [aiCourse, setAiCourse] = useState(null) // { title, reason, days } | null

  const setAnswer = (key, optionId) => setAnswers((prev) => ({ ...prev, [key]: optionId }))

  const value = {
    courseId,
    setCourseId,
    stopIndex,
    setStopIndex,
    answers,
    setAnswer,
    aiCourse,
    setAiCourse,
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
