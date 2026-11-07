import { useWindowDimensions, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Turfzone Design System Tokens (100% Parity with Web Frontend)
 * Minimum font size across all screens is strictly >= 13px.
 */
export const COLORS = {
  primary: '#0369a1',      // Sky 700 (Brand Primary)
  primaryDark: '#075985',  // Sky 800
  primaryLight: '#e0f2fe', // Sky 100
  primarySoft: '#f0f9ff',  // Sky 50
  emerald: '#10b981',      // Emerald 500 (Turf / Success)
  emeraldDark: '#047857',  // Emerald 700
  emeraldLight: '#d1fae5', // Emerald 100
  emeraldSoft: '#ecfdf5',  // Emerald 50
  rose: '#e11d48',         // Rose 600 (SOS / Urgent)
  roseDark: '#be123c',     // Rose 700
  roseLight: '#ffe4e6',    // Rose 100
  roseSoft: '#fff1f2',     // Rose 50
  amber: '#d97706',        // Amber 600 (Trophy / Warning)
  amberBright: '#f59e0b',  // Amber 500
  amberLight: '#fef3c7',   // Amber 100
  amberSoft: '#fffbeb',    // Amber 50
  bg: '#f8fafc',           // Slate 50
  surface: '#ffffff',      // White Card
  surfaceMuted: '#f1f5f9', // Slate 100
  border: '#cbd5e1',       // Slate 300
  borderLight: '#e2e8f0',  // Slate 200
  text: '#0f172a',         // Slate 900
  textSecondary: '#334155',// Slate 700
  textMuted: '#64748b',    // Slate 500
  white: '#ffffff',
};

export interface KitColorOption {
  name: string;
  hex: string;
  border: string;
}

export const KIT_COLORS: KitColorOption[] = [
  { name: 'Đỏ', hex: '#ef4444', border: '#dc2626' },
  { name: 'Trắng', hex: '#ffffff', border: '#94a3b8' },
  { name: 'Xanh Dương', hex: '#0284c7', border: '#0369a1' },
  { name: 'Vàng', hex: '#facc15', border: '#ca8a04' },
  { name: 'Đen', hex: '#1e293b', border: '#0f172a' },
  { name: 'Xanh Lá', hex: '#10b981', border: '#059669' },
  { name: 'Cam', hex: '#f97316', border: '#ea580c' },
  { name: 'Tím', hex: '#8b5cf6', border: '#6d28d9' },
];

export function getKitColorInfo(colorName?: string): KitColorOption | null {
  if (!colorName) return null;
  return (
    KIT_COLORS.find((c) => c.name.toLowerCase() === colorName.toLowerCase()) || {
      name: colorName,
      hex: '#94a3b8',
      border: '#64748b',
    }
  );
}

/**
 * Adaptive layout hook for phones (320px-430px), phablets, tablets (768px+), and Expo Web (1024px+).
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isCompactPhone = width < 360;
  const isPhone = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const horizontalPadding = isCompactPhone ? 12 : isPhone ? 16 : isTablet ? 24 : 32;
  const maxContentWidth = 1240;
  const effectiveWidth = Math.min(width, maxContentWidth);
  const gridColumns = isDesktop ? 3 : isTablet ? 2 : 1;
  const cardGap = isPhone ? 12 : 16;

  // Calculate exact card width when using multi-column flexWrap grids on tablet/desktop
  const availableInnerWidth = effectiveWidth - horizontalPadding * 2;
  const gridCardWidth =
    gridColumns === 1
      ? availableInnerWidth
      : Math.floor((availableInnerWidth - cardGap * (gridColumns - 1)) / gridColumns);

  return {
    width,
    height,
    insets,
    isCompactPhone,
    isPhone,
    isTablet,
    isDesktop,
    horizontalPadding,
    maxContentWidth,
    gridColumns,
    cardGap,
    gridCardWidth,
  };
}

/** Today's date in Vietnam timezone (YYYY-MM-DD) */
export function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Offset date from today in Vietnam timezone (YYYY-MM-DD) */
export function addDaysLocal(offsetDays: number): { dateStr: string; label: string; subLabel: string } {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const p = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const label =
    offsetDays === 0 ? 'Hôm nay' : offsetDays === 1 ? 'Ngày mai' : offsetDays === 2 ? 'Ngày kia' : dayNames[d.getDay()];
  const subLabel = `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  return { dateStr, label, subLabel };
}

export function formatVnd(amount?: number | string | null): string {
  const num = Number(amount ?? 0);
  if (isNaN(num)) return '0 đ';
  return `${num.toLocaleString('vi-VN')} đ`;
}

/**
 * Copy text to clipboard if available on web/native, and show a friendly confirmation message.
 */
export async function copyTextWithFeedback(title: string, content: string, onInlineNotice?: (msg: string) => void) {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(content);
    }
  } catch {
    // Fallback to inline notice / alert
  }
  if (onInlineNotice) {
    onInlineNotice(`✅ ${title}`);
  } else {
    Alert.alert(title, content);
  }
}
