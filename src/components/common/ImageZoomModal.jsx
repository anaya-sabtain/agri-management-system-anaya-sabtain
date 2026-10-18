import { useState, useEffect } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  User,
  CreditCard,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function ImageZoomModal({
  isOpen,
  onClose,
  imageData = null, // { url, title, subtitle, meta }
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !imageData) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!imageData.url) return;
    const a = document.createElement("a");
    a.href = imageData.url;
    a.download = `${(imageData.title || "photo").toLowerCase().replace(/\s+/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="image-zoom-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image Zoom Preview"
    >
      <div
        className="image-zoom-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="image-zoom-header">
          <div className="d-flex align-items-center gap-2 min-w-0">
            <span className="image-zoom-avatar-pill">
              <User size={16} />
            </span>
            <div className="min-w-0">
              <h3 className="image-zoom-title text-truncate mb-0">{imageData.title || "Image Preview"}</h3>
              {imageData.subtitle && (
                <span className="image-zoom-subtitle text-muted font-monospace">{imageData.subtitle}</span>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Zoom Controls Toolbar */}
            <div className="image-zoom-toolbar">
              <button
                type="button"
                className="btn-zoom-tool"
                title="Zoom Out"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut size={16} />
              </button>
              <span className="zoom-level-text">{Math.round(scale * 100)}%</span>
              <button
                type="button"
                className="btn-zoom-tool"
                title="Zoom In"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                className="btn-zoom-tool"
                title="Rotate Clockwise"
                onClick={handleRotate}
              >
                <RotateCw size={16} />
              </button>
              <button
                type="button"
                className="btn-zoom-tool"
                title="Reset View"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-zoom-tool text-success"
                title="Download Photo"
                onClick={handleDownload}
              >
                <Download size={16} />
              </button>
            </div>

            <button
              type="button"
              className="btn-close-zoom"
              onClick={onClose}
              aria-label="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image Display Canvas */}
        <div className="image-zoom-stage">
          <div
            className="image-zoom-wrapper"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            {imageData.url ? (
              <img
                src={imageData.url}
                alt={imageData.title || "Zoomed view"}
                className="image-zoom-target"
              />
            ) : (
              <div className="image-zoom-placeholder">
                <User size={64} className="text-secondary opacity-50" />
                <span className="text-muted small mt-2">No photo available</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Metadata */}
        {imageData.meta && (
          <div className="image-zoom-footer">
            <div className="d-flex flex-wrap align-items-center gap-3">
              {imageData.meta.cnic && (
                <div className="d-inline-flex align-items-center gap-1 small text-muted">
                  <CreditCard size={14} className="text-success" />
                  <span>CNIC: <strong>{imageData.meta.cnic}</strong></span>
                </div>
              )}
              {imageData.meta.registered && (
                <div className="d-inline-flex align-items-center gap-1 small text-muted">
                  <Calendar size={14} className="text-primary" />
                  <span>Registered: <strong>{imageData.meta.registered}</strong></span>
                </div>
              )}
              {imageData.meta.orders !== undefined && (
                <div className="d-inline-flex align-items-center gap-1 small text-muted">
                  <Sparkles size={14} className="text-warning" />
                  <span>Total Volume: <strong>{imageData.meta.volume || "0 kg"}</strong> ({imageData.meta.orders} orders)</span>
                </div>
              )}
            </div>
            <span className="text-muted small" style={{ fontSize: "11px" }}>
              Press ESC to exit
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
