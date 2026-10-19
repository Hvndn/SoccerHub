/**
 * Trạng thái kết nối tới máy chủ Turfzone.
 *
 * <p>Khi backend sập (Railway restart, mất mạng, database chết...), mọi lời gọi
 * API đều ném lỗi kiểu `Failed to fetch` và từng màn hình hiện vòng xoay mãi hoặc
 * những toast rời rạc khó hiểu. Module này gom trạng thái về một chỗ để hiển thị
 * đúng một thông báo toàn cục, kèm nút thử lại.</p>
 *
 * <p>Nguyên tắc: KHÔNG chặn gì cả — mọi API vẫn hoạt động bình thường khi máy chủ
 * sống. Đây chỉ là lớp báo trạng thái, không can thiệp luồng dữ liệu.</p>
 */

import { API_BASE_URL } from "@/lib/api";

export interface BackendStatus {
  /** Máy chủ có phản hồi hay không. */
  reachable: boolean;
  /** Đang chủ động kiểm tra (hiển thị spinner trên nút thử lại). */
  checking: boolean;
  /** Thời điểm kiểm tra gần nhất. */
  lastCheckedAt: number | null;
  /** Mô tả lỗi thân thiện, null khi ổn. */
  message: string | null;
}

type Listener = (status: BackendStatus) => void;

const INITIAL: BackendStatus = {
  reachable: true,
  checking: false,
  lastCheckedAt: null,
  message: null,
};

let status: BackendStatus = INITIAL;
const listeners = new Set<Listener>();

function emit() {
  // Copy trước khi gọi để listener tự unsubscribe trong lúc chạy không làm hỏng vòng lặp.
  for (const fn of Array.from(listeners)) fn(status);
}

export function getBackendStatus(): BackendStatus {
  return status;
}

/** Đăng ký theo dõi. Trả về hàm hủy đăng ký. */
export function subscribeBackendStatus(fn: Listener): () => void {
  listeners.add(fn);
  fn(status);
  return () => {
    listeners.delete(fn);
  };
}

export function markBackendReachable() {
  const now = Date.now();
  if (status.reachable && !status.checking) return;
  status = { reachable: true, checking: false, lastCheckedAt: now, message: null };
  emit();
}

export function markBackendUnreachable(message: string) {
  const now = Date.now();
  if (!status.reachable && status.message === message) return;
  status = { reachable: false, checking: false, lastCheckedAt: now, message };
  emit();
}

/** Chủ động kiểm tra máy chủ. Dùng cho nút "Thử lại" và lúc vừa vào trang. */
export async function probeBackend(timeoutMs = 6000): Promise<boolean> {
  status = { ...status, checking: true };
  emit();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.ok) {
      markBackendReachable();
      return true;
    }
    markBackendUnreachable(`Máy chủ phản hồi lỗi ${res.status}. Hãy thử lại sau ít phút.`);
    return false;
  } catch {
    markBackendUnreachable(
      "Không kết nối được tới máy chủ Turfzone. Hệ thống có thể đang bảo trì hoặc mất kết nối."
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}