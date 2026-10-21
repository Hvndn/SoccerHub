/**
 * URL backend: ưu tiên biến môi trường, nếu thiếu thì tự chọn theo môi trường chạy
 * (production -> service thật, dev -> localhost) để không bao giờ rơi vào localhost
 * trên bản đã deploy — tránh lỗi "failed to fetch".
 */
import { toastInfo } from '@/lib/toast';
const PROD_API_BASE_URL = 'https://soccerhub-backend-core-production.up.railway.app';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PROD_API_BASE_URL : 'http://localhost:8080');

/**
 * Gọi API backend qua URL đã cấu hình (không hardcode localhost).
 * Dùng cho các chỗ gọi fetch trực tiếp ngoài apiRequest().
 */
export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(role?: string): string | null {
  if (typeof window === 'undefined') return null;
  const key = role ? `Turfzone_token_${role}` : 'Turfzone_token';
  return sessionStorage.getItem(key);
}

export function setAuthToken(token: string, role?: string) {
  if (typeof window !== 'undefined') {
    // Luôn lưu key mặc định để apiRequest/Default caller hoạt động
    sessionStorage.setItem('Turfzone_token', token);
    // Nếu có role thì lưu thêm key có role cho truy cập tab-specific
    if (role) {
      sessionStorage.setItem(`Turfzone_token_${role}`, token);
    }
  }
}

export function removeAuthToken(role?: string) {
  if (typeof window !== 'undefined') {
    const key = role ? `Turfzone_token_${role}` : 'Turfzone_token';
    sessionStorage.removeItem(key);
  }
}

/**
 * Chặn ngay ở phía giao diện trước khi gọi endpoint bắt buộc đăng nhập.
 * Nếu không chặn, server trả 401 và người dùng chỉ thấy một thông báo lỗi kỹ thuật
 * khó hiểu. Trả về true nghĩa là đã đăng nhập, được phép gọi tiếp.
 */
export function ensureLoggedIn(action = 'thực hiện thao tác này'): boolean {
  if (getAuthToken()) return true;
  toastInfo(`Bạn cần đăng nhập để ${action}. Bấm nút "Đăng Nhập" ở góc trên bên phải nhé.`);
  return false;
}

/**
 * Gọi fetch và cập nhật trạng thái kết nối máy chủ.
 *
 * <p>Khi fetch ném lỗi (mất mạng / máy chủ sập) thì thay vì đẩy nguyên chuỗi
 * `TypeError: Failed to fetch` lên từng màn hình, ta ghi nhận trạng thái mất
 * kết nối để hiện thông báo toàn cục và ném lỗi thân thiện hơn.</p>
 *
 * <p>Hàm này import động module trạng thái để tránh vòng phụ thuộc
 * (backendStatus cần API_BASE_URL từ đây).</p>
 */
/** Thời gian chờ mặc định cho một lời gọi API (mili-giây). */
export const API_TIMEOUT_MS = 15000;

/**
 * fetch CÓ timeout.
 *
 * <p>Lý do tồn tại: khi backend treo (Railway đang restart, MySQL chết khiến app
 * chờ rồi báo lỗi) thì `fetch()` của trình duyệt không hề reject — nó treo tới
 * khi TCP timeout của hệ điều hành, có thể hàng chục giây tới vài phút. Kết quả
 * là `try/catch/finally` không bao giờ chạy tới `finally`, màn hình kẹt vòng
 * xoay vĩnh viễn và người dùng không hiểu chuyện gì xảy ra.</p>
 *
 * <p>Hết thời gian thì hủy request và ném lỗi có thông điệp rõ ràng, để phần
 * gọi xử lý được bằng `catch` + `finally` như bình thường.</p>
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Giữ tín hiệu abort từ bên ngoài nếu có.
  const external = options.signal;
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error(
        'Máy chủ phản hồi quá chậm. Vui lòng kiểm tra kết nối hoặc thử lại sau.'
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * fetch + đánh dấu trạng thái backend (reachable / unreachable).
 *
 * <p>Dùng thay cho {@link fetchWithTimeout} ở các nơi cần banner "mất kết nối máy chủ"
 * hiện toàn cục. Mọi lời gọi qua {@link apiRequest} đã tự đánh dấu; các module gọi
 * fetch trực tiếp (ví dụ danh sách giải đấu dùng response tĩnh) nên dùng hàm này.</p>
 */
export async function fetchWithStatus(url: string, options: RequestInit): Promise<Response> {
  let statusMod: typeof import('@/lib/backendStatus');
  try {
    statusMod = await import('@/lib/backendStatus');
  } catch {
    statusMod = null as any;
  }

  try {
    // Dùng fetchWithTimeout để MỌI lời gọi API đều bị chặn trần thời gian. Trước đây
    // gọi fetch() trần nên khi backend treo, request đứng im tới lúc TCP tự hết hạn
    // (hàng chục giây → vài phút) — khiến trang "Khởi tạo hồ sơ cầu thủ" quay rất lâu.
    const res = await fetchWithTimeout(url, options);
    // Máy chủ trả lỗi HTTP vẫn là "sống" (chỉ là endpoint lỗi) — đánh dấu online.
    statusMod?.markBackendReachable();
    return res;
  } catch (e: any) {
    statusMod?.markBackendUnreachable(
      'Không kết nối được tới máy chủ Turfzone. Hệ thống có thể đang bảo trì hoặc mất kết nối.'
    );
    // Giữ thông điệp timeout rõ ràng của fetchWithTimeout; các lỗi khác thì thay
    // bằng câu thân thiện để không lộ chi tiết kỹ thuật.
    const msg = String(e?.message || '');
    if (msg.includes('quá chậm')) throw e;
    throw new Error('Không kết nối được tới máy chủ. Vui lòng thử lại sau ít phút.');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Mobile-friendly fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Important for cookies/auth on mobile Safari
    cache: 'no-store', // Prevent caching issues on mobile
  };

  const response = await fetchWithStatus(url, fetchOptions);

  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    // Backend trả "message" ở hầu hết endpoint, nhưng một số endpoint (đăng ký đội,
    // duyệt lệ phí...) dùng key "error" -> đọc cả hai để không mất thông điệp gốc.
    const errorMessage =
      data?.message || data?.error || `Lỗi yêu cầu: ${response.status} ${response.statusText}`;
    // Gắn mã HTTP vào Error để tầng gọi phân biệt "máy chủ từ chối phiên" (401/403)
    // với "không kết nối được" (timeout/mất mạng) — tránh xoá token oan khi backend chết.
    const err: any = new Error(errorMessage);
    err.status = response.status;
    throw err;
  }

  return data as T;
}
