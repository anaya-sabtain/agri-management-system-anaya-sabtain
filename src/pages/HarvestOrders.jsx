import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Scale,
  Calendar,
  LayoutGrid,
  List,
  Sparkles,
  User,
  Wheat,
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
import { getAvailableStock } from "../services/orderUtils";
import ConfirmModal from "../components/common/ConfirmModal";
import ToastNotification from "../components/common/ToastNotification";
import ImageZoomModal from "../components/common/ImageZoomModal";
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAllOrders,
  ordersLoaded,
  orderAdded,
  orderUpdated,
  orderDeleted,
} from '../store/ordersSlice'
import { selectUserRole } from '../store/authSlice'
import { activityAdded } from '../store/activitySlice'

const initialForm = {
  buyerId: "",
  cropId: "",
  quantityKg: "",
  pricePerKg: "",
  saleDate: "",
  status: "pending",
};

const orderStatuses = ["pending", "completed", "cancelled"];

function getStatusBadge(status) {
  if (status === "completed") {
    return { label: "Completed", className: "badge-status--ready", Icon: CheckCircle2 };
  }
  if (status === "cancelled") {
    return { label: "Cancelled", className: "badge-status--cancelled", Icon: XCircle };
  }
  return { label: "Pending Fulfillment", className: "badge-status--growing", Icon: Clock };
}

