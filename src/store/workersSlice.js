import { createSlice, nanoid, createSelector } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  loading: false,
  error: null,
}

const workersSlice = createSlice({
  name: 'workers',
  initialState,
  reducers: {
    workerAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },
      prepare(data) {
        return {
          payload: {
            id: nanoid(),
            fullName: data.fullName.trim(),
            cnic: data.cnic.trim(),
            phone: data.phone.trim(),
            role: data.role,
            dailyWage: Number(data.dailyWage),
            joinDate: data.joinDate,
            status: data.status || 'active',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },

    workerUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex((worker) => worker.id === id)

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...changes,
          id,
        }
      }
      state.error = null
    },

    workerDeleted(state, action) {
      state.items = state.items.filter(
        (worker) => worker.id !== action.payload
      )
    },

    workersLoaded(state, action) {
      state.items = Array.isArray(action.payload) ? action.payload : []
      state.error = null
      state.loading = false
    },

    workersLoading(state) {
      state.loading = true
      state.error = null
    },

    workersErrorSet(state, action) {
      state.loading = false
      state.error = action.payload
    },
  },
})

export const {
  workerAdded,
  workerUpdated,
  workerDeleted,
  workersLoaded,
  workersLoading,
  workersErrorSet,
} = workersSlice.actions

export const selectAllWorkers = (state) => state.workers.items

export const selectWorkerById = (state, workerId) =>
  state.workers.items.find((worker) => worker.id === workerId)

export const selectActiveWorkers = createSelector(
  [selectAllWorkers],
  (workers) => workers.filter((worker) => worker.status === 'active')
)

export default workersSlice.reducer
