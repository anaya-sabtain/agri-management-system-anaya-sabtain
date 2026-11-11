import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../services/api";

function formatRole(role) {
  if (!role) return "Manager";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function normalizeUser(rawUser) {
  if (!rawUser) return null;
  return {
    ...rawUser,
    name: rawUser.fullName || rawUser.name || rawUser.username || "User",
    role: formatRole(rawUser.role),
  };
}

// Restore session thunk – fetch current user if token exists
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return rejectWithValue("No active session found.");
      }

      const response = await api.get("/auth/me");

      return {
        user: normalizeUser(response.data.user),
        token,
      };
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("agri_session");
      return rejectWithValue(
        error.response?.data?.message || "Session expired."
      );
    }
  }
);

// Real API Login thunk
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", credentials);

      if (!response.data?.succeeded) {
        return rejectWithValue(
          response.data?.message || "Invalid email or password."
        );
      }

      const user = response.data.user;

      if (!user?.token) {
        return rejectWithValue("Authentication token was not returned.");
      }

      const normalized = normalizeUser(user);

      // Save token and session for subsequent API requests
      localStorage.setItem("token", user.token);
      localStorage.setItem("agri_session", JSON.stringify(normalized));

      return {
        ...normalized,
        token: user.token,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.message?.includes("Network Error")
          ? "Backend server is unreachable. Please make sure the server is running on port 5000."
          : "Invalid email or password.");

      return rejectWithValue(message);
    }
  }
);

// Initial authentication state loaded from local storage
function loadInitialSession() {
  try {
    const saved = localStorage.getItem("agri_session");
    if (saved) return normalizeUser(JSON.parse(saved));
  } catch {}
  return null;
}

const savedUser = loadInitialSession();
const savedToken = localStorage.getItem("token");

const initialState = {
  user: savedUser,
  token: savedToken || null,
  isAuthenticated: Boolean(savedToken || savedUser),
  loading: false,
  isCheckingSession: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSucceeded: (state, action) => {
      const normalizedUser = normalizeUser(action.payload);
      state.user = normalizedUser;
      state.token =
        action.payload?.token ||
        localStorage.getItem("token") ||
        "demo-token";
      state.isAuthenticated = true;
      state.error = null;

      if (action.payload?.token) {
        localStorage.setItem("token", action.payload.token);
      }
      localStorage.setItem("agri_session", JSON.stringify(normalizedUser));
    },
    loginFailed: (state, action) => {
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("agri_session");
    },
    logoutSucceeded: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      localStorage.removeItem("token");
      localStorage.removeItem("agri_session");
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload?.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Invalid email or password.";
      })
      .addCase(restoreSession.pending, (state) => {
        state.isCheckingSession = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isCheckingSession = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isCheckingSession = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  logout,
  logoutSucceeded,
  clearAuthError,
  loginSucceeded,
  loginFailed,
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth?.user;
export const selectIsAuthenticated = (state) => state.auth?.isAuthenticated;
export const selectUserRole = (state) => state.auth?.user?.role ?? null;

export default authSlice.reducer;
