import { configureStore } from '@reduxjs/toolkit'

import counterReducer from './counterSlice'
import cropReducer from '../features/crops/cropSlice'
import buyerReducer from '../features/buyers/buyerSlice'
import orderReducer from '../features/orders/orderSlice'
import authReducer from '../features/auth/authSlice'
import weatherReducer from './weatherSlice'
import taskReducer from '../features/tasks/taskSlice'
import expenseReducer from '../features/expenses/expenseSlice'
import inventoryReducer from '../features/inventory/inventorySlice'
import farmOperationsReducer from '../features/farmOperations/farmOperationsSlice'
import activityReducer from '../features/activities/activitySlice'
import legacyActivityReducer from './activitySlice'
import workersReducer from './workersSlice'
import attendanceReducer from './attendanceSlice'
import equipmentReducer from './equipmentSlice'
import maintenanceReducer from './maintenanceSlice'
import { persistenceMiddleware } from './persistenceMiddleware'
import { STORAGE_KEYS } from '../data/dataModels'
import { getAll } from '../services/storageService'

function loadSavedWorkers() {
  try {
    const items = getAll(STORAGE_KEYS.WORKERS)
    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Could not load saved workers:', error)
    return []
  }
}

function loadSavedActivity() {
  try {
    return getAll(STORAGE_KEYS.ACTIVITY)
  } catch (error) {
    console.error('Could not load saved activities:', error)
    return []
  }
}

function loadSavedAttendance() {
  try {
    const items = getAll(STORAGE_KEYS.ATTENDANCE)
    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Could not load saved attendance:', error)
    return []
  }
}

function loadSavedEquipment() {
  try {
    const items = getAll(STORAGE_KEYS.EQUIPMENT)
    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Could not load saved equipment:', error)
    return []
  }
}

function loadSavedMaintenance() {
  try {
    const items = getAll(STORAGE_KEYS.MAINTENANCE)
    return Array.isArray(items) ? items : []
  } catch (error) {
    console.error('Could not load saved maintenance:', error)
    return []
  }
}

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    crops: cropReducer,
    buyers: buyerReducer,
    orders: orderReducer,
    auth: authReducer,
    weather: weatherReducer,
    tasks: taskReducer,
    expenses: expenseReducer,
    inventory: inventoryReducer,
    farmOperations: farmOperationsReducer,
    activity: legacyActivityReducer,
    activities: activityReducer,
    workers: workersReducer,
    attendance: attendanceReducer,
    equipment: equipmentReducer,
    maintenance: maintenanceReducer,
  },

  preloadedState: {
    activity: {
      items: loadSavedActivity(),
      error: null,
    },
    workers: {
      items: loadSavedWorkers(),
      loading: false,
      error: null,
    },
    attendance: {
      items: loadSavedAttendance(),
      loading: false,
      error: null,
    },
    equipment: {
      items: loadSavedEquipment(),
      loading: false,
      error: null,
    },
    maintenance: {
      items: loadSavedMaintenance(),
      loading: false,
      error: null,
    },
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistenceMiddleware),

  devTools: true,
})
