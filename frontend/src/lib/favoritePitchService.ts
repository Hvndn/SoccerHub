"use client";

/**
 * Dịch vụ Quản lý Cụm Sân Yêu Thích (Favorite Pitches Service)
 * Lưu trữ bền vững theo từng tài khoản người dùng và phát sự kiện đồng bộ toàn trang.
 */

const getStorageKey = (userId?: string | number | null): string => {
  if (userId) return `turfzone_fav_pitches_${userId}`;
  return "turfzone_fav_pitches_guest";
};

export function getFavoritePitchIds(userId?: string | number | null): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isFavoritePitch(pitchId: number | string, userId?: string | number | null): boolean {
  const pId = Number(pitchId);
  if (!pId) return false;
  const list = getFavoritePitchIds(userId);
  return list.includes(pId);
}

export function toggleFavoritePitch(
  pitchId: number | string,
  userId?: string | number | null
): { isFavorite: boolean; favorites: number[] } {
  if (typeof window === "undefined") return { isFavorite: false, favorites: [] };
  const pId = Number(pitchId);
  if (!pId) return { isFavorite: false, favorites: getFavoritePitchIds(userId) };

  const current = getFavoritePitchIds(userId);
  let updated: number[];
  let isFavorite: boolean;

  if (current.includes(pId)) {
    updated = current.filter((id) => id !== pId);
    isFavorite = false;
  } else {
    updated = [pId, ...current];
    isFavorite = true;
  }

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("turfzone_favorites_updated", {
        detail: { pitchId: pId, isFavorite, favorites: updated, userId },
      })
    );
  } catch (e) {
    console.error("Lỗi khi lưu sân yêu thích:", e);
  }

  return { isFavorite, favorites: updated };
}

export function subscribeFavorites(
  callback: (ids: number[]) => void,
  userId?: string | number | null
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    callback(getFavoritePitchIds(userId));
  };
  window.addEventListener("turfzone_favorites_updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("turfzone_favorites_updated", handler);
    window.removeEventListener("storage", handler);
  };
}

