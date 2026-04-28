"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTrip } from "@/src/lib/hooks/use-trip";
import { buildTagColorViews } from "@/src/lib/tag-style";
import { HOME_PERSONA_OPTIONS } from "@/src/domain/constants";
import styles from "./page.module.css";

function resolveProfileIllustrationUrl(homePersonaAssetId: string | null): string {
  if (!homePersonaAssetId) {
    return "/assets/personas/profile-illustration.svg";
  }

  return HOME_PERSONA_OPTIONS.find((option) => option.id === homePersonaAssetId)?.imageUrl ?? "/assets/personas/profile-illustration.svg";
}

function trimProfileLocationSuffix(value: string): string {
  const suffixes = ["特别行政区", "自治区", "自治州", "自治县", "地区", "盟", "省", "市", "区", "县"];
  const matchedSuffix = suffixes.find((suffix) => value.endsWith(suffix));
  if (!matchedSuffix) {
    return value;
  }

  return value.slice(0, -matchedSuffix.length);
}

function parseLocationUnits(value: string): Array<{ name: string; suffix: string }> {
  const units: Array<{ name: string; suffix: string }> = [];
  const matcher = /(.+?)(特别行政区|自治区|自治州|自治县|地区|盟|省|市|区|县)/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(value)) !== null) {
    units.push({
      name: match[1],
      suffix: match[2],
    });
  }

  return units;
}

function buildTextStat(value: string): { primary: string; secondary: string; isPlaceholder: boolean } {
  const trimmed = value.trim();
  return {
    primary: trimmed,
    secondary: "",
    isPlaceholder: false,
  };
}

function buildAgeStat(age: string): { primary: string; secondary: string; isPlaceholder: boolean } {
  const trimmed = age.trim();
  return {
    primary: trimmed ? `${trimmed}岁` : "",
    secondary: "",
    isPlaceholder: false,
  };
}

function buildLivingLocationStat(value: string): { primary: string; secondary: string; isPlaceholder: boolean } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { primary: "", secondary: "", isPlaceholder: true };
  }

  const units = parseLocationUnits(trimmed);
  const districtUnit = units.find((unit) => unit.suffix === "区" || unit.suffix === "县");
  const cityUnit = units.find((unit) => unit.suffix === "市");
  return {
    primary: districtUnit?.name ?? cityUnit?.name ?? trimProfileLocationSuffix(trimmed),
    secondary: "",
    isPlaceholder: false,
  };
}

function buildHometownLocationStat(value: string): { primary: string; secondary: string; isPlaceholder: boolean } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { primary: "", secondary: "", isPlaceholder: true };
  }

  const units = parseLocationUnits(trimmed);
  const cityUnit = units.find((unit) => unit.suffix === "市");
  const districtUnit = units.find((unit) => unit.suffix === "区" || unit.suffix === "县");
  return {
    primary: cityUnit?.name ?? districtUnit?.name ?? trimProfileLocationSuffix(trimmed),
    secondary: "",
    isPlaceholder: false,
  };
}

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
  const { data, loading } = useTrip();
  const user = data?.currentUser;

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
      </div>
    );
  }

  /* ========== 已登录 ========== */
  const profileIllustrationUrl = resolveProfileIllustrationUrl(user.homePersonaAssetId);
  const hasProfileIllustration = !!profileIllustrationUrl;
  const hasProfileBio = !!user.bio?.trim();
  const ageStat = buildAgeStat(user.age);
  const livingStat = buildLivingLocationStat(user.livingCity);
  const hometownStat = buildHometownLocationStat(user.hometown);
  const hasProfileStats = !!(ageStat.primary || livingStat.primary || hometownStat.primary);

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
          hasProfileIllustration ? styles.hasIllustration : ""
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
              {data?.currentTrip?.tripMeta.viewerSeatLabel && (
                <div className={styles.seat}>
                  座位号: {data.currentTrip.tripMeta.viewerSeatLabel}
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
          {hasProfileBio && <div className={styles.bio}>{user.bio}</div>}

          {/* 统计信息 */}
          {hasProfileStats && (
            <div className={styles.stats}>
              {ageStat.primary && (
                <>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{ageStat.primary}</div>
                    <div className={styles.statLabel}>年龄</div>
                  </div>
                  {(livingStat.primary || hometownStat.primary) && (
                    <div className={styles.settingsDivider} />
                  )}
                </>
              )}
              {livingStat.primary && (
                <>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>{livingStat.primary}</div>
                    <div className={styles.statLabel}>居住</div>
                  </div>
                  {hometownStat.primary && (
                    <div className={styles.settingsDivider} />
                  )}
                </>
              )}
              {hometownStat.primary && (
                <div className={styles.stat}>
                  <div className={styles.statValue}>{hometownStat.primary}</div>
                  <div className={styles.statLabel}>来自</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 装饰插图 */}
        {hasProfileIllustration && (
          <Image
            className={styles.illustration}
            src={profileIllustrationUrl}
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
    </div>
  );
}
