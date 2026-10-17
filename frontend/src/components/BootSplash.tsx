"use client";

import { useEffect, useState } from "react";
import LoadingGate from "@/components/LoadingGate";

/**
 * Màn chờ hiện ngay từ HTML gửi về (server render) nên khi F5 / mở lại trang
 * người dùng thấy vòng xoay thay vì màn trắng trơn, trước cả khi React hydrate.
 * Giữ tối thiểu 1 giây rồi tự ẩn, không chặn thao tác.
 */
export default function BootSplash() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50">
      <LoadingGate minMs={1000} className="h-full w-full" />
    </div>
  );
}