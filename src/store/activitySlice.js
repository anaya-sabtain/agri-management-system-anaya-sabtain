import { createSlice, nanoid, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

export const fetchActivities = createAsyncThunk(
  'activities/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/activities')

      if (!response.data.succeeded) {
        return rejectWithValue(response.data.message)
      }

      return response.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch activities.'
      )
    }
  }
)

const initialState = {
  items: [],
  loading: false,
  error: null,
}

const activitySlice = createSlice({
  name: 'activity',
  initialState,

  reducers: {
    activityAdded: {
      reducer(state, action) {
        state.items.unshift(action.payload)

        // Keep the most recent 500 records.
        state.items = state.items.slice(0, 500)
        state.error = null
      },

      prepare({
        action,
        entity,
        entityId = null,
        description,
        user = 'Current User',
      }) {
        return {
          payload: {
            id: nanoid(),
            action,
            entity,
            entityId,
            description,
            user,
            timestamp: new Date().toISOString(),
          },
        }
      },
    },

    activityCleared(state) {
      state.items = []
      state.error = null
    },

    activityLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    activityErrorSet(state, action) {
      state.error = action.payload
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const {
  activityAdded,
  activityCleared,
  activityLoaded,
  activityErrorSet,
} = activitySlice.actions

export const selectAllActivities = (state) => state.activity.items

export default activitySlice.reducer
