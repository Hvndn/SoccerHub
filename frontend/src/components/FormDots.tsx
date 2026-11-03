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
  emptyClassName = "text-[14px] font-bold text-slate-600",
}: {
 form?: string | null;
 size?: "sm" | "md";
 showEmpty?: boolean;
  emptyClassName?: string;
}) {
 const chars = (form || "").toUpperCase().slice(0, 5).split("");
 if (chars.length === 0) {
 if (!showEmpty) return null;
 return <span className={emptyClassName}>Chưa có lịch sử</span>;
 }
 // Chữ tối thiểu 13px theo quy ước UI của dự án: hộp "sm" nới lên 18px để chữ 13px vẫn vừa.
 const dot = size === "sm" ? "w-[18px] h-[18px] text-[14px]" : "w-5 h-5 text-[14px]";
 const color = (c: string) =>
 c === "W"
 ? "bg-emerald-700 text-white"
 : c === "D"
 ? "bg-slate-500 text-white"
 : "bg-rose-600 text-white";
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
