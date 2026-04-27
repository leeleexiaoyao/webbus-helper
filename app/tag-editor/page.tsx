"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageNavbar } from "@/components/PageNavbar/PageNavbar";
import s from "./page.module.css";

/* 年龄选项 */
const AGE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i + 10));

export default function TagEditorPage() {
  const router = useRouter();

  /* ---- 表单状态 ---- */
  const [avatarUrl, setAvatarUrl] = useState("");
  const [nickname] = useState("用户昵称"); // 只读
  const [livingCity, setLivingCity] = useState("");
  const [hometown, setHometown] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  }, []);

  /* 解析标签预览 */
  const previewTags = useMemo(() => {
    return tagsInput
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 6)
      .slice(0, 4);
  }, [tagsInput]);

  /* 头像点击预览 */
  const handlePreviewAvatar = useCallback(() => {
    if (avatarUrl) {
      // TODO: 打开 ImagePreview 组件
    }
  }, [avatarUrl]);

  /* 保存 */
  const handleSave = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          livingCity,
          hometown,
          age: age ? Number(age) : null,
          bio,
          tags: previewTags,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      showToast("保存成功");
      router.back();
    } catch {
      showToast("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }, [livingCity, hometown, age, bio, previewTags, router, showToast]);

  return (
    <div className={s.page}>
      <PageNavbar title="编辑资料" />

      <div className={s.content}>
        {/* ---- 基础信息 ---- */}
        <div className={s.editorSection}>
          <div className={s.sectionTitle}>基础信息</div>
          <div className={s.editorCard}>
            {/* 头像 */}
            <div className={`${s.editorRow} ${s.editorRowAvatar}`} onClick={handlePreviewAvatar}>
              <span className={s.editorRowLabel}>头像</span>
              <div className={`${s.editorRowMain} ${s.editorRowMainAvatar}`}>
                {avatarUrl ? (
                  <img className={s.avatar} src={avatarUrl} alt="头像" />
                ) : (
                  <div className={`${s.avatar} ${s.avatarFallback} avatar-fallback`}>我</div>
                )}
                <span className={s.editorRowCaret} />
              </div>
            </div>

            {/* 名称（只读） */}
            <div className={s.editorRow}>
              <span className={s.editorRowLabel}>名称</span>
              <div className={s.editorRowMain}>
                <span className={`${s.editorRowValue} ${s.editorRowValueMuted}`}>{nickname}</span>
              </div>
            </div>

            {/* 居住地 */}
            <div className={s.editorRow}>
              <span className={s.editorRowLabel}>居住</span>
              <div className={s.editorRowMain}>
                <input
                  className={s.editorInput}
                  type="text"
                  placeholder="请输入居住地"
                  value={livingCity}
                  onChange={(e) => setLivingCity(e.target.value)}
                />
                <span className={s.editorRowCaret} />
              </div>
            </div>

            {/* 来自 */}
            <div className={s.editorRow}>
              <span className={s.editorRowLabel}>来自</span>
              <div className={s.editorRowMain}>
                <input
                  className={s.editorInput}
                  type="text"
                  placeholder="请输入省市"
                  value={hometown}
                  onChange={(e) => setHometown(e.target.value)}
                />
                <span className={s.editorRowCaret} />
              </div>
            </div>

            {/* 年龄 */}
            <div className={s.editorRow}>
              <span className={s.editorRowLabel}>年龄</span>
              <div className={s.editorRowMain}>
                <input
                  className={s.editorInput}
                  type="number"
                  placeholder="请输入年龄"
                  min={10}
                  max={69}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
                <span className={s.editorRowCaret} />
              </div>
            </div>
          </div>
        </div>

        {/* ---- 有话要说 ---- */}
        <div className={s.editorSection}>
          <div className={s.sectionTitle}>有话要说</div>
          <textarea
            className={s.textarea}
            value={bio}
            maxLength={40}
            placeholder="请输入你想说的话"
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* ---- Tips ---- */}
        <div className={s.editorSection}>
          <div className={s.sectionTitle}>Tips</div>
          <textarea
            className={s.textarea}
            value={tagsInput}
            maxLength={80}
            placeholder="每个Tips不超过6个字,最多4个,以换行分割"
            onChange={(e) => setTagsInput(e.target.value)}
          />
          {previewTags.length > 0 && (
            <div className={`${s.tagList} tag-list`}>
              {previewTags.map((tag) => (
                <span key={tag} className={`${s.tagChip} tag-chip`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 固定底部保存按钮 */}
      <div className={s.saveBar}>
        <button className={s.saveBtn} disabled={submitting} onClick={handleSave}>
          {submitting ? "保存中..." : "保存"}
        </button>
      </div>

      {toast && <div className={s.toast}>{toast}</div>}
    </div>
  );
}
