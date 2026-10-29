import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  error: null,
}

const cropsSlice = createSlice({
  name: 'crops',
  initialState,

  reducers: {
    cropAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },
      prepare(cropData) {
        return {
          payload: {
            id: nanoid(),
            ...cropData,
          },
        }
      },
    },

    cropUpdated(state, action) {
      const { id, changes } = action.payload

      const index = state.items.findIndex(
        (crop) => crop.id === id,
      )

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...changes,
          id,
        }
        state.error = null
      }
    },

    cropDeleted(state, action) {
      state.items = state.items.filter(
        (crop) => crop.id !== action.payload,
      )
      state.error = null
    },

    cropsLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    cropsErrorSet(state, action) {
      state.error = action.payload
    },
  },
})

export const {
  cropAdded,
  cropUpdated,
  cropDeleted,
  cropsLoaded,
  cropsErrorSet,
} = cropsSlice.actions

export const selectAllCrops = (state) => state.crops.items

export const selectCropById = (state, cropId) =>
  state.crops.items.find((crop) => crop.id === cropId)

export default cropsSlice.reducer
