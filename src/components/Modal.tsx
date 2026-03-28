import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 480 }) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FAFBFF",
          borderRadius: 16,
          padding: 24,
          width,
          maxWidth: "95vw",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          border: "2px solid #3B82F6",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            {title && (
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1D23" }}>
                {title}
              </div>
            )}
            {onClose && (
              <div
                onClick={onClose}
                style={{
                  cursor: "pointer",
                  fontSize: 18,
                  color: "#8F95A3",
                  padding: "4px 8px",
                  marginLeft: "auto",
                }}
              >
                {"\u2715"}
              </div>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
