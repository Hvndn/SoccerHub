/**
 * Chuẩn hóa hình ảnh & thông số trực quan cho từng loại sân con
 * Phục vụ tính năng Hover xem trước ảnh sân tại Trang Đặt Sân & Trang Chủ Sân
 */

export interface PitchVisualInfo {
  type: 'SAN_5' | 'SAN_7' | 'SAN_11' | 'FUTSAL';
  label: string;
  shortLabel: string;
  dimensions: string;
  surface: string;
  bestFor: string;
  imageUrl: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export function getPitchVisual(typeName?: string): PitchVisualInfo {
  const t = (typeName || "").toLowerCase();

  if (t.includes("futsal") || t.includes("trong nhà") || t.includes("sàn gỗ")) {
    return {
      type: "FUTSAL",
      label: "Sân Futsal Trong Nhà",
      shortLabel: "Futsal",
      dimensions: "20m x 40m",
      surface: "Sàn vinyl / gỗ chống trơn cao cấp",
      bestFor: "5 người mỗi đội • Bóng số 4 độ nảy thấp",
      imageUrl: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=800&q=80",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      badgeBorder: "border-purple-200"
    };
  }

  if (t.includes("11") || t.includes("lớn") || t.includes("tiêu chuẩn")) {
    return {
      type: "SAN_11",
      label: "Sân Thi Đấu 11 Người",
      shortLabel: "Sân 11",
      dimensions: "68m x 105m (Chuẩn FIFA)",
      surface: "Cỏ tự nhiên & cỏ nhân tạo chuyên nghiệp",
      bestFor: "11 người mỗi đội • Trận cầu đinh & giải lớn",
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
      badgeBg: "bg-indigo-50",
      badgeText: "text-indigo-700",
      badgeBorder: "border-indigo-200"
    };
  }

  if (t.includes("7") || t.includes("phủi") || t.includes("san 7") || t.includes("sân 7")) {
    return {
      type: "SAN_7",
      label: "Sân Cỏ Phủi 7 Người",
      shortLabel: "Sân 7",
      dimensions: "30m x 50m (Khung thành 6m)",
      surface: "Cỏ nhân tạo 50mm chống lật cổ chân",
      bestFor: "7 người mỗi đội • Kèo giao lưu & giải đấu phủi",
      imageUrl: "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=800&q=80",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      badgeBorder: "border-emerald-200"
    };
  }

  // Mặc định: Sân 5 người
  return {
    type: "SAN_5",
    label: "Sân Mini 5 Người",
    shortLabel: "Sân 5",
    dimensions: "20m x 40m (Khung thành 3m)",
    surface: "Cỏ nhân tạo hạt cao su êm ái",
    bestFor: "5 người mỗi đội • Tốc độ cao & phối hợp ban bật",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    badgeBg: "bg-sky-50",
    badgeText: "text-[#0369a1]",
    badgeBorder: "border-sky-200"
  };
}

export interface SamplePitchPhoto {
  label: string;
  category: 'overview' | 'san5' | 'san7' | 'san11' | 'futsal' | 'night' | 'facility';
  url: string;
}

export const SAMPLE_PITCH_PHOTOS: SamplePitchPhoto[] = [
  { label: 'Toàn cảnh cụm sân', category: 'overview', url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Góc chụp flycam', category: 'overview', url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Đèn LED rực sáng ban đêm', category: 'night', url: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Mặt cỏ Sân 5 mini', category: 'san5', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Sân 7 cỏ nhân tạo', category: 'san7', url: 'https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Sân 11 người chuẩn FIFA', category: 'san11', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Sàn Futsal trong nhà', category: 'futsal', url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Khán đài & Ghế ngồi', category: 'facility', url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Phòng thay đồ & Căn tin', category: 'facility', url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80' },
];

