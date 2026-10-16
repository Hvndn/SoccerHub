/**
 * Hệ thống thông báo nhỏ gọn, dùng chung cho toàn app.
 *
 * Vì sao không dùng `window.alert`: alert chặn người dùng phải bấm OK, giao diện
 * xấu và không đồng nhất với phần còn lại của app. Toast hiện góc phải, tự tắt.
 *
 * Cố ý KHÔNG dùng React Context để hàm tiện ích thuần (ví dụ ensureLoggedIn trong
 * lib/api.ts) cũng gọi được mà không cần truyền prop.
 */

export type ToastType = "ok" | "err" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  text: string;
}

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  const snapshot = items;
  listeners.forEach((fn) => fn(snapshot));
}

function push(type: ToastType, text: string) {
  if (!text) return;
  const item: ToastItem = { id: nextId++, type, text };
  // Giới hạn 3 thông báo cùng lúc để không che mất nội dung trang
  items = [...items, item].slice(-3);
  emit();
  const ttl = type === "err" ? 6000 : 3800;
  if (typeof window !== "undefined") {
    window.setTimeout(() => dismiss(item.id), ttl);
  }
}

export function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toastOk(text: string) {
  push("ok", text);
}

export function toastErr(text: string) {
  push("err", text);
}

export function toastInfo(text: string) {
  push("info", text);
}

export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  fn(items);
  return () => {
    listeners.delete(fn);
  };
}