"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EmptyState } from "./AdminUI";

export interface AdminColumn<T> {
 key: string;
 header: string;
 sortable?: boolean;
 render: (row: T) => React.ReactNode;
 sortValue?: (row: T) => string | number | null | undefined;
 className?: string;
}

interface AdminTableProps<T> {
 rows: T[];
 columns: AdminColumn<T>[];
 rowKey: (row: T, idx: number) => string | number;
 searchPlaceholder?: string;
 searchFilter?: (row: T, q: string) => boolean;
 pageSize?: number;
 emptyTitle: string;
 emptyHint?: string;
 loading?: boolean;
}

export default function AdminTable<T>({
 rows,
 columns,
 rowKey,
 searchPlaceholder = "Lọc trong bảng…",
 searchFilter,
 pageSize = 10,
 emptyTitle,
 emptyHint,
 loading = false,
}: AdminTableProps<T>) {
 const [query, setQuery] = useState("");
 const [page, setPage] = useState(0);
 const [sortKey, setSortKey] = useState<string | null>(null);
 const [sortDir, setSortDir] = useState<1 | -1>(1);

 const filtered = useMemo(() => {
 const q = query.trim().toLowerCase();
 let list = !q || !searchFilter ? rows : rows.filter((r) => searchFilter(r, q));
 if (sortKey) {
 const col = columns.find((c) => c.key === sortKey);
 if (col?.sortValue) {
 const sv = col.sortValue;
 list = [...list].sort((a, b) => {
 const va = sv(a) ?? "";
 const vb = sv(b) ?? "";
 if (typeof va === "number" && typeof vb === "number") return (va - vb) * sortDir;
 return String(va).localeCompare(String(vb), "vi") * sortDir;
 });
 }
 }
 return list;
 }, [rows, query, searchFilter, sortKey, sortDir, columns]);

 const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
 const safePage = Math.min(page, totalPages - 1);
 const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

 const toggleSort = (col: AdminColumn<T>) => {
 if (!col.sortable) return;
 if (sortKey !== col.key) {
 setSortKey(col.key);
 setSortDir(1);
 } else {
 setSortDir((d) => (d === 1 ? -1 : 1));
 }
 setPage(0);
 };

 return (
 <div className="space-y-3">
 <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
 <div className="relative flex-1">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input
 type="search"
 aria-label="Tìm kiếm trong bảng"
 value={query}
 onChange={(e) => {
 setQuery(e.target.value);
 setPage(0);
 }}
 placeholder={searchPlaceholder}
 className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>
 <span className="text-[13px] font-mono text-slate-500 whitespace-nowrap">
 {filtered.length} dòng
 </span>
 </div>

 <div className="overflow-x-auto -mx-1 px-1 rounded-xl border border-slate-200 ">
 <table className="w-full text-[13px] border-collapse min-w-[720px] bg-white ">
 <thead>
 <tr className="text-left text-[13px] tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50/60 ">
 {columns.map((col, ci) => (
 <th key={col.key} scope="col" className={`py-2.5 px-2 sm:px-3 font-bold whitespace-nowrap ${col.className ?? ""} ${ci === 0 ? "sticky left-0 bg-slate-50 z-10" : ""}`}>
 {col.sortable ? (
 <button
 type="button"
 onClick={() => toggleSort(col)}
 aria-label={`Sắp xếp theo ${col.header}`}
 className="inline-flex items-center gap-1 hover:text-sky-800 transition-colors"
 >
 <span>{col.header}</span>
 {sortKey !== col.key ? (
 <ArrowUpDown className="w-3 h-3 opacity-50" />
 ) : sortDir === 1 ? (
 <ArrowUp className="w-3 h-3 text-sky-700" />
 ) : (
 <ArrowDown className="w-3 h-3 text-sky-700" />
 )}
 </button>
 ) : (
 col.header
 )}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {loading ? (
 [0, 1, 2, 3, 4].map((i) => (
 <tr key={i} className="border-b border-slate-100 ">
 <td colSpan={columns.length} className="py-2 px-3">
 <div className="skeleton-shimmer h-4 w-full rounded-lg" />
 </td>
 </tr>
 ))
 ) : pageRows.length === 0 ? (
 <tr>
 <td colSpan={columns.length} className="py-4">
 <EmptyState title={query ? "Không khớp từ khóa tìm kiếm." : emptyTitle} hint={query ? "Thử từ khóa khác hoặc xóa bộ lọc." : emptyHint} />
 </td>
 </tr>
 ) : (
 pageRows.map((row, idx) => (
 <tr key={rowKey(row, idx)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
 {columns.map((col, ci) => (
 <td key={col.key} className={`py-2.5 px-2 sm:px-3 align-middle ${col.className ?? ""} ${ci === 0 ? "sticky left-0 bg-white z-10" : ""}`}>
 {col.render(row)}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {totalPages > 1 && (
 <div className="flex items-center justify-between">
 <span className="text-[13px] text-slate-500 font-semibold">
 Trang {safePage + 1}/{totalPages}
 </span>
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 aria-label="Trang trước"
 disabled={safePage === 0}
 onClick={() => setPage((p) => Math.max(0, p - 1))}
 className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 <button
 type="button"
 aria-label="Trang sau"
 disabled={safePage >= totalPages - 1}
 onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
 className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
