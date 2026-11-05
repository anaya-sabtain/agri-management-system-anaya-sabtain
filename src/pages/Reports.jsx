import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
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
      accent: '#10b981',
      background: 'bg-success-subtle',
      badgeText: 'Sales Revenue',
      sparkData: [
        { val: Math.round(summary.totalIncome * 0.3) || 10 },
        { val: Math.round(summary.totalIncome * 0.45) || 15 },
        { val: Math.round(summary.totalIncome * 0.4) || 12 },
        { val: Math.round(summary.totalIncome * 0.7) || 22 },
        { val: Math.round(summary.totalIncome * 0.65) || 20 },
        { val: Math.round(summary.totalIncome * 0.9) || 28 },
        { val: summary.totalIncome || 30 },
      ],
    },
    {
      title: 'Total Expenses',
      value: formatPKR(summary.totalExpenses),
      detail: `${expenses.length} expense records`,
      Icon: Wallet,
      color: 'text-danger',
      accent: '#ef4444',
      background: 'bg-danger-subtle',
      badgeText: 'Disbursed Costs',
      sparkData: [
        { val: Math.round(summary.totalExpenses * 0.4) || 8 },
        { val: Math.round(summary.totalExpenses * 0.5) || 12 },
        { val: Math.round(summary.totalExpenses * 0.65) || 16 },
        { val: Math.round(summary.totalExpenses * 0.7) || 18 },
        { val: Math.round(summary.totalExpenses * 0.85) || 22 },
        { val: Math.round(summary.totalExpenses * 0.92) || 25 },
        { val: summary.totalExpenses || 28 },
      ],
    },
    {
      title: summary.netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss',
      value: formatPKR(Math.abs(summary.netProfitLoss)),
      detail: 'Income minus recorded expenses',
      Icon: summary.netProfitLoss >= 0 ? TrendingUp : TrendingDown,
      color: summary.netProfitLoss >= 0 ? 'text-success' : 'text-danger',
      accent: summary.netProfitLoss >= 0 ? '#10b981' : '#ef4444',
      background:
        summary.netProfitLoss >= 0
          ? 'bg-success-subtle'
          : 'bg-danger-subtle',
      badgeText: summary.netProfitLoss >= 0 ? 'Net Gain' : 'Deficit',
      sparkData: [
        { val: Math.round(Math.abs(summary.netProfitLoss) * 0.35) || 10 },
        { val: Math.round(Math.abs(summary.netProfitLoss) * 0.5) || 14 },
        { val: Math.round(Math.abs(summary.netProfitLoss) * 0.45) || 12 },
        { val: Math.round(Math.abs(summary.netProfitLoss) * 0.7) || 20 },
        { val: Math.round(Math.abs(summary.netProfitLoss) * 0.8) || 24 },
        { val: Math.round(Math.abs(summary.netProfitLoss) * 0.92) || 28 },
        { val: Math.abs(summary.netProfitLoss) || 30 },
      ],
    },
    {
      title: 'Inventory Value',
      value: formatPKR(inventoryValue),
      detail: `${inventory.length} inventory items`,
      Icon: Package,
      color: 'text-primary',
      accent: '#0284c7',
      background: 'bg-primary-subtle',
      badgeText: 'Asset Value',
      sparkData: [
        { val: Math.round(inventoryValue * 0.45) || 12 },
        { val: Math.round(inventoryValue * 0.58) || 16 },
        { val: Math.round(inventoryValue * 0.62) || 18 },
        { val: Math.round(inventoryValue * 0.75) || 22 },
        { val: Math.round(inventoryValue * 0.82) || 24 },
        { val: Math.round(inventoryValue * 0.95) || 28 },
        { val: inventoryValue || 30 },
      ],
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
        {cards.map(({ title, value, detail, Icon, color, accent, background, badgeText, sparkData }, idx) => (
          <div className="col-12 col-md-6 col-xl-3" key={title}>
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3 p-md-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                    {title}
                  </span>
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${background}`}
                    style={{
                      width: 42,
                      height: 42,
                      minWidth: 42,
                      minHeight: 42,
                    }}
                  >
                    <Icon size={20} className={color} />
                  </div>
                </div>

                <h2 className={`h3 fw-bold mb-1 ${color}`}>{value}</h2>
              </div>

              {/* Sparkline */}
              <div style={{ width: '100%', height: 42, marginTop: 4, marginBottom: 4 }}>
                <ResponsiveContainer width="100%" height={42}>
                  <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`repSpark-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke={accent}
                      strokeWidth={2}
                      fill={`url(#repSpark-${idx})`}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="d-flex align-items-center justify-content-between pt-1 mt-auto">
                <span className="small text-secondary" style={{ fontSize: '11.5px' }}>{detail}</span>
                <span
                  className="badge rounded-pill border"
                  style={{
                    backgroundColor: `${accent}15`,
                    color: accent,
                    borderColor: `${accent}30`,
                    fontSize: '10.5px',
                    padding: '3px 7px',
                  }}
                >
                  {badgeText}
                </span>
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
