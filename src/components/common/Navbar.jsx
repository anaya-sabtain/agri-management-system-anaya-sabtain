import { useState, useRef, useEffect } from 'react'
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  Printer,
  LogOut,
  ChevronDown,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../context/ThemeContext'
import { logoutSucceeded, selectCurrentUser } from '../../store/authSlice'

const pageTitles = {
  '/': 'Dashboard',
  '/crops': 'Crop Management',
  '/harvest-orders': 'Harvest & Orders',
  '/buyers': 'Buyer Management',
  '/farm-tasks': 'Task Scheduler',
  '/expenses': 'Farm Expenses',
  '/profit-loss': 'Profit & Loss',
  '/inventory': 'Inputs Inventory',
  '/reports': 'Reports & Analytics',
  '/activity-log': 'Activity Log',
}

export default function Navbar({ onMenuClick, alertsCount = 0, onOpenAlerts }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'AgriSense'
  const { theme, toggleTheme } = useTheme()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    localStorage.removeItem('agri_session')
    dispatch(logoutSucceeded())
    navigate('/login', { replace: true })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <header className="agri-navbar">
      <div className="navbar-heading">
        <button
          className="menu-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <h1>{title}</h1>
          <p>Farm operations at a glance</p>
        </div>
      </div>

      <div className="navbar-actions">
        <label className="navbar-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
        </label>

        {/* Print View Shortcut Button */}
        <button
          type="button"
          className="navbar-icon-button"
          aria-label="Print Report"
          title="Print View / Export Report (Ctrl+P)"
          onClick={handlePrint}
        >
          <Printer size={19} />
        </button>

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          className={`navbar-icon-button theme-toggle-btn ${theme === 'dark' ? 'is-dark' : ''}`}
          aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun size={19} className="text-warning" />
          ) : (
            <Moon size={19} className="text-secondary" />
          )}
        </button>

        {/* Operational Alerts Trigger */}
        <button
          type="button"
          className="navbar-icon-button position-relative"
          aria-label="Operational Alerts"
          title={`${alertsCount} Active Farm Alerts`}
          onClick={onOpenAlerts}
        >
          <Bell size={20} />
          {alertsCount > 0 && (
            <span className="navbar-alert-badge">
              {alertsCount > 9 ? '9+' : alertsCount}
            </span>
          )}
        </button>

        {/* Professional User Profile & Session Controls */}
        <div className="navbar-user-group" ref={profileRef}>
          {/* Interactive Profile Pill */}
          <button
            type="button"
            className={`navbar-profile-pill ${profileOpen ? 'is-active' : ''}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label="User account profile and options"
            title={`${user?.name || 'AgriSense User'} (${user?.role || 'User'}) — Click for options`}
          >
            <div className="navbar-avatar-wrapper">
              <div className="navbar-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              {/* Online Pulsing Active Status Dot */}
              <span className="online-status-dot" title="Active Session" />
            </div>

            <div className="navbar-user-meta">
              <span className="navbar-user-name">
                {user?.name || 'AgriSense User'}
              </span>
              <span className={`navbar-user-role-badge ${isAdmin ? 'role-admin' : 'role-manager'}`}>
                {isAdmin ? <ShieldCheck size={11} /> : <User size={11} />}
                {user?.role || 'User'}
              </span>
            </div>

            <ChevronDown size={14} className="navbar-profile-chevron" />
          </button>

          {/* Floating User Profile Dropdown Card */}
          {profileOpen && (
            <div className="navbar-profile-dropdown" role="menu">
              <div className="dropdown-user-header">
                <div className="dropdown-avatar-lg">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="dropdown-user-details">
                  <span className="dropdown-user-name">
                    {user?.name || 'AgriSense User'}
                  </span>
                  <span className="dropdown-user-email">
                    {user?.email || (isAdmin ? 'admin@agrisense.com' : 'manager@agrisense.com')}
                  </span>
                  <span className={`dropdown-role-pill ${isAdmin ? 'role-admin' : 'role-manager'}`}>
                    {isAdmin ? <ShieldCheck size={12} /> : <User size={12} />}
                    {isAdmin ? 'System Administrator' : 'Farm Manager'}
                  </span>
                </div>
              </div>

              <div className="dropdown-session-status">
                <span>Session Status</span>
                <span className="status-indicator-live">Active Online</span>
              </div>

              <button
                type="button"
                className="dropdown-logout-action"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out of AgriSense</span>
              </button>
            </div>
          )}

          {/* Unified Quick Logout Button */}
          <button
            type="button"
            className="navbar-quick-logout"
            aria-label="Logout"
            title="Sign out of AgriSense"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
