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
      className="fixed inset-0 z-[9999] bg-black/45 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-[#FAFBFF] rounded-xl p-6 max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.2)] border-2 border-hm-blue relative"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <div className="text-base font-bold text-hm-text">
                {title}
              </div>
            )}
            {onClose && (
              <div
                onClick={onClose}
                className="cursor-pointer text-lg text-hm-text-muted px-2 py-1 ml-auto hover:text-hm-text transition-colors"
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
