"use client";

import Image from "next/image";
import styles from "./SeatGrid.module.css";

/* ========== 类型定义 ========== */

export interface SeatOccupantView {
  userId: string;
  nickname: string;
  avatarUrl: string;
  initial: string;
  role: "admin" | "member";
  isSelf: boolean;
}

export interface SeatCellView {
  code: string;
  label: string;
  isEmpty: boolean;
  isMine: boolean;
  isAdmin: boolean;
  className: string;
  showMineBadge: boolean;
  showAdminBadge: boolean;
  occupant: SeatOccupantView | null;
}

export interface SeatRowView {
  rowNumber: number;
  slots: Array<SeatCellView | null>;
}

export interface SeatGridProps {
  seatRows: SeatRowView[];
  onSeatTap: (seatCode: string) => void;
}

/* ========== 组件 ========== */

export function SeatGrid({ seatRows, onSeatTap }: SeatGridProps) {
  // 确保 seatRows 是一个数组
  const safeSeatRows = Array.isArray(seatRows) ? seatRows : [];
  return (
    <div className={styles.seatGrid}>
      <div className={styles.seatGridFrame}>
        {/* 过道虚线 */}
        <div className={styles.aisleOverlay}>
          <div
            className={`${styles.aisleLine} ${styles.aisleLineLeft}`}
          />
          <div
            className={`${styles.aisleLine} ${styles.aisleLineRight}`}
          />
        </div>

        {/* 座位行 */}
        <div className={styles.seatRows}>
          {safeSeatRows.map((row) => (
            <div key={row.rowNumber} className={styles.seatRow}>
              <div className={styles.rowSlots}>
                {(row.slots || []).map((slot, slotIndex) => {
                  /* 过道列 */
                  if (slot === null) {
                    return (
                      <div key={slotIndex} className={styles.aisle}>
                        <span className={styles.aisleLabel}>
                          {row.rowNumber < 10
                            ? `0${row.rowNumber}`
                            : row.rowNumber}
                        </span>
                      </div>
                    );
                  }

                  /* 座位 */
                  const stateClass = slot.isMine
                    ? styles.isMine
                    : slot.isAdmin
                    ? styles.isAdmin
                    : !slot.isEmpty
                    ? styles.isOccupied
                    : "";

                  return (
                    <div
                      key={slot.code}
                      className={`${styles.seatCard} ${stateClass}`}
                      onClick={() => onSeatTap(slot.code)}
                    >
                      {/* 座位图标 */}
                      {slot.isEmpty ? (
                        <Image
                          className={styles.seatShellImage}
                          src="/assets/icons/icon_homepage_空座位.svg"
                          alt="空座位"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      ) : slot.isMine || slot.isAdmin ? (
                        <Image
                          className={styles.seatShellImage}
                          src="/assets/icons/icon_homepage_我的座位.svg"
                          alt="我的座位"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <Image
                          className={styles.seatShellImage}
                          src="/assets/icons/icon_homepage_已入座.svg"
                          alt="已入座"
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      )}

                      {/* 非空座位徽章 */}
                      {!slot.isEmpty && (
                        <>
                          {slot.showMineBadge || slot.showAdminBadge ? (
                            <div className={styles.seatBadge}>
                              {slot.showAdminBadge ? "管" : "我"}
                            </div>
                          ) : (
                            <div className={styles.seatAvatarBadge}>
                              {slot.occupant?.avatarUrl ? (
                                <Image
                                  className={styles.seatAvatar}
                                  src={slot.occupant.avatarUrl}
                                  alt={slot.occupant.nickname}
                                  width={20}
                                  height={20}
                                />
                              ) : (
                                <div className={styles.seatAvatarFallback}>
                                  {slot.occupant?.initial || ""}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* 座位编号 */}
                      <span className={styles.seatCode}>{slot.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
