import { NavLink } from 'react-router-dom'
import {
  Sprout,
  LayoutDashboard,
  Wheat,
  ClipboardList,
  Users,
  Wallet,
  ChartNoAxesCombined,
  Package,
  BarChart3,
  Activity,
  CalendarCheck,
  Tractor,
  Wrench,
  X,
} from 'lucide-react'

const navigation = [
  { label: 'Dashboard', path: '/', Icon: LayoutDashboard },
  { label: 'Crops', path: '/crops', Icon: Sprout },
  { label: 'Harvest & Orders', path: '/harvest-orders', Icon: ClipboardList },
  { label: 'Buyers', path: '/buyers', Icon: Users },
  { label: 'Workers & Labour', path: '/workers', Icon: Users },
  { label: 'Attendance & Wages', path: '/attendance', Icon: CalendarCheck },
  { label: 'Equipment & Maintenance', path: '/equipment', Icon: Tractor },
  { label: 'Maintenance Tracker', path: '/maintenance', Icon: Wrench },
  { label: 'Farm Tasks', path: '/farm-tasks', Icon: ClipboardList },
  { label: 'Expenses', path: '/expenses', Icon: Wallet },
  { label: 'Profit & Loss', path: '/profit-loss', Icon: ChartNoAxesCombined },
  { label: 'Inputs Inventory', path: '/inventory', Icon: Package },
  { label: 'Reports', path: '/reports', Icon: BarChart3 },
  { label: 'Activity Log', path: '/activity-log', Icon: Activity },
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
