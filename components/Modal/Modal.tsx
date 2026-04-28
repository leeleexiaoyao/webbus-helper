"use client";

import { useScrollLock } from "@/src/lib/hooks/use-scroll-lock";
import styles from "./Modal.module.css";

interface ModalProps {
  visible: boolean;
  title?: string;
  content: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Modal({
  visible,
  title,
  content,
  confirmText = "确定",
  cancelText = "取消",
  onConfirm,
  onCancel,
}: ModalProps) {
  useScrollLock(visible);

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.content}>{content}</div>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
