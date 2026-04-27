"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/hooks/use-auth";
import s from "./page.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const { register, uploadAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

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
    if (password.length < 6) {
      setError("密码至少需要6个字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }
      await register(nickname.trim(), password, avatarUrl);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <span className={s.badge}>新用户</span>
        <h1 className={s.title}>创建账号</h1>
        <p className={s.subtitle}>设置昵称和头像，加入巴士认座助手</p>

        <form className={s.form} onSubmit={handleSubmit}>
          {/* 头像上传 */}
          <div className={s.avatarSection}>
            <button
              type="button"
              className={s.avatarPicker}
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <img
                  className={s.avatarImage}
                  src={avatarPreview}
                  alt="头像预览"
                />
              ) : (
                <span className={s.avatarPlaceholder}>选头像</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>

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
            autoComplete="new-password"
          />
          <input
            className={s.input}
            type="password"
            placeholder="请确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button
            className={s.submitBtn}
            type="submit"
            disabled={submitting}
          >
            {submitting ? "注册中..." : "注册"}
          </button>

          {error && <div className={s.error}>{error}</div>}
        </form>

        <div className={s.linkRow}>
          已有账号？
          <a href="/login" className={s.link}>去登录</a>
        </div>
      </div>
    </div>
  );
}
