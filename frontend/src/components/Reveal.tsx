"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  /** Độ trễ trước khi hiện (ms) — dùng index * 70 để tạo cascade */
  delay?: number;
  /** Khoảng trượt lên lúc xuất hiện (px) */
  offset?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}

/**
 * Bọc nội dung để hiện dần + trượt nhẹ khi cuộn tới (chạy 1 lần).
 * Tự tắt khi hệ điều hành bật giảm chuyển động.
 */
export default function Reveal({ children, delay = 0, offset = 20, className = "", as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as "div";

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `translateY(${offset}px)`,
        transitionProperty: "opacity, transform",
        transitionDuration: "var(--dur-slow, 450ms)",
        transitionTimingFunction: "var(--ease-spring, cubic-bezier(0.16, 1, 0.3, 1))",
        transitionDelay: visible && delay ? `${delay}ms` : "0ms",
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}
