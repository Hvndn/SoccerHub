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
  const data = await apiRequest<AdminUser[]>('/api/v1/admin/users/legacy');
  return Array.isArray(data) ? data : [];
}

/** === Phân trang + tìm kiếm danh sách người dùng (server-side) === */
export interface PagedUsers {
  content: AdminUser[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  countByRole: Record<string, number>;
}

export async function listAdminUsersPaged(params: {
  page?: number;
  size?: number;
  q?: string;
  role?: string;
} = {}): Promise<PagedUsers> {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page ?? 0));
  qs.set('size', String(params.size ?? 20));
  if (params.q) qs.set('q', params.q);
  if (params.role) qs.set('role', params.role);
  return apiRequest<PagedUsers>('/api/v1/admin/users?' + qs.toString());
}

/** Chi tiết người dùng: hồ sơ + lịch sử đặt sân + kèo đã đăng. */
export async function getAdminUserDetail(id: number) {
  return apiRequest<{
    user: any;
    bookingCount: number;
    totalSpent: number;
    matchmakingPosts: Array<{
      id: number;
      teamName: string;
      pitchName: string;
      matchTime: string;
      status: string;
      estimatedFee?: number | null;
      opponentTeamName?: string | null;
      createdAt: string;
    }>;
  }>('/api/v1/admin/users/' + id + '/detail');
}

/** Thống kê nâng cao: top cụm sân doanh thu + top khách hàng. */
export async function getAdminInsights() {
  return apiRequest<{
    topPitches: Array<{ pitchId: number; pitchName: string; revenue: number }>;
    topCustomers: Array<{
      customerName: string;
      customerPhone: string;
      totalSpent: number;
      bookingCount: number;
    }>;
  }>('/api/v1/admin/insights');
}

/** Admin huỷ đơn đặt sân (kèm hoàn cọc) khi có khiếu nại. */
export async function adminCancelBooking(id: number, reason: string) {
  return apiRequest<{ message: string; refundAmount: number }>(
    '/api/v1/admin/bookings/' + id + '/cancel',
    { method: 'POST', body: JSON.stringify({ reason }) }
  );
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

/** Sinh đơn đặt sân giả lập (mã bắt đầu bằng "SIM-") để demo có doanh thu. */
export async function simulateBookings(opts?: {
  pitchId?: number;
  pastDays?: number;
  futureDays?: number;
  perDay?: number;
}): Promise<{ created: number; message: string; settledRevenue?: number }> {
  const qs = new URLSearchParams();
  if (opts?.pitchId) qs.set('pitchId', String(opts.pitchId));
  if (opts?.pastDays != null) qs.set('pastDays', String(opts.pastDays));
  if (opts?.futureDays != null) qs.set('futureDays', String(opts.futureDays));
  if (opts?.perDay != null) qs.set('perDay', String(opts.perDay));
  return apiRequest('/api/v1/pitches/simulate-bookings?' + qs.toString(), { method: 'POST' });
}

/** Xoá toàn bộ đơn giả lập — đơn thật của khách giữ nguyên. */
export async function clearSimulatedBookings(): Promise<{ deleted: number; message: string }> {
  return apiRequest('/api/v1/pitches/simulate-bookings', { method: 'DELETE' });
}

/** Gửi đánh giá Fair-play cho một đội sau trận giao hữu. */
export async function submitTeamReview(payload: {
  reviewedTeamName: string;
  reviewerTeamName: string;
  matchmakingPostId?: number;
  stars: number;
  onTime: boolean;
  fairPlay: boolean;
  sportsmanship: boolean;
  comment?: string;
}): Promise<{ message: string }> {
  return apiRequest('/api/v1/community/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Lấy danh sách đánh giá Fair-play của một đội. */
export async function getTeamReviews(teamName: string): Promise<{
  teamName: string;
  avgStars: number;
  reviewCount: number;
  reviews: any[];
}> {
  return apiRequest(`/api/v1/community/reviews/${encodeURIComponent(teamName)}`);
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
