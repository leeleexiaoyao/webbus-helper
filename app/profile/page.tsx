"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/src/lib/hooks/use-auth";
import { buildTagColorViews } from "@/src/lib/tag-style";
import { TabBar } from "@/components/TabBar/TabBar";
import styles from "./page.module.css";

/* 设置菜单项 */
interface SettingsItem {
  id: string;
  label: string;
  icon: string;
  action: string;
  isShare?: boolean;
  showDivider?: boolean;
}

const loggedInMenuItems: SettingsItem[] = [
  {
    id: "favorites",
    label: "标记",
    icon: "/assets/icons/me/icon_me_favorite.svg",
    action: "/favorites",
    showDivider: true,
  },
  {
    id: "share",
    label: "分享",
    icon: "/assets/icons/me/icon_me_share.svg",
    action: "share",
    isShare: true,
    showDivider: true,
  },
  {
    id: "feedback",
    label: "意见反馈",
    icon: "/assets/icons/me/icon_me_feedback.svg",
    action: "/feedback",
    showDivider: true,
  },
  {
    id: "settings",
    label: "设置",
    icon: "/assets/icons/me/icon_me_setting.svg",
    action: "/profile-settings",
  },
];

const loggedOutMenuItems: SettingsItem[] = [
  {
    id: "share",
    label: "分享",
    icon: "/assets/icons/me/icon_me_share.svg",
    action: "share",
    isShare: true,
    showDivider: true,
  },
  {
    id: "about",
    label: "关于",
    icon: "/assets/icons/me/icon_me_more.svg",
    action: "/about",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  /* 标签颜色视图 */
  const tagViews = user?.tags?.length
    ? buildTagColorViews(user.tags)
    : [];

  /* 处理菜单点击 */
  const handleMenuTap = (item: SettingsItem) => {
    if (item.isShare) return; // 分享由按钮处理
    if (item.action === "share") return;
    router.push(item.action);
  };

  /* 加载态 */
  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.bgHero} />
        <div
          style={{
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#b6bac1",
            fontSize: 13,
            position: "relative",
            zIndex: 2,
          }}
        >
          加载中...
        </div>
        <TabBar />
      </div>
    );
  }

  /* ========== 未登录 ========== */
  if (!user) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.bgHero}>
          <Image
            className={styles.flower}
            src="/assets/personas/profile-illustration.svg"
            alt="装饰"
            width={109}
            height={112}
          />
        </div>

        <div className={styles.topbar}>
          <div className={styles.pageTitle}>我的</div>
        </div>

        <div className={styles.unauthCard}>
          <div className={styles.unauthHeader}>
            <div className={styles.unauthAvatar} />
            <div className={styles.unauthCopy}>
              <div className={styles.unauthName}>未登录</div>
              <div className={styles.unauthTip}>点击头像和昵称完成授权</div>
            </div>
          </div>
        </div>

        <div className={styles.settingsCard}>
          {loggedOutMenuItems.map((item) => (
            <div key={item.id}>
              <button
                className={styles.settingsItem}
                onClick={() => handleMenuTap(item)}
              >
                <div className={styles.settingsItemMain}>
                  <Image
                    className={styles.settingsItemIcon}
                    src={item.icon}
                    alt={item.label}
                    width={24}
                    height={24}
                  />
                  <span className={styles.settingsItemLabel}>{item.label}</span>
                </div>
                <div className={styles.settingsItemArrow} />
              </button>
              {item.showDivider && <div className={styles.settingsDivider} />}
            </div>
          ))}
        </div>

        <TabBar />
      </div>
    );
  }

  /* ========== 已登录 ========== */
  const hasIllustration = true;
  const hasBio = !!user.bio;
  const hasStats = !!(user.age || user.livingCity || user.hometown);

  return (
    <div className={styles.profilePage}>
      <div className={styles.bgHero}>
        <Image
          className={styles.flower}
          src="/assets/personas/profile-illustration.svg"
          alt="装饰"
          width={109}
          height={112}
        />
      </div>

      <div className={styles.topbar}>
        <div className={styles.pageTitle}>我的</div>
      </div>

      {/* Hero 卡片 */}
      <div
        className={`${styles.hero} ${
          hasIllustration ? styles.hasIllustration : ""
        }`}
      >
        <div className={styles.heroCopy}>
          {/* 头像 + 昵称 + 座位号 + 编辑按钮 */}
          <div className={styles.headRow}>
            {user.avatarUrl ? (
              <Image
                className={styles.avatar}
                src={user.avatarUrl}
                alt="头像"
                width={48}
                height={48}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {user.nickname?.charAt(0) || ""}
              </div>
            )}

            <div className={styles.main}>
              <div className={styles.name}>{user.nickname}</div>
              {user.currentTripId && (
                <div className={styles.seat}>
                  座位号:{user.currentTripId}
                </div>
              )}
            </div>

            <button
              className={styles.editBtn}
              onClick={() => router.push("/tag-editor")}
            >
              <span className={styles.editText}>编辑资料</span>
            </button>
          </div>

          {/* 标签列表 */}
          {tagViews.length > 0 && (
            <div className={styles.tags}>
              {tagViews.map((tag) => (
                <span
                  key={tag.label}
                  className={styles.tag}
                  style={tag.style}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* 简介 */}
          {hasBio && <div className={styles.bio}>{user.bio}</div>}

          {/* 统计信息 */}
          {hasStats && (
            <div className={styles.stats}>
              {user.age && (
                <>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{user.age}</div>
                    <div className={styles.statLabel}>年龄</div>
                  </div>
                  {(user.livingCity || user.hometown) && (
                    <div className={styles.settingsDivider} />
                  )}
                </>
              )}
              {user.livingCity && (
                <>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{user.livingCity}</div>
                    <div className={styles.statLabel}>居住</div>
                  </div>
                  {user.hometown && (
                    <div className={styles.settingsDivider} />
                  )}
                </>
              )}
              {user.hometown && (
                <div className={styles.stat}>
                  <div className={styles.statValue}>{user.hometown}</div>
                  <div className={styles.statLabel}>来自</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 装饰插图 */}
        {hasIllustration && (
          <Image
            className={styles.illustration}
            src="/assets/personas/profile-illustration.svg"
            alt="装饰"
            width={97}
            height={153}
          />
        )}
      </div>

      {/* 设置菜单 */}
      <div className={styles.settingsCard}>
        {loggedInMenuItems.map((item) => (
          <div key={item.id}>
            <button
              className={styles.settingsItem}
              onClick={() => handleMenuTap(item)}
            >
              <div className={styles.settingsItemMain}>
                <Image
                  className={styles.settingsItemIcon}
                  src={item.icon}
                  alt={item.label}
                  width={24}
                  height={24}
                />
                <span className={styles.settingsItemLabel}>{item.label}</span>
              </div>
              <div className={styles.settingsItemArrow} />
            </button>
            {item.showDivider && <div className={styles.settingsDivider} />}
          </div>
        ))}
      </div>

      <TabBar />
    </div>
  );
}
