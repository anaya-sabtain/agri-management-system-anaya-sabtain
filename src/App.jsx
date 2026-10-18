import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/common/AppLayout'
import Dashboard from './pages/Dashboard'
import Crops from './pages/Crops'
import HarvestOrders from './pages/HarvestOrders'
import Buyers from './pages/Buyers'
import NotFound from './pages/NotFound'

import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crops" element={<Crops />} />
            <Route
              path="/harvest-orders"
              element={<HarvestOrders />}
            />
            <Route path="/buyers" element={<Buyers />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
