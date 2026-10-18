import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  Droplets,
  Sprout,
  Package,
  Calendar,
} from "lucide-react";

export default function AlertsDrawer({
  isOpen,
  onClose,
  alerts = [],
  onDismissAlert,
  onClearAllAlerts,
}) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "danger" | "warning" | "info"
  const navigate = useNavigate();

  const filteredAlerts = useMemo(() => {
    if (activeTab === "all") return alerts;
    return alerts.filter((a) => a.type === activeTab);
  }, [alerts, activeTab]);

  const counts = useMemo(() => {
    const danger = alerts.filter((a) => a.type === "danger").length;
    const warning = alerts.filter((a) => a.type === "warning").length;
    const info = alerts.filter((a) => a.type === "info" || a.type === "secondary").length;
    return { all: alerts.length, danger, warning, info };
  }, [alerts]);

  if (!isOpen) return null;

  const handleActionClick = (alert) => {
    onClose();
    if (alert.category === "Crop Health") {
      navigate("/crops");
    } else if (alert.category === "Inventory" || alert.category === "Harvest Operations") {
      navigate("/harvest-orders");
    } else if (alert.category === "Atmospheric") {
      navigate("/");
    }
  };

  const getAlertIcon = (category, type) => {
    if (type === "danger") return <AlertOctagon size={18} className="text-danger flex-shrink-0" />;
    if (category === "Atmospheric") return <Droplets size={18} className="text-primary flex-shrink-0" />;
    if (category === "Harvest Operations") return <Calendar size={18} className="text-warning flex-shrink-0" />;
    if (category === "Inventory") return <Package size={18} className="text-warning flex-shrink-0" />;
    return <AlertTriangle size={18} className="text-warning flex-shrink-0" />;
  };

  return (
    <div className="alerts-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Operational Alerts Drawer">
      <aside
        className="alerts-drawer-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="alerts-drawer-header">
          <div className="d-flex align-items-center gap-2">
            <div className="alerts-bell-icon">
              <Bell size={18} />
              {counts.all > 0 && <span className="alerts-count-badge">{counts.all}</span>}
            </div>
            <div>
              <h2 className="alerts-drawer-title mb-0">Farm Alerts & Advisory</h2>
              <span className="text-muted small">Live operational telemetry & health risks</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {alerts.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary p-1 px-2 d-inline-flex align-items-center gap-1"
                style={{ fontSize: "11px" }}
                onClick={onClearAllAlerts}
                title="Dismiss all alerts"
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
            <button
              type="button"
              className="btn-close ms-1"
              aria-label="Close Alerts Drawer"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="alerts-filter-bar">
          <button
            type="button"
            className={`alerts-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All <span className="tab-pill">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`alerts-tab-btn tab-danger ${activeTab === "danger" ? "active" : ""}`}
            onClick={() => setActiveTab("danger")}
          >
            Critical <span className="tab-pill pill-danger">{counts.danger}</span>
          </button>
          <button
            type="button"
            className={`alerts-tab-btn tab-warning ${activeTab === "warning" ? "active" : ""}`}
            onClick={() => setActiveTab("warning")}
          >
            Warnings <span className="tab-pill pill-warning">{counts.warning}</span>
          </button>
          <button
            type="button"
            className={`alerts-tab-btn tab-info ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Advisories <span className="tab-pill pill-info">{counts.info}</span>
          </button>
        </div>

        {/* Alerts List Body */}
        <div className="alerts-drawer-body">
          {filteredAlerts.length === 0 ? (
            <div className="alerts-empty-state text-center py-5">
              <CheckCircle2 size={44} className="text-success mb-3 opacity-75" />
              <h3 className="h6 fw-bold text-dark mb-1">No Active Alerts</h3>
              <p className="text-muted small mb-0 px-4">
                All farm parameters (canopy health, warehouse stock, cutting schedules, atmospheric humidity) are operating within safe agricultural tolerances.
              </p>
            </div>
          ) : (
            <div className="alerts-card-list">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`alert-drawer-card card--${alert.type}`}
                >
                  <div className="d-flex align-items-start gap-2">
                    {getAlertIcon(alert.category, alert.type)}
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <span className={`alert-badge-category badge-category--${alert.type}`}>
                          {alert.category}
                        </span>
                        <button
                          type="button"
                          className="btn-dismiss-single"
                          title="Dismiss this alert"
                          onClick={() => onDismissAlert(alert.id)}
                          aria-label={`Dismiss ${alert.title}`}
                        >
                          <X size={13} />
                        </button>
                      </div>

                      <strong className="alert-card-title d-block">{alert.title}</strong>
                      <p className="alert-card-msg mb-2">{alert.message}</p>

                      <div className="d-flex align-items-center justify-content-between pt-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-action-alert d-inline-flex align-items-center gap-1"
                          onClick={() => handleActionClick(alert)}
                        >
                          Resolve in {alert.category === "Crop Health" ? "Crops" : alert.category === "Atmospheric" ? "Dashboard" : "Orders"}
                          <ArrowRight size={12} />
                        </button>
                        <span className="text-muted" style={{ fontSize: "10px" }}>Active Now</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="alerts-drawer-footer">
          <div className="d-flex align-items-center justify-content-between w-100" style={{ fontSize: "11px" }}>
            <span className="text-muted d-inline-flex align-items-center gap-1">
              <Sparkles size={13} className="text-success" /> Automated agronomic detection
            </span>
            <button
              type="button"
              className="btn btn-sm btn-light border px-3"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
