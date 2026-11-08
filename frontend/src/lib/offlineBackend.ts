/**
 * Offline Fallback Engine (In-Browser Stateful Store)
 *
 * Khi máy chủ cloud (Railway) đang khởi động lạnh (cold-start), bảo trì hoặc
 * mất kết nối, module này tự động trả về dữ liệu Đà Nẵng chuẩn xác (đồng bộ 100%
 * với DataInitializer.java của backend-core) và lưu trữ các thao tác thêm/sửa/xóa
 * ngay trong localStorage để trải nghiệm người dùng trên Vercel luôn mượt mà,
 * không bao giờ hiện bảng lỗi hay kẹt vòng xoay.
 */

const STORAGE_KEY = 'turfzone_offline_store_v1';

export interface OfflineStore {
  users: any[];
  pitches: any[];
  bookings: any[];
  waitlists: any[];
  attendances: Record<string, any[]>;
  tournaments: any[];
  matchmakingPosts: any[];
  reviews: any[];
  chatMessages: any[];
  chatGroups: any[];
  clubs: any[];
  canteenItems: any[];
  notifications: any[];
}

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildDefaultStore(): OfflineStore {
  const today = todayIso(0);
  const tomorrow = todayIso(1);
  const yesterday = todayIso(-1);

  const users = [
    {
      id: 1,
      fullName: 'Quản Trị Hệ Thống',
      email: 'admin@Turfzone.vn',
      phone: '0900000001',
      role: 'ADMIN',
      area: 'Đà Nẵng',
      level: 'Quản trị viên',
      eloRating: 1500,
      enabled: true,
      profileCompleted: true,
    },
    {
      id: 2,
      fullName: 'Trần Thị Chủ Sân',
      email: 'owner@Turfzone.vn',
      phone: '0987654321',
      role: 'OWNER',
      area: 'Quận Hải Châu, Đà Nẵng',
      level: 'Chủ cụm sân',
      position: 'Chủ Cụm Sân',
      eloRating: 1350,
      enabled: true,
      profileCompleted: true,
    },
    {
      id: 3,
      fullName: 'Nguyễn Văn Cầu Thủ',
      email: 'player@Turfzone.vn',
      phone: '0912345678',
      role: 'PLAYER',
      area: 'Quận Hải Châu, Đà Nẵng',
      level: 'Phong trào',
      position: 'Tiền Vệ (CM)',
      favoriteSport: 'Bóng Đá Sân 7',
      dominantFoot: 'Chân phải',
      jerseyNumber: '10',
      height: '174',
      weight: '68',
      preferredTime: '18:00 - 20:00',
      currentClub: 'FC Đà Nẵng Warriors',
      eloRating: 1320,
      isClubRep: true,
      enabled: true,
      profileCompleted: true,
    },
    {
      id: 4,
      fullName: 'Lê Văn Ban Tổ Chức',
      email: 'organizer@Turfzone.vn',
      phone: '0909876543',
      role: 'ORGANIZER',
      area: 'Quận Cẩm Lệ, Đà Nẵng',
      level: 'Trưởng BTC giải',
      position: 'Ban Tổ Chức Giải Đấu',
      eloRating: 1400,
      enabled: true,
      profileCompleted: true,
    },
    {
      id: 5,
      fullName: 'Ban Tổ Chức Giải Sân 7 Đà Nẵng',
      email: 'btc.danang@turfzone.vn',
      phone: '0905123456',
      role: 'ORGANIZER',
      area: 'Quận Hải Châu, Đà Nẵng',
      level: 'Ban Tổ Chức Giải Đấu',
      eloRating: 1420,
      enabled: true,
      profileCompleted: true,
    },
  ];

  const pitches = [
    {
      id: 1,
      name: 'Cụm Sân Bóng Đá Đại Nắng',
      address: '12 Phan Đăng Lưu, P. Hòa Cường Nam, Quận Hải Châu',
      area: 'Quận Hải Châu, Đà Nẵng',
      phone: '0908123456',
      ownerId: 2,
      ownerName: 'Trần Thị Chủ Sân',
      bankCode: '970436',
      bankAccount: '190020262026',
      accountName: 'SAN DAI NANG',
      latitude: 16.035,
      longitude: 108.218,
      avgPricePerHour: 280000,
      peakPricePerHour: 360000,
      rating: 4.8,
      reviewsCount: 42,
      openTime: '14:00',
      closeTime: '23:00',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Áo bib', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80',
      description: 'Cụm 3 sân 5 và 2 sân 7 cỏ nhân tạo có mái che, phù hợp giao lưu và tổ chức giải phủi.',
    },
    {
      id: 2,
      name: 'Sân Mini Hải Châu Arena',
      address: '45 Phan Đăng Lưu, P. Hòa Cường Bắc, Quận Hải Châu',
      area: 'Quận Hải Châu, Đà Nẵng',
      phone: '0912345678',
      ownerId: 2,
      ownerName: 'Trần Thị Chủ Sân',
      bankCode: '970436',
      bankAccount: '190020262027',
      accountName: 'ARENA HAI CHAU',
      latitude: 16.039,
      longitude: 108.214,
      avgPricePerHour: 240000,
      peakPricePerHour: 300000,
      rating: 4.6,
      reviewsCount: 28,
      openTime: '06:00',
      closeTime: '22:30',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Nước uống', 'Căn tin'],
      imageUrl: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
      description: 'Sân 5 và sân 7 mặt cỏ mới, thích hợp đá tối và dưỡng sinh sau giờ làm.',
    },
    {
      id: 3,
      name: 'Cụm Sân Tuyên Sơn Sport',
      address: 'Khu Liên Hợp Thể Thao Tuyên Sơn, Quận Hải Châu',
      area: 'Quận Hải Châu, Đà Nẵng',
      phone: '0933888999',
      ownerId: 2,
      ownerName: 'Trần Thị Chủ Sân',
      bankCode: '970436',
      bankAccount: '190020262028',
      accountName: 'DA NANG SPORT',
      latitude: 16.032,
      longitude: 108.225,
      avgPricePerHour: 320000,
      peakPricePerHour: 420000,
      rating: 4.9,
      reviewsCount: 64,
      openTime: '15:00',
      closeTime: '23:30',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_7', 'SAN_11'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Áo bib', 'Đèn LED', 'Phòng thay đồ'],
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      description: 'Cụm sân 7 FIFA và 1 sân 11 chuẩn thi đấu, có khán đài nhỏ, đăng cai giải phủi.',
    },
    {
      id: 4,
      name: 'Sân Bóng Hải Châu Center',
      address: '88 Nguyễn Văn Linh, Quận Hải Châu',
      area: 'Quận Hải Châu, Đà Nẵng',
      phone: '0905111222',
      ownerName: 'Hải Châu Center',
      bankCode: '970436',
      bankAccount: '190020262029',
      accountName: 'HAI CHAU CENTER',
      latitude: 16.054,
      longitude: 108.202,
      avgPricePerHour: 220000,
      peakPricePerHour: 280000,
      rating: 4.6,
      reviewsCount: 31,
      openTime: '06:00',
      closeTime: '22:00',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Nước uống', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
      description: 'Sân trung tâm Đà Nẵng, vị trí đắc địa, khung giờ vàng thường kín nên đặt sớm.',
    },
    {
      id: 5,
      name: 'Sân Cẩm Lệ Futsal & Sân 5',
      address: 'Đường Nguyễn Hữu Thọ, Quận Cẩm Lệ',
      area: 'Quận Cẩm Lệ, Đà Nẵng',
      phone: '0905333444',
      ownerName: 'Cẩm Lệ Futsal',
      bankCode: '970436',
      bankAccount: '190020262030',
      accountName: 'CAM LE FUTSAL',
      latitude: 16.018,
      longitude: 108.205,
      avgPricePerHour: 200000,
      peakPricePerHour: 260000,
      rating: 4.5,
      reviewsCount: 19,
      openTime: '07:00',
      closeTime: '22:30',
      slotDurationMinutes: 90,
      pitchTypes: ['FUTSAL', 'SAN_5'],
      amenities: ['Giữ xe', 'Nước uống', 'Áo bib', 'Căn tin'],
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      description: 'Sân futsal trong nhà mát mẻ quanh năm, kèm 2 sân 5 ngoài trời cho giao lưu.',
    },
    {
      id: 6,
      name: 'Sân 11 Hòa Xuân Sport Complex',
      address: 'Khu Đô Thị Hòa Xuân, Quận Cẩm Lệ',
      area: 'Quận Cẩm Lệ, Đà Nẵng',
      phone: '0977888999',
      ownerName: 'Hòa Xuân Complex',
      bankCode: '970436',
      bankAccount: '190020262031',
      accountName: 'HOA XUAN COMPLEX',
      latitude: 16.005,
      longitude: 108.215,
      avgPricePerHour: 450000,
      peakPricePerHour: 600000,
      rating: 5.0,
      reviewsCount: 53,
      openTime: '06:00',
      closeTime: '22:00',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_11', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Phòng thay đồ', 'Khán đài', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      description: 'Sân 11 người cỏ tự nhiên chuẩn quốc gia, sân khấu tổ chức các giải doanh nghiệp.',
    },
    {
      id: 7,
      name: 'Sân Bóng Chuyên Việt Thanh Khê',
      address: '98 Tiểu La, Quận Thanh Khê',
      area: 'Quận Thanh Khê, Đà Nẵng',
      phone: '0988111222',
      ownerName: 'Chuyên Việt Sport',
      bankCode: '970436',
      bankAccount: '190020262032',
      accountName: 'CHUYEN VIET SPORT',
      latitude: 16.063,
      longitude: 108.193,
      avgPricePerHour: 280000,
      peakPricePerHour: 360000,
      rating: 4.7,
      reviewsCount: 37,
      openTime: '06:00',
      closeTime: '23:00',
      slotDurationMinutes: 90,
      pitchTypes: ['FUTSAL', 'SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Phòng thay đồ', 'Căn tin'],
      imageUrl: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
      description: 'Cụm sân cỏ nhân tạo & futsal trung tâm Thanh Khê, hệ thống đèn LED chống chói hiện đại.',
    },
    {
      id: 8,
      name: 'Cụm Sân Đầm Sen Liên Chiểu',
      address: '62 Tôn Đức Thắng, Quận Liên Chiểu',
      area: 'Quận Liên Chiểu, Đà Nẵng',
      phone: '0979333444',
      ownerName: 'Đầm Sen Arena',
      bankCode: '970436',
      bankAccount: '190020262033',
      accountName: 'DAM SEN ARENA',
      latitude: 16.074,
      longitude: 108.152,
      avgPricePerHour: 220000,
      peakPricePerHour: 280000,
      rating: 4.5,
      reviewsCount: 24,
      openTime: '05:30',
      closeTime: '22:30',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Nước uống', 'Áo bib', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
      description: 'Cụm sân sinh viên & phong trào sầm uất nhất khu vực Hòa Khánh - Liên Chiểu.',
    },
    {
      id: 9,
      name: 'Sân Đà Nẵng Beachside Sơn Trà',
      address: '12 Phạm Văn Đồng, Quận Sơn Trà',
      area: 'Quận Sơn Trà, Đà Nẵng',
      phone: '0984555666',
      ownerName: 'Beachside Sport',
      bankCode: '970436',
      bankAccount: '190020262034',
      accountName: 'BEACHSIDE SPORT',
      latitude: 16.076,
      longitude: 108.228,
      avgPricePerHour: 260000,
      peakPricePerHour: 340000,
      rating: 4.7,
      reviewsCount: 29,
      openTime: '07:00',
      closeTime: '23:00',
      slotDurationMinutes: 90,
      pitchTypes: ['FUTSAL', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Phòng thay đồ'],
      imageUrl: 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80',
      description: 'Sân bóng ven biển Sơn Trà thoáng mát, mặt cỏ chuẩn FIFA Quality.',
    },
  ];

  const completedBracket = {
    tournamentId: 6,
    title: 'Turfzone Grandmaster Series 2026',
    drawnAt: todayIso(-20) + 'T10:00:00',
    method: 'SEED_BY_REGISTERED_AT',
    teamCount: 4,
    rounds: [
      {
        name: 'Bán kết',
        matches: [
          {
            matchId: 'R1-M1',
            teamA: { name: 'FC Đại Nắng', seed: 1, form: 'WWD', record: '2W-1D-0L', winRate: 83 },
            teamB: { name: 'FC Phù Đổng Hải Châu', seed: 4, form: 'LWL', record: '1W-0D-2L', winRate: 33 },
            scoreA: 3,
            scoreB: 2,
            status: 'DONE',
            winner: 'FC Đại Nắng',
            matchDate: todayIso(-14),
            timeSlot: '17:00 - 18:30',
            pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
          },
          {
            matchId: 'R1-M2',
            teamA: { name: 'FC Thanh Khê Brothers', seed: 2, form: 'WLL', record: '1W-0D-2L', winRate: 33 },
            teamB: { name: 'FC Sơn Trà United', seed: 3, form: 'WDW', record: '2W-1D-0L', winRate: 83 },
            scoreA: 1,
            scoreB: 4,
            status: 'DONE',
            winner: 'FC Sơn Trà United',
            matchDate: todayIso(-14),
            timeSlot: '18:30 - 20:00',
            pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
          },
        ],
      },
      {
        name: 'Chung kết',
        matches: [
          {
            matchId: 'R2-M1',
            teamA: { name: 'FC Đại Nắng', seed: 1, form: 'WWD', record: '2W-1D-0L', winRate: 83 },
            teamB: { name: 'FC Sơn Trà United', seed: 3, form: 'WDW', record: '2W-1D-0L', winRate: 83 },
            scoreA: 2,
            scoreB: 1,
            status: 'DONE',
            winner: 'FC Đại Nắng',
            matchDate: todayIso(-7),
            timeSlot: '18:00 - 19:30',
            pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
          },
        ],
      },
    ],
  };

  const tournaments = [
    {
      id: 1,
      title: 'Turfzone Championship Cup 2026 - Cúp Bóng Đá Phủi Mở Rộng',
      description: 'Giải bóng đá sân 7 phủi uy tín nhất khu vực Đà Nẵng tranh Cúp Vàng, lưu lịch sử thi đấu và chuỗi phong độ.',
      sportType: 'SAN_7',
      format: 'KNOCKOUT',
      pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
      location: 'Quận Hải Châu, Đà Nẵng',
      totalTeams: 16,
      registeredTeams: 12,
      prizePool: 35000000,
      entryFee: 1500000,
      startDate: todayIso(12),
      endDate: todayIso(16),
      registrationDeadline: todayIso(9),
      status: 'OPEN',
      bankCode: '970436',
      bankAccount: '190020262026',
      accountName: 'BTC TURFZONE DA NANG',
      bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      teams: [
        { teamName: 'FC Đà Nẵng Warriors', captainName: 'Nguyễn Văn Cầu Thủ', captainEmail: 'player@Turfzone.vn', captainPhone: '0912345678', memberCount: 14, registrationStatus: 'CONFIRMED', form: 'WWWDW', record: '4W-1D-0L', winRate: 85, played: 5, won: 4, drawn: 1, lost: 0 },
        { teamName: 'FC Hoàng Nam Hải Châu', captainName: 'Trần Tuấn Anh', captainPhone: '0909333444', memberCount: 12, registrationStatus: 'CONFIRMED', form: 'WDWLW', record: '3W-1D-1L', winRate: 68, played: 5, won: 3, drawn: 1, lost: 1 },
        { teamName: 'FC Lộc Phát Cẩm Lệ', captainName: 'Phạm Đăng Khoa', captainPhone: '0908555666', memberCount: 13, registrationStatus: 'CONFIRMED', form: 'WWLWD', record: '3W-1D-1L', winRate: 68, played: 5, won: 3, drawn: 1, lost: 1 },
        { teamName: 'FC Sông Hàn United', captainName: 'Lê Quốc Khánh', captainPhone: '0905222888', memberCount: 14, registrationStatus: 'CONFIRMED', form: 'WWDLL', record: '2W-1D-2L', winRate: 48, played: 5, won: 2, drawn: 1, lost: 2 },
      ],
    },
    {
      id: 2,
      title: 'Cúp Bóng Đá Mini Sân 5 Sinh Viên Đà Nẵng 2026',
      description: 'Sân chơi giao lưu rèn luyện thể lực và kỹ chiến thuật cho các trường Đại học và Cao đẳng toàn thành phố.',
      sportType: 'SAN_5',
      format: 'KNOCKOUT',
      pitchName: 'Sân Mini Hải Châu Arena',
      location: 'Quận Hải Châu, Đà Nẵng',
      totalTeams: 8,
      registeredTeams: 8,
      prizePool: 20000000,
      entryFee: 800000,
      startDate: todayIso(2),
      endDate: todayIso(4),
      registrationDeadline: todayIso(-1),
      status: 'ONGOING',
      bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      teams: [
        { teamName: 'FC Bách Khoa Đà Nẵng', captainName: 'Lê Hoàng Minh', captainPhone: '0912111333', memberCount: 10, registrationStatus: 'CONFIRMED', form: 'WWWW', record: '4W-0D-0L', winRate: 100, played: 4, won: 4, drawn: 0, lost: 0 },
        { teamName: 'FC Kinh Tế Đà Nẵng', captainName: 'Nguyễn Quốc Bảo', captainPhone: '0913222444', memberCount: 10, registrationStatus: 'CONFIRMED', form: 'WWLW', record: '3W-0D-1L', winRate: 75, played: 4, won: 3, drawn: 0, lost: 1 },
      ],
    },
    {
      id: 3,
      title: 'Super League Sân 11 Doanh Nghiệp Đà Nẵng',
      description: 'Giải đấu bóng đá sân 11 người mặt cỏ tự nhiên chuẩn quốc gia dành cho các tổ chức và doanh nghiệp lớn.',
      sportType: 'SAN_11',
      format: 'ROUND_ROBIN',
      pitchName: 'Sân 11 Hòa Xuân Sport Complex',
      location: 'Quận Cẩm Lệ, Đà Nẵng',
      totalTeams: 8,
      registeredTeams: 5,
      prizePool: 50000000,
      entryFee: 3000000,
      startDate: todayIso(18),
      endDate: todayIso(30),
      registrationDeadline: todayIso(14),
      status: 'OPEN',
      bannerUrl: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
      teams: [
        { teamName: 'FC Tech Titans Đà Nẵng', captainName: 'Đặng Ngọc Long', captainPhone: '0977888999', memberCount: 18, registrationStatus: 'CONFIRMED', form: 'WWDW', record: '3W-1D-0L', winRate: 82, played: 4, won: 3, drawn: 1, lost: 0 },
      ],
    },
    {
      id: 4,
      title: 'Giải Futsal Giao Hữu Doanh Nghiệp Đà Nẵng 2026',
      description: 'Giải futsal trong nhà dành cho các đội văn phòng và doanh nghiệp, hình thức vòng tròn tính điểm nhanh gọn.',
      sportType: 'FUTSAL',
      format: 'ROUND_ROBIN',
      pitchName: 'Sân Cẩm Lệ Futsal & Sân 5',
      location: 'Quận Cẩm Lệ, Đà Nẵng',
      totalTeams: 8,
      registeredTeams: 6,
      prizePool: 15000000,
      entryFee: 700000,
      startDate: todayIso(20),
      endDate: todayIso(22),
      registrationDeadline: todayIso(16),
      status: 'OPEN',
      bannerUrl: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=80',
      teams: [
        { teamName: 'FC FPT Software Đà Nẵng', captainName: 'Phan Quang Huy', captainPhone: '0981222333', memberCount: 10, registrationStatus: 'CONFIRMED', form: 'WWD', record: '2W-1D-0L', winRate: 80, played: 3, won: 2, drawn: 1, lost: 0 },
        { teamName: 'FC Viettel Đà Nẵng', captainName: 'Đỗ Minh Châu', captainPhone: '0982333444', memberCount: 10, registrationStatus: 'CONFIRMED', form: 'WLW', record: '2W-0D-1L', winRate: 67, played: 3, won: 2, drawn: 0, lost: 1 },
      ],
    },
    {
      id: 6,
      title: 'Turfzone Grandmaster Series 2026',
      description: 'Giải đấu cúp tứ hùng Đà Nẵng đã kết thúc — kèm nhánh đấu và lịch sử thi đấu thật để xem ngay bảng xếp hạng phong độ.',
      sportType: 'SAN_7',
      format: 'KNOCKOUT',
      pitchName: 'Cụm Sân Bóng Đá Đại Nắng',
      location: 'Quận Hải Châu, Đà Nẵng',
      totalTeams: 4,
      registeredTeams: 4,
      prizePool: 12000000,
      entryFee: 600000,
      startDate: todayIso(-20),
      endDate: todayIso(-7),
      registrationDeadline: todayIso(-22),
      status: 'COMPLETED',
      bannerUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
      bracketJson: JSON.stringify(completedBracket),
      teams: [
        { teamName: 'FC Đại Nắng', captainName: 'Võ Thanh Tâm', captainPhone: '0908777888', memberCount: 12, registrationStatus: 'CONFIRMED', form: 'WWD', record: '2W-1D-0L', winRate: 83, played: 3, won: 2, drawn: 1, lost: 0 },
        { teamName: 'FC Sơn Trà United', captainName: 'Phạm Gia Bảo', captainPhone: '0907654321', memberCount: 12, registrationStatus: 'CONFIRMED', form: 'WDL', record: '1W-1D-1L', winRate: 50, played: 3, won: 1, drawn: 1, lost: 1 },
        { teamName: 'FC Phù Đổng Hải Châu', captainName: 'Đỗ Hoàng Long', captainPhone: '0909988776', memberCount: 12, registrationStatus: 'CONFIRMED', form: 'LWL', record: '1W-0D-2L', winRate: 33, played: 3, won: 1, drawn: 0, lost: 2 },
        { teamName: 'FC Thanh Khê Brothers', captainName: 'Lê Minh Khoa', captainPhone: '0903123456', memberCount: 12, registrationStatus: 'CONFIRMED', form: 'WLL', record: '1W-0D-2L', winRate: 33, played: 3, won: 1, drawn: 0, lost: 2 },
      ],
    },
  ];

  const matchmakingPosts = [
    {
      id: 1,
      postType: 'MATCH',
      teamName: 'FC Phù Đổng Hải Châu',
      captainName: 'Nguyễn Văn An',
      captainPhone: '0908123456',
      reputationScore: 98,
      pitchName: 'Cụm Sân Bóng Đá Đại Nắng (Sân 7A)',
      address: '12 Phan Đăng Lưu, Quận Hải Châu, Đà Nẵng',
      matchTime: '19:00 - 20:30 Tối nay',
      pitchType: 'SAN_7',
      paymentModel: 'SPLIT_EQUAL',
      estimatedFee: 45000,
      matchStyle: 'DUONG_SINH',
      ageGroup: 'U25_U35',
      homeKitColor: 'Đỏ',
      refereeOption: 'THUE_TRONG_TAI',
      waterOption: 'CAM_THUNG',
      form: 'WWDLW',
      winRate: 68,
      note: 'Cần tìm đối đá bắt cọc tiền sân 50/50, fairplay không quạu, có trọng tài bắt.',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 2,
      postType: 'SOS_GUEST',
      neededPosition: 'THU_MON',
      neededCount: 1,
      teamName: 'FC Bách Khoa Đà Nẵng',
      captainName: 'Trần Tuấn Anh',
      captainPhone: '0912345678',
      reputationScore: 96,
      pitchName: 'Sân Mini Hải Châu Arena',
      address: '45 Phan Đăng Lưu, Quận Hải Châu, Đà Nẵng',
      matchTime: '18:30 - 20:00 Tối nay',
      pitchType: 'SAN_5',
      paymentModel: 'HOST_COVER',
      estimatedFee: 0,
      matchStyle: 'DUONG_SINH',
      ageGroup: 'U20_U25',
      homeKitColor: 'Xanh dương',
      refereeOption: 'TU_BAT',
      waterOption: 'CAM_THUNG',
      form: 'WWWLW',
      winRate: 75,
      note: 'SOS! Thủ môn đội mình bận đột xuất, cần tìm 1 GK bắt giúp tối nay, miễn phí 100% tiền sân + bao nước!',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    },
    {
      id: 3,
      postType: 'MATCH',
      teamName: 'FC Đà Nẵng Warriors',
      captainName: 'Vũ Minh Tuấn',
      captainPhone: '0933888999',
      reputationScore: 99,
      pitchName: 'Cụm Sân Tuyên Sơn Sport (Sân 7 FIFA)',
      address: 'Khu Liên Hợp Thể Thao Tuyên Sơn, Quận Hải Châu',
      matchTime: '20:30 - 22:00 Tối mai',
      pitchType: 'SAN_7',
      paymentModel: 'LOSER_PAYS',
      estimatedFee: 60000,
      matchStyle: 'NHIET_HUYET',
      ageGroup: 'U25_U35',
      homeKitColor: 'Trắng',
      refereeOption: 'THUE_TRONG_TAI',
      waterOption: 'CAM_THUNG',
      form: 'WWWDW',
      winRate: 82,
      note: 'Kèo căng cọ xát chuẩn bị giải Cup, chia tiền sân 7-3 hoặc 5-5 tùy thỏa thuận, mời các đội phong độ tốt.',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    },
    {
      id: 4,
      postType: 'SOS_GUEST',
      neededPosition: 'HAU_VE',
      neededCount: 2,
      teamName: 'FC Thanh Khê Brothers',
      captainName: 'Bùi Trọng Nhân',
      captainPhone: '0901222333',
      reputationScore: 94,
      pitchName: 'Sân Bóng Chuyên Việt Thanh Khê',
      address: '98 Tiểu La, Quận Thanh Khê, Đà Nẵng',
      matchTime: '17:30 - 19:00 Chiều nay',
      pitchType: 'SAN_7',
      paymentModel: 'SPLIT_EQUAL',
      estimatedFee: 35000,
      matchStyle: 'DUONG_SINH',
      ageGroup: 'U25_U35',
      homeKitColor: 'Vàng',
      refereeOption: 'TU_BAT',
      waterOption: 'CAM_THUNG',
      form: 'WDWLL',
      winRate: 55,
      note: 'Đội thiếu 2 anh em hậu vệ đá kèo chiều nay, anh em văn phòng vui vẻ, đá xong giao lưu nước mía.',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 5,
      postType: 'MATCH',
      teamName: 'FC Sơn Trà Beachside',
      captainName: 'Ngô Thành Đạt',
      captainPhone: '0902333444',
      reputationScore: 97,
      pitchName: 'Sân Đà Nẵng Beachside Sơn Trà',
      address: '12 Phạm Văn Đồng, Quận Sơn Trà, Đà Nẵng',
      matchTime: '19:30 - 21:00 Thứ Sáu',
      pitchType: 'FUTSAL',
      paymentModel: 'SPLIT_EQUAL',
      estimatedFee: 45000,
      matchStyle: 'DUONG_SINH',
      ageGroup: 'U25_U35',
      homeKitColor: 'Xanh lá',
      refereeOption: 'TU_BAT',
      waterOption: 'TU_MANG',
      form: 'WWDWW',
      winRate: 78,
      note: 'Kèo giao lưu futsal ven biển mát mẻ, ưu tiên các đội văn phòng đá kỹ thuật, hạn chế va chạm.',
      status: 'OPEN',
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
  ];

  const bookings = [
    {
      id: 101,
      pitchId: 1,
      courtName: 'Sân 7A',
      courtType: 'SAN_7',
      bookingDate: today,
      timeSlot: '17:00 - 18:30',
      customerName: 'Nguyễn Văn Cầu Thủ',
      customerPhone: '0912345678',
      totalPrice: 420000,
      depositPaid: 210000,
      cashDue: 210000,
      status: 'BOOKED',
      via: 'Đặt qua Website',
      code: 'TZ-101-DN',
      isClubBooking: true,
      clubName: 'FC Đà Nẵng Warriors',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 102,
      pitchId: 1,
      courtName: 'Sân 5A',
      courtType: 'SAN_5',
      bookingDate: today,
      timeSlot: '18:30 - 20:00',
      customerName: 'Trần Quốc Bảo',
      customerPhone: '0905123789',
      totalPrice: 360000,
      depositPaid: 180000,
      cashDue: 180000,
      status: 'PLAYING',
      via: 'Tạo Tại Quầy (Đã Cọc)',
      code: 'TZ-102-DN',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 103,
      pitchId: 1,
      courtName: 'Sân 7B',
      courtType: 'SAN_7',
      bookingDate: tomorrow,
      timeSlot: '18:30 - 20:00',
      customerName: 'Nguyễn Văn Cầu Thủ',
      customerPhone: '0912345678',
      totalPrice: 540000,
      depositPaid: 270000,
      cashDue: 270000,
      status: 'BOOKED',
      via: 'VietQR',
      code: 'TZ-103-DN',
      isClubBooking: true,
      clubName: 'FC Đà Nẵng Warriors',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 104,
      pitchId: 2,
      courtName: 'Sân 5A',
      courtType: 'SAN_5',
      bookingDate: yesterday,
      timeSlot: '18:30 - 20:00',
      customerName: 'Lê Hoàng Minh',
      customerPhone: '0912111333',
      totalPrice: 360000,
      depositPaid: 180000,
      cashDue: 0,
      cashCollected: 180000,
      status: 'COMPLETED',
      via: 'Đặt qua Website',
      code: 'TZ-104-DN',
      createdAt: new Date(Date.now() - 3600000 * 26).toISOString(),
    },
  ];

  const attendances: Record<string, any[]> = {
    '101': [
      { id: 1, bookingId: 101, playerName: 'Nguyễn Văn Cầu Thủ (Đội trưởng)', playerPhone: '0912345678', status: 'GOING', votedAt: new Date().toISOString() },
      { id: 2, bookingId: 101, playerName: 'Trần Tuấn Anh', playerPhone: '0909333444', status: 'GOING', votedAt: new Date().toISOString() },
      { id: 3, bookingId: 101, playerName: 'Lê Hoàng Minh', playerPhone: '0912111333', status: 'GOING', votedAt: new Date().toISOString() },
      { id: 4, bookingId: 101, playerName: 'Phạm Đăng Khoa', playerPhone: '0908555666', status: 'MAYBE', votedAt: new Date().toISOString() },
    ],
  };

  const clubs = [
    {
      id: 1,
      name: 'FC Đà Nẵng Warriors',
      shortName: 'DNW',
      area: 'Quận Hải Châu, Đà Nẵng',
      sportType: 'SAN_7',
      level: 'Bán chuyên',
      description: 'CLB bóng đá phủi Hải Châu - Đà Nẵng, sinh hoạt định kỳ tối Thứ 3 & Thứ 6 hàng tuần tại Cụm Sân Đại Nắng.',
      captainEmail: 'player@Turfzone.vn',
      captainName: 'Nguyễn Văn Cầu Thủ',
      captainPhone: '0912345678',
      memberCount: 14,
      eloRating: 1380,
      members: [
        { email: 'player@Turfzone.vn', fullName: 'Nguyễn Văn Cầu Thủ', phone: '0912345678', position: 'Tiền Vệ (CM)', jerseyNumber: '10', isRepresentative: true, role: 'CAPTAIN' },
        { email: 'tuananh@Turfzone.vn', fullName: 'Trần Tuấn Anh', phone: '0909333444', position: 'Tiền Đạo (ST)', jerseyNumber: '9', isRepresentative: false, role: 'MEMBER' },
        { email: 'hoangminh@Turfzone.vn', fullName: 'Lê Hoàng Minh', phone: '0912111333', position: 'Thủ Môn (GK)', jerseyNumber: '1', isRepresentative: false, role: 'MEMBER' },
        { email: 'dangkhoa@Turfzone.vn', fullName: 'Phạm Đăng Khoa', phone: '0908555666', position: 'Hậu Vệ (CB)', jerseyNumber: '4', isRepresentative: false, role: 'MEMBER' },
      ],
    },
  ];

  const canteenItems = [
    { id: 1, pitchId: 1, name: 'Thùng Nước Suối Aquafina (24 chai)', category: 'DRINK', price: 120000, stock: 25, soldCount: 42, unit: 'Thùng' },
    { id: 2, pitchId: 1, name: 'Nước Thể Thao Revive Chanh Muối', category: 'DRINK', price: 15000, stock: 80, soldCount: 156, unit: 'Chai' },
    { id: 3, pitchId: 1, name: 'Thuê Áo Bib Tập Luyện (Bộ 10 áo)', category: 'EQUIPMENT', price: 50000, stock: 12, soldCount: 38, unit: 'Bộ' },
    { id: 4, pitchId: 1, name: 'Thuê Bóng Thi Đấu Động Lực FIFA', category: 'EQUIPMENT', price: 40000, stock: 10, soldCount: 29, unit: 'Quả' },
  ];

  const chatMessages = [
    {
      id: 1,
      channel: 'keo-nhanh',
      senderEmail: 'player@Turfzone.vn',
      senderName: 'Nguyễn Văn Cầu Thủ',
      senderRole: 'PLAYER',
      content: 'Tối nay 19h00 đội mình còn trống kèo sân 7A Cụm Sân Đại Nắng (Hải Châu), anh em đội nào rảnh giao lưu 50/50 không?',
      pinned: true,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 2,
      channel: 'keo-nhanh',
      senderEmail: 'owner@Turfzone.vn',
      senderName: 'Trần Thị Chủ Sân',
      senderRole: 'OWNER',
      content: 'Cụm Sân Đại Nắng tối nay vừa trống thêm 1 ca 20:00 - 21:30 sân 5B, đội nào đặt nhắn mình giữ sân nhé!',
      pinned: false,
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 3,
      channel: 'giai-dau',
      senderEmail: 'organizer@Turfzone.vn',
      senderName: 'Lê Văn Ban Tổ Chức',
      senderRole: 'ORGANIZER',
      content: 'Giải Turfzone Championship Cup 2026 tại Hải Châu đang còn 4 suất đăng ký cuối cùng, các đội trưởng nhanh tay hoàn tất danh sách nhé!',
      pinned: true,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const notifications = [
    {
      id: 1,
      targetRole: 'ALL',
      targetEmail: null,
      title: 'Xác nhận lịch đặt sân hôm nay',
      message: 'Ca đá 17:00 - 18:30 tại Cụm Sân Bóng Đá Đại Nắng (Sân 7A) đã được xác nhận cọc.',
      type: 'BOOKING',
      link: '/?tab=schedule',
      readFlag: false,
      createdAt: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 2,
      targetRole: 'ALL',
      targetEmail: null,
      title: 'Kèo SOS tìm Thủ môn gần bạn',
      message: 'FC Bách Khoa Đà Nẵng đang cần gấp 1 Thủ môn ca 18:30 tối nay tại Sân Mini Hải Châu Arena (Miễn phí tiền sân).',
      type: 'MATCHMAKING',
      link: '/?tab=matchmaking',
      readFlag: false,
      createdAt: new Date(Date.now() - 2400000).toISOString(),
    },
  ];

  return {
    users,
    pitches,
    bookings,
    waitlists: [],
    attendances,
    tournaments,
    matchmakingPosts,
    reviews: [],
    chatMessages,
    chatGroups: [
      { id: 1, name: 'Hội Bóng Đá Phủi Hải Châu - Đà Nẵng', memberCount: 48, lastMessage: 'Tối nay 19h sân Đại Nắng nhé anh em!', updatedAt: new Date().toISOString() },
      { id: 2, name: 'CLB FC Đà Nẵng Warriors', memberCount: 14, lastMessage: 'Anh em vào điểm danh ca 17h00 hôm nay nhé.', updatedAt: new Date().toISOString() },
    ],
    clubs,
    canteenItems,
    notifications,
  };
}

function loadStore(): OfflineStore {
  if (typeof window === 'undefined') return buildDefaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.pitches) && parsed.pitches.length > 0) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const fresh = buildDefaultStore();
  saveStore(fresh);
  return fresh;
}

function saveStore(store: OfflineStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function parseBody(options?: RequestInit): any {
  if (!options?.body) return {};
  if (typeof options.body === 'string') {
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }
  return {};
}

function getCurrentOfflineUser(store: OfflineStore): any {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('Turfzone_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.email) return parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return store.users[2]; // default player@Turfzone.vn
}

function generateTimeSlots(openTime = '14:00', closeTime = '23:00', durationMin = 90): string[] {
  const startH = parseInt(openTime.split(':')[0] || '14', 10) || 14;
  const endH = parseInt(closeTime.split(':')[0] || '23', 10) || 23;
  const step = durationMin > 0 ? durationMin : 90;
  const slots: string[] = [];
  for (let m = startH * 60; m + step <= endH * 60; m += step) {
    const h1 = String(Math.floor(m / 60)).padStart(2, '0');
    const m1 = String(m % 60).padStart(2, '0');
    const end = m + step;
    const h2 = String(Math.floor(end / 60)).padStart(2, '0');
    const m2 = String(end % 60).padStart(2, '0');
    slots.push(`${h1}:${m1} - ${h2}:${m2}`);
  }
  return slots.length > 0
    ? slots
    : ['15:30 - 17:00', '17:00 - 18:30', '18:30 - 20:00', '20:00 - 21:30', '21:30 - 23:00'];
}

export async function handleOfflineApi(urlStr: string, options: RequestInit = {}): Promise<Response> {
  const store = loadStore();
  const method = (options.method || 'GET').toUpperCase();
  const parsedUrl = new URL(urlStr, 'http://localhost:8080');
  const path = parsedUrl.pathname;
  const query = parsedUrl.searchParams;
  const body = parseBody(options);

  // 1. Health check
  if (path === '/health' || path === '/api/v1/health') {
    return jsonResponse({ status: 'UP', mode: 'edge-resilient', service: 'Turfzone-backend-core' });
  }

  // 2. Auth endpoints
  if (path === '/api/v1/auth/login' && method === 'POST') {
    const emailInput = String(body.email || '').trim().toLowerCase();
    let found = store.users.find(
      (u) =>
        String(u.email || '').toLowerCase() === emailInput ||
        (u.phone && String(u.phone).replace(/\s/g, '') === emailInput.replace(/\s/g, ''))
    );
    if (!found) {
      const roleGuess = emailInput.includes('owner')
        ? 'OWNER'
        : emailInput.includes('btc') || emailInput.includes('organizer')
        ? 'ORGANIZER'
        : emailInput.includes('admin')
        ? 'ADMIN'
        : 'PLAYER';
      found = {
        id: Date.now(),
        fullName: emailInput.split('@')[0] || 'Cầu Thủ Đà Nẵng',
        email: body.email || 'player@Turfzone.vn',
        phone: '0912345678',
        role: roleGuess,
        area: 'Quận Hải Châu, Đà Nẵng',
        level: 'Phong trào',
        position: 'Tiền Vệ (CM)',
        eloRating: 1250,
        enabled: true,
        profileCompleted: true,
      };
      store.users.push(found);
      saveStore(store);
    }
    return jsonResponse({
      token: `tz-edge-token-${found.role}-${found.id || 1}`,
      tokenType: 'Bearer',
      user: found,
      message: 'Đăng nhập thành công',
    });
  }

  if (path === '/api/v1/auth/register' && method === 'POST') {
    const newUser = {
      id: Date.now(),
      fullName: body.fullName || 'Cầu Thủ Mới',
      email: body.email || `user${Date.now()}@Turfzone.vn`,
      phone: body.phone || '0905111222',
      role: body.role || 'PLAYER',
      position: body.position || 'Tiền Vệ (CM)',
      area: body.area || 'Quận Hải Châu, Đà Nẵng',
      favoriteSport: body.favoriteSport || 'Bóng Đá Sân 7',
      level: body.level || 'Phong trào',
      eloRating: 1200,
      enabled: true,
      profileCompleted: false,
    };
    store.users.push(newUser);
    saveStore(store);
    return jsonResponse({
      token: `tz-edge-token-${newUser.role}-${newUser.id}`,
      tokenType: 'Bearer',
      user: newUser,
      message: 'Đăng ký tài khoản thành công',
    });
  }

  if (path === '/api/v1/auth/me') {
    const current = getCurrentOfflineUser(store);
    if (method === 'PUT') {
      const updated = { ...current, ...body };
      const idx = store.users.findIndex((u) => u.email === current.email);
      if (idx >= 0) store.users[idx] = updated;
      saveStore(store);
      return jsonResponse(updated);
    }
    return jsonResponse(current);
  }

  // 3. Pitches & Bookings
  if (path === '/api/v1/pitches' && method === 'GET') {
    return jsonResponse(store.pitches);
  }

  if (path === '/api/v1/pitches/my-pitches' && method === 'GET') {
    return jsonResponse(store.pitches.slice(0, 3));
  }

  if (path === '/api/v1/pitches' && method === 'POST') {
    const created = {
      id: store.pitches.length + 1,
      rating: 4.8,
      reviewsCount: 10,
      openTime: '06:00',
      closeTime: '23:00',
      slotDurationMinutes: 90,
      pitchTypes: ['SAN_5', 'SAN_7'],
      amenities: ['Giữ xe', 'Wifi', 'Nước uống', 'Đèn LED'],
      imageUrl: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80',
      ...body,
    };
    store.pitches.unshift(created);
    saveStore(store);
    return jsonResponse(created, 201);
  }

  const pitchMatrixMatch = path.match(/^\/api\/v1\/pitches\/([^/]+)\/matrix$/);
  if (pitchMatrixMatch && method === 'GET') {
    const pid = Number(String(pitchMatrixMatch[1]).replace(/\D/g, '')) || 1;
    const pitch = store.pitches.find((p) => Number(p.id) === pid) || store.pitches[0];
    const dateStr = query.get('date') || todayIso(0);
    const dur = Number(query.get('duration')) || pitch.slotDurationMinutes || 90;
    const slotLabels = generateTimeSlots(pitch.openTime || '14:00', pitch.closeTime || '23:00', dur);
    const courts = [
      { id: `${pid}-1`, name: 'Sân 5A', type: 'SAN_5' },
      { id: `${pid}-2`, name: 'Sân 7A', type: 'SAN_7' },
      { id: `${pid}-3`, name: 'Sân 7B', type: 'SAN_7' },
    ];
    const matrix = courts.map((c) => {
      const base = pitch.avgPricePerHour || 260000;
      const peak = pitch.peakPricePerHour || 340000;
      const slots = slotLabels.map((time, idx) => {
        const startHour = parseInt(time.split(':')[0] || '17', 10);
        const isPeak = startHour >= 17 && startHour <= 20;
        const priceNum = Math.round(((isPeak ? peak : base) * dur) / 60);
        const existing = store.bookings.find(
          (b) =>
            Number(b.pitchId) === pid &&
            b.bookingDate === dateStr &&
            (b.courtName === c.name || b.timeSlot === time) &&
            b.timeSlot === time &&
            b.status !== 'CANCELLED'
        );
        return {
          id: `${c.id}-${idx}`,
          time,
          durationMinutes: dur,
          bookingId: existing ? existing.id : null,
          bookingTimeSlot: existing ? existing.timeSlot : null,
          status: existing ? existing.status || 'BOOKED' : 'AVAILABLE',
          customer: existing?.customerName || undefined,
          phone: existing?.customerPhone || undefined,
          price: `${Math.round(priceNum / 1000)}k`,
          depositPaid: existing?.depositPaid ? `${Math.round(existing.depositPaid / 1000)}k` : undefined,
          cashDue: existing?.cashDue ? `${Math.round(existing.cashDue / 1000)}k` : undefined,
          via: existing?.via || undefined,
          code: existing?.code || undefined,
        };
      });
      return {
        pitchId: c.id,
        pitchName: c.name,
        type: c.type,
        basePrice: base,
        peakPrice: peak,
        status: 'ACTIVE',
        slots,
      };
    });
    return jsonResponse(matrix);
  }

  const pitchStatsMatch = path.match(/^\/api\/v1\/pitches\/([^/]+)\/stats$/);
  if (pitchStatsMatch && method === 'GET') {
    const pid = Number(String(pitchStatsMatch[1]).replace(/\D/g, '')) || 1;
    const pitch = store.pitches.find((p) => Number(p.id) === pid) || store.pitches[0];
    const dateStr = query.get('date') || todayIso(0);
    const pitchBookings = store.bookings.filter((b) => Number(b.pitchId) === pid && b.status !== 'CANCELLED');
    const totalRevenue = pitchBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 360000), 0) || 2450000;
    return jsonResponse({
      pitchId: pid,
      pitchName: pitch.name,
      date: dateStr,
      totalRevenue,
      occupancyRate: 68,
      totalSlots: 18,
      bookedSlots: Math.max(4, pitchBookings.length),
      onlineBookings: Math.max(3, pitchBookings.length - 1),
      counterBookings: 2,
      openTime: pitch.openTime || '14:00',
      closeTime: pitch.closeTime || '23:00',
      slotDurationMinutes: pitch.slotDurationMinutes || 90,
    });
  }

  const pitchBookMatch = path.match(/^\/api\/v1\/pitches\/([^/]+)\/(book|book-offline)$/);
  if (pitchBookMatch && method === 'POST') {
    const pid = Number(String(pitchBookMatch[1]).replace(/\D/g, '')) || 1;
    const currentUser = getCurrentOfflineUser(store);
    const total = Number(body.totalPrice) || 360000;
    const deposit = Number(body.depositPaid) || Math.round(total * 0.5);
    const newBooking = {
      id: Date.now(),
      pitchId: pid,
      courtName: body.courtName || body.subPitchName || 'Sân 7A',
      courtType: body.courtType || 'SAN_7',
      bookingDate: body.bookingDate || body.date || todayIso(0),
      timeSlot: body.timeSlot || '18:30 - 20:00',
      customerName: body.customerName || currentUser?.fullName || 'Nguyễn Văn Cầu Thủ',
      customerPhone: body.customerPhone || currentUser?.phone || '0912345678',
      totalPrice: total,
      depositPaid: deposit,
      cashDue: Math.max(0, total - deposit),
      status: 'BOOKED',
      via: body.via || 'Đặt qua Website',
      code: `TZ-${String(Date.now()).slice(-5)}`,
      isClubBooking: Boolean(body.isClubBooking),
      clubName: body.clubName || undefined,
      createdAt: new Date().toISOString(),
    };
    store.bookings.unshift(newBooking);
    saveStore(store);
    return jsonResponse(newBooking, 201);
  }

  if (path === '/api/v1/pitches/bookings/my-bookings' || path === '/api/v1/pitches/bookings/search') {
    const q = (query.get('query') || '').trim().toLowerCase();
    const list = q
      ? store.bookings.filter(
          (b) =>
            String(b.code || '').toLowerCase().includes(q) ||
            String(b.customerPhone || '').toLowerCase().includes(q) ||
            String(b.customerName || '').toLowerCase().includes(q)
        )
      : store.bookings;
    return jsonResponse(list);
  }

  if (path === '/api/v1/pitches/bookings/my-waitlists' && method === 'GET') {
    return jsonResponse(store.waitlists);
  }

  if (path === '/api/v1/pitches/bookings/waitlist' && method === 'POST') {
    const currentUser = getCurrentOfflineUser(store);
    const pitch = store.pitches.find((p) => Number(p.id) === Number(body.pitchId)) || store.pitches[0];
    const wl = {
      id: Date.now(),
      pitchId: Number(body.pitchId) || 1,
      pitchName: pitch.name,
      courtName: body.courtName || 'Sân 7A',
      bookingDate: body.bookingDate || todayIso(0),
      timeSlot: body.timeSlot || '18:30 - 20:00',
      customerName: currentUser?.fullName || 'Nguyễn Văn Cầu Thủ',
      customerPhone: currentUser?.phone || '0912345678',
      status: 'WAITING',
      createdAt: new Date().toISOString(),
    };
    store.waitlists.unshift(wl);
    saveStore(store);
    return jsonResponse({ message: 'Đã đăng ký nhận thông báo khi ca sân trống chỗ!', waitlist: wl });
  }

  if (path === '/api/v1/pitches/bookings/recurring' && method === 'POST') {
    const currentUser = getCurrentOfflineUser(store);
    const groupId = `REC-${Date.now().toString().slice(-5)}`;
    const newBooking = {
      id: Date.now(),
      pitchId: Number(body.pitchId) || 1,
      courtName: body.courtName || 'Sân 7A',
      bookingDate: body.startDate || todayIso(1),
      timeSlot: body.timeSlot || '18:30 - 20:00',
      customerName: currentUser?.fullName || 'Nguyễn Văn Cầu Thủ',
      customerPhone: currentUser?.phone || '0912345678',
      totalPrice: 380000,
      depositPaid: 190000,
      cashDue: 190000,
      status: 'BOOKED',
      via: 'Đặt Định Kỳ CLB',
      code: groupId,
      isClubBooking: true,
      clubName: body.clubName || 'FC Đà Nẵng Warriors',
      isRecurring: true,
      recurringGroupId: groupId,
      createdAt: new Date().toISOString(),
    };
    store.bookings.unshift(newBooking);
    saveStore(store);
    return jsonResponse({
      message: 'Đã tạo lịch đặt sân cố định hàng tuần thành công!',
      recurringGroupId: groupId,
      totalSessions: 4,
      bookings: [newBooking],
    });
  }

  const bookingAttendanceMatch = path.match(/^\/api\/v1\/pitches\/bookings\/([^/]+)\/attendance$/);
  if (bookingAttendanceMatch) {
    const bid = String(bookingAttendanceMatch[1]);
    const list = store.attendances[bid] || [];
    if (method === 'GET') {
      return jsonResponse(list);
    }
    if (method === 'POST') {
      const record = {
        id: Date.now(),
        bookingId: Number(bid),
        playerName: body.playerName || 'Cầu Thủ',
        playerPhone: body.playerPhone || '',
        status: body.status || 'GOING',
        votedAt: new Date().toISOString(),
      };
      const filtered = list.filter((x: any) => x.playerName !== record.playerName);
      const next = [...filtered, record];
      store.attendances[bid] = next;
      saveStore(store);
      return jsonResponse({ message: 'Đã cập nhật điểm danh!', record, attendance: next });
    }
    if (method === 'DELETE') {
      const playerName = query.get('playerName') || '';
      const next = list.filter((x: any) => x.playerName !== playerName);
      store.attendances[bid] = next;
      saveStore(store);
      return jsonResponse({ message: 'Đã xóa khỏi danh sách điểm danh', attendance: next });
    }
  }

  const bookingActionMatch = path.match(/^\/api\/v1\/pitches\/bookings\/([^/]+)\/(reschedule|customer-reschedule|cancel|cancel-by-customer|check-in|confirm-payment|remind-handover)$/);
  if (bookingActionMatch) {
    const bid = Number(bookingActionMatch[1]);
    const action = bookingActionMatch[2];
    const b = store.bookings.find((x) => Number(x.id) === bid);
    if (b) {
      if (action === 'reschedule' || action === 'customer-reschedule') {
        b.bookingDate = body.newBookingDate || b.bookingDate;
        b.timeSlot = body.newTimeSlot || b.timeSlot;
      } else if (action === 'cancel' || action === 'cancel-by-customer') {
        b.status = 'CANCELLED';
      } else if (action === 'check-in') {
        b.status = 'PLAYING';
      } else if (action === 'confirm-payment') {
        b.status = 'BOOKED';
      }
      saveStore(store);
    }
    return jsonResponse({
      success: true,
      message: 'Thao tác cập nhật ca đặt sân thành công!',
      booking: b || null,
    });
  }

  const singlePitchMatch = path.match(/^\/api\/v1\/pitches\/([^/]+)$/);
  if (singlePitchMatch) {
    const pid = Number(String(singlePitchMatch[1]).replace(/\D/g, '')) || 1;
    const found = store.pitches.find((p) => Number(p.id) === pid) || store.pitches[0];
    if (method === 'PUT') {
      Object.assign(found, body);
      saveStore(store);
    }
    return jsonResponse(found);
  }

  // 4. Tournaments
  if (path === '/api/v1/tournaments' && method === 'GET') {
    return jsonResponse(store.tournaments);
  }

  if (path === '/api/v1/tournaments' && method === 'POST') {
    const created = {
      id: Date.now(),
      status: 'OPEN',
      registeredTeams: 0,
      teams: [],
      ...body,
    };
    store.tournaments.unshift(created);
    saveStore(store);
    return jsonResponse(created, 201);
  }

  if (path === '/api/v1/tournaments/scorers/top' && method === 'GET') {
    return jsonResponse([
      { playerName: 'Nguyễn Văn Cầu Thủ', teamName: 'FC Đà Nẵng Warriors', goals: 7, assists: 4, rank: 1 },
      { playerName: 'Võ Thanh Tâm', teamName: 'FC Đại Nắng', goals: 6, assists: 2, rank: 2 },
      { playerName: 'Trần Tuấn Anh', teamName: 'FC Hoàng Nam Hải Châu', goals: 5, assists: 3, rank: 3 },
      { playerName: 'Phạm Gia Bảo', teamName: 'FC Sơn Trà United', goals: 4, assists: 2, rank: 4 },
      { playerName: 'Lê Hoàng Minh', teamName: 'FC Bách Khoa Đà Nẵng', goals: 4, assists: 1, rank: 5 },
    ]);
  }

  const tournamentSubMatch = path.match(/^\/api\/v1\/tournaments\/(\d+)(?:\/(.*))?$/);
  if (tournamentSubMatch) {
    const tid = Number(tournamentSubMatch[1]);
    const sub = tournamentSubMatch[2] || '';
    const tournament = store.tournaments.find((t) => Number(t.id) === tid) || store.tournaments[0];

    if (!sub) {
      if (method === 'PUT') {
        Object.assign(tournament, body);
        saveStore(store);
      }
      return jsonResponse(tournament);
    }

    if (sub === 'bracket' && method === 'GET') {
      if (tournament.bracketJson) {
        return jsonResponse(JSON.parse(tournament.bracketJson));
      }
      return jsonResponse(null, 404);
    }

    if (sub === 'scorers' && method === 'GET') {
      return jsonResponse([
        { playerName: 'Võ Thanh Tâm', teamName: 'FC Đại Nắng', goals: 5, assists: 2, rank: 1 },
        { playerName: 'Nguyễn Văn Cầu Thủ', teamName: 'FC Đà Nẵng Warriors', goals: 4, assists: 3, rank: 2 },
        { playerName: 'Phạm Gia Bảo', teamName: 'FC Sơn Trà United', goals: 3, assists: 1, rank: 3 },
      ]);
    }

    if (sub === 'finance' && method === 'GET') {
      const fee = Number(tournament.entryFee) || 1000000;
      const prize = Number(tournament.prizePool) || 15000000;
      const confirmed = (tournament.teams || []).length;
      return jsonResponse({
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        status: tournament.status || 'OPEN',
        entryFee: fee,
        prizePool: prize,
        totalTeams: confirmed,
        capacity: tournament.totalTeams || 16,
        confirmedTeams: confirmed,
        pendingTeams: 0,
        simulatedTeams: 0,
        totalCollected: confirmed * fee,
        totalAwaiting: 0,
        prizeToPay: prize,
        netAfterPrize: confirmed * fee - prize,
        fillPercent: Math.min(100, Math.round((confirmed / (tournament.totalTeams || 16)) * 100)),
      });
    }

    if (sub === 'register' || sub === 'teams/manual') {
      const entry = {
        teamName: body.teamName || 'FC Đội Mới Đà Nẵng',
        captainName: body.captainName || 'Đội Trưởng',
        captainPhone: body.captainPhone || '0912345678',
        memberCount: Number(body.memberCount) || 12,
        memberNames: body.memberNames || '',
        registrationStatus: 'CONFIRMED',
        form: 'WWD',
        record: '2W-1D-0L',
        winRate: 75,
      };
      tournament.teams = [...(tournament.teams || []), entry];
      tournament.registeredTeams = tournament.teams.length;
      saveStore(store);
      return jsonResponse({ message: 'Đăng ký đội bóng thành công!', registeredTeams: tournament.registeredTeams });
    }

    if (sub === 'teams/pending') {
      return jsonResponse([]);
    }

    if (sub === 'referees') {
      return jsonResponse([
        { id: 1, tournamentId: tid, fullName: 'Trọng Tài Nguyễn Quốc Việt', phone: '0905888999', status: 'ACTIVE', notes: 'Trọng tài Liên đoàn Bóng đá Đà Nẵng' },
      ]);
    }

    if (sub === 'access') {
      return jsonResponse({ joinMode: tournament.joinMode || 'PUBLIC', invitedEmails: tournament.invitedEmails || [] });
    }
  }

  // 5. Matchmaking & Community
  if (path === '/api/v1/community/matchmaking-posts') {
    if (method === 'GET') {
      return jsonResponse(store.matchmakingPosts);
    }
    if (method === 'POST') {
      const currentUser = getCurrentOfflineUser(store);
      const created = {
        id: Date.now(),
        postType: body.postType || 'MATCH',
        neededPosition: body.neededPosition || undefined,
        neededCount: body.neededCount || undefined,
        teamName: body.teamName || currentUser?.currentClub || 'FC Đà Nẵng Warriors',
        captainName: body.captainName || currentUser?.fullName || 'Nguyễn Văn Cầu Thủ',
        captainPhone: body.captainPhone || currentUser?.phone || '0912345678',
        reputationScore: 98,
        pitchName: body.pitchName || 'Cụm Sân Bóng Đá Đại Nắng',
        address: body.address || 'Quận Hải Châu, Đà Nẵng',
        matchTime: body.matchTime || '19:30 Tối nay',
        pitchType: body.pitchType || 'SAN_7',
        paymentModel: body.paymentModel || 'SPLIT_EQUAL',
        estimatedFee: Number(body.estimatedFee ?? 50000),
        matchStyle: body.matchStyle || 'DUONG_SINH',
        ageGroup: body.ageGroup || 'U25_U35',
        homeKitColor: body.homeKitColor || 'Đỏ',
        refereeOption: body.refereeOption || 'TU_BAT',
        waterOption: body.waterOption || 'CAM_THUNG',
        note: body.note || 'Giao lưu vui vẻ, fairplay đúng giờ.',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      };
      store.matchmakingPosts.unshift(created);
      saveStore(store);
      return jsonResponse(created, 201);
    }
  }

  const acceptMatchmaking = path.match(/^\/api\/v1\/community\/matchmaking-posts\/([^/]+)\/accept$/);
  if (acceptMatchmaking) {
    const mid = Number(acceptMatchmaking[1]);
    const post = store.matchmakingPosts.find((p) => Number(p.id) === mid);
    if (post) {
      post.status = 'MATCHED';
      post.opponentTeam = body.opponentTeam || 'FC Đối Thủ Đà Nẵng';
      post.opponentPhone = body.opponentPhone || '0912345678';
      post.awayKitColor = body.awayKitColor || 'Xanh dương';
      saveStore(store);
    }
    return jsonResponse(post || { status: 'MATCHED' });
  }

  if (path === '/api/v1/community/players/leaderboard') {
    return jsonResponse([
      { id: 1, fullName: 'Nguyễn Văn Cầu Thủ', position: 'Tiền Vệ (CM)', area: 'Quận Hải Châu, Đà Nẵng', eloRating: 1420, matchesPlayed: 28, winRate: 78 },
      { id: 2, fullName: 'Võ Thanh Tâm', position: 'Tiền Đạo (ST)', area: 'Quận Hải Châu, Đà Nẵng', eloRating: 1395, matchesPlayed: 24, winRate: 75 },
      { id: 3, fullName: 'Phạm Gia Bảo', position: 'Hậu Vệ (CB)', area: 'Quận Sơn Trà, Đà Nẵng', eloRating: 1360, matchesPlayed: 21, winRate: 71 },
      { id: 4, fullName: 'Lê Hoàng Minh', position: 'Thủ Môn (GK)', area: 'Quận Liên Chiểu, Đà Nẵng', eloRating: 1340, matchesPlayed: 19, winRate: 68 },
    ]);
  }

  if (path.startsWith('/api/v1/community/reviews')) {
    if (method === 'POST') {
      const rev = { id: Date.now(), ...body, createdAt: new Date().toISOString() };
      store.reviews.unshift(rev);
      saveStore(store);
      return jsonResponse(rev, 201);
    }
    return jsonResponse({ averageStars: 4.9, totalReviews: 18, onTimeRate: 96, fairPlayRate: 98, reviews: store.reviews });
  }

  // 6. Clubs, Chat, Canteen, Notifications, Admin
  if (path === '/api/v1/clubs/mine' || path === '/api/v1/clubs') {
    if (method === 'POST') {
      const club = { id: Date.now(), memberCount: 1, members: [], ...body };
      store.clubs.unshift(club);
      saveStore(store);
      return jsonResponse({ message: 'Tạo CLB thành công', club }, 201);
    }
    return jsonResponse(store.clubs);
  }

  const singleClubMatch = path.match(/^\/api\/v1\/clubs\/(\d+)/);
  if (singleClubMatch) {
    const cid = Number(singleClubMatch[1]);
    const club = store.clubs.find((c) => Number(c.id) === cid) || store.clubs[0];
    return jsonResponse({ message: 'Thành công', club, ...club });
  }

  if (path === '/api/v1/chat/channels') {
    return jsonResponse([
      { slug: 'keo-nhanh', name: 'Kèo Nhanh Đà Nẵng', description: 'Bắt đối & tìm người thế chỗ SOS trong ngày', lastMessage: store.chatMessages[0]?.content, lastTime: store.chatMessages[0]?.createdAt, lastSenderEmail: store.chatMessages[0]?.senderEmail },
      { slug: 'giai-dau', name: 'Bàn Luận Giải Đấu', description: 'Thông báo lịch thi đấu & kết quả giải phủi', lastMessage: store.chatMessages[2]?.content, lastTime: store.chatMessages[2]?.createdAt, lastSenderEmail: store.chatMessages[2]?.senderEmail },
      { slug: 'tim-san', name: 'Hỏi Sân Trống Giờ Vàng', description: 'Chủ sân báo ca trống 17h30 - 20h30 tại Đà Nẵng', lastMessage: store.chatMessages[1]?.content, lastTime: store.chatMessages[1]?.createdAt, lastSenderEmail: store.chatMessages[1]?.senderEmail },
    ]);
  }

  if (path === '/api/v1/chat/conversations') {
    return jsonResponse([
      { partnerEmail: 'owner@Turfzone.vn', partnerName: 'Trần Thị Chủ Sân (Sân Đại Nắng)', partnerRole: 'OWNER', lastMessage: 'Sân 7A ca 17h00 hôm nay đã bật đèn sẵn cho đội bạn nhé!', lastTime: new Date(Date.now() - 600000).toISOString(), unreadCount: 0 },
      { partnerEmail: 'organizer@Turfzone.vn', partnerName: 'Lê Văn Ban Tổ Chức', partnerRole: 'ORGANIZER', lastMessage: 'Chào đội trưởng, lịch bốc thăm Cúp Sân 7 sẽ diễn ra lúc 19h tối thứ Sáu.', lastTime: new Date(Date.now() - 3600000).toISOString(), unreadCount: 0 },
    ]);
  }

  if (path === '/api/v1/chat/unread-count') {
    return jsonResponse({ dm: 0, group: 0, total: 0 });
  }

  if (path === '/api/v1/chat/users') {
    return jsonResponse(store.users);
  }

  if (path === '/api/v1/chat/messages') {
    if (method === 'POST') {
      const currentUser = getCurrentOfflineUser(store);
      const msg = {
        id: Date.now(),
        channel: body.channel || 'keo-nhanh',
        recipientEmail: body.recipientEmail || null,
        senderEmail: currentUser?.email || 'player@Turfzone.vn',
        senderName: currentUser?.fullName || 'Nguyễn Văn Cầu Thủ',
        senderRole: currentUser?.role || 'PLAYER',
        content: body.content || '',
        pinned: false,
        createdAt: new Date().toISOString(),
      };
      store.chatMessages.push(msg);
      saveStore(store);
      return jsonResponse(msg, 201);
    }
    const ch = query.get('channel');
    const list = ch ? store.chatMessages.filter((m) => m.channel === ch) : store.chatMessages;
    return jsonResponse(list);
  }

  if (path.startsWith('/api/v1/chat-groups')) {
    return jsonResponse(store.chatGroups);
  }

  if (path.startsWith('/api/v1/canteen/items')) {
    if (method === 'POST' && !path.endsWith('/sell')) {
      const item = { id: Date.now(), soldCount: 0, ...body };
      store.canteenItems.push(item);
      saveStore(store);
      return jsonResponse(item, 201);
    }
    return jsonResponse(store.canteenItems);
  }

  if (path.startsWith('/api/v1/notifications')) {
    return jsonResponse(store.notifications);
  }

  if (path === '/api/v1/admin/overview') {
    return jsonResponse({
      totalUsers: store.users.length + 124,
      totalPlayers: 98,
      totalOwners: 18,
      totalOrganizers: 8,
      totalPitches: store.pitches.length,
      totalBookings: store.bookings.length + 340,
      totalRevenue: 86400000,
      activeTournaments: store.tournaments.length,
      openMatchmakingPosts: store.matchmakingPosts.length,
    });
  }

  if (path === '/api/v1/admin/revenue-report') {
    return jsonResponse({
      totalRevenue: 86400000,
      monthlyRevenue: [
        { month: '06/2026', revenue: 12500000, bookings: 48 },
        { month: '07/2026', revenue: 14200000, bookings: 54 },
        { month: '08/2026', revenue: 15800000, bookings: 61 },
        { month: '09/2026', revenue: 13900000, bookings: 52 },
        { month: '10/2026', revenue: 14600000, bookings: 57 },
        { month: '11/2026', revenue: 15400000, bookings: 62 },
      ],
    });
  }

  return jsonResponse({ ok: true, message: 'Thành công' });
}

