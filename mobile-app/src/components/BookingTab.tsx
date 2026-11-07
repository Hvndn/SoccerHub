import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import {
  COLORS,
  useResponsiveLayout,
  addDaysLocal,
  copyTextWithFeedback,
} from '../theme/responsive';
import {
  API_URL,
  Pitch,
  MatrixCourt,
  AuthUser,
  AVAILABLE_ADDONS,
  buildFallbackMatrixCourts,
  isPeakSlot,
  pitchTypeLabel,
} from '../services/api';

export type ExtendedNavTabId =
  | 'booking'
  | 'matchmaking'
  | 'community'
  | 'tournaments'
  | 'team-management'
  | 'membership'
  | 'my-activities'
  | 'profile'
  | 'admin'
  | 'multi-sport'
  | 'organizer'
  | 'activities'
  | 'owner';

interface BookingTabProps {
  pitches: Pitch[];
  loading: boolean;
  error: string | null;
  onRetryPitches: () => void;
  user: AuthUser | null;
  token: string | null;
  onBookingSuccess: (newBooking: any) => void;
  onNavigateTab: (tab: any) => void;
  isGuest?: boolean;
}

interface SelectedSlotItem {
  key: string;
  pitchId: string;
  pitchName: string;
  time: string;
  price: string;
  priceValue: number;
  courtType: string;
}

