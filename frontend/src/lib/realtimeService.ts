/**
 * SoccerHub Realtime Event Bus & Notification Service
 * Cung cấp khả năng đồng bộ đa tab, đa role tức thời (0 mili-giây)
 * giữa Cầu Thủ (User đặt sân) và Chủ Sân (Owner nhận thông báo).
 */

export interface RealtimeBookingEvent {
  type: "BOOKING_CREATED" | "BOOKING_CHECKED_IN" | "BOOKING_CANCELLED" | "OPERATING_HOURS_UPDATED";
  pitchId?: number | string;
  bookingId?: number | string;
  code?: string;
  customerName?: string;
  customerPhone?: string;
  courtName?: string;
  courtType?: string;
  timeSlot?: string;
  bookingDate?: string;
  totalPrice?: number;
  depositPaid?: number;
  via?: string;
  timestamp: number;
}

const CHANNEL_NAME = "soccerhub_realtime_channel";
const STORAGE_KEY = "soccerhub_realtime_last_event";

let broadcastChannel: BroadcastChannel | null = null;

// Khởi tạo BroadcastChannel an toàn trên môi trường trình duyệt
function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!broadcastChannel && "BroadcastChannel" in window) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn("BroadcastChannel không khả dụng, sử dụng fallback LocalStorage:", e);
    }
  }
  return broadcastChannel;
}

/**
 * Phát âm thanh chuông "Ting Ting" thông báo đơn hàng thời gian thực
 * Sử dụng Web Audio API tích hợp sẵn (không cần tải file mp3, không lo lỗi 404/CORS)
 */
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Nốt 1: 880Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Nốt 2: 1320Hz (E6) ngân vang
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.12);
    gain2.gain.setValueAtTime(0.35, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.warn("Không thể phát âm thanh thông báo:", err);
  }
}

/**
 * Phát sự kiện Realtime tới tất cả các Tab / Cửa sổ đang mở
 */
export function broadcastBookingEvent(event: Omit<RealtimeBookingEvent, "timestamp">) {
  if (typeof window === "undefined") return;

  const fullEvent: RealtimeBookingEvent = {
    ...event,
    timestamp: Date.now()
  };

  // 1. Gửi qua BroadcastChannel
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(fullEvent);
    } catch (e) {
      console.warn("Lỗi gửi BroadcastChannel:", e);
    }
  }

  // 2. Gửi qua localStorage làm fallback cross-tab
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullEvent));
  } catch (e) {
    // ignore quota error
  }
}

/**
 * Đăng ký lắng nghe sự kiện Realtime từ các Tab khác
 * Trả về hàm hủy đăng ký (cleanup)
 */
export function subscribeToBookingEvents(callback: (event: RealtimeBookingEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const ch = getChannel();

  // Handler cho BroadcastChannel
  const channelHandler = (ev: MessageEvent) => {
    if (ev.data && ev.data.type) {
      callback(ev.data);
    }
  };

  if (ch) {
    ch.addEventListener("message", channelHandler);
  }

  // Handler cho Storage Event (fallback khi mở cửa sổ mới hoặc tab khác)
  const storageHandler = (ev: StorageEvent) => {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue);
        if (parsed && parsed.type) {
          callback(parsed);
        }
      } catch (e) {
        // ignore parse error
      }
    }
  };

  window.addEventListener("storage", storageHandler);

  return () => {
    if (ch) {
      ch.removeEventListener("message", channelHandler);
    }
    window.removeEventListener("storage", storageHandler);
  };
}

/**
 * Tiện ích mở cửa sổ mới để chạy 2 Role cùng lúc
 * role = "OWNER" (Mở trang quản lý chủ sân)
 * role = "PLAYER" (Mở trang tìm & đặt sân của cầu thủ)
 */
export function openDualRoleWindow(role: "OWNER" | "PLAYER") {
  if (typeof window === "undefined") return;
  const baseUrl = window.location.origin;
  const targetUrl = role === "OWNER" 
    ? `${baseUrl}/?role=OWNER&tab=admin&sim=true`
    : `${baseUrl}/?role=PLAYER&tab=booking&sim=true`;
  
  window.open(targetUrl, "_blank");
}
