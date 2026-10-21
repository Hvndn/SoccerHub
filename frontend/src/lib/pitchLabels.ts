/**
 * Nhãn tiếng Việt cho mã loại sân.
 *
 * <p>Trong CSDL, loại sân lưu dưới dạng mã kỹ thuật (SAN_5 / SAN_7 / SAN_11 / FUTSAL).
 * Hiển thị thẳng mã ra UI trông như lỗi dữ liệu, nên mọi nơi hiện loại sân đều đi qua
 * {@link pitchTypeLabel} để ra "Sân 5" / "Sân 7" / "Sân 11" / "Futsal".</p>
 */
export const PITCH_TYPE_LABEL: Record<string, string> = {
  SAN_5: "Sân 5",
  SAN_7: "Sân 7",
  SAN_11: "Sân 11",
  SAN_5_FUTSAL: "Sân 5 Futsal",
  FUTSAL: "Futsal",
  PITCH_5: "Sân 5",
  PITCH_7: "Sân 7",
  PITCH_11: "Sân 11",
};

/** Trả về nhãn tiếng Việt của mã loại sân; nếu không có trong bảng thì giữ nguyên giá trị. */
export const pitchTypeLabel = (v?: string | null): string => {
  if (!v) return "";
  const key = String(v).trim().toUpperCase();
  return PITCH_TYPE_LABEL[key] ?? String(v);
};

/**
 * Ca giờ vàng (cao điểm): xét theo GIỜ BẮT ĐẦU của ca (17h/18h/19h).
 *
 * <p>Khớp với {@code isPeakStart} của backend. Trước đây frontend dùng
 * {@code includes("17:30")} / {@code includes("19:00")} nên bỏ sót ca 18:00-20:00
 * (giờ vàng chuẩn) và lệch với giá backend.</p>
 */
export const isPeakSlot = (time?: string | null): boolean => {
  if (!time) return false;
  const head = String(time).trim().split("-")[0].trim();
  const hour = Number.parseInt(head.split(":")[0]?.trim() ?? "", 10);
  return Number.isFinite(hour) && hour >= 17 && hour <= 19;
};
