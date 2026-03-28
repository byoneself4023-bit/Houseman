import { useState, useEffect, useCallback } from "react";

type ToastType = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _showToast: (message: string, type?: ToastType, duration?: number) => void = () => {};

export function useToast() {
  return { showToast: _showToast };
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  useEffect(() => { _showToast = addToast; }, [addToast]);

  if (toasts.length === 0) return null;

  const bgColors: Record<ToastType, string> = { success: "#ECFDF5", error: "#FEF2F2", warning: "#FFFBEB" };
  const fgColors: Record<ToastType, string> = { success: "#065F46", error: "#991B1B", warning: "#92400E" };
  const bdColors: Record<ToastType, string> = { success: "#A7F3D0", error: "#FECACA", warning: "#FDE68A" };
  const icons: Record<ToastType, string> = { success: "\u2713 ", error: "\u2715 ", warning: "\u26A0 " };

  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 99999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit",
          background: bgColors[t.type],
          color: fgColors[t.type],
          border: `1px solid ${bdColors[t.type]}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          animation: "fadeIn 0.2s ease",
        }}>
          {icons[t.type]}{t.message}
        </div>
      ))}
    </div>
  );
}
