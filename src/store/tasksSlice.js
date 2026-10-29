import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  error: null,
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,

  reducers: {
    taskAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },
      prepare(taskData) {
        return {
          payload: {
            id: nanoid(),
            status: 'Pending',
            createdAt: new Date().toISOString(),
            ...taskData,
          },
        }
      },
    },

    taskUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex((task) => task.id === id)

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...changes,
          id,
        }
        state.error = null
      }
    },

    taskDeleted(state, action) {
      state.items = state.items.filter(
        (task) => task.id !== action.payload
      )
      state.error = null
    },

    tasksLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    tasksErrorSet(state, action) {
      state.error = action.payload
    },
  },
})

export const {
  taskAdded,
  taskUpdated,
  taskDeleted,
  tasksLoaded,
  tasksErrorSet,
} = tasksSlice.actions

export const selectAllTasks = (state) => state.tasks.items

export const selectTaskById = (state, taskId) =>
  state.tasks.items.find((task) => task.id === taskId)

export default tasksSlice.reducer
