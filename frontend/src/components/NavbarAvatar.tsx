"use client";

import React from "react";
import SafeImage from "@/components/SafeImage";
import { resolveAvatarUrl, avatarInitials } from "@/lib/avatar";

/**
 * Chữ cái avatar trong Navbar — hỗ trợ cả ảnh upload.
 *
 * Trước đây navbar chỉ render text trong `user.avatar` (dù đó là link ảnh
 * "/api/v1/chat/files/xxx.png" sau khi tải ảnh từ máy), trông vỡ hình. Giờ nếu
 * là ảnh thì render SafeImage, không thì chữ viết tắt như cũ.
 *
 * Ảnh upload có thể mất (thư mục uploads trên Railway là tạm) nên khi tải lỗi
 * phải rơi về chữ viết tắt, không hiện biểu tượng "ảnh vỡ".
 */
export default function NavbarAvatar({ user }: { user: { avatar?: string; fullName?: string } | null | undefined }) {
  const url = user ? resolveAvatarUrl(user.avatar) : null;
  if (url) {
    return (
      <SafeImage
        src={url}
        alt={user?.fullName || "avatar"}
        className="w-full h-full object-cover"
        fallback={
          <span className="w-full h-full flex items-center justify-center font-black bg-sky-100 text-sky-800">
            {avatarInitials(user?.fullName)}
          </span>
        }
      />
    );
  }
  return <span>{(user?.avatar as string) || avatarInitials(user?.fullName)}</span>;
}
