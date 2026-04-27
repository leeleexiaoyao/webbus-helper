"use client";

import { useEffect } from "react";
import styles from "./ActionSheet.module.css";

interface ActionSheetProps {
  visible: boolean;
  actions: { label: string; color?: string; onClick: () => void }[];
  cancelText?: string;
  description?: string;
  onClose: () => void;
}

export function ActionSheet({
  visible,
  actions,
  cancelText = "取消",
  description,
  onClose,
}: ActionSheetProps) {
  useEffect(() => {
    if (visible) {
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
    }
    return () => document.body.classList.remove("scroll-locked");
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {description && <div className={styles.description}>{description}</div>}
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={index}
              className={styles.actionItem}
              style={{ color: action.color || "#1f2539" }}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
        <button className={styles.cancelBtn} onClick={onClose}>
          {cancelText}
        </button>
      </div>
    </div>
  );
}
