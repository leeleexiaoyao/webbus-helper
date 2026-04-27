"use client";

import { useEffect } from "react";
import Image from "next/image";
import styles from "./SeatSheet.module.css";

/* ========== 类型定义 ========== */

export interface SeatOccupantView {
  userId: string;
  nickname: string;
  avatarUrl: string;
  initial: string;
  role: "admin" | "member";
  isSelf: boolean;
}

export interface MemberView {
  userId: string;
  nickname: string;
  avatarUrl: string;
  initial: string;
  bio: string;
  livingCity: string;
  hometown: string;
  tags: string[];
  tagViews: Array<{
    label: string;
    style: React.CSSProperties;
  }>;
  role: "admin" | "member";
  isAdmin: boolean;
  seatCode: string | null;
  seatLabel: string;
  isSelf: boolean;
  isFavoritedByViewer: boolean;
  isMutualFavoriteWithViewer: boolean;
}

export type SeatSheetMode =
  | "empty-confirm"
  | "self-detail"
  | "member-detail"
  | "admin-member-detail";

export interface SeatSheetProps {
  visible: boolean;
  mode: SeatSheetMode;
  seatCode: string;
  occupant: SeatOccupantView | null;
  member: MemberView | null;
  onConfirm: () => void;
  onRelease: () => void;
  onToggleFavorite: () => void;
  onClose: () => void;
}

/* ========== 组件 ========== */

