import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import BootSplash from "@/components/BootSplash";
import Toaster from "@/components/Toaster";

/**
 * Be Vietnam Pro: font thiết kế cho tiếng Việt, hỗ trợ đầy đủ dấu và toàn bộ
 * dải weight (400 → 900). Dùng next/font để self-host, không phụ thuộc request
 * ra fonts.googleapis.com — tránh tình trạng "chữ đậm chữ nhạt" do fallback font
 * khi tải font thất bại trên mạng di động.
 */
const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  title: "SoccerHub - Nền Tảng Quản Lý Sân Bóng & Giải Đấu Thông Minh",
  description: "Nền tảng quản lý sân bóng, giải đấu và AI gợi ý sân thông minh tích hợp lịch sử thi đấu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable} overflow-x-hidden`}
    >
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden antialiased">
        <AuthProvider>
          <ThemeProvider>
            {/* Vòng xoay hiện ngay khi F5, tự ẩn sau khi React mount */}
            <BootSplash />
            {/* Thông báo nhỏ góc phải, thay cho window.alert */}
            <Toaster />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
