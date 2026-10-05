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

  if (data?.token) {
    setAuthToken(data.token);
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

  if (data?.token) {
    setAuthToken(data.token);
  }

  return data;
}

export async function getCurrentUserApi(): Promise<UserProfile | null> {
  try {
    const user = await apiRequest<UserProfile>('/api/v1/auth/me', {
      method: 'GET',
    });
    return user;
  } catch (error) {
    removeAuthToken();
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
