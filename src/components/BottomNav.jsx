import { NavLink } from 'react-router-dom'
import { NAV_TABS } from '../data/mock.js'
import { TabGlyph } from './icons.jsx'

export default function BottomNav() {
  return (
    <div className="bottom-nav">
      {NAV_TABS.map((tab) => (
        <NavLink key={tab.key} to={tab.path} end={tab.path === '/'} className="bottom-nav-item">
          {({ isActive }) => {
            const color = isActive ? '#3366ff' : 'rgba(55,56,60,0.28)'
            return (
              <>
                <TabGlyph path={tab.icon} stroke={color} />
                <span className="bottom-nav-label" style={{ color }}>
                  {tab.label}
                </span>
              </>
            )
          }}
        </NavLink>
      ))}
    </div>
  )
}
