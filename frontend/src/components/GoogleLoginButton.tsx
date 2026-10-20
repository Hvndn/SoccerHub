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
 *   4. Backend xác minh với Google, tạo/tìm tài khoản, trả về JWT của Turfzone
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
              // CHỈ đánh dấu cần hoàn tất hồ sơ khi cầu thủ CHƯA có dữ liệu hồ sơ.
              // Trước đây đánh dấu cho MỌI lần đăng nhập Google nên người chơi cũ
              // cũng bị đẩy vào trang "Khởi tạo hồ sơ cầu thủ" mỗi lần đăng nhập.
              const hasProfile = !!(
                data.user?.position ||
                data.user?.dominantFoot ||
                data.user?.jerseyNumber
              );
              if (data.user?.role === "PLAYER" && data.user?.email && !hasProfile) {
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
      <div className="w-full space-y-2">
        <div className="grid grid-cols-2 gap-2.5 w-full">
          {/* Nút Google */}
          <button
            type="button"
            onClick={() => {
              setError("Đang kết nối Google Sign-In... Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID trong .env.local để liên kết tài khoản thật.");
              setTimeout(() => setError(null), 4000);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google</span>
          </button>

          {/* Nút Facebook */}
          <button
            type="button"
            onClick={() => {
              setError("Đăng nhập Facebook đang trong giai đoạn đăng ký Meta App Review.");
              setTimeout(() => setError(null), 4000);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center animate-fade-in font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-center gap-2.5">
        <div ref={buttonRef} className={className} />
        {/* Nút Facebook đồng hành bên cạnh */}
        <button
          type="button"
          onClick={() => {
            setError("Đăng nhập Facebook đang trong giai đoạn xét duyệt Meta App.");
            setTimeout(() => setError(null), 4000);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer h-[40px]"
          title="Đăng nhập bằng Facebook"
        >
          <svg className="w-4 h-4 shrink-0" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>
      </div>

      {loading && (
        <p className="text-[13px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0369a1]" />
          Đang xác thực với Google…
        </p>
      )}
      {error && (
        <p role="alert" className="text-[13px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-center animate-fade-in font-medium">
          {error}
        </p>
      )}
    </div>
  );
}