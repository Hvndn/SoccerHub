"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toastInfo } from "./toast";

/* =========================================================
 * Push notification — báo "có tin nhắn mới" khi người dùng
 * đang ở tab khác hoặc màn hình khác.
 *
 * Cơ chế:
 *  - Dùng Notification API của trình duyệt (không cần server push).
 *  - Chỉ bật thông báo khi người dùng đã cấp quyền.
 *  - Chặn thông báo trùng: mỗi bản tin chỉ báo 1 lần, và chỉ báo
 *    khi document đang ẩn (đang ở tab khác).
 * ========================================================= */

const SEEN_KEY = "shub_chat_last_notified_id";

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isPushSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/** Hiển thị 1 thông báo. */
function show(title: string, body: string, onClick?: () => void): void {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  // Không báo khi đang nhìn chính trang đó
  if (typeof document !== "undefined" && !document.hidden) return;

  try {
    const n = new Notification(title, {
      body,
      tag: "shub-chat",
      icon: "/turfzone-logo.png",
      badge: "/turfzone-logo.png",
      lang: "vi-VN",
    });
    n.onclick = () => {
      try { window.focus(); } catch {}
      onClick?.();
      n.close();
    };
    setTimeout(() => n.close(), 8000);
  } catch {
    /* bỏ qua */
  }
}

export interface NewMessageInfo {
  id: number;
  senderName: string;
  /** Email người gửi — dùng để không báo cho chính mình. */
  senderEmail?: string;
  content: string;
  /** Nhóm/kênh để khi bấm vào thông báo thì mở đúng chỗ. */
  where?: string;
}

/**
 * Hook theo dõi danh sách tin nhắn và bật thông báo khi có tin mới
 * mà người dùng chưa đọc (đang ở tab khác).
 */
export function useChatPushNotification(
  enabled: boolean,
  messages: NewMessageInfo[],
  myEmail: string,
  onOpen?: () => void
) {
  const lastId = useRef<number>(0);
  const primed = useRef(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
    setPermission(pushPermission());
  }, []);

  // Đọc mốc đã báo từ localStorage để không báo lại tin cũ sau khi F5
  useEffect(() => {
    const saved = Number(localStorage.getItem(SEEN_KEY) || 0);
    lastId.current = Number.isFinite(saved) ? saved : 0;
  }, []);

  const requestPermission = useCallback(async () => {
    const p = await requestPushPermission();
    setPermission(p);
    if (p === "granted") {
      toastInfo("Đã bật thông báo tin nhắn mới.");
    } else if (p === "denied") {
      toastInfo("Trình duyệt đang chặn thông báo. Hãy mở trong cài đặt trình duyệt.");
    }
    return p;
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!isPushSupported() || Notification.permission !== "granted") return;
    if (!messages.length) return;

    const latest = messages[messages.length - 1];
    if (!latest) return;

    // Lần đầu chỉ lấy mốc, không báo tin đang có sẵn
    if (!primed.current) {
      primed.current = true;
      if (lastId.current === 0) {
        lastId.current = latest.id;
        localStorage.setItem(SEEN_KEY, String(latest.id));
      }
      return;
    }

    if (latest.id <= lastId.current) return;
    const isMine = myEmail && latest.senderEmail
      ? latest.senderEmail.toLowerCase() === myEmail.toLowerCase()
      : false;
    if (isMine) {
      lastId.current = latest.id;
      localStorage.setItem(SEEN_KEY, String(latest.id));
      return;
    }

    lastId.current = latest.id;
    localStorage.setItem(SEEN_KEY, String(latest.id));
    show(latest.senderName, latest.content, onOpen);
  }, [enabled, messages, myEmail, onOpen]);

  return { permission, supported: isPushSupported(), requestPermission };
}