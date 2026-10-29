import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../../store/authSlice'

export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}
