"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, getCurrentUserApi, loginApi, registerApi, updateProfileApi, logoutApi } from '@/lib/authService';
import { getAuthToken } from '@/lib/api';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUserFromToken() {
      const token = getAuthToken();
      if (token) {
        try {
          const currentUser = await getCurrentUserApi();
          if (currentUser) {
            setUser(currentUser);
          }
        } catch (err) {
          console.error('Lỗi khi khôi phục phiên đăng nhập:', err);
        }
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
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const updated = await updateProfileApi(data);
      setUser(updated);
      return updated;
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
