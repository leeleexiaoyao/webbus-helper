"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTrip } from "@/src/lib/hooks/use-trip";
import { TabBar } from "@/components/TabBar/TabBar";
import styles from "./page.module.css";

/* 工具卡片数据 */
const toolCards = [
  {
    type: "vote",
    themeKey: "vote",
    displayTitle: "随机抽",
    displayDescription: "随机抽取幸运成员",
    ctaLabel: "开始抽取",
    imageUrl: "/assets/icons/icon_tools_投票.png",
  },
  {
    type: "seat-draw",
    themeKey: "seat-draw",
    displayTitle: "做选择",
    displayDescription: "帮你做出选择",
    ctaLabel: "开始选择",
    imageUrl: "/assets/icons/icon_tools_抽签.png",
  },
  {
    type: "lottery",
    themeKey: "lottery",
    displayTitle: "大转盘",
    displayDescription: "幸运大转盘抽奖",
    ctaLabel: "开始抽奖",
    imageUrl: "/assets/icons/icon_tools_幸运大转盘.png",
  },
  {
    type: "wheel",
    themeKey: "wheel",
    displayTitle: "幸运签",
    displayDescription: "抽一支幸运签",
    ctaLabel: "抽签",
    imageUrl: "/assets/icons/icon_tools_随机选号.png",
  },
] as const;

/* 主题 class 映射 */
const themeClassMap: Record<string, string> = {
  vote: styles.toolCardVote,
  "seat-draw": styles.toolCardSeatDraw,
  lottery: styles.toolCardLottery,
  wheel: styles.toolCardWheel,
};

export default function ToolsPage() {
  const router = useRouter();
  const { data, loading } = useTrip();

  const homeMode = data?.homeMode ?? "landing";
  const hasTrip = homeMode === "trip";

  /* ---------- 加载态 ---------- */
  if (loading) {
    return (
      <div className={styles.toolsPage}>
        <div className={styles.bgHero} />
        <div className={styles.loadingWrap}>
          <span style={{ color: "#b6bac1", fontSize: 13 }}>加载中...</span>
        </div>
        <TabBar />
      </div>
    );
  }

  return (
    <div className={styles.toolsPage}>
      <div className={styles.bgHero} />

      {/* 头部 */}
      <div className={styles.toolsHeader}>
        <div className={styles.toolsTitle}>工具</div>
        <div className={styles.toolsSubtitle}>
          {hasTrip ? "趣味小工具，让旅途更愉快" : "请先创建或加入车次"}
        </div>
      </div>

      {/* 有车次：工具卡片网格 */}
      {hasTrip && (
        <div className={styles.toolGrid}>
          {toolCards.map((card) => (
            <div
              key={card.type}
              className={`${styles.toolCard} ${themeClassMap[card.themeKey] ?? ""}`}
              onClick={() => router.push(`/tool-detail/${card.type}`)}
            >
              <div className={styles.toolCardBody}>
                <div className={styles.toolTitle}>{card.displayTitle}</div>
                <div className={styles.toolDescription}>
                  {card.displayDescription}
                </div>
              </div>
              <div className={styles.toolCta}>
                <span>{card.ctaLabel}</span>
                <Image
                  className={styles.toolCtaIcon}
                  src="/assets/icons/icon_tools_arrow.svg"
                  alt=""
                  width={16}
                  height={16}
                />
              </div>
              <Image
                className={styles.toolImage}
                src={card.imageUrl}
                alt={card.displayTitle}
                width={142}
                height={142}
              />
            </div>
          ))}
        </div>
      )}

      {/* 无车次：空状态 */}
      {!hasTrip && (
        <div className={styles.toolsEmptyState}>
          <div className={styles.toolsEmptyLabel}>暂未开放</div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
