"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styles from "./ImagePreview.module.css";

interface ImagePreviewProps {
  visible: boolean;
  urls: string[];
  current?: number;
  onClose: () => void;
}

export function ImagePreview({ visible, urls, current = 0, onClose }: ImagePreviewProps) {
  const [index, setIndex] = useState(current);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number; dist: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setIndex(current);
      setScale(1);
      setTranslate({ x: 0, y: 0 });
      document.body.classList.add("scroll-locked");
    } else {
      document.body.classList.remove("scroll-locked");
    }
    return () => document.body.classList.remove("scroll-locked");
  }, [visible, current]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => {
      const next = prev - e.deltaY * 0.001;
      return Math.min(Math.max(next, 0.5), 5);
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      lastTouchRef.current = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2, dist };
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ratio = dist / lastTouchRef.current.dist;
      setScale((prev) => Math.min(Math.max(prev * ratio, 0.5), 5));
      lastTouchRef.current.dist = dist;
    } else if (e.touches.length === 1 && isDragging && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastTouchRef.current.x = e.touches[0].clientX;
      lastTouchRef.current.y = e.touches[0].clientY;
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    setScale((prev) => (prev > 1 ? 1 : 2.5));
    setTranslate({ x: 0, y: 0 });
  }, []);

  const handlePrev = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : urls.length - 1));
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [urls.length]);

  const handleNext = useCallback(() => {
    setIndex((prev) => (prev < urls.length - 1 ? prev + 1 : 0));
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [urls.length]);

  if (!visible || urls.length === 0) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={containerRef}
        className={styles.container}
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          className={styles.image}
          src={urls[index]}
          alt={`预览 ${index + 1}`}
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
          }}
          onClick={handleDoubleClick}
          draggable={false}
        />
      </div>

      {urls.length > 1 && (
        <div className={styles.indicator}>
          {index + 1} / {urls.length}
        </div>
      )}

      <button className={styles.closeBtn} onClick={onClose} aria-label="关闭预览">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {urls.length > 1 && index > 0 && (
        <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={handlePrev} aria-label="上一张">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {urls.length > 1 && index < urls.length - 1 && (
        <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={handleNext} aria-label="下一张">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  );
}
