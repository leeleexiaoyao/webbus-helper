"use client";

import { useState, useCallback, useEffect } from "react";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { useTrip } from "@/src/lib/hooks/use-trip";
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
  tagViews: { label: string; style: any }[];
}

interface RankingMember {
  userId: string;
  nickname: string;
  avatarUrl?: string;
  initial: string;
  isAdmin: boolean;
  seatLabel: string;
  favoriteCount: number;
  joinedAt: number;
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

export default function FavoritesPage() {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [activeTab, setActiveTab] = useState<"mine" | "ranking">('mine');
  const { data, loading, toggleFavoriteMember, refresh, getFavoritesPageData } = useTrip();

  // 获取收藏页面数据
  const fetchFavoritesData = useCallback(async () => {
    try {
      const data = await getFavoritesPageData();
      setPageData({
        tripName: data.tripName,
        favoriteCount: data.favoriteCount,
        favoriteLimit: data.favoriteLimit,
        isAdmin: data.isAdmin,
        viewerRoleLabel: data.viewerRoleLabel,
        showRankingTab: data.showRankingTab,
        favorites: data.favorites,
        ranking: data.ranking
      });
    } catch (error) {
      console.error('获取收藏数据失败:', error);
    }
  }, [getFavoritesPageData]);

  useEffect(() => {
    fetchFavoritesData();
  }, [fetchFavoritesData]);

  // 切换标记后刷新数据
  const handleToggleFavorite = useCallback(async (userId: string) => {
    try {
      await toggleFavoriteMember(userId);
      await fetchFavoritesData();
    } catch (error) {
      console.error("切换标记失败:", error);
    }
  }, [toggleFavoriteMember, fetchFavoritesData]);

  const handleTabChange = useCallback((tab: "mine" | "ranking") => {
    setActiveTab(tab);
  }, []);

  // 加载态
  if (loading) {
    return (
      <div className={s.page}>
        <PageNavbar title="标记" />
        <div className={s.empty}>
          <div className={s.emptyTitle}>加载中...</div>
        </div>
      </div>
    );
  }

  // 没有加入车次
  if (!pageData || !data?.currentTrip) {
    return (
      <div className={s.page}>
        <PageNavbar title="标记" />
        <div className={s.empty}>
          <div className={s.emptyTitle}>暂无标记</div>
        </div>
      </div>
    );
  }

  const showEmpty = !pageData.favorites.length && !pageData.ranking.length;

  return (
    <div className={s.page}>
      <PageNavbar title="标记" />

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
                <div 
                  key={item.userId} 
                  className={s.favoriteCard}
                  onClick={() => handleToggleFavorite(item.userId)}
                >
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
                          <span key={tag.label} className={s.tagChip} style={tag.style}>
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
