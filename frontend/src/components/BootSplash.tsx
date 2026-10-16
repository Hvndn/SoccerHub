"use client";

import { useEffect, useState } from "react";
import PageSpinner from "@/components/PageSpinner";

/**
 * Màn chờ hiện ngay từ HTML gửi về (server render) nên khi F5 / mở lại trang
 * người dùng thấy vòng xoay thay vì màn trắng trơn, trước cả khi React hydrate.
 * Sau khi React mount xong thì tự ẩn đi, không chặn thao tác.
 */
export default function BootSplash() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (mounted) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 dark:bg-slate-950">
      <PageSpinner className="h-full w-full" />
    </div>
  );
}