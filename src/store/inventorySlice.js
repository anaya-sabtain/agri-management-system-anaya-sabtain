import { createSlice, nanoid, createSelector } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  error: null,
}

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,

  reducers: {
    inventoryAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },

      prepare(itemData) {
        return {
          payload: {
            ...itemData,
            id: nanoid(),
            quantity: Number(itemData.quantity),
            minimumStock: Number(itemData.minimumStock),
            purchasePrice: Number(itemData.purchasePrice),
            supplier: itemData.supplier || '',
            notes: itemData.notes || '',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },

    inventoryUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex((item) => item.id === id)

      if (index !== -1) {
        state.items[index] = {
          ...state.items[index],
          ...changes,
          id,
        }
        state.error = null
      }
    },

    inventoryDeleted(state, action) {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      )
      state.error = null
    },

    inventoryLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    inventoryErrorSet(state, action) {
      state.error = action.payload
    },
  },
})

export const {
  inventoryAdded,
  inventoryUpdated,
  inventoryDeleted,
  inventoryLoaded,
  inventoryErrorSet,
} = inventorySlice.actions

export const selectAllInventory = (state) => state.inventory.items

export const selectInventoryById = (state, inventoryId) =>
  state.inventory.items.find((item) => item.id === inventoryId)

export const selectLowStockItems = createSelector(
  [(state) => state.inventory.items],
  (items) =>
    items.filter(
      (item) => Number(item.quantity) <= Number(item.minimumStock)
    )
)

export const selectTotalInventoryValue = (state) =>
  state.inventory.items.reduce(
    (total, item) =>
      total +
      (Number(item.quantity) || 0) *
        (Number(item.purchasePrice) || 0),
    0
  )

export default inventorySlice.reducer
