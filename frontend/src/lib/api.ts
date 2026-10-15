export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * Gọi API backend qua URL đã cấu hình (không hardcode localhost).
 * Dùng cho các chỗ gọi fetch trực tiếp ngoài apiRequest().
 */
export function apiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('soccerhub_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('soccerhub_token', token);
  }
}

export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('soccerhub_token');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  // Mobile-friendly fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Important for cookies/auth on mobile Safari
    cache: 'no-store', // Prevent caching issues on mobile
  };

  const response = await fetch(url, fetchOptions);

  let data: any;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.message || `Lỗi yêu cầu: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data as T;
}
