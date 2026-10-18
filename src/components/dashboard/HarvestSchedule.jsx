import { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Calendar,
  Sparkles,
  Search,
} from "lucide-react";

// Crop emoji helper
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

// Split date into Month, Day, and Year
function parseDateParts(dateString) {
  if (!dateString) return { month: "—", day: "—", year: "—" };
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { month: "—", day: "—", year: "—" };
  }
  const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  const day = date.getDate();
  const year = date.getFullYear();
  return { month, day, year };
}

// Human readable relative countdown (e.g. "Today", "Tomorrow", "In 5 days", "3 days overdue")
function getRelativeTime(dateString, todayString) {
  if (!dateString) return "";
  const d1 = new Date(`${todayString}T00:00:00`).getTime();
  const d2 = new Date(`${dateString}T00:00:00`).getTime();
  const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)}d overdue`;
}

function getScheduleConfig(crop, todayString) {
  if (crop.status === "ready") {
    return {
      status: "Ready",
      badgeClass: "timeline-badge--ready",
      cardBorder: "timeline-card--ready",
      calendarHeader: "cal-head--ready",
      Icon: CheckCircle2,
    };
  }
  if (crop.cuttingDate && crop.cuttingDate < todayString) {
    return {
      status: "Overdue",
      badgeClass: "timeline-badge--overdue",
      cardBorder: "timeline-card--overdue",
      calendarHeader: "cal-head--overdue",
      Icon: AlertCircle,
    };
  }
  return {
    status: "Upcoming",
    badgeClass: "timeline-badge--upcoming",
    cardBorder: "timeline-card--upcoming",
    calendarHeader: "cal-head--upcoming",
    Icon: Clock3,
  };
}

export default function HarvestSchedule({ crops = [] }) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const schedule = useMemo(() => {
    return crops
      .filter(
        (crop) =>
          ["growing", "ready"].includes(crop.status) &&
          crop.cuttingDate
      )
      .sort((a, b) => a.cuttingDate.localeCompare(b.cuttingDate));
  }, [crops]);

  const filteredSchedule = useMemo(() => {
    return schedule.filter((crop) => {
      if (filter !== "all") {
        const config = getScheduleConfig(crop, todayString);
        if (config.status.toLowerCase() !== filter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (crop.name || "").toLowerCase().includes(q);
        const matchesField = (crop.field || "").toLowerCase().includes(q);
        if (!matchesName && !matchesField) return false;
      }
      return true;
    });
  }, [schedule, filter, todayString, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return schedule.reduce(
      (acc, crop) => {
        const config = getScheduleConfig(crop, todayString);
        if (config.status === "Ready") acc.ready += 1;
        else if (config.status === "Overdue") acc.overdue += 1;
        else acc.upcoming += 1;
        return acc;
      },
      { ready: 0, overdue: 0, upcoming: 0 }
    );
  }, [schedule, todayString]);

  return (
    <section className="analytics-card harvest-timeline-panel">
      {/* Header */}
      <div className="analytics-card-header mb-3">
        <div>
          <p className="analytics-eyebrow">FARM OPERATIONS</p>
          <h3 style={{ margin: "0 !important", fontSize: "18px !important", fontWeight: 750 }}>
            Harvest Schedule
          </h3>
          <p className="harvest-chart-description">
            Upcoming cutting timeline & maturity tracking
          </p>
        </div>

        <span className="analytics-header-icon">
          <CalendarDays size={21} aria-hidden="true" />
        </span>
      </div>

      {/* Filter Tabs & Search */}
      {schedule.length > 0 && (
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="timeline-filter-tabs m-0">
            <button
              type="button"
              className={`timeline-tab-btn ${filter === "all" ? "is-active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({schedule.length})
            </button>
            <button
              type="button"
              className={`timeline-tab-btn tab--ready ${filter === "ready" ? "is-active" : ""}`}
              onClick={() => setFilter("ready")}
            >
              Ready ({counts.ready})
            </button>
            <button
              type="button"
              className={`timeline-tab-btn tab--upcoming ${filter === "upcoming" ? "is-active" : ""}`}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming ({counts.upcoming})
            </button>
            {counts.overdue > 0 && (
              <button
                type="button"
                className={`timeline-tab-btn tab--overdue ${filter === "overdue" ? "is-active" : ""}`}
                onClick={() => setFilter("overdue")}
              >
                Overdue ({counts.overdue})
              </button>
            )}
          </div>

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
      )}

      {/* Body List */}
      {filteredSchedule.length === 0 ? (
        <div className="dashboard-empty-state py-4">
          <Calendar size={26} className="text-muted mb-2" />
          <p>No scheduled harvests.</p>
          <span>Add a cutting date to an active crop to see it here.</span>
        </div>
      ) : (
        <div className="harvest-timeline-list">
          {filteredSchedule.map((crop) => {
            const config = getScheduleConfig(crop, todayString);
            const { month, day, year } = parseDateParts(crop.cuttingDate);
            const countdown = getRelativeTime(crop.cuttingDate, todayString);
            const emoji = getCropEmoji(crop.name);
            const { Icon } = config;

            return (
              <article
                className={`timeline-card ${config.cardBorder}`}
                key={crop.id}
              >
                {/* 1. Left Calendar Date Badge */}
                <div className="calendar-badge">
                  <div className={`cal-month ${config.calendarHeader}`}>{month}</div>
                  <div className="cal-day">{day}</div>
                  <div className="cal-year">{year}</div>
                </div>

                {/* 2. Center Details */}
                <div className="timeline-details">
                  <div className="d-flex align-items-center gap-2">
                    <span className="timeline-crop-emoji">{emoji}</span>
                    <h4 className="timeline-crop-title">{crop.name}</h4>
                  </div>

                  <div className="timeline-meta-row">
                    <span className="timeline-meta-item">
                      <MapPin size={12} className="me-1 opacity-75" />
                      {crop.field || "Unassigned"}
                    </span>
                    {crop.expectedQuantityKg && (
                      <span className="timeline-meta-item">
                        <Sparkles size={11} className="me-1 opacity-75" />
                        Est. {Number(crop.expectedQuantityKg).toLocaleString()} kg
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Right Status & Countdown */}
                <div className="timeline-status-col">
                  <span className={`timeline-status-badge ${config.badgeClass}`}>
                    <Icon size={12} className="me-1" />
                    {config.status}
                  </span>
                  {countdown && (
                    <span className="timeline-countdown">
                      <Clock size={11} className="me-1 opacity-75" />
                      {countdown}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
