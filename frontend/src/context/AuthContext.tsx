"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, getCurrentUserApi, loginApi, registerApi, updateProfileApi, logoutApi } from '@/lib/authService';
import { getAuthToken, setAuthToken } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<UserProfile>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'PLAYER' | 'OWNER' | 'ORGANIZER';
    position?: string;
    area?: string;
    favoriteSport?: string;
    level?: string;
  }) => Promise<UserProfile>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Cache hồ sơ người dùng trong localStorage. Mỗi route mount một AuthProvider mới,
 * nên nếu không cache thì mọi lần điều hướng đều phải chờ gọi /auth/me mới hiện nội
 * dung — đây chính là nguyên nhân trang "Khởi tạo hồ sơ cầu thủ" đứng rất lâu khi
 * máy chủ chậm.
 */
const USER_CACHE_KEY = 'Turfzone_user';

function readCachedUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Nạp cache NGAY sau khi hydrate (an toàn với SSR, không gây lệch hydration):
    // giao diện có dữ liệu tức thì, không phải chờ mạng. Sau đó vẫn xác thực lại
    // bằng /auth/me ở dưới để lấy dữ liệu mới nhất.
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setIsLoading(false);
    }

    async function loadUserFromToken() {
      const token = getAuthToken();
      if (!token) {
        // Không còn token -> bỏ cache để không hiển thị nhầm phiên cũ.
        writeCachedUser(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const currentUser = await getCurrentUserApi();
        if (currentUser) {
          setUser(currentUser);
          writeCachedUser(currentUser);
        } else if (!getAuthToken()) {
          // Máy chủ đã từ chối phiên (token bị xóa) -> đăng xuất và bỏ cache.
          writeCachedUser(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Lỗi khi khôi phục phiên đăng nhập:', err);
      }
      setIsLoading(false);
    }
    loadUserFromToken();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await loginApi(credentials);
      setUser(res.user);
      writeCachedUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'PLAYER' | 'OWNER' | 'ORGANIZER';
    position?: string;
    area?: string;
    favoriteSport?: string;
    level?: string;
  }): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await registerApi(data);
      setUser(res.user);
      writeCachedUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const updated = await updateProfileApi(data);
      // Đổi email -> JWT cũ (subject là email cũ) hết hiệu lực, backend trả token mới
      // trong cùng response. Thay token đang lưu NGAY, nếu không phiên sẽ bị 401.
      if (updated.token) {
        setAuthToken(updated.token, updated.role);
      }
      // Không lưu token vào state / localStorage user cache (chỉ giữ trong sessionStorage).
      const { token, ...profile } = updated;
      setUser(profile);
      writeCachedUser(profile);
      return profile;
    } catch (err) {
      console.error("Lỗi khi cập nhật hồ sơ:", err);
      // fallback local update if backend API fails or offline
      setUser(prev => prev ? { ...prev, ...data } : null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutApi();
    writeCachedUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