export default function HarvestOrders() {
  const dispatch = useDispatch()
  const orders = useSelector(selectAllOrders)
  const role = useSelector(selectUserRole)
  const isAdmin = role === 'Admin'
  const [buyers, setBuyers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTargetOrder, setDeleteTargetOrder] = useState(null);
  const [sortKey, setSortKey] = useState("saleDate");
  const [sortDirection, setSortDirection] = useState("desc");

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
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

  const [zoomImage, setZoomImage] = useState(null);

  const openBuyerZoom = (buyer) => {
    if (!buyer) return;
    setZoomImage({
      url: buyer.photoDataUrl,
      title: buyer.fullName,
      subtitle: buyer.cnic,
      meta: {
        cnic: buyer.cnic,
        registered: buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : "Active Record",
      },
    });
  };

  function loadData() {
    try {
      dispatch(ordersLoaded(getAll(STORAGE_KEYS.ORDERS)));
      setBuyers(getAll(STORAGE_KEYS.BUYERS));
      setCrops(getAll(STORAGE_KEYS.CROPS));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load order data.");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const buyerById = useMemo(
    () => new Map(buyers.map((buyer) => [buyer.id, buyer])),
    [buyers]
  );

  const cropById = useMemo(
    () => new Map(crops.map((crop) => [crop.id, crop])),
    [crops]
  );

  // Metrics
  const metrics = useMemo(() => {
    return orders.reduce(
      (acc, o) => {
        acc.total += 1;
        const qty = Number(o.quantityKg) || 0;
        if (o.status === "pending") {
          acc.pending += 1;
          acc.pendingKg += qty;
        }
        if (o.status === "completed") {
          acc.completed += 1;
          acc.completedKg += qty;
        }
        if (o.status === "cancelled") acc.cancelled += 1;
        return acc;
      },
      { total: 0, pending: 0, completed: 0, cancelled: 0, pendingKg: 0, completedKg: 0 }
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) => {
        const buyer = buyerById.get(order.buyerId);
        const crop = cropById.get(order.cropId);

        const matchesSearch = [
          buyer?.fullName,
          buyer?.cnic,
          crop?.name,
          crop?.field,
          order.saleDate,
        ].some((value) => (value || "").toLowerCase().includes(query));

        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortKey === "buyer") {
          const buyerA = buyerById.get(a.buyerId)?.fullName || "";
          const buyerB = buyerById.get(b.buyerId)?.fullName || "";
          return sortDirection === "asc"
            ? buyerA.localeCompare(buyerB)
            : buyerB.localeCompare(buyerA);
        }
        if (sortKey === "crop") {
          const cropA = cropById.get(a.cropId)?.name || "";
          const cropB = cropById.get(b.cropId)?.name || "";
          return sortDirection === "asc"
            ? cropA.localeCompare(cropB)
            : cropB.localeCompare(cropA);
        }
        if (sortKey === "quantityKg") {
          const qtyA = Number(a.quantityKg) || 0;
          const qtyB = Number(b.quantityKg) || 0;
          return sortDirection === "asc" ? qtyA - qtyB : qtyB - qtyA;
        }
        if (sortKey === "status") {
          return sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        // Default saleDate
        return sortDirection === "asc"
          ? a.saleDate.localeCompare(b.saleDate)
          : b.saleDate.localeCompare(a.saleDate);
      });
  }, [orders, buyerById, cropById, search, statusFilter, sortKey, sortDirection]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(order) {
    if (!isAdmin) return;
    setForm({
      buyerId: order.buyerId,
      cropId: order.cropId,
      quantityKg: String(order.quantityKg),
      pricePerKg: String(order.pricePerKg ?? ""),
      saleDate: order.saleDate,
      status: order.status,
    });

    setEditingId(order.id);
    setError("");
    setNotice("");
    setShowForm(true);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const quantity = Number(form.quantityKg);
    const pricePerKg = Number(form.pricePerKg);

    if (
      form.pricePerKg === "" ||
      !Number.isFinite(pricePerKg) ||
      pricePerKg <= 0
    ) {
      setError("Price per kg must be greater than zero.");
      return;
    }

    const crop = cropById.get(form.cropId);
    const buyer = buyerById.get(form.buyerId);

    if (!buyer) {
      setError("Please select a valid buyer.");
      return;
    }

    if (!crop) {
      setError("Please select a valid crop.");
      return;
    }

    if (
      form.quantityKg === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      setError("Order quantity must be greater than zero.");
      return;
    }

    if (!form.saleDate || !orderStatuses.includes(form.status)) {
      setError("Please select a valid date and order status.");
      return;
    }

    const available = getAvailableStock(crop, orders, editingId);

    if (form.status !== "cancelled" && quantity > available) {
      setError(
        `Insufficient stock. Available quantity is ${available} kg.`
      );
      return;
    }

    const orderData = {
      buyerId: form.buyerId,
      cropId: form.cropId,
      quantityKg: quantity,
      pricePerKg: pricePerKg,
      saleDate: form.saleDate,
      status: form.status,
    };

    if (editingId && !isAdmin) {
      setError("Only administrators are permitted to edit orders.");
      return;
    }

    try {
      if (editingId) {
        dispatch(
          orderUpdated({
            id: editingId,
            changes: orderData,
          })
        );

        dispatch(
          activityAdded({
            action: "UPDATE",
            entity: "Order",
            entityId: editingId,
            description: `Updated order for ${buyer.fullName}: ${crop.name}, ${quantity} kg`,
          })
        );

        setNotice("Order successfully updated.");
      } else {
        dispatch(orderAdded(orderData));

        dispatch(
          activityAdded({
            action: "CREATE",
            entity: "Order",
            description: `Created order for ${buyer.fullName}: ${crop.name}, ${quantity} kg`,
          })
        );

        setNotice("Order successfully created.");
      }

      resetForm();
    } catch (err) {
      setError(err.message || "Could not save order.");
    }
  }

  function handleDelete(order) {
    if (!isAdmin) return;
    setDeleteTargetOrder(order);
  }

  function confirmDeleteOrder() {
    if (!isAdmin) return;
    if (!deleteTargetOrder) return;

    try {
      const deletedBuyer = buyerById.get(deleteTargetOrder.buyerId);
      const deletedCrop = cropById.get(deleteTargetOrder.cropId);

      dispatch(orderDeleted(deleteTargetOrder.id));

      dispatch(
        activityAdded({
          action: "DELETE",
          entity: "Order",
          entityId: deleteTargetOrder.id,
          description: `Deleted order for ${deletedBuyer?.fullName || "Unknown buyer"}: ${deletedCrop?.name || "Unknown crop"}, ${deleteTargetOrder.quantityKg} kg`,
        })
      );

      setNotice("Order successfully deleted.");
      setError("");
    } catch (err) {
      setError(err.message || "Could not delete order.");
    } finally {
      setDeleteTargetOrder(null);
    }
  }

  const selectedCrop = cropById.get(form.cropId);
  const availableStock = selectedCrop
    ? getAvailableStock(selectedCrop, orders, editingId)
    : null;

  return (
    <main className="container-fluid py-3 py-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="analytics-eyebrow text-success mb-1">SALES & COMMERCE</p>
          <h1 className="h3 mb-1 fw-bold text-dark">Harvest & Orders</h1>
          <p className="text-secondary mb-0">
            Fulfill buyer orders, track inventory allocations and sales schedules.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 px-3 py-2 shadow-sm rounded-3 fw-semibold bg-white"
            onClick={() => {
              const exportData = orders.map((o) => {
                const buyer = buyerById.get(o.buyerId);
                const crop = cropById.get(o.cropId);
                return {
                  "Order ID": o.id,
                  "Buyer Name": buyer?.fullName || "Unknown",
                  "Buyer CNIC": buyer?.cnic || "",
                  "Crop": crop?.name || "Unknown",
                  "Field": crop?.field || "",
                  "Quantity (kg)": o.quantityKg,
                  "Order Date": o.saleDate,
                  "Status": o.status,
                };
              });
              exportToCSV(exportData, `AgriSense_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
            }}
            disabled={orders.length === 0}
            title="Download CSV report of all orders"
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
            {showForm ? "Close Form" : "Create New Order"}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-success-subtle text-success">
              <ShoppingCart size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Total Orders</span>
              <h3 className="mgmt-metric-val">{metrics.total} Deals</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-warning-subtle text-warning">
              <Clock size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Pending Orders</span>
              <h3 className="mgmt-metric-val">{metrics.pending} Pending</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-primary-subtle text-primary">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Delivered Volume</span>
              <h3 className="mgmt-metric-val">{metrics.completedKg.toLocaleString()} kg</h3>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="mgmt-metric-card">
            <div className="mgmt-metric-icon bg-info-subtle text-info">
              <Scale size={20} />
            </div>
            <div>
              <span className="mgmt-metric-label">Pending Volume</span>
              <h3 className="mgmt-metric-val">{metrics.pendingKg.toLocaleString()} kg</h3>
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

      {/* Slide-over Form */}
      {showForm && (
        <section className="card border-0 shadow-sm mb-4 rounded-4 overflow-hidden">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3 bg-success-subtle text-success">
                <ShoppingCart size={18} />
              </span>
              <h2 className="h5 mb-0 fw-bold">{editingId ? "Edit Order Deal" : "New Harvest Order"}</h2>
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
                  <label htmlFor="order-buyer" className="form-label fw-semibold">
                    Select Buyer
                  </label>
                  <select
                    id="order-buyer"
                    className="form-select form-select-lg fs-6"
                    name="buyerId"
                    value={form.buyerId}
                    onChange={updateForm}
                    required
                  >
                    <option value="">Choose a registered buyer...</option>
                    {buyers.map((buyer) => (
                      <option key={buyer.id} value={buyer.id}>
                        {buyer.fullName} — {buyer.cnic}
                      </option>
                    ))}
                  </select>
                  {buyers.length === 0 && (
                    <div className="form-text text-danger">
                      No buyers available. Please create a buyer in Buyer Management first.
                    </div>
                  )}
                </div>

                <div className="col-12 col-md-6">
                  <label htmlFor="order-crop" className="form-label fw-semibold">
                    Select Harvested Crop
                  </label>
                  <select
                    id="order-crop"
                    className="form-select form-select-lg fs-6"
                    name="cropId"
                    value={form.cropId}
                    onChange={updateForm}
                    required
                  >
                    <option value="">Choose crop to allocate...</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} — {crop.field}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCrop && (
                  <div className="col-12">
                    <div className="alert alert-success d-flex align-items-center gap-2 mb-0 py-2">
                      <Scale size={18} />
                      <span>
                        Verified available warehouse stock for <strong>{selectedCrop.name}</strong>:{" "}
                        <strong>{availableStock} kg</strong>
                      </span>
                    </div>
                  </div>
                )}

                <div className="col-12 col-md-4">
                  <label htmlFor="order-quantity" className="form-label fw-semibold">
                    Order Quantity (kg)
                  </label>
                  <input
                    id="order-quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    max={availableStock ?? undefined}
                    className="form-control form-control-lg fs-6"
                    name="quantityKg"
                    value={form.quantityKg}
                    onChange={updateForm}
                    placeholder="e.g. 500"
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="order-price" className="form-label fw-semibold">
                    Price per kg (PKR)
                  </label>

                  <input
                    id="order-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="form-control form-control-lg fs-6"
                    name="pricePerKg"
                    value={form.pricePerKg}
                    onChange={updateForm}
                    placeholder="e.g. 150"
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="order-date" className="form-label fw-semibold">
                    Transaction / Sale Date
                  </label>
                  <input
                    id="order-date"
                    type="date"
                    className="form-control form-control-lg fs-6"
                    name="saleDate"
                    value={form.saleDate}
                    onChange={updateForm}
                    required
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label htmlFor="order-status" className="form-label fw-semibold">
                    Fulfillment Status
                  </label>
                  <select
                    id="order-status"
                    className="form-select form-select-lg fs-6"
                    name="status"
                    value={form.status}
                    onChange={updateForm}
                  >
                    <option value="pending">Pending Fulfillment</option>
                    <option value="completed">Completed / Dispatched</option>
                    <option value="cancelled">Cancelled (Restore Stock)</option>
                  </select>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top">
                <button
                  type="submit"
                  className="btn btn-success px-4 fw-semibold"
                  disabled={buyers.length === 0 || crops.length === 0}
                >
                  {editingId ? "Save Changes" : "Confirm Order"}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
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
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </span>
                <input
                  className="form-control border-start-0 ps-0"
                  aria-label="Search orders"
                  placeholder="Search buyer, crop or field..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="col-8 col-md-4">
              <select
                className="form-select"
                aria-label="Filter orders by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="pending">Pending ({metrics.pending})</option>
                <option value="completed">Completed ({metrics.completed})</option>
                <option value="cancelled">Cancelled ({metrics.cancelled})</option>
              </select>
            </div>

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

        {/* Content View */}
        <div className="card-body p-3 p-md-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-5">
              <ShoppingCart size={44} className="text-success opacity-50 mb-3" />
              <h3 className="h6 fw-bold">
                {orders.length === 0 ? "No orders recorded yet" : "No matching orders found"}
              </h3>
              <p className="text-secondary small mb-3">
                {orders.length === 0
                  ? "Record harvest orders from verified buyers with real-time stock allocation."
                  : "Try clearing your search term or selecting all statuses."}
              </p>
              {orders.length === 0 && (
                <button
                  className="btn btn-sm btn-success px-3"
                  onClick={() => setShowForm(true)}
                  disabled={buyers.length === 0 || crops.length === 0}
                >
                  Create Your First Order
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Modern Grid Card View */
            <div className="row g-3">
              {filteredOrders.map((order) => {
                const buyer = buyerById.get(order.buyerId);
                const crop = cropById.get(order.cropId);
                const badge = getStatusBadge(order.status);
                const { Icon } = badge;

                return (
                  <div className="col-12 col-md-6 col-xl-4" key={order.id}>
                    <div className="order-mgmt-card">
                      {/* Top Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="order-id-label">ORDER</span>
                          <h3 className="order-crop-title mb-0">{crop?.name || "Unassigned Crop"}</h3>
                          <span className="text-muted small">Field: {crop?.field || "—"}</span>
                        </div>

                        <span className={`status-pill ${badge.className}`}>
                          <Icon size={12} className="me-1" />
                          {badge.label}
                        </span>
                      </div>

                      {/* Buyer Pill */}
                      <div className="order-buyer-box mb-3">
                        <div className="d-flex align-items-center gap-2">
                          {buyer?.photoDataUrl ? (
                            <img
                              src={buyer.photoDataUrl}
                              alt=""
                              width="36"
                              height="36"
                              className="rounded-circle shadow-sm"
                              style={{ objectFit: "cover", cursor: "zoom-in" }}
                              title="Click to zoom buyer photo"
                              onClick={() => openBuyerZoom(buyer)}
                            />
                          ) : (
                            <div
                              className="buyer-avatar-placeholder"
                              style={{ width: 36, height: 36, fontSize: 13, cursor: "pointer" }}
                              title="Click to view details"
                              onClick={() => openBuyerZoom(buyer)}
                            >
                              {buyer ? buyer.fullName.charAt(0).toUpperCase() : <User size={14} />}
                            </div>
                          )}
                          <div className="min-w-0">
                            <strong className="d-block text-dark text-truncate small">{buyer?.fullName || "Unknown Buyer"}</strong>
                            <span className="text-muted small font-monospace">{buyer?.cnic || "No CNIC"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Metric row */}
                      <div className="crop-meta-grid mb-3">
                        <div className="meta-cell">
                          <span className="meta-cell-label">Ordered Qty</span>
                          <strong className="meta-cell-value text-success fs-6">
                            {Number(order.quantityKg).toLocaleString()} kg
                          </strong>
                        </div>
                        <div className="meta-cell">
                          <span className="meta-cell-label">Sale Date</span>
                          <span className="meta-cell-value">
                            <Calendar size={12} className="me-1 text-muted" />
                            {order.saleDate}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                            onClick={() => startEdit(order)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                            onClick={() => handleDelete(order)}
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
            /* Clean Table View */
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("buyer")}
                      title="Sort by Buyer Name"
                    >
                      <span className="d-inline-flex align-items-center">
                        Buyer {renderSortIcon("buyer")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("crop")}
                      title="Sort by Crop"
                    >
                      <span className="d-inline-flex align-items-center">
                        Crop & Field {renderSortIcon("crop")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("quantityKg")}
                      title="Sort by Ordered Quantity"
                    >
                      <span className="d-inline-flex align-items-center">
                        Ordered Quantity {renderSortIcon("quantityKg")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("saleDate")}
                      title="Sort by Sale Date"
                    >
                      <span className="d-inline-flex align-items-center">
                        Sale Date {renderSortIcon("saleDate")}
                      </span>
                    </th>
                    <th
                      className="stock-table-th-sortable"
                      onClick={() => handleSort("status")}
                      title="Sort by Status"
                    >
                      <span className="d-inline-flex align-items-center">
                        Status {renderSortIcon("status")}
                      </span>
                    </th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const buyer = buyerById.get(order.buyerId);
                    const crop = cropById.get(order.cropId);
                    const badge = getStatusBadge(order.status);
                    const { Icon } = badge;

                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {buyer?.photoDataUrl ? (
                              <img
                                src={buyer.photoDataUrl}
                                alt=""
                                width="36"
                                height="36"
                                className="rounded-circle shadow-sm"
                                style={{ objectFit: "cover", cursor: "zoom-in" }}
                                title="Click to zoom buyer photo"
                                onClick={() => openBuyerZoom(buyer)}
                              />
                            ) : (
                              <span
                                className="buyer-avatar-placeholder"
                                style={{ width: 36, height: 36, fontSize: 13, cursor: "pointer" }}
                                title="Click to view details"
                                onClick={() => openBuyerZoom(buyer)}
                              >
                                {buyer ? buyer.fullName.charAt(0).toUpperCase() : <User size={14} />}
                              </span>
                            )}
                            <div>
                              <strong className="d-block text-dark">{buyer?.fullName || "Unknown buyer"}</strong>
                              <span className="text-muted small font-monospace">{buyer?.cnic}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <Wheat size={16} className="text-success" />
                            <div>
                              <span className="fw-bold text-dark">{crop?.name || "Unknown crop"}</span>
                              <span className="d-block text-muted small">{crop?.field}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong className="text-success">{Number(order.quantityKg).toLocaleString()} kg</strong>
                        </td>
                        <td>
                          <span className="text-secondary small">
                            <Calendar size={12} className="me-1 text-muted" />
                            {order.saleDate}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${badge.className}`}>
                            <Icon size={12} className="me-1" />
                            {badge.label}
                          </span>
                        </td>
                        <td>
                          {isAdmin ? (
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                aria-label="Edit order"
                                onClick={() => startEdit(order)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                aria-label="Delete order"
                                onClick={() => handleDelete(order)}
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
        isOpen={Boolean(deleteTargetOrder)}
        title="Delete Harvest Order"
        message={`Are you sure you want to delete this order for ${
          deleteTargetOrder ? (cropById.get(deleteTargetOrder.cropId)?.name || "crop") : "crop"
        }? Allocated stock will be restored to warehouse balance.`}
        confirmText="Yes, Delete Order"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteOrder}
        onCancel={() => setDeleteTargetOrder(null)}
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
