import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Banknote,
  Clock,
  Download,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Sprout,
  Calendar,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
  Eye,
  X,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import { selectAllOrders } from '../store/ordersSlice'
import { selectAllExpenses } from '../store/expensesSlice'
import { selectAllCrops } from '../store/cropsSlice'
import { selectAllBuyers } from '../store/buyersSlice'
import { exportToCSV } from '../services/csvExport'

const PALETTE = [
  '#244B36', // Forest Emerald
  '#2E7D32', // Rich Green
  '#0284C7', // Sky Blue
  '#D97706', // Amber Gold
  '#7C3AED', // Royal Violet
  '#DB2777', // Crimson Rose
  '#0D9488', // Teal
  '#475569', // Slate
]

const AVATAR_BG = [
  'linear-gradient(135deg, #10b981 0%, #047857 100%)',
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
]

function formatPKR(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === '—') return '—'
  try {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getInitials(name) {
  if (!name) return 'AG'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function ProfitLoss() {
  const orders = useSelector(selectAllOrders)
  const expenses = useSelector(selectAllExpenses)
  const crops = useSelector(selectAllCrops)
  const buyers = useSelector(selectAllBuyers)

  const [timeframe, setTimeframe] = useState('all') // 'all' | 'month' | '30days'
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'income' | 'expense'
  const [search, setSearch] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState(null)

  // Map lookups for rapid resolution
  const cropMap = useMemo(
    () => new Map(crops.map((c) => [c.id, c])),
    [crops]
  )
  const buyerMap = useMemo(
    () => new Map(buyers.map((b) => [b.id, b])),
    [buyers]
  )

  // Date filtering helper
  const isWithinTimeframe = (dateStr) => {
    if (timeframe === 'all' || !dateStr) return true
    const itemDate = new Date(dateStr)
    if (Number.isNaN(itemDate.getTime())) return true

    const now = new Date()
    if (timeframe === 'month') {
      return (
        itemDate.getFullYear() === now.getFullYear() &&
        itemDate.getMonth() === now.getMonth()
      )
    }
    if (timeframe === '30days') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return itemDate >= past30
    }
    return true
  }

  // Filtered orders & expenses (Real-time live Redux data)
  const filteredOrders = useMemo(
    () => orders.filter((o) => isWithinTimeframe(o.saleDate)),
    [orders, timeframe]
  )
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isWithinTimeframe(e.date)),
    [expenses, timeframe]
  )

  // Recalculated dynamic metrics for active timeframe using 100% REAL state values
  const periodMetrics = useMemo(() => {
    let completedCount = 0
    let pendingCount = 0

    const completedIncome = filteredOrders.reduce((sum, o) => {
      if (o.status !== 'completed') return sum
      completedCount++
      const qty = Number(o.quantityKg) || 0
      const price = Number(o.pricePerKg) || 0
      return sum + qty * price
    }, 0)

    const pendingIncome = filteredOrders.reduce((sum, o) => {
      if (o.status !== 'pending') return sum
      pendingCount++
      const qty = Number(o.quantityKg) || 0
      const price = Number(o.pricePerKg) || 0
      return sum + qty * price
    }, 0)

    const totalExpense = filteredExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    )

    const netProfit = completedIncome - totalExpense
    const isProfit = netProfit >= 0
    const margin =
      completedIncome > 0
        ? Math.round(((completedIncome - totalExpense) / completedIncome) * 100)
        : null

    const expenseRatio =
      completedIncome > 0
        ? Math.min(Math.round((totalExpense / completedIncome) * 100), 100)
        : 100

    const averageDeal =
      completedCount > 0 ? Math.round(completedIncome / completedCount) : 0

    return {
      completedIncome,
      completedCount,
      pendingIncome,
      pendingCount,
      projectedIncome: completedIncome + pendingIncome,
      projectedNet: completedIncome + pendingIncome - totalExpense,
      totalExpense,
      expenseCount: filteredExpenses.length,
      netProfit,
      isProfit,
      margin,
      expenseRatio,
      averageDeal,
    }
  }, [filteredOrders, filteredExpenses])

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const totals = {}
    filteredExpenses.forEach((exp) => {
      const cat = exp.category || 'General'
      totals[cat] = (totals[cat] || 0) + (Number(exp.amount) || 0)
    })

    const grandTotal = periodMetrics.totalExpense || 1
    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        percent: Math.round((value / grandTotal) * 100),
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, periodMetrics.totalExpense])

  // Crop-wise Income vs Expense performance from real data
  const cropPerformance = useMemo(() => {
    const map = new Map()

    crops.forEach((c) => {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        income: 0,
        expense: 0,
      })
    })

    filteredOrders.forEach((o) => {
      if (o.cropId && map.has(o.cropId)) {
        const crop = map.get(o.cropId)
        const qty = Number(o.quantityKg) || 0
        const price = Number(o.pricePerKg) || 0
        if (o.status === 'completed') {
          crop.income += qty * price
        }
      }
    })

    filteredExpenses.forEach((e) => {
      if (e.cropId && map.has(e.cropId)) {
        map.get(e.cropId).expense += Number(e.amount) || 0
      }
    })

    return Array.from(map.values())
      .filter((item) => item.income > 0 || item.expense > 0)
      .map((item) => ({
        ...item,
        net: item.income - item.expense,
        roi: item.expense > 0 ? Math.round(((item.income - item.expense) / item.expense) * 100) : 100,
      }))
      .sort((a, b) => b.income - a.income)
  }, [crops, filteredOrders, filteredExpenses])

  // Unified Transactions Ledger (Strictly Real Records)
  const ledger = useMemo(() => {
    const records = []

    filteredOrders.forEach((o, idx) => {
      const buyer = buyerMap.get(o.buyerId)
      const crop = cropMap.get(o.cropId)
      const qty = Number(o.quantityKg) || 0
      const price = Number(o.pricePerKg) || 0
      const total = qty * price

      records.push({
        id: `ord-${o.id}`,
        type: 'income',
        status: o.status,
        rawDate: o.saleDate || '',
        date: formatDate(o.saleDate),
        title: crop?.name ? `${crop.name} Harvest Sale` : 'Produce Sale',
        counterparty: buyer?.fullName || 'Direct Market Deal',
        contact: buyer?.cnic || 'Registered Client',
        detail: price > 0 ? `${qty.toLocaleString()} kg @ Rs ${price}/kg` : `${qty.toLocaleString()} kg (Price pending)`,
        qty,
        price,
        cropName: crop?.name || 'Produce',
        field: crop?.field || 'Field Sector',
        tag: crop?.name || 'Produce',
        amount: total,
        isCompleted: o.status === 'completed',
        colorGradient: AVATAR_BG[idx % AVATAR_BG.length],
      })
    })

    filteredExpenses.forEach((e) => {
      const crop = cropMap.get(e.cropId)
      records.push({
        id: `exp-${e.id}`,
        type: 'expense',
        status: 'paid',
        rawDate: e.date || '',
        date: formatDate(e.date),
        title: e.title || 'Farm Operational Expense',
        counterparty: e.category || 'Supplies Vendor',
        contact: 'Farm Cost Center',
        detail: crop ? `Allocated to: ${crop.name}` : e.notes || 'General operations',
        cropName: crop?.name || 'General Farm',
        field: 'Operational Upkeep',
        tag: e.category || 'General',
        amount: Number(e.amount) || 0,
        isCompleted: true,
        colorGradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      })
    })

    const q = search.trim().toLowerCase()
    return records
      .filter((item) => {
        if (activeTab === 'income' && item.type !== 'income') return false
        if (activeTab === 'expense' && item.type !== 'expense') return false

        if (!q) return true
        return (
          item.title.toLowerCase().includes(q) ||
          item.counterparty.toLowerCase().includes(q) ||
          item.detail.toLowerCase().includes(q) ||
          item.date.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => String(b.rawDate).localeCompare(String(a.rawDate)))
  }, [filteredOrders, filteredExpenses, cropMap, buyerMap, activeTab, search])

  // CSV Export handler
  const handleExportCSV = () => {
    const exportData = ledger.map((item) => ({
      Date: item.date,
      Type: item.type === 'income' ? 'SALES REVENUE' : 'EXPENSE OUTFLOW',
      Transaction_Title: item.title,
      Party_Category: item.counterparty,
      Breakdown: item.detail,
      Status: item.status.toUpperCase(),
      Net_Amount_PKR: item.amount,
    }))
    exportToCSV(exportData, `AgriSense_Executive_P&L_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="pnl-dashboard-ambient container-fluid py-4 px-md-4">
      {/* =========================================================================
          EXECUTIVE HERO GLASS PANEL
          ========================================================================= */}
      <div className="pnl-hero-glass mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-success text-white rounded-pill px-3 py-1 small fw-bold tracking-wide">
                REAL-TIME FISCAL AUDIT
              </span>
              <span className="badge bg-light text-secondary border rounded-pill px-2 py-1 small">
                <ShieldCheck size={13} className="me-1 inline text-success" />
                Live Store Synced
              </span>
            </div>
            <h1 className="h2 fw-bold mb-1 text-dark">Profit & Loss Statement (P&L)</h1>
            <p className="text-secondary small mb-0">
              Live financial overview computed directly from your saved crops, orders, and expenses.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Timeframe Pill Selector */}
            <div className="d-flex align-items-center p-1 bg-white border rounded-pill shadow-xs">
              <button
                type="button"
                className={`pnl-pill-tab border-0 py-1 px-3 ${timeframe === 'all' ? 'active' : ''}`}
                onClick={() => setTimeframe('all')}
              >
                All Time
              </button>
              <button
                type="button"
                className={`pnl-pill-tab border-0 py-1 px-3 ${timeframe === 'month' ? 'active' : ''}`}
                onClick={() => setTimeframe('month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`pnl-pill-tab border-0 py-1 px-3 ${timeframe === '30days' ? 'active' : ''}`}
                onClick={() => setTimeframe('30days')}
              >
                Last 30 Days
              </button>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-xs"
              onClick={handleExportCSV}
              title="Download CSV"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-xs"
              onClick={() => window.print()}
              title="Print Financial Statement"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4 LUXURY FINTECH STAT CARDS (PERFECT CIRCULAR ICONS)
          ========================================================================= */}
      <div className="row g-3 mb-4">
        {/* 1. Realized Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="pnl-stat-card-luxury h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="small text-secondary fw-semibold">Realized Produce Sales</span>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    minHeight: 44,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#e8f5e9',
                    color: '#1b5e20',
                  }}
                >
                  <Banknote size={20} />
                </div>
              </div>
              <div className="h3 fw-bold text-success mb-1">
                {formatPKR(periodMetrics.completedIncome)}
              </div>
              <span className="small text-secondary">
                Fulfilled Deals: <strong>{periodMetrics.completedCount}</strong>
              </span>
            </div>

            <div className="mt-3">
              <svg viewBox="0 0 100 24" className="w-100" style={{ height: 26, overflow: 'visible' }}>
                <defs>
                  <linearGradient id="pnlGradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,18 Q20,16 40,10 T80,4 T100,2" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <path d="M0,18 Q20,16 40,10 T80,4 T100,2 L100,24 L0,24 Z" fill="url(#pnlGradGreen)" />
              </svg>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>Completed Deliveries</span>
                <span className="badge rounded-pill bg-success-subtle text-success small">Realized</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Total Operational Costs */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="pnl-stat-card-luxury h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="small text-secondary fw-semibold">Farm Operating Costs (Opex)</span>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    minHeight: 44,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#ffebee',
                    color: '#b71c1c',
                  }}
                >
                  <Wallet size={20} />
                </div>
              </div>
              <div className="h3 fw-bold text-danger mb-1">
                {formatPKR(periodMetrics.totalExpense)}
              </div>
              <span className="small text-secondary">
                Cost Centers: <strong>{categoryBreakdown.length} active</strong>
              </span>
            </div>

            <div className="mt-3">
              <svg viewBox="0 0 100 24" className="w-100" style={{ height: 26, overflow: 'visible' }}>
                <defs>
                  <linearGradient id="pnlGradRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,6 Q30,12 60,16 T100,20" fill="none" stroke="#ef4444" strokeWidth="2.5" />
                <path d="M0,6 Q30,12 60,16 T100,20 L100,24 L0,24 Z" fill="url(#pnlGradRed)" />
              </svg>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>{periodMetrics.expenseCount} logged expenditures</span>
                <span className="badge rounded-pill bg-danger-subtle text-danger small">Disbursed</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Net Operating Yield */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="pnl-stat-card-luxury h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="small text-secondary fw-semibold">
                  {periodMetrics.isProfit ? 'Net Operating Profit' : 'Operating Deficit'}
                </span>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    minHeight: 44,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    background: periodMetrics.isProfit ? '#e8f5e9' : '#fff1f2',
                    color: periodMetrics.isProfit ? '#2e7d32' : '#e11d48',
                  }}
                >
                  {periodMetrics.isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
              </div>
              <div
                className={`h3 fw-bold mb-1 ${
                  periodMetrics.isProfit ? 'text-success' : 'text-danger'
                }`}
              >
                {periodMetrics.isProfit ? '+' : '−'}
                {formatPKR(Math.abs(periodMetrics.netProfit))}
              </div>
              <span className="small text-secondary">
                Margin:{' '}
                <strong className={periodMetrics.isProfit ? 'text-success' : 'text-danger'}>
                  {periodMetrics.margin !== null ? `${periodMetrics.margin}%` : 'Baseline'}
                </strong>
              </span>
            </div>

            <div className="mt-3">
              <svg viewBox="0 0 100 24" className="w-100" style={{ height: 26, overflow: 'visible' }}>
                <path
                  d={periodMetrics.isProfit ? "M0,20 Q30,15 60,8 T100,2" : "M0,4 Q30,10 60,16 T100,22"}
                  fill="none"
                  stroke={periodMetrics.isProfit ? "#10b981" : "#e11d48"}
                  strokeWidth="2.5"
                />
              </svg>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>{periodMetrics.isProfit ? 'Operating in Profit' : 'Recovering Cost'}</span>
                <span
                  className={`badge rounded-pill small ${
                    periodMetrics.isProfit
                      ? 'bg-success-subtle text-success'
                      : 'bg-danger-subtle text-danger'
                  }`}
                >
                  {periodMetrics.isProfit ? 'Profitable' : 'Deficit'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Delivery Pipeline Revenue */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="pnl-stat-card-luxury h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="small text-secondary fw-semibold">Pending Delivery Pipeline</span>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    minHeight: 44,
                    aspectRatio: '1 / 1',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    background: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  <Clock size={20} />
                </div>
              </div>
              <div className="h3 fw-bold text-primary mb-1">
                {formatPKR(periodMetrics.pendingIncome)}
              </div>
              <span className="small text-secondary">
                Proj. Net: <strong>{formatPKR(periodMetrics.projectedNet)}</strong>
              </span>
            </div>

            <div className="mt-3">
              <svg viewBox="0 0 100 24" className="w-100" style={{ height: 26, overflow: 'visible' }}>
                <defs>
                  <linearGradient id="pnlGradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,15 Q30,18 60,10 T100,5" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                <path d="M0,15 Q30,18 60,10 T100,5 L100,24 L0,24 Z" fill="url(#pnlGradBlue)" />
              </svg>
              <div className="d-flex align-items-center justify-content-between small text-secondary mt-1">
                <span>{periodMetrics.pendingCount} shipments queued</span>
                <span className="badge rounded-pill bg-primary-subtle text-primary small">Escrow Queue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MONEY FLOW RIBBON (CLEAN FLOW - NO TACKY MINUS/EQUALS MATH SIGNS)
          ========================================================================= */}
      <div className="pnl-flow-banner mb-4">
        <div className="row align-items-center g-3">
          <div className="col-12 col-lg-8">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div className="pnl-flow-node">
                <span className="pnl-flow-label">1. Produce Sales Inflow</span>
                <span className="pnl-flow-val text-success">
                  {formatPKR(periodMetrics.completedIncome)}
                </span>
                <span className="small text-secondary mt-1">Cash In</span>
              </div>

              <div className="pnl-pipeline-connector d-none d-md-flex" />

              <div className="pnl-flow-node">
                <span className="pnl-flow-label">2. Operational Outflow</span>
                <span className="pnl-flow-val text-danger">
                  {formatPKR(periodMetrics.totalExpense)}
                </span>
                <span className="small text-secondary mt-1">Cash Out</span>
              </div>

              <div className="pnl-pipeline-connector d-none d-md-flex" />

              <div className="pnl-flow-node">
                <span className="pnl-flow-label">3. Net Retained Yield</span>
                <span
                  className={`pnl-flow-val ${
                    periodMetrics.isProfit ? 'text-success' : 'text-danger'
                  }`}
                >
                  {periodMetrics.isProfit ? '+' : '−'}
                  {formatPKR(Math.abs(periodMetrics.netProfit))}
                </span>
                <span className="small text-secondary mt-1">Net Balance</span>
              </div>
            </div>

            {/* Ratio Progress Indicator */}
            {periodMetrics.completedIncome > 0 && (
              <div className="mt-3">
                <div className="d-flex justify-content-between small text-secondary mb-1">
                  <span>Operating Cost Absorption: <strong>{periodMetrics.expenseRatio}%</strong></span>
                  <span>Net Retained Margin: <strong>{Math.max(100 - periodMetrics.expenseRatio, 0)}%</strong></span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{ width: `${periodMetrics.expenseRatio}%` }}
                    title="Expenses"
                  />
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${Math.max(100 - periodMetrics.expenseRatio, 0)}%` }}
                    title="Retained Profit"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="col-12 col-lg-4 border-start-lg ps-lg-4">
            <div className="d-flex align-items-start gap-2">
              <Sparkles size={18} className="text-success flex-shrink-0 mt-1" />
              <div>
                <span className="small fw-bold text-dark d-block">CAPITAL STRATEGY INSIGHT</span>
                <p className="text-secondary small mb-0">
                  {periodMetrics.pendingIncome > 0 ? (
                    <>
                      You have <strong>{formatPKR(periodMetrics.pendingIncome)}</strong> in pending orders.
                      Once delivered, total projected net balance will reach{' '}
                      <strong className={periodMetrics.projectedNet >= 0 ? 'text-success' : 'text-danger'}>
                        {formatPKR(periodMetrics.projectedNet)}
                      </strong>.
                    </>
                  ) : (
                    <>All recorded harvest sales are settled. Continuous input tracking ensures financial accuracy.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ANALYTICS BREAKDOWN GRID: DONUT WITH CENTER METRIC & CROP BAR CHART
          ========================================================================= */}
      <div className="row g-4 mb-4">
        {/* Category Expense Distribution with Center-Text Donut */}
        <div className="col-12 col-lg-5">
          <div className="analytics-card h-100">
            <div className="analytics-card-header mb-3">
              <div>
                <p className="analytics-eyebrow">OPEX ALLOCATION</p>
                <h3 className="h6 fw-bold mb-0">Cost Center Breakdown</h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#ffebee',
                  color: '#c62828',
                }}
              >
                <PieIcon size={19} />
              </div>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <Wallet size={34} className="mb-2 opacity-50" />
                <p className="small mb-0">No expenditure logged in this timeframe.</p>
              </div>
            ) : (
              <div>
                {/* Donut Container with Floating Center Total */}
                <div className="pnl-donut-container" style={{ height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryBreakdown.map((_, index) => (
                          <Cell
                            key={`cat-cell-${index}`}
                            fill={PALETTE[index % PALETTE.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [formatPKR(val), 'Cost']}
                        contentStyle={{
                          background: '#ffffff',
                          borderRadius: 8,
                          border: '1px solid #e3e8e0',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pnl-donut-center">
                    <p className="pnl-donut-center-val">{formatPKR(periodMetrics.totalExpense)}</p>
                    <div className="pnl-donut-center-lbl">TOTAL OPEX</div>
                  </div>
                </div>

                <div className="mt-3">
                  {categoryBreakdown.map((cat, idx) => (
                    <div key={cat.name} className="py-1">
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="d-flex align-items-center gap-2">
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: PALETTE[idx % PALETTE.length],
                              flexShrink: 0,
                            }}
                          />
                          <span className="fw-medium text-dark">{cat.name}</span>
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-secondary small">{cat.percent}%</span>
                          <span className="fw-semibold text-dark">{formatPKR(cat.value)}</span>
                        </div>
                      </div>
                      <div className="progress mt-1" style={{ height: 4 }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${cat.percent}%`,
                            backgroundColor: PALETTE[idx % PALETTE.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Crop-Wise Performance Dual Comparison */}
        <div className="col-12 col-lg-7">
          <div className="analytics-card h-100">
            <div className="analytics-card-header mb-3">
              <div>
                <p className="analytics-eyebrow">HARVEST YIELD ANALYSIS</p>
                <h3 className="h6 fw-bold mb-0">Crop-Wise Revenue vs Costs</h3>
              </div>
              <div
                style={{
                  width: 42,
                  height: 42,
                  minWidth: 42,
                  minHeight: 42,
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                }}
              >
                <BarChart3 size={19} />
              </div>
            </div>

            {cropPerformance.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <Sprout size={34} className="mb-2 opacity-50" />
                <p className="small mb-0">No crop sales or expenses allocated yet.</p>
              </div>
            ) : (
              <div>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cropPerformance}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke="#68756C" fontSize={11} tickLine={false} />
                      <YAxis stroke="#68756C" fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(value, name) => [
                          formatPKR(value),
                          name === 'income' ? 'Sales Revenue' : 'Operating Cost',
                        ]}
                        contentStyle={{
                          background: '#ffffff',
                          borderRadius: 8,
                          border: '1px solid #e3e8e0',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="income" name="income" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="expense" fill="#DC3545" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="d-flex justify-content-center gap-4 mt-2 small text-secondary">
                  <span className="d-flex align-items-center gap-1">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2E7D32' }} />
                    Produce Sales (PKR)
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC3545' }} />
                    Allocated Costs (PKR)
                  </span>
                </div>

                {/* Crop Net Margins Pill Tags */}
                <div className="d-flex flex-wrap gap-2 mt-3 pt-2 border-top">
                  {cropPerformance.map((crop) => (
                    <span
                      key={crop.id}
                      className={`badge rounded-pill small ${
                        crop.net >= 0
                          ? 'bg-success-subtle text-success border border-success-subtle'
                          : 'bg-danger-subtle text-danger border border-danger-subtle'
                      }`}
                    >
                      {crop.name}: {crop.net >= 0 ? '+' : '−'}
                      {formatPKR(Math.abs(crop.net))}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          FINTECH AUDITED TRANSACTION REGISTER (CONTROLS LOCKED TO FAR RIGHT)
          ========================================================================= */}
      <div className="analytics-card p-0 overflow-hidden">
        <div className="p-3 p-md-4 border-bottom bg-white">
          <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3 w-100">
            <div>
              <p className="analytics-eyebrow text-success mb-1">AUDIT TRAIL & GENERAL LEDGER</p>
              <h3 className="h6 fw-bold mb-0 text-dark">Financial Cashflow Transactions</h3>
            </div>

            {/* Right-aligned filters & search on a single sleek row */}
            <div className="d-flex flex-wrap flex-sm-nowrap align-items-center gap-2 ms-lg-auto">
              {/* Type Switcher */}
              <div className="btn-group btn-group-sm rounded-pill border p-1 bg-light flex-shrink-0" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill border-0 px-3 fw-semibold ${
                    activeTab === 'all' ? 'btn-white bg-white shadow-sm text-dark' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('all')}
                >
                  All ({ledger.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill border-0 px-3 fw-semibold ${
                    activeTab === 'income' ? 'btn-white bg-white shadow-sm text-success' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('income')}
                >
                  Sales Inflow
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill border-0 px-3 fw-semibold ${
                    activeTab === 'expense' ? 'btn-white bg-white shadow-sm text-danger' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('expense')}
                >
                  Expense Outflow
                </button>
              </div>

              {/* Search Field */}
              <div
                className="input-group input-group-sm rounded-pill border bg-white overflow-hidden shadow-sm flex-shrink-0"
                style={{ width: 220, minWidth: 160 }}
              >
                <span className="input-group-text bg-white border-0 ps-3 pe-2 text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className="form-control border-0 ps-1 pe-2 py-1 bg-transparent"
                  placeholder="Search ledger..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ fontSize: 13, boxShadow: 'none' }}
                />
                {search && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-muted p-0 pe-2 text-decoration-none"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {ledger.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <Calendar size={36} className="mb-2 opacity-50" />
            <p className="small mb-0">No transactions match your current search or filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table pnl-table mb-0">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>TRANSACTION</th>
                  <th>PARTY / CLIENT</th>
                  <th>SPECIFICATIONS</th>
                  <th>SETTLEMENT</th>
                  <th className="text-end">AMOUNT (PKR)</th>
                  <th className="text-center" style={{ width: 60 }}>RECEIPT</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((item) => {
                  const isIncome = item.type === 'income'

                  return (
                    <tr
                      key={item.id}
                      className="pnl-interactive-row"
                      onClick={() => setSelectedReceipt(item)}
                      title="Click to view digital voucher"
                    >
                      <td className="text-nowrap small text-secondary">
                        {item.date}
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="pnl-avatar text-white"
                            style={{
                              background: item.colorGradient,
                              width: 38,
                              height: 38,
                              minWidth: 38,
                              minHeight: 38,
                              aspectRatio: '1 / 1',
                              borderRadius: '50%',
                              flexShrink: 0,
                              display: 'grid',
                              placeItems: 'center',
                            }}
                          >
                            {getInitials(item.counterparty)}
                          </div>
                          <div>
                            <span className="fw-semibold text-dark d-block">{item.title}</span>
                            <span className="badge bg-light text-secondary border small">
                              {item.tag}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="fw-medium text-dark d-block">{item.counterparty}</span>
                        <span className="small text-secondary">{item.contact}</span>
                      </td>

                      <td className="small text-secondary">
                        {item.detail}
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {isIncome ? (
                            item.isCompleted ? (
                              <>
                                <span className="pnl-pulse-dot pnl-pulse-dot--green" />
                                <span className="badge rounded-pill bg-success-subtle text-success border border-success-subtle">
                                  Fulfilled
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="pnl-pulse-dot pnl-pulse-dot--amber" />
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                                  In Queue
                                </span>
                              </>
                            )
                          ) : (
                            <>
                              <span className="pnl-pulse-dot pnl-pulse-dot--green" />
                              <span className="badge rounded-pill bg-light text-secondary border">
                                Settled
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td
                        className={`text-end fw-bold text-nowrap ${
                          isIncome
                            ? item.isCompleted
                              ? 'text-success'
                              : 'text-primary'
                            : 'text-danger'
                        }`}
                      >
                        {isIncome ? '+' : '−'}
                        {formatPKR(item.amount)}
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border p-1 rounded-circle"
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedReceipt(item)
                          }}
                          title="View Digital Receipt"
                        >
                          <Eye size={13} className="text-secondary" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-white border-top d-flex justify-content-between align-items-center small text-secondary">
          <span>Displaying <strong>{ledger.length}</strong> real-time transactions</span>
          <span>Click any row to open Digital Receipt Voucher</span>
        </div>
      </div>

      {/* =========================================================================
          DIGITAL INVOICE / RECEIPT POPUP MODAL
          ========================================================================= */}
      {selectedReceipt && (
        <div className="pnl-receipt-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="pnl-receipt-card" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-bottom bg-light d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <FileCheck2 size={20} className="text-success" />
                <h5 className="fw-bold mb-0 text-dark">Official Farm Voucher</h5>
              </div>
              <button
                type="button"
                className="btn btn-light rounded-circle p-2"
                aria-label="Close receipt"
                onClick={() => setSelectedReceipt(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              <div className="text-center pb-3 border-bottom mb-3">
                <span className="small text-secondary text-uppercase fw-semibold">AGRISENSE FARM ENTERPRISE</span>
                <h3 className="h4 fw-bold mt-1 mb-0">{formatPKR(selectedReceipt.amount)}</h3>
                <span
                  className={`badge rounded-pill mt-2 ${
                    selectedReceipt.type === 'income'
                      ? selectedReceipt.isCompleted
                        ? 'bg-success-subtle text-success border border-success-subtle'
                        : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                      : 'bg-danger-subtle text-danger border border-danger-subtle'
                  }`}
                >
                  {selectedReceipt.type === 'income' ? 'Produce Inflow Deal' : 'Operational Disbursement'}
                </span>
              </div>

              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Transaction Title:</span>
                  <strong className="text-dark">{selectedReceipt.title}</strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Entity / Counterparty:</span>
                  <strong className="text-dark">{selectedReceipt.counterparty}</strong>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Execution Date:</span>
                  <span className="text-dark">{selectedReceipt.date}</span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Allocation Category:</span>
                  <span className="badge text-bg-light border">{selectedReceipt.tag}</span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Volume / Specifications:</span>
                  <span className="text-dark">{selectedReceipt.detail}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 rounded-pill"
                  onClick={() => window.print()}
                >
                  <Printer size={15} className="me-1 inline" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  className="btn btn-dark w-100 rounded-pill"
                  onClick={() => setSelectedReceipt(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
