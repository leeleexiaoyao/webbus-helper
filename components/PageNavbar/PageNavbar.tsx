"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppShell } from "@/components/app-shell/AppShell";
import styles from "./PageNavbar.module.css";

interface PageNavbarProps {
  title?: string;
  transparent?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageNavbar({
  title,
  transparent = false,
  showBack = true,
  onBack,
}: PageNavbarProps) {
  const router = useRouter();
  const { scrollTop } = useAppShell();
  const [opacity, setOpacity] = useState(transparent ? 0 : 1);

  useEffect(() => {
    if (!transparent) {
      setOpacity(1);
      return;
    }

    const threshold = 60;
    const nextOpacity = Math.min(scrollTop / threshold, 1);
    setOpacity(nextOpacity);
  }, [scrollTop, transparent]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [onBack, router]);

  return (
    <>
      <div className={styles.spacer} />
      <div className={styles.fixed}>
        <div
          className={styles.bg}
          style={{
            background: transparent
              ? `rgba(255, 255, 255, ${0.95 * opacity})`
              : "rgba(255, 255, 255, 0.95)",
          }}
        />
        <div className={styles.content}>
          {showBack && (
            <button className={styles.backBtn} onClick={handleBack} aria-label="返回">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {title && <div className={styles.title}>{title}</div>}
        </div>
      </div>
    </>
  );
}
