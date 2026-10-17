import { apiRequest, ensureLoggedIn } from "./api";
import { toastErr, toastOk } from "./toast";

/* =========================================================
 * Quản lý giải đấu cho Ban tổ chức (ORGANIZER)
 * - Duyệt đội đăng ký
 * - Phân công trọng tài
 * ========================================================= */

export interface PendingTeam {
  teamName: string;
  captainName: string;
  captainPhone: string;
  captainEmail: string;
  memberCount: number;
  registeredAt: string;
}

export interface RefereeInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  assignedAt: string;
}

/** Danh sách đội chờ duyệt của một giải. */
export async function getPendingTeams(tournamentId: number): Promise<PendingTeam[]> {
  const data = await apiRequest<PendingTeam[]>(`/api/v1/tournaments/${tournamentId}/teams/pending`);
  return Array.isArray(data) ? data : [];
}

/** Duyệt đội vào giải. */
export async function approveTeam(tournamentId: number, teamName: string): Promise<void> {
  await apiRequest(`/api/v1/tournaments/${tournamentId}/teams/${encodeURIComponent(teamName)}/approve`, {
    method: "POST",
  });
  toastOk(`Đã duyệt đội ${teamName} vào giải.`);
}

/** Từ chối đội. */
export async function rejectTeam(tournamentId: number, teamName: string): Promise<void> {
  await apiRequest(`/api/v1/tournaments/${tournamentId}/teams/${encodeURIComponent(teamName)}/reject`, {
    method: "POST",
  });
  toastOk(`Đã từ chối đội ${teamName}.`);
}

/** Danh sách trọng tài của một giải. */
export async function getReferees(tournamentId: number): Promise<RefereeInfo[]> {
  const data = await apiRequest<RefereeInfo[]>(`/api/v1/tournaments/${tournamentId}/referees`);
  return Array.isArray(data) ? data : [];
}

/** Thêm trọng tài vào giải. */
export async function addReferee(
  tournamentId: number,
  input: { name: string; email?: string; phone?: string; notes?: string }
): Promise<void> {
  await apiRequest(`/api/v1/tournaments/${tournamentId}/referees`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  toastOk(`Đã thêm trọng tài ${input.name}.`);
}

/** Xoá trọng tài khỏi giải. */
export async function removeReferee(tournamentId: number, refId: number): Promise<void> {
  await apiRequest(`/api/v1/tournaments/${tournamentId}/referees/${refId}`, { method: "DELETE" });
  toastOk("Đã xoá trọng tài.");
}

/** Bọc lỗi thành toast. */
export function reportTournamentError(err: any, fallback: string): void {
  if (!ensureLoggedIn("thao tác với giải đấu")) return;
  toastErr(err?.message || fallback);
}