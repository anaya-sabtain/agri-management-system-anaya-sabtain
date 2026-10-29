import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
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
})

export const {
  activityAdded,
  activityCleared,
  activityLoaded,
  activityErrorSet,
} = activitySlice.actions

export const selectAllActivities = (state) => state.activity.items

export default activitySlice.reducer
