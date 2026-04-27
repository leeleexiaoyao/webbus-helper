"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { Modal } from "@/components/Modal/Modal";
import { useTrip } from "@/src/lib/hooks/use-trip";
import styles from "./page.module.css";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data, loading } = useTrip();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const tripMeta = data?.currentTrip?.tripMeta;
  const isAdmin = tripMeta?.isAdmin ?? false;

  /* 操作按钮配置 */
  const actionLabel = isAdmin ? "解散车次" : "退出车次";
  const modalTitle = isAdmin ? "解散车次" : "退出车次";
  const modalContent = isAdmin
    ? "确定要解散当前车次吗？解散后所有数据将被清除，此操作不可撤销。"
    : "确定要退出当前车次吗？退出后需要重新加入。";

  /* 执行操作 */
  const handleAction = async () => {
    setShowConfirmModal(false);
    if (!tripMeta) return;

    try {
      const { api } = await import("@/src/lib/api-client");
      if (isAdmin) {
        await api.post(`/api/members/${tripMeta.tripId}/dissolve`, {});
      } else {
        await api.post(`/api/members/${tripMeta.tripId}/leave`, {});
      }
      router.push("/");
    } catch (err) {
      console.error("操作失败:", err);
    }
  };

  return (
    <div className={styles.page}>
      <PageNavbar title="设置" />

      <div className={styles.content}>
        {/* 关于小程序卡片 */}
        <div className={styles.aboutCard}>
          <div className={styles.pageTitle}>关于小程序</div>
          <div className={styles.pageCopy}>
            巴士认座助手用于在出发前快速确认车次、座位和成员信息，降低上车前后的沟通成本。
          </div>
          <div className={styles.pageCopy}>
            当前版本支持授权登录、创建或加入车次、认座换座、成员资料、趣味工具和管理员清座等流程。
          </div>
        </div>

        {/* 操作按钮 */}
        {tripMeta && (
          <div className={styles.actionCard}>
            <button
              className={`${isAdmin ? styles.dangerBtn : styles.secondaryBtn} ${styles.tripAction}`}
              onClick={() => setShowConfirmModal(true)}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>

      {/* 确认弹窗 */}
      <Modal
        visible={showConfirmModal}
        title={modalTitle}
        content={modalContent}
        confirmText="确定"
        cancelText="取消"
        onConfirm={handleAction}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
