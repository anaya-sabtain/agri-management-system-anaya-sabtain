import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  UserCheck,
  CreditCard,
  Calendar,
  LayoutGrid,
  List,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { STORAGE_KEYS } from "../data/dataModels";
import { exportToCSV } from "../services/csvExport";
import {
  getAll,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../services/storageService";
import ConfirmModal from "../components/common/ConfirmModal";
import ToastNotification from "../components/common/ToastNotification";
import ImageZoomModal from "../components/common/ImageZoomModal";
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAllBuyers,
  buyersLoaded,
  buyerAdded,
  buyerUpdated,
  buyerDeleted,
} from '../store/buyersSlice'
import { selectUserRole } from '../store/authSlice'
import { activityAdded } from '../store/activitySlice'

const initialForm = {
  fullName: "",
  cnic: "",
  photoDataUrl: null,
};

function formatCnic(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function normalizeCnic(value) {
  return value.replace(/\D/g, "");
}

export default function Buyers() {
  const dispatch = useDispatch()
  const buyers = useSelector(selectAllBuyers)
  const role = useSelector(selectUserRole)
  const isAdmin = role === 'Admin'
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTargetBuyer, setDeleteTargetBuyer] = useState(null);
  const [sortKey, setSortKey] = useState("fullName");
  const [sortDirection, setSortDirection] = useState("asc");
  const [zoomImage, setZoomImage] = useState(null);

  const openZoom = (buyer) => {
    setZoomImage({
      url: buyer.photoDataUrl,
      title: buyer.fullName,
      subtitle: buyer.cnic,
      meta: {
        cnic: buyer.cnic,
        registered: buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : "Active Record",
        orders: buyerOrderStats.get(buyer.id)?.count || 0,
        volume: `${(buyerOrderStats.get(buyer.id)?.totalKg || 0).toLocaleString()} kg`,
      },
    });
  };

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "volume" ? "desc" : "asc");
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

  function loadData() {
    try {
      dispatch(buyersLoaded(getAll(STORAGE_KEYS.BUYERS)))
      setOrders(getAll(STORAGE_KEYS.ORDERS));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load buyers.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = buyers.length;
    const withPhotos = buyers.filter((b) => b.photoDataUrl).length;

    // Active buyers (those with at least 1 order)
    const buyersWithOrders = new Set(orders.map((o) => o.buyerId));
    const active = buyers.filter((b) => buyersWithOrders.has(b.id)).length;

    return { total, active, withPhotos };
  }, [buyers, orders]);

  const buyerOrderStats = useMemo(() => {
    const stats = new Map();
    orders.forEach((o) => {
      const current = stats.get(o.buyerId) || { count: 0, totalKg: 0 };
      current.count += 1;
      current.totalKg += Number(o.quantityKg) || 0;
      stats.set(o.buyerId, current);
    });
    return stats;
  }, [orders]);

  const filteredBuyers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return buyers
      .filter((buyer) =>
        [buyer.fullName, buyer.cnic].some((value) =>
          (value || "").toLowerCase().includes(query)
        )
      )
      .sort((a, b) => {
        if (sortKey === "volume") {
          const volA = buyerOrderStats.get(a.id)?.totalKg || 0;
          const volB = buyerOrderStats.get(b.id)?.totalKg || 0;
          return sortDirection === "asc" ? volA - volB : volB - volA;
        }
        if (sortKey === "cnic") {
          return sortDirection === "asc"
            ? (a.cnic || "").localeCompare(b.cnic || "")
            : (b.cnic || "").localeCompare(a.cnic || "");
        }
        if (sortKey === "createdAt") {
          return sortDirection === "asc"
            ? (a.createdAt || "").localeCompare(b.createdAt || "")
            : (b.createdAt || "").localeCompare(a.createdAt || "");
        }
        // Default fullName
        return sortDirection === "asc"
          ? (a.fullName || "").localeCompare(b.fullName || "")
          : (b.fullName || "").localeCompare(a.fullName || "");
      });
  }, [buyers, search, sortKey, sortDirection, buyerOrderStats]);

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  }

  function handleCnicChange(event) {
    setForm((current) => ({
      ...current,
      cnic: formatCnic(event.target.value),
    }));
  }

  function handlePhotoChange(event) {
    setError("");
    setNotice("");

    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a JPG or PNG image.");
      event.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Photo size must not exceed 1 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({
          ...current,
          photoDataUrl: reader.result,
        }));
      } else {
        setError("Could not read the selected image.");
      }
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  }

  function startEdit(buyer) {
    if (!isAdmin) return;
    setForm({
      fullName: buyer.fullName || "",
      cnic: buyer.cnic || "",
      photoDataUrl: buyer.photoDataUrl || null,
    });

    setEditingId(buyer.id);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const fullName = form.fullName.trim();
    const digits = normalizeCnic(form.cnic);

    if (!/^[A-Za-z ]{3,}$/.test(fullName)) {
      setError(
        "Name must contain at least 3 English letters and spaces only."
      );
      return;
    }

    if (!/^\d{13}$/.test(digits)) {
      setError("CNIC must contain exactly 13 digits.");
      return;
    }

    const duplicate = buyers.some(
      (buyer) =>
        buyer.id !== editingId &&
        normalizeCnic(buyer.cnic || "") === digits
    );

    if (duplicate) {
      setError("This CNIC already belongs to another buyer.");
      return;
    }

    const buyerData = {
      fullName,
      cnic: formatCnic(digits),
      photoDataUrl: form.photoDataUrl || null,
    };

    if (editingId && !isAdmin) {
      setError("Only administrators are permitted to edit buyer records.");
      return;
    }

    try {
      if (editingId) {
        dispatch(
          buyerUpdated({
            id: editingId,
            changes: buyerData,
          })
        );

        dispatch(
          activityAdded({
            action: "UPDATE",
            entity: "Buyer",
            entityId: editingId,
            description: `Updated buyer: ${buyerData.fullName}`,
          })
        );

        setNotice("Buyer successfully updated.");
      } else {
        dispatch(buyerAdded(buyerData));

        dispatch(
          activityAdded({
            action: "CREATE",
            entity: "Buyer",
            description: `Added buyer: ${buyerData.fullName}`,
          })
        );

        setNotice("Buyer successfully added.");
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Could not save buyer.");
    }
  }

  function handleDelete(buyer) {
    if (!isAdmin) return;
    setDeleteTargetBuyer(buyer);
  }

  function confirmDeleteBuyer() {
    if (!isAdmin) return;
    if (!deleteTargetBuyer) return;

    try {
      dispatch(buyerDeleted(deleteTargetBuyer.id));

      dispatch(
        activityAdded({
          action: "DELETE",
          entity: "Buyer",
          entityId: deleteTargetBuyer.id,
          description: `Deleted buyer: ${deleteTargetBuyer.fullName}`,
        })
      );

      setNotice(
        `Buyer "${deleteTargetBuyer.fullName}" successfully deleted.`
      );
      setError("");
    } catch (err) {
      setError(err.message || "Could not delete buyer.");
    } finally {
      setDeleteTargetBuyer(null);
    }
  }

  return (
    <main className="container-fluid py-3 py-md-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="analytics-eyebrow text-success mb-1">CLIENT DIRECTORY</p>
          <h1 className="h3 mb-1 fw-bold text-dark">Buyer Management</h1>
          <p className="text-secondary mb-0">
            Maintain verified customer profiles, national ID records and photo identification.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm rounded-3 fw-semibold bg-white"
            onClick={() => {
              const exportData = buyers.map((b) => ({
                "Buyer ID": b.id,
                "Full Name": b.fullName,
                "CNIC": b.cnic,
                "Date Registered": b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "",
              }));
              exportToCSV(exportData, `AgriSense_Buyers_${new Date().toISOString().slice(0, 10)}.csv`);
            }}
            disabled={buyers.length === 0}
            title="Download CSV report of all buyers"
          >
            <Download size={17} />
            Export CSV
          </button>

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
            {showForm ? "Close Form" : "Add New Buyer"}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-success-subtle text-success">
              <Users size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Total Verified Buyers</span>
              <h3 className="mgmt-metric-val">{metrics.total} Registered</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-primary-subtle text-primary">
              <UserCheck size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Active Transacting</span>
              <h3 className="mgmt-metric-val">{metrics.active} With Orders</h3>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-warning-subtle text-warning">
              <ImageIcon size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Photo Verified</span>
              <h3 className="mgmt-metric-val">{metrics.withPhotos} Photos Stored</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}
      {notice && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="status">
          <Sparkles size={18} />
          {notice}
        </div>
      )}

      {/* Form Drawer / Card */}
      {showForm && (
        <section className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 bg-success-subtle text-success">
                <Users size={18} />
              </span>
              <h2 className="h5 mb-0 fw-bold">
                {editingId ? "Edit Buyer Profile" : "Register New Buyer"}
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
                  <label htmlFor="buyer-name" className="form-label fw-semibold">
                    Full Legal Name
                  </label>
                  <input
                    id="buyer-name"
                    className="form-control form-control-lg fs-6"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="e.g. Ali Ahmed Khan"
                    minLength={3}
                    required
                  />
                  <div className="form-text">English alphabet letters and spaces only.</div>
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="buyer-cnic" className="form-label fw-semibold">
                    CNIC (National ID Card)
                  </label>
                  <input
                    id="buyer-cnic"
                    className="form-control form-control-lg fs-6"
                    value={form.cnic}
                    onChange={handleCnicChange}
                    placeholder="35202-1234567-1"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={15}
                    required
                  />
                  <div className="form-text">13 digits; hyphens are formatted automatically.</div>
                </div>

                <div className="col-12">
                  <label htmlFor="buyer-photo" className="form-label fw-semibold">
                    Buyer Identity Photo (Optional)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <Camera size={18} className="text-muted" />
                    </span>
                    <input
                      id="buyer-photo"
                      type="file"
                      accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                      className="form-control"
                      onChange={handlePhotoChange}
                    />
                  </div>
                  <div className="form-text">JPG or PNG image, maximum file size 1 MB.</div>
                </div>

                {form.photoDataUrl && (
                  <div className="col-12">
                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border">
                      <img
                        src={form.photoDataUrl}
                        alt="Buyer preview"
                        width="72"
                        height="72"
                        className="rounded-3 shadow-sm"
                        style={{ objectFit: "cover" }}
                      />
                      <div>
                        <p className="small fw-semibold mb-1">Attached Photo Preview</p>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              photoDataUrl: null,
                            }))
                          }
                        >
                          Remove Photo
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top">
                <button type="submit" className="btn btn-success px-4 fw-semibold">
                  {editingId ? "Save Changes" : "Save Buyer Record"}
                </button>
                <button type="button" className="btn btn-outline-secondary px-3" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Main Records List / Grid */}
      <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {/* Controls Bar */}
        <div className="card-header bg-white border-bottom p-3 p-md-4">
          <div className="row g-3 align-items-center justify-content-between">
            <div className="col-12 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input
                  className="form-control border-start-0 ps-0"
                  aria-label="Search buyers"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by buyer name or CNIC..."
                />
              </div>
            </div>

            <div className="col-12 col-md-4 d-flex justify-content-md-end align-items-center gap-2">
              <span className="text-secondary small me-2">
                Showing <strong>{filteredBuyers.length}</strong> of {buyers.length}
              </span>
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

        {/* Content View */}
        <div className="card-body p-3 p-md-4">
          {filteredBuyers.length === 0 ? (
            <div className="text-center py-5">
              <Users size={44} className="text-success opacity-50 mb-3" />
              <h3 className="h6 fw-bold">
                {buyers.length === 0 ? "No buyers registered yet" : "No matching buyers found"}
              </h3>
              <p className="text-secondary small mb-3">
                {buyers.length === 0
                  ? "Add buyers to start taking and managing harvest orders."
                  : "Try checking the spelling or CNIC digits."}
              </p>
              {buyers.length === 0 && (
                <button
                  className="btn btn-sm btn-success px-3"
                  onClick={() => setShowForm(true)}
                >
                  Register First Buyer
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Modern Grid Card View */
            <div className="row g-3">
              {filteredBuyers.map((buyer) => (
                <div className="col-12 col-md-6 col-xl-4" key={buyer.id}>
                  <div className="buyer-profile-card">
                    <div className="d-flex align-items-center gap-3 mb-3">
                      {buyer.photoDataUrl ? (
                        <img
                          src={buyer.photoDataUrl}
                          alt={buyer.fullName}
                          width="56"
                          height="56"
                          className="rounded-circle shadow-sm"
                          style={{ objectFit: "cover", cursor: "zoom-in", width: 56, height: 56, minWidth: 56, minHeight: 56, aspectRatio: '1 / 1', flexShrink: 0 }}
                          title="Click to zoom photo"
                          onClick={() => openZoom(buyer)}
                        />
                      ) : (
                        <div
                          className="buyer-avatar-placeholder"
                          style={{ cursor: "pointer", width: 56, height: 56, minWidth: 56, minHeight: 56, aspectRatio: '1 / 1', flexShrink: 0 }}
                          title="Click to view details"
                          onClick={() => openZoom(buyer)}
                        >
                          <span>{buyer.fullName.charAt(0).toUpperCase()}</span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="buyer-name-title mb-1 text-truncate">{buyer.fullName}</h3>
                        <div className="d-flex align-items-center gap-1 text-muted small">
                          <CreditCard size={13} className="opacity-75" />
                          <span className="font-monospace">{buyer.cnic}</span>
                        </div>
                      </div>
                    </div>

                    {/* Orders & Volume Summary */}
                    <div className="d-flex align-items-center justify-content-between p-2 mb-3 rounded-3 bg-light border border-light-subtle">
                      <span className="text-muted small">Orders & Yield:</span>
                      <span className="small fw-bold text-dark">
                        {buyerOrderStats.get(buyer.id)?.count || 0} order(s) • {(buyerOrderStats.get(buyer.id)?.totalKg || 0).toLocaleString()} kg
                      </span>
                    </div>

                    <div className="buyer-card-footer pt-3 border-top d-flex justify-content-between align-items-center">
                      <span className="text-muted small d-inline-flex align-items-center gap-1">
                        <Calendar size={12} />
                        {buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : "Active"}
                      </span>

                      {isAdmin && (
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success p-1 px-2"
                            aria-label={`Edit ${buyer.fullName}`}
                            title="Edit Profile"
                            onClick={() => startEdit(buyer)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1 px-2"
                            aria-label={`Delete ${buyer.fullName}`}
                            title="Delete Profile"
                            onClick={() => handleDelete(buyer)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Clean Table View */
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("fullName")}
                      title="Sort by Buyer Identity"
                    >
                      <span className="d-inline-flex align-items-center">
                        Buyer Identity {renderSortIcon("fullName")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("cnic")}
                      title="Sort by CNIC Number"
                    >
                      <span className="d-inline-flex align-items-center">
                        CNIC Number {renderSortIcon("cnic")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("volume")}
                      title="Sort by Orders & Volume"
                    >
                      <span className="d-inline-flex align-items-center">
                        Orders & Volume {renderSortIcon("volume")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("createdAt")}
                      title="Sort by Registered Date"
                    >
                      <span className="d-inline-flex align-items-center">
                        Registered Date {renderSortIcon("createdAt")}
                      </span>
                    </th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuyers.map((buyer) => (
                    <tr key={buyer.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          {buyer.photoDataUrl ? (
                            <img
                              src={buyer.photoDataUrl}
                              alt=""
                              width="40"
                              height="40"
                              className="rounded-circle"
                              style={{ objectFit: "cover", cursor: "zoom-in", width: 40, height: 40, minWidth: 40, minHeight: 40, aspectRatio: '1 / 1', flexShrink: 0 }}
                              title="Click to zoom photo"
                              onClick={() => openZoom(buyer)}
                            />
                          ) : (
                            <span
                              className="buyer-avatar-placeholder small"
                              style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, aspectRatio: '1 / 1', fontSize: 14, cursor: "pointer", flexShrink: 0 }}
                              title="Click to view details"
                              onClick={() => openZoom(buyer)}
                            >
                              {buyer.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="fw-bold text-dark">{buyer.fullName}</span>
                        </div>
                      </td>
                      <td className="font-monospace text-secondary">{buyer.cnic}</td>
                      <td className="small">
                        {buyerOrderStats.get(buyer.id)?.count > 0 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">
                            {buyerOrderStats.get(buyer.id).count} order(s) ({buyerOrderStats.get(buyer.id).totalKg.toLocaleString()} kg)
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border">0 orders</span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        {isAdmin ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              aria-label={`Edit ${buyer.fullName}`}
                              onClick={() => startEdit(buyer)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              aria-label={`Delete ${buyer.fullName}`}
                              onClick={() => handleDelete(buyer)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
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
        isOpen={Boolean(deleteTargetBuyer)}
        title="Delete Buyer Account"
        message={`Are you sure you want to delete "${deleteTargetBuyer?.fullName}" (${deleteTargetBuyer?.cnic})? This client profile will be permanently removed.`}
        confirmText="Yes, Delete Buyer"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteBuyer}
        onCancel={() => setDeleteTargetBuyer(null)}
      />

      {/* Interactive Image Zoom Lightbox Modal */}
      <ImageZoomModal
        isOpen={Boolean(zoomImage)}
        onClose={() => setZoomImage(null)}
        imageData={zoomImage}
      />
    </main>
  );
}
