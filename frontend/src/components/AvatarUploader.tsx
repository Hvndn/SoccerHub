"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2, ImagePlus } from "lucide-react";
import { toastOk, toastErr } from "@/lib/toast";
import { uploadChatFile } from "@/lib/groupChat";

/**
 * Nút "tải ảnh từ máy" dùng chung cho avatar (Chủ Sân & Cầu Thủ).
 *
 * Luồng: chọn file ảnh --> POST /api/v1/chat/upload (backend đã hỗ trợ image/*,
 * max 10MB) --> nhận về fileUrl --> component cha gán vào ô Ảnh Đại Diện rồi
 * bấm Lưu để giữ như ảnh hồ sơ.
 *
 * Dùng lại endpoint chat vì dự án này chỉ có 1 nơi lưu file; production nên tách
 * thành dịch vụ riêng (S3/Cloudinary).
 */
interface AvatarUploaderProps {
  /** Được gọi khi upload thành công với URL đầy đủ của ảnh. */
  onUploaded: (url: string) => void;
  /** Nhãn nút, mặc định "Chọn ảnh từ máy". */
  label?: string;
  /** Kiểu compact (gọn hơn cho form rộng). */
  compact?: boolean;
}

const ACCEPTED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader({ onUploaded, label = "Chọn ảnh từ máy", compact = false }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // reset để chọn lại cùng một file không bị chặn.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_IMAGE_MIME.includes(file.type)) {
      toastErr("Chỉ chấp nhận ảnh JPG / PNG / WEBP / GIF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastErr("Ảnh quá lớn (tối đa 10MB).");
      return;
    }

    setIsUploading(true);
    uploadChatFile(file)
      .then((res) => {
        onUploaded(res.fileUrl);
        toastOk("Đã tải ảnh lên. Bấm Lưu Thay Đổi để giữ làm ảnh hồ sơ.");
      })
      .catch((err: any) => {
        const msg = err?.message || "Tải ảnh lên thất bại.";
        toastErr(msg);
      })
      .finally(() => setIsUploading(false));
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_MIME.join(",")}
        className="hidden"
        onChange={handleFilePick}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={(e) => {
          e.preventDefault();
          fileInputRef.current?.click();
        }}
        className={`inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 text-sky-800 font-bold text-[13px] hover:bg-sky-100 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer ${
          compact ? "px-3 py-1.5" : "px-4 py-2.5"
        }`}
        title="Chọn ảnh từ máy (JPG/PNG/WEBP, tối đa 10MB)"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        ) : compact ? (
          <ImagePlus className="w-4 h-4 shrink-0" />
        ) : (
          <Upload className="w-4 h-4 shrink-0" />
        )}
        <span>{isUploading ? "Đang tải ảnh…" : label}</span>
      </button>
    </>
  );
}
