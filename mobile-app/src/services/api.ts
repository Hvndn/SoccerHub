import { todayLocal, addDaysLocal } from '../theme/responsive';

export function resolveApiUrl(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    const hostUri =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoGo?.developer?.host ||
      null;
    if (hostUri) {
      const raw = String(hostUri);
      const host = raw.startsWith('http') ? new URL(raw).hostname : raw.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8080/api/v1`;
      }
    }
  } catch {
    // Fallback to localhost
  }
  return 'http://localhost:8080/api/v1';
}

export const API_URL = resolveApiUrl();

export interface AuthUser {
  id?: number;
  fullName?: string;
  email: string;
  phone?: string;
  role?: 'PLAYER' | 'OWNER' | 'ORGANIZER' | 'ADMIN' | string;
  level?: string;
}

export interface Pitch {
  id: number;
  name: string;
  address: string;
  area: string;
  phone?: string;
  avgPricePerHour: number;
  peakPricePerHour?: number;
  rating: number;
  openTime: string;
  closeTime: string;
  pitchTypes?: string[];
  amenities?: string[];
  imageUrl: string;
  description?: string;
}

export interface FreeSlot {
  time: string;
  courtName: string;
  courtType: string;
  price: number;
  peak: boolean;
  status?: 'empty' | 'booked' | 'playing';
}

export interface MatrixCourt {
  pitchId?: string | number;
  pitchName: string;
  type?: string;
  slots: { time: string; status: string; priceValue?: number; price?: string; note?: string }[];
}

export interface BookingItem {
  id: number;
  code: string;
  pitchId?: number;
  pitchName?: string;
  courtName: string;
  courtType?: string;
  bookingDate: string;
  timeSlot: string;
  status: 'BOOKED' | 'PLAYING' | 'COMPLETED' | 'CANCELLED' | string;
  totalPrice: number;
  depositPaid: number;
  cashDue: number;
  customerName?: string;
  customerPhone?: string;
  note?: string;
}

export interface AttendanceRecord {
  id: number;
  bookingId: number;
  playerName: string;
  playerPhone?: string;
  status: 'GOING' | 'MAYBE' | 'ABSENT';
  position?: string;
  extraGuests?: number;
  note?: string;
}

export interface MatchmakingPostItem {
  id: number;
  teamName: string;
  captainName: string;
  captainPhone: string;
  pitchName: string;
  area?: string;
  pitchType: 'SAN_5' | 'SAN_7' | 'SAN_11' | 'FUTSAL' | string;
  matchTime: string;
  skillLevel: string;
  paymentModel: '50_50' | '70_30' | 'LOSER_PAYS' | 'HOST_COVER' | string;
  estimatedFee: number;
  notes?: string;
  status: 'OPEN' | 'MATCHED' | string;
  opponentTeamName?: string;
  opponentCaptainName?: string;
  opponentCaptainPhone?: string;
  postType?: 'MATCH' | 'SOS';
  neededCount?: number;
  neededPositions?: string;
  matchStyle?: string;
  ageGroup?: string;
  homeKitColor?: string;
  awayKitColor?: string;
  refereeOption?: string;
  waterOption?: string;
}

export interface TournamentItem {
  id: number;
  title: string;
  status: 'OPEN' | 'ONGOING' | 'COMPLETED' | string;
  prizePool: number;
  entryFee: number;
  totalTeams: number;
  registeredTeams: number;
  pitchName: string;
  location?: string;
  startDate: string;
  format: string;
  sportType: string;
}

export interface MatchEventItem {
  id: string;
  type: 'GOAL' | 'YELLOW' | 'RED';
  team: 't1' | 't2';
  playerName: string;
  minute: number;
}

export interface BracketMatchItem {
  id: string;
  round: 'QF' | 'SF' | 'FINAL';
  matchLabel: string;
  t1: string;
  t2: string;
  s1: number | null;
  s2: number | null;
  time: string;
  pitch: string;
  status: 'COMPLETED' | 'LIVE' | 'UPCOMING';
  events: MatchEventItem[];
}

export interface TopScorerItem {
  rank: number;
  playerName: string;
  teamName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  mvpCount: number;
}

export const FALLBACK_PITCHES: Pitch[] = [
  {
    id: 1,
    name: 'Tổ Hợp Sân Cỏ Nhân Tạo Chảo Lửa Pro',
    address: '30 Phan Thúc Duyện, Quận Tân Bình, TP.HCM',
    area: 'Tân Bình',
    phone: '0909123456',
    avgPricePerHour: 350000,
    peakPricePerHour: 480000,
    rating: 4.9,
    openTime: '05:30',
    closeTime: '23:30',
    pitchTypes: ['SAN_5', 'SAN_7'],
    amenities: ['Đèn LED chống chói', 'Giữ xe miễn phí', 'Trọng tài phủi', 'Căn tin & Trà đá'],
    imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80',
    description: 'Cỏ nhân tạo chuẩn FIFA, hệ thống thoát nước nhanh, mặt sân êm giảm chấn thương cổ chân.',
  },
  {
    id: 2,
    name: 'Cụm Sân Bóng Đá Gia Định Arena',
    address: '125 Hoàng Minh Giám, Quận Phú Nhuận, TP.HCM',
    area: 'Phú Nhuận',
    phone: '0918234567',
    avgPricePerHour: 320000,
    peakPricePerHour: 450000,
    rating: 4.8,
    openTime: '06:00',
    closeTime: '23:00',
    pitchTypes: ['SAN_5', 'SAN_7'],
    amenities: ['Áo Bib sạch thơm', 'Phòng thay đồ', 'Quay Highlight AI', 'Wifi tốc độ cao'],
    imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=900&q=80',
    description: 'Không gian thoáng mát nhiều cây xanh, có bảng tỷ số điện tử và dịch vụ nước uống tận sân.',
  },
  {
    id: 3,
    name: 'Nhà Thi Đấu Futsal & Sân 7 Thủ Đức Center',
    address: '88 Phạm Văn Đồng, TP. Thủ Đức, TP.HCM',
    area: 'Thủ Đức',
    phone: '0933888999',
    avgPricePerHour: 380000,
    peakPricePerHour: 520000,
    rating: 4.9,
    openTime: '06:00',
    closeTime: '24:00',
    pitchTypes: ['FUTSAL', 'SAN_7'],
    amenities: ['Sân trong nhà mái che', 'Thảm Futsal tiêu chuẩn', 'Chỗ đậu ô tô', 'Cho thuê giày'],
    imageUrl: 'https://images.unsplash.com/photo-1518605368461-1ee7c632b0b2?auto=format&fit=crop&w=900&q=80',
    description: 'Bất chấp mưa nắng với hệ thống mái che cao thoáng và sàn gỗ/thảm Futsal chuyên nghiệp.',
  },
];

export function buildFallbackSlots(pitchId: number): FreeSlot[] {
  const basePrice = pitchId === 3 ? 380000 : pitchId === 2 ? 320000 : 350000;
  const peakPrice = pitchId === 3 ? 520000 : pitchId === 2 ? 450000 : 480000;
  return [
    { time: '16:00 - 17:30', courtName: 'Sân 7A', courtType: 'Sân 7', price: basePrice, peak: false, status: 'empty' },
    { time: '17:30 - 19:00', courtName: 'Sân 7A', courtType: 'Sân 7', price: peakPrice, peak: true, status: 'empty' },
    { time: '19:00 - 20:30', courtName: 'Sân 7B', courtType: 'Sân 7', price: peakPrice, peak: true, status: 'empty' },
    { time: '20:30 - 22:00', courtName: 'Sân 7B', courtType: 'Sân 7', price: basePrice, peak: false, status: 'empty' },
    { time: '18:00 - 19:30', courtName: 'Sân 5A', courtType: 'Sân 5', price: basePrice - 50000, peak: true, status: 'empty' },
    { time: '19:30 - 21:00', courtName: 'Sân 5B', courtType: 'Sân 5', price: basePrice - 50000, peak: true, status: 'empty' },
  ];
}

export const FALLBACK_BOOKINGS: BookingItem[] = [
  {
    id: 901,
    code: 'TZ-2026-8891',
    pitchId: 1,
    pitchName: 'Tổ Hợp Sân Cỏ Nhân Tạo Chảo Lửa Pro',
    courtName: 'Sân 7A (Cỏ FIFA)',
    courtType: 'Sân 7',
    bookingDate: todayLocal(),
    timeSlot: '19:00 - 20:30',
    status: 'BOOKED',
    totalPrice: 480000,
    depositPaid: 240000,
    cashDue: 240000,
    customerName: 'Nguyễn Minh Quân',
    customerPhone: '0909123456',
    note: 'Nhờ chủ sân chuẩn bị sẵn 2 quả bóng Động Lực và 1 bộ áo Bib màu cam.',
  },
  {
    id: 902,
    code: 'TZ-2026-8904',
    pitchId: 2,
    pitchName: 'Cụm Sân Bóng Đá Gia Định Arena',
    courtName: 'Sân 5B (Gần căn tin)',
    courtType: 'Sân 5',
    bookingDate: addDaysLocal(2).dateStr,
    timeSlot: '18:00 - 19:30',
    status: 'BOOKED',
    totalPrice: 360000,
    depositPaid: 180000,
    cashDue: 180000,
    customerName: 'Nguyễn Minh Quân',
    customerPhone: '0909123456',
    note: 'Kèo nội bộ công ty hàng tuần.',
  },
];

export const FALLBACK_MATCHMAKING: MatchmakingPostItem[] = [
  {
    id: 501,
    teamName: 'FC Anh Em Văn Phòng Sài Gòn',
    captainName: 'Hoàng Nam',
    captainPhone: '0912345678',
    pitchName: 'Tổ Hợp Sân Cỏ Nhân Tạo Chảo Lửa Pro (Sân 7A)',
    area: 'Tân Bình',
    pitchType: 'SAN_7',
    matchTime: `19:00 - 20:30 • Hôm nay (${todayLocal()})`,
    skillLevel: 'Trung bình / Văn phòng',
    paymentModel: '50_50',
    estimatedFee: 240000,
    notes: 'Đội toàn anh em dân văn phòng đá nhẹ nhàng dưỡng sinh, giữ chân giữ cẳng, tuyệt đối không xoạc bóng.',
    status: 'OPEN',
    postType: 'MATCH',
    matchStyle: 'Đá dưỡng sinh / Vui vẻ',
    ageGroup: 'Phong trào (U25 - U35)',
    homeKitColor: 'Đỏ',
    refereeOption: 'Thuê trọng tài 50-50',
    waterOption: 'Mỗi đội 1 bình đá',
  },
  {
    id: 502,
    teamName: '🚨 SOS: FC Bình Thạnh Cần Gấp 2 Chân',
    captainName: 'Tuấn Kiệt',
    captainPhone: '0987654321',
    pitchName: 'Cụm Sân Bóng Đá Gia Định Arena (Sân 7B)',
    area: 'Phú Nhuận',
    pitchType: 'SAN_7',
    matchTime: `18:30 - 20:00 • Hôm nay (${todayLocal()})`,
    skillLevel: 'Mọi trình độ',
    paymentModel: 'HOST_COVER',
    estimatedFee: 0,
    notes: 'Đội có 2 anh em báo bận đột xuất sát giờ bóng lăn. Cần gấp 1 Thủ môn và 1 Tiền vệ chạy cánh, miễn phí tiền sân + bao nước!',
    status: 'OPEN',
    postType: 'SOS',
    neededCount: 2,
    neededPositions: 'Thủ môn, Tiền vệ',
    matchStyle: 'Đá dưỡng sinh / Vui vẻ',
    ageGroup: 'Mọi lứa tuổi',
    homeKitColor: 'Xanh Dương',
    refereeOption: 'Tự bắt / Giao lưu',
  },
  {
    id: 503,
    teamName: 'FC Tia Chớp Thủ Đức',
    captainName: 'Lê Bảo',
    captainPhone: '0938112233',
    pitchName: 'Nhà Thi Đấu Futsal & Sân 7 Thủ Đức Center',
    area: 'Thủ Đức',
    pitchType: 'SAN_7',
    matchTime: `20:00 - 21:30 • Ngày mai (${addDaysLocal(1).dateStr})`,
    skillLevel: 'Khá / Bán chuyên',
    paymentModel: '70_30',
    estimatedFee: 350000,
    notes: 'Tìm đối cứng cọ xát chuẩn bị giải quận. Có thuê trọng tài liên đoàn bắt chính.',
    status: 'OPEN',
    postType: 'MATCH',
    matchStyle: 'Cọ xát / Đá nhiệt',
    ageGroup: 'Trẻ (U20 - U25)',
    homeKitColor: 'Vàng',
    refereeOption: 'Có sẵn trọng tài & nước',
  },
];

export const FALLBACK_TOURNAMENTS: TournamentItem[] = [
  {
    id: 301,
    title: 'Siêu Cúp Bóng Đá Phủi Turfzone Mở Rộng 2026',
    status: 'OPEN',
    prizePool: 25000000,
    entryFee: 2500000,
    totalTeams: 16,
    registeredTeams: 12,
    pitchName: 'Tổ Hợp Sân Cỏ Nhân Tạo Chảo Lửa Pro',
    location: 'Quận Tân Bình, TP.HCM',
    startDate: '15/11/2026',
    format: 'Đấu bảng + Loại trực tiếp (Sân 7)',
    sportType: 'Sân 7 Người',
  },
  {
    id: 302,
    title: 'Giải Giao Hữu Các Doanh Nghiệp Sài Gòn Cup',
    status: 'ONGOING',
    prizePool: 15000000,
    entryFee: 2000000,
    totalTeams: 8,
    registeredTeams: 8,
    pitchName: 'Cụm Sân Bóng Đá Gia Định Arena',
    location: 'Quận Phú Nhuận, TP.HCM',
    startDate: '01/11/2026',
    format: 'Loại trực tiếp 8 đội (Sân 7)',
    sportType: 'Sân 7 Người',
  },
  {
    id: 303,
    title: 'Cúp Futsal Mùa Đông Thủ Đức Arena',
    status: 'OPEN',
    prizePool: 12000000,
    entryFee: 1500000,
    totalTeams: 12,
    registeredTeams: 9,
    pitchName: 'Nhà Thi Đấu Futsal & Sân 7 Thủ Đức Center',
    location: 'TP. Thủ Đức, TP.HCM',
    startDate: '22/11/2026',
    format: 'Vòng tròn tính điểm + Bán kết (Futsal 5v5)',
    sportType: 'Futsal 5 Người',
  },
];

export const INITIAL_BRACKET_MATCHES: BracketMatchItem[] = [
  {
    id: 'qf1',
    round: 'QF',
    matchLabel: 'Tứ Kết 1',
    t1: 'FC Chảo Lửa',
    t2: 'FC Văn Phòng SG',
    s1: 3,
    s2: 1,
    time: '18:00 • Sân 7A',
    pitch: 'Sân 7A',
    status: 'COMPLETED',
    events: [
      { id: 'e1', type: 'GOAL', team: 't1', playerName: 'Nguyễn Quang Hải', minute: 12 },
      { id: 'e2', type: 'GOAL', team: 't2', playerName: 'Trần Hoàng Nam', minute: 24 },
      { id: 'e3', type: 'YELLOW', team: 't2', playerName: 'Lê Minh Tuấn', minute: 31 },
      { id: 'e4', type: 'GOAL', team: 't1', playerName: 'Nguyễn Quang Hải', minute: 42 },
      { id: 'e5', type: 'GOAL', team: 't1', playerName: 'Phạm Đức Huy', minute: 49 },
    ],
  },
  {
    id: 'qf2',
    round: 'QF',
    matchLabel: 'Tứ Kết 2',
    t1: 'FC Tia Chớp',
    t2: 'FC Gia Định',
    s1: 2,
    s2: 2,
    time: '19:30 • Sân 7B',
    pitch: 'Sân 7B',
    status: 'LIVE',
    events: [
      { id: 'e6', type: 'GOAL', team: 't1', playerName: 'Vũ Văn Thanh', minute: 8 },
      { id: 'e7', type: 'GOAL', team: 't2', playerName: 'Đỗ Hùng Dũng', minute: 19 },
      { id: 'e8', type: 'GOAL', team: 't2', playerName: 'Đỗ Hùng Dũng', minute: 35 },
      { id: 'e9', type: 'GOAL', team: 't1', playerName: 'Nguyễn Tiến Linh', minute: 44 },
    ],
  },
  {
    id: 'sf1',
    round: 'SF',
    matchLabel: 'Bán Kết 1',
    t1: 'FC Chảo Lửa',
    t2: 'FC Tia Chớp',
    s1: null,
    s2: null,
    time: '19:00 • Chủ Nhật',
    pitch: 'Sân 7A',
    status: 'UPCOMING',
    events: [],
  },
  {
    id: 'final',
    round: 'FINAL',
    matchLabel: 'Chung Kết Giải',
    t1: 'Thắng Bán Kết 1',
    t2: 'FC Phú Nhuận United',
    s1: null,
    s2: null,
    time: '20:00 • Chung Kết',
    pitch: 'Sân Trung Tâm',
    status: 'UPCOMING',
    events: [],
  },
];

export const INITIAL_TOP_SCORERS: TopScorerItem[] = [
  { rank: 1, playerName: 'Nguyễn Quang Hải', teamName: 'FC Chảo Lửa', goals: 7, assists: 4, yellowCards: 0, redCards: 0, matchesPlayed: 4, mvpCount: 3 },
  { rank: 2, playerName: 'Đỗ Hùng Dũng', teamName: 'FC Gia Định', goals: 5, assists: 5, yellowCards: 1, redCards: 0, matchesPlayed: 4, mvpCount: 2 },
  { rank: 3, playerName: 'Nguyễn Tiến Linh', teamName: 'FC Tia Chớp', goals: 5, assists: 2, yellowCards: 1, redCards: 0, matchesPlayed: 4, mvpCount: 1 },
  { rank: 4, playerName: 'Vũ Văn Thanh', teamName: 'FC Tia Chớp', goals: 4, assists: 3, yellowCards: 2, redCards: 0, matchesPlayed: 4, mvpCount: 1 },
  { rank: 5, playerName: 'Trần Hoàng Nam', teamName: 'FC Văn Phòng SG', goals: 3, assists: 2, yellowCards: 0, redCards: 0, matchesPlayed: 3, mvpCount: 1 },
];
