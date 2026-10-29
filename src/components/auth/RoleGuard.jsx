import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectUserRole } from '../../store/authSlice'

export default function RoleGuard({ allowedRoles }) {
  const role = useSelector(selectUserRole)

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
