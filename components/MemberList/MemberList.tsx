"use client";

import Image from "next/image";
import styles from "./MemberList.module.css";

/* ========== 类型定义 ========== */

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

export interface MemberListProps {
  members: MemberView[];
  onMemberTap: (userId: string) => void;
}

/* ========== 组件 ========== */

export function MemberList({ members, onMemberTap }: MemberListProps) {
  return (
    <div className={styles.memberList}>
      {members.map((member) => (
        <div
          key={member.userId}
          className={styles.memberItem}
          onClick={() => onMemberTap(member.userId)}
        >
          {/* 头像 */}
          {member.avatarUrl ? (
            <Image
              className={styles.memberAvatar}
              src={member.avatarUrl}
              alt={member.nickname}
              width={36}
              height={36}
            />
          ) : (
            <div className={styles.memberAvatarFallback}>
              {member.initial || ""}
            </div>
          )}

          {/* 主要信息 */}
          <div className={styles.memberMain}>
            <div className={styles.memberTitleRow}>
              <span className={styles.memberName}>{member.nickname}</span>
              {member.isSelf && (
                <span className={styles.memberRoleBadge}>我</span>
              )}
              {member.isAdmin && !member.isSelf && (
                <span className={styles.memberRoleBadge}>管</span>
              )}
            </div>

            {/* 标签（最多2个） */}
            {member.tagViews.length > 0 && (
              <div className={styles.tagList}>
                {member.tagViews.slice(0, 2).map((tag) => (
                  <span
                    key={tag.label}
                    className={styles.memberTagChip}
                    style={tag.style}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 座位号 */}
          <span className={styles.memberSeat}>{member.seatLabel}</span>
        </div>
      ))}
    </div>
  );
}
