// Dark mode đã bị gỡ bỏ — chỉ dùng giao diện sáng.
// Giữ lại export useTheme để không vỡ import nếu còn sót ở đâu đó.
import React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useTheme() {
  return { theme: "light" as const, toggleTheme: () => {}, setTheme: () => {} };
}