export default function BookingTab({
  pitches,
  loading,
  error,
  onRetryPitches,
  user,
  token,
  onBookingSuccess,
  onNavigateTab,
  isGuest = false,
}: BookingTabProps) {
  const layout = useResponsiveLayout();

  // Guest Landing Toggle (Allows viewing LandingHero & LandingFeatures just like Web Guest mode)
  const [showGuestLanding, setShowGuestLanding] = useState<boolean>(false);

  // ============================================================
  // 1. PITCH SEARCH FILTER STATES (100% Parity with PitchSearch.tsx)
  // ============================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedTimeSlotFilter, setSelectedTimeSlotFilter] = useState('ALL');
  const [maxBudget, setMaxBudget] = useState<number>(800000);
  const [onlyAvailableTonight, setOnlyAvailableTonight] = useState<boolean>(false);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PITCHES_PER_PAGE = 8;

  // ============================================================
  // 2. PITCH DETAIL VIEW STATES (100% Parity with PitchDetail.tsx)
  // ============================================================
  const [selectedPitchForSlot, setSelectedPitchForSlot] = useState<Pitch | null>(null);
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);
  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [courts, setCourts] = useState<MatrixCourt[]>([]);
  const [matrixLoading, setMatrixLoading] = useState<boolean>(false);
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlotItem[]>([]);

  // Inline Pending / Waitlist Slot Info
  const [pendingSlotInfo, setPendingSlotInfo] = useState<{
    pitchName: string;
    time: string;
    price: string;
    note?: string;
  } | null>(null);
  const [waitlistRegistrations, setWaitlistRegistrations] = useState<string[]>([]);

  // Booking Form Options (Matching PitchDetail.tsx)
  const [bookingEntityType, setBookingEntityType] = useState<'INDIVIDUAL' | 'CLUB'>('INDIVIDUAL');
  const [clubName, setClubName] = useState('FC Anh Em Đà Nẵng');
  const [isFullDayClubBooking, setIsFullDayClubBooking] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [bookingNotes, setBookingNotes] = useState('');
  const [depositOption, setDepositOption] = useState<'50' | '100'>('50');
  const [splitPlayerCount, setSplitPlayerCount] = useState<number>(14);
  const [customerName, setCustomerName] = useState(
    user?.fullName || user?.name || 'Nguyễn Văn Cầu Thủ'
  );
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '0905123456');

  // Checkout Step State ('FORM' -> 'PAYMENT_CONFIRM' -> 'TICKET')
  const [checkoutStep, setCheckoutStep] = useState<'FORM' | 'PAYMENT_CONFIRM' | 'TICKET'>('FORM');
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingCode, setBookingCode] = useState('SH-84920');
  const [inlineToast, setInlineToast] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const showToast = (msg: string) => {
    setInlineToast(msg);
    setTimeout(() => setInlineToast(null), 4000);
  };

  // 7-Day Selector matching PitchDetail.tsx
  const availableDates = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
    const info = addDaysLocal(offset);
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dayNames = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    return {
      offset,
      isoDate: info.dateStr,
      dayName: offset === 0 ? 'Hôm nay' : dayNames[d.getDay()],
      dateStr: info.subLabel,
    };
  });

  const activeDateObj = availableDates[selectedDateOffset] || availableDates[0];

  const loadMatrixForPitch = async (pitch: Pitch, isoDate: string) => {
    setMatrixLoading(true);
    setSelectedSlots([]);
    setPendingSlotInfo(null);
    setCheckoutStep('FORM');
    try {
      const numericId = pitch.numericId || Number(String(pitch.id).replace(/\D/g, '')) || 1;
      const res = await fetch(`${API_URL}/pitches/${numericId}/matrix?date=${isoDate}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCourts(data);
      } else {
        setCourts(buildFallbackMatrixCourts(pitch));
      }
    } catch {
      setCourts(buildFallbackMatrixCourts(pitch));
    } finally {
      setMatrixLoading(false);
    }
  };

  const handleOpenPitchDetail = (pitch: Pitch, preselectTime?: string) => {
    setSelectedPitchForSlot(pitch);
    setSelectedDateOffset(0);
    setCourtFilter('ALL');
    loadMatrixForPitch(pitch, availableDates[0].isoDate);
    if (preselectTime) {
      const numVal = pitch.avgPricePerHour || 280000;
      setSelectedSlots([
        {
          key: `${pitch.id}-7a__${preselectTime}`,
          pitchId: `${pitch.id}-7a`,
          pitchName: 'Sân 7A (Cỏ tiêu chuẩn)',
          time: preselectTime,
          price: `${Math.round(numVal / 1000)}k`,
          priceValue: numVal,
          courtType: 'SAN_7',
        },
      ]);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSport, selectedDistrict, selectedTimeSlotFilter, maxBudget, onlyAvailableTonight]);

  const sportsTabs = [
    { id: 'ALL', name: 'Tất cả loại sân' },
    { id: 'SAN7', name: 'Sân 7 người' },
    { id: 'SAN5', name: 'Sân 5 người' },
    { id: 'FUTSAL', name: 'Sân Futsal' },
    { id: 'SAN11', name: 'Sân 11 người' },
  ];

  const districtList = [
    { id: 'ALL', name: 'Toàn TP. Đà Nẵng' },
    { id: 'HAI_CHAU', name: 'Quận Hải Châu' },
    { id: 'LIEN_CHIEU', name: 'Quận Liên Chiểu' },
    { id: 'THANH_KHE', name: 'Quận Thanh Khê' },
    { id: 'CAM_LE', name: 'Quận Cẩm Lệ' },
    { id: 'SON_TRA', name: 'Quận Sơn Trà' },
  ];

  const timeSlotFilters = [
    { id: 'ALL', name: 'Tất cả khung giờ' },
    { id: 'PEAK', name: 'Giờ cao điểm (17:00 - 20:00)' },
    { id: 'AFTERNOON', name: 'Ca chiều (14:00 - 17:00)' },
    { id: 'LATE', name: 'Ca tối (20:00 - 22:30)' },
  ];

  const budgetOptions = [
    { value: 800000, label: 'Mọi mức giá' },
    { value: 300000, label: 'Dưới 300k/giờ' },
    { value: 400000, label: 'Dưới 400k/giờ' },
    { value: 500000, label: 'Dưới 500k/giờ' },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSport !== 'ALL' ||
    selectedDistrict !== 'ALL' ||
    selectedTimeSlotFilter !== 'ALL' ||
    maxBudget < 800000 ||
    onlyAvailableTonight;

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedSport('ALL');
    setSelectedDistrict('ALL');
    setSelectedTimeSlotFilter('ALL');
    setMaxBudget(800000);
    setOnlyAvailableTonight(false);
  };

  const filteredPitches = pitches.filter((pitch) => {
    const matchesSport =
      selectedSport === 'ALL' ||
      pitch.sport === selectedSport ||
      (Array.isArray(pitch.sportList) && pitch.sportList.includes(selectedSport));
    const matchesDistrict =
      selectedDistrict === 'ALL' || pitch.district === selectedDistrict;
    const matchesSearch =
      !searchQuery.trim() ||
      pitch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pitch.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBudget = (pitch.avgPricePerHour || 0) <= maxBudget;

    const slots = pitch.timeSlots || [];
    const matchesAvailableTonight =
      !onlyAvailableTonight || slots.some((s) => s.status === 'AVAILABLE');

    let matchesTimeSlot = true;
    if (selectedTimeSlotFilter === 'PEAK') {
      matchesTimeSlot = slots.some(
        (s) =>
          s.status === 'AVAILABLE' &&
          (s.time.includes('16:00') || s.time.includes('17:') || s.time.includes('18:00'))
      );
    } else if (selectedTimeSlotFilter === 'AFTERNOON') {
      matchesTimeSlot = slots.some(
        (s) => s.status === 'AVAILABLE' && (s.time.includes('14:00') || s.time.includes('15:'))
      );
    } else if (selectedTimeSlotFilter === 'LATE') {
      matchesTimeSlot = slots.some(
        (s) => s.status === 'AVAILABLE' && (s.time.includes('20:00') || s.time.includes('21:00'))
      );
    }

    return (
      matchesSport &&
      matchesDistrict &&
      matchesSearch &&
      matchesBudget &&
      matchesAvailableTonight &&
      matchesTimeSlot
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredPitches.length / PITCHES_PER_PAGE));
  const paginatedPitches = filteredPitches.slice(
    (currentPage - 1) * PITCHES_PER_PAGE,
    currentPage * PITCHES_PER_PAGE
  );

  // ============================================================
  // PITCH DETAIL CALCULATIONS & HANDLERS
  // ============================================================
  const toggleSelectSlot = (court: MatrixCourt, slot: MatrixCourt['slots'][0]) => {
    if (slot.status === 'booked' || slot.status === 'playing') return;
    if (slot.status === 'pending') {
      setPendingSlotInfo({
        pitchName: court.pitchName,
        time: slot.time,
        price: slot.price || `${Math.round((slot.priceValue || 280000) / 1000)}k`,
        note: slot.note,
      });
      return;
    }

    setPendingSlotInfo(null);
    const key = `${court.pitchId || court.pitchName}__${slot.time}`;
    const exists = selectedSlots.some((s) => s.key === key);
    if (exists) {
      setSelectedSlots((prev) => prev.filter((s) => s.key !== key));
    } else {
      const priceValue =
        slot.priceValue ||
        parseInt(String(slot.price || '280').replace(/\D/g, ''), 10) * 1000 ||
        selectedPitchForSlot?.avgPricePerHour ||
        280000;
      setSelectedSlots((prev) => [
        ...prev,
        {
          key,
          pitchId: String(court.pitchId || court.pitchName),
          pitchName: court.pitchName,
          time: slot.time,
          price: slot.price || `${Math.round(priceValue / 1000)}k`,
          priceValue,
          courtType: court.type || 'SAN_7',
        },
      ]);
    }
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const basePitchCost = selectedSlots.reduce((sum, s) => sum + s.priceValue, 0);
  const addonsCost = selectedAddons.reduce((sum, id) => {
    const found = AVAILABLE_ADDONS.find((a) => a.id === id);
    return sum + (found ? found.price : 0);
  }, 0);
  const totalCost = basePitchCost + addonsCost;
  const amountDueNow = depositOption === '50' ? Math.round(totalCost * 0.5) : totalCost;
  const remainingAtPitch = totalCost - amountDueNow;
  const perPersonCost =
    splitPlayerCount > 0 ? Math.ceil(totalCost / splitPlayerCount / 1000) * 1000 : 0;

  // Dynamic Weather & Turf Status hint matching PitchDetail.tsx
  const getBookingWeatherHint = () => {
    const firstTime = selectedSlots[0]?.time || '18:00 - 20:00';
    const startHour = parseInt(firstTime.split(':')[0], 10) || 18;
    const isAfternoon = startHour < 17;
    const isRainRisk = selectedDateOffset % 3 === 1 && startHour >= 16 && startHour <= 19;

    if (isRainRisk) {
      return {
        temp: '27°C',
        condition: 'Có thể có mưa rào nhẹ (35%)',
        turfStatus: 'Mặt cỏ thoát nước tốt • Nên mang giày đinh TF bám sân',
        packingTips: ['Giày đinh dăm TF', 'Áo khoác gió nhẹ', 'Khăn khô & tất dự phòng'],
        tone: 'amber' as const,
      };
    }
    if (isAfternoon) {
      return {
        temp: '31°C',
        condition: 'Trời nắng nhẹ, khô ráo',
        turfStatus: 'Mặt sân khô thoáng • Độ nảy bóng chuẩn',
        packingTips: ['Nước điện giải / Chanh muối', 'Giày đinh TF/AG', 'Băng cổ chân'],
        tone: 'amber' as const,
      };
    }
    return {
      temp: '26°C',
      condition: 'Buổi tối mát mẻ, gió nhẹ',
      turfStatus: 'Hệ thống đèn LED & mặt cỏ đạt 100% tiêu chuẩn',
      packingTips: ['Giày đinh TF', 'Áo bib chia đội', 'Bình nước cá nhân'],
      tone: 'emerald' as const,
    };
  };

  const handleConfirmPaymentAndBook = async () => {
    if (!selectedPitchForSlot || selectedSlots.length === 0) return;
    setBookingBusy(true);
    const firstSlot = selectedSlots[0];
    const generatedCode = `SH-${Math.floor(10000 + Math.random() * 90000)}`;
    const numericId =
      selectedPitchForSlot.numericId ||
      Number(String(selectedPitchForSlot.id).replace(/\D/g, '')) ||
      1;

    try {
      const addonNames = selectedAddons
        .map((id) => AVAILABLE_ADDONS.find((a) => a.id === id)?.name)
        .filter(Boolean)
        .join(', ');

      const fullNote = [
        bookingEntityType === 'CLUB' ? `[CLB: ${clubName}]` : '',
        isFullDayClubBooking ? '[Bao sân cả ngày]' : '',
        addonNames ? `[Dịch vụ: ${addonNames}]` : '',
        bookingNotes,
      ]
        .filter(Boolean)
        .join(' ');

      const res = await fetch(`${API_URL}/pitches/${numericId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          courtName: selectedSlots.map((s) => s.pitchName).join(', '),
          courtType: pitchTypeLabel(firstSlot.courtType),
          timeSlot: selectedSlots.map((s) => s.time).join(', '),
          bookingDate: activeDateObj.isoDate,
          customerName: customerName.trim() || 'Nguyễn Văn Cầu Thủ',
          customerPhone: customerPhone.trim() || '0905123456',
          depositPercent: Number(depositOption),
          note: fullNote,
          via: 'Turfzone Mobile & Web Sync',
        }),
      });
      const data = await res.json().catch(() => ({}));
      const finalCode = data?.code || generatedCode;
      setBookingCode(finalCode);

      onBookingSuccess({
        id: data?.id || Date.now(),
        code: finalCode,
        pitchId: numericId,
        pitchName: selectedPitchForSlot.name,
        courtName: selectedSlots.map((s) => s.pitchName).join(', '),
        courtType: pitchTypeLabel(firstSlot.courtType),
        bookingDate: activeDateObj.isoDate,
        timeSlot: selectedSlots.map((s) => s.time).join(', '),
        status: 'BOOKED',
        totalPrice: totalCost,
        depositPaid: amountDueNow,
        cashDue: remainingAtPitch,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        note: fullNote,
      });
    } catch {
      setBookingCode(generatedCode);
      onBookingSuccess({
        id: Date.now(),
        code: generatedCode,
        pitchId: numericId,
        pitchName: selectedPitchForSlot.name,
        courtName: selectedSlots.map((s) => s.pitchName).join(', '),
        courtType: pitchTypeLabel(firstSlot.courtType),
        bookingDate: activeDateObj.isoDate,
        timeSlot: selectedSlots.map((s) => s.time).join(', '),
        status: 'BOOKED',
        totalPrice: totalCost,
        depositPaid: amountDueNow,
        cashDue: remainingAtPitch,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        note: bookingNotes,
      });
    } finally {
      setBookingBusy(false);
      setCheckoutStep('TICKET');
      showToast('🎉 Đặt sân thành công! Phiếu giữ chỗ điện tử đã sẵn sàng.');
    }
  };

  // ============================================================
  // VIEW A: PITCH DETAIL VIEW (100% Parity with PitchDetail.tsx)
  // ============================================================
  if (selectedPitchForSlot) {
    const pitch = selectedPitchForSlot;
    const weather = getBookingWeatherHint();
    const filteredCourts = courts.filter((c) => {
      if (courtFilter === 'ALL') return true;
      return String(c.type || '').toUpperCase().replace('_', '') === courtFilter.replace('_', '');
    });

    const summarySlotsText =
      selectedSlots.length === 0
        ? 'Chưa chọn ca'
        : selectedSlots.map((s) => `${s.pitchName} (${s.time})`).join(', ');

    const zaloInviteMessage = `⚽ THÔNG BÁO KÈO BÓNG ĐÁ (${activeDateObj.dayName} - ${activeDateObj.dateStr})\n📍 Sân: ${pitch.name}\n🗺️ Địa chỉ: ${pitch.address}\n⏰ Ca đá: ${summarySlotsText}\n💰 Tổng tiền: ${totalCost.toLocaleString('vi-VN')}đ (Chia ${splitPlayerCount} anh em = ~${perPersonCost.toLocaleString('vi-VN')}đ/người)\n🎫 Mã vé check-in: #${bookingCode}\nAnh em có mặt trước 15 phút khởi động nhé!`;

    return (
      <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
        {inlineToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{inlineToast}</Text>
          </View>
        )}

        {/* 1. TOP BREADCRUMB BAR (Matches PitchDetail.tsx) */}
        <View style={styles.breadcrumbBar}>
          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() => setSelectedPitchForSlot(null)}
              style={styles.backToListBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.backToListBtnText}>← Danh sách sân</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbPath} numberOfLines={1}>
              Đặt sân {'>'} <Text style={{ color: COLORS.text, fontWeight: '800' }}>{pitch.name}</Text>
            </Text>
          </View>

          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() =>
                copyTextWithFeedback(
                  'Đã sao chép đường dẫn sân',
                  `http://localhost:3000/?pitchId=${pitch.id}`,
                  () => {
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2500);
                  }
                )
              }
              style={styles.breadcrumbActionBtn}
            >
              <Text style={styles.breadcrumbActionText}>
                {shareCopied ? '✓ Đã lưu link' : '🔗 Chia sẻ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${pitch.name} ${pitch.address}`
                  )}`
                )
              }
              style={styles.breadcrumbActionBtn}
            >
              <Text style={styles.breadcrumbActionText}>🗺️ Bản đồ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. VENUE SUMMARY CARD */}
        <View style={styles.detailVenueCard}>
          <View style={[styles.detailVenueInner, layout.isTablet && { flexDirection: 'row' }]}>
            <Image
              source={{ uri: pitch.imageUrl }}
              style={[
                styles.detailVenueImg,
                layout.isTablet ? { width: 260, height: 185 } : { width: '100%', height: 180 },
              ]}
              contentFit="cover"
            />
            <View style={styles.detailVenueInfo}>
              <View style={styles.wrapRow}>
                <View style={styles.emeraldTag}>
                  <Text style={styles.emeraldTagText}>Sân cỏ nhân tạo</Text>
                </View>
                <View style={styles.slateTag}>
                  <Text style={styles.slateTagText}>{courts.length} sân con</Text>
                </View>
                <View style={styles.amberRatingTag}>
                  <Text style={styles.amberRatingTagText}>
                    ★ {Number(pitch.rating || 4.8).toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailVenueName}>{pitch.name}</Text>
              <Text style={styles.detailVenueAddr}>📍 {pitch.address}</Text>

              <View style={styles.venueMetaGrid}>
                <View style={styles.venueMetaCell}>
                  <Text style={styles.venueMetaLabel}>Điện thoại:</Text>
                  <Text style={styles.venueMetaValue}>{pitch.phone || '0905123456'}</Text>
                </View>
                <View style={styles.venueMetaCell}>
                  <Text style={styles.venueMetaLabel}>Giờ mở cửa:</Text>
                  <Text style={styles.venueMetaValue}>
                    {pitch.openTime} - {pitch.closeTime}
                  </Text>
                </View>
                <View style={[styles.venueMetaCell, { flex: 1.5 }]}>
                  <Text style={styles.venueMetaLabel}>Tiện ích:</Text>
                  <Text style={styles.venueMetaValue} numberOfLines={2}>
                    {(pitch.amenities || ['Giữ xe', 'Wifi', 'Nước uống', 'Đèn LED']).join(' • ')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 3. MAIN 2-COLUMN LAYOUT (Left: Matrix, Right: Phiếu Đặt Sân) */}
        <View
          style={[
            styles.detailColumnsWrap,
            layout.isDesktop && { flexDirection: 'row', alignItems: 'flex-start' },
          ]}
        >
          {/* LEFT COLUMN: CHỌN NGÀY & KHUNG GIỜ ĐẶT SÂN */}
          <View style={[styles.matrixCard, layout.isDesktop && { flex: 7 }]}>
            <View style={styles.matrixHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.matrixTitle}>📅 Chọn Ngày & Khung Giờ Đặt Sân</Text>
                <Text style={styles.matrixSubtitle}>
                  Bấm vào ô giờ còn trống để chọn (có thể chọn gộp nhiều ca)
                </Text>
              </View>

              {/* Status Legend */}
              <View style={styles.legendWrap}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: '#6ee7b7', backgroundColor: '#fff' }]} />
                  <Text style={styles.legendText}>Còn trống</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: COLORS.emerald, backgroundColor: COLORS.emerald }]} />
                  <Text style={styles.legendText}>Đang chọn</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: '#fcd34d', backgroundColor: '#fffbeb' }]} />
                  <Text style={styles.legendText}>Chờ khóa ca</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: COLORS.border, backgroundColor: '#f1f5f9' }]} />
                  <Text style={styles.legendText}>Đã đặt</Text>
                </View>
              </View>
            </View>

            {/* 7-Day Date Selector */}
            <View style={styles.wrapRow}>
              {availableDates.map((d) => {
                const active = selectedDateOffset === d.offset;
                return (
                  <TouchableOpacity
                    key={d.isoDate}
                    onPress={() => {
                      setSelectedDateOffset(d.offset);
                      loadMatrixForPitch(pitch, d.isoDate);
                    }}
                    style={[styles.dayButton, active && styles.dayButtonActive]}
                  >
                    <Text style={[styles.dayButtonName, active && { color: COLORS.white }]}>
                      {d.dayName}
                    </Text>
                    <Text style={[styles.dayButtonDate, active && { color: '#d1fae5' }]}>
                      {d.dateStr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Weather & Turf Status Bar (Matches PitchDetail.tsx) */}
            <View
              style={[
                styles.weatherBar,
                weather.tone === 'amber' ? styles.weatherBarAmber : styles.weatherBarEmerald,
              ]}
            >
              <Text style={styles.weatherConditionText}>
                {weather.tone === 'amber' ? '🌤️' : '🌙'} {weather.temp} — {weather.condition} •{' '}
                {weather.turfStatus}
              </Text>
              <View style={styles.wrapRow}>
                <Text style={styles.weatherTipLabel}>Gợi ý đồ mang theo:</Text>
                {weather.packingTips.map((tip, idx) => (
                  <View key={idx} style={styles.weatherTipPill}>
                    <Text style={styles.weatherTipPillText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sub-court filter */}
            <View style={styles.subCourtFilterBar}>
              <View style={styles.wrapRow}>
                {[
                  { id: 'ALL', label: `Tất cả sân con (${courts.length})` },
                  { id: 'SAN_7', label: 'Sân 7 người' },
                  { id: 'SAN_5', label: 'Sân 5 người' },
                  { id: 'SAN_11', label: 'Sân 11 người' },
                ].map((tab) => {
                  const active = courtFilter === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setCourtFilter(tab.id)}
                      style={[styles.subCourtTab, active && styles.subCourtTabActive]}
                    >
                      <Text
                        style={[styles.subCourtTabText, active && styles.subCourtTabTextActive]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.peakNoticeText}>🔥 Khung 17:00 - 20:00 là giờ cao điểm</Text>
            </View>

            {/* Courts & Slots Matrix */}
            {matrixLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.emerald} />
                <Text style={styles.loadingText}>Đang tải bảng giờ trống các sân con...</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredCourts.map((court, cIdx) => {
                  const emptyCount = (court.slots || []).filter((s) => s.status === 'empty').length;
                  return (
                    <View key={court.pitchId || cIdx} style={styles.subCourtCard}>
                      <View style={styles.subCourtHeader}>
                        <View style={styles.wrapRow}>
                          <Text style={styles.subCourtName}>{court.pitchName}</Text>
                          <View style={styles.subCourtTypeBadge}>
                            <Text style={styles.subCourtTypeBadgeText}>
                              {pitchTypeLabel(court.type)}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.subCourtAvailText,
                            emptyCount > 0 ? { color: COLORS.emeraldDark } : { color: COLORS.textMuted },
                          ]}
                        >
                          {emptyCount > 0 ? `Còn ${emptyCount} ca trống` : 'Hết ca trống'}
                        </Text>
                      </View>

                      <View style={styles.slotButtonsGrid}>
                        {(court.slots || []).map((slot, sIdx) => {
                          const slotKey = `${court.pitchId || court.pitchName}__${slot.time}`;
                          const isSelected = selectedSlots.some((s) => s.key === slotKey);
                          const isEmpty = slot.status === 'empty';
                          const isPending = slot.status === 'pending';
                          const isPeak = isPeakSlot(slot.time);
                          const priceLabel =
                            slot.price ||
                            `${Math.round((slot.priceValue || pitch.avgPricePerHour || 280000) / 1000)}k`;

                          return (
                            <TouchableOpacity
                              key={`${slot.time}-${sIdx}`}
                              onPress={() => toggleSelectSlot(court, slot)}
                              disabled={!isEmpty && !isPending}
                              style={[
                                styles.matrixSlotBtn,
                                isSelected
                                  ? styles.matrixSlotBtnSelected
                                  : isEmpty
                                  ? styles.matrixSlotBtnEmpty
                                  : isPending
                                  ? styles.matrixSlotBtnPending
                                  : styles.matrixSlotBtnBooked,
                              ]}
                              activeOpacity={0.8}
                            >
                              {isPeak && isEmpty && !isSelected && (
                                <View style={styles.peakDot} />
                              )}
                              <Text
                                style={[
                                  styles.matrixSlotTime,
                                  isSelected && { color: COLORS.white },
                                  !isEmpty && !isPending && { color: COLORS.textMuted },
                                ]}
                              >
                                {slot.time}
                              </Text>
                              <View style={styles.matrixSlotBottom}>
                                <Text
                                  style={[
                                    styles.matrixSlotPrice,
                                    isSelected && { color: COLORS.white },
                                    isEmpty && !isSelected && { color: COLORS.emeraldDark },
                                    isPending && { color: COLORS.amber },
                                  ]}
                                >
                                  {priceLabel}
                                </Text>
                                <Text
                                  style={[
                                    styles.matrixSlotStatus,
                                    isSelected && { color: '#d1fae5' },
                                  ]}
                                >
                                  {isSelected
                                    ? '✓ Đang chọn'
                                    : isEmpty
                                    ? 'Còn trống'
                                    : isPending
                                    ? 'Chờ khóa'
                                    : 'Đã đặt'}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Inline Pending / Waitlist Slot Card (NO MODAL) */}
            {pendingSlotInfo && (
              <View style={styles.pendingInfoCard}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.wrapRow}>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>Ca đang chờ xác nhận cọc</Text>
                    </View>
                    <Text style={styles.pendingSlotTitle}>
                      {pendingSlotInfo.pitchName} • {pendingSlotInfo.time} ({pendingSlotInfo.price})
                    </Text>
                  </View>
                  <Text style={styles.pendingSlotDesc}>
                    {pendingSlotInfo.note ||
                      'Khung giờ này đang có khách giữ chỗ tạm thời. Bấm Đăng ký hàng chờ để hệ thống báo ngay nếu ca mở lại.'}
                  </Text>
                </View>

                <View style={styles.wrapRow}>
                  {(() => {
                    const wlKey = `${activeDateObj.isoDate}__${pendingSlotInfo.pitchName}__${pendingSlotInfo.time}`;
                    const isRegistered = waitlistRegistrations.includes(wlKey);
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          if (!isRegistered) {
                            setWaitlistRegistrations((prev) => [...prev, wlKey]);
                            showToast(
                              `🔔 Đã đăng ký hàng chờ ca ${pendingSlotInfo.time} (${pendingSlotInfo.pitchName})!`
                            );
                          }
                        }}
                        style={[
                          styles.waitlistInlineBtn,
                          isRegistered && { backgroundColor: COLORS.emerald },
                        ]}
                      >
                        <Text style={styles.waitlistInlineBtnText}>
                          {isRegistered ? '✓ Đã Đăng Ký Hàng Chờ' : '🔔 Đăng Ký Hàng Chờ Ca Này'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                  <TouchableOpacity
                    onPress={() => setPendingSlotInfo(null)}
                    style={styles.closePendingBtn}
                  >
                    <Text style={styles.closePendingBtnText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* RIGHT COLUMN: PHIẾU ĐẶT SÂN & PHIẾU GIỮ CHỖ ĐIỆN TỬ */}
          <View style={[styles.ticketSidebarCard, layout.isDesktop && { flex: 5 }]}>
            {checkoutStep !== 'TICKET' ? (
              <View style={{ gap: 14 }}>
                <View style={styles.ticketHeaderBar}>
                  <View>
                    <Text style={styles.ticketHeaderTitle}>🧾 Phiếu Đặt Sân</Text>
                    <Text style={styles.ticketHeaderSub}>
                      Kiểm tra ca đá và xác nhận giữ chỗ
                    </Text>
                  </View>
                  {selectedSlots.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedSlots([]);
                        setSelectedAddons([]);
                        setCheckoutStep('FORM');
                      }}
                    >
                      <Text style={styles.resetTicketText}>↺ Đặt lại</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Venue & Date Summary */}
                <View style={styles.ticketSummaryBox}>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.ticketSummaryLabel}>Cụm sân:</Text>
                    <Text style={styles.ticketSummaryVal}>{pitch.name}</Text>
                  </View>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.ticketSummaryLabel}>Ngày đá:</Text>
                    <Text style={[styles.ticketSummaryVal, { color: COLORS.emeraldDark }]}>
                      {activeDateObj.dayName}, {activeDateObj.dateStr}
                    </Text>
                  </View>
                </View>

                {/* Selected Slots */}
                <View style={{ gap: 8 }}>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.fieldSectionLabel}>Ca đã chọn</Text>
                    <Text style={styles.slotCountBadgeText}>{selectedSlots.length} ca</Text>
                  </View>

                  {selectedSlots.length === 0 ? (
                    <View style={styles.emptySelectedBox}>
                      <Text style={styles.emptySelectedText}>
                        👈 Hãy bấm chọn một hoặc nhiều khung giờ còn trống ở bảng bên cạnh để bắt đầu đặt sân
                      </Text>
                    </View>
                  ) : (
                    selectedSlots.map((s) => (
                      <View key={s.key} style={styles.selectedSlotRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selectedSlotCourt}>{s.pitchName}</Text>
                          <Text style={styles.selectedSlotTime}>⏰ {s.time}</Text>
                        </View>
                        <View style={styles.wrapRow}>
                          <Text style={styles.selectedSlotPrice}>
                            {s.priceValue.toLocaleString('vi-VN')}đ
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              setSelectedSlots((prev) => prev.filter((item) => item.key !== s.key))
                            }
                            style={styles.removeSlotBtn}
                          >
                            <Text style={styles.removeSlotBtnText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Hình thức đứng tên đặt sân: Cá nhân vs Đại diện CLB */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldSectionLabel}>Hình thức đứng tên đặt sân</Text>
                  <View style={styles.wrapRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setBookingEntityType('INDIVIDUAL');
                        setIsFullDayClubBooking(false);
                      }}
                      style={[
                        styles.entityTabBtn,
                        bookingEntityType === 'INDIVIDUAL' && styles.entityTabBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.entityTabBtnText,
                          bookingEntityType === 'INDIVIDUAL' && styles.entityTabBtnTextActive,
                        ]}
                      >
                        👤 Cá nhân
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setBookingEntityType('CLUB')}
                      style={[
                        styles.entityTabBtn,
                        bookingEntityType === 'CLUB' && styles.entityTabBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.entityTabBtnText,
                          bookingEntityType === 'CLUB' && styles.entityTabBtnTextActive,
                        ]}
                      >
                        🛡️ Đại diện CLB
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {bookingEntityType === 'CLUB' && (
                    <View style={styles.clubBox}>
                      <Text style={styles.smallLabel}>Tên CLB / Đội bóng đứng tên:</Text>
                      <TextInput
                        value={clubName}
                        onChangeText={setClubName}
                        placeholder="Nhập tên CLB..."
                        style={styles.textInput}
                      />
                      <TouchableOpacity
                        onPress={() => setIsFullDayClubBooking(!isFullDayClubBooking)}
                        style={styles.checkboxRow}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            isFullDayClubBooking && styles.checkboxBoxChecked,
                          ]}
                        >
                          {isFullDayClubBooking && <Text style={styles.checkboxTick}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.checkboxTitle}>
                            Bao sân cả ngày (Giải đấu / Sự kiện CLB)
                          </Text>
                          <Text style={styles.checkboxSub}>
                            Tự động chọn toàn bộ các khung giờ còn trống trong ngày
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Trang bị & Dịch vụ kèm theo (AVAILABLE_ADDONS) */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldSectionLabel}>Trang bị & Dịch vụ kèm theo</Text>
                  <View style={{ gap: 6 }}>
                    {AVAILABLE_ADDONS.map((addon) => {
                      const checked = selectedAddons.includes(addon.id);
                      return (
                        <TouchableOpacity
                          key={addon.id}
                          onPress={() => toggleAddon(addon.id)}
                          style={[styles.addonItemCard, checked && styles.addonItemCardActive]}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[styles.checkboxBox, checked && styles.checkboxBoxChecked]}
                          >
                            {checked && <Text style={styles.checkboxTick}>✓</Text>}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.addonName}>{addon.name}</Text>
                            <Text style={styles.addonDesc}>{addon.desc}</Text>
                          </View>
                          <Text style={styles.addonPrice}>
                            +{addon.price.toLocaleString('vi-VN')}đ
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Contact & Notes */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldSectionLabel}>Thông tin liên hệ & Ghi chú</Text>
                  <View style={styles.wrapRow}>
                    <TextInput
                      value={customerName}
                      onChangeText={setCustomerName}
                      placeholder="Họ tên người đặt..."
                      style={[styles.textInput, { flex: 1, minWidth: 140 }]}
                    />
                    <TextInput
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      placeholder="Số điện thoại..."
                      keyboardType="phone-pad"
                      style={[styles.textInput, { flex: 1, minWidth: 130 }]}
                    />
                  </View>
                  <TextInput
                    value={bookingNotes}
                    onChangeText={setBookingNotes}
                    placeholder="Ví dụ: Cho đội mượn thêm bóng, bật đèn sớm 10 phút..."
                    style={styles.textInput}
                  />
                </View>

                {/* Mức thanh toán giữ chỗ */}
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldSectionLabel}>Mức thanh toán giữ chỗ</Text>
                  <View style={styles.wrapRow}>
                    <TouchableOpacity
                      onPress={() => setDepositOption('50')}
                      style={[
                        styles.depositOptionCard,
                        depositOption === '50' && styles.depositOptionCardActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.depositOptionTitle,
                          depositOption === '50' && { color: COLORS.emeraldDark },
                        ]}
                      >
                        Đặt cọc 50%
                      </Text>
                      <Text style={styles.depositOptionSub}>Thanh toán phần còn lại tại sân</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setDepositOption('100')}
                      style={[
                        styles.depositOptionCard,
                        depositOption === '100' && styles.depositOptionCardActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.depositOptionTitle,
                          depositOption === '100' && { color: COLORS.emeraldDark },
                        ]}
                      >
                        Trả đủ 100%
                      </Text>
                      <Text style={styles.depositOptionSub}>Ưu tiên nhận sân ngay</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cost Breakdown & Chia tiền cho X người */}
                <View style={styles.costBreakdownBox}>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costLabel}>Tiền thuê sân ({selectedSlots.length} ca):</Text>
                    <Text style={styles.costValue}>{basePitchCost.toLocaleString('vi-VN')}đ</Text>
                  </View>
                  {addonsCost > 0 && (
                    <View style={styles.ticketSummaryRow}>
                      <Text style={styles.costLabel}>Dịch vụ kèm theo:</Text>
                      <Text style={styles.costValue}>+{addonsCost.toLocaleString('vi-VN')}đ</Text>
                    </View>
                  )}
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costTotalLabel}>Tổng cộng:</Text>
                    <Text style={styles.costTotalValue}>{totalCost.toLocaleString('vi-VN')}đ</Text>
                  </View>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costDueLabel}>
                      Cần thanh toán ngay ({depositOption}%):
                    </Text>
                    <Text style={styles.costDueValue}>
                      {amountDueNow.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>

                  {totalCost > 0 && (
                    <View style={styles.splitterBar}>
                      <View style={styles.wrapRow}>
                        <Text style={styles.splitterLabel}>👥 Chia cho:</Text>
                        <TouchableOpacity
                          onPress={() => setSplitPlayerCount((c) => Math.max(2, c - 1))}
                          style={styles.splitterStepBtn}
                        >
                          <Text style={styles.splitterStepText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.splitterCountText}>{splitPlayerCount} người</Text>
                        <TouchableOpacity
                          onPress={() => setSplitPlayerCount((c) => Math.min(30, c + 1))}
                          style={styles.splitterStepBtn}
                        >
                          <Text style={styles.splitterStepText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.splitterResultText}>
                        ~{perPersonCost.toLocaleString('vi-VN')}đ/người
                      </Text>
                    </View>
                  )}
                </View>

                {/* Step 1 -> Step 2 Inline Payment Confirmation */}
                {checkoutStep === 'FORM' ? (
                  <TouchableOpacity
                    disabled={selectedSlots.length === 0}
                    onPress={() => setCheckoutStep('PAYMENT_CONFIRM')}
                    style={[
                      styles.proceedBookBtn,
                      selectedSlots.length === 0 && { backgroundColor: COLORS.border },
                    ]}
                  >
                    <Text style={styles.proceedBookBtnText}>
                      {selectedSlots.length === 0
                        ? 'Vui lòng chọn khung giờ trống'
                        : 'Tiến Hành Giữ Sân →'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.inlinePaymentConfirmBox}>
                    <Text style={styles.inlinePaymentTitle}>
                      💳 Xác nhận thanh toán cọc giữ sân ({amountDueNow.toLocaleString('vi-VN')}đ)
                    </Text>
                    <Text style={styles.inlinePaymentSub}>
                      Chuyển khoản VietQR hoặc xác nhận giữ chỗ trực tiếp với chủ sân:
                    </Text>
                    <View style={styles.bankInfoBox}>
                      <Text style={styles.bankInfoText}>🏦 Ngân hàng: MB Bank • STK: 0905123456</Text>
                      <Text style={styles.bankInfoText}>
                        📝 Nội dung: TURFZONE {pitch.id} {customerPhone}
                      </Text>
                    </View>
                    <View style={styles.wrapRow}>
                      <TouchableOpacity
                        onPress={handleConfirmPaymentAndBook}
                        disabled={bookingBusy}
                        style={[styles.proceedBookBtn, { flex: 1 }]}
                      >
                        <Text style={styles.proceedBookBtnText}>
                          {bookingBusy
                            ? 'Đang tạo phiếu giữ chỗ...'
                            : '✓ Xác Nhận & Xuất Phiếu Giữ Chỗ'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setCheckoutStep('FORM')}
                        style={styles.backStepBtn}
                      >
                        <Text style={styles.backStepBtnText}>Quay lại</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* STEP 3: PHIẾU GIỮ CHỖ ĐIỆN TỬ (Matches PitchDetail.tsx 100%) */
              <View style={{ gap: 14 }}>
                <View style={styles.eTicketHeader}>
                  <View style={styles.wrapRow}>
                    <Text style={styles.eTicketHeaderBadge}>✓ Phiếu Giữ Chỗ Điện Tử</Text>
                    <Text style={styles.eTicketCode}>#{bookingCode}</Text>
                  </View>
                  <Text style={styles.eTicketVenueName}>{pitch.name}</Text>
                  <Text style={styles.eTicketVenueAddr}>📍 {pitch.address}</Text>
                </View>

                <View style={styles.costBreakdownBox}>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costLabel}>Ngày thi đấu:</Text>
                    <Text style={styles.costValue}>
                      {activeDateObj.dayName}, {activeDateObj.dateStr}
                    </Text>
                  </View>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costLabel}>Sân & Giờ:</Text>
                    <Text style={[styles.costValue, { color: COLORS.emeraldDark }]}>
                      {summarySlotsText}
                    </Text>
                  </View>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costLabel}>Đã thanh toán ({depositOption}%):</Text>
                    <Text style={[styles.costValue, { color: COLORS.emeraldDark }]}>
                      {amountDueNow.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  {remainingAtPitch > 0 && (
                    <View style={styles.ticketSummaryRow}>
                      <Text style={styles.costLabel}>Còn lại trả tại sân:</Text>
                      <Text style={[styles.costValue, { color: COLORS.amber }]}>
                        {remainingAtPitch.toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  )}
                </View>

                {/* Kêu gọi anh em & chia tiền Zalo */}
                <View style={styles.zaloInviteBox}>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.zaloInviteTitle}>📣 Kêu gọi anh em & chia tiền</Text>
                    <Text style={styles.zaloSplitTag}>
                      ~{perPersonCost.toLocaleString('vi-VN')}đ / người
                    </Text>
                  </View>
                  <Text style={styles.zaloMessagePreview}>{zaloInviteMessage}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      copyTextWithFeedback(
                        'Đã sao chép lời nhắn gửi nhóm Zalo',
                        zaloInviteMessage,
                        () => {
                          setCopiedInvite(true);
                          setTimeout(() => setCopiedInvite(false), 2500);
                        }
                      )
                    }
                    style={styles.copyZaloBtn}
                  >
                    <Text style={styles.copyZaloBtnText}>
                      {copiedInvite
                        ? '✓ Đã Sao Chép Tin Nhắn Kèo!'
                        : '📋 Sao Chép Lời Nhắn Gửi Nhóm Zalo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wrapRow}>
                  <TouchableOpacity
                    onPress={() => onNavigateTab('my-activities')}
                    style={[styles.proceedBookBtn, { flex: 1 }]}
                  >
                    <Text style={styles.proceedBookBtnText}>
                      📋 Mở Lịch Trình & Điểm Danh Quân Số
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCheckoutStep('FORM');
                      setSelectedSlots([]);
                    }}
                    style={styles.backStepBtn}
                  >
                    <Text style={styles.backStepBtnText}>Đặt thêm ca</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ============================================================
  // VIEW B: PITCH SEARCH LIST VIEW (100% Parity with PitchSearch.tsx)
  // ============================================================
  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {inlineToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{inlineToast}</Text>
        </View>
      )}

      {/* Optional Guest / Overview Landing Hero (Matches LandingHero.tsx on Web) */}
      {(isGuest || showGuestLanding) && (
        <View style={styles.landingHeroBox}>
          <View style={styles.landingBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.landingBadgeText}>
              Hệ Thống Quản Lý Bóng Đá Phong Trào Toàn Diện
            </Text>
          </View>
          <Text style={[styles.landingTitle, layout.isTablet && { fontSize: 28, lineHeight: 36 }]}>
            Đặt Sân Bóng Đá, Cáp Kèo Giao Hữu &{' '}
            <Text style={{ color: '#34d399' }}>Quản Lý Giải Đấu Phong Trào</Text>
          </Text>
          <Text style={styles.landingDesc}>
            Kết nối trực tiếp cầu thủ, đội trưởng, chủ cụm sân và ban tổ chức giải đấu trên một nền tảng duy nhất. Tra cứu ca trống tức thì, tìm đối thủ vừa tầm và cập nhật bảng xếp hạng trực tuyến.
          </Text>
          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() => setShowGuestLanding(false)}
              style={styles.landingPrimaryBtn}
            >
              <Text style={styles.landingPrimaryBtnText}>⚽ Đặt Sân Bóng Ngay →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigateTab('matchmaking')}
              style={styles.landingSecondaryBtn}
            >
              <Text style={styles.landingSecondaryBtnText}>🔥 Chợ Kèo Giao Hữu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigateTab('tournaments')}
              style={styles.landingSecondaryBtn}
            >
              <Text style={styles.landingSecondaryBtnText}>🏆 Giải Đấu & BXH</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.landingStatsGrid}>
            {[
              { val: '25+', label: 'Cụm Sân Liên Kết', sub: 'Cập nhật lịch trống trực tiếp' },
              { val: '450+', label: 'Đội Bóng Hoạt Động', sub: 'Sẵn sàng cáp kèo giao hữu' },
              { val: '150+', label: 'Giải Đấu Phong Trào', sub: 'Tự động hóa lịch & bảng điểm' },
              { val: '24/7', label: 'Đặt Sân & Cáp Kèo', sub: 'Xác nhận giữ chỗ tức thì' },
            ].map((st, idx) => (
              <View key={idx} style={styles.landingStatCard}>
                <Text style={styles.landingStatVal}>{st.val}</Text>
                <Text style={styles.landingStatLabel}>{st.label}</Text>
                <Text style={styles.landingStatSub}>{st.sub}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 1. COMPACT HEADER & FILTER BAR (Matches PitchSearch.tsx 100%) */}
      <View style={styles.pitchSearchHeaderBox}>
        <View style={styles.pitchSearchTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pitchSearchTitle}>Đặt Sân Bóng Đá Trực Tuyến</Text>
            <Text style={styles.pitchSearchSubtitle}>
              Chọn cụm sân, xem bảng giờ trống thực tế và đặt giữ ca trực tiếp với chủ sân
            </Text>
          </View>
          <View style={styles.wrapRow}>
            <View style={styles.displayCountPill}>
              <Text style={styles.displayCountPillText}>
                Hiển thị <Text style={{ color: COLORS.emeraldDark, fontWeight: '900' }}>{filteredPitches.length}</Text> cụm sân
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowGuestLanding(!showGuestLanding)}
              style={styles.toggleHeroBtn}
            >
              <Text style={styles.toggleHeroBtnText}>
                {showGuestLanding ? 'Ẩn giới thiệu' : 'Giới thiệu nền tảng'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Row 1: Search Input + District + TimeSlot + Budget */}
        <View style={styles.searchFilterRow}>
          <View style={[styles.searchInputWrap, { flex: 2, minWidth: 220 }]}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm tên sân hoặc tên đường, quận..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {layout.isPhone && (
            <TouchableOpacity
              onPress={() => setShowMobileFilters(!showMobileFilters)}
              style={[
                styles.mobileFilterToggleBtn,
                (showMobileFilters || hasActiveFilters) && styles.mobileFilterToggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.mobileFilterToggleText,
                  (showMobileFilters || hasActiveFilters) && { color: COLORS.emeraldDark },
                ]}
              >
                ⚙️ Bộ lọc nâng cao {showMobileFilters ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* District / TimeSlot / Budget Selector Pills (Always visible on Tablet/Desktop, collapsible on Phone) */}
        {(!layout.isPhone || showMobileFilters) && (
          <View style={styles.advancedFiltersContainer}>
            {/* District Pills */}
            <View style={{ gap: 6 }}>
              <Text style={styles.filterCategoryLabel}>📍 Khu vực Quận / Huyện (TP. Đà Nẵng):</Text>
              <View style={styles.wrapRow}>
                {districtList.map((d) => {
                  const active = selectedDistrict === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => setSelectedDistrict(d.id)}
                      style={[styles.filterSelectPill, active && styles.filterSelectPillActive]}
                    >
                      <Text
                        style={[
                          styles.filterSelectPillText,
                          active && styles.filterSelectPillTextActive,
                        ]}
                      >
                        {d.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Slot Filter Pills */}
            <View style={{ gap: 6 }}>
              <Text style={styles.filterCategoryLabel}>🕒 Khung giờ tìm sân:</Text>
              <View style={styles.wrapRow}>
                {timeSlotFilters.map((tf) => {
                  const active = selectedTimeSlotFilter === tf.id;
                  return (
                    <TouchableOpacity
                      key={tf.id}
                      onPress={() => setSelectedTimeSlotFilter(tf.id)}
                      style={[styles.filterSelectPill, active && styles.filterSelectPillActive]}
                    >
                      <Text
                        style={[
                          styles.filterSelectPillText,
                          active && styles.filterSelectPillTextActive,
                        ]}
                      >
                        {tf.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Max Budget Filter Pills */}
            <View style={{ gap: 6 }}>
              <Text style={styles.filterCategoryLabel}>💰 Mức giá thuê tối đa:</Text>
              <View style={styles.wrapRow}>
                {budgetOptions.map((b) => {
                  const active = maxBudget === b.value;
                  return (
                    <TouchableOpacity
                      key={b.value}
                      onPress={() => setMaxBudget(b.value)}
                      style={[styles.filterSelectPill, active && styles.filterSelectPillActive]}
                    >
                      <Text
                        style={[
                          styles.filterSelectPillText,
                          active && styles.filterSelectPillTextActive,
                        ]}
                      >
                        {b.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Filter Row 2: Sport Tabs + Còn ca trống tối nay + Xóa bộ lọc */}
        <View style={styles.sportTabsBottomRow}>
          <View style={styles.wrapRow}>
            {sportsTabs.map((sport) => {
              const active = selectedSport === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  onPress={() => setSelectedSport(sport.id)}
                  style={[styles.webSportTab, active && styles.webSportTabActive]}
                >
                  <Text style={[styles.webSportTabText, active && styles.webSportTabTextActive]}>
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() => setOnlyAvailableTonight(!onlyAvailableTonight)}
              style={styles.tonightCheckboxRow}
            >
              <View
                style={[
                  styles.checkboxBox,
                  onlyAvailableTonight && styles.checkboxBoxChecked,
                ]}
              >
                {onlyAvailableTonight && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.tonightCheckboxLabel}>Còn ca trống tối nay</Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity onPress={resetAllFilters} style={styles.clearFiltersBtn}>
                <Text style={styles.clearFiltersBtnText}>✕ Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={onRetryPitches} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. PITCH LIST (2-COLUMN SPLIT-CARD GRID ON TABLET/DESKTOP, 1-COL ON PHONE) */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.emerald} />
          <Text style={styles.loadingText}>Đang tải danh sách cụm sân...</Text>
        </View>
      ) : filteredPitches.length === 0 ? (
        <View style={styles.emptySearchBox}>
          <Text style={styles.emptySearchTitle}>Không tìm thấy sân phù hợp</Text>
          <Text style={styles.emptySearchSub}>
            Hãy thử nới lỏng bộ lọc khu vực hoặc khung giờ để xem thêm các cụm sân khác.
          </Text>
          <TouchableOpacity onPress={resetAllFilters} style={styles.resetFiltersPrimaryBtn}>
            <Text style={styles.resetFiltersPrimaryBtnText}>Đặt Lại Bộ Lọc</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.pitchGridWrap,
            layout.gridColumns > 1 && {
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: layout.cardGap,
            },
          ]}
        >
          {paginatedPitches.map((pitch) => {
            const cardWidthStyle =
              layout.gridColumns > 1
                ? { width: layout.gridCardWidth }
                : { width: '100%' as const };

            const useHorizontalSplit = layout.width >= 600;

            return (
              <Pressable
                key={pitch.id}
                onPress={() => handleOpenPitchDetail(pitch)}
                style={[
                  styles.webPitchCard,
                  cardWidthStyle,
                  useHorizontalSplit && { flexDirection: 'row' },
                ]}
              >
                {/* Left / Top Image Block */}
                <View
                  style={[
                    styles.webPitchImageWrap,
                    useHorizontalSplit ? { width: 215, minHeight: 220 } : { height: 185 },
                  ]}
                >
                  <Image
                    source={{ uri: pitch.imageUrl }}
                    style={styles.webPitchImage}
                    contentFit="cover"
                    transition={200}
                  />
                  {/* Top-Left Sport Badge */}
                  <View style={styles.webSportBadgeOnImg}>
                    <Text style={styles.webSportBadgeOnImgText}>
                      {pitch.sportBadge || 'Sân 7 người'}
                    </Text>
                  </View>
                  {/* Bottom Dark Bar: District + Open/Close Time */}
                  <View style={styles.webImgBottomBar}>
                    <Text style={styles.webImgBottomDistrict} numberOfLines={1}>
                      📍 {pitch.districtName || pitch.area}
                    </Text>
                    <Text style={styles.webImgBottomHours}>
                      {pitch.openTime} - {pitch.closeTime}
                    </Text>
                  </View>
                </View>

                {/* Right / Bottom Content Block */}
                <View style={styles.webPitchContent}>
                  {/* Title + Rating */}
                  <View style={styles.webPitchTitleRow}>
                    <Text style={styles.webPitchName} numberOfLines={1}>
                      {pitch.name}
                    </Text>
                    {pitch.rating != null && (
                      <View style={styles.webRatingPill}>
                        <Text style={styles.webRatingPillText}>
                          ★ {Number(pitch.rating).toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Address */}
                  <Text style={styles.webPitchAddress} numberOfLines={1}>
                    📍 {pitch.address}
                  </Text>

                  {/* Phone */}
                  {pitch.phone ? (
                    <Text style={styles.webPitchPhone}>📞 Liên hệ: {pitch.phone}</Text>
                  ) : null}

                  {/* Amenities */}
                  {pitch.amenities && pitch.amenities.length > 0 && (
                    <View style={styles.wrapRow}>
                      {pitch.amenities.slice(0, 4).map((am, i) => (
                        <View key={i} style={styles.webAmenityPill}>
                          <Text style={styles.webAmenityPillText}>{am}</Text>
                        </View>
                      ))}
                      {pitch.amenities.length > 4 && (
                        <View style={styles.webAmenityMorePill}>
                          <Text style={styles.webAmenityMoreText}>
                            +{pitch.amenities.length - 4}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Ca sân trong ngày (120 phút/ca) */}
                  <View style={styles.webSlotsPreviewBlock}>
                    <Text style={styles.webSlotsPreviewLabel}>
                      🕒 Ca sân trong ngày ({pitch.slotDurationMinutes || 120} phút/ca):
                    </Text>
                    <View style={styles.wrapRow}>
                      {(pitch.timeSlots || []).slice(0, 4).map((slot, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => handleOpenPitchDetail(pitch, slot.time)}
                          style={styles.webPreviewSlotChip}
                        >
                          <Text style={styles.webPreviewSlotChipText}>{slot.time}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Footer: Price & CTA */}
                  <View style={styles.webPitchFooter}>
                    <View>
                      <Text style={styles.webPriceCaption}>Giá thuê từ</Text>
                      <View style={styles.wrapRow}>
                        <Text style={styles.webPriceValue}>
                          {(pitch.avgPricePerHour || 280000).toLocaleString('vi-VN')}đ
                        </Text>
                        <Text style={styles.webPriceUnit}>/giờ</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleOpenPitchDetail(pitch)}
                      style={styles.webSelectSlotBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.webSelectSlotBtnText}>Chọn Ca Đặt Sân →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 3. PAGINATION BAR (Matches PitchSearch.tsx) */}
      {totalPages > 1 && (
        <View style={styles.paginationBar}>
          <Text style={styles.paginationInfoText}>
            Trang {currentPage} / {totalPages} ({filteredPitches.length} cụm sân)
          </Text>
          <View style={styles.wrapRow}>
            <TouchableOpacity
              disabled={currentPage === 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={[styles.pageBtn, currentPage === 1 && { opacity: 0.45 }]}
            >
              <Text style={styles.pageBtnText}>← Trước</Text>
            </TouchableOpacity>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <TouchableOpacity
                key={page}
                onPress={() => setCurrentPage(page)}
                style={[styles.pageNumBtn, currentPage === page && styles.pageNumBtnActive]}
              >
                <Text
                  style={[
                    styles.pageNumBtnText,
                    currentPage === page && { color: COLORS.white },
                  ]}
                >
                  {page}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              disabled={currentPage === totalPages}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={[styles.pageBtn, currentPage === totalPages && { opacity: 0.45 }]}
            >
              <Text style={styles.pageBtnText}>Sau →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    gap: 16,
    paddingTop: 12,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  toastBanner: {
    backgroundColor: COLORS.emerald,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastBannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  // Landing Hero Box
  landingHeroBox: {
    backgroundColor: '#064e3b',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  landingBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  landingBadgeText: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '700',
  },
  landingTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 30,
  },
  landingDesc: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
  },
  landingPrimaryBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  landingPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  landingSecondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
  },
  landingSecondaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  landingStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  landingStatCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  landingStatVal: {
    color: '#34d399',
    fontSize: 20,
    fontWeight: '900',
  },
  landingStatLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  landingStatSub: {
    color: '#94a3b8',
    fontSize: 13,
  },

  // PitchSearch Header & Filter Box
  pitchSearchHeaderBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  pitchSearchTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pitchSearchTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  pitchSearchSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  displayCountPill: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  displayCountPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  toggleHeroBtn: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toggleHeroBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  searchFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMuted,
    paddingHorizontal: 6,
  },
  mobileFilterToggleBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mobileFilterToggleBtnActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emeraldLight,
  },
  mobileFilterToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  advancedFiltersContainer: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  filterCategoryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  filterSelectPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  filterSelectPillActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  filterSelectPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterSelectPillTextActive: {
    color: COLORS.white,
  },
  sportTabsBottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  webSportTab: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  webSportTabActive: {
    backgroundColor: COLORS.emerald,
  },
  webSportTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  webSportTabTextActive: {
    color: COLORS.white,
  },
  tonightCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tonightCheckboxLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  clearFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.roseSoft,
  },
  clearFiltersBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.rose,
  },

  // Split-Card Pitch Grid (Matches PitchSearch.tsx)
  pitchGridWrap: {
    gap: 14,
  },
  webPitchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  webPitchImageWrap: {
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  webPitchImage: {
    width: '100%',
    height: '100%',
  },
  webSportBadgeOnImg: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  webSportBadgeOnImgText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  webImgBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webImgBottomDistrict: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  webImgBottomHours: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  webPitchContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    gap: 8,
  },
  webPitchTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  webPitchName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  webRatingPill: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  webRatingPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.amber,
  },
  webPitchAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  webPitchPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  webAmenityPill: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  webAmenityPillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  webAmenityMorePill: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  webAmenityMoreText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  webSlotsPreviewBlock: {
    paddingTop: 6,
    gap: 6,
  },
  webSlotsPreviewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  webPreviewSlotChip: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  webPreviewSlotChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  webPitchFooter: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  webPriceCaption: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  webPriceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  webPriceUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  webSelectSlotBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  webSelectSlotBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  // Pagination
  paginationBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  paginationInfoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pageBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  pageNumBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumBtnActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  pageNumBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  // PitchDetail View Styles
  breadcrumbBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  backToListBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backToListBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  breadcrumbPath: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  breadcrumbActionBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  breadcrumbActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  detailVenueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailVenueInner: {
    gap: 14,
  },
  detailVenueImg: {
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  detailVenueInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  emeraldTag: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emeraldTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  slateTag: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slateTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  amberRatingTag: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amberRatingTagText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.amber,
  },
  detailVenueName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  detailVenueAddr: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  venueMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  venueMetaCell: {
    minWidth: 120,
    gap: 2,
  },
  venueMetaLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  venueMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Matrix & Sidebar Columns
  detailColumnsWrap: {
    gap: 16,
  },
  matrixCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  matrixTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  matrixSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dayButton: {
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  dayButtonName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  dayButtonDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  weatherBar: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  weatherBarEmerald: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emeraldLight,
  },
  weatherBarAmber: {
    backgroundColor: COLORS.amberSoft,
    borderColor: COLORS.amberLight,
  },
  weatherConditionText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  weatherTipLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  weatherTipPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  weatherTipPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  subCourtFilterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  subCourtTab: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
  },
  subCourtTabActive: {
    backgroundColor: COLORS.text,
  },
  subCourtTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  subCourtTabTextActive: {
    color: COLORS.white,
  },
  peakNoticeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.amber,
  },
  subCourtCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  subCourtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  subCourtName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  subCourtTypeBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subCourtTypeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subCourtAvailText: {
    fontSize: 13,
    fontWeight: '700',
  },
  slotButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  matrixSlotBtn: {
    minWidth: 135,
    flex: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    position: 'relative',
    gap: 4,
  },
  matrixSlotBtnEmpty: {
    backgroundColor: COLORS.surface,
    borderColor: '#a7f3d0',
  },
  matrixSlotBtnSelected: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emeraldDark,
  },
  matrixSlotBtnPending: {
    backgroundColor: COLORS.amberSoft,
    borderColor: COLORS.amberLight,
  },
  matrixSlotBtnBooked: {
    backgroundColor: '#f1f5f9',
    borderColor: COLORS.border,
    opacity: 0.65,
  },
  peakDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.amber,
  },
  matrixSlotTime: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  matrixSlotBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixSlotPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  matrixSlotStatus: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  pendingInfoCard: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  pendingBadge: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  pendingSlotTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  pendingSlotDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  waitlistInlineBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  waitlistInlineBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  closePendingBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  closePendingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Right Ticket Sidebar Card
  ticketSidebarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  ticketHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  ticketHeaderSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resetTicketText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.rose,
  },
  ticketSummaryBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  ticketSummaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  ticketSummaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  fieldSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  slotCountBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  emptySelectedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: COLORS.bg,
  },
  emptySelectedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  selectedSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedSlotCourt: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  selectedSlotTime: {
    fontSize: 13,
    color: COLORS.emeraldDark,
    fontWeight: '600',
  },
  selectedSlotPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  removeSlotBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeSlotBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.rose,
  },
  entityTabBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  entityTabBtnActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emerald,
  },
  entityTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  entityTabBtnTextActive: {
    color: COLORS.emeraldDark,
    fontWeight: '800',
  },
  clubBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
  },
  checkboxTick: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  checkboxSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  addonItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addonItemCardActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emeraldLight,
  },
  addonName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  addonDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  addonPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  depositOptionCard: {
    flex: 1,
    minWidth: 130,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  depositOptionCardActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emerald,
  },
  depositOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  depositOptionSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  costBreakdownBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  costLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  costValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  costTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  costTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  costDueLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  costDueValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  splitterBar: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  splitterLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  splitterStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitterStepText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  splitterCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  splitterResultText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  proceedBookBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  proceedBookBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  inlinePaymentConfirmBox: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  inlinePaymentTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  inlinePaymentSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bankInfoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  bankInfoText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  backStepBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // E-Ticket Styles
  eTicketHeader: {
    backgroundColor: COLORS.emerald,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  eTicketHeaderBadge: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '800',
  },
  eTicketCode: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eTicketVenueName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  eTicketVenueAddr: {
    color: '#ecfdf5',
    fontSize: 13,
  },
  zaloInviteBox: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  zaloInviteTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  zaloSplitTag: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  zaloMessagePreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  copyZaloBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  copyZaloBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  // Loading & Error
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: COLORS.roseSoft,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.rose,
    fontWeight: '700',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  emptySearchBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySearchSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resetFiltersPrimaryBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFiltersPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
