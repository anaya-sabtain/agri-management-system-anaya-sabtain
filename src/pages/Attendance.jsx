import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  CalendarCheck,
  Search,
  Users,
  Clock3,
  Wallet,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react'

import {
  attendanceAdded,
  attendanceUpdated,
  attendanceDeleted,
} from '../store/attendanceSlice'

import { selectAllWorkers } from '../store/workersSlice'

function getLocalDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function calculateWage(dailyWage, status) {
  const rate = Number(dailyWage) || 0

  if (status === 'present') return rate
  if (status === 'half-day') return rate / 2

  return 0
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const emptyForm = {
  workerId: '',
  date: getLocalDate(),
  status: 'present',
  hoursWorked: '8',
  notes: '',
}

export default function Attendance() {
  const dispatch = useDispatch()

  const workers = useSelector(selectAllWorkers)
  const attendance = useSelector(
    (state) => state.attendance?.items ?? []
  )

  const [form, setForm] = useState({ ...emptyForm })
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState(getLocalDate())
  const [filterStatus, setFilterStatus] = useState('all')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  const workerMap = useMemo(
    () => new Map(workers.map((worker) => [worker.id, worker])),
    [workers]
  )

  const filteredAttendance = useMemo(() => {
    return attendance
      .filter((record) => {
        const worker = workerMap.get(record.workerId)

        const matchesSearch =
          worker?.fullName
            ?.toLowerCase()
            .includes(search.trim().toLowerCase()) ??
          false

        const matchesDate =
          !filterDate || record.date === filterDate

        const matchesStatus =
          filterStatus === 'all' ||
          record.status === filterStatus

        return matchesSearch && matchesDate && matchesStatus
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [
    attendance,
    workerMap,
    search,
    filterDate,
    filterStatus,
  ])

  const todayRecords = attendance.filter(
    (record) => record.date === getLocalDate()
  )

  const todayPresent = todayRecords.filter(
    (record) => record.status === 'present'
  ).length

  const todayHalfDay = todayRecords.filter(
    (record) => record.status === 'half-day'
  ).length

  const todayAbsent = todayRecords.filter(
    (record) => record.status === 'absent'
  ).length

  const todayWages = todayRecords.reduce((total, record) => {
    const worker = workerMap.get(record.workerId)

    return (
      total +
      calculateWage(worker?.dailyWage, record.status)
    )
  }, 0)

  const selectedWorker = workerMap.get(form.workerId)

  const previewWage = calculateWage(
    selectedWorker?.dailyWage,
    form.status
  )

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'status' && value === 'absent'
        ? { hoursWorked: '0' }
        : {}),
      ...(name === 'status' && value === 'half-day'
        ? { hoursWorked: '4' }
        : {}),
      ...(name === 'status' && value === 'present'
        ? { hoursWorked: '8' }
        : {}),
    }))

    setError('')
  }

  function resetForm() {
    setForm({ ...emptyForm, date: getLocalDate() })
    setEditingId(null)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.workerId) {
      setError('Please select a worker.')
      return
    }

    if (!workerMap.has(form.workerId)) {
      setError('Selected worker could not be found.')
      return
    }

    if (!form.date) {
      setError('Please select an attendance date.')
      return
    }

    if (
      !['present', 'absent', 'half-day'].includes(form.status)
    ) {
      setError('Please select a valid attendance status.')
      return
    }

    const hours = Number(form.hoursWorked)

    if (
      !Number.isFinite(hours) ||
      hours < 0 ||
      hours > 24
    ) {
      setError('Hours worked must be between 0 and 24.')
      return
    }

    if (form.status === 'absent' && hours !== 0) {
      setError('An absent worker must have 0 hours.')
      return
    }

    if (
      form.status === 'half-day' &&
      (hours <= 0 || hours >= 8)
    ) {
      setError('Half-day hours must be greater than 0 and less than 8.')
      return
    }

    if (form.status === 'present' && hours <= 0) {
      setError('Present workers must have hours greater than 0.')
      return
    }

    const duplicate = attendance.some(
      (record) =>
        record.workerId === form.workerId &&
        record.date === form.date &&
        record.id !== editingId
    )

    if (duplicate) {
      setError(
        'Attendance already exists for this worker on this date.'
      )
      return
    }

    const changes = {
      workerId: form.workerId,
      date: form.date,
      status: form.status,
      hoursWorked: hours,
      notes: form.notes.trim(),
    }

    if (editingId) {
      dispatch(
        attendanceUpdated({
          id: editingId,
          changes,
        })
      )
    } else {
      dispatch(attendanceAdded(changes))
    }

    resetForm()
  }

  function startEditing(record) {
    setEditingId(record.id)
    setForm({
      workerId: record.workerId,
      date: record.date,
      status: record.status,
      hoursWorked: String(record.hoursWorked ?? 0),
      notes: record.notes ?? '',
    })
    setError('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(record) {
    const worker = workerMap.get(record.workerId)

    const confirmed = window.confirm(
      `Delete attendance for ${worker?.fullName ?? 'this worker'} on ${record.date}?`
    )

    if (!confirmed) return

    dispatch(attendanceDeleted(record.id))

    if (editingId === record.id) {
      resetForm()
    }
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <CalendarCheck size={25} />
            <h1 className="h3 fw-bold mb-0">
              Attendance & Wages
            </h1>
          </div>
          <p className="text-secondary mb-0">
            Track daily labour attendance and calculate wages.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={resetForm}
        >
          <RotateCcw size={16} className="me-2" />
          Reset form
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-success-subtle text-success p-3">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="text-secondary small">
                  Present Today
                </div>
                <div className="fs-3 fw-bold">
                  {todayPresent}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-warning-subtle text-warning p-3">
                <Clock3 size={24} />
              </div>
              <div>
                <div className="text-secondary small">
                  Half Days Today
                </div>
                <div className="fs-3 fw-bold">
                  {todayHalfDay}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-danger-subtle text-danger p-3">
                <XCircle size={24} />
              </div>
              <div>
                <div className="text-secondary small">
                  Absent Today
                </div>
                <div className="fs-3 fw-bold">
                  {todayAbsent}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="rounded-3 bg-primary-subtle text-primary p-3">
                <Wallet size={24} />
              </div>
              <div>
                <div className="text-secondary small">
                  Today's Wage Total
                </div>
                <div className="fs-5 fw-bold">
                  {formatCurrency(todayWages)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold mb-1">
                {editingId ? 'Edit Attendance' : 'Mark Attendance'}
              </h2>
              <p className="text-secondary small mb-4">
                Record one attendance entry per worker per day.
              </p>

              {workers.length === 0 && (
                <div className="alert alert-warning">
                  No workers found. Add workers before marking attendance.
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Worker
                  </label>
                  <select
                    className="form-select"
                    name="workerId"
                    value={form.workerId}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select a worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.fullName}
                        {worker.status === 'inactive'
                          ? ' (Inactive)'
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Attendance Date
                  </label>
                  <input
                    className="form-control"
                    type="date"
                    name="date"
                    value={form.date}
                    max={getLocalDate()}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Attendance Status
                  </label>
                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    required
                  >
                    <option value="present">Present — Full Wage</option>
                    <option value="half-day">Half Day — 50% Wage</option>
                    <option value="absent">Absent — No Wage</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Hours Worked
                  </label>
                  <input
                    className="form-control"
                    type="number"
                    name="hoursWorked"
                    min="0"
                    max="24"
                    step="0.5"
                    value={form.hoursWorked}
                    onChange={updateField}
                    required
                  />
                  <div className="form-text">
                    Default: 8 hours for present, 4 for half-day, 0 for absent.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    name="notes"
                    rows="2"
                    maxLength="300"
                    placeholder="Add a note about this shift..."
                    value={form.notes}
                    onChange={updateField}
                  />
                </div>

                <div className="rounded-3 bg-body-tertiary p-3 mb-3">
                  <div className="d-flex justify-content-between gap-2 mb-1">
                    <span className="text-secondary">
                      Worker's daily wage
                    </span>
                    <strong>
                      {formatCurrency(selectedWorker?.dailyWage ?? 0)}
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between gap-2">
                    <span className="fw-semibold">
                      Calculated wage
                    </span>
                    <strong className="text-success">
                      {formatCurrency(previewWage)}
                    </strong>
                  </div>
                  <div className="form-text mt-2">
                    Wage is calculated from status, not actual hours.
                    Overtime is not included.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100"
                  disabled={workers.length === 0}
                >
                  {editingId ? 'Save Changes' : 'Save Attendance'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="btn btn-light border w-100 mt-2"
                    onClick={resetForm}
                  >
                    Cancel Editing
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3 p-lg-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h5 fw-bold mb-1">
                    Attendance Records
                  </h2>
                  <p className="text-secondary small mb-0">
                    {filteredAttendance.length} record(s) found
                  </p>
                </div>
                <div className="text-secondary small">
                  <Users size={16} className="me-1" />
                  {workers.length} registered workers
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-body">
                      <Search size={17} />
                    </span>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search worker..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <input
                    type="date"
                    className="form-control"
                    aria-label="Filter by date"
                    value={filterDate}
                    onChange={(event) => setFilterDate(event.target.value)}
                  />
                </div>

                <div className="col-12 col-md-3">
                  <select
                    className="form-select"
                    aria-label="Filter by status"
                    value={filterStatus}
                    onChange={(event) => setFilterStatus(event.target.value)}
                  >
                    <option value="all">All statuses</option>
                    <option value="present">Present</option>
                    <option value="half-day">Half Day</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
              </div>

              {filteredAttendance.length === 0 ? (
                <div className="text-center py-5">
                  <CalendarCheck
                    size={36}
                    className="text-secondary mb-3"
                  />
                  <h3 className="h6 fw-bold">
                    No attendance records found
                  </h3>
                  <p className="text-secondary small mb-0">
                    Try another date or add a new attendance record.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Worker</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Hours</th>
                        <th>Wage</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record) => {
                        const worker = workerMap.get(record.workerId)
                        const wage = calculateWage(
                          worker?.dailyWage,
                          record.status
                        )

                        const badgeClass = {
                          present: 'text-bg-success',
                          'half-day': 'text-bg-warning',
                          absent: 'text-bg-danger',
                        }[record.status] ?? 'text-bg-secondary'

                        return (
                          <tr key={record.id}>
                            <td>
                              <div className="fw-semibold">
                                {worker?.fullName ?? 'Unknown worker'}
                              </div>
                              <div className="small text-secondary">
                                {worker
                                  ? formatCurrency(worker.dailyWage) + '/day'
                                  : 'Worker unavailable'}
                              </div>
                              {record.notes && (
                                <div
                                  className="small text-secondary mt-1"
                                  title={record.notes}
                                >
                                  {record.notes.length > 35
                                    ? `${record.notes.slice(0, 35)}…`
                                    : record.notes}
                                </div>
                              )}
                            </td>
                            <td className="text-nowrap">
                              {record.date}
                            </td>
                            <td>
                              <span className={`badge ${badgeClass}`}>
                                {record.status === 'half-day'
                                  ? 'Half Day'
                                  : record.status.charAt(0).toUpperCase() +
                                    record.status.slice(1)}
                              </span>
                            </td>
                            <td>{record.hoursWorked ?? 0}h</td>
                            <td className="text-nowrap fw-semibold">
                              {formatCurrency(wage)}
                            </td>
                            <td>
                              <div className="d-flex justify-content-end gap-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  title="Edit attendance"
                                  aria-label="Edit attendance"
                                  onClick={() => startEditing(record)}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  title="Delete attendance"
                                  aria-label="Delete attendance"
                                  onClick={() => handleDelete(record)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
