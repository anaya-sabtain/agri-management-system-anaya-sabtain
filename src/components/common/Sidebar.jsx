import { NavLink } from 'react-router-dom'
import {
  Sprout,
  LayoutDashboard,
  Wheat,
  ClipboardList,
  Users,
  X,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', path: '/', Icon: LayoutDashboard },
  { label: 'Crops', path: '/crops', Icon: Sprout },
  { label: 'Harvest & Orders', path: '/harvest-orders', Icon: ClipboardList },
  { label: 'Buyers', path: '/buyers', Icon: Users },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      <aside className={`agri-sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Wheat size={25} />
          </div>

          <div>
            <div className="brand-name">AgriSense</div>
            <div className="brand-caption">Farm Management</div>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ label, path, Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={onClose}
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <Sprout size={20} />
          </div>
          <div>
            <div className="sidebar-footer-title">Grow smarter</div>
            <div className="sidebar-footer-text">
              Better farming decisions.
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
