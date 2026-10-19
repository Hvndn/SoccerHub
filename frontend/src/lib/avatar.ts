import { API_BASE_URL } from "@/lib/api";

/**
 * Biến giá trị avatar người dùng thành URL trình duyệt tải được.
 *
 * Dữ liệu avatar hiện có 3 dạng:
 * - "http(s)://..." hoặc "data:..."  -> dùng nguyên.
 * - "/api/v1/chat/files/xxx.png"     -> đường dẫn tương đối do upload qua backend
 *   (POST /api/v1/chat/upload), phải gắn thêm API_BASE_URL.
 * - "TS", "PL", "SH"...              -> chữ viết tắt do seed/đặt tay, KHÔNG phải ảnh.
 *
 * Trả về null nếu không phải URL ảnh thật (nơi gọi sẽ render chữ viết tắt thay thế).
 */
export function resolveAvatarUrl(avatar?: string | null): string | null {
  if (!avatar) return null;
  const value = avatar.trim();
  if (/^(https?:|data:)/i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return null;
}

/** Chữ viết tắt từ họ tên ("Trần Thị Chủ Sân" -> "TS" theo tên đầu + cuối). */
export function avatarInitials(fullName?: string | null, fallback = "SH"): string {
  if (!fullName) return fallback;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
}
