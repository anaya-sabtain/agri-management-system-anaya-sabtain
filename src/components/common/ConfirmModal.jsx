import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onCancel?.();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
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
        if (e.target === e.currentTarget) onCancel?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{ maxWidth: 440, width: "100%", animation: "modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="card-body p-4">
          <div className="d-flex align-items-start gap-3 mb-3">
            <div
              className={`p-2 rounded-3 flex-shrink-0 ${
                isDanger ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning"
              }`}
            >
              {isDanger ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div className="min-w-0 flex-grow-1">
              <h5 className="fw-bold mb-1 text-dark" style={{ fontSize: "17px" }}>
                {title}
              </h5>
              <p className="text-secondary small mb-0">{message}</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle p-1 text-muted flex-shrink-0"
              aria-label="Close"
              onClick={onCancel}
            >
              <X size={16} />
            </button>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
            <button
              type="button"
              className="btn btn-light px-3 py-2 fw-semibold text-secondary"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${isDanger ? "btn-danger" : "btn-warning"} px-4 py-2 fw-semibold shadow-sm`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
