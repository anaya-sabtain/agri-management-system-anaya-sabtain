import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Plus,
  Search,
  Tractor,
  Pencil,
  Trash2,
  Wrench,
  RotateCcw,
} from 'lucide-react'

import {
  equipmentAdded,
  equipmentUpdated,
  equipmentDeleted,
} from '../store/equipmentSlice'

import { selectAllMaintenance } from '../store/maintenanceSlice'

const EMPTY_FORM = {
  name: '',
  category: 'Tractor',
  serialNumber: '',
  purchaseDate: '',
  status: 'available',
  condition: 'good',
  notes: '',
}

const STATUS_LABELS = {
  available: 'Available',
  'in-use': 'In Use',
  'under-maintenance': 'Under Maintenance',
}

const CONDITION_LABELS = {
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
}

function getStatusClass(status) {
  if (status === 'available') return 'text-bg-success'
  if (status === 'in-use') return 'text-bg-primary'
  if (status === 'under-maintenance') return 'text-bg-warning'

  return 'text-bg-secondary'
}

export default function Equipment() {
  const dispatch = useDispatch()

  const equipment = useSelector(
    (state) => state.equipment?.items ?? []
  )

  const maintenance = useSelector(selectAllMaintenance)

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')

  const maintenanceCountByEquipment = useMemo(() => {
    const counts = {}

    maintenance.forEach((record) => {
      counts[record.equipmentId] =
        (counts[record.equipmentId] ?? 0) + 1
    })

    return counts
  }, [maintenance])

  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase()

    return equipment.filter((item) => {
      const matchesSearch = [
        item.name,
        item.category,
        item.serialNumber,
      ].some((value) =>
        (value ?? '').toLowerCase().includes(query)
      )

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [equipment, search, statusFilter])

  const availableCount = equipment.filter(
    (item) => item.status === 'available'
  ).length

  const inUseCount = equipment.filter(
    (item) => item.status === 'in-use'
  ).length

  const maintenanceCount = equipment.filter(
    (item) => item.status === 'under-maintenance'
  ).length

  function handleChange(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM })
    setEditingId(null)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const name = form.name.trim()
    const serialNumber = form.serialNumber.trim()

    if (!name) {
      setError('Please enter an equipment name.')
      return
    }

    if (
      !['Tractor', 'Harvester', 'Water Pump', 'Vehicle', 'Other']
        .includes(form.category)
    ) {
      setError('Please select a valid equipment category.')
      return
    }

    if (
      !['available', 'in-use', 'under-maintenance']
        .includes(form.status)
    ) {
      setError('Please select a valid equipment status.')
      return
    }

    if (!['good', 'fair', 'poor'].includes(form.condition)) {
      setError('Please select a valid equipment condition.')
      return
    }

    const duplicateSerial = serialNumber &&
      equipment.some(
        (item) =>
          item.id !== editingId &&
          item.serialNumber?.trim().toLowerCase() ===
            serialNumber.toLowerCase()
      )

    if (duplicateSerial) {
      setError('This serial number is already registered.')
      return
    }

    const changes = {
      name,
      category: form.category,
      serialNumber,
      purchaseDate: form.purchaseDate,
      status: form.status,
      condition: form.condition,
      notes: form.notes.trim(),
    }

    if (editingId) {
      dispatch(equipmentUpdated({ id: editingId, changes }))
    } else {
      dispatch(equipmentAdded(changes))
    }

    resetForm()
  }

  function startEditing(item) {
    setEditingId(item.id)

    setForm({
      name: item.name ?? '',
      category: item.category ?? 'Other',
      serialNumber: item.serialNumber ?? '',
      purchaseDate: item.purchaseDate ?? '',
      status: item.status ?? 'available',
      condition: item.condition ?? 'good',
      notes: item.notes ?? '',
    })

    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(item) {
    const linkedRecords = maintenanceCountByEquipment[item.id] ?? 0

    const message = linkedRecords > 0
      ? `${item.name} has ${linkedRecords} maintenance record(s). Delete this equipment? Its maintenance history will be preserved.`
      : `Delete ${item.name}?`

    if (!window.confirm(message)) return

    dispatch(equipmentDeleted(item.id))

    if (editingId === item.id) {
      resetForm()
    }
  }

  return (
    <div className="container-fluid py-4 px-3 px-lg-4">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <Tractor size={26} />
            <h1 className="h3 fw-bold mb-0">
              Equipment Management
            </h1>
          </div>
          <p className="text-secondary mb-0">
            Manage farm machinery, equipment condition and service history.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={resetForm}
        >
          <RotateCcw size={16} className="me-2" />
          Clear Form
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">Total Equipment</div>
              <div className="fs-3 fw-bold">{equipment.length}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">Available</div>
              <div className="fs-3 fw-bold text-success">
                {availableCount}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">In Use</div>
              <div className="fs-3 fw-bold text-primary">
                {inUseCount}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="text-secondary small">
                Under Maintenance
              </div>
              <div className="fs-3 fw-bold text-warning">
                {maintenanceCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold mb-1">
                {editingId ? 'Edit Equipment' : 'Add Equipment'}
              </h2>
              <p className="text-secondary small mb-4">
                Enter the equipment details below.
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Equipment Name
                  </label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Massey Ferguson Tractor"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Category
                  </label>
                  <select
                    className="form-select"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="Tractor">Tractor</option>
                    <option value="Harvester">Harvester</option>
                    <option value="Water Pump">Water Pump</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Serial Number
                  </label>
                  <input
                    className="form-control"
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleChange}
                    placeholder="e.g. TR-1001"
                    maxLength={60}
                  />
                  <div className="form-text">
                    Optional, but must be unique when provided.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Purchase Date
                  </label>
                  <input
                    className="form-control"
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Equipment Status
                  </label>
                  <select
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="under-maintenance">
                      Under Maintenance
                    </option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Condition
                  </label>
                  <select
                    className="form-select"
                    name="condition"
                    value={form.condition}
                    onChange={handleChange}
                  >
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="form-control"
                    name="notes"
                    rows="3"
                    maxLength={500}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional equipment details..."
                  />
                </div>

                <button type="submit" className="btn btn-success w-100">
                  <Plus size={17} className="me-2" />
                  {editingId ? 'Save Changes' : 'Add Equipment'}
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
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h2 className="h5 fw-bold mb-1">
                    Equipment Inventory
                  </h2>
                  <p className="text-secondary small mb-0">
                    {filteredEquipment.length} equipment record(s)
                  </p>
                </div>
                <Wrench size={22} className="text-secondary" />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-7">
                  <div className="input-group">
                    <span className="input-group-text bg-body">
                      <Search size={17} />
                    </span>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search name, category or serial..."
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
                    aria-label="Filter equipment by status"
                  >
                    <option value="all">All statuses</option>
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="under-maintenance">
                      Under Maintenance
                    </option>
                  </select>
                </div>
              </div>

              {filteredEquipment.length === 0 ? (
                <div className="text-center py-5">
                  <Tractor size={38} className="text-secondary mb-3" />
                  <h3 className="h6 fw-bold">No equipment found</h3>
                  <p className="text-secondary small mb-0">
                    Add equipment or change your search filters.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Equipment</th>
                        <th>Status</th>
                        <th>Condition</th>
                        <th>Service Records</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEquipment.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="fw-semibold">
                              {item.name}
                            </div>
                            <div className="small text-secondary">
                              {item.category}
                              {item.serialNumber
                                ? ` · ${item.serialNumber}`
                                : ''}
                            </div>
                            {item.purchaseDate && (
                              <div className="small text-secondary">
                                Purchased: {item.purchaseDate}
                              </div>
                            )}
                          </td>

                          <td>
                            <span className={`badge ${getStatusClass(item.status)}`}>
                              {STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </td>

                          <td>
                            {CONDITION_LABELS[item.condition] ?? item.condition}
                          </td>

                          <td>
                            {maintenanceCountByEquipment[item.id] ?? 0}
                          </td>

                          <td>
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                title="Edit equipment"
                                aria-label={`Edit ${item.name}`}
                                onClick={() => startEditing(item)}
                              >
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                title="Delete equipment"
                                aria-label={`Delete ${item.name}`}
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
      </div>
    </div>
  )
}
