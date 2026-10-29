import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Receipt,
  Plus,
  Search,
  Pencil,
  Trash2,
  Wallet,
  X,
  Download,
  Printer,
  ShieldCheck,
  TrendingDown,
  Tag,
} from 'lucide-react'

import {
  expenseAdded,
  expenseUpdated,
  expenseDeleted,
  selectAllExpenses,
  selectTotalExpenses,
} from '../store/expensesSlice'
import { selectAllCrops } from '../store/cropsSlice'
import { selectUserRole } from '../store/authSlice'
import { activityAdded } from '../store/activitySlice'
import { exportToCSV } from '../services/csvExport'

const CATEGORIES = [
  'Seeds',
  'Fertilizer',
  'Pesticides',
  'Labour',
  'Irrigation',
  'Fuel',
  'Equipment',
  'Transport',
  'Other',
]

const EMPTY_FORM = {
  title: '',
  category: 'Seeds',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  cropId: '',
  notes: '',
}

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

export default function Expenses() {
  const dispatch = useDispatch()
  const expenses = useSelector(selectAllExpenses)
  const totalExpenses = useSelector(selectTotalExpenses)
  const crops = useSelector(selectAllCrops)
  const role = useSelector(selectUserRole)
  const isAdmin = role === 'Admin'

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Top category calculation
  const topCategory = useMemo(() => {
    if (expenses.length === 0) return { name: 'None', amount: 0 }
    const catMap = {}
    expenses.forEach((e) => {
      const c = e.category || 'Other'
      catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0)
    })
    const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])
    return { name: sorted[0][0], amount: sorted[0][1] }
  }, [expenses])

  const visibleExpenses = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...expenses]
      .filter((expense) => {
        const matchesSearch =
          String(expense.title || '').toLowerCase().includes(query) ||
          String(expense.category || '').toLowerCase().includes(query) ||
          String(expense.notes || '').toLowerCase().includes(query)

        const matchesCategory =
          categoryFilter === 'All' ||
          expense.category === categoryFilter

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [expenses, search, categoryFilter])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setError('')
    setSuccess('')
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const amount = Number(form.amount)

    if (!form.title.trim()) {
      setError('Please enter an expense title.')
      return
    }

    if (!form.date) {
      setError('Please select the expense date.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be a number greater than zero.')
      return
    }

    if (form.cropId && !crops.some((crop) => crop.id === form.cropId)) {
      setError('The selected crop could not be found. Please select it again.')
      return
    }

    const expenseData = {
      title: form.title.trim(),
      category: form.category,
      amount,
      date: form.date,
      cropId: form.cropId || null,
      notes: form.notes.trim(),
    }

    if (editingId) {
      if (!isAdmin) {
        setError('Only Admin users can edit expenses.')
        return
      }

      dispatch(
        expenseUpdated({
          id: editingId,
          changes: expenseData,
        })
      )

      dispatch(
        activityAdded({
          action: 'UPDATE',
          entity: 'Expense',
          entityId: editingId,
          description: `Updated expense: ${expenseData.title} (${expenseData.category}, PKR ${expenseData.amount})`,
        })
      )

      setSuccess('Expense record updated successfully.')
    } else {
      dispatch(expenseAdded(expenseData))

      dispatch(
        activityAdded({
          action: 'CREATE',
          entity: 'Expense',
          description: `Recorded expense: ${expenseData.title} (${expenseData.category}, PKR ${expenseData.amount})`,
        })
      )

      setSuccess('Expense record logged successfully.')
    }

    resetForm()
  }

  function handleEdit(expense) {
    if (!isAdmin) return

    setEditingId(expense.id)
    setForm({
      title: expense.title || '',
      category: expense.category || 'Other',
      amount: String(expense.amount ?? ''),
      date: expense.date || '',
      cropId: expense.cropId || '',
      notes: expense.notes || '',
    })
    setShowForm(true)
    setError('')
    setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(expense) {
    if (!isAdmin) return

    const confirmed = window.confirm(
      `Delete expense "${expense.title}"? This action cannot be undone.`
    )

    if (confirmed) {
      dispatch(expenseDeleted(expense.id))

      dispatch(
        activityAdded({
          action: 'DELETE',
          entity: 'Expense',
          entityId: expense.id,
          description: `Deleted expense: ${expense.title} (${expense.category}, PKR ${expense.amount})`,
        })
      )

      if (editingId === expense.id) {
        resetForm()
      }

      setError('')
      setSuccess('Expense deleted successfully.')
    }
  }

  const handleExportCSV = () => {
    const exportData = visibleExpenses.map((exp) => {
      const crop = crops.find((c) => c.id === exp.cropId)
      return {
        Expense_ID: exp.id,
        Date: exp.date,
        Title: exp.title,
        Category: exp.category,
        Allocated_Crop: crop?.name || 'General Farm',
        Amount_PKR: exp.amount,
        Notes: exp.notes || '',
      }
    })
    exportToCSV(exportData, `Farm_Expenses_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="analytics-eyebrow text-success mb-0">
              OPERATIONAL EXPENDITURES
            </span>
            <span className="badge rounded-pill bg-light text-secondary border small">
              <ShieldCheck size={12} className="me-1 inline" />
              Audited Ledger
            </span>
          </div>
          <h1 className="h3 fw-bold mb-1 text-dark">Farm Expenses</h1>
          <p className="text-secondary small mb-0">
            Track operational spending, cost allocations across crops, and purchase outflows.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={handleExportCSV}
            title="Download CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={() => window.print()}
            title="Print"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>

          <button
            type="button"
            className="btn btn-success btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm fw-semibold"
            onClick={() => {
              setForm(EMPTY_FORM)
              setEditingId(null)
              setError('')
              setSuccess('')
              setShowForm(true)
            }}
          >
            <Plus size={16} />
            Record Expense
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
          {error}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 mb-4" role="status">
          {success}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setSuccess('')} />
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="pnl-stat-card card--expense h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Total Farm Expenditure</span>
              <div className="stat-card-icon" style={{ background: '#ffebee', color: '#b71c1c' }}>
                <Wallet size={22} />
              </div>
            </div>
            <div className="stat-card-value text-danger">
              {formatPKR(totalExpenses)}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between align-items-center">
              <span>{expenses.length} expense transactions</span>
              <span className="badge rounded-pill bg-danger-subtle text-danger small">Opex Outflow</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="pnl-stat-card card--pipeline h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Cost Distribution</span>
              <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <Tag size={22} />
              </div>
            </div>
            <div className="stat-card-value text-dark">
              {CATEGORIES.length}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between align-items-center">
              <span>Active operational categories</span>
              <span className="badge rounded-pill bg-light text-secondary border small">Categories</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="pnl-stat-card card--income h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Highest Cost Center</span>
              <div className="stat-card-icon" style={{ background: '#e8f5e9', color: '#1b5e20' }}>
                <TrendingDown size={22} />
              </div>
            </div>
            <div className="stat-card-value text-dark" style={{ fontSize: '1.45rem' }}>
              {topCategory.name}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between align-items-center">
              <span>{formatPKR(topCategory.amount)} absorbed</span>
              <span className="badge rounded-pill bg-light text-secondary border small">Peak Center</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide / Collapsible Form */}
      {showForm && (
        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-header bg-white border-bottom p-3 p-md-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 bg-danger-subtle text-danger">
                <Receipt size={18} />
              </span>
              <h2 className="h5 fw-bold mb-0">
                {editingId ? 'Edit Expenditure Record' : 'Record New Farm Expense'}
              </h2>
            </div>

            <button
              type="button"
              className="btn btn-light rounded-circle p-2"
              aria-label="Close expense form"
              onClick={resetForm}
            >
              <X size={18} />
            </button>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="expense-title" className="form-label fw-semibold">
                    Expense Title *
                  </label>
                  <input
                    id="expense-title"
                    className="form-control"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Wheat seeds purchase"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="expense-category" className="form-label fw-semibold">
                    Category *
                  </label>
                  <select
                    id="expense-category"
                    className="form-select"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="expense-amount" className="form-label fw-semibold">
                    Amount (PKR) *
                  </label>
                  <input
                    id="expense-amount"
                    className="form-control"
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 5000"
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="expense-date" className="form-label fw-semibold">
                    Expense Date *
                  </label>
                  <input
                    id="expense-date"
                    className="form-control"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="expense-crop" className="form-label fw-semibold">
                    Related Crop
                  </label>
                  <select
                    id="expense-crop"
                    className="form-select"
                    name="cropId"
                    value={form.cropId}
                    onChange={handleChange}
                  >
                    <option value="">General farm expense</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} — {crop.field}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label htmlFor="expense-notes" className="form-label fw-semibold">
                    Notes & Receipts
                  </label>
                  <textarea
                    id="expense-notes"
                    className="form-control"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={2}
                    maxLength={500}
                    placeholder="Vendor details, receipt numbers, or allocation notes..."
                  />
                </div>

                <div className="col-12 d-flex flex-wrap gap-2 mt-4 pt-2 border-top">
                  <button className="btn btn-success rounded-pill px-4 fw-semibold" type="submit">
                    {editingId ? 'Save Changes' : 'Log Expense'}
                  </button>

                  <button
                    className="btn btn-outline-secondary rounded-pill px-4"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Expenses Table */}
      <div className="analytics-card p-0 overflow-hidden">
        <div className="p-3 p-md-4 border-bottom bg-white">
          <div className="row g-3 align-items-center justify-content-between">
            <div className="col-12 col-md-6">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={15} className="text-secondary" />
                </span>
                <input
                  className="form-control border-start-0"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search expenses by title, category, or notes..."
                  aria-label="Search expenses"
                />
              </div>
            </div>

            <div className="col-12 col-md-4 text-md-end">
              <select
                className="form-select form-select-sm d-inline-block"
                style={{ maxWidth: 200 }}
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                aria-label="Filter expenses by category"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {visibleExpenses.length === 0 ? (
          <div className="text-center text-secondary py-5">
            <Receipt size={36} className="mb-2 opacity-50" />
            <p className="fw-semibold mb-1">No expense records found</p>
            <p className="small mb-0">
              {expenses.length === 0
                ? 'No expenses recorded yet. Click "Record Expense" above.'
                : 'No expenses match your search or category filter.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table pnl-table mb-0">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>EXPENSE & DETAILS</th>
                  <th>CATEGORY</th>
                  <th>ALLOCATED CROP</th>
                  <th className="text-end">AMOUNT (PKR)</th>
                  {isAdmin && <th className="text-end pe-3">ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {visibleExpenses.map((expense) => {
                  const crop = crops.find(
                    (item) => item.id === expense.cropId
                  )

                  return (
                    <tr key={expense.id}>
                      <td className="text-nowrap small text-secondary">
                        {formatDate(expense.date)}
                      </td>

                      <td>
                        <div className="fw-semibold text-dark">{expense.title}</div>
                        {expense.notes && (
                          <div
                            className="small text-secondary"
                            style={{ maxWidth: 300 }}
                          >
                            {expense.notes}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="badge text-bg-light border">
                          {expense.category}
                        </span>
                      </td>

                      <td>
                        {crop ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {crop.name}
                          </span>
                        ) : (
                          <span className="text-secondary small">General Farm</span>
                        )}
                      </td>

                      <td className="text-end fw-bold text-danger text-nowrap">
                        −{formatPKR(expense.amount)}
                      </td>

                      {isAdmin && (
                        <td className="text-end pe-3 text-nowrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => handleEdit(expense)}
                            aria-label={`Edit ${expense.title}`}
                            title="Edit expense"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(expense)}
                            aria-label={`Delete ${expense.title}`}
                            title="Delete expense"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3 bg-white border-top d-flex justify-content-between align-items-center small text-secondary">
          <span>Displaying <strong>{visibleExpenses.length}</strong> of <strong>{expenses.length}</strong> expense records</span>
          <span>Total: <strong>{formatPKR(totalExpenses)}</strong></span>
        </div>
      </div>
    </div>
  )
}
