"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

interface WizardPageShellProps {
 backHref: string;
 backLabel: string;
 crumb: string;
 title: string;
 subtitle: string;
 children: React.ReactNode;
}

/**
 * Khung trang wizard dùng chung: header gọn + breadcrumb + container chuẩn
 * max-w-[1720px] px-[50px] theo quy chuẩn ui-design-consistency.
 */
export default function WizardPageShell({
 backHref,
 backLabel,
 crumb,
 title,
 subtitle,
 children,
}: WizardPageShellProps) {
 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
 {/* Slim header */}
 <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
 <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] py-3 flex items-center justify-between gap-3">
 <Link
 href="/"
 className="flex items-center gap-2 font-black text-lg tracking-tight text-slate-900 "
 >
 <span className="text-sky-800 ">Turf</span>Zone
 </Link>
 <Link
 href={backHref}
 aria-label={backLabel}
 className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all active:scale-95 whitespace-nowrap"
 >
 <ArrowLeft className="w-4 h-4 shrink-0" />
 <span className="hidden sm:inline">{backLabel}</span>
 </Link>
 </div>
 </header>

 <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-[50px] py-4 sm:py-8">
 <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
 {/* Breadcrumb */}
 <nav aria-label="Điều hướng" className="flex items-center gap-1.5 text-xs text-slate-500">
 <MapPin className="w-3.5 h-3.5" />
 <Link href="/" className="hover:underline font-semibold">Trang chủ</Link>
 <span aria-hidden>›</span>
 <Link href={backHref} className="hover:underline font-semibold">{backLabel.replace(/^←\s*/, "").replace(/^Quay lại\s*/i, "") || "Danh sách"}</Link>
 <span aria-hidden>›</span>
 <span className="font-bold text-sky-800 ">{crumb}</span>
 </nav>

 <div>
 <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
 {title}
 </h1>
 <p className="mt-1 text-xs sm:text-sm text-slate-500">{subtitle}</p>
 </div>

 {children}
 </div>
 </main>

 <footer className="border-t border-slate-200 py-4">
 <p className="text-center text-[11px] text-slate-600 ">
 © 2026 Turfzone — Đồ Án Tốt Nghiệp: Hệ thống quản lý sân bóng & giải đấu phủi.
 </p>
 </footer>
 </div>
 );
}
