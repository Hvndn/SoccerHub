"use client";

import React, { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Giá trị số cần đếm tới */
  value: number;
  /** Hàm format số hiển thị (mặc định: số nguyên + suffix) */
  format?: (n: number) => string;
  /** Thời gian đếm (ms) */
  duration?: number;
  className?: string;
}

/** Đếm số tăng dần với easing — tôn trọng prefers-reduced-motion. */
export default function CountUp({ value, format, duration = 900, className = "" }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }
    const from = fromRef.current;
    if (from === value) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / Math.max(duration, 1));
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (value - from) * eased;
      setDisplay(current);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = format ? format(display) : Math.round(display).toLocaleString("vi-VN");
  return (
    <span className={className} aria-label={format ? format(value) : value.toLocaleString("vi-VN")}>
      {text}
    </span>
  );
}
