import { createSlice } from '@reduxjs/toolkit'

const SESSION_KEY = 'agri_session'

function loadSession() {
  try {
    const savedSession = localStorage.getItem('agri_session')
    if (!savedSession) return null

    const user = JSON.parse(savedSession)

    if (
      user?.id &&
      user?.name &&
      user?.email &&
      ['Admin', 'Manager'].includes(user?.role)
    ) {
      return user
    }

    return null
  } catch {
    return null
  }
}

const authSlice = createSlice({
  name: 'auth',

  initialState: {
    user: loadSession(),
    isAuthenticated: Boolean(loadSession()),
    error: null,
  },

  reducers: {
    loginSucceeded(state, action) {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },

    loginFailed(state, action) {
      state.error = action.payload
    },

    logoutSucceeded(state) {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },

    clearAuthError(state) {
      state.error = null
    },
  },
})

export const {
  loginSucceeded,
  loginFailed,
  logoutSucceeded,
  clearAuthError,
} = authSlice.actions

export const selectCurrentUser = (state) => state.auth.user

export const selectIsAuthenticated = (state) =>
  state.auth.isAuthenticated

export const selectUserRole = (state) =>
  state.auth.user?.role ?? null

export default authSlice.reducer