export function SeatSheet({
  visible,
  mode,
  seatCode,
  occupant,
  member,
  onConfirm,
  onRelease,
  onToggleFavorite,
  onClose,
}: SeatSheetProps) {
  /* 滚动锁定 */
  useEffect(() => {
    if (visible) {
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
    }
    return () => document.body.classList.remove("scroll-locked");
  }, [visible]);

  if (!visible) return null;

  const isEmptyConfirm = mode === "empty-confirm";
  const isSelfDetail = mode === "self-detail";
  const isMemberDetail = mode === "member-detail";
  const isAdminMemberDetail = mode === "admin-member-detail";
  const showDetailCard = !isEmptyConfirm;

  /* 标记按钮文案 */
  const favoriteButtonText = member?.isFavoritedByViewer
    ? "取消标记"
    : "标记";

  return (
    <div
      className={`${styles.sheetMask} ${visible ? styles.isActive : ""}`}
      onClick={onClose}
    >
      <div
        className={`${styles.sheetPanel} ${
          showDetailCard ? styles.sheetPanelDetail : ""
        }`}
        style={{
          borderRadius: 16,
          overflow: "hidden",
          background: "#ffffff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 拖拽手柄 */}
        {!showDetailCard && <div className={styles.sheetHandle} />}

        {/* ========== 空座位确认模式 ========== */}
        {isEmptyConfirm && (
          <>
            <div
              className={`${styles.sheetTitle} ${styles.sheetTitleCompact}`}
            >
              是否入座{seatCode}？
            </div>
            <div className={styles.sheetActionsRow}>
              <button
                className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnCancel}`}
                onClick={onClose}
              >
                取消
              </button>
              <button
                className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnPrimary}`}
                onClick={onConfirm}
              >
                入座
              </button>
            </div>
          </>
        )}

        {/* ========== 详情模式 ========== */}
        {!isEmptyConfirm && member && (
          <>
            <div className={styles.detailShell}>
              {/* Hero 区域 */}
              <div className={styles.detailHero}>
                <div className={styles.detailHeroContent}>
                  {/* 头像 */}
                  <div className={styles.detailUserHead}>
                    {member.avatarUrl ? (
                      <Image
                        className={styles.detailAvatar}
                        src={member.avatarUrl}
                        alt={member.nickname}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className={styles.detailAvatarFallback}>
                        {member.initial || ""}
                      </div>
                    )}
                  </div>

                  <div className={styles.detailMain}>
                    {/* 昵称 + 座位号 */}
                    <div className={styles.detailTitleRow}>
                      <span className={styles.detailName}>
                        {member.nickname}
                      </span>
                      <span className={styles.detailSeat}>
                        {member.seatLabel}
                      </span>
                    </div>

                    {/* 角色标签 */}
                    <div className={styles.detailLine}>
                      {member.isSelf && (
                        <span className={styles.miniTag}>我</span>
                      )}
                      {member.isAdmin && !member.isSelf && (
                        <span
                          className={`${styles.miniTag} ${styles.miniTagAdmin}`}
                        >
                          管理
                        </span>
                      )}
                      {member.isMutualFavoriteWithViewer && (
                        <span
                          className={`${styles.miniTag} ${styles.miniTagMutual}`}
                        >
                          互相标记
                        </span>
                      )}
                    </div>

                    {/* 简介 */}
                    {member.bio && (
                      <div className={styles.detailBio}>{member.bio}</div>
                    )}

                    {/* 标签列表 */}
                    {member.tagViews.length > 0 && (
                      <div
                        className={`${styles.detailTags}`}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          marginTop: 7,
                        }}
                      >
                        {member.tagViews.map((tag) => (
                          <span
                            key={tag.label}
                            className={styles.detailTagChip}
                            style={tag.style}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 位置统计 */}
              <div className={styles.detailStats}>
                <div className={styles.detailStatItem}>
                  <div className={styles.detailStatValue}>
                    {member.livingCity || "未填写"}
                  </div>
                  <div className={styles.detailStatLabel}>居住</div>
                </div>
                <div className={styles.detailStatItem}>
                  <div className={styles.detailStatValue}>
                    {member.hometown || "未填写"}
                  </div>
                  <div className={styles.detailStatLabel}>来自</div>
                </div>
                <div className={`${styles.detailStatItem} ${styles.detailStatItemAge}`}>
                  <div className={styles.detailStatValue}>
                    {member.tags.length > 0 ? member.tags[0] : "未填写"}
                  </div>
                  <div className={styles.detailStatLabel}>年龄</div>
                </div>
              </div>
            </div>

            {/* ========== 操作按钮 ========== */}

            {/* 成员详情模式 */}
            {isMemberDetail && (
              <div className={styles.sheetActionsRow}>
                <button
                  className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnPrimary} ${styles.sheetFooterBtnStrong}`}
                  onClick={onToggleFavorite}
                >
                  {favoriteButtonText}
                </button>
                <button
                  className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnCancel} ${styles.sheetFooterBtnStrong}`}
                  onClick={onClose}
                >
                  好的
                </button>
              </div>
            )}

            {/* 管理员查看成员详情 */}
            {isAdminMemberDetail && (
              <>
                <div className={styles.sheetActionsRow}>
                  <button
                    className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnPrimary} ${styles.sheetFooterBtnStrong}`}
                    onClick={onToggleFavorite}
                  >
                    {favoriteButtonText}
                  </button>
                  <button
                    className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnCancel} ${styles.sheetFooterBtnStrong}`}
                    onClick={onClose}
                  >
                    好的
                  </button>
                </div>
                <div className={styles.sheetActionsRow}>
                  <button
                    className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnDanger} ${styles.sheetFooterBtnFull}`}
                    onClick={onRelease}
                  >
                    解除他的座位
                  </button>
                </div>
              </>
            )}

            {/* 查看自己详情 */}
            {isSelfDetail && (
              <div className={styles.sheetActionsRow}>
                <button
                  className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnCancel}`}
                  onClick={onClose}
                >
                  取消
                </button>
                <button
                  className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnDanger}`}
                  onClick={onRelease}
                >
                  解除座位
                </button>
              </div>
            )}

            {/* 默认关闭按钮 */}
            {!isMemberDetail && !isAdminMemberDetail && !isSelfDetail && (
              <button
                className={`${styles.sheetFooterBtn} ${styles.sheetFooterBtnCancel} ${styles.detailCloseBtn}`}
                onClick={onClose}
              >
                好的
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
