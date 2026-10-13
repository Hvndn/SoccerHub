import { API_BASE_URL, apiRequest } from './api';

/** Shape of Tournament entity returned by GET /api/v1/tournaments */
export interface TournamentTeamEntry {
  id?: number;
  teamName: string;
  captainName?: string;
  captainPhone?: string;
  memberCount?: number;
  eloRating?: number;
  registrationStatus?: string;
  simulated?: boolean;
}

export interface Tournament {
  id: number;
  title: string;
  description?: string;
  sportType?: string; // SAN_7 | SAN_5 | SAN_11 | FUTSAL
  format?: string; // KNOCKOUT | ROUND_ROBIN
  pitchName?: string;
  location?: string;
  totalTeams?: number | null;
  registeredTeams?: number | null;
  prizePool?: number | null;
  entryFee?: number | null;
  startDate?: string;
  endDate?: string;
  registrationDeadline?: string;
  status?: string; // OPEN | ONGOING | COMPLETED
  bannerUrl?: string;
  createdAt?: string;
  teams?: TournamentTeamEntry[];
  bracketJson?: string | null;
}

export const SPORT_TYPES = ['SAN_7', 'SAN_5', 'SAN_11', 'FUTSAL'] as const;
export type SportType = (typeof SPORT_TYPES)[number];

export const sportLabel = (sportType?: string | null): string => {
  switch (sportType) {
    case 'SAN_7':
      return 'Bóng Đá Sân 7 Phủi';
    case 'SAN_5':
      return 'Bóng Đá Sân 5';
    case 'SAN_11':
      return 'Bóng Đá Sân 11 Người';
    case 'FUTSAL':
      return 'Futsal Trong Nhà';
    default:
      return 'Thể Thức Đa Dạng';
  }
};

export const formatLabel = (format?: string | null): string =>
  format === 'KNOCKOUT' ? 'Loại Trực Tiếp (Knockout)' : 'Vòng Tròn Tính Điểm';

/** Short chip code used on tight media overlays (e.g. the featured banner). */
export const formatShort = (format?: string | null): string =>
  format === 'KNOCKOUT' ? 'KO' : 'VÒNG TRÒN';

/** Format an ISO date (yyyy-MM-dd) to dd/MM/yyyy without timezone shift. */
export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
};

export const formatMoney = (amount?: number | null): string =>
  (amount ?? 0).toLocaleString('vi-VN') + 'đ';

/** Signed day difference between an ISO date and today (positive = in the future). */
export const daysUntil = (iso?: string | null): number | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
};

export const registeredCount = (t: Tournament): number =>
  t.registeredTeams ?? t.teams?.length ?? 0;

export const capacity = (t: Tournament): number => t.totalTeams ?? 0;

export const isFull = (t: Tournament): boolean => {
  const cap = capacity(t);
  return cap > 0 && registeredCount(t) >= cap;
};

export const fillPercent = (t: Tournament): number => {
  const cap = capacity(t);
  if (!cap) return 0;
  return Math.min(100, Math.round((registeredCount(t) / cap) * 100));
};

// ---------------------------------------------------------------------------
// Shared cache: CommunityElo (badge count) and TournamentLeaderboard (list)
// both read the same in-flight request instead of hitting the API twice.
// ---------------------------------------------------------------------------
let cache: Tournament[] | null = null;
let inflight: Promise<Tournament[]> | null = null;
const listeners = new Set<(t: Tournament[]) => void>();

const notify = (data: Tournament[]) => listeners.forEach((fn) => fn(data));

export const subscribeTournaments = (fn: (t: Tournament[]) => void): (() => void) => {
  listeners.add(fn);
  if (cache) fn(cache);
  return () => listeners.delete(fn);
};

