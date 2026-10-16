"use client";

import React from "react";

/**
 * Chuỗi phong độ 5 trận gần nhất (W/D/L, ký tự đầu = trận mới nhất).
 * Ví dụ "WWDLW". Đội chưa đá trận nào thì hiện dấu gạch.
 */
export default function FormDots({
  form,
  size = "md",
  showEmpty = true,
}: {
  form?: string | null;
  size?: "sm" | "md";
  showEmpty?: boolean;
}) {
  const chars = (form || "").toUpperCase().slice(0, 5).split("");
  if (chars.length === 0) {
    if (!showEmpty) return null;
    return <span className="text-[10px] font-bold text-slate-500">Chưa có lịch sử</span>;
  }
  const dot = size === "sm" ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[9px]";
  const color = (c: string) =>
    c === "W"
      ? "bg-emerald-500 text-white"
      : c === "D"
        ? "bg-slate-400 dark:bg-slate-500 text-white"
        : "bg-rose-500 text-white";
  return (
    <span className="inline-flex items-center gap-1" title={`Phong độ 5 trận: ${chars.join("")}`}>
      {chars.map((c, i) => (
        <span
          key={i}
          className={`${dot} ${color(c)} rounded-full flex items-center justify-center font-black`}
        >
          {c === "W" ? "T" : c === "D" ? "H" : "B"}
        </span>
      ))}
    </span>
  );
}
