import { useNavigate } from 'react-router-dom'

export default function TopBar({ title, right }) {
  const navigate = useNavigate()
  return (
    <div className="topbar">
      <button className="topbar-back" onClick={() => navigate(-1)} aria-label="뒤로">
        ‹
      </button>
      <div className="topbar-title">{title}</div>
      {right}
    </div>
  )
}
