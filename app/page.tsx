"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTrip } from "@/src/lib/hooks/use-trip";
import { useAuth } from "@/src/lib/hooks/use-auth";
import { SeatGrid } from "@/components/SeatGrid/SeatGrid";
import { MemberList } from "@/components/MemberList/MemberList";
import { SeatSheet } from "@/components/SeatSheet/SeatSheet";
import styles from "./page.module.css";

/* ========== 类型定义 ========== */

type SheetMode = "empty-confirm" | "self-detail" | "member-detail" | "admin-member-detail";

interface SeatOccupantView {
  userId: string;
  nickname: string;
  avatarUrl: string;
  initial: string;
  role: "admin" | "member";
  isSelf: boolean;
}

interface SeatCellView {
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

export default function HomePage() {
  const router = useRouter();
  const { data, loading, claimSeat, switchSeat, releaseMySeat, adminReleaseSeat, toggleFavoriteMember } = useTrip();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"seats" | "members">("seats");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("member-detail");
  const [selectedSeat, setSelectedSeat] = useState<SeatCellView | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberView | null>(null);

  const homeMode = data?.homeMode ?? "landing";
  const trip = data?.currentTrip ?? null;
  const currentUser = data?.currentUser ?? null;
  const seatedMembers = trip?.members.filter((member: MemberView) => Boolean(member.seatCode)) || [];

  /* 座位显示文本 */
  const viewerSeatText = useMemo(() => {
    if (!trip?.tripMeta.viewerSeatCode) return "请选择您的座位";
    return trip.tripMeta.viewerSeatLabel || trip.tripMeta.viewerSeatCode;
  }, [trip]);

  /* 已入座统计 */
  const seatedStat = useMemo(() => {
    if (!trip) return "0 / 0";
    return `${trip.tripMeta.seatedCount} / ${trip.tripMeta.seatCount}`;
  }, [trip]);

  /* ---------- 加载态 ---------- */
  if (loading) {
    return (
      <div className={styles.homePage}>
        <div className={styles.bgHero} />
        <div className={styles.loadingWrap}>
          <span style={{ color: "#b6bac1", fontSize: 13 }}>加载中...</span>
        </div>
      </div>
    );
  }

  /* ---------- 未登录 ---------- */
  if (!user) {
    return (
      <div className={styles.homePage}>
        <div className={styles.bgHero} />
        <div className={styles.loginGuide}>
          <div className={styles.loginTitle}>登录后使用</div>
          <div className={styles.loginCopy}>登录后即可创建或加入车次</div>
          <button
            className={styles.loginBtn}
            onClick={() => router.push("/login")}
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  /* ---------- 无车次（landing） ---------- */
  if (homeMode === "landing") {
    return (
      <div className={styles.homePage}>
        <div className={styles.bgHero} />
        <div className={styles.entryCard}>
          <div className={styles.entryTitle}>请先创建或加入车次</div>
          <div className={styles.entryCopy}>完成授权后即可使用</div>
          <div className={styles.entryActions}>
            <button
              className={styles.entryPrimaryBtn}
              onClick={() => router.push("/create-trip")}
            >
              创建车次
            </button>
            <button
              className={styles.entrySecondaryBtn}
              onClick={() => router.push("/join-trip")}
            >
              加入车次
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 有车次（trip） ---------- */
  const tripName = trip?.tripMeta.tripName ?? "";
  const departureTime = trip?.tripMeta.departureTime ?? "";
  const seatRows = trip?.seatRows ?? [];

  /* 处理座位点击 */
  const handleSeatTap = (seatCode: string) => {
    const seat = seatRows.flatMap(row => row.slots).find((slot: any) => slot?.code === seatCode) || null;
    if (!seat) return;

    if (seat.isEmpty) {
      setSheetVisible(true);
      setSheetMode("empty-confirm");
      setSelectedSeat(seat);
      setSelectedMember(null);
      return;
    }

    const targetMember = trip?.members.find((member: MemberView) => member.userId === seat.occupant?.userId) ?? null;

    if (seat.isMine) {
      setSheetVisible(true);
      setSheetMode("self-detail");
      setSelectedSeat(seat);
      setSelectedMember(targetMember || trip?.members.find((member: MemberView) => member.isSelf) || null);
      return;
    }

    const mode = trip?.tripMeta.viewerRole === "admin" ? "admin-member-detail" : "member-detail";
    setSheetVisible(true);
    setSheetMode(mode);
    setSelectedSeat(seat);
    setSelectedMember(targetMember);
  };

  /* 处理成员点击 */
  const handleMemberTap = (userId: string) => {
    const member = trip?.members.find((m: MemberView) => m.userId === userId) || null;
    if (!member) return;

    const mode = member.isSelf ? "self-detail" : (trip?.tripMeta.viewerRole === "admin" ? "admin-member-detail" : "member-detail");
    const seat = seatRows.flatMap(row => row.slots).find((slot: any) => slot?.occupant?.userId === userId) || null;

    setSheetVisible(true);
    setSheetMode(mode);
    setSelectedMember(member);
    setSelectedSeat(seat);
  };

  /* 处理入座确认 */
  const handleClaimConfirm = async () => {
    if (!selectedSeat) return;

    try {
      if (trip?.tripMeta.viewerSeatCode) {
        await switchSeat(selectedSeat.code);
      } else {
        await claimSeat(selectedSeat.code);
      }
      setSheetVisible(false);
    } catch (error) {
      console.error("入座失败:", error);
    }
  };

  /* 处理释放自己的座位 */
  const handleReleaseMine = async () => {
    try {
      await releaseMySeat();
      setSheetVisible(false);
    } catch (error) {
      console.error("释放座位失败:", error);
    }
  };

  /* 处理管理员释放座位 */
  const handleAdminRelease = async () => {
    if (!selectedMember) return;

    try {
      await adminReleaseSeat(selectedMember.userId);
      setSheetVisible(false);
    } catch (error) {
      console.error("释放座位失败:", error);
    }
  };

  /* 处理标记/取消标记成员 */
  const handleToggleFavorite = async () => {
    if (!selectedMember) return;

    try {
      await toggleFavoriteMember(selectedMember.userId);
      // 保持弹窗打开，更新状态
    } catch (error) {
      console.error("标记失败:", error);
    }
  };

  /* 处理弹窗关闭 */
  const handleSheetClose = () => {
    setSheetVisible(false);
    setSelectedSeat(null);
    setSelectedMember(null);
  };

  return (
    <div className={styles.homePage}>
      <div className={styles.bgHero} />

      {/* 头部区域 */}
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <div className={styles.title}>{tripName}</div>
          <div className={styles.subtitle}>{departureTime}出发~</div>
        </div>
        <Image
          className={styles.headerFigure}
          src="/assets/icons/pic_homepage_chufa.png"
          alt="出发插图"
          width={118}
          height={100}
        />
      </div>

      {/* 用户卡片 */}
      <div className={styles.userCard}>
        <div className={styles.userMain}>
          {currentUser?.avatarUrl ? (
            <Image
              className={styles.userAvatar}
              src={currentUser.avatarUrl}
              alt="头像"
              width={48}
              height={48}
            />
          ) : (
            <div className={styles.avatarFallback}>{currentUser?.nickname?.slice(0, 1) || "我"}</div>
          )}
          <div className={styles.userCopy}>
            <div className={styles.userGreeting}>
              👋 Hi，{currentUser?.nickname ?? ""}
            </div>
            <div className={styles.userWish}>旅途愉快~</div>
          </div>
        </div>

        <div className={styles.seatSummary}>
          <div className={styles.seatTag}>我的座位</div>
          <div
            className={`${styles.seatValue} ${
              viewerSeatText === "请选择您的座位"
                ? styles.seatValuePlaceholder
                : ""
            }`}
          >
            {viewerSeatText}
          </div>
        </div>
      </div>

      {/* 面板区域 */}
      <div className={styles.tripPanel}>
        <div className={styles.tripTabs}>
          <div className={styles.tabsLeft}>
            <button
              className={`${styles.tab} ${
                activeTab === "seats" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("seats")}
            >
              座位图
              {activeTab === "seats" && (
                <span className={styles.tabLine} />
              )}
            </button>
            <button
              className={`${styles.tab} ${
                activeTab === "members" ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab("members")}
            >
              成员列表
              {activeTab === "members" && (
                <span className={styles.tabLine} />
              )}
            </button>
          </div>
          <div className={styles.tabsStat}>已入座 {seatedStat}</div>
        </div>

        <div className={styles.tripContentCard}>
          {activeTab === "seats" ? (
            <SeatGrid seatRows={seatRows} onSeatTap={handleSeatTap} />
          ) : (
            <MemberList members={seatedMembers} onMemberTap={handleMemberTap} />
          )}
        </div>
      </div>

      {/* 座位操作弹窗 */}
      <SeatSheet
        visible={sheetVisible}
        mode={sheetMode}
        seatCode={selectedSeat?.code || ""}
        occupant={selectedSeat?.occupant || null}
        member={selectedMember}
        onConfirm={handleClaimConfirm}
        onRelease={sheetMode === "self-detail" ? handleReleaseMine : handleAdminRelease}
        onToggleFavorite={handleToggleFavorite}
        onClose={handleSheetClose}
      />
    </div>
  );
}
