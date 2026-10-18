import { Menu, Bell, Search, Sun, Moon, Printer } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const pageTitles = {
  '/': 'Dashboard',
  '/crops': 'Crop Management',
  '/harvest-orders': 'Harvest & Orders',
  '/buyers': 'Buyer Management',
}

export default function Navbar({ onMenuClick, alertsCount = 0, onOpenAlerts }) {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'AgriSense'
  const { theme, toggleTheme } = useTheme()

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

        <div className="navbar-profile" aria-label="Demo user">
          <span>F</span>
          <div className="profile-copy">
            <strong>Farm Admin</strong>
            <small>Administrator</small>
          </div>
        </div>
      </div>
    </header>
  )
}
