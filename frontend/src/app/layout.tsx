import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kick-ON - Intelligent Sports Pitch & Tournament Platform",
  description: "Nền tảng quản lý sân bóng, giải đấu và AI gợi ý sân thông minh tích hợp Elo matchmaking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
