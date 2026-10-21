"use client";

import React, { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
 /** Nhãn hiện trên khung placeholder khi ảnh không tải được */
 fallbackLabel?: string;
};

/**
 * <img> có ảnh dự phòng.
 *
 * Trước đây mọi ảnh đều render thẳng; khi URL hỏng (ảnh sân bị xóa trên hosting,
 * link Unsplash hết hạn, mạng yếu) trình duyệt hiện đúng biểu tượng "ảnh vỡ" —
 * trông như lỗi ứng dụng khi thực ra chỉ là ảnh không tải được.
 */
export default function SafeImage({ src, alt, className = "", fallbackLabel, ...rest }: SafeImageProps) {
 const [failed, setFailed] = useState(false);

 // Đổi sang ảnh khác thì thử lại từ đầu
 useEffect(() => {
 setFailed(false);
 }, [src]);

 if (!src || failed) {
 return (
 <div
 role="img"
 aria-label={alt || "Ảnh không tải được"}
 className={`${className} flex flex-col items-center justify-center gap-1.5 bg-slate-100 text-slate-500`}
 >
 <ImageOff className="w-6 h-6 shrink-0" />
 <span className="text-[13px] font-bold text-center px-2 leading-tight">
 {fallbackLabel || alt || "Ảnh không tải được"}
 </span>
 </div>
 );
 }

 return (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} {...rest} />
 );
}