export async function fetchTournaments(force = false): Promise<Tournament[]> {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tournaments`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: unknown = await res.json();
      cache = Array.isArray(data) ? (data as Tournament[]) : [];
      notify(cache);
      return cache;
    } catch (err) {
      console.error('Error loading tournaments:', err);
      // Keep the previous cache on a failed refresh so the UI does not blank out.
      if (cache) return cache;
      throw err;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export async function createTournament(
  payload: Record<string, unknown>
): Promise<Tournament> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || 'Tạo giải đấu không thành công, vui lòng thử lại.');
  }
  await fetchTournaments(true); // refresh cache so lists/badges re-sync
  return body as Tournament;
}

export async function registerTeam(
  tournamentId: number,
  payload: Record<string, unknown>
): Promise<{ message: string; registeredTeams: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tournaments/${tournamentId}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || 'Đăng ký không thành công, vui lòng thử lại.');
  }
  await fetchTournaments(true); // refresh cache with the new registration count
  return body;
}

export interface BracketTeam {
  name: string;
  elo?: number;
  seed?: number;
  tbd?: boolean;
}

export interface BracketMatch {
  matchId: string;
  teamA?: BracketTeam;
  teamB?: BracketTeam;
  bye?: BracketTeam;
  scoreA?: number;
  scoreB?: number;
  status?: string; // SCHEDULED | BYE | TBD
  winner?: string | null;
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface TournamentBracketData {
  tournamentId: number;
  title: string;
  drawnAt: string;
  method: string;
  teamCount: number;
  rounds: BracketRound[];
}

const friendlyAdminError = (err: unknown, fallback: string): string => {
  const msg = err instanceof Error ? err.message : fallback;
  if (/401|403/.test(msg)) return "Phiên ORGANIZER/ADMIN hết hạn hoặc thiếu quyền — hãy đăng nhập lại.";
  return msg;
};

/**
 * Nút "Giả lập đủ đội (Test)" — cần đăng nhập ORGANIZER/ADMIN (gửi kèm token).
 */
export async function fillSimulatedTeams(tournamentId: number): Promise<{ message: string; added: number; registeredTeams: number }> {
  try {
    const body = await apiRequest<{ message: string; added: number; registeredTeams: number }>(
      `/api/v1/tournaments/${tournamentId}/fill-teams`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Giả lập đội thất bại.'));
  }
};

/** Bốc thăm chia cặp thật — cần đăng nhập ORGANIZER/ADMIN. */
export async function drawTournamentBracket(tournamentId: number): Promise<{ message: string; bracket: TournamentBracketData }> {
  try {
    const body = await apiRequest<{ message: string; bracket: TournamentBracketData }>(
      `/api/v1/tournaments/${tournamentId}/draw`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Bốc thăm thất bại.'));
  }
}

/** Xóa đội Test đã giả lập (giữ đội thật) — cần ORGANIZER/ADMIN. */
export async function clearSimulatedTeams(tournamentId: number): Promise<{ message: string; removed: number; registeredTeams: number }> {
  try {
    const body = await apiRequest<{ message: string; removed: number; registeredTeams: number }>(
      `/api/v1/tournaments/${tournamentId}/simulated-teams`,
      { method: 'DELETE' }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Xóa đội Test thất bại.'));
  }
}

export interface EloChange {
  team: string;
  oldElo: number;
  newElo: number;
  delta: number;
}

export interface MatchSaveResult {
  message: string;
  winner: string;
  aiOnline: boolean;
  eloChanges: EloChange[];
  bracket: TournamentBracketData;
}

/** Nhập kết quả trận — cần ORGANIZER/ADMIN. */
export async function saveMatchResult(
  tournamentId: number,
  payload: { matchId: string; scoreA: number; scoreB: number }
): Promise<MatchSaveResult> {
  try {
    const body = await apiRequest<MatchSaveResult>(
      `/api/v1/tournaments/${tournamentId}/matches`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Lưu kết quả thất bại.'));
  }
}

/** Lấy nhánh đấu đã bốc thăm (public). Trả null khi giải chưa bốc thăm. */
export async function fetchTournamentBracket(tournamentId: number): Promise<TournamentBracketData | null> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tournaments/${tournamentId}/bracket`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as TournamentBracketData;
}

// ---------------------------------------------------------------------------
// Selectors used by the filter ribbon and the navigation tabs.
// ---------------------------------------------------------------------------
export const countBySport = (list: Tournament[], sport?: SportType | 'all'): number =>
  !sport || sport === 'all'
    ? list.length
    : list.filter((t) => t.sportType === sport).length;

export const countOpen = (list: Tournament[]): number =>
  list.filter((t) => (t.status ?? 'OPEN') === 'OPEN' && !isFull(t)).length;

export const countLive = (list: Tournament[]): number =>
  list.filter((t) => t.status === 'ONGOING').length;

/**
 * Featured tournament for the hero banner:
 * prefer an OPEN tournament that still has free slots and the largest prize pool.
 */
export const pickFeatured = (list: Tournament[]): Tournament | null => {
  if (!list.length) return null;
  const openSpots = list.filter((t) => (t.status ?? 'OPEN') === 'OPEN' && !isFull(t));
  const pool = openSpots.length ? openSpots : list;
  return [...pool].sort((a, b) => (b.prizePool ?? 0) - (a.prizePool ?? 0))[0];
};

/** Tournaments filtered by the active sport ribbon tab. */
export const filterBySport = (
  list: Tournament[],
  sport: SportType | 'all'
): Tournament[] => (sport === 'all' ? list : list.filter((t) => t.sportType === sport));
