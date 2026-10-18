import { useMemo, useState } from "react";
import {
  PackageCheck,
  Warehouse,
  ShoppingBag,
  Wheat,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  LayoutGrid,
  List,
  Download,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  CreditCard,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";
import { exportToCSV } from "../../services/csvExport";

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
  if (lower.includes("beet")) return "🍠";
  return "🌱";
}

function StockKpiCard({ title, value, unit = "kg", note, icon: Icon, variant }) {
  const animatedValue = useCountUp(value, 800);

  return (
    <div className={`stock-kpi-box box--${variant}`}>
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span className="stock-kpi-sub">{title}</span>
        <div className={`stock-kpi-icon-pill icon--${variant}`}>
          <Icon size={16} />
        </div>
      </div>
      <h4 className="stock-kpi-val">
        {animatedValue.toLocaleString()}{" "}
        <span className="stock-kpi-unit">{unit}</span>
      </h4>
      <span className="stock-kpi-note">{note}</span>
    </div>
  );
}

// Mini SVG Circular Gauge for Grid View
function MiniStockGauge({ percentage, size = 64, strokeWidth = 6 }) {
  const animatedPct = useCountUp(percentage, 800);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  const color = percentage >= 100 ? "#c62828" : percentage > 70 ? "#f57f17" : "#2e7d32";

  return (
    <div className="position-relative d-inline-flex align-items-center justify-content-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="stock-ring-svg">
        <circle
          className="stock-ring-circle-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="stock-ring-circle-progress"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="position-absolute text-center">
        <span className="d-block fw-bold" style={{ fontSize: "12px", color: "#24352B", lineHeight: 1 }}>
          {animatedPct}%
        </span>
        <span className="text-muted" style={{ fontSize: "9px" }}>Sold</span>
      </div>
    </div>
  );
}

