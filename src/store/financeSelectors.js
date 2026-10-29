import { createSelector } from '@reduxjs/toolkit'
import { selectAllOrders } from './ordersSlice'
import { selectAllExpenses } from './expensesSlice'

export const selectCompletedOrderIncome = createSelector(
  [selectAllOrders],
  (orders) =>
    orders.reduce((total, order) => {
      if (order.status !== 'completed') return total

      const quantity = Number(order.quantityKg) || 0
      const pricePerKg = Number(order.pricePerKg) || 0

      return total + quantity * pricePerKg
    }, 0)
)

export const selectPendingOrderIncome = createSelector(
  [selectAllOrders],
  (orders) =>
    orders.reduce((total, order) => {
      if (order.status !== 'pending') return total

      const quantity = Number(order.quantityKg) || 0
      const pricePerKg = Number(order.pricePerKg) || 0

      return total + quantity * pricePerKg
    }, 0)
)

export const selectTotalExpenseAmount = createSelector(
  [selectAllExpenses],
  (expenses) =>
    expenses.reduce(
      (total, expense) => total + (Number(expense.amount) || 0),
      0
    )
)

export const selectProfitLossSummary = createSelector(
  [selectCompletedOrderIncome, selectPendingOrderIncome, selectTotalExpenseAmount],
  (totalIncome, pendingIncome, totalExpenses) => {
    const netProfitLoss = totalIncome - totalExpenses
    const isProfit = netProfitLoss >= 0
    const profitMargin =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
        : null

    return {
      totalIncome,
      pendingIncome,
      projectedTotalIncome: totalIncome + pendingIncome,
      projectedNetProfitLoss: totalIncome + pendingIncome - totalExpenses,
      totalExpenses,
      netProfitLoss,
      isProfit,
      profitMargin,
    }
  }
)
