"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  subscribeToBookingEvents,
  playNotificationChime,
  type RealtimeBookingEvent,
} from "@/lib/realtimeService";
import { listMyNotifications, markNotificationRead } from "@/lib/adminService";

/** Một thông báo trong Trung Tâm Thông Báo (server + realtime + cache local). */
export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
  cancelReason?: string;
  serverId?: number;
  link?: string | null;
}

/** Cache tách riêng theo từng tài khoản (tránh lẫn thông báo khi đổi user chung máy). */
const NOTIFS_KEY_BASE = "Turfzone_user_notifications";

/** Hiển thị thời gian tương đối: "Vừa xong" / "x phút trước" / ngày. */
export function formatNotifTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return d.toLocaleDateString("vi-VN");
}

/**
 * Nguồn dữ liệu thông báo dùng chung cho Navbar (chuông) và trang /notifications.
 * Gồm: cache localStorage theo tài khoản, poll server mỗi 60s, nhận sự kiện
 * đặt sân realtime, và các thao tác đánh dấu đã đọc / xóa.
 */
export function useNotifications(user: { email?: string | null } | null | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const notificationsRef = useRef<AppNotification[]>([]);
  const userEmailRef = useRef<string | null>(null);
  userEmailRef.current = user?.email ?? null;

  const notifKey = useCallback(
    () => NOTIFS_KEY_BASE + (userEmailRef.current ? "_" + userEmailRef.current : "_guest"),
    []
  );

  const saveNotifications = useCallback(
    (items: AppNotification[]) => {
      try {
        localStorage.setItem(notifKey(), JSON.stringify(items));
      } catch (e) {
        /* ignore */
      }
    },
    [notifKey]
  );

  // Mirror để đọc state mới nhất ngoài render (đồng bộ server)
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Load cache của đúng tài khoản đang đăng nhập (đổi user -> nạp lại, logout -> rỗng)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        NOTIFS_KEY_BASE + (user?.email ? "_" + user.email : "_guest")
      );
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(
            parsed.map((item: any) => ({ ...item, time: new Date(item.time) }))
          );
          return;
        }
      }
      setNotifications([]);
    } catch (e) {
      /* ignore parse error */
    }
  }, [user?.email]);

  // Thông báo thật từ server khi đã đăng nhập (poll mỗi 60s). Khách: giữ local.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    const pull = async () => {
      try {
        const rows = await listMyNotifications();
        if (!alive) return;
        setNotifications((prev) => {
          const localOnly = prev.filter((n) => n.serverId == null);
          const mapped: AppNotification[] = rows.map((r) => ({
            id: `srv-${r.id}`,
            serverId: r.id,
            type: r.type || "SYSTEM",
            title: r.title,
            message: r.message || "",
            time: r.createdAt ? new Date(r.createdAt) : new Date(),
            read: !!r.read,
            link: r.link ?? null,
          }));
          const merged = [...mapped, ...localOnly].slice(0, 25);
          saveNotifications(merged);
          return merged;
        });
      } catch {
        // backend chưa chạy / chưa đăng nhập xong — giữ thông báo local
      } finally {
        if (alive) setLoading(false);
      }
    };
    pull();
    const timer = setInterval(pull, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [user, saveNotifications]);

  // Nhận sự kiện đặt sân realtime (cả cùng tab và đa tab)
  useEffect(() => {
    const unsubscribe = subscribeToBookingEvents((event: RealtimeBookingEvent) => {
      let newNotif: AppNotification | null = null;

      if (event.type === "BOOKING_CREATED") {
        newNotif = {
          id: `booking-${event.bookingId || Date.now()}`,
          type: "BOOKING_CREATED",
          title: "✅ Đặt Sân Thành Công!",
          message: `Ca ${event.timeSlot || ""} tại ${event.courtName || "sân"} đã được xác nhận. Mã: ${event.code || "--"}.`,
          time: new Date(event.timestamp),
          read: false,
        };
      } else if (event.type === "BOOKING_CANCELLED") {
        newNotif = {
          id: `cancel-${event.bookingId || Date.now()}`,
          type: "BOOKING_CANCELLED",
          title: "❌ Ca Đặt Sân Bị Hủy",
          message: `Ca ${event.timeSlot || ""} tại ${event.courtName || "sân"} đã bị hủy bởi chủ sân.`,
          time: new Date(event.timestamp),
          read: false,
          cancelReason: event.cancelReason,
        };
      } else if (event.type === "BOOKING_CHECKED_IN") {
        newNotif = {
          id: `checkin-${event.bookingId || Date.now()}`,
          type: "BOOKING_CHECKED_IN",
          title: "🏟️ Check-in Xác Nhận!",
          message: `Bạn đã check-in thành công ca ${event.timeSlot || ""} tại ${event.courtName || "sân"}.`,
          time: new Date(event.timestamp),
          read: false,
        };
      }

      if (newNotif) {
        playNotificationChime();
        const created = newNotif;
        setNotifications((prev) => {
          // Tránh duplicate notification id
          const filtered = prev.filter((n) => n.id !== created.id);
          const updated = [created, ...filtered].slice(0, 25);
          saveNotifications(updated);
          return updated;
        });
      }
    });

    return unsubscribe;
  }, [saveNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /** Đánh dấu tất cả đã đọc: sync server (fire-and-forget) rồi cập nhật local. */
  const markAllRead = useCallback(() => {
    notificationsRef.current
      .filter((n) => n.serverId != null && !n.read)
      .forEach((n) => markNotificationRead(n.serverId as number).catch(() => {}));
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [saveNotifications]);

  /** Đánh dấu một thông báo đã đọc (có sync server nếu là thông báo từ server). */
  const markSingleRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id);
        if (notif?.serverId != null && !notif.read) {
          markNotificationRead(notif.serverId as number).catch(() => {});
        }
        const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const removeNotification = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        saveNotifications(updated);
        return updated;
      });
    },
    [saveNotifications]
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    markSingleRead,
    removeNotification,
    clearAllNotifications,
  };
}
