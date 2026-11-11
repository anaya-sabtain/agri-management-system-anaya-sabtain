import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  orders: [],
  error: null,
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,

  reducers: {
    orderAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },
      prepare(orderData) {
        return {
          payload: {
            id: nanoid(),
            ...orderData,
          },
        }
      },
    },

    orderUpdated(state, action) {
      const { id, changes } = action.payload

      const index = state.items.findIndex(
        (order) => order.id === id,
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

    orderDeleted(state, action) {
      state.items = state.items.filter(
        (order) => order.id !== action.payload,
      )
      state.error = null
    },

    ordersLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    ordersBackfilledRates(state, action) {
      const ratesByCrop = action.payload
      state.items = state.items.map((order) => {
        if (!order.pricePerKg || order.pricePerKg <= 0) {
          const rate = ratesByCrop[order.cropName] || 0
          return {
            ...order,
            pricePerKg: rate,
          }
        }
        return order
      })
      state.error = null
    },

    ordersErrorSet(state, action) {
      state.error = action.payload
    },
  },
})

export const {
  orderAdded,
  orderUpdated,
  orderDeleted,
  ordersLoaded,
  ordersBackfilledRates,
  ordersErrorSet,
} = ordersSlice.actions

export const selectAllOrders = (state) =>
  state.orders?.orders || state.orders?.items || []

export const selectOrderById = (state, orderId) =>
  (state.orders?.orders || state.orders?.items || []).find((order) => order.id === orderId)

export default ordersSlice.reducer
