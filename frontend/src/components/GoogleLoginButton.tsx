"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setAuthToken } from "@/lib/api";
import { markPlayerSetupPending } from "@/components/PlayerSetup";

/**
 * Nút "Đăng nhập bằng Google".
 *
 * Dùng Google Identity Services (GSI) — script được load từ CDN của Google.
 * Cần biến môi trường NEXT_PUBLIC_GOOGLE_CLIENT_ID (đặt ở Railway/Netlify).
 *
 * Flow:
 *   1. Người dùng bấm nút → Google popup → người dùng chọn tài khoản
 *   2. Google trả về ID token (JWT) chứa email, tên, ảnh
 *   3. Frontend gửi ID token tới backend /api/v1/auth/google
 *   4. Backend xác minh với Google, tạo/tìm tài khoản, trả về JWT của SoccerHub
 *   5. Frontend lưu token + cập nhật user state
 */
export default function GoogleLoginButton({
  mode = "login",
  disabled = false,
  className = "",
  onSuccess,
}: {
  mode?: "login" | "register";
  disabled?: boolean;
  className?: string;
  onSuccess?: (user: any) => void;
}) {
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  // Khởi tạo GSI khi component mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id) return false;
      if (cancelled) return true;
      try {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp: any) => {
            if (!resp?.credential) {
              setError("Không nhận được ID token từ Google.");
              return;
            }
            setLoading(true);
            setError(null);
            try {
              const r = await fetch(
                (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080") +
                  "/api/v1/auth/google",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ idToken: resp.credential }),
                }
              );
              const data = await r.json();
              if (!r.ok) throw new Error(data?.message || "Đăng nhập Google thất bại.");
              const token = data.token;
              if (token) {
                setAuthToken(token, data.user?.role);
              }
              // đánh dấu cần hoàn tất hồ sơ cho PLAYER mới
              if (data.user?.role === "PLAYER" && data.user?.email) {
                markPlayerSetupPending(data.user.email);
              }
              onSuccess?.(data.user);
              if (mode === "login") {
                // reload để AuthContext pick up token
                window.location.reload();
              }
            } catch (e: any) {
              setError(e?.message || "Đăng nhập Google thất bại.");
            } finally {
              setLoading(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setReady(true);
      } catch (e: any) {
        setError("Không khởi tạo được Google Sign-In.");
      }
      return true;
    };

    if (init()) return () => { cancelled = true; };

    // Script chưa load — chờ
    const interval = window.setInterval(() => {
      if (init()) window.clearInterval(interval);
    }, 300);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [clientId, mode, onSuccess]);

  // Render nút Google chính thức (có logo Google, đúng chuẩn branding)
  useEffect(() => {
    if (!ready || !buttonRef.current) return;
    const g = (window as any).google;
    if (!g?.accounts?.id) return;
    try {
      // Xoá nút cũ (nếu re-render)
      buttonRef.current.innerHTML = "";
      g.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: mode === "register" ? "signup_with" : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 280,
      });
    } catch {
      /* ignore */
    }
  }, [ready, mode]);

  if (!clientId) {
    return (
      <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
        Google Sign-In chưa được cấu hình (thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID).
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div ref={buttonRef} className={className} />
      {loading && (
        <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0369a1]" />
          Đang xác thực với Google…
        </p>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}