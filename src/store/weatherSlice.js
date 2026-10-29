import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getCurrentWeather } from '../services/weatherService'

export const fetchWeather = createAsyncThunk(
  'weather/fetchWeather',
  async (_, { rejectWithValue }) => {
    try {
      return await getCurrentWeather()
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Unable to fetch weather data.'
      )
    }
  }
)

const weatherSlice = createSlice({
  name: 'weather',

  initialState: {
    data: null,
    loading: false,
    error: null,
    lastFetchedAt: null,
  },

  reducers: {
    clearWeatherError(state) {
      state.error = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchWeather.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWeather.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload
        state.lastFetchedAt = new Date().toISOString()
        state.error = null
      })
      .addCase(fetchWeather.rejected, (state, action) => {
        state.loading = false
        state.error =
          action.payload || action.error.message || 'Weather request failed.'
      })
  },
})

export const { clearWeatherError } = weatherSlice.actions

export const selectWeather = (state) => state.weather.data
export const selectWeatherLoading = (state) => state.weather.loading
export const selectWeatherError = (state) => state.weather.error

export default weatherSlice.reducer
