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
  cancelReason?: string;
  cancelledBy?: "OWNER" | "PLAYER" | "SYSTEM";
  timestamp: number;
}

const CHANNEL_NAME = "soccerhub_realtime_channel";
const STORAGE_KEY = "soccerhub_realtime_last_event";
const CUSTOM_EVENT_NAME = "soccerhub:booking_event";

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
 * Phát sự kiện Realtime tới tất cả các Tab / Cửa sổ đang mở VÀ cả tab hiện tại
 */
export function broadcastBookingEvent(event: Omit<RealtimeBookingEvent, "timestamp">) {
  if (typeof window === "undefined") return;

  const fullEvent: RealtimeBookingEvent = {
    ...event,
    timestamp: Date.now()
  };

  // 1. Phát trên CÙNG TAB (Same-Tab Delivery qua CustomEvent)
  try {
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: fullEvent }));
  } catch (e) {
    console.warn("Lỗi phát CustomEvent nội bộ:", e);
  }

  // 2. Gửi qua BroadcastChannel (Đa Tab)
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(fullEvent);
    } catch (e) {
      console.warn("Lỗi gửi BroadcastChannel:", e);
    }
  }

  // 3. Gửi qua localStorage làm fallback cross-tab
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullEvent));
  } catch (e) {
    // ignore quota error
  }
}

/**
 * Đăng ký lắng nghe sự kiện Realtime (cả cùng Tab và các Tab khác)
 * Trả về hàm hủy đăng ký (cleanup)
 */
export function subscribeToBookingEvents(callback: (event: RealtimeBookingEvent) => void): () => void {
  if (typeof window === "undefined") return () => {};

  // 1. Handler cho CÙNG TAB (CustomEvent)
  const customEventHandler = (ev: Event) => {
    const detail = (ev as CustomEvent<RealtimeBookingEvent>).detail;
    if (detail && detail.type) {
      callback(detail);
    }
  };
  window.addEventListener(CUSTOM_EVENT_NAME, customEventHandler);

  // 2. Handler cho BroadcastChannel (Đa tab)
  const ch = getChannel();
  const channelHandler = (ev: MessageEvent) => {
    if (ev.data && ev.data.type) {
      callback(ev.data);
    }
  };

  if (ch) {
    ch.addEventListener("message", channelHandler);
  }

  // 3. Handler cho Storage Event (fallback khi mở cửa sổ mới hoặc tab khác)
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
    window.removeEventListener(CUSTOM_EVENT_NAME, customEventHandler);
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
