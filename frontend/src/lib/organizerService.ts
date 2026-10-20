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

/** BTC/ADMIN thêm đội thủ công vào giải (không qua form đăng ký của cầu thủ). */export async function addManualTeam(
  tournamentId: number,
  payload: {
    teamName: string;
    captainName?: string;
    captainPhone?: string;
    memberCount?: number;
    memberNames?: string;
  }
): Promise<{ message: string; registeredTeams: number }> {
  const data = await apiRequest<{ message: string; registeredTeams: number }>(
    `/api/v1/tournaments/${tournamentId}/teams/manual`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return data;
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

/* =========================================================
 * Quyền tham gia giải (ai cũng tham gia / chỉ mời qua email)
 * ========================================================= */

export type JoinMode = "PUBLIC" | "INVITE_ONLY";

export interface JoinAccess {
  joinMode: JoinMode;
  invitedEmails: string[];
  message?: string;
}

/** Đọc cấu hình quyền tham gia của 1 giải. */
export async function fetchJoinAccess(tournamentId: number): Promise<JoinAccess> {
  const data = await apiRequest<{ joinMode: JoinMode; invitedEmails: string[] }>(
    `/api/v1/tournaments/${tournamentId}/access`
  );
  return { joinMode: data?.joinMode === "INVITE_ONLY" ? "INVITE_ONLY" : "PUBLIC", invitedEmails: data?.invitedEmails ?? [] };
}

/** Đặt quyền tham gia (và ghi đè danh sách email mời nếu có truyền). */
export async function setJoinAccess(
  tournamentId: number,
  joinMode: JoinMode,
  invitedEmails?: string[]
): Promise<JoinAccess> {
  const body: Record<string, unknown> = { joinMode };
  if (invitedEmails) body.invitedEmails = invitedEmails;
  const data = await apiRequest<{ message: string; joinMode: JoinMode; invitedEmails: string[] }>(
    `/api/v1/tournaments/${tournamentId}/access`,
    { method: "PUT", body: JSON.stringify(body) }
  );
  return { joinMode: data?.joinMode ?? "PUBLIC", invitedEmails: data?.invitedEmails ?? [], message: data?.message };
}

/** Thêm 1 email vào danh sách mời (tự chuyển giải sang chế độ kín nếu đang công khai). */
export async function addTournamentInvite(
  tournamentId: number,
  email: string
): Promise<JoinAccess> {
  const data = await apiRequest<{ message: string; joinMode: JoinMode; invitedEmails: string[] }>(
    `/api/v1/tournaments/${tournamentId}/invites`,
    { method: "POST", body: JSON.stringify({ email }) }
  );
  return { joinMode: data?.joinMode ?? "PUBLIC", invitedEmails: data?.invitedEmails ?? [], message: data?.message };
}

/** Gỡ 1 email khỏi danh sách mời. */
export async function removeTournamentInvite(
  tournamentId: number,
  email: string
): Promise<JoinAccess> {
  const data = await apiRequest<{ message: string; invitedEmails: string[] }>(
    `/api/v1/tournaments/${tournamentId}/invites/${encodeURIComponent(email)}`,
    { method: "DELETE" }
  );
  return { joinMode: "PUBLIC", invitedEmails: data?.invitedEmails ?? [], message: data?.message };
}
