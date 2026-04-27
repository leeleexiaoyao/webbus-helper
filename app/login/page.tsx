"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/hooks/use-auth";
import s from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!nickname.trim()) {
      setError("请输入昵称");
      return;
    }
    if (!password) {
      setError("请输入密码");
      return;
    }

    setSubmitting(true);
    try {
      await login(nickname.trim(), password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <span className={s.badge}>账号登录</span>
        <h1 className={s.title}>巴士认座助手</h1>
        <p className={s.subtitle}>输入昵称和密码登录你的账号</p>

        <form className={s.form} onSubmit={handleSubmit}>
          <input
            className={s.input}
            type="text"
            placeholder="请输入昵称"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="username"
          />
          <input
            className={s.input}
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button
            className={s.submitBtn}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "登录中..." : "登录"}
          </button>

          {error && <div className={s.error}>{error}</div>}
        </form>

        <div className={s.linkRow}>
          没有账号？
          <a href="/register" className={s.link}>去注册</a>
        </div>
      </div>
    </div>
  );
}
