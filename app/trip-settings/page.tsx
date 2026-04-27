"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { Modal } from "@/components/Modal/Modal";
import { useTrip } from "@/src/lib/hooks/use-trip";
import styles from "./page.module.css";

export default function TripSettingsPage() {
  const router = useRouter();
  const { data, loading } = useTrip();
  const [showDissolveModal, setShowDissolveModal] = useState(false);
  const [copied, setCopied] = useState(false);

  /* 加载态 */
  if (loading) {
    return (
      <div className={styles.page}>
        <PageNavbar title="车次设置" />
        <div className={styles.loadingWrap}>
          <span style={{ color: "#b6bac1", fontSize: 13 }}>加载中...</span>
        </div>
      </div>
    );
  }

  const tripMeta = data?.currentTrip?.tripMeta;

  /* 无车次数据 */
  if (!tripMeta) {
    return (
      <div className={styles.page}>
        <PageNavbar title="车次设置" />
        <div className={styles.loadingWrap}>
          <span style={{ color: "#b6bac1", fontSize: 13 }}>暂无车次信息</span>
        </div>
      </div>
    );
  }

  /* 复制口令 */
  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tripMeta.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = tripMeta.password;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* 解散车次 */
  const handleDissolve = async () => {
    setShowDissolveModal(false);
    try {
      const { api } = await import("@/src/lib/api-client");
      await api.post(`/api/members/${tripMeta.tripId}/dissolve`, {});
      router.push("/");
    } catch (err) {
      console.error("解散车次失败:", err);
    }
  };

  return (
    <div className={styles.page}>
      <PageNavbar title="车次设置" />

      <div className={styles.settingsContent}>
        {/* 行程名称 */}
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>行程名称</div>
          <div className={styles.settingValue}>{tripMeta.tripName}</div>
        </div>

        {/* 出发时间 */}
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>出发时间</div>
          <div className={`${styles.settingValue} ${styles.settingValueMuted}`}>
            {tripMeta.departureTime}
          </div>
        </div>

        {/* 车次口令 */}
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>车次口令</div>
          <div className={styles.passwordControl}>
            <span className={styles.passwordText}>{tripMeta.password}</span>
            <button className={styles.copyButton} onClick={handleCopyPassword}>
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#21c980" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b3b7bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 座位模板 */}
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>座位模板</div>
          <div className={styles.settingValue}>{tripMeta.templateLabel}</div>
        </div>

        {/* 解散车次按钮 */}
        {tripMeta.isAdmin && (
          <button
            className={styles.dissolveBtn}
            onClick={() => setShowDissolveModal(true)}
          >
            解散车次
          </button>
        )}
      </div>

      {/* 解散确认弹窗 */}
      <Modal
        visible={showDissolveModal}
        title="解散车次"
        content="确定要解散当前车次吗？解散后所有数据将被清除，此操作不可撤销。"
        confirmText="确定"
        cancelText="取消"
        onConfirm={handleDissolve}
        onCancel={() => setShowDissolveModal(false)}
      />
    </div>
  );
}
