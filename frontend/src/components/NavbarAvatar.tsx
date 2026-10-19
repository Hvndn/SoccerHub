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
 */
export default function NavbarAvatar({ user }: { user: { avatar?: string; fullName?: string } | null | undefined }) {
  const url = user ? resolveAvatarUrl(user.avatar) : null;
  if (url) {
    return (
      <SafeImage
        src={url}
        alt={user?.fullName || "avatar"}
        className="w-full h-full object-cover"
        fallbackLabel="avatar"
      />
    );
  }
  return <span>{(user?.avatar as string) || avatarInitials(user?.fullName)}</span>;
}