export default function StockSummaryWidget({ crops = [], orders = [], buyers = [] }) {
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [filterTab, setFilterTab] = useState("all"); // "all" | "in_stock" | "low_stock" | "sold_out"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("remaining"); // "name" | "harvested" | "committed" | "remaining" | "soldPct"
  const [sortDirection, setSortDirection] = useState("desc"); // "asc" | "desc"
  const [inspectCrop, setInspectCrop] = useState(null); // Selected crop object for buyer orders breakdown

  // Buyer Map for easy lookup
  const buyerById = useMemo(
    () => new Map(buyers.map((b) => [b.id, b])),
    [buyers]
  );

  const summary = useMemo(() => {
    let totalHarvested = 0;
    let totalCommitted = 0;

    const breakdown = crops.map((crop) => {
      const harvested = Number(crop.harvestedQuantityKg) || 0;
      totalHarvested += harvested;

      // Committed orders for this crop
      const cropOrders = orders.filter(
        (o) => o.cropId === crop.id && ["pending", "completed"].includes(o.status)
      );

      const committed = cropOrders.reduce(
        (sum, o) => sum + (Number(o.quantityKg) || 0),
        0
      );
      totalCommitted += committed;

      const remaining = Math.max(0, harvested - committed);

      return {
        id: crop.id,
        name: crop.name,
        field: crop.field,
        harvested,
        committed,
        remaining,
        soldPct: harvested > 0 ? Math.min(100, Math.round((committed / harvested) * 100)) : 0,
        orders: cropOrders,
      };
    });

    const totalRemaining = Math.max(0, totalHarvested - totalCommitted);
    const overallSoldPct = totalHarvested > 0
      ? Math.min(100, Math.round((totalCommitted / totalHarvested) * 100))
      : 0;

    return {
      totalHarvested,
      totalCommitted,
      totalRemaining,
      overallSoldPct,
      breakdown,
    };
  }, [crops, orders]);

  // Tab counts
  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let soldOut = 0;

    summary.breakdown.forEach((item) => {
      if (item.harvested > 0) {
        if (item.remaining === 0) soldOut++;
        else if (item.remaining < 200) lowStock++;
        else inStock++;
      }
    });

    return { all: summary.breakdown.length, inStock, lowStock, soldOut };
  }, [summary.breakdown]);

  // Handle Sort column click
  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }

  // Filter & Sort breakdown
  const processedBreakdown = useMemo(() => {
    return summary.breakdown
      .filter((item) => {
        // Tab filter
        if (filterTab === "in_stock" && !(item.remaining >= 200 && item.harvested > 0)) return false;
        if (filterTab === "low_stock" && !(item.remaining > 0 && item.remaining < 200 && item.harvested > 0)) return false;
        if (filterTab === "sold_out" && !(item.remaining === 0 && item.harvested > 0)) return false;

        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = (item.name || "").toLowerCase().includes(query);
          const matchesField = (item.field || "").toLowerCase().includes(query);
          if (!matchesName && !matchesField) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        if (typeof valA === "string") {
          return sortDirection === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        return sortDirection === "asc" ? valA - valB : valB - valA;
      });
  }, [summary.breakdown, filterTab, searchQuery, sortKey, sortDirection]);

  // Export CSV Handler
  function handleExportCSV() {
    const exportData = summary.breakdown.map((item) => ({
      "Crop Name": item.name,
      "Field Assignment": item.field || "General Field",
      "Harvested Yield (kg)": item.harvested,
      "Sold / Committed (kg)": item.committed,
      "Committed Pct (%)": `${item.soldPct}%`,
      "Remaining Stock (kg)": item.remaining,
      "Status": item.remaining === 0 && item.harvested > 0
        ? "Sold Out"
        : item.remaining < 200 && item.harvested > 0
        ? "Low Stock"
        : item.harvested === 0
        ? "Not Harvested"
        : "In Stock",
    }));

    const dateStr = new Date().toISOString().split("T")[0];
    exportToCSV(exportData, `warehouse_inventory_report_${dateStr}.csv`);
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) return <ArrowUpDown size={12} className="text-muted ms-1 opacity-50" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={12} className="text-success ms-1" />
    ) : (
      <ArrowDown size={12} className="text-success ms-1" />
    );
  };

  return (
    <section className="analytics-card stock-summary-card">
      {/* Header with Title and Global Actions */}
      <div className="analytics-card-header mb-3">
        <div>
          <p className="analytics-eyebrow">INVENTORY & SALES FULFILLMENT</p>
          <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
            Harvest, Sales & Stock Balance
          </h3>
          <p className="harvest-chart-description">
            Warehouse stock allocations vs buyer commitments
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Export CSV Button */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 bg-white border shadow-sm px-2 py-1 small fw-semibold"
            title="Download CSV Inventory Report"
            onClick={handleExportCSV}
          >
            <Download size={14} />
            <span className="d-none d-sm-inline">Export Stock</span>
          </button>

          {/* View Mode Switcher */}
          <div className="btn-group p-1 bg-light rounded-3" role="group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "table" ? "btn-white shadow-sm fw-bold text-success" : "btn-light text-muted"}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "grid" ? "btn-white shadow-sm fw-bold text-success" : "btn-light text-muted"}`}
              onClick={() => setViewMode("grid")}
              title="Cards Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          <span className="analytics-header-icon d-none d-md-grid">
            <Warehouse size={20} aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Top 3 Animated KPI Blocks */}
      <div className="row g-2 mb-2">
        <div className="col-12 col-md-4">
          <StockKpiCard
            title="Total Harvested"
            value={summary.totalHarvested}
            unit="kg"
            note="Available yield recorded"
            icon={Wheat}
            variant="harvested"
          />
        </div>

        <div className="col-12 col-md-4">
          <StockKpiCard
            title="Committed / Sold"
            value={summary.totalCommitted}
            unit="kg"
            note={`${summary.overallSoldPct}% of warehouse harvest`}
            icon={ShoppingBag}
            variant="committed"
          />
        </div>

        <div className="col-12 col-md-4">
          <StockKpiCard
            title="Remaining In Stock"
            value={summary.totalRemaining}
            unit="kg"
            note="Available for new buyers"
            icon={Warehouse}
            variant="remaining"
          />
        </div>
      </div>

      {/* Overall Stock Fulfillment Strip & Live Insights */}
      {summary.totalHarvested > 0 && (
        <div className="overall-fulfillment-strip my-3 p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 small fw-bold">
            <span className="text-primary d-inline-flex align-items-center gap-1">
              <ShoppingBag size={14} /> Sold / Committed: {summary.totalCommitted.toLocaleString()} kg ({summary.overallSoldPct}%)
            </span>
            <span className="text-success d-inline-flex align-items-center gap-1">
              <Warehouse size={14} /> Available In Stock: {summary.totalRemaining.toLocaleString()} kg ({100 - summary.overallSoldPct}%)
            </span>
          </div>

          <div className="progress" style={{ height: 8, borderRadius: 6, background: "#e2e7e3" }}>
            <div
              className="progress-bar bg-primary"
              role="progressbar"
              style={{ width: `${summary.overallSoldPct}%`, transition: "width 0.8s ease" }}
              aria-valuenow={summary.overallSoldPct}
              aria-valuemin="0"
              aria-valuemax="100"
            />
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${100 - summary.overallSoldPct}%`, transition: "width 0.8s ease" }}
            />
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2 mt-2 pt-1 small text-muted">
            <span className="badge bg-white text-dark border">
              🌱 {counts.inStock} Crops Ready
            </span>
            {counts.lowStock > 0 && (
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                ⚠️ {counts.lowStock} Low Stock (&lt;200 kg)
              </span>
            )}
            {counts.soldOut > 0 && (
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                🔴 {counts.soldOut} Depleted / Sold Out
              </span>
            )}
            <span className="ms-auto small text-secondary">
              Warehouse fulfillment health is balanced at {summary.overallSoldPct}% turnover.
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Quick Search Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 mt-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className={`stock-filter-chip ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All Crops ({counts.all})
          </button>
          <button
            type="button"
            className={`stock-filter-chip ${filterTab === "in_stock" ? "active" : ""}`}
            onClick={() => setFilterTab("in_stock")}
          >
            In Stock ({counts.inStock})
          </button>
          <button
            type="button"
            className={`stock-filter-chip ${filterTab === "low_stock" ? "active" : ""}`}
            onClick={() => setFilterTab("low_stock")}
          >
            Low Stock ({counts.lowStock})
          </button>
          <button
            type="button"
            className={`stock-filter-chip ${filterTab === "sold_out" ? "active" : ""}`}
            onClick={() => setFilterTab("sold_out")}
          >
            Sold Out ({counts.soldOut})
          </button>
        </div>

        <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
          <span className="input-group-text bg-white border-end-0">
            <Search size={14} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search crop or field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content: Table or Grid View */}
      {summary.breakdown.length === 0 ? (
        <div className="dashboard-empty-state py-4 text-center">
          <PackageCheck size={28} className="text-muted mb-2" />
          <p className="fw-bold mb-1">No inventory records.</p>
          <span className="text-muted small">Record harvested crops to track warehouse stock balance.</span>
        </div>
      ) : processedBreakdown.length === 0 ? (
        <div className="py-4 text-center text-muted small border rounded-3 bg-light">
          No crops match the selected filter or search.
        </div>
      ) : viewMode === "table" ? (
        /* ================== TABLE VIEW ================== */
        <div className="table-responsive stock-table-wrap">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th
                  className="stock-table-th-sortable"
                  style={{ width: "23%" }}
                  onClick={() => handleSort("name")}
                  title="Click to sort by Crop"
                >
                  <span className="d-inline-flex align-items-center">
                    Crop & Field {renderSortIcon("name")}
                  </span>
                </th>
                <th
                  className="stock-table-th-sortable"
                  style={{ width: "15%" }}
                  onClick={() => handleSort("harvested")}
                  title="Click to sort by Harvested"
                >
                  <span className="d-inline-flex align-items-center">
                    Harvested {renderSortIcon("harvested")}
                  </span>
                </th>
                <th
                  className="stock-table-th-sortable"
                  style={{ width: "22%" }}
                  onClick={() => handleSort("soldPct")}
                  title="Click to sort by Sold %"
                >
                  <span className="d-inline-flex align-items-center">
                    Sold / Committed {renderSortIcon("soldPct")}
                  </span>
                </th>
                <th
                  className="stock-table-th-sortable"
                  style={{ width: "16%" }}
                  onClick={() => handleSort("remaining")}
                  title="Click to sort by In Stock"
                >
                  <span className="d-inline-flex align-items-center">
                    In Stock {renderSortIcon("remaining")}
                  </span>
                </th>
                <th style={{ width: "14%" }}>Inventory Status</th>
                <th style={{ width: "10%" }} className="text-end">Orders</th>
              </tr>
            </thead>
            <tbody>
              {processedBreakdown.map((item) => (
                <tr key={item.id}>
                  {/* Crop & Field with Emoji Avatar */}
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="crop-avatar-circle">
                        <span>{getCropEmoji(item.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <strong className="text-dark d-block text-truncate">{item.name}</strong>
                        <span className="crop-field-badge">{item.field || "General Field"}</span>
                      </div>
                    </div>
                  </td>

                  {/* Harvested */}
                  <td>
                    <span className="fw-bold text-dark">{item.harvested.toLocaleString()}</span>
                    <span className="text-muted small ms-1">kg</span>
                  </td>

                  {/* Sold / Committed with Mini Progress Bar */}
                  <td>
                    <div className="d-flex justify-content-between align-items-center small mb-1">
                      <span className="text-primary fw-bold">
                        {item.committed.toLocaleString()} kg
                      </span>
                      <span className="text-muted small">({item.soldPct}%)</span>
                    </div>
                    <div className="progress" style={{ height: 5, borderRadius: 3, background: "#eef2ef" }}>
                      <div
                        className={`progress-bar ${
                          item.soldPct >= 100
                            ? "bg-danger"
                            : item.soldPct > 70
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        role="progressbar"
                        style={{ width: `${item.soldPct}%`, transition: "width 0.6s ease" }}
                      />
                    </div>
                  </td>

                  {/* In Stock (Warehouse) */}
                  <td>
                    <span
                      className={`fw-bold d-inline-flex align-items-center gap-1 ${
                        item.remaining === 0 && item.harvested > 0
                          ? "text-danger"
                          : item.remaining < 200 && item.harvested > 0
                          ? "text-warning-emphasis"
                          : "text-success"
                      }`}
                    >
                      {item.remaining.toLocaleString()} kg
                    </span>
                  </td>

                  {/* Inventory Status Badges */}
                  <td>
                    {item.remaining === 0 && item.harvested > 0 ? (
                      <span className="badge-inventory badge-inventory--soldout">
                        <XCircle size={13} /> Sold Out
                      </span>
                    ) : item.remaining < 200 && item.harvested > 0 ? (
                      <span className="badge-inventory badge-inventory--lowstock">
                        <AlertTriangle size={13} /> Low Stock
                      </span>
                    ) : item.harvested === 0 ? (
                      <span className="badge-inventory badge-inventory--unharvested">
                        <Clock size={13} /> Not Harvested
                      </span>
                    ) : (
                      <span className="badge-inventory badge-inventory--instock">
                        <CheckCircle2 size={13} /> In Stock
                      </span>
                    )}
                  </td>

                  {/* Orders Inspection Action */}
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-light border p-1 px-2 text-secondary d-inline-flex align-items-center gap-1"
                      title={`View buyer orders for ${item.name}`}
                      onClick={() => setInspectCrop(item)}
                    >
                      <Eye size={13} />
                      <span className="small">{item.orders.length}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================== GRID CARDS VIEW ================== */
        <div className="row g-3">
          {processedBreakdown.map((item) => {
            const statusClass =
              item.remaining === 0 && item.harvested > 0
                ? "card--soldout"
                : item.remaining < 200 && item.harvested > 0
                ? "card--lowstock"
                : "card--instock";

            return (
              <div className="col-12 col-md-6 col-xl-4" key={item.id}>
                <div className={`stock-grid-card ${statusClass}`}>
                  {/* Top: Avatar, Name & Status */}
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2 min-w-0">
                      <div className="crop-avatar-circle">
                        <span>{getCropEmoji(item.name)}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="h6 mb-0 fw-bold text-dark text-truncate">{item.name}</h4>
                        <span className="crop-field-badge">{item.field || "General Field"}</span>
                      </div>
                    </div>

                    <div>
                      {item.remaining === 0 && item.harvested > 0 ? (
                        <span className="badge-inventory badge-inventory--soldout">Sold Out</span>
                      ) : item.remaining < 200 && item.harvested > 0 ? (
                        <span className="badge-inventory badge-inventory--lowstock">Low Stock</span>
                      ) : item.harvested === 0 ? (
                        <span className="badge-inventory badge-inventory--unharvested">Unharvested</span>
                      ) : (
                        <span className="badge-inventory badge-inventory--instock">In Stock</span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Gauge & Fulfillment Visual */}
                  <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border">
                    <MiniStockGauge percentage={item.soldPct} />
                    <div className="text-end">
                      <span className="d-block small text-muted">Stock Allocated</span>
                      <strong className="text-primary fs-6">{item.committed.toLocaleString()} kg</strong>
                      <span className="d-block text-secondary small">of {item.harvested.toLocaleString()} kg total</span>
                    </div>
                  </div>

                  {/* Bottom: 3-column mini stats */}
                  <div className="stock-grid-stats-grid">
                    <div>
                      <span className="stock-grid-stat-label">Harvested</span>
                      <span className="stock-grid-stat-val text-dark">{item.harvested.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="stock-grid-stat-label">Committed</span>
                      <span className="stock-grid-stat-val text-primary">{item.committed.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="stock-grid-stat-label">In Stock</span>
                      <span className={`stock-grid-stat-val ${item.remaining === 0 ? "text-danger" : "text-success"}`}>
                        {item.remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Action */}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1 py-1"
                    onClick={() => setInspectCrop(item)}
                  >
                    <Eye size={14} />
                    <span>View Buyer Orders ({item.orders.length})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================== CROP ORDERS INSPECTION MODAL ================== */}
      {inspectCrop && (
        <div
          className="modal-backdrop-custom d-flex align-items-center justify-content-center p-3"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 1080,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectCrop(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="card border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: 560, width: "100%", animation: "modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Modal Header */}
            <div className="card-header bg-white border-bottom p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <span className="crop-avatar-circle" style={{ width: 34, height: 34, fontSize: 16 }}>
                  {getCropEmoji(inspectCrop.name)}
                </span>
                <div>
                  <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: "16px" }}>
                    Buyer Orders for {inspectCrop.name}
                  </h5>
                  <span className="text-muted small">{inspectCrop.field || "General Field"}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-1 text-muted"
                aria-label="Close"
                onClick={() => setInspectCrop(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="card-body p-3 p-md-4">
              {/* Mini Stock Summary Strip */}
              <div className="row g-2 mb-3 text-center">
                <div className="col-4">
                  <div className="p-2 rounded bg-light border">
                    <span className="d-block small text-muted">Harvested</span>
                    <strong className="text-dark">{inspectCrop.harvested.toLocaleString()} kg</strong>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded bg-primary-subtle border border-primary-subtle">
                    <span className="d-block small text-primary">Committed</span>
                    <strong className="text-primary">{inspectCrop.committed.toLocaleString()} kg</strong>
                  </div>
                </div>
                <div className="col-4">
                  <div className="p-2 rounded bg-success-subtle border border-success-subtle">
                    <span className="d-block small text-success">Warehouse Balance</span>
                    <strong className="text-success">{inspectCrop.remaining.toLocaleString()} kg</strong>
                  </div>
                </div>
              </div>

              {/* Order List */}
              <h6 className="fw-bold mb-2 small text-uppercase text-secondary" style={{ letterSpacing: "0.5px" }}>
                Committed Buyer Allocations ({inspectCrop.orders.length})
              </h6>

              {inspectCrop.orders.length === 0 ? (
                <div className="text-center py-4 bg-light rounded-3 border">
                  <ShoppingBag size={28} className="text-muted mb-2 opacity-50" />
                  <p className="small fw-semibold mb-0 text-muted">No orders placed for this crop yet.</p>
                  <span className="small text-secondary">All {inspectCrop.remaining.toLocaleString()} kg is available in warehouse stock.</span>
                </div>
              ) : (
                <div className="table-responsive border rounded-3" style={{ maxHeight: 220, overflowY: "auto" }}>
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Buyer</th>
                        <th>Quantity</th>
                        <th>Order Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspectCrop.orders.map((order) => {
                        const buyer = buyerById.get(order.buyerId);
                        return (
                          <tr key={order.id}>
                            <td>
                              <strong className="text-dark d-block">
                                {buyer?.fullName || "Registered Buyer"}
                              </strong>
                              <span className="font-monospace text-muted" style={{ fontSize: "11px" }}>
                                {buyer?.cnic || "—"}
                              </span>
                            </td>
                            <td>
                              <strong className="text-primary">
                                {Number(order.quantityKg).toLocaleString()} kg
                              </strong>
                            </td>
                            <td>
                              <span className="text-muted">
                                {order.saleDate || "—"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  order.status === "completed"
                                    ? "bg-success-subtle text-success border border-success-subtle"
                                    : "bg-warning-subtle text-warning border border-warning-subtle"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="d-flex justify-content-end mt-3 pt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary px-3"
                  onClick={() => setInspectCrop(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
