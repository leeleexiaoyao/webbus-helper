"use client";

import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import styles from "./page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <PageNavbar title="关于" />

      <div className={styles.content}>
        <div className={styles.staticCard}>
          <div className={styles.sectionTitle}>关于小程序</div>
          <div className={styles.sectionSubtitle}>
            巴士认座助手用于在出发前快速确认车次、座位和成员信息，降低"上车后找不到人"的沟通成本。
          </div>

          <div className={styles.staticCopy}>
            当前版本聚焦本地演示体验，支持授权登录、创建/加入车次、认座、换座、成员标签和管理员清座等流程。
          </div>
        </div>
      </div>
    </div>
  );
}
