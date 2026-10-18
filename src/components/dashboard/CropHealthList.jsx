import { useState, useMemo } from "react";
import {
  Sprout,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  MapPin,
  Calendar,
  Filter,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";
import { useTheme } from "../../context/ThemeContext";

// Crop emoji / icon mapping
function getCropIcon(name = "") {
  const lower = name.toLowerCase();
  if (lower.includes("wheat")) return "🌾";
  if (lower.includes("rice")) return "🌾";
  if (lower.includes("corn") || lower.includes("maize")) return "🌽";
  if (lower.includes("cotton")) return "🌿";
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("potato")) return "🥔";
  if (lower.includes("onion")) return "🧅";
  if (lower.includes("cane") || lower.includes("sugarcane")) return "🎋";
  if (lower.includes("mustard")) return "🌼";
  return "🌱";
}

function getHealthConfig(score) {
  if (score >= 80) {
    return {
      status: "Healthy",
      badgeClass: "health-badge--healthy",
      borderClass: "health-card--healthy",
      glowClass: "glow--healthy",
      ringColor: "#2e7d32",
      ringBg: "#e8f5e9",
      Icon: CheckCircle2,
    };
  }
  if (score >= 60) {
    return {
      status: "Monitor",
      badgeClass: "health-badge--monitor",
      borderClass: "health-card--monitor",
      glowClass: "glow--monitor",
      ringColor: "#e65100",
      ringBg: "#fff3e0",
      Icon: AlertTriangle,
    };
  }
  return {
    status: "Attention",
    badgeClass: "health-badge--attention",
    borderClass: "health-card--attention",
    glowClass: "glow--attention",
    ringColor: "#c62828",
    ringBg: "#ffebee",
    Icon: AlertOctagon,
  };
}

// Subcomponent for Animated Ring Gauge and Score Counting
function AnimatedHealthGauge({ score, config, isDark = false }) {
  const animatedScore = useCountUp(score, 900);
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  // Calculate dash offset dynamically based on animatedScore
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={isDark ? "rgba(255, 255, 255, 0.08)" : config.ringBg}
          strokeWidth="4.5"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={config.ringColor}
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 40ms linear" }}
        />
      </svg>
      <span className="gauge-score">{animatedScore}%</span>
    </div>
  );
}

