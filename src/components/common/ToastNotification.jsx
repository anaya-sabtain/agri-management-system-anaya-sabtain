import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function ToastNotification({
  message,
  type = "success", // "success" | "error" | "info"
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={18} className="text-success flex-shrink-0" />,
      bg: "bg-white",
      border: "border-success-subtle",
      text: "text-dark",
      shadow: "shadow-lg",
    },
    error: {
      icon: <AlertCircle size={18} className="text-danger flex-shrink-0" />,
      bg: "bg-white",
      border: "border-danger-subtle",
      text: "text-dark",
      shadow: "shadow-lg",
    },
    info: {
      icon: <Info size={18} className="text-primary flex-shrink-0" />,
      bg: "bg-white",
      border: "border-primary-subtle",
      text: "text-dark",
      shadow: "shadow-lg",
    },
  }[type] || {
    icon: <Info size={18} className="text-primary flex-shrink-0" />,
    bg: "bg-white",
    border: "border-secondary-subtle",
    text: "text-dark",
    shadow: "shadow-lg",
  };

  return (
    <aside
      className={`floating-toast-container d-flex align-items-center gap-2 p-3 rounded-3 border ${config.bg} ${config.border} ${config.shadow}`}
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 1090,
        maxWidth: 380,
        animation: "toastSlideIn 0.25s ease-out",
      }}
      role="status"
      aria-live="polite"
    >
      {config.icon}
      <span className={`small fw-semibold flex-grow-1 ${config.text}`}>
        {message}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-light rounded-circle p-1 text-muted"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <X size={14} />
      </button>
    </aside>
  );
}
