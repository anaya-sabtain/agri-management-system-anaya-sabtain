import { createSlice, nanoid, createSelector } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  loading: false,
  error: null,
}

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState,

  reducers: {
    equipmentAdded: {
      reducer(state, action) {
        const equipment = action.payload

        const duplicateSerial = equipment.serialNumber &&
          state.items.some(
            (item) =>
              item.serialNumber?.toLowerCase() ===
              equipment.serialNumber.toLowerCase()
          )

        if (duplicateSerial) {
          state.error = 'An equipment record with this serial number already exists.'
          return
        }

        state.items.push(equipment)
        state.error = null
      },

      prepare(data) {
        return {
          payload: {
            id: nanoid(),
            name: data.name.trim(),
            category: data.category,
            serialNumber: (data.serialNumber ?? '').trim(),
            purchaseDate: data.purchaseDate || '',
            status: data.status || 'available',
            condition: data.condition || 'good',
            notes: (data.notes ?? '').trim(),
            createdAt: new Date().toISOString(),
          },
        }
      },
    },

    equipmentUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex((item) => item.id === id)

      if (index === -1) return

      const updated = {
        ...state.items[index],
        ...changes,
        id,
      }

      const serial = updated.serialNumber?.trim().toLowerCase()

      const duplicateSerial = serial && state.items.some(
        (item) =>
          item.id !== id &&
          item.serialNumber?.trim().toLowerCase() === serial
      )

      if (duplicateSerial) {
        state.error = 'Another equipment record already uses this serial number.'
        return
      }

      if (typeof updated.name === 'string') {
        updated.name = updated.name.trim()
      }

      if (typeof updated.serialNumber === 'string') {
        updated.serialNumber = updated.serialNumber.trim()
      }

      state.items[index] = updated
      state.error = null
    },

    equipmentDeleted(state, action) {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      )
      state.error = null
    },

    equipmentLoaded(state, action) {
      state.items = Array.isArray(action.payload)
        ? action.payload
        : []
      state.loading = false
      state.error = null
    },

    equipmentErrorCleared(state) {
      state.error = null
    },
  },
})

export const {
  equipmentAdded,
  equipmentUpdated,
  equipmentDeleted,
  equipmentLoaded,
  equipmentErrorCleared,
} = equipmentSlice.actions

export const selectAllEquipment = (state) =>
  state.equipment.items

export const selectEquipmentById = (state, equipmentId) =>
  state.equipment.items.find((item) => item.id === equipmentId)

export const selectAvailableEquipment = createSelector(
  [selectAllEquipment],
  (items) => items.filter((item) => item.status === 'available')
)

export const selectEquipmentUnderMaintenance = createSelector(
  [selectAllEquipment],
  (items) => items.filter((item) => item.status === 'under-maintenance')
)

export default equipmentSlice.reducer
