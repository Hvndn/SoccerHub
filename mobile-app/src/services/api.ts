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
  name?: string;
  email: string;
  phone?: string;
  role?: 'PLAYER' | 'OWNER' | 'ORGANIZER' | 'ADMIN' | 'GUEST' | string;
  level?: string;
}

export interface PitchTimeSlotPreview {
  time: string;
  price: string;
  status: 'AVAILABLE' | 'BOOKED' | string;
  tag: string;
}

export interface Pitch {
  id: number | string;
  numericId?: number;
  name: string;
  address: string;
  area: string;
  district?: string;
  districtName?: string;
  phone?: string;
  ownerName?: string;
  avgPricePerHour: number;
  peakPricePerHour?: number;
  rating: number;
  reviewsCount?: number;
  openTime: string;
  closeTime: string;
  slotDurationMinutes?: number;
  sport?: string;
  sportList?: string[];
  sportBadge?: string;
  pitchTypes?: string[];
  amenities?: string[];
  imageUrl: string;
  description?: string;
  timeSlots?: PitchTimeSlotPreview[];
}

export interface FreeSlot {
  time: string;
  courtName: string;
  courtType: string;
  price: number;
  peak: boolean;
  status?: 'empty' | 'booked' | 'playing' | 'pending';
  note?: string;
}

export interface MatrixCourt {
  pitchId?: string | number;
  pitchName: string;
  type?: string;
  slots: {
    time: string;
    status: string;
    priceValue?: number;
    price?: string;
    note?: string;
  }[];
}

export interface BookingAddon {
  id: string;
  name: string;
  price: number;
  desc: string;
}

export const AVAILABLE_ADDONS: BookingAddon[] = [
  { id: 'bib', name: '2 bộ áo bib phân đội', price: 30000, desc: 'Đủ 14 áo (2 màu phản quang sạch sẽ)' },
  { id: 'ball', name: 'Bóng thi đấu tiêu chuẩn', price: 20000, desc: '2 quả bóng Động Lực bơm căng chuẩn' },
  { id: 'water', name: 'Thùng nước suối ướp lạnh', price: 60000, desc: '24 chai 500ml + đá viên tại sân' },
  { id: 'gloves', name: 'Găng tay thủ môn', price: 20000, desc: '1 đôi găng tay bám dính tốt' },
];

export interface BookingItem {
  id: number;
  code: string;
  pitchId?: number | string;
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

const SPORT_CODE_TO_TAB: Record<string, string> = {
  SAN_5: 'SAN5',
  SAN5: 'SAN5',
  SAN_7: 'SAN7',
  SAN7: 'SAN7',
  SAN_11: 'SAN11',
  SAN11: 'SAN11',
  FUTSAL: 'FUTSAL',
};

export function pitchTypeLabel(code?: string): string {
  const c = String(code || '').toUpperCase().replace('_', '');
  if (c === 'SAN5') return 'Sân 5 người';
  if (c === 'SAN7') return 'Sân 7 người';
  if (c === 'SAN11') return 'Sân 11 người';
  if (c === 'FUTSAL') return 'Sân Futsal';
  return 'Sân 7 người';
}

export function isPeakSlot(slotTime: string): boolean {
  const hour = parseInt(String(slotTime || '').split(':')[0], 10);
  if (Number.isNaN(hour)) return false;
  return hour >= 17 && hour <= 19;
}

export function normalizePitchItem(item: any, idx = 0): Pitch {
  const rawId = item.id ? String(item.id).replace(/\D/g, '') : String(idx + 1);
  const numericId = Number(rawId) || idx + 1;
  const basePrice = Number(item.avgPricePerHour || item.priceOriginal || item.pricePerHour || 280000);
  const peakPrice = Number(item.peakPricePerHour || item.peakPrice || Math.round(basePrice * 1.3));
  const openTime = item.openTime || '14:00';
  const closeTime = item.closeTime || '22:30';
  const slotDur = Number(item.slotDurationMinutes || 120);

  const address = item.address || item.area || 'Đà Nẵng';
  const pitchName = item.name || 'Cụm sân bóng đá Đà Nẵng';

  const startH = parseInt(String(openTime).split(':')[0], 10) || 14;
  const endH = parseInt(String(closeTime).split(':')[0], 10) || 22;
  const dynamicSlots: PitchTimeSlotPreview[] = [];
  const stepMin = slotDur > 0 ? slotDur : 120;
  const openMin = Math.max(14 * 60, startH * 60);
  const closeMin = Math.max(openMin + stepMin, endH * 60);

  for (let m = openMin; m + stepMin <= closeMin; m += stepMin) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const endTotal = m + stepMin;
    const timeLabel = `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')} - ${String(
      Math.floor(endTotal / 60)
    ).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`;
    const peak = isPeakSlot(timeLabel);
    dynamicSlots.push({
      time: timeLabel,
      price: `${Math.round((peak ? peakPrice : basePrice) / 1000)}k`,
      status: 'AVAILABLE',
      tag: peak ? 'Ca Vàng' : 'Ca Thường',
    });
  }

