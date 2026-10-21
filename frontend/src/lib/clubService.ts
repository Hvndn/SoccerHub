import { apiRequest } from "./api";

/* =========================================================
 * CLB bóng đá — người dùng đại diện CLB quản lý CLB + thành viên.
 * Vai trò đại diện gắn bằng cờ isClubRep trong hồ sơ (giữ nguyên role PLAYER/OWNER).
 * ========================================================= */

export interface ClubMemberRow {
  email: string;
  name?: string | null;
  phone?: string | null;
  isRepresentative: boolean;
  joinedAt?: string | null;
}

export interface Club {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  area?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  ownerEmail?: string;
  ownerName?: string | null;
  maxMembers?: number;
  memberCount: number;
  memberList?: ClubMemberRow[];
  /** true nếu người đang xem là đại diện CLB này. */
  canManage: boolean;
  createdAt?: string | null;
}

/** Các CLB tôi đại diện + CLB tôi là thành viên. */
export async function fetchMyClubs(): Promise<Club[]> {
  const data = await apiRequest<Club[]>("/api/v1/clubs/mine");
  return Array.isArray(data) ? data : [];
}

/** Chi tiết 1 CLB. */
export async function fetchClub(clubId: number): Promise<Club> {
  return apiRequest<Club>(`/api/v1/clubs/${clubId}`);
}

/** Tạo CLB mới — người tạo tự động là đại diện. */
export async function createClub(payload: {
  name: string;
  description?: string;
  area?: string;
  phone?: string;
  logoUrl?: string;
  maxMembers?: number;
}): Promise<{ message: string; club: Club }> {
  return apiRequest<{ message: string; club: Club }>("/api/v1/clubs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Sửa thông tin CLB (chỉ đại diện). */
export async function updateClub(
  clubId: number,
  payload: Partial<{
    name: string;
    description: string;
    area: string;
    phone: string;
    logoUrl: string;
    maxMembers: number;
  }>
): Promise<{ message: string; club: Club }> {
  return apiRequest<{ message: string; club: Club }>(`/api/v1/clubs/${clubId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Xóa CLB (chỉ đại diện). */
export async function deleteClub(clubId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/api/v1/clubs/${clubId}`, { method: "DELETE" });
}

/** Thêm thành viên bằng email (chỉ đại diện). */
export async function addClubMember(
  clubId: number,
  email: string
): Promise<{ message: string; club: Club }> {
  return apiRequest<{ message: string; club: Club }>(`/api/v1/clubs/${clubId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Gỡ thành viên (chỉ đại diện). */
export async function removeClubMember(
  clubId: number,
  email: string
): Promise<{ message: string; club: Club }> {
  return apiRequest<{ message: string; club: Club }>(
    `/api/v1/clubs/${clubId}/members/${encodeURIComponent(email)}`,
    { method: "DELETE" }
  );
}

/** Bổ nhiệm / thu hồi vai trò đại diện (chỉ đại diện). */
export async function setClubRepresentative(
  clubId: number,
  email: string,
  isRepresentative: boolean
): Promise<{ message: string; club: Club }> {
  return apiRequest<{ message: string; club: Club }>(
    `/api/v1/clubs/${clubId}/members/${encodeURIComponent(email)}/representative`,
    { method: "PATCH", body: JSON.stringify({ isRepresentative }) }
  );
}
