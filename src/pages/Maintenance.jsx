import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import {
  Plus,
  Search,
  Wrench,
  Pencil,
  Trash2,
  CalendarDays,
  Banknote,
  RotateCcw,
  X,
  ClipboardCheck,
} from 'lucide-react'

import {
  maintenanceAdded,
  maintenanceUpdated,
  maintenanceDeleted,
  maintenanceErrorCleared,
} from '../store/maintenanceSlice'

const initialForm = {
  equipmentId: '',
  type: 'Routine Service',
  serviceDate: new Date().toISOString().slice(0, 10),
  nextServiceDate: '',
  cost: '',
  status: 'Scheduled',
  notes: '',
}

const maintenanceTypes = [
  'Routine Service',
  'Repair',
  'Oil Change',
  'Inspection',
  'Parts Replacement',
  'Other',
]

function formatCurrency(value) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusClass(status) {
  const value = status?.toLowerCase()

  if (value === 'completed') return 'bg-success-subtle text-success'
  if (value === 'in progress') return 'bg-primary-subtle text-primary'
  if (value === 'scheduled') return 'bg-warning-subtle text-warning-emphasis'

  return 'bg-secondary-subtle text-secondary'
}

export default function Maintenance() {
  const dispatch = useDispatch()

  const equipment = useSelector(
    (state) => state.equipment?.items ?? [],
  )

  const maintenance = useSelector(
    (state) => state.maintenance?.items ?? [],
  )

  const error = useSelector(
    (state) => state.maintenance?.error ?? null,
  )

  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)

  const getEquipmentName = (equipmentId) => {
    const item = equipment.find(
      (entry) => entry.id === equipmentId,
    )

    return item?.name ?? 'Equipment unavailable'
  }

  const stats = useMemo(() => {
    const totalCost = maintenance.reduce(
      (sum, item) => sum + (Number(item.cost) || 0),
      0,
    )

    const completed = maintenance.filter(
      (item) => item.status?.toLowerCase() === 'completed',
    ).length

    const pending = maintenance.filter(
      (item) =>
        ['scheduled', 'in progress'].includes(
          item.status?.toLowerCase(),
        ),
    ).length

    const today = new Date().toISOString().slice(0, 10)

    const overdue = maintenance.filter(
      (item) =>
        item.nextServiceDate &&
        item.nextServiceDate < today &&
        item.status?.toLowerCase() === 'completed',
    ).length

    return {
      total: maintenance.length,
      totalCost,
      completed,
      pending,
      overdue,
    }
  }, [maintenance])

  const filteredMaintenance = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...maintenance]
      .filter((item) => {
        const equipmentName = getEquipmentName(item.equipmentId)
        const matchesSearch = [
          equipmentName,
          item.type,
          item.status,
          item.notes,
        ].some((value) =>
          String(value ?? '').toLowerCase().includes(query),
        )

        const matchesStatus =
          statusFilter === 'All' ||
          item.status?.toLowerCase() === statusFilter.toLowerCase()

        return matchesSearch && matchesStatus
      })
      .sort((a, b) =>
        String(b.serviceDate ?? '').localeCompare(
          String(a.serviceDate ?? ''),
        ),
      )
  }, [maintenance, equipment, search, statusFilter])

  const resetForm = () => {
    setForm({
      ...initialForm,
      equipmentId: equipment[0]?.id ?? '',
    })
    setEditingId(null)
    setShowForm(false)
    dispatch(maintenanceErrorCleared())
  }

  const openNewForm = () => {
    setForm({
      ...initialForm,
      equipmentId: equipment[0]?.id ?? '',
    })
    setEditingId(null)
    dispatch(maintenanceErrorCleared())
    setShowForm(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (error) dispatch(maintenanceErrorCleared())
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!form.equipmentId) {
      window.alert('Please add equipment before creating a maintenance record.')
      return
    }

    if (!form.type || !form.serviceDate || !form.status) {
      window.alert('Please complete all required fields.')
      return
    }

    if (
      form.nextServiceDate &&
      form.nextServiceDate < form.serviceDate
    ) {
      window.alert('Next service date cannot be earlier than the service date.')
      return
    }

    const duplicate = maintenance.some((item) => {
      if (item.id === editingId) return false

      return (
        item.equipmentId === form.equipmentId &&
        item.serviceDate === form.serviceDate &&
        item.type === form.type
      )
    })

    if (duplicate) {
      window.alert(
        'A maintenance record with the same equipment, date, and type already exists.'
      )
      return
    }

    const payload = {
      ...form,
      cost: Number(form.cost) || 0,
      notes: form.notes.trim(),
    }

    if (editingId) {
      dispatch(
        maintenanceUpdated({
          id: editingId,
          changes: payload,
        }),
      )
    } else {
      dispatch(maintenanceAdded(payload))
    }

    resetForm()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({
      equipmentId: item.equipmentId ?? '',
      type: item.type ?? 'Routine Service',
      serviceDate: item.serviceDate ?? '',
      nextServiceDate: item.nextServiceDate ?? '',
      cost: String(item.cost ?? ''),
      status: item.status ?? 'Scheduled',
      notes: item.notes ?? '',
    })

    dispatch(maintenanceErrorCleared())
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (item) => {
    const confirmed = window.confirm(
      `Delete the ${item.type} record for ${getEquipmentName(item.equipmentId)}? This cannot be undone.`,
    )

    if (confirmed) {
      dispatch(maintenanceDeleted(item.id))

      if (editingId === item.id) resetForm()
    }
  }

  const handleReset = () => {
    setSearch('')
    setStatusFilter('All')
  }

  return (
    <div className="container-fluid py-3 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-3 bg-primary-subtle text-primary p-2">
              <Wrench size={23} />
            </div>
            <h2 className="h3 fw-bold mb-0">Maintenance Tracker</h2>
          </div>
          <p className="text-secondary mb-0">
            Track servicing, repairs, costs and upcoming maintenance.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={showForm ? resetForm : openNewForm}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Close Form' : 'Add Maintenance'}
        </button>
      </div>

      {equipment.length === 0 && (
        <div className="alert alert-warning">
          No equipment records found. Add equipment from the Equipment page
          before recording maintenance.
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger d-flex justify-content-between align-items-center gap-2"
          role="alert"
        >
          <span>{error}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss error"
            onClick={() => dispatch(maintenanceErrorCleared())}
          />
        </div>
      )}

      {/* 5 KPI Cards with Area Sparklines */}
      <div className="executive-kpi-grid mb-4">
        {/* 1. Total Records */}
        <div className="executive-kpi-item">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column justify-content-between" style={{ borderTop: '4px solid #0284c7' }}>
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                  Total Records
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, minWidth: 38, minHeight: 38, background: '#e0f2fe', color: '#0369a1' }}
                >
                  <ClipboardCheck size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-dark">{stats.total}</h3>
            </div>

            <div style={{ width: '100%', height: 36, marginTop: 4, marginBottom: 2 }}>
              <ResponsiveContainer width="100%" height={36}>
                <AreaChart
                  data={[
                    { val: Math.max(stats.total - 2, 1) },
                    { val: Math.max(stats.total - 1, 1) },
                    { val: Math.max(stats.total - 1, 2) },
                    { val: stats.total },
                    { val: stats.total },
                    { val: stats.total },
                    { val: stats.total },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mainSparkTot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#0284c7" strokeWidth={2} fill="url(#mainSparkTot)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="small text-secondary" style={{ fontSize: '11px' }}>Service history log</span>
          </div>
        </div>

        {/* 2. Completed */}
        <div className="executive-kpi-item">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column justify-content-between" style={{ borderTop: '4px solid #10b981' }}>
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                  Completed
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, minWidth: 38, minHeight: 38, background: '#e8f5e9', color: '#1b5e20' }}
                >
                  <ClipboardCheck size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-success">{stats.completed}</h3>
            </div>

            <div style={{ width: '100%', height: 36, marginTop: 4, marginBottom: 2 }}>
              <ResponsiveContainer width="100%" height={36}>
                <AreaChart
                  data={[
                    { val: Math.max(stats.completed - 2, 0) },
                    { val: Math.max(stats.completed - 1, 0) },
                    { val: Math.max(stats.completed - 1, 1) },
                    { val: stats.completed },
                    { val: stats.completed },
                    { val: stats.completed },
                    { val: stats.completed },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mainSparkComp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} fill="url(#mainSparkComp)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="small text-secondary" style={{ fontSize: '11px' }}>Repairs resolved</span>
          </div>
        </div>

        {/* 3. Pending */}
        <div className="executive-kpi-item">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column justify-content-between" style={{ borderTop: '4px solid #f59e0b' }}>
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                  Pending
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, minWidth: 38, minHeight: 38, background: '#fef3c7', color: '#b45309' }}
                >
                  <Wrench size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 text-warning">{stats.pending}</h3>
            </div>

            <div style={{ width: '100%', height: 36, marginTop: 4, marginBottom: 2 }}>
              <ResponsiveContainer width="100%" height={36}>
                <AreaChart
                  data={[
                    { val: Math.max(stats.pending - 1, 0) },
                    { val: Math.max(stats.pending, 1) },
                    { val: Math.max(stats.pending + 1, 1) },
                    { val: Math.max(stats.pending, 1) },
                    { val: Math.max(stats.pending + 1, 2) },
                    { val: stats.pending },
                    { val: stats.pending },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mainSparkPend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} fill="url(#mainSparkPend)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="small text-secondary" style={{ fontSize: '11px' }}>Awaiting workshop</span>
          </div>
        </div>

        {/* 4. Total Cost */}
        <div className="executive-kpi-item">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column justify-content-between" style={{ borderTop: '4px solid #06b6d4' }}>
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                  Total Cost
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 38, height: 38, minWidth: 38, minHeight: 38, background: '#e0f7fa', color: '#00838f' }}
                >
                  <Banknote size={18} />
                </div>
              </div>
              <h3 className="fw-bold mb-0 fs-6 text-dark">{formatCurrency(stats.totalCost)}</h3>
            </div>

            <div style={{ width: '100%', height: 36, marginTop: 4, marginBottom: 2 }}>
              <ResponsiveContainer width="100%" height={36}>
                <AreaChart
                  data={[
                    { val: Math.round(stats.totalCost * 0.35) || 10 },
                    { val: Math.round(stats.totalCost * 0.5) || 15 },
                    { val: Math.round(stats.totalCost * 0.6) || 18 },
                    { val: Math.round(stats.totalCost * 0.75) || 22 },
                    { val: Math.round(stats.totalCost * 0.85) || 25 },
                    { val: Math.round(stats.totalCost * 0.95) || 28 },
                    { val: stats.totalCost || 30 },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mainSparkCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={2} fill="url(#mainSparkCost)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="small text-secondary" style={{ fontSize: '11px' }}>Cumulative outlay</span>
          </div>
        </div>

        {/* 5. Overdue Next */}
        <div className="executive-kpi-item">
          <div
            className="card border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column justify-content-between"
            style={{ borderTop: `4px solid ${stats.overdue > 0 ? '#ef4444' : '#10b981'}` }}
          >
            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.04em' }}>
                  Overdue Next
                </span>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    minHeight: 38,
                    background: stats.overdue > 0 ? '#fff1f2' : '#e8f5e9',
                    color: stats.overdue > 0 ? '#e11d48' : '#2e7d32',
                  }}
                >
                  <CalendarDays size={18} />
                </div>
              </div>
              <h3 className={`fw-bold mb-0 ${stats.overdue > 0 ? 'text-danger' : 'text-success'}`}>{stats.overdue}</h3>
            </div>

            <div style={{ width: '100%', height: 36, marginTop: 4, marginBottom: 2 }}>
              <ResponsiveContainer width="100%" height={36}>
                <AreaChart
                  data={[
                    { val: stats.overdue > 0 ? 0 : 0 },
                    { val: stats.overdue > 0 ? 1 : 0 },
                    { val: stats.overdue > 0 ? 1 : 0 },
                    { val: stats.overdue > 0 ? 2 : 0 },
                    { val: stats.overdue > 0 ? 1 : 0 },
                    { val: stats.overdue },
                    { val: stats.overdue },
                  ]}
                  margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="mainSparkOver" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={stats.overdue > 0 ? '#ef4444' : '#10b981'} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={stats.overdue > 0 ? '#ef4444' : '#10b981'} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="val"
                    stroke={stats.overdue > 0 ? '#ef4444' : '#10b981'}
                    strokeWidth={2}
                    fill="url(#mainSparkOver)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="small text-secondary" style={{ fontSize: '11px' }}>
              {stats.overdue > 0 ? 'Urgent attention' : 'All up to date'}
            </span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3">
            <h3 className="h5 fw-bold mb-0">
              {editingId ? 'Edit Maintenance Record' : 'Create Maintenance Record'}
            </h3>
          </div>

          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">
                    Equipment <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="equipmentId"
                    value={form.equipmentId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select equipment</option>
                    {equipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.serialNumber ? ` — ${item.serialNumber}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">
                    Maintenance Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                  >
                    {maintenanceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">
                    Service Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="serviceDate"
                    value={form.serviceDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">Next Service Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="nextServiceDate"
                    value={form.nextServiceDate}
                    min={form.serviceDate || undefined}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">Cost (PKR)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="cost"
                    value={form.cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 5000"
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the work completed or required..."
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={equipment.length === 0}
                >
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <h3 className="h5 fw-bold mb-1">Maintenance History</h3>
              <p className="text-secondary small mb-0">
                {filteredMaintenance.length} record(s) found
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
              onClick={handleReset}
            >
              <RotateCcw size={15} />
              Reset Filters
            </button>
          </div>

          <div className="row g-2 mt-2">
            <div className="col-12 col-md-7">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={17} />
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search equipment, type or notes..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-5">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by maintenance status"
              >
                <option value="All">All Statuses</option>
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {filteredMaintenance.length === 0 ? (
            <div className="text-center py-5 px-3">
              <Wrench size={38} className="text-secondary mb-3" />
              <h4 className="h6 fw-bold">No maintenance records found</h4>
              <p className="text-secondary mb-3">
                Add a record or adjust your search and filters.
              </p>
              {equipment.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={openNewForm}
                >
                  <Plus size={16} className="me-1" />
                  Add First Record
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3 py-3">Equipment</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Service Date</th>
                    <th className="py-3">Next Service</th>
                    <th className="py-3">Cost</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-end pe-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMaintenance.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3">
                        <div className="fw-semibold">
                          {getEquipmentName(item.equipmentId)}
                        </div>
                        {item.notes && (
                          <div
                            className="text-secondary small"
                            title={item.notes}
                          >
                            {item.notes.length > 42
                              ? `${item.notes.slice(0, 42)}…`
                              : item.notes}
                          </div>
                        )}
                      </td>

                      <td>{item.type}</td>
                      <td className="text-nowrap">{formatDate(item.serviceDate)}</td>

                      <td className="text-nowrap">
                        {formatDate(item.nextServiceDate)}
                        {item.nextServiceDate &&
                          item.nextServiceDate <
                            new Date().toISOString().slice(0, 10) &&
                          item.status?.toLowerCase() === 'completed' && (
                            <div className="text-danger small">Overdue</div>
                          )}
                      </td>

                      <td className="text-nowrap fw-semibold">
                        {formatCurrency(item.cost)}
                      </td>

                      <td>
                        <span
                          className={`badge rounded-pill ${getStatusClass(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="text-end pe-3">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            title="Edit record"
                            aria-label="Edit maintenance record"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil size={15} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title="Delete record"
                            aria-label="Delete maintenance record"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
