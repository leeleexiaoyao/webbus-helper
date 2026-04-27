"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import styles from "./Toast.module.css";

interface ToastItem {
  id: number;
  title: string;
  icon: "none" | "success";
}

interface ToastContextValue {
  showToast: (title: string, icon?: "none" | "success") => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = useCallback((title: string, icon: "none" | "success" = "none") => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, title, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.icon]}`}>
            {toast.icon === "success" && <span className={styles.checkIcon}>&#10003;</span>}
            <span className={styles.text}>{toast.title}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
