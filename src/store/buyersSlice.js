import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  error: null,
}

const buyersSlice = createSlice({
  name: 'buyers',
  initialState,

  reducers: {
    buyerAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },
      prepare(buyerData) {
        return {
          payload: {
            id: nanoid(),
            createdAt: new Date().toISOString(),
            ...buyerData,
          },
        }
      },
    },

    buyerUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex((buyer) => buyer.id === id)

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...changes,
          id,
        }
        state.error = null
      }
    },

    buyerDeleted(state, action) {
      state.items = state.items.filter(
        (buyer) => buyer.id !== action.payload,
      )
      state.error = null
    },

    buyersLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    buyersErrorSet(state, action) {
      state.error = action.payload
    },
  },
})

export const {
  buyerAdded,
  buyerUpdated,
  buyerDeleted,
  buyersLoaded,
  buyersErrorSet,
} = buyersSlice.actions

export const selectAllBuyers = (state) => state.buyers.items

export const selectBuyerById = (state, buyerId) =>
  state.buyers.items.find((buyer) => buyer.id === buyerId)

export default buyersSlice.reducer
