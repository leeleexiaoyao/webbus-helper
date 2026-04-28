"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./TabBar.module.css";

const tabs = [
  {
    path: "/",
    label: "首页",
    icon: "/assets/icons/tab-home.png",
    activeIcon: "/assets/icons/tab-home-active.png",
  },
  {
    path: "/tools",
    label: "工具",
    icon: "/assets/icons/tab-tools.png",
    activeIcon: "/assets/icons/tab-tools-active.png",
  },
  {
    path: "/profile",
    label: "我的",
    icon: "/assets/icons/tab-profile.png",
    activeIcon: "/assets/icons/tab-profile-active.png",
  },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <div className={styles.tabBar}>
      <div className={styles.inner}>
        {tabs.map((tab) => {
          const isActive = tab.path === "/" ? pathname === "/" : pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`${styles.tabItem} ${isActive ? styles.active : ""}`}
            >
              <Image
                className={styles.tabIcon}
                src={isActive ? tab.activeIcon : tab.icon}
                alt=""
                width={22}
                height={22}
              />
              <span className={styles.tabLabel}>{tab.label}</span>
              {isActive && <span className={styles.activeLine} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
