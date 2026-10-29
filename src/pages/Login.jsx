import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Sprout, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { loginSucceeded, loginFailed, clearAuthError } from '../store/authSlice'
import './Login.css'

const DEMO_USERS = [
  {
    id: 'admin-1',
    name: 'AgriSense Admin',
    email: 'admin@agrisense.com',
    password: 'Admin@123',
    role: 'Admin',
  },
  {
    id: 'manager-1',
    name: 'Farm Manager',
    email: 'manager@agrisense.com',
    password: 'Manager@123',
    role: 'Manager',
  },
]

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    dispatch(clearAuthError())

    const matchedUser = DEMO_USERS.find(
      (user) =>
        user.email === email.trim().toLowerCase() &&
        user.password === password
    )

    if (!matchedUser) {
      const message = 'Invalid email or password.'
      setError(message)
      dispatch(loginFailed(message))
      return
    }

    const sessionUser = {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
    }

    try {
      localStorage.setItem('agri_session', JSON.stringify(sessionUser))
      dispatch(loginSucceeded(sessionUser))
      navigate('/', { replace: true })
    } catch {
      setError('Could not save your session. Please check browser storage.')
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">
            <Sprout size={28} />
          </span>
          <span>
            <strong>AgriSense</strong>
            <small>Smart Agriculture Management</small>
          </span>
        </div>

        <div className="login-heading">
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1>Sign in to your account</h1>
          <p>Manage your farm operations from one place.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <div className="login-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="password-toggle"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button className="login-submit" type="submit">
            Sign in to AgriSense
          </button>
        </form>

        <div className="demo-credentials">
          <strong>Demo access</strong>
          <p>Admin: admin@agrisense.com / Admin@123</p>
          <p>Manager: manager@agrisense.com / Manager@123</p>
        </div>

        <p className="login-footer">
          AgriSense · Agriculture Management System
        </p>
      </section>
    </main>
  )
}
