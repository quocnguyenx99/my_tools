"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number; // ms
};

type ToastContextValue = {
  show: (t: Omit<ToastItem, "id">) => number;
  remove: (id: number) => void;
  success: (title: string, description?: string, duration?: number) => number;
  error: (title: string, description?: string, duration?: number) => number;
  info: (title: string, description?: string, duration?: number) => number;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(1);
  const timers = useRef(new Map<number, number>());

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      window.clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback<ToastContextValue["show"]>((t) => {
    const id = idRef.current++;
    const item: ToastItem = { id, duration: 3800, type: "info", ...t };
    setToasts((prev) => [item, ...prev].slice(0, 6));
    const timeout = window.setTimeout(() => remove(id), item.duration);
    timers.current.set(id, timeout);
    return id;
  }, [remove]);

  const api = useMemo<ToastContextValue>(() => ({
    show,
    remove,
    success: (title, description, duration) => show({ title, description, duration, type: "success" }),
    error: (title, description, duration) => show({ title, description, duration, type: "error" }),
    info: (title, description, duration) => show({ title, description, duration, type: "info" }),
  }), [show, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toaster UI */}
      <div className="toaster" aria-live="polite" aria-atomic>
        <div className="toasts">
          {toasts.map((t) => (
            <ToastCard key={t.id} item={t} onClose={() => remove(t.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const { title, description, type = "info" } = item;
  return (
    <div className={`toast ${type}`} role="status">
      <div className="toast-row">
        <div className="toast-icon" aria-hidden>
          {type === "success" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 7L9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {type === "error" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {type === "info" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="toast-content">
          <div className="toast-title">{title}</div>
          {description && <div className="toast-desc">{description}</div>}
        </div>
        <button className="toast-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
