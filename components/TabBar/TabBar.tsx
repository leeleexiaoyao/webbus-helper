"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./TabBar.module.css";

const tabs = [
  { path: "/", label: "首页" },
  { path: "/tools", label: "工具" },
  { path: "/profile", label: "我的" },
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
              <span className={styles.tabLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
