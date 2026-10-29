import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Sprout,
  X,
  MapPin,
  Calendar,
  Scale,
  Activity,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { createCrop, STORAGE_KEYS } from "../data/dataModels";
import {
  getAll,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../services/storageService";
import ConfirmModal from "../components/common/ConfirmModal";
import ToastNotification from "../components/common/ToastNotification";
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAllCrops,
  cropsLoaded,
  cropAdded,
  cropUpdated,
  cropDeleted,
} from '../store/cropsSlice'
import { selectUserRole } from '../store/authSlice'
import { activityAdded } from '../store/activitySlice'

const initialForm = {
  name: "",
  field: "",
  plantingDate: "",
  cuttingDate: "",
  expectedQuantityKg: "",
  harvestedQuantityKg: "0",
  healthScore: "0",
  status: "growing",
};

const validStatuses = ["growing", "ready", "harvested"];

function getCropEmoji(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("wheat") || lower.includes("rice")) return "🌾";
  if (lower.includes("corn") || lower.includes("maize")) return "🌽";
  if (lower.includes("cotton")) return "🌿";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("potato")) return "🥔";
  if (lower.includes("onion")) return "🧅";
  if (lower.includes("cane") || lower.includes("sugarcane")) return "🎋";
  if (lower.includes("mustard")) return "🌼";
  return "🌱";
}

function getStatusBadge(status) {
  if (status === "ready") {
    return { label: "Ready for harvest", className: "badge-status--ready" };
  }
  if (status === "harvested") {
    return { label: "Harvested", className: "badge-status--harvested" };
  }
  return { label: "Growing", className: "badge-status--growing" };
}

