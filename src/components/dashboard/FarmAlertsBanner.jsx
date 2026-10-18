import { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function FarmAlertsBanner({ alerts = [] }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!alerts.length || dismissed) return null;

  const topAlert = alerts[0];
  const remainingCount = alerts.length - 1;

  const getAlertIcon = (type) => {
    if (type === "danger") return <AlertOctagon size={18} className="text-danger flex-shrink-0" />;
    if (type === "warning") return <AlertTriangle size={18} className="text-warning flex-shrink-0" />;
    return <Info size={18} className="text-info flex-shrink-0" />;
  };

  return (
    <div className={`farm-alert-container alert-type--${topAlert.type} mb-4 shadow-sm`}>
      <div className="d-flex align-items-center justify-content-between p-3 gap-3">
        <div className="d-flex align-items-center gap-2 min-w-0">
          {getAlertIcon(topAlert.type)}
          <div className="min-w-0">
            <span className="alert-category-tag">{topAlert.category}</span>
            <strong className="alert-lead-title">{topAlert.title}</strong>
            <span className="alert-desc-inline d-none d-md-inline ms-2 text-muted small">
              {topAlert.message}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {remainingCount > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-light border px-2 py-1 fw-semibold small"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? "Collapse" : `+${remainingCount} More Alert${remainingCount > 1 ? "s" : ""}`}
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle p-1 border text-muted"
            aria-label="Dismiss alert banner"
            onClick={() => setDismissed(true)}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Expanded list of all alerts */}
      {expanded && remainingCount > 0 && (
        <div className="farm-alert-expanded-list px-3 pb-3 border-top pt-2">
          {alerts.slice(1).map((alert) => (
            <div className="alert-sub-row py-2 d-flex align-items-start gap-2" key={alert.id}>
              {getAlertIcon(alert.type)}
              <div>
                <span className="badge bg-light text-dark border me-1 small">{alert.category}</span>
                <strong className="small text-dark me-2">{alert.title}:</strong>
                <span className="small text-muted">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