  if (dynamicSlots.length === 0) {
    dynamicSlots.push(
      { time: '14:00 - 16:00', price: `${Math.round(basePrice / 1000)}k`, status: 'AVAILABLE', tag: 'Chiều' },
      { time: '16:00 - 18:00', price: `${Math.round(peakPrice / 1000)}k`, status: 'AVAILABLE', tag: 'Thường' },
      { time: '18:00 - 20:00', price: `${Math.round(peakPrice / 1000)}k`, status: 'AVAILABLE', tag: 'Ca Vàng' },
      { time: '20:00 - 22:00', price: `${Math.round(basePrice / 1000)}k`, status: 'AVAILABLE', tag: 'Ca Tối' }
    );
  }

  const rawTypes: string[] = Array.isArray(item.pitchTypes) && item.pitchTypes.length > 0
    ? item.pitchTypes
    : ['SAN_7', 'SAN_5'];
  const sportTabs = rawTypes.map(
    (t) => SPORT_CODE_TO_TAB[String(t).trim().toUpperCase()] ?? String(t).trim().toUpperCase()
  );

  const sport =
    sportTabs.includes('FUTSAL') && /futsal/i.test(pitchName)
      ? 'FUTSAL'
      : sportTabs.includes('SAN11') && /sân 11|11 người/i.test(pitchName)
      ? 'SAN11'
      : sportTabs.includes('SAN7')
      ? 'SAN7'
      : sportTabs.includes('SAN5')
      ? 'SAN5'
      : sportTabs[0] || 'SAN7';

  const districtCode = address.includes('Liên Chiểu')
    ? 'LIEN_CHIEU'
    : address.includes('Hải Châu')
    ? 'HAI_CHAU'
    : address.includes('Thanh Khê')
    ? 'THANH_KHE'
    : address.includes('Sơn Trà')
    ? 'SON_TRA'
    : address.includes('Cẩm Lệ')
    ? 'CAM_LE'
    : item.district || 'HAI_CHAU';

  const districtName = address.includes('Liên Chiểu')
    ? 'Q. Liên Chiểu'
    : address.includes('Hải Châu')
    ? 'Q. Hải Châu'
    : address.includes('Thanh Khê')
    ? 'Q. Thanh Khê'
    : address.includes('Sơn Trà')
    ? 'Q. Sơn Trà'
    : address.includes('Cẩm Lệ')
    ? 'Q. Cẩm Lệ'
    : item.districtName || 'Đà Nẵng';

