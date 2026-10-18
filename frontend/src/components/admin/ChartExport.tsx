"use client";

import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { FileImage, FileText, Loader2, Download } from "lucide-react";
import { toastOk, toastErr } from "@/lib/toast";

/**
 * Nút xuất biểu đồ ra PNG hoặc PDF.
 *
 * <p>Kỹ thuật: `html-to-image` chuyển node DOM thành ảnh, sau đó
 * - PNG: tải trực tiếp ảnh đó xuống máy
 * - PDF: nhúng ảnh vào trang A4 ngang của jsPDF (chữ tiếng Việt giữ nguyên
 * vì đây là ảnh chứ không phải text).</p>
 */
export default function ChartExport({
  targetRef,
  filename,
  title,
}: {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
  title: string;
}) {
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);

  const grab = async (): Promise<string> => {
    const node = targetRef.current;
    if (!node) throw new Error("Không tìm thấy vùng biểu đồ để xuất.");
    // pixelRatio 2 -> ảnh sắc nét khi in
    return toPng(node, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      cacheBust: true,
    });
  };

  const doPng = async () => {
    setBusy("png");
    try {
      const dataUrl = await grab();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${filename}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toastOk("Đã xuất biểu đồ ra file PNG.");
    } catch (err: any) {
      toastErr(err?.message || "Không xuất được PNG.");
    } finally {
      setBusy(null);
    }
  };

  const doPdf = async () => {
    setBusy("pdf");
    try {
      const dataUrl = await grab();
      // A4 ngang: 297 x 210 mm
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;

      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text(title, margin, margin + 4);

      pdf.setFontSize(8);
      pdf.setTextColor(120, 130, 145);
      pdf.text(`SoccerHub · xuất lúc ${new Date().toLocaleString("vi-VN")}`, margin, margin + 9);

      // Giữ tỷ lệ khung hình, canh giữa
      const imgW = pageW - margin * 2;
      const imgH = pageH - margin * 2 - 14;
      const ratio = 297 / 210; // xấp xỉ khung A4 ngang
      let w = imgW;
      let h = imgW / ratio;
      if (h > imgH) {
        h = imgH;
        w = imgH * ratio;
      }
      const x = (pageW - w) / 2;
      const y = margin + 13;
      pdf.addImage(dataUrl, "PNG", x, y, w, h);
      pdf.save(`${filename}.pdf`);
      toastOk("Đã xuất biểu đồ ra file PDF.");
    } catch (err: any) {
      toastErr(err?.message || "Không xuất được PDF.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={doPng}
        disabled={busy !== null}
        title="Tải biểu đồ dạng ảnh PNG"
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0369a1] transition-all disabled:opacity-40 flex items-center gap-1 text-[11px] font-bold"
      >
        {busy === "png" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileImage className="w-3.5 h-3.5" />
        )}
        PNG
      </button>
      <button
        type="button"
        onClick={doPdf}
        disabled={busy !== null}
        title="Tải biểu đồ dạng PDF để in"
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0369a1] transition-all disabled:opacity-40 flex items-center gap-1 text-[11px] font-bold"
      >
        {busy === "pdf" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5" />
        )}
        PDF
      </button>
    </div>
  );
}