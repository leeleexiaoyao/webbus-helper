"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTrip } from "@/src/lib/hooks/use-trip";
import { useAuth } from "@/src/lib/hooks/use-auth";
import { TabBar } from "@/components/TabBar/TabBar";
import styles from "./page.module.css";

export default function HomePage() {
  const router = useRouter();
  const { data, loading } = useTrip();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"seats" | "members">("seats");

  const homeMode = data?.homeMode ?? "landing";
  const trip = data?.currentTrip ?? null;
  const currentUser = data?.currentUser ?? null;

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
        <TabBar />
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
        <TabBar />
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
        <TabBar />
      </div>
    );
  }

  /* ---------- 有车次（trip） ---------- */
  const tripName = trip?.tripMeta.tripName ?? "";
  const departureTime = trip?.tripMeta.departureTime ?? "";

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
            <div className={styles.avatarFallback} />
          )}
          <div className={styles.userCopy}>
            <div className={styles.userGreeting}>
              Hi，{currentUser?.nickname ?? ""}
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
            /* 座位图占位 - 后续由 SeatGrid 组件填充 */
            <div
              style={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b6bac1",
                fontSize: 13,
              }}
            >
              座位图
            </div>
          ) : (
            /* 成员列表占位 - 后续由 MemberList 组件填充 */
            <div
              style={{
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#b6bac1",
                fontSize: 13,
              }}
            >
              成员列表
            </div>
          )}
        </div>
      </div>

      <TabBar />
    </div>
  );
}
