import { STORAGE_KEYS } from '../data/dataModels'

const persistenceConfig = {
  'crops/cropAdded': {
    storageKey: STORAGE_KEYS.CROPS,
    select: (state) => state.crops.items,
  },
  'crops/cropUpdated': {
    storageKey: STORAGE_KEYS.CROPS,
    select: (state) => state.crops.items,
  },
  'crops/cropDeleted': {
    storageKey: STORAGE_KEYS.CROPS,
    select: (state) => state.crops.items,
  },
  'crops/cropsLoaded': {
    storageKey: STORAGE_KEYS.CROPS,
    select: (state) => state.crops.items,
  },
  'buyers/buyerAdded': {
    storageKey: STORAGE_KEYS.BUYERS,
    select: (state) => state.buyers.items,
  },
  'buyers/buyerUpdated': {
    storageKey: STORAGE_KEYS.BUYERS,
    select: (state) => state.buyers.items,
  },
  'buyers/buyerDeleted': {
    storageKey: STORAGE_KEYS.BUYERS,
    select: (state) => state.buyers.items,
  },
  'orders/orderAdded': {
    storageKey: STORAGE_KEYS.ORDERS,
    select: (state) => state.orders.items,
  },
  'orders/orderUpdated': {
    storageKey: STORAGE_KEYS.ORDERS,
    select: (state) => state.orders.items,
  },
  'orders/orderDeleted': {
    storageKey: STORAGE_KEYS.ORDERS,
    select: (state) => state.orders.items,
  },
  'orders/ordersBackfilledRates': {
    storageKey: STORAGE_KEYS.ORDERS,
    select: (state) => state.orders.items,
  },
  'tasks/taskAdded': {
    storageKey: STORAGE_KEYS.TASKS,
    select: (state) => state.tasks.items,
  },
  'tasks/taskUpdated': {
    storageKey: STORAGE_KEYS.TASKS,
    select: (state) => state.tasks.items,
  },
  'tasks/taskDeleted': {
    storageKey: STORAGE_KEYS.TASKS,
    select: (state) => state.tasks.items,
  },
  'expenses/expenseAdded': {
    storageKey: STORAGE_KEYS.EXPENSES,
    select: (state) => state.expenses.items,
  },
  'expenses/expenseUpdated': {
    storageKey: STORAGE_KEYS.EXPENSES,
    select: (state) => state.expenses.items,
  },
  'expenses/expenseDeleted': {
    storageKey: STORAGE_KEYS.EXPENSES,
    select: (state) => state.expenses.items,
  },
  'inventory/inventoryAdded': {
    storageKey: STORAGE_KEYS.INVENTORY,
    select: (state) => state.inventory.items,
  },
  'inventory/inventoryUpdated': {
    storageKey: STORAGE_KEYS.INVENTORY,
    select: (state) => state.inventory.items,
  },
  'inventory/inventoryDeleted': {
    storageKey: STORAGE_KEYS.INVENTORY,
    select: (state) => state.inventory.items,
  },
  'inventory/inventoryLoaded': {
    storageKey: STORAGE_KEYS.INVENTORY,
    select: (state) => state.inventory.items,
  },
  'activity/activityAdded': {
    storageKey: STORAGE_KEYS.ACTIVITY,
    select: (state) => state.activity.items,
  },
  'activity/activityCleared': {
    storageKey: STORAGE_KEYS.ACTIVITY,
    select: (state) => state.activity.items,
  },
  'activity/activityLoaded': {
    storageKey: STORAGE_KEYS.ACTIVITY,
    select: (state) => state.activity.items,
  },
}

export const persistenceMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action)
  const config = persistenceConfig[action.type]

  if (!config) return result

  try {
    const records = config.select(storeAPI.getState())
    localStorage.setItem(config.storageKey, JSON.stringify(records))
  } catch (error) {
    console.error('Could not persist Redux state:', error)
  }

  return result
}
