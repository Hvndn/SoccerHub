"use client";

import { useEffect, useState } from "react";
import PageSpinner from "@/components/PageSpinner";

/**
 * Cổng chờ tối thiểu 1 giây — đảm bảo mọi lần chuyển trang / chuyển trạng thái
 * đều có vòng xoay load nhìn thấy được, không bị nháy thoáng qua.
 *
 * Server Component không dùng được timer nên loading.tsx / BootSplash
 * đều render qua component này.
 */
export default function LoadingGate({
  minMs = 1000,
  label = "TurfZone",
  sub = "Đang tải dữ liệu…",
  className = "min-h-screen w-full",
  size = "md",
}: {
  minMs?: number;
  label?: string;
  sub?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
    const t = window.setTimeout(() => setShow(false), minMs);
    return () => window.clearTimeout(t);
  }, [minMs]);

  // Giữ vòng xoay trong HTML ban đầu để không có màn trắng trước khi hydrate
  if (!show) return null;

  return (
    <div className={className} role="status" aria-live="polite" aria-label={sub}>
      <PageSpinner size={size} label={label} sub={sub} className="h-full w-full" />
    </div>
  );
}