  return {
    id: item.id ?? numericId,
    numericId,
    name: pitchName,
    address,
    area: districtName,
    district: districtCode,
    districtName,
    phone: item.phone || '0905123456',
    ownerName: item.ownerName || 'Ban Quản Lý Cụm Sân',
    avgPricePerHour: basePrice,
    peakPricePerHour: peakPrice,
    rating: Number(item.rating ?? 4.8),
    reviewsCount: Number(item.reviewsCount ?? 42),
    openTime,
    closeTime,
    slotDurationMinutes: slotDur,
    sport,
    sportList: sportTabs,
    sportBadge: pitchTypeLabel(sport),
    pitchTypes: rawTypes,
    amenities:
      Array.isArray(item.amenities) && item.amenities.length > 0
        ? item.amenities
        : ['Giữ xe', 'Wifi', 'Nước uống', 'Áo bib', 'Đèn LED'],
    imageUrl:
      item.imageUrl ||
      (idx % 2 === 0
        ? 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1000&q=80'
        : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1000&q=80'),
    description: item.description,
    timeSlots: Array.isArray(item.timeSlots) && item.timeSlots.length > 0 ? item.timeSlots : dynamicSlots,
  };
}

export const FALLBACK_PITCHES: Pitch[] = [
  normalizePitchItem(
    {
      id: 1,
      name: 'Cụm Sân Bóng Đá Đại Nắng',
      address: '12 Phan Đăng Lưu, P. Hòa Cường Nam, Quận Hải Châu, Đà Nẵng',
      phone: '0905112233',
      avgPricePerHour: 280000,
      peakPricePerHour: 360000,
      rating: 4.8,
      openTime: '14:00',
      closeTime: '23:00',
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Áo bib', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80',
    },
    0
  ),
  normalizePitchItem(
    {
      id: 2,
      name: 'Sân Mini Hải Châu Arena',
      address: '12 Phan Đăng Lưu, P. 2, Quận Hải Châu, Đà Nẵng',
      phone: '0905223344',
      avgPricePerHour: 240000,
      peakPricePerHour: 300000,
      rating: 4.5,
      openTime: '06:00',
      closeTime: '22:30',
      pitchTypes: ['SAN_5'],
      amenities: ['Giữ xe', 'Nước uống', 'Căn tin'],
      imageUrl: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
    },
    1
  ),
  normalizePitchItem(
    {
      id: 3,
      name: 'Cụm Sân Bóng Đá Chuyên Nghiệp Đà Nẵng',
      address: 'Khu dân cư Hòa Cường, Quận Hải Châu, Đà Nẵng',
      phone: '0905334455',
      avgPricePerHour: 320000,
      peakPricePerHour: 420000,
      rating: 4.9,
      openTime: '15:00',
      closeTime: '23:30',
      pitchTypes: ['SAN_7', 'SAN_11'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Áo bib', 'Đèn LED', 'Phòng thay đồ'],
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    },
    2
  ),
  normalizePitchItem(
    {
      id: 4,
      name: 'Sân Bóng Liên Chiểu Sport Center',
      address: '68 Nguyễn Lương Bằng, Quận Liên Chiểu, Đà Nẵng',
      phone: '0905445566',
      avgPricePerHour: 220000,
      peakPricePerHour: 290000,
      rating: 4.7,
      openTime: '14:00',
      closeTime: '22:30',
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Nước uống', 'Đèn LED', 'Áo bib'],
      imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
    },
    3
  ),
  normalizePitchItem(
    {
      id: 5,
      name: 'Sân Cẩm Lệ Futsal & Sân 5',
      address: 'Đường Nguyễn Hữu Thọ, Quận Cẩm Lệ, Đà Nẵng',
      phone: '0905556677',
      avgPricePerHour: 180000,
      peakPricePerHour: 230000,
      rating: 4.4,
      openTime: '07:00',
      closeTime: '22:30',
      pitchTypes: ['FUTSAL', 'SAN_5'],
      amenities: ['Giữ xe', 'Nước uống', 'Áo bib', 'Căn tin'],
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    },
    4
  ),
  normalizePitchItem(
    {
      id: 6,
      name: 'Sân 11 Hải Châu Sport Complex',
      address: 'Số 1 Nguyễn Kim, Quận Hải Châu, Đà Nẵng',
      phone: '0905667788',
      avgPricePerHour: 450000,
      peakPricePerHour: 600000,
      rating: 5.0,
      openTime: '06:00',
      closeTime: '22:00',
      pitchTypes: ['SAN_11'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Phòng thay đồ', 'Khán đài', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    },
    5
  ),
  normalizePitchItem(
    {
      id: 7,
      name: 'Tổ Hợp Sân Cỏ Thanh Khê Arena',
      address: '150 Điện Biên Phủ, Quận Thanh Khê, Đà Nẵng',
      phone: '0905778899',
      avgPricePerHour: 260000,
      peakPricePerHour: 340000,
      rating: 4.7,
      openTime: '14:00',
      closeTime: '22:30',
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1518605368461-1ee7c632b0b2?auto=format&fit=crop&w=1200&q=80',
    },
    6
  ),
  normalizePitchItem(
    {
      id: 8,
      name: 'Cụm Sân Bóng Đá Biển Sơn Trà',
      address: '45 Phạm Văn Đồng, Quận Sơn Trà, Đà Nẵng',
      phone: '0905889900',
      avgPricePerHour: 290000,
      peakPricePerHour: 380000,
      rating: 4.8,
      openTime: '14:00',
      closeTime: '23:00',
      pitchTypes: ['SAN_7', 'SAN_5'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Áo bib', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1200&q=80',
    },
    7
  ),
];

export function buildFallbackMatrixCourts(pitch: Pitch): MatrixCourt[] {
  const basePrice = pitch.avgPricePerHour || 280000;
  const peakPrice = pitch.peakPricePerHour || Math.round(basePrice * 1.3);
  const slotTimes = ['14:00 - 16:00', '16:00 - 18:00', '18:00 - 20:00', '20:00 - 22:00'];

  return [
    {
      pitchId: `${pitch.id}-7a`,
      pitchName: 'Sân 7A (Cỏ tiêu chuẩn)',
      type: 'SAN_7',
      slots: slotTimes.map((t, idx) => {
        const peak = isPeakSlot(t);
        const priceVal = peak ? peakPrice : basePrice;
        return {
          time: t,
          status: idx === 2 ? 'pending' : 'empty',
          priceValue: priceVal,
          price: `${Math.round(priceVal / 1000)}k`,
          note: idx === 2 ? 'Đội FC Hải Châu đang chờ chuyển khoản giữ ca' : undefined,
        };
      }),
    },
    {
      pitchId: `${pitch.id}-7b`,
      pitchName: 'Sân 7B (Gần căn tin)',
      type: 'SAN_7',
      slots: slotTimes.map((t, idx) => {
        const peak = isPeakSlot(t);
        const priceVal = peak ? peakPrice : basePrice;
        return {
          time: t,
          status: idx === 1 ? 'booked' : 'empty',
          priceValue: priceVal,
          price: `${Math.round(priceVal / 1000)}k`,
          note: idx === 1 ? 'Đã xác nhận đặt cọc' : undefined,
        };
      }),
    },
    {
      pitchId: `${pitch.id}-5a`,
      pitchName: 'Sân 5A (Mặt cỏ mới)',
      type: 'SAN_5',
      slots: slotTimes.map((t) => {
        const peak = isPeakSlot(t);
        const priceVal = Math.max(150000, (peak ? peakPrice : basePrice) - 50000);
        return {
          time: t,
          status: 'empty',
          priceValue: priceVal,
          price: `${Math.round(priceVal / 1000)}k`,
        };
      }),
    },
  ];
}

export function buildFallbackSlots(pitchId: number): FreeSlot[] {
  const found = FALLBACK_PITCHES.find((p) => Number(p.id) === Number(pitchId)) || FALLBACK_PITCHES[0];
  const basePrice = found.avgPricePerHour || 280000;
  const peakPrice = found.peakPricePerHour || 360000;
  return [
    { time: '14:00 - 16:00', courtName: 'Sân 7A', courtType: 'Sân 7 người', price: basePrice, peak: false, status: 'empty' },
    { time: '16:00 - 18:00', courtName: 'Sân 7A', courtType: 'Sân 7 người', price: basePrice, peak: false, status: 'empty' },
    { time: '18:00 - 20:00', courtName: 'Sân 7A', courtType: 'Sân 7 người', price: peakPrice, peak: true, status: 'empty' },
    { time: '20:00 - 22:00', courtName: 'Sân 7B', courtType: 'Sân 7 người', price: basePrice, peak: false, status: 'empty' },
    { time: '18:00 - 20:00', courtName: 'Sân 5A', courtType: 'Sân 5 người', price: Math.max(160000, peakPrice - 50000), peak: true, status: 'empty' },
  ];
}

export const FALLBACK_BOOKINGS: BookingItem[] = [
  {
    id: 901,
    code: 'SH-2026-8891',
    pitchId: 1,
    pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
    courtName: 'Sân 7A (Cỏ tiêu chuẩn)',
    courtType: 'Sân 7 người',
    bookingDate: todayLocal(),
    timeSlot: '18:00 - 20:00',
    status: 'BOOKED',
    totalPrice: 360000,
    depositPaid: 180000,
    cashDue: 180000,
    customerName: 'Nguyễn Văn Cầu Thủ',
    customerPhone: '0905123456',
    note: 'Nhờ chủ sân chuẩn bị sẵn 2 quả bóng Động Lực và 1 bộ áo Bib màu cam.',
  },
  {
    id: 902,
    code: 'SH-2026-8904',
    pitchId: 4,
    pitchName: 'Sân Bóng Liên Chiểu Sport Center',
    courtName: 'Sân 5A (Mặt cỏ mới)',
    courtType: 'Sân 5 người',
    bookingDate: addDaysLocal(2).dateStr,
    timeSlot: '18:00 - 20:00',
    status: 'BOOKED',
    totalPrice: 290000,
    depositPaid: 145000,
    cashDue: 145000,
    customerName: 'Nguyễn Văn Cầu Thủ',
    customerPhone: '0905123456',
    note: 'Kèo nội bộ anh em văn phòng hàng tuần.',
  },
];

export const FALLBACK_MATCHMAKING: MatchmakingPostItem[] = [
  {
    id: 501,
    teamName: 'FC Anh Em Văn Phòng Hải Châu',
    captainName: 'Hoàng Nam',
    captainPhone: '0905123456',
    pitchName: 'Cụm Sân Bóng Đá Đại Nắng (Sân 7A)',
    area: 'Q. Hải Châu',
    pitchType: 'SAN_7',
    matchTime: `18:00 - 20:00 • Hôm nay (${todayLocal()})`,
    skillLevel: 'Trung bình / Văn phòng',
    paymentModel: '50_50',
    estimatedFee: 180000,
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
    teamName: '🚨 SOS: FC Liên Chiểu Cần Gấp 2 Chân',
    captainName: 'Tuấn Kiệt',
    captainPhone: '0905876543',
    pitchName: 'Sân Bóng Liên Chiểu Sport Center (Sân 7B)',
    area: 'Q. Liên Chiểu',
    pitchType: 'SAN_7',
    matchTime: `18:00 - 20:00 • Hôm nay (${todayLocal()})`,
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
    teamName: 'FC Tia Chớp Sơn Trà',
    captainName: 'Lê Bảo',
    captainPhone: '0905112233',
    pitchName: 'Cụm Sân Bóng Đá Biển Sơn Trà',
    area: 'Q. Sơn Trà',
    pitchType: 'SAN_7',
    matchTime: `20:00 - 22:00 • Ngày mai (${addDaysLocal(1).dateStr})`,
    skillLevel: 'Khá / Bán chuyên',
    paymentModel: '70_30',
    estimatedFee: 260000,
    notes: 'Tìm đối cứng cọ xát chuẩn bị giải Đà Nẵng Mở Rộng. Có thuê trọng tài bắt chính.',
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
    title: 'Siêu Cúp Bóng Đá Phủi Đà Nẵng Mở Rộng 2026',
    status: 'OPEN',
    prizePool: 25000000,
    entryFee: 2500000,
    totalTeams: 16,
    registeredTeams: 12,
    pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
    location: 'Quận Hải Châu, Đà Nẵng',
    startDate: '15/11/2026',
    format: 'Đấu bảng + Loại trực tiếp (Sân 7)',
    sportType: 'Sân 7 Người',
  },
  {
    id: 302,
    title: 'Giải Giao Hữu Các Doanh Nghiệp Sông Hàn Cup',
    status: 'ONGOING',
    prizePool: 15000000,
    entryFee: 2000000,
    totalTeams: 8,
    registeredTeams: 8,
    pitchName: 'Cụm Sân Bóng Đá Biển Sơn Trà',
    location: 'Quận Sơn Trà, Đà Nẵng',
    startDate: '01/11/2026',
    format: 'Loại trực tiếp 8 đội (Sân 7)',
    sportType: 'Sân 7 Người',
  },
  {
    id: 303,
    title: 'Cúp Futsal Mùa Đông Cẩm Lệ Arena',
    status: 'OPEN',
    prizePool: 12000000,
    entryFee: 1500000,
    totalTeams: 12,
    registeredTeams: 9,
    pitchName: 'Sân Cẩm Lệ Futsal & Sân 5',
    location: 'Quận Cẩm Lệ, Đà Nẵng',
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
    t1: 'FC Hải Châu',
    t2: 'FC Văn Phòng ĐN',
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
    t1: 'FC Tia Chớp Sơn Trà',
    t2: 'FC Liên Chiểu',
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
    t1: 'FC Hải Châu',
    t2: 'FC Tia Chớp Sơn Trà',
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
    t2: 'FC Sông Hàn United',
    s1: null,
    s2: null,
    time: '20:00 • Chung Kết',
    pitch: 'Sân Trung Tâm',
    status: 'UPCOMING',
    events: [],
  },
];

export const INITIAL_TOP_SCORERS: TopScorerItem[] = [
  { rank: 1, playerName: 'Nguyễn Quang Hải', teamName: 'FC Hải Châu', goals: 7, assists: 4, yellowCards: 0, redCards: 0, matchesPlayed: 4, mvpCount: 3 },
  { rank: 2, playerName: 'Đỗ Hùng Dũng', teamName: 'FC Liên Chiểu', goals: 5, assists: 5, yellowCards: 1, redCards: 0, matchesPlayed: 4, mvpCount: 2 },
  { rank: 3, playerName: 'Nguyễn Tiến Linh', teamName: 'FC Tia Chớp Sơn Trà', goals: 5, assists: 2, yellowCards: 1, redCards: 0, matchesPlayed: 4, mvpCount: 1 },
  { rank: 4, playerName: 'Vũ Văn Thanh', teamName: 'FC Tia Chớp Sơn Trà', goals: 4, assists: 3, yellowCards: 2, redCards: 0, matchesPlayed: 4, mvpCount: 1 },
  { rank: 5, playerName: 'Trần Hoàng Nam', teamName: 'FC Văn Phòng ĐN', goals: 3, assists: 2, yellowCards: 0, redCards: 0, matchesPlayed: 3, mvpCount: 1 },
];
