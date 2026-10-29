import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './store/authSlice'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import AppLayout from './components/common/AppLayout'
import Dashboard from './pages/Dashboard'
import Crops from './pages/Crops'
import HarvestOrders from './pages/HarvestOrders'
import Buyers from './pages/Buyers'
import FarmTasks from './pages/FarmTasks'
import Expenses from './pages/Expenses'
import ProfitLoss from './pages/ProfitLoss'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import ActivityLog from './pages/ActivityLog'
import NotFound from './pages/NotFound'

import { ThemeProvider } from './context/ThemeContext'

function LoginRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  return isAuthenticated
    ? <Navigate to="/" replace />
    : <Login />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crops" element={<Crops />} />
              <Route
                path="/harvest-orders"
                element={<HarvestOrders />}
              />
              <Route path="/buyers" element={<Buyers />} />
              <Route path="/farm-tasks" element={<FarmTasks />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/profit-loss" element={<ProfitLoss />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/activity-log" element={<ActivityLog />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
