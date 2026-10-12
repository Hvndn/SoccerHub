"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force light theme and clean up dark classes
    const root = document.documentElement;
    const body = document.body;
    root.classList.remove("dark");
    body.classList.remove("dark-theme");
    try {
      localStorage.removeItem("vaosan_theme");
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setTheme = () => {
    // Light mode locked
  };

  const toggleTheme = () => {
    // Light mode locked
  };

  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme, setTheme }}>
      <div className={mounted ? "" : "visibility-hidden"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
