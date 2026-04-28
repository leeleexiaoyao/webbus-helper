"use client";

import { useScrollLock } from "@/src/lib/hooks/use-scroll-lock";
import styles from "./ActionSheet.module.css";

interface ActionSheetProps {
  visible: boolean;
  actions: { 
    label: string; 
    color?: string; 
    onClick: () => void; 
    icon?: string;
    description?: string;
    isDanger?: boolean;
  }[];
  cancelText?: string;
  onClose: () => void;
}

export function ActionSheet({
  visible,
  actions,
  cancelText = "取消",
  onClose,
}: ActionSheetProps) {
  useScrollLock(visible);

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.actions}>
          {actions.map((action, index) => (
            <button
              key={index}
              className={`${styles.actionItem} ${action.isDanger ? styles.actionItemDanger : ''}`}
              style={{ color: action.color || (action.isDanger ? "#e53e3e" : "#1f2539") }}
              onClick={() => {
                action.onClick();
                onClose();
              }}
            >
              {action.icon && <img src={action.icon} alt="" className={styles.actionIcon} />}
              <div className={styles.actionContent}>
                <div className={styles.actionLabel}>{action.label}</div>
                {action.description && <div className={styles.actionDesc}>{action.description}</div>}
              </div>
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