export default function Crops() {
  const dispatch = useDispatch()
  const crops = useSelector(selectAllCrops)
  const role = useSelector(selectUserRole)
  const isAdmin = role === 'Admin'
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTargetCrop, setDeleteTargetCrop] = useState(null);
  const [sortKey, setSortKey] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) return <ArrowUpDown size={12} className="text-muted ms-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-success ms-1" />
    ) : (
      <ArrowDown size={12} className="text-success ms-1" />
    );
  };

  function loadCrops() {
    try {
      const savedCrops = getAll(STORAGE_KEYS.CROPS)
      dispatch(cropsLoaded(savedCrops))
      setError('')
    } catch (err) {
      setError(err.message || 'Could not load crops.')
    }
  }

  useEffect(() => {
    loadCrops();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    return crops.reduce(
      (acc, c) => {
        acc.total += 1;
        if (c.status === "growing") acc.growing += 1;
        if (c.status === "ready") acc.ready += 1;
        if (c.status === "harvested") acc.harvested += 1;
        acc.totalExpected += Number(c.expectedQuantityKg) || 0;
        acc.totalHarvested += Number(c.harvestedQuantityKg) || 0;
        return acc;
      },
      { total: 0, growing: 0, ready: 0, harvested: 0, totalExpected: 0, totalHarvested: 0 }
    );
  }, [crops]);

  const filteredCrops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return crops
      .filter((crop) => {
        const matchesSearch =
          (crop.name || "").toLowerCase().includes(query) ||
          (crop.field || "").toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "all" || crop.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (typeof valA === "string") {
          return sortDirection === "asc"
            ? (valA || "").localeCompare(valB || "")
            : (valB || "").localeCompare(valA || "");
        }
        return sortDirection === "asc"
          ? (Number(valA) || 0) - (Number(valB) || 0)
          : (Number(valB) || 0) - (Number(valA) || 0);
      });
  }, [crops, search, statusFilter, sortKey, sortDirection]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(crop) {
    if (!isAdmin) return;
    setForm({
      name: crop.name || "",
      field: crop.field || "",
      plantingDate: crop.plantingDate || "",
      cuttingDate: crop.cuttingDate || "",
      expectedQuantityKg: String(crop.expectedQuantityKg ?? ""),
      harvestedQuantityKg: String(crop.harvestedQuantityKg ?? 0),
      healthScore: String(crop.healthScore ?? 0),
      status: crop.status || "growing",
    });

    setEditingId(crop.id);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const expected = Number(form.expectedQuantityKg);
    const harvested = Number(form.harvestedQuantityKg);
    const health = Number(form.healthScore);

    if (!form.name.trim() || !form.field.trim()) {
      setError("Crop name aur field name required hain.");
      return;
    }

    if (!form.plantingDate || !form.cuttingDate) {
      setError("Planting date aur cutting date select karein.");
      return;
    }

    if (form.cuttingDate < form.plantingDate) {
      setError("Cutting date, planting date se pehle nahi ho sakti.");
      return;
    }

    if (
      form.expectedQuantityKg === "" ||
      !Number.isFinite(expected) ||
      expected <= 0
    ) {
      setError("Expected quantity zero se zyada honi chahiye.");
      return;
    }

    if (
      form.harvestedQuantityKg === "" ||
      !Number.isFinite(harvested) ||
      harvested < 0 ||
      harvested > expected
    ) {
      setError("Harvested quantity 0 se expected quantity tak honi chahiye.");
      return;
    }

    if (
      form.healthScore === "" ||
      !Number.isFinite(health) ||
      health < 0 ||
      health > 100
    ) {
      setError("Health score 0 se 100 ke darmiyan hona chahiye.");
      return;
    }

    if (!validStatuses.includes(form.status)) {
      setError("Please select a valid crop status.");
      return;
    }

    const cropData = {
      name: form.name.trim(),
      field: form.field.trim(),
      plantingDate: form.plantingDate,
      cuttingDate: form.cuttingDate,
      expectedQuantityKg: expected,
      harvestedQuantityKg: harvested,
      healthScore: health,
      status: form.status,
    };

    if (editingId && !isAdmin) {
      setError("Only administrators are permitted to edit crop records.");
      return;
    }

    try {
      if (editingId) {
        dispatch(
          cropUpdated({
            id: editingId,
            changes: cropData,
          }),
        )

        dispatch(
          activityAdded({
            action: 'UPDATE',
            entity: 'Crop',
            entityId: editingId,
            description: `Updated crop: ${cropData.name} in field ${cropData.field}`,
          })
        )

        setNotice('Crop successfully updated.')
      } else {
        dispatch(cropAdded(cropData))

        dispatch(
          activityAdded({
            action: 'CREATE',
            entity: 'Crop',
            description: `Added crop: ${cropData.name} in field ${cropData.field}`,
          })
        )

        setNotice('Crop successfully added.')
      }

      resetForm()
    } catch (err) {
      setError(err.message || 'Could not save crop.')
    }
  }

  function handleDelete(crop) {
    if (!isAdmin) return;
    setDeleteTargetCrop(crop);
  }

  function confirmDeleteCrop() {
    if (!isAdmin) {
      return;
    }

    if (!deleteTargetCrop) return;

    try {
      dispatch(cropDeleted(deleteTargetCrop.id));

      dispatch(
        activityAdded({
          action: 'DELETE',
          entity: 'Crop',
          entityId: deleteTargetCrop.id,
          description: `Deleted crop: ${deleteTargetCrop.name} from field ${deleteTargetCrop.field}`,
        })
      )

      setNotice(`Crop "${deleteTargetCrop.name}" successfully deleted.`);
      setError("");
    } catch (err) {
      setError(err.message || "Could not delete crop.");
    } finally {
      setDeleteTargetCrop(null);
    }
  }

  return (
    <main className="container-fluid py-3 py-md-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="analytics-eyebrow text-success mb-1">FARM OPERATIONS</p>
          <h1 className="h3 mb-1 fw-bold text-dark">Crop Management</h1>
          <p className="text-secondary mb-0">
            Monitor crop lifecycle, field assignments and harvest productivity.
          </p>
        </div>

        <button
          className="btn btn-success d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm rounded-3 fw-semibold"
          onClick={() => {
            setForm(initialForm);
            setEditingId(null);
            setError("");
            setNotice("");
            setShowForm((current) => !current);
          }}
        >
          <Plus size={18} />
          {showForm ? "Close Form" : "Add New Crop"}
        </button>
      </div>

      {/* Top Metrics Strip */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-success-subtle text-success">
              <Sprout size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Total Registered</span>
              <h3 className="mgmt-metric-val">{metrics.total} Crops</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-primary-subtle text-primary">
              <Clock size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Currently Growing</span>
              <h3 className="mgmt-metric-val">{metrics.growing} Active</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-warning-subtle text-warning">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Ready for Harvest</span>
              <h3 className="mgmt-metric-val">{metrics.ready} Ready</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-info-subtle text-info">
              <Scale size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Total Harvested</span>
              <h3 className="mgmt-metric-val">{metrics.totalHarvested.toLocaleString()} kg</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="status">
          <Sparkles size={18} />
          {notice}
        </div>
      )}

      {/* Slide-over/Card Add/Edit Form */}
      {showForm && (
        <section className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 bg-success-subtle text-success">
                <Sprout size={18} />
              </span>
              <h2 className="h5 mb-0 fw-bold">
                {editingId ? "Edit Crop Details" : "Register New Crop"}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-circle p-2"
              aria-label="Close form"
              onClick={resetForm}
            >
              <X size={18} />
            </button>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" htmlFor="crop-name">
                    Crop Name
                  </label>
                  <input
                    id="crop-name"
                    className="form-control form-control-lg fs-6"
                    name="name"
                    value={form.name}
                    onChange={updateForm}
                    placeholder="e.g. Wheat, Sugarcane, Cotton"
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" htmlFor="crop-field">
                    Field Location
                  </label>
                  <input
                    id="crop-field"
                    className="form-control form-control-lg fs-6"
                    name="field"
                    value={form.field}
                    onChange={updateForm}
                    placeholder="e.g. North Plot A, Sector 4"
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" htmlFor="planting-date">
                    Planting Date
                  </label>
                  <input
                    id="planting-date"
                    type="date"
                    className="form-control"
                    name="plantingDate"
                    value={form.plantingDate}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold" htmlFor="cutting-date">
                    Expected Cutting / Harvest Date
                  </label>
                  <input
                    id="cutting-date"
                    type="date"
                    className="form-control"
                    name="cuttingDate"
                    value={form.cuttingDate}
                    onChange={updateForm}
                    min={form.plantingDate || undefined}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold" htmlFor="expected-quantity">
                    Expected Production (kg)
                  </label>
                  <input
                    id="expected-quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    className="form-control"
                    name="expectedQuantityKg"
                    value={form.expectedQuantityKg}
                    onChange={updateForm}
                    placeholder="e.g. 2500"
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold" htmlFor="harvested-quantity">
                    Actual Harvested (kg)
                  </label>
                  <input
                    id="harvested-quantity"
                    type="number"
                    min="0"
                    step="any"
                    max={form.expectedQuantityKg || undefined}
                    className="form-control"
                    name="harvestedQuantityKg"
                    value={form.harvestedQuantityKg}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold" htmlFor="health-score">
                    Health Score (0–100)
                  </label>
                  <input
                    id="health-score"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="form-control"
                    name="healthScore"
                    value={form.healthScore}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold" htmlFor="crop-status">
                    Crop Lifecycle Status
                  </label>
                  <select
                    id="crop-status"
                    className="form-select"
                    name="status"
                    value={form.status}
                    onChange={updateForm}
                  >
                    <option value="growing">Growing — Under observation & irrigation</option>
                    <option value="ready">Ready for Harvest — Mature and planned for cutting</option>
                    <option value="harvested">Harvested — Stored in stock</option>
                  </select>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top">
                <button className="btn btn-success px-4 fw-semibold" type="submit">
                  {editingId ? "Save Changes" : "Register Crop"}
                </button>
                <button
                  className="btn btn-outline-secondary px-3"
                  type="button"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Main Records Container */}
      <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {/* Controls Bar */}
        <div className="card-header bg-white border-bottom p-3 p-md-4">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input
                  id="crop-search"
                  className="form-control border-start-0 ps-0"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by crop, field..."
                />
              </div>
            </div>

            {/* Filter */}
            <div className="col-8 col-md-4">
              <select
                id="status-filter"
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Statuses ({crops.length})</option>
                <option value="growing">Growing ({metrics.growing})</option>
                <option value="ready">Ready for Harvest ({metrics.ready})</option>
                <option value="harvested">Harvested ({metrics.harvested})</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="col-4 col-md-3 d-flex justify-content-end">
              <div className="btn-group p-1 bg-light rounded-3" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "grid" ? "btn-white shadow-sm fw-bold" : "btn-light text-muted"}`}
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === "table" ? "btn-white shadow-sm fw-bold" : "btn-light text-muted"}`}
                  onClick={() => setViewMode("table")}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="card-body p-3 p-md-4">
          {filteredCrops.length === 0 ? (
            <div className="text-center py-5">
              <Sprout size={44} className="text-success opacity-50 mb-3" />
              <h3 className="h6 fw-bold">
                {crops.length === 0 ? "No crops registered yet" : "No matching crops found"}
              </h3>
              <p className="text-secondary small mb-3">
                {crops.length === 0
                  ? "Start by adding your first crop to track yields and cutting schedules."
                  : "Try clearing your search query or changing the status filter."}
              </p>
              {crops.length === 0 && (
                <button
                  className="btn btn-sm btn-success px-3"
                  onClick={() => setShowForm(true)}
                >
                  Add Your First Crop
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Modern Grid Card View */
            <div className="row g-3">
              {filteredCrops.map((crop) => {
                const badge = getStatusBadge(crop.status);
                const emoji = getCropEmoji(crop.name);
                const harvestedPct = crop.expectedQuantityKg > 0
                  ? Math.min(100, Math.round((crop.harvestedQuantityKg / crop.expectedQuantityKg) * 100))
                  : 0;

                return (
                  <div className="col-12 col-md-6 col-xl-4" key={crop.id}>
                    <div className="crop-mgmt-card">
                      {/* Card Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="crop-avatar-box">{emoji}</span>
                          <div>
                            <h3 className="crop-card-name mb-0">{crop.name}</h3>
                            <span className="crop-card-loc">
                              <MapPin size={12} className="me-1 opacity-75" />
                              {crop.field}
                            </span>
                          </div>
                        </div>

                        <span className={`status-pill ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Yield Progress Bar */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between text-muted small mb-1">
                          <span>Harvest Progress</span>
                          <strong className="text-dark">{harvestedPct}%</strong>
                        </div>
                        <div className="progress" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${harvestedPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="crop-meta-grid mb-3">
                        <div className="meta-cell">
                          <span className="meta-cell-label">Expected</span>
                          <strong className="meta-cell-value">
                            {Number(crop.expectedQuantityKg).toLocaleString()} kg
                          </strong>
                        </div>
                        <div className="meta-cell">
                          <span className="meta-cell-label">Harvested</span>
                          <strong className="meta-cell-value text-success">
                            {Number(crop.harvestedQuantityKg).toLocaleString()} kg
                          </strong>
                        </div>
                        <div className="meta-cell">
                          <span className="meta-cell-label">Cutting Date</span>
                          <span className="meta-cell-value">
                            <Calendar size={12} className="me-1 text-muted" />
                            {crop.cuttingDate}
                          </span>
                        </div>
                        <div className="meta-cell">
                          <span className="meta-cell-label">Health Score</span>
                          <strong className="meta-cell-value">
                            <Activity size={12} className="me-1 text-success" />
                            {crop.healthScore}%
                          </strong>
                        </div>
                      </div>

                      {/* Card Actions */}
                      {isAdmin && (
                        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                            onClick={() => startEdit(crop)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                            onClick={() => handleDelete(crop)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Responsive Clean Table View */
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("name")}
                      title="Sort by Crop Name"
                    >
                      <span className="d-inline-flex align-items-center">
                        Crop {renderSortIcon("name")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("field")}
                      title="Sort by Field"
                    >
                      <span className="d-inline-flex align-items-center">
                        Field {renderSortIcon("field")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("expectedQuantityKg")}
                      title="Sort by Expected Yield"
                    >
                      <span className="d-inline-flex align-items-center">
                        Expected {renderSortIcon("expectedQuantityKg")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("harvestedQuantityKg")}
                      title="Sort by Harvested Yield"
                    >
                      <span className="d-inline-flex align-items-center">
                        Harvested {renderSortIcon("harvestedQuantityKg")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("cuttingDate")}
                      title="Sort by Cutting Date"
                    >
                      <span className="d-inline-flex align-items-center">
                        Cutting Date {renderSortIcon("cuttingDate")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("healthScore")}
                      title="Sort by Health Score"
                    >
                      <span className="d-inline-flex align-items-center">
                        Health {renderSortIcon("healthScore")}
                      </span>
                    </th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrops.map((crop) => {
                    const badge = getStatusBadge(crop.status);
                    const emoji = getCropEmoji(crop.name);

                    return (
                      <tr key={crop.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="fs-5">{emoji}</span>
                            <span className="fw-bold text-dark">{crop.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="text-secondary small">
                            <MapPin size={12} className="me-1 text-muted" />
                            {crop.field}
                          </span>
                        </td>
                        <td>{Number(crop.expectedQuantityKg).toLocaleString()} kg</td>
                        <td className="fw-semibold text-success">
                          {Number(crop.harvestedQuantityKg).toLocaleString()} kg
                        </td>
                        <td>
                          <span className="text-secondary small">
                            <Calendar size={12} className="me-1 text-muted" />
                            {crop.cuttingDate}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {crop.healthScore}%
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${badge.className}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          {isAdmin ? (
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                aria-label={`Edit ${crop.name}`}
                                title="Edit crop"
                                onClick={() => startEdit(crop)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                aria-label={`Delete ${crop.name}`}
                                title="Delete crop"
                                onClick={() => handleDelete(crop)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted small">View Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Floating Toast Notification */}
      {notice && (
        <ToastNotification
          message={notice}
          type="success"
          onClose={() => setNotice("")}
        />
      )}
      {error && (
        <ToastNotification
          message={error}
          type="error"
          onClose={() => setError("")}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetCrop)}
        title="Delete Crop Record"
        message={`Are you sure you want to delete "${deleteTargetCrop?.name}" (${deleteTargetCrop?.field || "Field"})? This will permanently remove its historical yield data.`}
        confirmText="Yes, Delete Crop"
        cancelText="Keep Crop"
        variant="danger"
        onConfirm={confirmDeleteCrop}
        onCancel={() => setDeleteTargetCrop(null)}
      />
    </main>
  );
}
