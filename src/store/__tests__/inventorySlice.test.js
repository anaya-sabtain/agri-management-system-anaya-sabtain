import { describe, it, expect } from 'vitest'
import {
  selectAllInventory,
  selectInventoryById,
  selectLowStockItems,
  selectTotalInventoryValue,
} from '../inventorySlice'

const sampleState = {
  inventory: {
    items: [
      {
        id: 'seed-1',
        name: 'Wheat Seeds',
        category: 'Seed',
        quantity: 20,
        minimumStock: 5,
        purchasePrice: 100,
        unit: 'kg',
      },
      {
        id: 'fertilizer-1',
        name: 'Urea Fertilizer',
        category: 'Fertilizer',
        quantity: 5,
        minimumStock: 5,
        purchasePrice: 200,
        unit: 'kg',
      },
      {
        id: 'pesticide-1',
        name: 'Pesticide',
        category: 'Pesticide',
        quantity: 2,
        minimumStock: 10,
        purchasePrice: 300,
        unit: 'L',
      },
    ],
    error: null,
  },
}

describe('inventory selectors', () => {
  it('selects all inventory items', () => {
    expect(selectAllInventory(sampleState)).toHaveLength(3)
  })

  it('selects an inventory item by ID', () => {
    expect(selectInventoryById(sampleState, 'seed-1').name).toBe(
      'Wheat Seeds'
    )
  })

  it('returns items at or below minimum stock', () => {
    const lowStock = selectLowStockItems(sampleState)

    expect(lowStock.map((item) => item.id)).toEqual([
      'fertilizer-1',
      'pesticide-1',
    ])
  })

  it('calculates total inventory value', () => {
    expect(selectTotalInventoryValue(sampleState)).toBe(3600)
  })

  it('returns an empty list and zero value for empty inventory', () => {
    const emptyState = {
      inventory: {
        items: [],
        error: null,
      },
    }

    expect(selectAllInventory(emptyState)).toEqual([])
    expect(selectLowStockItems(emptyState)).toEqual([])
    expect(selectTotalInventoryValue(emptyState)).toBe(0)
  })
})
