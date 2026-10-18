import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Activity,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";
import { useTheme } from "../../context/ThemeContext";

// Custom Tooltip for Donut Chart
function DonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="premium-chart-tooltip">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: data.color,
              display: "inline-block",
            }}
          />
          <strong className="tooltip-title m-0">{data.name}</strong>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Crops Count:</span>
          <strong>{data.count} crops</strong>
        </div>
        <div className="tooltip-row">
          <span className="tooltip-label">Farm Share:</span>
          <strong>{data.percentage}%</strong>
        </div>
        {data.cropsList && data.cropsList.length > 0 && (
          <div className="tooltip-footer mt-2 pt-1 border-top">
            <span className="text-muted d-block small" style={{ fontSize: "10.5px" }}>
              Crops: {data.cropsList.join(", ")}
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Bar Chart
function BarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    const tier = score >= 80 ? "Healthy (Optimal)" : score >= 60 ? "Monitor" : "Critical Attention";
    const tierColor = score >= 80 ? "#2e7d32" : score >= 60 ? "#f57f17" : "#c62828";

    return (
      <div className="premium-chart-tooltip">
        <div className="tooltip-title">{label}</div>
        <div className="tooltip-row">
          <span className="tooltip-label">Health Score:</span>
          <strong>{score}%</strong>
        </div>
        <div className="tooltip-footer mt-1 pt-1 border-top">
          <span style={{ color: tierColor, fontWeight: 700 }}>{tier}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function CropHealthDistributionChart({ crops = [] }) {
  const [chartType, setChartType] = useState("donut"); // "donut" | "bars"
  const [selectedTier, setSelectedTier] = useState("all"); // "all" | "healthy" | "monitor" | "attention"

  // Process crops and tiers
  const { tiers, averageScore, perCropData, counts, scoutList } = useMemo(() => {
    if (!crops.length) {
      return {
        tiers: [],
        averageScore: 0,
        perCropData: [],
        counts: { healthy: 0, monitor: 0, attention: 0, total: 0 },
        scoutList: [],
      };
    }

    let healthyCrops = [];
    let monitorCrops = [];
    let attentionCrops = [];
    let totalScore = 0;

    const perCrop = crops.map((crop) => {
      const score = Math.max(0, Math.min(100, Number(crop.healthScore) || 0));
      totalScore += score;

      let tier = "healthy";
      let actionNote = "Optimal canopy vigor & leaf chlorophyll";
      let color = "#2e7d32";

      if (score >= 80) {
        tier = "healthy";
        healthyCrops.push(crop.name);
      } else if (score >= 60) {
        tier = "monitor";
        color = "#f57f17";
        actionNote = "Moderate canopy — foliar nutrient booster advised";
        monitorCrops.push(crop.name);
      } else {
        tier = "attention";
        color = "#c62828";
        actionNote = "Critical vigor stress — inspect root health & moisture";
        attentionCrops.push(crop.name);
      }

      return {
        id: crop.id,
        name: crop.name,
        score,
        field: crop.field || "General Plot",
        tier,
        color,
        actionNote,
      };
    });

    const total = crops.length;
    const avg = Math.round(totalScore / total);

    // Sort: attention first (<60), then monitor (60-79), then healthy (>=80)
    const sortedScoutList = [...perCrop].sort((a, b) => a.score - b.score);

    const distribution = [
      {
        name: "Healthy (80-100%)",
        tier: "Healthy",
        count: healthyCrops.length,
        percentage: Math.round((healthyCrops.length / total) * 100),
        color: "#2e7d32",
        cropsList: healthyCrops,
      },
      {
        name: "Monitor (60-79%)",
        tier: "Monitor",
        count: monitorCrops.length,
        percentage: Math.round((monitorCrops.length / total) * 100),
        color: "#f57f17",
        cropsList: monitorCrops,
      },
      {
        name: "Attention (<60%)",
        tier: "Attention",
        count: attentionCrops.length,
        percentage: Math.round((attentionCrops.length / total) * 100),
        color: "#c62828",
        cropsList: attentionCrops,
      },
    ].filter((item) => item.count > 0);

    return {
      tiers: distribution,
      averageScore: avg,
      perCropData: perCrop,
      counts: {
        healthy: healthyCrops.length,
        monitor: monitorCrops.length,
        attention: attentionCrops.length,
        total,
      },
      scoutList: sortedScoutList,
    };
  }, [crops]);

  const displayedScoutCrops = useMemo(() => {
    if (selectedTier === "all") {
      return scoutList;
    }
    return scoutList.filter((c) => c.tier === selectedTier);
  }, [scoutList, selectedTier]);

  const animatedAvgScore = useCountUp(averageScore, 800);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const avgColor = isDark
    ? averageScore >= 80 ? "#52c486" : averageScore >= 60 ? "#fbbf24" : "#f87171"
    : averageScore >= 80 ? "#2e7d32" : averageScore >= 60 ? "#f57f17" : "#c62828";

  return (
    <section className="analytics-card health-dist-card h-100 d-flex flex-column justify-content-between">
      <div>
        {/* Header with Title and Mode Switcher */}
        <div className="analytics-card-header mb-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <p className="analytics-eyebrow mb-0">HEALTH VIGOR ANALYTICS</p>
              <span className="badge bg-success-subtle text-success border border-success-subtle py-0 px-2" style={{ fontSize: "10px" }}>
                Active Telemetry
              </span>
            </div>
            <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
              Crop Health Distribution
            </h3>
            <p className="harvest-chart-description">
              Canopy vigor & biological safety tiers across farm crops
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* View Mode Toggle: Donut vs Bars */}
            <div className="btn-group p-1 bg-light rounded-3" role="group">
              <button
                type="button"
                className={`btn btn-sm ${chartType === "donut" ? "btn-white shadow-sm fw-bold text-success" : "btn-light text-muted"}`}
                onClick={() => setChartType("donut")}
                title="Tiers Distribution Donut"
              >
                <PieIcon size={14} className="me-1" />
                <span className="d-none d-sm-inline">Tiers</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${chartType === "bars" ? "btn-white shadow-sm fw-bold text-success" : "btn-light text-muted"}`}
                onClick={() => setChartType("bars")}
                title="Per-Crop Health Rating Bars"
              >
                <BarChart3 size={14} className="me-1" />
                <span className="d-none d-sm-inline">Scores</span>
              </button>
            </div>

            <span className="analytics-header-icon d-none d-md-grid">
              <HeartPulse size={20} aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Empty State */}
        {crops.length === 0 ? (
          <div className="dashboard-empty-state py-5 text-center">
            <Activity size={32} className="text-muted mb-2 opacity-50" />
            <p className="fw-bold mb-1">No crop health data available</p>
            <span className="text-muted small">Register crops to generate health distribution analytics.</span>
          </div>
        ) : (
          <>
            {/* Main Chart Area */}
            <div className="position-relative" style={{ height: 175 }}>
              {chartType === "donut" ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tiers}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        paddingAngle={5}
                        cornerRadius={6}
                      >
                        {tiers.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? "#141c16" : "#ffffff"} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Centered Average Health Index in Donut Hole */}
                  <div
                    className="position-absolute d-flex flex-column align-items-center justify-content-center pointer-events-none"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "24px",
                        fontWeight: 800,
                        color: avgColor,
                        lineHeight: 1,
                        letterSpacing: "-1px",
                      }}
                    >
                      {animatedAvgScore}%
                    </span>
                    <span className="text-muted text-uppercase" style={{ fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.5px" }}>
                      Avg Index
                    </span>
                  </div>
                </>
              ) : (
                /* Bar Chart for Individual Crop Scores */
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={perCropData}
                    margin={{ top: 10, right: 8, left: -24, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1ec" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#68756C", fontSize: 10 }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: "#68756C", fontSize: 10 }}
                      unit="%"
                    />
                    <Tooltip content={<BarTooltip />} />
                    {/* Safe threshold lines */}
                    <ReferenceLine y={80} stroke="#2e7d32" strokeDasharray="3 3" />
                    <ReferenceLine y={60} stroke="#f57f17" strokeDasharray="3 3" />
                    <Bar
                      dataKey="score"
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    >
                      {perCropData.map((entry, idx) => (
                        <Cell key={`bar-${idx}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 3-Tier Summary Metric Boxes (Interactive Filters) */}
            <div className="row g-2 mt-2">
              {/* Healthy Box */}
              <div className="col-4">
                <div
                  className={`health-tier-box box--healthy is-clickable ${selectedTier === "healthy" ? "is-active" : ""}`}
                  onClick={() => setSelectedTier((prev) => (prev === "healthy" ? "all" : "healthy"))}
                  title="Click to filter healthy crops"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTier((prev) => (prev === "healthy" ? "all" : "healthy"));
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-1 mb-1 justify-content-center">
                    <CheckCircle2 size={13} className="text-success" />
                    <span className="health-tier-title">Healthy</span>
                  </div>
                  <h4 className="health-tier-val text-success">
                    {counts.healthy} <span className="health-tier-unit">crops</span>
                  </h4>
                  <span className="health-tier-sub">
                    {counts.total > 0 ? Math.round((counts.healthy / counts.total) * 100) : 0}% of farm
                  </span>
                </div>
              </div>

              {/* Monitor Box */}
              <div className="col-4">
                <div
                  className={`health-tier-box box--monitor is-clickable ${selectedTier === "monitor" ? "is-active" : ""}`}
                  onClick={() => setSelectedTier((prev) => (prev === "monitor" ? "all" : "monitor"))}
                  title="Click to filter monitor crops"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTier((prev) => (prev === "monitor" ? "all" : "monitor"));
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-1 mb-1 justify-content-center">
                    <AlertTriangle size={13} className="text-warning" />
                    <span className="health-tier-title">Monitor</span>
                  </div>
                  <h4 className="health-tier-val text-warning">
                    {counts.monitor} <span className="health-tier-unit">crops</span>
                  </h4>
                  <span className="health-tier-sub">
                    {counts.total > 0 ? Math.round((counts.monitor / counts.total) * 100) : 0}% of farm
                  </span>
                </div>
              </div>

              {/* Attention Box */}
              <div className="col-4">
                <div
                  className={`health-tier-box box--attention is-clickable ${selectedTier === "attention" ? "is-active" : ""}`}
                  onClick={() => setSelectedTier((prev) => (prev === "attention" ? "all" : "attention"))}
                  title="Click to filter attention crops"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTier((prev) => (prev === "attention" ? "all" : "attention"));
                    }
                  }}
                >
                  <div className="d-flex align-items-center gap-1 mb-1 justify-content-center">
                    <AlertOctagon size={13} className="text-danger" />
                    <span className="health-tier-title">Attention</span>
                  </div>
                  <h4 className="health-tier-val text-danger">
                    {counts.attention} <span className="health-tier-unit">crops</span>
                  </h4>
                  <span className="health-tier-sub">
                    {counts.total > 0 ? Math.round((counts.attention / counts.total) * 100) : 0}% of farm
                  </span>
                </div>
              </div>
            </div>

            {/* Field Scout Priority Watchlist Panel (Fills previously blank area) */}
            <div className="crop-scout-panel mt-3">
              <div className="crop-scout-header">
                <span className="crop-scout-title">
                  <Eye size={13} />
                  {selectedTier === "all"
                    ? "Field Scout Priority Watchlist"
                    : `${selectedTier.toUpperCase()} CROPS INSPECTION`}
                </span>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-light text-secondary border py-1 px-2" style={{ fontSize: "10px" }}>
                    {displayedScoutCrops.length} {displayedScoutCrops.length === 1 ? "crop" : "crops"}
                  </span>
                  {selectedTier !== "all" && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-muted d-inline-flex align-items-center gap-1 text-decoration-none"
                      style={{ fontSize: "10.5px" }}
                      onClick={() => setSelectedTier("all")}
                      title="Reset filter"
                    >
                      <RotateCcw size={11} /> Reset
                    </button>
                  )}
                </div>
              </div>

              {displayedScoutCrops.length === 0 ? (
                <div className="scout-optimal-card">
                  <ShieldCheck size={24} className="text-success mb-1" />
                  <p className="fw-bold text-success mb-0 small">No crops in this category</p>
                  <span className="text-muted" style={{ fontSize: "11px" }}>
                    All crops within safe agricultural tolerances.
                  </span>
                </div>
              ) : (
                <div className="crop-scout-list">
                  {displayedScoutCrops.slice(0, 3).map((crop) => (
                    <div
                      key={crop.id}
                      className={`scout-crop-row scout-crop-row--${crop.tier}`}
                    >
                      <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
                        <div
                          className="rounded-circle d-grid place-items-center flex-shrink-0"
                          style={{
                            width: 30,
                            height: 30,
                            backgroundColor: `${crop.color}15`,
                            color: crop.color,
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          {crop.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="d-flex align-items-center gap-1">
                            <strong className="scout-crop-name text-truncate">{crop.name}</strong>
                            <span className="scout-crop-field">• {crop.field}</span>
                          </div>
                          <div className="scout-crop-action text-truncate">
                            {crop.actionNote}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex flex-column align-items-end flex-shrink-0">
                        <span
                          className="scout-score-pill"
                          style={{
                            backgroundColor: `${crop.color}18`,
                            color: crop.color,
                          }}
                        >
                          {crop.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Card Footer with Live Agronomic Assessment */}
      <div className="pt-2 mt-3 border-top d-flex justify-content-between align-items-center">
        <span className="small text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "11px" }}>
          {counts.attention > 0 ? (
            <span className="text-danger fw-semibold d-inline-flex align-items-center gap-1">
              <ShieldAlert size={13} /> {counts.attention} crop(s) require biological inspection
            </span>
          ) : (
            <span className="text-success fw-semibold d-inline-flex align-items-center gap-1">
              <ShieldCheck size={13} /> All crops within safe agricultural tolerances
            </span>
          )}
        </span>
        <span className="text-muted small" style={{ fontSize: "11px" }}>
          {counts.total} Registered Fields
        </span>
      </div>
    </section>
  );
}