export default function CropHealthList({ crops = [] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default"); // "default" | "critical_first" | "health_desc"
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Summary counts
  const summary = useMemo(() => {
    return crops.reduce(
      (acc, crop) => {
        const score = Number(crop.healthScore) || 0;
        if (score >= 80) acc.healthy += 1;
        else if (score >= 60) acc.monitor += 1;
        else acc.attention += 1;
        return acc;
      },
      { healthy: 0, monitor: 0, attention: 0 }
    );
  }, [crops]);

  // Filtered and sorted crops
  const filteredCrops = useMemo(() => {
    let list = crops.filter((crop) => {
      const score = Number(crop.healthScore) || 0;
      if (activeFilter === "healthy" && score < 80) return false;
      if (activeFilter === "monitor" && (score < 60 || score >= 80)) return false;
      if (activeFilter === "attention" && score >= 60) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (crop.name || "").toLowerCase().includes(q);
        const matchesField = (crop.field || "").toLowerCase().includes(q);
        if (!matchesName && !matchesField) return false;
      }
      return true;
    });

    if (sortBy === "critical_first") {
      list.sort((a, b) => (Number(a.healthScore) || 0) - (Number(b.healthScore) || 0));
    } else if (sortBy === "health_desc") {
      list.sort((a, b) => (Number(b.healthScore) || 0) - (Number(a.healthScore) || 0));
    }

    return list;
  }, [crops, activeFilter, searchQuery, sortBy]);

  return (
    <section className="analytics-card crop-health-panel-v2">
      {/* Header */}
      <div className="analytics-card-header mb-3">
        <div>
          <p className="analytics-eyebrow">FIELD MONITORING</p>
          <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
            Crop Health Radar
          </h3>
          <p className="harvest-chart-description">
            Health metrics & real-time field diagnostics
          </p>
        </div>

        <span className="analytics-header-icon pulse-icon">
          <Sprout size={21} aria-hidden="true" />
        </span>
      </div>

      {/* Filter Tabs, Search & Sort Bar */}
      {crops.length > 0 && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="crop-health-filter-tabs m-0">
            <button
              type="button"
              className={`filter-tab-btn ${activeFilter === "all" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({crops.length})
            </button>

            <button
              type="button"
              className={`filter-tab-btn filter-tab--healthy ${activeFilter === "healthy" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("healthy")}
            >
              <span className="status-bullet bullet--healthy" />
              Healthy ({summary.healthy})
            </button>

            <button
              type="button"
              className={`filter-tab-btn filter-tab--monitor ${activeFilter === "monitor" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("monitor")}
            >
              <span className="status-bullet bullet--monitor" />
              Monitor ({summary.monitor})
            </button>

            <button
              type="button"
              className={`filter-tab-btn filter-tab--attention ${activeFilter === "attention" ? "is-active" : ""}`}
              onClick={() => setActiveFilter("attention")}
            >
              <span className="status-bullet bullet--attention" />
              Attention ({summary.attention})
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Sort Toggle */}
            <button
              type="button"
              className={`btn btn-sm ${sortBy !== "default" ? "btn-success" : "btn-light border"} px-2 py-1 small d-inline-flex align-items-center gap-1`}
              title="Sort crops by health"
              onClick={() =>
                setSortBy((prev) =>
                  prev === "default"
                    ? "critical_first"
                    : prev === "critical_first"
                    ? "health_desc"
                    : "default"
                )
              }
            >
              <ArrowUpDown size={12} />
              <span style={{ fontSize: "11px" }}>
                {sortBy === "critical_first"
                  ? "Attention First"
                  : sortBy === "health_desc"
                  ? "Highest Score"
                  : "Sort"}
              </span>
            </button>

            {/* Quick Search */}
            <div className="input-group input-group-sm" style={{ maxWidth: 170 }}>
              <span className="input-group-text bg-white border-end-0 py-0">
                <Search size={12} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search..."
                style={{ fontSize: "12px", height: "30px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCrops.length === 0 ? (
        <div className="dashboard-empty-state py-4">
          <Filter size={24} className="text-muted mb-2" />
          <p>No crops match this filter.</p>
          <span>Select "All" or add crops to see records.</span>
        </div>
      ) : (
        /* Grid of Visual Cards */
        <div className="crop-health-grid-v2">
          {filteredCrops.map((crop) => {
            const rawScore = Number(crop.healthScore);
            const score = Number.isFinite(rawScore)
              ? Math.min(100, Math.max(0, rawScore))
              : 0;

            const config = getHealthConfig(score);
            const { Icon } = config;
            const emoji = getCropIcon(crop.name);

            return (
              <article
                className={`crop-card-v2 ${config.borderClass}`}
                key={crop.id}
              >
                {/* Top row: Avatar + Name + Badge */}
                <div className="crop-card-header">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <span className="crop-avatar" role="img" aria-label={crop.name}>
                      {emoji}
                    </span>
                    <div className="crop-title-group">
                      <h4 className="crop-title">{crop.name}</h4>
                      <span className="crop-field-name">
                        <MapPin size={11} className="me-1 opacity-75" />
                        {crop.field || "Unassigned"}
                      </span>
                    </div>
                  </div>

                  <span className={`status-badge-v2 ${config.badgeClass}`}>
                    <Icon size={12} className="me-1" />
                    {config.status}
                  </span>
                </div>

                {/* Middle: Animated Gauge + Progress Details */}
                <div className="crop-card-body">
                  <AnimatedHealthGauge score={score} config={config} isDark={isDark} />

                  <div className="crop-card-meta">
                    <div className="meta-row">
                      <span className="meta-label">Harvest Est:</span>
                      <strong className="meta-value">
                        {crop.expectedQuantityKg ? `${crop.expectedQuantityKg} kg` : "—"}
                      </strong>
                    </div>
                    {crop.cuttingDate && (
                      <div className="meta-row">
                        <span className="meta-label">Cutting:</span>
                        <span className="meta-sub">
                          <Calendar size={11} className="me-1 opacity-75" />
                          {crop.cuttingDate}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
