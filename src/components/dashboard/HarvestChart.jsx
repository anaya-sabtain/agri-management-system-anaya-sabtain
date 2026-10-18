import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ChartColumn,
  TrendingUp,
  Scale,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Search,
} from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";

// Custom Tooltip component for Harvest vs Sales
function CustomChartTooltip({ active, payload, label, mode }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const harvested = data.harvested || 0;
    const sold = data.sold || 0;
    const expected = data.expected || 0;
    const remaining = data.remaining || 0;
    const soldRate = harvested > 0 ? Math.round((sold / harvested) * 100) : 0;

    return (
      <div className="premium-chart-tooltip">
        <div className="tooltip-title">{label} ({data.field || "General Field"})</div>

        <div className="tooltip-row">
          <span className="tooltip-dot dot--harvested" />
          <span className="tooltip-label">Harvested:</span>
          <strong>{harvested.toLocaleString()} kg</strong>
        </div>

        {mode !== "target" && (
          <div className="tooltip-row">
            <span
              className="tooltip-dot"
              style={{ backgroundColor: "#1976d2", width: 8, height: 8, borderRadius: "50%", display: "inline-block" }}
            />
            <span className="tooltip-label">Sold / Committed:</span>
            <strong className="text-primary">{sold.toLocaleString()} kg</strong>
          </div>
        )}

        {mode === "target" && expected > 0 && (
          <div className="tooltip-row">
            <span className="tooltip-dot dot--expected" />
            <span className="tooltip-label">Expected Target:</span>
            <span>{expected.toLocaleString()} kg</span>
          </div>
        )}

        <div className="tooltip-footer mt-2 pt-1 border-top d-flex justify-content-between align-items-center">
          <span className="small text-muted">
            {mode === "target" ? "Target Achieved:" : "Sales Fulfillment:"}
          </span>
          <span className={`completion-badge ${soldRate >= 100 ? "badge--done" : ""}`}>
            {mode === "target" && expected > 0
              ? `${Math.round((harvested / expected) * 100)}%`
              : `${soldRate}%`}
          </span>
        </div>

        {mode !== "target" && (
          <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: "11px" }}>
            <span className="text-muted">In Warehouse:</span>
            <strong className={remaining > 0 ? "text-success" : "text-danger"}>
              {remaining.toLocaleString()} kg
            </strong>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function HarvestChart({ crops = [], orders = [] }) {
  const [viewMode, setViewMode] = useState("harvest_vs_sales"); // "harvest_vs_sales" | "harvest_vs_target" | "sales_only" | "harvest_only"
  const [sortBy, setSortBy] = useState("default"); // "default" | "harvest_desc" | "sales_desc"
  const [searchQuery, setSearchQuery] = useState("");

  // Process data for charts
  const rawData = useMemo(() => {
    return crops.map((crop) => {
      const harvested = Math.max(0, Number(crop.harvestedQuantityKg) || 0);
      const expected = Math.max(0, Number(crop.expectedQuantityKg) || 0);

      // Total sold/committed orders for this crop
      const sold = orders
        .filter((o) => o.cropId === crop.id && ["pending", "completed"].includes(o.status))
        .reduce((sum, o) => sum + (Number(o.quantityKg) || 0), 0);

      const remaining = Math.max(0, harvested - sold);
      const soldRate = harvested > 0 ? Math.round((sold / harvested) * 100) : 0;

      return {
        id: crop.id,
        crop: crop.name,
        field: crop.field,
        harvested,
        expected,
        sold,
        remaining,
        soldRate,
      };
    });
  }, [crops, orders]);

  // Filter & Sort
  const chartData = useMemo(() => {
    let list = rawData.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.crop.toLowerCase().includes(q) ||
        (item.field || "").toLowerCase().includes(q)
      );
    });

    if (sortBy === "harvest_desc") {
      list.sort((a, b) => b.harvested - a.harvested);
    } else if (sortBy === "sales_desc") {
      list.sort((a, b) => b.sold - a.sold);
    }

    return list;
  }, [rawData, sortBy, searchQuery]);

  // Aggregate stats
  const totals = useMemo(() => {
    let topSoldCrop = "None";
    let topSoldQuantity = 0;

    const res = rawData.reduce(
      (acc, item) => {
        acc.harvested += item.harvested;
        acc.expected += item.expected;
        acc.sold += item.sold;

        if (item.sold > topSoldQuantity) {
          topSoldQuantity = item.sold;
          topSoldCrop = item.crop;
        }

        return acc;
      },
      { harvested: 0, expected: 0, sold: 0 }
    );

    const overallSoldRate = res.harvested > 0 ? Math.round((res.sold / res.harvested) * 100) : 0;
    const remaining = Math.max(0, res.harvested - res.sold);

    return {
      ...res,
      overallSoldRate,
      topSoldCrop,
      topSoldQuantity,
      remaining,
    };
  }, [rawData]);

  const animatedHarvested = useCountUp(totals.harvested, 800);
  const animatedSold = useCountUp(totals.sold, 800);

  return (
    <section className="analytics-card premium-harvest-card h-100 d-flex flex-column justify-content-between">
      <div>
        {/* Top Header */}
        <div className="harvest-chart-header mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <p className="analytics-eyebrow mb-0">PRODUCTION & REVENUE FULFILLMENT</p>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-0 px-2" style={{ fontSize: "10px" }}>
                Harvest vs Sales
              </span>
            </div>
            <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
              Harvest vs Sales Analytics
            </h3>
            <p className="harvest-chart-description">
              Compare actual crop yield with buyer sales orders and target projections
            </p>
          </div>

          {/* Action Controls */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* View Mode Segmented Controls */}
            <div className="chart-segmented-control">
              <button
                type="button"
                className={`segment-btn ${viewMode === "harvest_vs_sales" ? "is-active" : ""}`}
                onClick={() => setViewMode("harvest_vs_sales")}
              >
                Harvest vs Sales
              </button>
              <button
                type="button"
                className={`segment-btn ${viewMode === "harvest_vs_target" ? "is-active" : ""}`}
                onClick={() => setViewMode("harvest_vs_target")}
              >
                vs Target
              </button>
              <button
                type="button"
                className={`segment-btn ${viewMode === "sales_only" ? "is-active" : ""}`}
                onClick={() => setViewMode("sales_only")}
              >
                Sales Only
              </button>
            </div>

            {/* Sort Dropdown / Toggle */}
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`chart-icon-btn ${sortBy !== "default" ? "is-active" : ""}`}
                title="Sort Crops"
                onClick={() =>
                  setSortBy((prev) =>
                    prev === "default"
                      ? "harvest_desc"
                      : prev === "harvest_desc"
                      ? "sales_desc"
                      : "default"
                  )
                }
              >
                <ArrowUpDown size={13} className="me-1" />
                <span className="small">
                  {sortBy === "harvest_desc"
                    ? "Top Harvest"
                    : sortBy === "sales_desc"
                    ? "Top Sales"
                    : "Sort"}
                </span>
              </button>
            </div>

            {/* Compact Search input in header */}
            {crops.length > 5 && (
              <div className="input-group input-group-sm" style={{ width: 135 }}>
                <span className="input-group-text bg-white border-end-0 py-1 px-2">
                  <Search size={12} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0 py-1"
                  placeholder="Filter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: "11px" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* KPI Highlight Strip */}
        {crops.length > 0 && (
          <div className="chart-kpi-strip mb-3">
            <div className="kpi-mini-card">
              <div className="kpi-mini-icon kpi-mini-icon--green">
                <Scale size={16} />
              </div>
              <div>
                <span className="kpi-mini-label">Total Harvested</span>
                <h4 className="kpi-mini-val">{animatedHarvested.toLocaleString()} kg</h4>
              </div>
            </div>

            <div className="kpi-mini-card">
              <div className="kpi-mini-icon" style={{ backgroundColor: "#e3f2fd", color: "#1976d2" }}>
                <ShoppingBag size={16} />
              </div>
              <div>
                <span className="kpi-mini-label">Total Sold</span>
                <h4 className="kpi-mini-val text-primary">
                  {animatedSold.toLocaleString()} kg{" "}
                  <span className="small fw-semibold text-muted" style={{ fontSize: "11px" }}>
                    ({totals.overallSoldRate}%)
                  </span>
                </h4>
              </div>
            </div>

            <div className="kpi-mini-card">
              <div className="kpi-mini-icon kpi-mini-icon--amber">
                <TrendingUp size={16} />
              </div>
              <div>
                <span className="kpi-mini-label">Top Selling Crop</span>
                <h4 className="kpi-mini-val">
                  {totals.topSoldCrop}{" "}
                  {totals.topSoldQuantity > 0 ? `(${totals.topSoldQuantity.toLocaleString()} kg)` : ""}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart Body */}
        {chartData.length === 0 ? (
          <div className="dashboard-empty-state py-5 text-center">
            <ChartColumn size={36} className="text-muted mb-2" />
            <p className="fw-bold mb-1">No crop records to plot.</p>
            <span className="text-muted small">Record harvested crops and orders to generate live sales charts.</span>
          </div>
        ) : (
          <div
            className="harvest-chart-wrap"
            role="img"
            aria-label="Bar chart comparing harvest and sales quantities across crops"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 12, left: -6, bottom: 6 }}
                barGap={viewMode === "harvest_vs_sales" || viewMode === "harvest_vs_target" ? 4 : 0}
              >
                {/* Soft Gradient Definitions */}
                <defs>
                  <linearGradient id="harvestedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2e7d32" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#52865b" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1976d2" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#42a5f5" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c5dbc5" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#dbe8db" stopOpacity={0.6} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#e8ece6"
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="crop"
                  tick={{ fill: "#4b574f", fontSize: 12, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: "#e3e8e0" }}
                />

                <YAxis
                  width={55}
                  tick={{ fill: "#68756c", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                />

                <Tooltip
                  content={<CustomChartTooltip mode={viewMode === "harvest_vs_target" ? "target" : "sales"} />}
                  cursor={{ fill: "rgba(36, 75, 54, 0.04)" }}
                />

                {/* Actual Harvested Bar */}
                {viewMode !== "sales_only" && (
                  <Bar
                    dataKey="harvested"
                    name="Actual Harvested (kg)"
                    fill="url(#harvestedGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={viewMode === "harvest_only" ? 48 : 34}
                  />
                )}

                {/* Sales / Committed Bar */}
                {(viewMode === "harvest_vs_sales" || viewMode === "sales_only") && (
                  <Bar
                    dataKey="sold"
                    name="Sold / Committed (kg)"
                    fill="url(#salesGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={viewMode === "sales_only" ? 48 : 34}
                  />
                )}

                {/* Expected Target Bar (Optional view) */}
                {viewMode === "harvest_vs_target" && (
                  <Bar
                    dataKey="expected"
                    name="Expected Target (kg)"
                    fill="url(#expectedGradient)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>

            {/* Warehouse Stock & Fulfillment Balance Ribbon (Eliminates bottom dead space) */}
            <div className="d-flex flex-wrap justify-content-between align-items-center px-3 py-2 mt-2 rounded-3 bg-light border" style={{ fontSize: "11px" }}>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle py-1 px-2 fw-bold">
                  {totals.overallSoldRate}% Sales Fulfillment
                </span>
                <span className="text-secondary">
                  Warehouse Stock: <strong className="text-dark">{totals.remaining.toLocaleString()} kg</strong> available
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted">
                  Committed: <strong className="text-primary">{totals.sold.toLocaleString()} kg</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer with legend note */}
      <div className="pt-2 mt-2 border-top d-flex flex-wrap justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3 small">
          <span className="d-inline-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#2e7d32" }} />
            <span className="text-secondary" style={{ fontSize: "11px" }}>Harvested Yield</span>
          </span>
          <span className="d-inline-flex align-items-center gap-1">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1976d2" }} />
            <span className="text-secondary" style={{ fontSize: "11px" }}>Buyer Sales</span>
          </span>
        </div>

        <span className="text-muted" style={{ fontSize: "11px" }}>
          Real-time storage & order sync
        </span>
      </div>
    </section>
  );
}
