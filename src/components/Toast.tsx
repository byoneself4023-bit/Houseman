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

const bgClasses: Record<ToastType, string> = {
  success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  error: "bg-red-50 text-red-900 border-red-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
};

const icons: Record<ToastType, string> = { success: "\u2713 ", error: "\u2715 ", warning: "\u26A0 " };

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  useEffect(() => { _showToast = addToast; }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-[18px] py-2.5 rounded-lg text-sm font-semibold font-inherit border shadow-[0_4px_12px_rgba(0,0,0,0.1)] animate-[fadeIn_0.2s_ease] ${bgClasses[t.type]}`}
        >
          {icons[t.type]}{t.message}
        </div>
      ))}
    </div>
  );
}
