import { createSlice, nanoid, createSelector } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  loading: false,
  error: null,
}

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,

  reducers: {
    maintenanceAdded: {
      reducer(state, action) {
        const record = action.payload

        const duplicate = state.items.some(
          (item) =>
            item.equipmentId === record.equipmentId &&
            item.serviceDate === record.serviceDate &&
            item.type === record.type
        )

        if (duplicate) {
          state.error =
            'This maintenance record already exists for the equipment on this date.'
          return
        }

        state.items.push(record)
        state.error = null
      },

      prepare(data) {
        return {
          payload: {
            id: nanoid(),
            equipmentId: data.equipmentId,
            type: data.type,
            serviceDate: data.serviceDate,
            nextServiceDate: data.nextServiceDate || '',
            cost: Number(data.cost) || 0,
            status: data.status || 'completed',
            notes: (data.notes ?? '').trim(),
            createdAt: new Date().toISOString(),
          },
        }
      },
    },

    maintenanceUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex((item) => item.id === id)

      if (index === -1) return

      const updated = {
        ...state.items[index],
        ...changes,
        id,
      }

      const duplicate = state.items.some(
        (item) =>
          item.id !== id &&
          item.equipmentId === updated.equipmentId &&
          item.serviceDate === updated.serviceDate &&
          item.type === updated.type
      )

      if (duplicate) {
        state.error =
          'Another maintenance record already exists for this equipment, date and type.'
        return
      }

      updated.cost = Number(updated.cost) || 0
      state.items[index] = updated
      state.error = null
    },

    maintenanceDeleted(state, action) {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      )
      state.error = null
    },

    maintenanceLoaded(state, action) {
      state.items = Array.isArray(action.payload)
        ? action.payload
        : []
      state.loading = false
      state.error = null
    },

    maintenanceErrorCleared(state) {
      state.error = null
    },
  },
})

export const {
  maintenanceAdded,
  maintenanceUpdated,
  maintenanceDeleted,
  maintenanceLoaded,
  maintenanceErrorCleared,
} = maintenanceSlice.actions

export const selectAllMaintenance = (state) =>
  state.maintenance.items

export const selectMaintenanceByEquipment = createSelector(
  [selectAllMaintenance, (_, equipmentId) => equipmentId],
  (items, equipmentId) =>
    items.filter((item) => item.equipmentId === equipmentId)
)

export const selectUpcomingMaintenance = createSelector(
  [selectAllMaintenance],
  (items) => {
    const today = new Date().toISOString().slice(0, 10)

    return items
      .filter(
        (item) =>
          item.nextServiceDate &&
          item.nextServiceDate >= today &&
          item.status === 'completed'
      )
      .sort((a, b) =>
        a.nextServiceDate.localeCompare(b.nextServiceDate)
      )
  }
)

export const selectTotalMaintenanceCost = createSelector(
  [selectAllMaintenance],
  (items) =>
    items.reduce((total, item) => total + (Number(item.cost) || 0), 0)
)

export default maintenanceSlice.reducer
