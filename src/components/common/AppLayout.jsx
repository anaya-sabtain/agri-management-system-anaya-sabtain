import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import AlertsDrawer from './AlertsDrawer'
import { getFarmAlerts } from '../../services/alertService'
import { getCurrentWeather } from '../../services/weatherService'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agri_dismissed_alerts") || "[]");
    } catch {
      return [];
    }
  })
  const [allAlerts, setAllAlerts] = useState([])

  const loadAlerts = useCallback(async () => {
    let weather = null;
    try {
      weather = await getCurrentWeather();
    } catch {
      // ignore
    }
    const freshAlerts = getFarmAlerts(weather);
    setAllAlerts(freshAlerts);
  }, []);

  useEffect(() => {
    loadAlerts();

    // Refresh alerts when storage changes or every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    const handleStorage = () => loadAlerts();
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadAlerts]);

  const activeAlerts = allAlerts.filter((a) => !dismissedAlertIds.includes(a.id));

  const handleDismissAlert = (alertId) => {
    const updated = [...dismissedAlertIds, alertId];
    setDismissedAlertIds(updated);
    localStorage.setItem("agri_dismissed_alerts", JSON.stringify(updated));
  };

  const handleClearAllAlerts = () => {
    const allIds = allAlerts.map((a) => a.id);
    setDismissedAlertIds(allIds);
    localStorage.setItem("agri_dismissed_alerts", JSON.stringify(allIds));
  };

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          alertsCount={activeAlerts.length}
          onOpenAlerts={() => setAlertsOpen(true)}
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <AlertsDrawer
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        alerts={activeAlerts}
        onDismissAlert={handleDismissAlert}
        onClearAllAlerts={handleClearAllAlerts}
      />
    </div>
  )
}
