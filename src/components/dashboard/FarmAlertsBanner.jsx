import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function FarmAlertsBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (!alerts.length) return null;

  if (dismissed) {
    return (
      <div className="d-flex align-items-center justify-content-between p-2 px-3 mb-3 bg-light rounded-pill border small text-muted">
        <span className="d-flex align-items-center gap-2">
          <Info size={14} className="text-secondary" />
          <span>Farm alerts banner hidden for this session. ({alerts.length} active alerts)</span>
        </span>
        <button
          type="button"
          className="btn btn-sm btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1 text-primary fw-semibold"
          onClick={() => setDismissed(false)}
        >
          <RotateCcw size={13} />
          <span>Restore Alerts</span>
        </button>
      </div>
    );
  }

  const topAlert = alerts[0];
  const remainingCount = alerts.length - 1;

  const getAlertConfig = (type) => {
    switch (type) {
      case "danger":
        return {
          icon: <AlertOctagon size={18} className="text-danger flex-shrink-0" />,
          borderColor: "#ef4444",
          badgeBg: "#fee2e2",
          badgeText: "#991b1b",
          bgGradient: "linear-gradient(90deg, #fff5f5 0%, #ffffff 100%)",
        };
      case "warning":
        return {
          icon: <AlertTriangle size={18} className="text-warning flex-shrink-0" />,
          borderColor: "#f59e0b",
          badgeBg: "#fef3c7",
          badgeText: "#92400e",
          bgGradient: "linear-gradient(90deg, #fffbeb 0%, #ffffff 100%)",
        };
      default:
        return {
          icon: <Info size={18} className="text-primary flex-shrink-0" />,
          borderColor: "#3b82f6",
          badgeBg: "#dbeafe",
          badgeText: "#1e40af",
          bgGradient: "linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%)",
        };
    }
  };

  const topConfig = getAlertConfig(topAlert.type);

  const handleActionClick = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("health") || cat.includes("crop")) {
      navigate("/crops");
    } else if (cat.includes("harvest")) {
      navigate("/harvest");
    } else if (cat.includes("inventory") || cat.includes("stock")) {
      navigate("/inputs");
    } else {
      navigate("/crops");
    }
  };

  return (
    <div
      className="card border-0 shadow-sm mb-4 overflow-hidden"
      style={{
        borderRadius: "14px",
        background: topConfig.bgGradient,
        borderLeft: `4px solid ${topConfig.borderColor}`,
        border: "1px solid #f1f5f9",
      }}
    >
      <div className="card-body p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Left: Icon, category, and alert text */}
        <div className="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: 34,
              height: 34,
              backgroundColor: topConfig.badgeBg,
            }}
          >
            {topConfig.icon}
          </div>

          <div className="min-w-0">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span
                className="badge rounded-pill fw-bold text-uppercase"
                style={{
                  fontSize: "10.5px",
                  letterSpacing: "0.04em",
                  backgroundColor: topConfig.badgeBg,
                  color: topConfig.badgeText,
                  padding: "3px 8px",
                }}
              >
                {topAlert.category}
              </span>
              <strong
                className="text-dark"
                style={{ fontSize: "13.5px", letterSpacing: "-0.01em" }}
              >
                {topAlert.title}
              </strong>
            </div>
            <p
              className="text-secondary small mb-0 mt-0.5 text-truncate"
              style={{ fontSize: "12px", maxWidth: "850px" }}
              title={topAlert.message}
            >
              {topAlert.message}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-auto">
          {/* Quick Resolve/Inspect Button */}
          <button
            type="button"
            className="btn btn-sm btn-white bg-white text-dark border shadow-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1.5 fw-semibold"
            style={{ fontSize: "12px" }}
            onClick={() => handleActionClick(topAlert.category)}
            title="Jump to relevant farm operational section"
          >
            <span>Resolve</span>
            <ExternalLink size={12} className="text-secondary" />
          </button>

          {/* Toggle remaining alerts */}
          {remainingCount > 0 && (
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1.5 transition-all ${
                expanded
                  ? "btn-dark text-white shadow-sm"
                  : "btn-outline-secondary bg-white text-dark border"
              }`}
              style={{ fontSize: "12px" }}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <span
                className="badge rounded-circle p-1 bg-danger text-white d-inline-flex align-items-center justify-content-center"
                style={{ width: 16, height: 16, fontSize: "9px" }}
              >
                {remainingCount}
              </span>
              <span>{expanded ? "Collapse" : `+${remainingCount} More Alerts`}</span>
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}

          {/* Dismiss Banner Button */}
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle p-1.5 border text-secondary"
            aria-label="Dismiss alert banner"
            onClick={() => setDismissed(true)}
            title="Dismiss alerts"
            style={{ width: 30, height: 30 }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Expanded Alert Drawer */}
      {expanded && remainingCount > 0 && (
        <div
          className="border-top px-3 py-2"
          style={{ backgroundColor: "#f8fafc" }}
        >
          <div className="d-flex align-items-center justify-content-between py-1 mb-2">
            <span className="text-muted fw-bold small text-uppercase" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>
              Active Operational Warnings &amp; Advisory ({alerts.length})
            </span>
            <span className="text-secondary small" style={{ fontSize: "11.5px" }}>
              Click any item to inspect the affected field
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {alerts.slice(1).map((alert) => {
              const cfg = getAlertConfig(alert.type);
              return (
                <div
                  key={alert.id}
                  className="p-2.5 px-3 rounded-3 bg-white border d-flex flex-wrap align-items-center justify-content-between gap-2 shadow-2xs hover-lift transition-all"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleActionClick(alert.category)}
                >
                  <div className="d-flex align-items-center gap-2.5 min-w-0">
                    {cfg.icon}
                    <div className="min-w-0">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge rounded-pill fw-bold text-uppercase"
                          style={{
                            fontSize: "9.5px",
                            backgroundColor: cfg.badgeBg,
                            color: cfg.badgeText,
                            padding: "2px 6px",
                          }}
                        >
                          {alert.category}
                        </span>
                        <strong className="text-dark small" style={{ fontSize: "12.5px" }}>
                          {alert.title}
                        </strong>
                      </div>
                      <span className="text-muted small text-truncate d-block" style={{ fontSize: "11.5px" }}>
                        {alert.message}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-1 text-primary small fw-semibold flex-shrink-0 ms-auto">
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
