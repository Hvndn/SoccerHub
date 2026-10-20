import { apiRequest, setAuthToken, removeAuthToken } from './api';

export interface UserProfile {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'PLAYER' | 'OWNER' | 'ORGANIZER' | 'ADMIN';
  position?: string;
  eloRating?: number;
  area?: string;
  favoriteSport?: string;
  level?: string;
  avatar?: string;
  dominantFoot?: string;
  jerseyNumber?: string;
  height?: string;
  weight?: string;
  preferredTime?: string;
  currentClub?: string;
  /** Cờ "đại diện CLB" — tài khoản này đại diện cho ít nhất 1 CLB. */
  isClubRep?: boolean;
  /**
   * Chỉ có khi vừa đổi email: backend cấp token mới vì JWT gắn với email cũ.
   * FE dùng để thay token đang lưu, không hiển thị cho người dùng.
   */
  token?: string;
}

export interface AuthResponseData {
  token: string;
  tokenType: string;
  user: UserProfile;
  message: string;
}

export async function loginApi(payload: { email: string; password: string }): Promise<AuthResponseData> {
  const data = await apiRequest<AuthResponseData>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (data?.token && data?.user?.role) {
    setAuthToken(data.token, data.user.role);
  }

  return data;
}

export async function registerApi(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'PLAYER' | 'OWNER' | 'ORGANIZER';
  position?: string;
  area?: string;
  favoriteSport?: string;
  level?: string;
}): Promise<AuthResponseData> {
  const data = await apiRequest<AuthResponseData>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (data?.token && data?.user?.role) {
    setAuthToken(data.token, data.user.role);
  }

  return data;
}

export async function getCurrentUserApi(): Promise<UserProfile | null> {
  try {
    const user = await apiRequest<UserProfile>('/api/v1/auth/me', {
      method: 'GET',
    });
    return user;
  } catch (error: any) {
    // CHỈ xoá token khi máy chủ nói phiên không hợp lệ (401/403). Nếu lỗi do
    // mạng/máy chủ chậm (timeout) thì giữ token để lần sau khôi phục lại — trước
    // đây xoá token ở mọi lỗi khiến người dùng bị đăng xuất oan khi backend chết.
    if (error?.status === 401 || error?.status === 403) {
      removeAuthToken();
    }
    return null;
  }
}

export async function updateProfileApi(payload: Partial<UserProfile>): Promise<UserProfile> {
  const user = await apiRequest<UserProfile>('/api/v1/auth/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return user;
}

export function logoutApi() {
  removeAuthToken();
}
