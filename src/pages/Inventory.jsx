import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Wallet,
  Boxes,
  X,
  Download,
  Printer,
  ShieldCheck,
} from 'lucide-react'

import {
  inventoryAdded,
  inventoryUpdated,
  inventoryDeleted,
  selectAllInventory,
  selectLowStockItems,
  selectTotalInventoryValue,
} from '../store/inventorySlice'
import { selectUserRole } from '../store/authSlice'
import { activityAdded } from '../store/activitySlice'
import { exportToCSV } from '../services/csvExport'

const categories = ['Seed', 'Fertilizer', 'Pesticide', 'Equipment', 'Other']
const units = ['kg', 'g', 'L', 'mL', 'bags', 'pieces', 'units']

const emptyForm = {
  name: '',
  category: 'Fertilizer',
  quantity: '',
  unit: 'kg',
  minimumStock: '',
  purchasePrice: '',
  purchaseDate: new Date().toISOString().slice(0, 10),
  supplier: '',
  notes: '',
}

function formatPKR(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

export default function Inventory() {
  const dispatch = useDispatch()
  const items = useSelector(selectAllInventory)
  const lowStockItems = useSelector(selectLowStockItems)
  const totalValue = useSelector(selectTotalInventoryValue)
  const role = useSelector(selectUserRole)
  const isAdmin = role === 'Admin'

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        `${item.name} ${item.supplier || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesCategory =
        categoryFilter === 'All' || item.category === categoryFilter

      const isLow =
        Number(item.quantity) <= Number(item.minimumStock)

      const matchesStock =
        stockFilter === 'All' ||
        (stockFilter === 'Low' && isLow) ||
        (stockFilter === 'Available' && !isLow)

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [items, search, categoryFilter, stockFilter])

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setNotice('')
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  function startEdit(item) {
    if (!isAdmin) {
      setError('Only Admin users can edit inventory records.')
      return
    }

    setForm({
      name: item.name || '',
      category: item.category || 'Other',
      quantity: String(item.quantity ?? ''),
      unit: item.unit || 'kg',
      minimumStock: String(item.minimumStock ?? ''),
      purchasePrice: String(item.purchasePrice ?? ''),
      purchaseDate: item.purchaseDate || '',
      supplier: item.supplier || '',
      notes: item.notes || '',
    })
    setEditingId(item.id)
    setShowForm(true)
    setError('')
    setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (editingId && !isAdmin) {
      setError('Only Admin users can modify inventory.')
      return
    }

    const quantity = Number(form.quantity)
    const minimumStock = Number(form.minimumStock)
    const purchasePrice = Number(form.purchasePrice)

    if (!form.name.trim()) {
      setError('Please enter an inventory item name.')
      return
    }

    if (
      form.quantity === '' ||
      !Number.isFinite(quantity) ||
      quantity < 0
    ) {
      setError('Quantity must be zero or greater.')
      return
    }

    if (
      form.minimumStock === '' ||
      !Number.isFinite(minimumStock) ||
      minimumStock < 0
    ) {
      setError('Minimum stock must be zero or greater.')
      return
    }

    if (
      form.purchasePrice === '' ||
      !Number.isFinite(purchasePrice) ||
      purchasePrice < 0
    ) {
      setError('Purchase price must be zero or greater.')
      return
    }

    if (!form.purchaseDate) {
      setError('Please select the purchase date.')
      return
    }

    const itemData = {
      ...form,
      name: form.name.trim(),
      quantity,
      minimumStock,
      purchasePrice,
      supplier: form.supplier.trim(),
      notes: form.notes.trim(),
    }

    if (editingId) {
      dispatch(
        inventoryUpdated({
          id: editingId,
          changes: itemData,
        })
      )

      dispatch(
        activityAdded({
          action: 'UPDATE',
          entity: 'Inventory',
          entityId: editingId,
          description: `Updated inventory item: ${itemData.name}`,
        })
      )

      setNotice('Inventory item updated successfully.')
    } else {
      dispatch(inventoryAdded(itemData))

      dispatch(
        activityAdded({
          action: 'CREATE',
          entity: 'Inventory',
          description: `Added inventory item: ${itemData.name}`,
        })
      )

      setNotice('Inventory item added successfully.')
    }

    resetForm()
  }

  function handleDelete(item) {
    if (!isAdmin) {
      setError('Only Admin users can delete inventory records.')
      return
    }

    const confirmed = window.confirm(
      `Delete "${item.name}" from inventory? This cannot be undone.`
    )

    if (confirmed) {
      dispatch(inventoryDeleted(item.id))

      dispatch(
        activityAdded({
          action: 'DELETE',
          entity: 'Inventory',
          entityId: item.id,
          description: `Deleted inventory item: ${item.name}`,
        })
      )

      setNotice('Item removed from inventory.')
    }
  }

  const handleExportCSV = () => {
    const exportData = items.map((item) => ({
      Item_Name: item.name,
      Category: item.category,
      Quantity: item.quantity,
      Unit: item.unit,
      Minimum_Stock: item.minimumStock,
      Unit_Price_PKR: item.purchasePrice,
      Total_Value_PKR: item.quantity * item.purchasePrice,
      Supplier: item.supplier || 'N/A',
      Purchase_Date: item.purchaseDate,
      Notes: item.notes || '',
    }))
    exportToCSV(exportData, `Farm_Inputs_Inventory_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div className="container-fluid py-4 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="analytics-eyebrow text-success mb-0">
              SUPPLY CHAIN & WAREHOUSE
            </span>
            <span className="badge rounded-pill bg-light text-secondary border small">
              <ShieldCheck size={12} className="me-1 inline" />
              Stock Monitored
            </span>
          </div>
          <h1 className="h3 fw-bold mb-1 text-dark">Inputs Inventory</h1>
          <p className="text-secondary small mb-0">
            Track farm supplies, critical stock thresholds, and purchase investments.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={handleExportCSV}
            title="Download Inventory CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm"
            onClick={() => window.print()}
            title="Print Inventory Summary"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>

          <button
            type="button"
            className="btn btn-success btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm fw-semibold"
            onClick={() => {
              setForm(emptyForm)
              setEditingId(null)
              setError('')
              setNotice('')
              setShowForm(true)
            }}
          >
            <Plus size={16} />
            Add Inventory Item
          </button>
        </div>
      </div>

      {notice && (
        <div className="alert alert-success alert-dismissible fade show rounded-3 mb-4" role="status">
          {notice}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setNotice('')} />
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3 mb-4" role="alert">
          {error}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setError('')} />
        </div>
      )}

      {/* 3 Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="pnl-stat-card card--pipeline h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Tracked Supply Items</span>
              <div className="stat-card-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <Boxes size={22} />
              </div>
            </div>
            <div className="stat-card-value text-dark">
              {items.length}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between align-items-center">
              <span>Across {categories.length} item categories</span>
              <span className="badge rounded-pill bg-light text-secondary border small">Active Catalog</span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className={`pnl-stat-card ${lowStockItems.length > 0 ? 'card--expense' : 'card--profit'} h-100`}>
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Low Stock Threshold</span>
              <div
                className="stat-card-icon"
                style={{
                  background: lowStockItems.length > 0 ? '#fff1f2' : '#e8f5e9',
                  color: lowStockItems.length > 0 ? '#e11d48' : '#2e7d32',
                }}
              >
                <AlertTriangle size={22} />
              </div>
            </div>
            <div
              className={`stat-card-value ${
                lowStockItems.length > 0 ? 'text-danger' : 'text-success'
              }`}
            >
              {lowStockItems.length}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between align-items-center">
              <span>
                {lowStockItems.length > 0
                  ? 'Replenishment urgently required'
                  : 'All supplies above minimum'}
              </span>
              <span
                className={`badge rounded-pill small ${
                  lowStockItems.length > 0
                    ? 'bg-danger-subtle text-danger'
                    : 'bg-success-subtle text-success'
                }`}
              >
                {lowStockItems.length > 0 ? 'Alert Active' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="pnl-stat-card card--income h-100">
            <div className="stat-card-top">
              <span className="stat-card-title fw-semibold">Warehouse Stock Valuation</span>
              <div className="stat-card-icon" style={{ background: '#e8f5e9', color: '#1b5e20' }}>
                <Wallet size={22} />
              </div>
            </div>
            <div className="stat-card-value text-success">
              {formatPKR(totalValue)}
            </div>
            <div className="stat-card-subtitle d-flex justify-content-between align-items-center">
              <span>Capital tied in inventory</span>
              <span className="badge rounded-pill bg-success-subtle text-success small">PKR Asset</span>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-start gap-3 rounded-4 mb-4 p-3 p-md-4">
          <AlertTriangle size={22} className="text-warning-emphasis flex-shrink-0 mt-1" />
          <div className="w-100">
            <div className="d-flex justify-content-between align-items-center">
              <strong className="text-dark">Warehouse Reorder Notice</strong>
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                {lowStockItems.length} item(s) below threshold
              </span>
            </div>
            <p className="small text-secondary mt-1 mb-0">
              The following agricultural supplies are at or below minimum operating stock:{' '}
              <strong className="text-dark">
                {lowStockItems.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
              </strong>. Plan reordering to avoid field disruption.
            </p>
          </div>
        </div>
      )}

      {/* Form Drawer / Slide Card */}
      {showForm && (
        <section className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-header bg-white border-bottom p-3 p-md-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 bg-success-subtle text-success">
                <Package size={18} />
              </span>
              <h2 className="h5 fw-bold mb-0">
                {editingId ? 'Edit Inventory Item' : 'New Agricultural Supply Entry'}
              </h2>
            </div>

            <button
              type="button"
              className="btn btn-light rounded-circle p-2"
              aria-label="Close inventory form"
              onClick={resetForm}
            >
              <X size={18} />
            </button>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label htmlFor="inventory-name" className="form-label fw-semibold">
                    Item Name *
                  </label>
                  <input
                    id="inventory-name"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    placeholder="e.g. Urea Nitrogen Fertilizer"
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="inventory-category" className="form-label fw-semibold">
                    Category *
                  </label>
                  <select
                    id="inventory-category"
                    className="form-select"
                    name="category"
                    value={form.category}
                    onChange={updateForm}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="inventory-quantity" className="form-label fw-semibold">
                    Available Quantity *
                  </label>
                  <input
                    id="inventory-quantity"
                    className="form-control"
                    type="number"
                    min="0"
                    step="any"
                    name="quantity"
                    value={form.quantity}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="inventory-unit" className="form-label fw-semibold">
                    Packaging Unit *
                  </label>
                  <select
                    id="inventory-unit"
                    className="form-select"
                    name="unit"
                    value={form.unit}
                    onChange={updateForm}
                  >
                    {units.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="inventory-minimum" className="form-label fw-semibold">
                    Minimum Stock Alert *
                  </label>
                  <input
                    id="inventory-minimum"
                    className="form-control"
                    type="number"
                    min="0"
                    step="any"
                    name="minimumStock"
                    value={form.minimumStock}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="inventory-price" className="form-label fw-semibold">
                    Purchase Price per Unit (PKR) *
                  </label>
                  <input
                    id="inventory-price"
                    className="form-control"
                    type="number"
                    min="0"
                    step="any"
                    name="purchasePrice"
                    value={form.purchasePrice}
                    onChange={updateForm}
                    placeholder="e.g. 4500"
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="inventory-date" className="form-label fw-semibold">
                    Purchase Date *
                  </label>
                  <input
                    id="inventory-date"
                    className="form-control"
                    type="date"
                    name="purchaseDate"
                    value={form.purchaseDate}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="inventory-supplier" className="form-label fw-semibold">
                    Supplier / Vendor
                  </label>
                  <input
                    id="inventory-supplier"
                    className="form-control"
                    name="supplier"
                    value={form.supplier}
                    onChange={updateForm}
                    placeholder="e.g. Engro Agrochemicals"
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="inventory-notes" className="form-label fw-semibold">
                    Notes & Specifications
                  </label>
                  <textarea
                    id="inventory-notes"
                    className="form-control"
                    name="notes"
                    value={form.notes}
                    onChange={updateForm}
                    rows="2"
                    placeholder="Storage conditions, batch number, or application guidelines..."
                  />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top">
                <button type="submit" className="btn btn-success px-4 rounded-pill fw-semibold">
                  {editingId ? 'Save Changes' : 'Record Supply Item'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Main Table / Register */}
      <section className="analytics-card p-0 overflow-hidden">
        <div className="p-3 p-md-4 border-bottom bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={15} className="text-secondary" />
                </span>
                <input
                  className="form-control border-start-0"
                  aria-label="Search inventory"
                  placeholder="Search item, vendor or supplier..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <select
                className="form-select form-select-sm"
                aria-label="Filter inventory by category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-lg-4">
              <select
                className="form-select form-select-sm"
                aria-label="Filter inventory by stock level"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
              >
                <option value="All">All Stock Levels</option>
                <option value="Low">Low Stock Only</option>
                <option value="Available">Sufficient Stock Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table pnl-table mb-0">
            <thead>
              <tr>
                <th>ITEM & SPECIFICATIONS</th>
                <th>CATEGORY</th>
                <th>AVAILABLE STOCK</th>
                <th>MIN. THRESHOLD</th>
                <th>UNIT PRICE</th>
                <th>TOTAL VALUE</th>
                <th>STOCK STATUS</th>
                {isAdmin && <th className="text-end pe-3">ACTIONS</th>}
              </tr>
            </thead>

            <tbody>
              {visibleItems.map((item) => {
                const isLow =
                  Number(item.quantity) <= Number(item.minimumStock)
                const val = Number(item.quantity) * Number(item.purchasePrice)

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="fw-semibold text-dark">{item.name}</div>
                      <div className="small text-secondary">
                        {item.supplier ? `Supplier: ${item.supplier}` : 'No supplier noted'}
                      </div>
                    </td>

                    <td>
                      <span className="badge text-bg-light border">
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <span className="fw-bold text-dark">
                        {item.quantity} {item.unit}
                      </span>
                    </td>

                    <td className="small text-secondary">
                      {item.minimumStock} {item.unit}
                    </td>

                    <td className="small text-secondary">
                      {formatPKR(item.purchasePrice)} / {item.unit}
                    </td>

                    <td className="fw-semibold text-dark">
                      {formatPKR(val)}
                    </td>

                    <td>
                      <span
                        className={`badge rounded-pill ${
                          isLow
                            ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                            : 'bg-success-subtle text-success border border-success-subtle'
                        }`}
                      >
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>

                    {isAdmin && (
                      <td className="text-end pe-3">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            aria-label={`Edit ${item.name}`}
                            title="Edit Item"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            aria-label={`Delete ${item.name}`}
                            title="Delete Item"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}

              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="text-center py-5">
                    <Package
                      size={36}
                      className="text-secondary mb-2 opacity-50"
                    />
                    <p className="fw-semibold mb-1">No inventory supplies found</p>
                    <p className="text-secondary small mb-0">
                      Add a supply record or adjust your search and filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-white border-top d-flex justify-content-between align-items-center small text-secondary">
          <span>Displaying <strong>{visibleItems.length}</strong> of <strong>{items.length}</strong> inventory supply records</span>
          <span>Valuation: <strong>{formatPKR(totalValue)}</strong></span>
        </div>
      </section>
    </div>
  )
}
