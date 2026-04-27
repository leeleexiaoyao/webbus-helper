"use client";

import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import styles from "./page.module.css";

export default function FeedbackPage() {
  return (
    <div className={styles.page}>
      <PageNavbar title="意见反馈" />

      <div className={styles.content}>
        <div className={styles.staticCard}>
          <div className={styles.sectionTitle}>建议反馈</div>
          <div className={styles.sectionSubtitle}>
            这个入口先作为静态占位页保留，后续会补充更完整的反馈方式和问题收集流程。
          </div>

          <div className={styles.staticCopy}>
            如果你在演示过程中发现交互不顺手、文案不清楚，或希望补充新的乘车工具，都可以在后续版本里继续收敛到这里。
          </div>
        </div>
      </div>
    </div>
  );
}
