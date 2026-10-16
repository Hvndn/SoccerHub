/**
 * Tiện ích ngày giờ theo MÚI GIỜ LOCAL của máy người dùng.
 *
 * Vì sao cần: `new Date().toISOString()` trả về ngày theo **giờ UTC**.
 * Ở Việt Nam (UTC+7) sau 17:00 giờ local, toISOString() sẽ trả về **ngày hôm trước**,
 * khiến logic "hôm nay còn ca trống không?" / "vé đã qua chưa?" bị lệch 1 ngày.
 * Backend cũng lưu ngày theo giờ local (LocalDate.now()) nên frontend phải
 * dùng cùng cách tính để khớp.
 */

/** Ngày hôm nay dạng YYYY-MM-DD theo giờ local (không phải UTC). */
export function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ngày hôm nay cộng thêm `offset` ngày (offset âm = quá khứ), định dạng YYYY-MM-DD. */
export function todayLocalPlus(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** So sánh 2 chuỗi ngày YYYY-MM-DD (đều theo giờ local). */
export function isPastDay(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return String(dateStr).slice(0, 10) < todayLocal();
}