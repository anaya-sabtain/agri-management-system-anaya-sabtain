import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  error: null,
}

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,

  reducers: {
    expenseAdded: {
      reducer(state, action) {
        state.items.push(action.payload)
        state.error = null
      },

      prepare(expenseData) {
        return {
          payload: {
            ...expenseData,
            id: nanoid(),
            amount: Number(expenseData.amount),
            cropId: expenseData.cropId || null,
            notes: expenseData.notes || '',
            createdAt: new Date().toISOString(),
          },
        }
      },
    },

    expenseUpdated(state, action) {
      const { id, changes } = action.payload
      const index = state.items.findIndex(
        (expense) => expense.id === id
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

    expenseDeleted(state, action) {
      state.items = state.items.filter(
        (expense) => expense.id !== action.payload
      )
      state.error = null
    },

    expensesLoaded(state, action) {
      state.items = action.payload
      state.error = null
    },

    expensesErrorSet(state, action) {
      state.error = action.payload
    },
  },
})

export const {
  expenseAdded,
  expenseUpdated,
  expenseDeleted,
  expensesLoaded,
  expensesErrorSet,
} = expensesSlice.actions

export const selectAllExpenses = (state) => state.expenses.items

export const selectExpenseById = (state, expenseId) =>
  state.expenses.items.find(
    (expense) => expense.id === expenseId
  )

export const selectTotalExpenses = (state) =>
  state.expenses.items.reduce(
    (total, expense) => total + (Number(expense.amount) || 0),
    0
  )

export default expensesSlice.reducer
