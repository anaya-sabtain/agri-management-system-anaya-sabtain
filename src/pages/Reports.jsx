import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  BarChart3,
  Banknote,
  Wallet,
  TrendingUp,
  TrendingDown,
  Package,
  Download,
} from 'lucide-react'

import { selectAllOrders } from '../store/ordersSlice'
import { selectAllExpenses } from '../store/expensesSlice'
import {
  selectAllInventory,
  selectTotalInventoryValue,
} from '../store/inventorySlice'
import { exportToCSV } from '../services/csvExport'

const formatPKR = (amount) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

export default function Reports() {
  const orders = useSelector(selectAllOrders)
  const expenses = useSelector(selectAllExpenses)
  const inventory = useSelector(selectAllInventory)
  const inventoryValue = useSelector(selectTotalInventoryValue)

  const summary = useMemo(() => {
    const completedOrders = orders.filter(
      (order) => order.status === 'completed'
    )

    const totalIncome = completedOrders.reduce(
      (total, order) =>
        total +
        (Number(order.quantityKg) || 0) *
          (Number(order.pricePerKg) || 0),
      0
    )

    const totalExpenses = expenses.reduce(
      (total, expense) => total + (Number(expense.amount) || 0),
      0
    )

    return {
      completedOrders: completedOrders.length,
      totalIncome,
      totalExpenses,
      netProfitLoss: totalIncome - totalExpenses,
    }
  }, [orders, expenses])

  const cards = [
    {
      title: 'Completed Sales Income',
      value: formatPKR(summary.totalIncome),
      detail: `${summary.completedOrders} completed orders`,
      Icon: Banknote,
      color: 'text-success',
      background: 'bg-success-subtle',
    },
    {
      title: 'Total Expenses',
      value: formatPKR(summary.totalExpenses),
      detail: `${expenses.length} expense records`,
      Icon: Wallet,
      color: 'text-danger',
      background: 'bg-danger-subtle',
    },
    {
      title: summary.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss',
      value: formatPKR(Math.abs(summary.netProfitLoss)),
      detail: 'Income minus recorded expenses',
      Icon: summary.netProfitLoss >= 0 ? TrendingUp : TrendingDown,
      color: summary.netProfitLoss >= 0 ? 'text-success' : 'text-danger',
      background:
        summary.netProfitLoss >= 0
          ? 'bg-success-subtle'
          : 'bg-danger-subtle',
    },
    {
      title: 'Inventory Value',
      value: formatPKR(inventoryValue),
      detail: `${inventory.length} inventory items`,
      Icon: Package,
      color: 'text-primary',
      background: 'bg-primary-subtle',
    },
  ]

  function exportFinancialReport() {
    exportToCSV(
      [
        {
          report: 'Financial Summary',
          completedOrders: summary.completedOrders,
          totalIncomePKR: summary.totalIncome,
          totalExpensesPKR: summary.totalExpenses,
          netProfitLossPKR: summary.netProfitLoss,
          inventoryValuePKR: inventoryValue,
        },
      ],
      'agrisense-financial-summary.csv'
    )
  }

  function exportOrdersReport() {
    const rows = orders.map((order) => ({
      orderId: order.id,
      saleDate: order.saleDate,
      status: order.status,
      quantityKg: order.quantityKg,
      pricePerKgPKR: order.pricePerKg ?? 0,
      totalOrderValuePKR:
        (Number(order.quantityKg) || 0) *
        (Number(order.pricePerKg) || 0),
    }))

    exportToCSV(rows, 'agrisense-orders-report.csv')
  }

  function exportExpensesReport() {
    const rows = expenses.map((expense) => ({
      title: expense.title,
      category: expense.category,
      amountPKR: expense.amount,
      date: expense.date,
      cropId: expense.cropId ?? '',
      notes: expense.notes ?? '',
    }))

    exportToCSV(rows, 'agrisense-expenses-report.csv')
  }

  function exportInventoryReport() {
    const rows = inventory.map((item) => ({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      minimumStock: item.minimumStock,
      purchasePricePKR: item.purchasePrice,
      estimatedValuePKR:
        (Number(item.quantity) || 0) *
        (Number(item.purchasePrice) || 0),
      supplier: item.supplier ?? '',
      purchaseDate: item.purchaseDate ?? '',
    }))

    exportToCSV(rows, 'agrisense-inventory-report.csv')
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Reports & Analytics</h1>
          <p className="text-secondary mb-0">
            Review farm finances, sales and inventory performance.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success d-flex align-items-center gap-2"
          onClick={exportFinancialReport}
        >
          <Download size={17} />
          Export Summary
        </button>
      </div>

      <div className="row g-3 mb-4">
        {cards.map(({ title, value, detail, Icon, color, background }) => (
          <div className="col-12 col-md-6 col-xl-3" key={title}>
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <p className="text-secondary small mb-2">{title}</p>
                    <h2 className={`h4 fw-bold mb-0 ${color}`}>{value}</h2>
                  </div>
                  <div
                    className={`rounded-circle d-grid place-items-center flex-shrink-0 ${background}`}
                    style={{
                      width: 46,
                      height: 46,
                      minWidth: 46,
                      minHeight: 46,
                      aspectRatio: '1 / 1',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon size={22} className={color} />
                  </div>
                </div>
                <p className="small text-secondary mb-0">{detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <BarChart3 size={22} className="text-success" />
            <h2 className="h5 fw-bold mb-0">Export Detailed Reports</h2>
          </div>

          <p className="text-secondary">
            Download your saved records as CSV files for further analysis in
            Excel or other spreadsheet software.
          </p>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-success"
              onClick={exportOrdersReport}
            >
              <Download size={16} className="me-2" />
              Orders CSV
            </button>

            <button
              type="button"
              className="btn btn-outline-success"
              onClick={exportExpensesReport}
            >
              <Download size={16} className="me-2" />
              Expenses CSV
            </button>

            <button
              type="button"
              className="btn btn-outline-success"
              onClick={exportInventoryReport}
            >
              <Download size={16} className="me-2" />
              Inventory CSV
            </button>
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <h2 className="h5 fw-bold mb-3">Financial Calculation</h2>

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="border rounded-3 p-3 h-100">
                <div className="text-secondary small">Completed Sales</div>
                <div className="fw-bold mt-1">
                  {formatPKR(summary.totalIncome)}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="border rounded-3 p-3 h-100">
                <div className="text-secondary small">Recorded Expenses</div>
                <div className="fw-bold mt-1">
                  − {formatPKR(summary.totalExpenses)}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="border rounded-3 p-3 h-100">
                <div className="text-secondary small">Net Result</div>
                <div
                  className={`fw-bold mt-1 ${
                    summary.netProfitLoss >= 0
                      ? 'text-success'
                      : 'text-danger'
                  }`}
                >
                  {formatPKR(summary.netProfitLoss)}
                </div>
              </div>
            </div>
          </div>

          <p className="small text-secondary mt-3 mb-0">
            Income includes completed orders only. Pending and cancelled
            orders are excluded. This summary subtracts recorded expenses;
            it does not yet allocate expenses to individual orders or periods.
          </p>
        </div>
      </section>
    </div>
  )
}
