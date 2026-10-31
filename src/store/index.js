import { configureStore } from '@reduxjs/toolkit'

import counterReducer from './counterSlice'
import cropsReducer from './cropsSlice'
import buyersReducer from './buyersSlice'
import ordersReducer from './ordersSlice'
import authReducer from './authSlice'
import weatherReducer from './weatherSlice'
import tasksReducer from './tasksSlice'
import expensesReducer from './expensesSlice'
import inventoryReducer from './inventorySlice'
import activityReducer from './activitySlice'
import workersReducer from './workersSlice'
import attendanceReducer from './attendanceSlice'
import equipmentReducer from './equipmentSlice'
import maintenanceReducer from './maintenanceSlice'
import { persistenceMiddleware } from './persistenceMiddleware'
import { STORAGE_KEYS } from '../data/dataModels'
import { getAll } from '../services/storageService'

function loadSavedCrops() {
  try {
    return getAll(STORAGE_KEYS.CROPS)
  } catch (error) {
    console.error('Could not load saved crops:', error)
    return []
  }
}

function loadSavedBuyers() {
  try {
    return getAll(STORAGE_KEYS.BUYERS)
  } catch (error) {
    console.error('Could not load saved buyers:', error)
    return []
  }
}

function loadSavedOrders() {
  try {
    return getAll(STORAGE_KEYS.ORDERS)
  } catch (error) {
    console.error('Could not load saved orders:', error)
    return []
  }
}

function loadSavedTasks() {
  try {
    return getAll(STORAGE_KEYS.TASKS)
  } catch (error) {
    console.error('Could not load saved tasks:', error)
    return []
  }
}

function loadSavedExpenses() {
  try {
    return getAll(STORAGE_KEYS.EXPENSES)
  } catch (error) {
    console.error('Could not load saved expenses:', error)
    return []
  }
}

function loadSavedInventory() {
  try {
    return getAll(STORAGE_KEYS.INVENTORY)
  } catch (error) {
    console.error('Could not load saved inventory:', error)
    return []
  }
}

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
    crops: cropsReducer,
    buyers: buyersReducer,
    orders: ordersReducer,
    auth: authReducer,
    weather: weatherReducer,
    tasks: tasksReducer,
    expenses: expensesReducer,
    inventory: inventoryReducer,
    activity: activityReducer,
    workers: workersReducer,
    attendance: attendanceReducer,
    equipment: equipmentReducer,
    maintenance: maintenanceReducer,
  },

  preloadedState: {
    crops: {
      items: loadSavedCrops(),
      error: null,
    },
    buyers: {
      items: loadSavedBuyers(),
      error: null,
    },
    orders: {
      items: loadSavedOrders(),
      error: null,
    },
    tasks: {
      items: loadSavedTasks(),
      error: null,
    },
    expenses: {
      items: loadSavedExpenses(),
      error: null,
    },
    inventory: {
      items: loadSavedInventory(),
      error: null,
    },
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
