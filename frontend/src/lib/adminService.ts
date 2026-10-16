import { apiRequest } from './api';
import { fetchTournaments, type Tournament } from './tournamentService';

export interface AdminOverview {
  totalUsers: number;
  totalPitches: number;
  totalTournaments: number;
  openTournaments: number;
  totalBookings: number;
  totalMatchmakingPosts: number;
  totalRevenue: number;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  eloRating?: number | null;
  area?: string | null;
  level?: string | null;
  enabled: boolean;
  createdAt?: string | null;
}

export interface AdminBooking {
  id: number;
  pitchId: number;
  courtName: string;
  bookingDate: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  totalPrice?: number | null;
  depositPaid?: number | null;
  status?: string | null;
  via?: string | null;
  code?: string | null;
  createdAt?: string | null;
}

export interface AdminPitch {
  id: number;
  name: string;
  address: string;
  area?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  avgPricePerHour?: number | null;
  rating?: number | null;
  pitchTypes?: string[];
}

export interface MatchmakingPost {
  id: number;
  teamName: string;
  captainName?: string | null;
  captainPhone?: string | null;
  eloRating?: number | null;
  form?: string | null;
  record?: string | null;
  winRate?: number | null;
  pitchName: string;
  matchTime: string;
  status?: string | null;
  note?: string | null;
  createdAt?: string | null;
}

const errMsg = (err: any, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export async function getAdminOverview(): Promise<AdminOverview> {
  return apiRequest<AdminOverview>('/api/v1/admin/overview');
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const data = await apiRequest<AdminUser[]>('/api/v1/admin/users');
  return Array.isArray(data) ? data : [];
}

export async function setAdminUserStatus(id: number, enabled: boolean): Promise<{ message: string }> {
  return apiRequest('/api/v1/admin/users/' + id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

export async function setAdminUserRole(id: number, role: string): Promise<{ message: string }> {
  return apiRequest('/api/v1/admin/users/' + id + '/role', {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminUser(id: number): Promise<{ message: string }> {
  return apiRequest('/api/v1/admin/users/' + id, { method: 'DELETE' });
}

export async function listAdminBookings(limit = 100): Promise<AdminBooking[]> {
  const data = await apiRequest<AdminBooking[]>('/api/v1/admin/bookings?limit=' + limit);
  return Array.isArray(data) ? data : [];
}

export async function listAdminPitches(): Promise<AdminPitch[]> {
  const data = await apiRequest<AdminPitch[]>('/api/v1/pitches');
  return Array.isArray(data) ? data : [];
}

export async function setTournamentStatus(id: number, status: string): Promise<{ message: string }> {
  return apiRequest('/api/v1/tournaments/' + id + '/status', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteTournament(id: number): Promise<{ message: string }> {
  return apiRequest('/api/v1/tournaments/' + id, { method: 'DELETE' });
}

export async function listMatchmakingPosts(): Promise<MatchmakingPost[]> {
  const data = await apiRequest<MatchmakingPost[]>('/api/v1/community/matchmaking-posts');
  return Array.isArray(data) ? data : [];
}

export async function deleteMatchmakingPost(id: number): Promise<{ message: string }> {
  return apiRequest('/api/v1/admin/matchmaking-posts/' + id, { method: 'DELETE' });
}

export async function cleanOrphanData(): Promise<{ message: string; matchResults: number; goalEvents: number }> {
  return apiRequest('/api/v1/admin/maintenance/orphans', { method: 'DELETE' });
}

export interface AdminNotification {
  id: number;
  targetRole?: string;
  title: string;
  message?: string;
  type?: string;
  link?: string | null;
  read?: boolean;
  createdAt?: string;
}

export async function listMyNotifications(): Promise<AdminNotification[]> {
  const data = await apiRequest<AdminNotification[]>('/api/v1/notifications/mine');
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id: number | string): Promise<void> {
  await apiRequest(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
}

export async function broadcastNotification(payload: {
  title: string;
  message: string;
  targetRole?: string;
  link?: string | null;
}): Promise<{ message: string }> {
  return apiRequest('/api/v1/notifications/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRevenueReport(): Promise<any> {
  try {
    return await apiRequest('/api/v1/admin/revenue-report');
  } catch (err) {
    throw new Error(errMsg(err, 'Không tải được báo cáo doanh thu.'));
  }
}

export { fetchTournaments };
export type { Tournament };
