import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Sprout, Eye, EyeOff, LockKeyhole, Mail, AlertCircle } from 'lucide-react'
import { loginUser, clearAuthError } from '../features/auth/authSlice'
import './Login.css'

export default function Login() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const { loading, error: authError } = useSelector((state) => state.auth || {})

  async function handleSubmit(event) {
    event.preventDefault()
    setLocalError('')
    dispatch(clearAuthError())

    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanPassword = (password || '').trim()

    if (!cleanEmail || !cleanPassword) {
      setLocalError('Please enter both email and password.')
      return
    }

    try {
      const result = await dispatch(
        loginUser({ email: cleanEmail, password: cleanPassword })
      ).unwrap()

      if (result) {
        navigate('/', { replace: true })
      }
    } catch (err) {
      // err is string message from rejectWithValue
      setLocalError(typeof err === 'string' ? err : 'Invalid email or password.')
    }
  }

  const displayedError = localError || authError

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

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">Email address</label>
          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="e.g. manager@agrisense.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (localError) setLocalError('')
              }}
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
              onChange={(event) => {
                setPassword(event.target.value)
                if (localError) setLocalError('')
              }}
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

          {displayedError && (
            <div className="login-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{displayedError}</span>
            </div>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to AgriSense'}
          </button>
        </form>

        <p className="login-footer">
          AgriSense · Agriculture Management System
        </p>
      </section>
    </main>
  )
}
