"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { useTrip } from "@/src/lib/hooks/use-trip";
import s from "./page.module.css";

interface Template {
  id: string;
  displayName: string;
  layoutText: string;
}

const TEMPLATES: Template[] = [
  { id: "template-49", displayName: "经典 49座", layoutText: "4 × 11 + 5" },
  { id: "template-53", displayName: "舒适 53座", layoutText: "4 × 12 + 5" },
  { id: "template-57", displayName: "宽敞 57座", layoutText: "4 × 13 + 5" },
];

const DEFAULT_TEMPLATE = "template-49";

export default function CreateTripPage() {
  const router = useRouter();
  const { createTrip } = useTrip();

  const [tripName, setTripName] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  }, []);

  // 生成车次口令
  useEffect(() => {
    // 生成 6 位随机数字口令
    const generatePassword = (): string => {
      return String(Math.floor(100000 + Math.random() * 900000));
    };
    setPassword(generatePassword());
  }, []);

  const handleCopyPassword = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      showToast("已复制");
    } catch {
      showToast("复制失败");
    }
  }, [password, showToast]);

  const handleSubmit = useCallback(async () => {
    if (!tripName.trim()) {
      showToast("请输入行程名称");
      return;
    }
    if (!departureDate) {
      showToast("请选择出发日期");
      return;
    }
    if (!departureTime) {
      showToast("请选择出发时间");
      return;
    }

    setSubmitting(true);
    try {
      // 合并日期时间
      const fullDepartureTime = `${departureDate} ${departureTime}`;
      
      await createTrip({
        tripName: tripName.trim(),
        departureTime: fullDepartureTime,
        password: password,
        templateId: selectedTemplate,
      });
      
      showToast("创建成功");
      setTimeout(() => {
        router.push("/");
      }, 450);
    } catch (error) {
      console.log('Create trip error:', error);
      const errorMessage = error instanceof Error ? error.message : "创建失败，请重试";
      showToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [tripName, departureDate, departureTime, password, selectedTemplate, router, showToast, createTrip]);

  return (
    <div className={s.page}>
      <PageNavbar title="创建车次" />

      <div className={s.content}>
        {/* 行程名称 */}
        <div className={s.settingRow}>
          <span className={s.settingLabel}>行程名称</span>
          <input
            className={s.settingInput}
            value={tripName}
            maxLength={24}
            placeholder="请输入行程名称"
            onChange={(e) => setTripName(e.target.value)}
          />
        </div>

        {/* 出发日期 */}
        <div className={s.settingRow}>
          <span className={s.settingLabel}>出发日期</span>
          <div className={s.pickerWrap}>
            <div className={s.timeControl}>
              <span className={departureDate ? s.timeText : `${s.timeText} ${s.timeTextPlaceholder}`}>
                {departureDate || "请选择出发日期"}
              </span>
              <span className={s.arrow} />
            </div>
            <input
              className={s.nativePicker}
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
            />
          </div>
        </div>

        {/* 出发时间 */}
        <div className={s.settingRow}>
          <span className={s.settingLabel}>出发时间</span>
          <div className={s.pickerWrap}>
            <div className={s.timeControl}>
              <span className={departureTime ? s.timeText : `${s.timeText} ${s.timeTextPlaceholder}`}>
                {departureTime || "请选择出发时间"}
              </span>
              <span className={s.arrow} />
            </div>
            <input
              className={s.nativePicker}
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />
          </div>
        </div>

        {/* 车次口令 */}
        <div className={s.settingRow}>
          <span className={s.settingLabel}>车次口令</span>
          <div className={s.passwordControl}>
            <span className={s.passwordText}>{password}</span>
            <button className={s.copyButton} onClick={handleCopyPassword} aria-label="复制口令">
              <span className={s.copyIcon} />
            </button>
          </div>
        </div>

        {/* 座位模板 */}
        <div className={s.templateSection}>
          <span className={s.settingLabel}>座位模板</span>
          <div className={s.templateList}>
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className={`${s.templateCard} ${selectedTemplate === tpl.id ? s.templateCardActive : ""}`}
                onClick={() => setSelectedTemplate(tpl.id)}
              >
                <div className={s.templateName}>{tpl.displayName}</div>
                <div className={s.templateText}>{tpl.layoutText}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 创建按钮 */}
        <button className={s.submitBtn} disabled={submitting} onClick={handleSubmit}>
          {submitting ? "创建中..." : "创建"}
        </button>
      </div>

      {toast && <div className={s.toast}>{toast}</div>}
    </div>
  );
}
