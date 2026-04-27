"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import s from "./page.module.css";

/* ---- 类型 ---- */
interface FavoriteMember {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  initial: string;
  isAdmin: boolean;
  isMutualFavoriteWithViewer: boolean;
  seatLabel: string;
  tagViews: { label: string; style: string }[];
}

interface RankingMember {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  initial: string;
  isAdmin: boolean;
  seatLabel: string;
  favoriteCount: number;
}

interface PageData {
  tripName: string;
  favoriteCount: number;
  favoriteLimit: number;
  isAdmin: boolean;
  viewerRoleLabel: string;
  showRankingTab: boolean;
  favorites: FavoriteMember[];
  ranking: RankingMember[];
}

/* ---- Mock 数据（开发阶段使用） ---- */
const MOCK_DATA: PageData = {
  tripName: "周末出游团",
  favoriteCount: 3,
  favoriteLimit: 5,
  isAdmin: true,
  viewerRoleLabel: "管理员",
  showRankingTab: true,
  favorites: [
    {
      userId: "u1",
      nickname: "小明",
      avatarUrl: "",
      initial: "明",
      isAdmin: false,
      isMutualFavoriteWithViewer: true,
      seatLabel: "A3",
      tagViews: [
        { label: "活泼", style: "background:rgba(255,122,89,0.12);color:#ff7a59;" },
        { label: "爱笑", style: "background:rgba(43,145,255,0.1);color:#2b91ff;" },
      ],
    },
    {
      userId: "u2",
      nickname: "小红",
      avatarUrl: "",
      initial: "红",
      isAdmin: true,
      isMutualFavoriteWithViewer: false,
      seatLabel: "B5",
      tagViews: [
        { label: "安静", style: "background:rgba(39,174,96,0.1);color:#27ae60;" },
      ],
    },
    {
      userId: "u3",
      nickname: "阿杰",
      avatarUrl: "",
      initial: "杰",
      isAdmin: false,
      isMutualFavoriteWithViewer: false,
      seatLabel: "C7",
      tagViews: [],
    },
  ],
  ranking: [
    {
      userId: "u2",
      nickname: "小红",
      avatarUrl: "",
      initial: "红",
      isAdmin: true,
      seatLabel: "B5",
      favoriteCount: 8,
    },
    {
      userId: "u1",
      nickname: "小明",
      avatarUrl: "",
      initial: "明",
      isAdmin: false,
      seatLabel: "A3",
      favoriteCount: 5,
    },
    {
      userId: "u3",
      nickname: "阿杰",
      avatarUrl: "",
      initial: "杰",
      isAdmin: false,
      seatLabel: "C7",
      favoriteCount: 2,
    },
  ],
};

export default function FavoritesPage() {
  const params = useParams();
  const tripId = params?.tripId as string | undefined;

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [activeTab, setActiveTab] = useState<"mine" | "ranking">("mine");

  useEffect(() => {
    // TODO: 替换为真实 API 调用
    // fetch(`/api/trips/${tripId}/favorites`).then(...)
    setPageData(MOCK_DATA);
  }, [tripId]);

  const handleTabChange = useCallback((tab: "mine" | "ranking") => {
    setActiveTab(tab);
  }, []);

  if (!pageData) {
    return (
      <div className={s.page}>
        <PageNavbar title="" />
        <div className={s.empty}>
          <div className={s.emptyTitle}>加载中...</div>
        </div>
      </div>
    );
  }

  const showEmpty = !pageData.favorites.length && !pageData.ranking.length;

  return (
    <div className={s.page}>
      <PageNavbar title="" />

      {showEmpty ? (
        <div className={s.empty}>
          <div className={s.emptyTitle}>暂无标记</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className={s.header}>
            <div className={s.title}>标记</div>
            <div className={s.subtitle}>{pageData.tripName}</div>
          </div>

          {/* Summary */}
          <div className={s.summary}>
            <div className={s.summaryCard}>
              <div className={s.summaryLabel}>我的标记</div>
              <div className={s.summaryValue}>
                {pageData.favoriteCount} / {pageData.favoriteLimit}
              </div>
            </div>
            {pageData.isAdmin && (
              <div className={s.summaryCard}>
                <div className={s.summaryLabel}>当前身份</div>
                <div className={s.summaryValue}>{pageData.viewerRoleLabel}</div>
              </div>
            )}
          </div>

          {/* Tabs */}
          {pageData.showRankingTab && (
            <div className={s.tabs}>
              <button
                className={`${s.tab} ${activeTab === "mine" ? s.tabActive : ""}`}
                onClick={() => handleTabChange("mine")}
              >
                我的标记
              </button>
              <button
                className={`${s.tab} ${activeTab === "ranking" ? s.tabActive : ""}`}
                onClick={() => handleTabChange("ranking")}
              >
                标记单
              </button>
            </div>
          )}

          {/* 我的标记列表 */}
          {activeTab === "mine" && (
            <div className={s.list}>
              {pageData.favorites.map((item) => (
                <div key={item.userId} className={s.favoriteCard}>
                  {item.avatarUrl ? (
                    <img className={s.avatar} src={item.avatarUrl} alt={item.nickname} />
                  ) : (
                    <div className={`${s.avatar} ${s.avatarFallback} avatar-fallback`}>
                      {item.initial}
                    </div>
                  )}

                  <div className={s.main}>
                    <div className={s.titleRow}>
                      <span className={s.name}>{item.nickname}</span>
                      {item.isAdmin && <span className={s.badge}>管</span>}
                      {item.isMutualFavoriteWithViewer && (
                        <span className={s.mutualTag}>互相标记</span>
                      )}
                    </div>
                    {item.tagViews.length > 0 && (
                      <div className={s.tags}>
                        {item.tagViews.map((tag) => (
                          <span key={tag.label} className={s.tagChip} style={tag.style as React.CSSProperties}>
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className={s.seat}>{item.seatLabel}</span>
                </div>
              ))}
            </div>
          )}

          {/* 排名列表 */}
          {activeTab === "ranking" && (
            <div className={s.list}>
              {pageData.ranking.map((item, idx) => (
                <div key={item.userId} className={s.rankingCard}>
                  <span className={s.rankingIndex}>{idx + 1}</span>

                  {item.avatarUrl ? (
                    <img className={s.avatar} src={item.avatarUrl} alt={item.nickname} />
                  ) : (
                    <div className={`${s.avatar} ${s.avatarFallback} avatar-fallback`}>
                      {item.initial}
                    </div>
                  )}

                  <div className={s.rankingMain}>
                    <div className={s.titleRow}>
                      <span className={s.name}>{item.nickname}</span>
                      {item.isAdmin && <span className={s.badge}>管</span>}
                    </div>
                    <div className={s.rankingSeat}>{item.seatLabel}</div>
                  </div>

                  <div className={s.rankingCount}>
                    <div className={s.rankingCountValue}>{item.favoriteCount}</div>
                    <div className={s.rankingCountLabel}>被标记</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
