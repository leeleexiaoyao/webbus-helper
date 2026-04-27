"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import { useTrip } from "@/src/lib/hooks/use-trip";
import s from "./page.module.css";

export default function JoinTripPage() {
  const router = useRouter();
  const { joinTrip } = useTrip();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  }, []);

  /* 聚焦指定输入框 */
  const focusInput = useCallback((index: number) => {
    const el = inputRefs.current[index];
    if (el) el.focus();
  }, []);

  /* 处理单个输入框变化 */
  const handleDigitInput = useCallback(
    (index: number, value: string) => {
      const raw = value.replace(/\D/g, "");
      if (!raw) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }

      /* 粘贴多位数字 */
      if (raw.length > 1) {
        const filled = raw.slice(0, 6);
        const next = Array(6).fill("");
        for (let i = 0; i < filled.length; i++) {
          next[i] = filled[i];
        }
        setDigits(next);
        const focusIdx = Math.min(index + filled.length, 5);
        setTimeout(() => focusInput(focusIdx), 0);
        return;
      }

      /* 单个数字 */
      setDigits((prev) => {
        const next = [...prev];
        next[index] = raw[0];
        return next;
      });
      if (index < 5) {
        setTimeout(() => focusInput(index + 1), 0);
      }
    },
    [focusInput],
  );

  /* 处理退格 */
  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        setTimeout(() => focusInput(index - 1), 0);
      }
    },
    [digits, focusInput],
  );

  /* 处理粘贴事件 */
  const handlePaste = useCallback(
    (index: number, e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;

      const next = Array(6).fill("");
      for (let i = 0; i < pasted.length; i++) {
        next[index + i] = pasted[i];
      }
      setDigits(next);
      const focusIdx = Math.min(index + pasted.length, 5);
      setTimeout(() => focusInput(focusIdx), 0);
    },
    [focusInput],
  );

  const code = digits.join("");

  const handleSubmit = useCallback(async () => {
    if (code.length < 6) {
      showToast("请输入完整的6位口令");
      return;
    }

    setSubmitting(true);
    try {
      await joinTrip(code);
      showToast("加入成功");
      setTimeout(() => {
        router.push("/");
      }, 450);
    } catch (error) {
      console.log('Join trip error:', error);
      const errorMessage = error instanceof Error ? error.message : "口令无效或加入失败";
      showToast(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [code, router, showToast, joinTrip]);

  return (
    <div className={s.page}>
      <PageNavbar title="加入车次" />

      <div className={s.joinTitle}>请输入6位口令</div>

      <div className={s.formBlock}>
        <div className={s.codeInputList}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={s.codeInput}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              autoFocus={i === 0}
              onChange={(e) => handleDigitInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
            />
          ))}
        </div>
      </div>

      <button className={s.submitBtn} disabled={submitting} onClick={handleSubmit}>
        {submitting ? "加入中..." : "加入车次"}
      </button>

      {toast && <div className={s.toast}>{toast}</div>}
    </div>
  );
}
