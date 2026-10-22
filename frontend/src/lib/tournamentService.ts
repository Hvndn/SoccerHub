import { API_BASE_URL, apiRequest, fetchWithTimeout, fetchWithStatus, getAuthToken } from './api';

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
  form?: string | null;
  record?: string | null;
  winRate?: number | null;
  played?: number | null;
  won?: number | null;
  drawn?: number | null;
  lost?: number | null;
  memberNames?: string | null;
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
  /** Quyền tham gia: PUBLIC (ai cũng được) | INVITE_ONLY (chỉ email được mời). */
  joinMode?: "PUBLIC" | "INVITE_ONLY" | null;
  /** Danh sách email được BTC mời (chỉ có ý nghĩa khi joinMode = INVITE_ONLY). */
  invitedEmails?: string[] | null;
  bankCode?: string | null;
  bankAccount?: string | null;
  accountName?: string | null;
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
  format === 'KNOCKOUT' ? 'Loại Trực Tiếp' : 'Vòng Tròn Tính Điểm';

/**
 * Rút gọn tên giải cho mã biên bản.
 *
 * <p>Cắt tại ranh giới từ để không bị cụt giữa chữ (slice thẳng cho ra
 * "Turfzone Grandmast").</p>
 */
export const shortTournamentCode = (title?: string | null): string => {
  const t = (title ?? '').trim();
  if (!t) return 'SH';
  const words = t.split(/\s+/);
  let out = '';
  for (const w of words) {
    const next = out ? `${out} ${w}` : w;
    if (next.length > 20) break;
    out = next;
  }
  return out || words[0].slice(0, 20);
};

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
  // Danh sách đội là nguồn thật — số đếm cache (registeredTeams) có thể lệch seed
  t.teams?.length ?? t.registeredTeams ?? 0;

/**
 * Số đội ĐÃ VÀO GIẢI (đã đóng lệ phí `CONFIRMED` hoặc đội Test `SIMULATED`).
 *
 * <p>Đội đang chờ chuyển khoản (`PENDING_PAYMENT`) chưa chiếm suất thi đấu nên
 * không tính vào sức chứa — nếu tính thì giải 8 chỗ sẽ hiện "9/8 đội".</p>
 */
export const confirmedCount = (t: Tournament): number => {
  const teams = t.teams ?? [];
  if (teams.length === 0) return t.registeredTeams ?? 0;
  return teams.filter((x) => {
    const st = (x.registrationStatus || "CONFIRMED").toUpperCase();
    return st === "CONFIRMED" || st === "SIMULATED" || x.simulated === true;
  }).length;
};

/**
 * Số đội THỰC SỰ bốc thăm được.
 *
 * Backend (POST /{id}/draw) loại bỏ đội `PENDING_PAYMENT` và chỉ nhận đội
 * `CONFIRMED` (đã đóng lệ phí) hoặc `SIMULATED` (đội Test). Vì vậy nút "Bốc thăm
 * ngay" phải đếm theo đúng quy tắc này, nếu không BTC sẽ bấm vào nhận lỗi 400
 * "Cần ít nhất 2 đội đã đóng lệ phí mới bốc thăm được".
 */
export const drawableCount = (t: Tournament): number => {
  const teams = t.teams ?? [];
  if (teams.length === 0) {
    // Chưa nạp được danh sách đội -> fallback về số đã đăng ký trong cache.
    return t.registeredTeams ?? 0;
  }
  return teams.filter((x) => {
    const st = (x.registrationStatus || "CONFIRMED").toUpperCase();
    return st === "CONFIRMED" || st === "SIMULATED" || x.simulated === true;
  }).length;
};

export const capacity = (t: Tournament): number => t.totalTeams ?? 0;

export const isFull = (t: Tournament): boolean => {
  const cap = capacity(t);
  return cap > 0 && registeredCount(t) >= cap;
};

export const fillPercent = (t: Tournament): number => {
  const cap = capacity(t);
  if (!cap) return 0;
  // Tính trên số đội đã vào giải (đội chờ cọc chưa chiếm suất)
  return Math.min(100, Math.round((confirmedCount(t) / cap) * 100));
};

