import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  X,
  BriefcaseBusiness,
  Phone,
  CreditCard,
} from 'lucide-react'
import {
  workerAdded,
  workerUpdated,
  workerDeleted,
  selectAllWorkers,
} from '../store/workersSlice'

const EMPTY_FORM = {
  fullName: '',
  cnic: '',
  phone: '',
  role: 'Farm Worker',
  dailyWage: '',
  joinDate: new Date().toISOString().slice(0, 10),
  status: 'active',
}

const formatPKR = (amount) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const normalizeCNIC = (value) => value.replace(/\D/g, '')

export default function Workers() {
  const dispatch = useDispatch()
  const workers = useSelector(selectAllWorkers)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  const activeCount = workers.filter(
    (worker) => worker.status === 'active',
  ).length

  const inactiveCount = workers.length - activeCount

  const filteredWorkers = useMemo(() => {
    const query = search.trim().toLowerCase()

    return workers.filter((worker) => {
      const matchesSearch = [
        worker.fullName,
        worker.cnic,
        worker.phone,
        worker.role,
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      )

      const matchesStatus =
        statusFilter === 'all' || worker.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [workers, search, statusFilter])

  const openAddModal = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setError('')
    setModalOpen(true)
  }

  const openEditModal = (worker) => {
    setEditingId(worker.id)
    setForm({
      fullName: worker.fullName ?? '',
      cnic: worker.cnic ?? '',
      phone: worker.phone ?? '',
      role: worker.role ?? 'Farm Worker',
      dailyWage: String(worker.dailyWage ?? ''),
      joinDate: worker.joinDate ?? '',
      status: worker.status ?? 'active',
    })
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setError('')
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const fullName = form.fullName.trim()
    const cnic = normalizeCNIC(form.cnic)
    const phone = form.phone.trim()
    const dailyWage = Number(form.dailyWage)

    if (!fullName || !form.cnic.trim() || !phone || !form.joinDate) {
      setError('Please complete all required fields.')
      return
    }

    if (!/^\d{13}$/.test(cnic)) {
      setError('CNIC must contain exactly 13 digits.')
      return
    }

    if (!/^\+?[\d\s()-]{7,20}$/.test(phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    if (!Number.isFinite(dailyWage) || dailyWage < 0) {
      setError('Daily wage must be a valid, non-negative amount.')
      return
    }

    const duplicate = workers.some(
      (worker) =>
        normalizeCNIC(String(worker.cnic ?? '')) === cnic &&
        worker.id !== editingId,
    )

    if (duplicate) {
      setError('A worker with this CNIC already exists.')
      return
    }

    const workerData = {
      fullName,
      cnic,
      phone,
      role: form.role,
      dailyWage,
      joinDate: form.joinDate,
      status: form.status,
    }

    if (editingId) {
      dispatch(workerUpdated({ id: editingId, changes: workerData }))
    } else {
      dispatch(workerAdded(workerData))
    }

    closeModal()
  }

  const handleDelete = (worker) => {
    const confirmed = window.confirm(
      `Delete ${worker.fullName}? This action cannot be undone.`,
    )

    if (confirmed) {
      dispatch(workerDeleted(worker.id))
    }
  }

  return (
    <main className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="text-success small fw-semibold mb-1">
            FARM OPERATIONS / TEAM
          </div>
          <h1 className="h3 fw-bold mb-1">Workers Management</h1>
          <p className="text-secondary mb-0">
            Manage your workforce, worker records and daily wages.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success d-inline-flex align-items-center gap-2"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Worker
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-secondary small">Total Workers</div>
                <div className="fs-3 fw-bold">{workers.length}</div>
              </div>
              <div className="rounded-3 bg-success bg-opacity-10 text-success p-3">
                <Users size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-secondary small">Active Workers</div>
                <div className="fs-3 fw-bold">{activeCount}</div>
              </div>
              <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-3">
                <UserCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <div className="text-secondary small">Inactive Workers</div>
                <div className="fs-3 fw-bold">{inactiveCount}</div>
              </div>
              <div className="rounded-3 bg-secondary bg-opacity-10 text-secondary p-3">
                <UserX size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="card border-0 shadow-sm">
        <div className="card-body border-bottom">
          <div className="row g-3">
            <div className="col-12 col-lg-8">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <Search size={18} />
                </span>
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search by name, CNIC, phone or role..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search workers"
                />
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter workers by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Worker</th>
                <th>CNIC</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Daily Wage</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredWorkers.map((worker) => (
                <tr key={worker.id}>
                  <td className="ps-4">
                    <div className="fw-semibold">{worker.fullName}</div>
                    <div className="small text-secondary">
                      Joined {worker.joinDate || '—'}
                    </div>
                  </td>
                  <td className="text-nowrap">{worker.cnic}</td>
                  <td className="text-nowrap">{worker.phone}</td>
                  <td>
                    <span className="d-inline-flex align-items-center gap-2">
                      <BriefcaseBusiness size={15} />
                      {worker.role}
                    </span>
                  </td>
                  <td className="text-nowrap fw-semibold">
                    {formatPKR(worker.dailyWage)}
                  </td>
                  <td>
                    <span
                      className={`badge rounded-pill ${
                        worker.status === 'active'
                          ? 'text-bg-success'
                          : 'text-bg-secondary'
                      }`}
                    >
                      {worker.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <div className="d-inline-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        aria-label={`Edit ${worker.fullName}`}
                        title="Edit worker"
                        onClick={() => openEditModal(worker)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        aria-label={`Delete ${worker.fullName}`}
                        title="Delete worker"
                        onClick={() => handleDelete(worker)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <Users size={32} className="text-secondary mb-2" />
                    <div className="fw-semibold">No workers found</div>
                    <div className="text-secondary small mb-3">
                      {workers.length === 0
                        ? 'Add your first worker to get started.'
                        : 'Try changing your search or status filter.'}
                    </div>
                    {workers.length === 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={openAddModal}
                      >
                        Add your first worker
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card-footer bg-white text-secondary small">
          Showing {filteredWorkers.length} of {workers.length} workers
        </div>
      </section>

      {modalOpen && (
        <div
          className="modal d-block"
          role="dialog"
          aria-modal="true"
          aria-labelledby="worker-modal-title"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h2
                    className="modal-title fs-5 fw-bold"
                    id="worker-modal-title"
                  >
                    {editingId ? 'Edit Worker' : 'Add New Worker'}
                  </h2>
                  <p className="text-secondary small mb-0">
                    Enter the worker's employment details.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                />
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger py-2" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-name">
                        Full name *
                      </label>
                      <input
                        id="worker-name"
                        name="fullName"
                        className="form-control"
                        value={form.fullName}
                        onChange={updateField}
                        maxLength={100}
                        autoComplete="name"
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-cnic">
                        CNIC (13 digits) *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <CreditCard size={16} />
                        </span>
                        <input
                          id="worker-cnic"
                          name="cnic"
                          className="form-control"
                          value={form.cnic}
                          onChange={updateField}
                          placeholder="3520212345671"
                          inputMode="numeric"
                          maxLength={15}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-phone">
                        Phone number *
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <Phone size={16} />
                        </span>
                        <input
                          id="worker-phone"
                          name="phone"
                          className="form-control"
                          value={form.phone}
                          onChange={updateField}
                          autoComplete="tel"
                          maxLength={20}
                          required
                        />
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-role">
                        Job role *
                      </label>
                      <select
                        id="worker-role"
                        name="role"
                        className="form-select"
                        value={form.role}
                        onChange={updateField}
                        required
                      >
                        <option>Farm Worker</option>
                        <option>Field Supervisor</option>
                        <option>Irrigation Operator</option>
                        <option>Machine Operator</option>
                        <option>Harvest Worker</option>
                        <option>Farm Manager</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-wage">
                        Daily wage (PKR) *
                      </label>
                      <input
                        id="worker-wage"
                        name="dailyWage"
                        type="number"
                        min="0"
                        step="1"
                        className="form-control"
                        value={form.dailyWage}
                        onChange={updateField}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-join-date">
                        Joining date *
                      </label>
                      <input
                        id="worker-join-date"
                        name="joinDate"
                        type="date"
                        className="form-control"
                        value={form.joinDate}
                        onChange={updateField}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="worker-status">
                        Employment status
                      </label>
                      <select
                        id="worker-status"
                        name="status"
                        className="form-select"
                        value={form.status}
                        onChange={updateField}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    {editingId ? 'Save Changes' : 'Add Worker'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