// ---------------------------------------------------------------------------
// Shared cache: CommunityForm (badge count) and TournamentLeaderboard (list)
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

/**
 * Làm mới MỘT giải trong cache (GET /tournaments/{id}) thay vì GET toàn bộ danh sách.
 *
 * <p>Sau mỗi thao tác tạo giải / thêm đội / bốc thăm, code cũ gọi
 * {@code fetchTournaments(true)} — tức tải lại TOÀN BỘ giải đấu (kèm danh sách đội và
 * phong độ của từng đội). Danh sách càng dài thì càng chậm, và người dùng phải đứng
 * chờ. Hàm này chỉ tải đúng giải vừa thay đổi rồi cập nhật tại chỗ trong cache.</p>
 */
export async function refreshTournamentInCache(tournamentId: number): Promise<Tournament | null> {
  try {
    const res = await fetchWithStatus(`${API_BASE_URL}/api/v1/tournaments/${tournamentId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const one = (await res.json()) as Tournament;
    if (!one || !one.id) return null;
    if (cache) {
      const idx = cache.findIndex((t) => t.id === one.id);
      if (idx >= 0) cache[idx] = one;
      else cache = [one, ...cache];
      notify(cache);
    }
    return one;
  } catch {
    return null;
  }
}

export async function fetchTournaments(force = false): Promise<Tournament[]> {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    try {
      // PHẢI gửi token: backend che captainPhone/captainEmail khi không có
      // @AuthenticationPrincipal (gọi ẩn danh). Thiếu token => "Đội của tôi" LUÔN
      // rỗng vì SĐT bị che thành 0912****678 không khớp SĐT của tôi.
      const token = getAuthToken();
      const res = await fetchWithStatus(`${API_BASE_URL}/api/v1/tournaments`, {
        cache: 'no-store',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
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
  // Bắt buộc gửi kèm token (backend yêu cầu ADMIN/ORGANIZER cho endpoint tạo giải)
  const body = await apiRequest<Tournament>('/api/v1/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  // Chỉ tải lại GIẢI VỪA TẠO thay vì toàn bộ danh sách (nhanh hơn nhiều khi đã có nhiều giải).
  await refreshTournamentInCache(body?.id ?? 0);
  return body;
}

/**
 * Ban tổ chức sửa thông tin giải sau khi đã đăng (tên, thể thức, thưởng, lệ phí,
 * hạn đăng ký, sân thi đấu…). Chỉ gửi các field thực sự đổi — backend giữ nguyên
 * phần còn lại. Yêu cầu token ORGANIZER/ADMIN.
 */
export async function updateTournament(
  tournamentId: number,
  patch: Record<string, unknown>
): Promise<Tournament> {
  const body = await apiRequest<Tournament>(`/api/v1/tournaments/${tournamentId}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  await fetchTournaments(true); // refresh cache so lists/badges re-sync
  return body;
}

export interface TournamentFinance {
  tournamentId: number;
  tournamentTitle: string;
  status: string;
  entryFee: number;
  prizePool: number;
  totalTeams: number;
  capacity: number;
  confirmedTeams: number;
  pendingTeams: number;
  simulatedTeams: number;
  totalCollected: number;
  totalAwaiting: number;
  prizeToPay: number;
  netAfterPrize: number;
  fillPercent: number;
}

/** Thống kê tài chính giải cho Ban tổ chức. Yêu cầu token ORGANIZER/ADMIN. */
export async function fetchTournamentFinance(
  tournamentId: number
): Promise<TournamentFinance> {
  return apiRequest<TournamentFinance>(`/api/v1/tournaments/${tournamentId}/finance`);
}

export async function registerTeam(
  tournamentId: number,
  payload: Record<string, unknown>
): Promise<{ message: string; registeredTeams: number }> {
  // PHẢI dùng apiRequest (tự gắn Bearer token) — gọi fetchWithStatus trực tiếp sẽ
  // không có token nên backend trả 403 "Forbidden" dù người dùng đã đăng nhập.
  const body = await apiRequest<{ message: string; registeredTeams: number }>(
    `/api/v1/tournaments/${tournamentId}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  await refreshTournamentInCache(tournamentId); // chỉ làm mới giải vừa đăng ký đội
  return body;
}

export interface BracketTeam {
  name: string;
  elo?: number;
  form?: string | null;
  record?: string | null;
  winRate?: number | null;
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
  status?: string; // SCHEDULED | BYE | TBD | DONE
  winner?: string | null;
  /** Lịch do BTC sinh qua POST /schedule (chưa xếp thì undefined). */
  matchDate?: string; // yyyy-MM-dd
  timeSlot?: string; // "17:00 - 19:00"
  pitchName?: string;
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
 * Nút "Giả lập đủ đội (Test)" — sinh đội ảo kèm đủ quân số + danh sách thành
 * viên, lưu thật vào CSDL. count: chỉ thêm đúng n đội (mặc định lấp đầy sức chứa).
 * Cần đăng nhập ORGANIZER/ADMIN (gửi kèm token).
 */
export async function fillSimulatedTeams(tournamentId: number, count?: number): Promise<{ message: string; added: number; registeredTeams: number }> {
  try {
    const body = await apiRequest<{ message: string; added: number; registeredTeams: number }>(
      `/api/v1/tournaments/${tournamentId}/fill-teams`,
      { method: 'POST', body: JSON.stringify(count && count > 0 ? { count } : {}) }
    );
    await refreshTournamentInCache(tournamentId);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Giả lập đội thất bại.'));
  }
};

/** Giả lập kết quả toàn giải (random tỷ số + cầu thủ ghi bàn) — demo BXH/phong độ. Cần ORGANIZER/ADMIN. */
export async function simulateTournamentResults(tournamentId: number): Promise<{ message: string; simulated: number; champion: string; bracket: TournamentBracketData }> {
  try {
    const body = await apiRequest<{ message: string; simulated: number; champion: string; bracket: TournamentBracketData }>(
      `/api/v1/tournaments/${tournamentId}/simulate-results`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Giả lập kết quả thất bại.'));
  }
}

/** Bốc thăm chia cặp thật — cần đăng nhập ORGANIZER/ADMIN. */export async function drawTournamentBracket(tournamentId: number): Promise<{ message: string; bracket: TournamentBracketData }> {
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
    await refreshTournamentInCache(tournamentId);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Xóa đội Test thất bại.'));
  }
}

export interface ScheduleInput {
  /** yyyy-MM-dd — mặc định lấy startDate của giải. */
  startDate?: string;
  /** Số trận mỗi ngày (mặc định 2). */
  matchesPerDay?: number;
  /** Số ngày cách giữa hai vòng (mặc định 2). */
  daysBetweenRounds?: number;
  /** Giờ bắt đầu trận đầu tiên trong ngày (mặc định 17). */
  startHour?: number;
  /** Độ dài mỗi trận phút (mặc định 120). */
  matchMinutes?: number;
}

export interface ScheduleResult {
  message: string;
  scheduled: number;
  bracket: TournamentBracketData;
}

/**
 * BTC sinh lịch thi đấu thật (ngày + khung giờ + sân) cho toàn bộ trận trong nhánh đấu.
 * Kết quả được ghi vào bracketJson nên canvas tự hiện lịch sau khi refresh cache.
 */
export async function generateTournamentSchedule(
  tournamentId: number,
  input: ScheduleInput = {}
): Promise<ScheduleResult> {
  try {
    const body = await apiRequest<ScheduleResult>(
      `/api/v1/tournaments/${tournamentId}/schedule`,
      { method: 'POST', body: JSON.stringify(input) }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Xếp lịch thi đấu thất bại.'));
  }
}

export interface ScorerRow {
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  rank?: number;
}

/** BXH Vua phá lưới một giải. */
export async function fetchTournamentScorers(tournamentId: number): Promise<ScorerRow[]> {
  const res = await fetchWithStatus(`${API_BASE_URL}/api/v1/tournaments/${tournamentId}/scorers`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Top Vua phá lưới toàn hệ thống (widget trang chủ). */
export async function fetchTopScorers(limit = 5): Promise<ScorerRow[]> {
  const res = await fetchWithStatus(`${API_BASE_URL}/api/v1/tournaments/scorers/top?limit=${limit}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** BTC xác nhận đã thu lệ phí của một đội. */
export async function confirmTeamPayment(tournamentId: number, teamName: string): Promise<{ message: string }> {
  try {
    return await apiRequest(
      `/api/v1/tournaments/${tournamentId}/teams/confirm-payment`,
      { method: 'POST', body: JSON.stringify({ teamName }) }
    );
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Xác nhận lệ phí thất bại.'));
  }
}

/** Dựng URL ảnh QR VietQR từ thông tin nhận tiền của giải. Null khi giải chưa có STK. */
export function buildVietQrUrl(t: {
  bankCode?: string | null;
  bankAccount?: string | null;
  accountName?: string | null;
  entryFee?: number | null;
  addInfo?: string;
}): string | null {
    if (!t.bankCode || !t.bankAccount) return null;
    // So tai khoan ngan hang khong chua khoang trang: VietQR dung STK nguyen ban de
    // ma QR -> khoang trang lam QR sai (khong quet duoc) va chuyen khoan that bi loi.
    const bankAccount = String(t.bankAccount).replace(/\s+/g, "");
  const amount = Math.max(0, Math.round(t.entryFee ?? 0));
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: (t.addInfo ?? "").slice(0, 25),
    accountName: (t.accountName ?? "").slice(0, 50),
  });
    return `https://api.vietqr.io/image/${t.bankCode}-${bankAccount}-compact2.png?${params.toString()}`;
}

export interface TeamFormSnapshot {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  winRate: number;
  form: string;
  record: string;
}

export interface FormChange {
  team: string;
  before: TeamFormSnapshot;
  after: TeamFormSnapshot;
}

export interface MatchSaveResult {
  message: string;
  winner: string | null;
  formChanges: FormChange[];
  bracket: TournamentBracketData;
}

export interface MatchUndoResult {
  message: string;
  matchId: string;
  goalEventsRemoved: number;
  bracket: TournamentBracketData;
}

/** Nhập kết quả trận — cần ORGANIZER/ADMIN. */
export async function saveMatchResult(
  tournamentId: number,
  payload: {
    matchId: string;
    scoreA: number;
    scoreB: number;
    scorers?: { playerName: string; teamName: string; goals: number; assists: number }[];
    yellowCardsA?: number;
    yellowCardsB?: number;
    redCardsA?: number;
    redCardsB?: number;
    substitutionsA?: number;
    substitutionsB?: number;
    mvpPlayer?: string;
    notes?: string;
  }
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

/**
 * Huỷ kết quả một trận đã đánh: xóa bản ghi + cầu thủ ghi bàn,
 * mở lại trận để BTC nhập kết quả mới — cần ORGANIZER/ADMIN.
 * Phong độ tính live nên tự đúng, không cần hoàn điểm.
 */
export async function undoMatchResult(
  tournamentId: number,
  matchId: string
): Promise<MatchUndoResult> {
  try {
    const body = await apiRequest<MatchUndoResult>(
      `/api/v1/tournaments/${tournamentId}/matches/${encodeURIComponent(matchId)}`,
      { method: 'DELETE' }
    );
    await fetchTournaments(true);
    return body;
  } catch (err) {
    throw new Error(friendlyAdminError(err, 'Huỷ kết quả thất bại.'));
  }
}

/** Lấy nhánh đấu đã bốc thăm (public). Trả null khi giải chưa bốc thăm. */
export async function fetchTournamentBracket(tournamentId: number): Promise<TournamentBracketData | null> {
  const res = await fetchWithStatus(`${API_BASE_URL}/api/v1/tournaments/${tournamentId}/bracket`, { cache: 'no-store' });
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
