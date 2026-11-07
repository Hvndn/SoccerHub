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
import { Feather } from '@expo/vector-icons';
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

  // Guest Landing Toggle (Matches Web page.tsx: Guest sees LandingHero + LandingFeatures + PitchSearch; Logged-in player can also toggle it)
  const [showGuestLanding, setShowGuestLanding] = useState<boolean>(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<
    'BOOKING' | 'TOURNAMENT' | 'MATCHMAKING'
  >('BOOKING');

  // Inline dropdown selectors for the 4-column filter bar (NO MODAL)
  const [openFilterMenu, setOpenFilterMenu] = useState<
    null | 'DISTRICT' | 'TIMESLOT' | 'BUDGET'
  >(null);

  // ============================================================
  // 1. PITCH SEARCH FILTER STATES (100% Parity with PitchSearch.tsx)
  // ============================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState('ALL');
  const [selectedTimeSlotFilter, setSelectedTimeSlotFilter] = useState('ALL');
  const [maxBudget, setMaxBudget] = useState<number>(800000);
  const [onlyAvailableTonight, setOnlyAvailableTonight] = useState<boolean>(false);
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
  }, [
    searchQuery,
    selectedSport,
    selectedDistrict,
    selectedTimeSlotFilter,
    maxBudget,
    onlyAvailableTonight,
  ]);

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
    setOpenFilterMenu(null);
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
      turfStatus: 'Hệ thống đèn & thoát nước hoạt động 100%',
      packingTips: ['Giày đinh TF', 'Áo bib chia đội', 'Bình nước cá nhân'],
      tone: 'sky' as const,
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
      showToast('✓ Đặt sân thành công! Phiếu giữ chỗ điện tử đã sẵn sàng.');
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

        {/* 1. TOP BREADCRUMB BAR (Matches PitchDetail.tsx lines 417-460) */}
        <View style={styles.breadcrumbBar}>
          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() => setSelectedPitchForSlot(null)}
              style={styles.backToListBtn}
              activeOpacity={0.8}
            >
              <Feather name="arrow-left" size={15} color={COLORS.textSecondary} />
              <Text style={styles.backToListBtnText}>Danh sách sân</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbPath} numberOfLines={1}>
              Đặt sân {'>'} <Text style={{ color: COLORS.text, fontWeight: '700' }}>{pitch.name}</Text>
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
              <Feather name="share-2" size={14} color={COLORS.textSecondary} />
              <Text style={styles.breadcrumbActionText}>
                {shareCopied ? 'Đã lưu link' : 'Chia sẻ'}
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
              <Feather name="navigation" size={14} color={COLORS.primary} />
              <Text style={styles.breadcrumbActionText}>Bản đồ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. VENUE SUMMARY CARD (Matches PitchDetail.tsx lines 463-522) */}
        <View style={styles.detailVenueCard}>
          <View style={[styles.detailVenueInner, layout.isTablet && { flexDirection: 'row' }]}>
            <Image
              source={{ uri: pitch.imageUrl }}
              style={[
                styles.detailVenueImg,
                layout.isTablet ? { width: 256, height: 176 } : { width: '100%', height: 176 },
              ]}
              contentFit="cover"
            />
            <View style={styles.detailVenueInfo}>
              <View style={styles.wrapRow}>
                <View style={styles.skyTag}>
                  <Text style={styles.skyTagText}>Sân cỏ nhân tạo</Text>
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
              <View style={styles.wrapRow}>
                <Feather name="map-pin" size={14} color={COLORS.primary} />
                <Text style={styles.detailVenueAddr}>{pitch.address}</Text>
              </View>

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
                    {(pitch.amenities || ['Giữ xe', 'Wifi', 'Nước uống', 'Đèn LED']).join(', ')}
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
                <View style={styles.wrapRow}>
                  <Feather name="calendar" size={18} color={COLORS.primary} />
                  <Text style={styles.matrixTitle}>Chọn Ngày & Khung Giờ Đặt Sân</Text>
                </View>
                <Text style={styles.matrixSubtitle}>
                  Bấm vào ô giờ còn trống để chọn (có thể chọn gộp nhiều ca)
                </Text>
              </View>

              {/* Status Legend (Matches PitchDetail.tsx lines 538-555) */}
              <View style={styles.legendWrap}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: '#94a3b8', backgroundColor: '#fff' }]} />
                  <Text style={styles.legendText}>Còn trống</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: COLORS.primary, backgroundColor: COLORS.primary }]} />
                  <Text style={styles.legendText}>Đang chọn</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: '#fbbf24', backgroundColor: '#fffbeb' }]} />
                  <Text style={styles.legendText}>Chờ khóa ca</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBox, { borderColor: COLORS.border, backgroundColor: '#e2e8f0' }]} />
                  <Text style={styles.legendText}>Đã đặt</Text>
                </View>
              </View>
            </View>

            {/* 7-Day Date Selector (Matches PitchDetail.tsx lines 559-586) */}
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
                    <Text style={[styles.dayButtonDate, active && { color: '#e0f2fe' }]}>
                      {d.dateStr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Weather & Turf Status Bar (Matches PitchDetail.tsx lines 589-612) */}
            <View
              style={[
                styles.weatherBar,
                weather.tone === 'amber' ? styles.weatherBarAmber : styles.weatherBarSky,
              ]}
            >
              <View style={styles.wrapRow}>
                <View style={styles.weatherTempPill}>
                  <Text style={styles.weatherTempPillText}>
                    {weather.tone === 'amber' ? '🌤️' : '🌙'} {weather.temp}
                  </Text>
                </View>
                <Text style={styles.weatherConditionText}>{weather.condition}</Text>
                <Text style={styles.weatherTurfStatusText}>• {weather.turfStatus}</Text>
              </View>
              <View style={styles.wrapRow}>
                <Text style={styles.weatherTipLabel}>Gợi ý mang theo:</Text>
                {weather.packingTips.map((tip, idx) => (
                  <View key={idx} style={styles.weatherTipPill}>
                    <Text style={styles.weatherTipPillText}>{tip}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sub-court filter (Matches PitchDetail.tsx lines 614-639) */}
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
              <Text style={styles.peakNoticeText}>Khung 17:00 - 20:00 là giờ cao điểm</Text>
            </View>

            {/* Courts & Slots Matrix (Matches PitchDetail.tsx lines 642-732) */}
            {matrixLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải bảng giờ trống các sân con...</Text>
              </View>
            ) : (
              <View style={{ gap: 14 }}>
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
                            emptyCount > 0 ? { color: COLORS.primary } : { color: COLORS.textMuted },
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
                                    isEmpty && !isSelected && { color: COLORS.primary },
                                    isPending && { color: COLORS.amber },
                                  ]}
                                >
                                  {isEmpty || isSelected
                                    ? `${priceLabel}${isPeak ? ' (Cao điểm)' : ''}`
                                    : isPending
                                    ? 'Chờ khóa ca'
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
                              `✓ Đã đăng ký hàng chờ ca ${pendingSlotInfo.time} (${pendingSlotInfo.pitchName})!`
                            );
                          }
                        }}
                        style={[
                          styles.waitlistInlineBtn,
                          isRegistered && { backgroundColor: COLORS.primary },
                        ]}
                      >
                        <Text style={styles.waitlistInlineBtnText}>
                          {isRegistered ? '✓ Đã Đăng Ký Hàng Chờ' : 'Đăng Ký Hàng Chờ Ca Này'}
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
                    <Text style={styles.ticketHeaderTitle}>Phiếu Đặt Sân</Text>
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
                    <Text style={[styles.ticketSummaryVal, { color: COLORS.primary }]}>
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
                        Hãy bấm chọn một hoặc nhiều khung giờ còn trống ở bảng bên cạnh để bắt đầu đặt sân
                      </Text>
                    </View>
                  ) : (
                    selectedSlots.map((s) => (
                      <View key={s.key} style={styles.selectedSlotRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.selectedSlotCourt}>{s.pitchName}</Text>
                          <Text style={styles.selectedSlotTime}>Ca {s.time}</Text>
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
                        Cá nhân
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
                        Đại diện CLB
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
                          depositOption === '50' && { color: COLORS.primary },
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
                          depositOption === '100' && { color: COLORS.primary },
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
                        <Text style={styles.splitterLabel}>Chia cho:</Text>
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
                      Xác nhận thanh toán cọc giữ sân ({amountDueNow.toLocaleString('vi-VN')}đ)
                    </Text>
                    <Text style={styles.inlinePaymentSub}>
                      Chuyển khoản VietQR hoặc xác nhận giữ chỗ trực tiếp với chủ sân:
                    </Text>
                    <View style={styles.bankInfoBox}>
                      <Text style={styles.bankInfoText}>Ngân hàng: MB Bank • STK: 0905123456</Text>
                      <Text style={styles.bankInfoText}>
                        Nội dung: TURFZONE {pitch.id} {customerPhone}
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
                  <Text style={styles.eTicketVenueAddr}>{pitch.address}</Text>
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
                    <Text style={[styles.costValue, { color: COLORS.primary }]}>
                      {summarySlotsText}
                    </Text>
                  </View>
                  <View style={styles.ticketSummaryRow}>
                    <Text style={styles.costLabel}>Đã thanh toán ({depositOption}%):</Text>
                    <Text style={[styles.costValue, { color: COLORS.primary }]}>
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
                    <Text style={styles.zaloInviteTitle}>Kêu gọi anh em & chia tiền</Text>
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
                        : 'Sao Chép Lời Nhắn Gửi Nhóm Zalo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.wrapRow}>
                  <TouchableOpacity
                    onPress={() => onNavigateTab('my-activities')}
                    style={[styles.proceedBookBtn, { flex: 1 }]}
                  >
                    <Text style={styles.proceedBookBtnText}>
                      Mở Lịch Trình & Điểm Danh Quân Số
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
  // VIEW B: PITCH SEARCH LIST VIEW + LANDING HERO (100% Parity with LandingHero.tsx, LandingFeatures.tsx & PitchSearch.tsx)
  // ============================================================
  const selectedDistrictLabel =
    districtList.find((d) => d.id === selectedDistrict)?.name || 'Toàn TP. Đà Nẵng';
  const selectedTimeSlotLabel =
    timeSlotFilters.find((t) => t.id === selectedTimeSlotFilter)?.name || 'Tất cả khung giờ';
  const selectedBudgetLabel =
    budgetOptions.find((b) => b.value === maxBudget)?.label || 'Mọi mức giá';

  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {inlineToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{inlineToast}</Text>
        </View>
      )}

      {/* ============================================================ */}
      {/* LANDING HERO & LANDING FEATURES (100% Parity with LandingHero.tsx & LandingFeatures.tsx) */}
      {/* ============================================================ */}
      {(isGuest || showGuestLanding) && (
        <View style={{ gap: 16 }}>
          {/* 1. LIVE TICKER BAR (Matches LandingHero.tsx lines 82-112) */}
          <View style={styles.liveTickerCard}>
            <View style={styles.liveTickerBadge}>
              <View style={styles.emeraldDot} />
              <Text style={styles.liveTickerBadgeText}>Trực tiếp sân cỏ</Text>
            </View>
            <View style={[styles.wrapRow, { flex: 1 }]}>
              <Text style={styles.liveTickerItem} numberOfLines={1}>
                <Text style={{ fontWeight: '700', color: COLORS.emeraldDark }}>[Sân trống]</Text>{' '}
                Sân 7B Cụm Sân Bóng Đá Đại Nắng (Hải Châu) vừa mở trống ca 18:00 - 20:00
              </Text>
              {layout.isDesktop && (
                <Text style={styles.liveTickerItem} numberOfLines={1}>
                  • <Text style={{ fontWeight: '700', color: COLORS.primary }}>[Giải đấu]</Text>{' '}
                  Giải Bóng Đá Mùa Hè Đà Nẵng (Sân 7) còn 2 suất đăng ký cuối
                </Text>
              )}
            </View>
          </View>

          {/* 2. FLAT WHITE HERO CARD (Matches LandingHero.tsx lines 115-373) */}
          <View style={styles.webHeroWhiteCard}>
            <View
              style={[
                styles.webHeroGrid,
                layout.isDesktop && { flexDirection: 'row', alignItems: 'center' },
              ]}
            >
              {/* Left Column (7/12): Value Proposition & CTAs */}
              <View style={[styles.webHeroLeftCol, layout.isDesktop && { flex: 7 }]}>
                <View style={styles.webHeroSkyBadge}>
                  <View style={[styles.emeraldDot, { backgroundColor: COLORS.primary }]} />
                  <Text style={styles.webHeroSkyBadgeText}>
                    Trung tâm đặt sân & giải đấu bóng đá Đà Nẵng
                  </Text>
                </View>

                <Text
                  style={[
                    styles.webHeroH1,
                    layout.isTablet && { fontSize: 30, lineHeight: 38 },
                  ]}
                >
                  Chạm Để Giữ Sân Cỏ,{' '}
                  <Text style={{ color: COLORS.primary }}>Bùng Nổ Mọi Trận Cầu</Text> Tại Đà Nẵng
                </Text>

                <Text style={styles.webHeroDesc}>
                  Tra cứu lịch trống thời gian thực tại các cụm sân cỏ nhân tạo 5, 7, 11 người khắp Hải Châu, Liên Chiểu, Cẩm Lệ, Sơn Trà. Giữ sân tự động trong 30 giây, cáp kèo giao hữu và theo dõi bảng điểm giải đấu trực tuyến.
                </Text>

                {/* Primary & Secondary CTA Buttons */}
                <View style={styles.wrapRow}>
                  <TouchableOpacity
                    onPress={() => setShowGuestLanding(false)}
                    style={styles.webHeroPrimaryBtn}
                  >
                    <Text style={styles.webHeroPrimaryBtnText}>Đặt Sân Ngay</Text>
                    <Feather name="arrow-right" size={16} color={COLORS.white} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onNavigateTab('tournaments')}
                    style={styles.webHeroOutlineBtn}
                  >
                    <Feather name="award" size={16} color={COLORS.amber} />
                    <Text style={styles.webHeroOutlineBtnText}>Đấu Trường Giải Đấu</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onNavigateTab('admin')}
                    style={styles.webHeroOwnerBtn}
                  >
                    <Feather name="shield" size={15} color={COLORS.primary} />
                    <Text style={styles.webHeroOwnerBtnText}>Dành Cho Chủ Sân</Text>
                  </TouchableOpacity>
                </View>

                {/* Trust Badges */}
                <View style={styles.webHeroTrustRow}>
                  <View style={styles.trustItem}>
                    <Feather name="check-circle" size={15} color={COLORS.emerald} />
                    <Text style={styles.trustItemText}>Giữ ca tự động 24/7</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Feather name="zap" size={15} color={COLORS.primary} />
                    <Text style={styles.trustItemText}>Đặt cọc VietQR an toàn</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Feather name="award" size={15} color={COLORS.amber} />
                    <Text style={styles.trustItemText}>Lịch đấu & bảng điểm thời gian thực</Text>
                  </View>
                </View>
              </View>

              {/* Right Column (5/12): Interactive 3-Mode Live Showcase Card */}
              <View style={[styles.webShowcaseCol, layout.isDesktop && { flex: 5 }]}>
                {/* 3 Mode Switcher Tabs */}
                <View style={styles.showcaseTabBar}>
                  {[
                    { id: 'BOOKING' as const, label: 'Lịch ca trống' },
                    { id: 'TOURNAMENT' as const, label: 'Nhánh giải đấu' },
                    { id: 'MATCHMAKING' as const, label: 'Sàn cáp kèo' },
                  ].map((tab) => {
                    const active = activeShowcaseTab === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveShowcaseTab(tab.id)}
                        style={[
                          styles.showcaseTabBtn,
                          active && styles.showcaseTabBtnActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.showcaseTabBtnText,
                            active && styles.showcaseTabBtnTextActive,
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Showcase Card Body */}
                <View style={styles.showcaseCardBody}>
                  {activeShowcaseTab === 'BOOKING' && (
                    <View style={{ gap: 12 }}>
                      <View style={styles.ticketSummaryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.showcaseTitle}>Cụm Sân Bóng Đá Đại Nắng</Text>
                          <Text style={styles.showcaseSub}>
                            Hải Châu, Đà Nẵng • Sân 5 / Sân 7 / Sân 11
                          </Text>
                        </View>
                        <View style={styles.emeraldAvailableBadge}>
                          <Text style={styles.emeraldAvailableBadgeText}>Còn 3 ca trống</Text>
                        </View>
                      </View>

                      <View style={styles.showcaseSlotsGrid}>
                        {[
                          { time: '16:00 - 18:00', court: 'Sân 5A', price: '400.000đ', available: true },
                          { time: '18:00 - 20:00', court: 'Sân 7A', price: '560.000đ', available: true },
                          { time: '20:00 - 22:00', court: 'Sân 7B', price: '520.000đ', available: true },
                          { time: '22:00 - 23:30', court: 'Sân 5B', price: '320.000đ', available: false },
                        ].map((s, idx) => (
                          <TouchableOpacity
                            key={idx}
                            disabled={!s.available}
                            onPress={() => {
                              if (pitches[0]) handleOpenPitchDetail(pitches[0], s.time);
                            }}
                            style={[
                              styles.showcaseSlotItem,
                              !s.available && { opacity: 0.55, backgroundColor: COLORS.bg },
                            ]}
                          >
                            <View style={styles.ticketSummaryRow}>
                              <Text style={styles.showcaseSlotCourt}>{s.court}</Text>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: '700',
                                  color: s.available ? COLORS.emeraldDark : COLORS.textMuted,
                                }}
                              >
                                {s.available ? 'Trống' : 'Đã kín'}
                              </Text>
                            </View>
                            <Text style={styles.showcaseSlotTime}>{s.time}</Text>
                            <Text style={styles.showcaseSlotPrice}>{s.price}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={styles.showcaseFooterRow}>
                        <Text style={styles.showcaseFooterLeft}>
                          Giá từ:{' '}
                          <Text style={{ fontWeight: '800', color: COLORS.text }}>
                            200.000đ - 560.000đ
                          </Text>{' '}
                          / ca
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (pitches[0]) handleOpenPitchDetail(pitches[0]);
                          }}
                        >
                          <Text style={styles.showcaseFooterAction}>Chọn ca ngay →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {activeShowcaseTab === 'TOURNAMENT' && (
                    <View style={{ gap: 10 }}>
                      <Text style={styles.showcaseTitle}>Giải Bóng Đá Mùa Hè Đà Nẵng 2026</Text>
                      <Text style={styles.showcaseSub}>
                        Đang thi đấu • Sân 7 người • Tổng thưởng 15.000.000đ
                      </Text>
                      <View style={styles.showcaseMatchBox}>
                        <View style={styles.ticketSummaryRow}>
                          <Text style={styles.showcaseSub}>Vòng bảng • Bảng A</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.rose }}>
                            Phút 42&apos;
                          </Text>
                        </View>
                        <View style={styles.ticketSummaryRow}>
                          <Text style={styles.showcaseTeamName}>FC Hải Châu United</Text>
                          <View style={styles.showcaseScoreBadge}>
                            <Text style={styles.showcaseScoreText}>2 - 1</Text>
                          </View>
                          <Text style={styles.showcaseTeamName}>Đà Nẵng Citi FC</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => onNavigateTab('tournaments')}
                        style={styles.showcaseFullBtn}
                      >
                        <Text style={styles.showcaseFullBtnText}>
                          Xem bảng xếp hạng & lịch thi đấu →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {activeShowcaseTab === 'MATCHMAKING' && (
                    <View style={{ gap: 10 }}>
                      <View style={styles.ticketSummaryRow}>
                        <Text style={styles.showcaseTitle}>Sàn Cáp Kèo & Tuyển Quân Đà Nẵng</Text>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.amber }}>
                          18 kèo tối nay
                        </Text>
                      </View>
                      {[
                        {
                          team: 'FC Anh Em Liên Chiểu',
                          type: 'Tìm đối 50/50',
                          info: 'Sân 7 • 19:00 tối nay • Đã đặt sân',
                        },
                        {
                          team: 'Sơn Trà United',
                          type: 'Tuyển 2 vị trí',
                          info: 'Cần 1 Thủ môn, 1 Hậu vệ • 20:00 tối nay',
                        },
                      ].map((k, idx) => (
                        <View key={idx} style={styles.showcaseMatchBox}>
                          <View style={styles.ticketSummaryRow}>
                            <Text style={styles.showcaseTeamName}>{k.team}</Text>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>
                              {k.type}
                            </Text>
                          </View>
                          <Text style={styles.showcaseSub}>{k.info}</Text>
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={() => onNavigateTab('matchmaking')}
                        style={styles.showcaseFullBtn}
                      >
                        <Text style={styles.showcaseFullBtnText}>
                          Vào Chợ Kèo Bắt Đối Ngay →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* 3. KPI COUNTER BAR (Matches LandingHero.tsx lines 458-484) */}
          <View style={styles.kpiGridRow}>
            {[
              { value: '8+', label: 'Cụm sân hoạt động', sub: 'Khắp các quận Đà Nẵng', color: COLORS.primary },
              { value: '12+', label: 'Giải đấu phong trào', sub: 'Cập nhật tỉ số trực tiếp', color: COLORS.amber },
              { value: '350+', label: 'Trận đấu hoàn tất', sub: 'Đặt lịch tự động 100%', color: COLORS.emeraldDark },
              { value: '24/7', label: 'Kèo giao hữu đang mở', sub: 'Bắt đối nhanh trong 5 phút', color: COLORS.text },
            ].map((stat, idx) => (
              <View key={idx} style={styles.kpiStatCard}>
                <Text style={[styles.kpiStatValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.kpiStatLabel}>{stat.label}</Text>
                <Text style={styles.kpiStatSub}>{stat.sub}</Text>
              </View>
            ))}
          </View>

          {/* 4. LANDING FEATURES: 3-STEP WORKFLOW & 4 PILLARS (Matches LandingFeatures.tsx) */}
          <View style={styles.webHeroWhiteCard}>
            <View style={styles.ticketSummaryRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureSectionEyebrow}>Hướng dẫn nhanh</Text>
                <Text style={styles.featureSectionTitle}>
                  Quy Trình Đặt Sân 3 Bước Đơn Giản
                </Text>
              </View>
              <Text style={styles.showcaseSub}>
                Không cần gọi điện hỏi từng sân — hoàn tất giữ chỗ trong 30 giây.
              </Text>
            </View>

            <View style={styles.stepsGridRow}>
              {[
                {
                  step: '01',
                  title: 'Chọn Cụm Sân & Khung Giờ',
                  desc: 'Lọc nhanh sân 5, sân 7, sân 11 theo quận (Hải Châu, Liên Chiểu, Cẩm Lệ, Sơn Trà) và xem lịch ca trống thực tế.',
                },
                {
                  step: '02',
                  title: 'Đặt Cọc Giữ Sân Tự Động',
                  desc: 'Chọn đặt cọc 50% hoặc thanh toán 100% qua mã QR ngân hàng. Hệ thống tự động khóa ca ngay lập tức.',
                },
                {
                  step: '03',
                  title: 'Nhận Vé QR & Ra Sân Thi Đấu',
                  desc: 'Nhận phiếu đặt sân điện tử kèm công cụ chia tiền sân tự động để gửi ngay vào nhóm Zalo đội bóng.',
                },
              ].map((item) => (
                <View key={item.step} style={styles.stepFeatureCard}>
                  <View style={styles.wrapRow}>
                    <View style={styles.stepNumBadge}>
                      <Text style={styles.stepNumBadgeText}>{item.step}</Text>
                    </View>
                    <Text style={styles.stepCardTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.stepCardDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ============================================================ */}
      {/* 1. COMPACT HEADER & FILTER BAR (Matches PitchSearch.tsx lines 187-320 100%) */}
      {/* ============================================================ */}
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
                Hiển thị{' '}
                <Text style={{ color: COLORS.primary, fontWeight: '700' }}>
                  {filteredPitches.length}
                </Text>{' '}
                cụm sân
              </Text>
            </View>
            {!isGuest && (
              <TouchableOpacity
                onPress={() => setShowGuestLanding(!showGuestLanding)}
                style={styles.toggleHeroBtn}
              >
                <Text style={styles.toggleHeroBtnText}>
                  {showGuestLanding ? 'Ẩn trang giới thiệu' : 'Xem trang giới thiệu'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Row 1: 4 Inline Controls (Search + District + TimeSlot + Budget) matching PitchSearch.tsx lines 202-277 */}
        <View style={styles.searchFilterGridRow}>
          {/* 1. Search Input */}
          <View style={[styles.searchInputWrap, { flex: 1.5, minWidth: 210 }]}>
            <Feather name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm tên sân hoặc tên đường, quận..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={15} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* 2. District Select Box */}
          <TouchableOpacity
            onPress={() =>
              setOpenFilterMenu(openFilterMenu === 'DISTRICT' ? null : 'DISTRICT')
            }
            style={[
              styles.selectBoxControl,
              openFilterMenu === 'DISTRICT' && styles.selectBoxControlActive,
            ]}
          >
            <View style={styles.wrapRow}>
              <Feather name="map-pin" size={14} color={COLORS.primary} />
              <Text style={styles.selectBoxControlText} numberOfLines={1}>
                {selectedDistrictLabel}
              </Text>
            </View>
            <Feather name="chevron-down" size={15} color="#64748b" />
          </TouchableOpacity>

          {/* 3. Time Slot Select Box */}
          <TouchableOpacity
            onPress={() =>
              setOpenFilterMenu(openFilterMenu === 'TIMESLOT' ? null : 'TIMESLOT')
            }
            style={[
              styles.selectBoxControl,
              openFilterMenu === 'TIMESLOT' && styles.selectBoxControlActive,
            ]}
          >
            <View style={styles.wrapRow}>
              <Feather name="clock" size={14} color={COLORS.primary} />
              <Text style={styles.selectBoxControlText} numberOfLines={1}>
                {selectedTimeSlotLabel}
              </Text>
            </View>
            <Feather name="chevron-down" size={15} color="#64748b" />
          </TouchableOpacity>

          {/* 4. Max Budget Select Box */}
          <TouchableOpacity
            onPress={() =>
              setOpenFilterMenu(openFilterMenu === 'BUDGET' ? null : 'BUDGET')
            }
            style={[
              styles.selectBoxControl,
              openFilterMenu === 'BUDGET' && styles.selectBoxControlActive,
            ]}
          >
            <View style={styles.wrapRow}>
              <Feather name="tag" size={14} color={COLORS.primary} />
              <Text style={styles.selectBoxControlText} numberOfLines={1}>
                {selectedBudgetLabel}
              </Text>
            </View>
            <Feather name="chevron-down" size={15} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Inline Option Picker when one of the 3 select boxes is clicked (NO MODAL) */}
        {openFilterMenu && (
          <View style={styles.inlineDropdownOptionsPanel}>
            {openFilterMenu === 'DISTRICT' && (
              <View style={styles.wrapRow}>
                {districtList.map((d) => {
                  const active = selectedDistrict === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => {
                        setSelectedDistrict(d.id);
                        setOpenFilterMenu(null);
                      }}
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
            )}

            {openFilterMenu === 'TIMESLOT' && (
              <View style={styles.wrapRow}>
                {timeSlotFilters.map((tf) => {
                  const active = selectedTimeSlotFilter === tf.id;
                  return (
                    <TouchableOpacity
                      key={tf.id}
                      onPress={() => {
                        setSelectedTimeSlotFilter(tf.id);
                        setOpenFilterMenu(null);
                      }}
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
            )}

            {openFilterMenu === 'BUDGET' && (
              <View style={styles.wrapRow}>
                {budgetOptions.map((b) => {
                  const active = maxBudget === b.value;
                  return (
                    <TouchableOpacity
                      key={b.value}
                      onPress={() => {
                        setMaxBudget(b.value);
                        setOpenFilterMenu(null);
                      }}
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
            )}
          </View>
        )}

        {/* Filter Row 2: Sport Tabs + Còn ca trống tối nay + Xóa bộ lọc (Matches PitchSearch.tsx lines 280-319) */}
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
          <ActivityIndicator size="large" color={COLORS.primary} />
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
                {/* Left / Top Image Block (Matches PitchSearch.tsx lines 331-351) */}
                <View
                  style={[
                    styles.webPitchImageWrap,
                    useHorizontalSplit ? { width: 220, minHeight: 220 } : { height: 185 },
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
                    <View style={[styles.wrapRow, { gap: 4, flex: 1 }]}>
                      <Feather name="map-pin" size={12} color="#38bdf8" />
                      <Text style={styles.webImgBottomDistrict} numberOfLines={1}>
                        {pitch.districtName || pitch.area}
                      </Text>
                    </View>
                    <Text style={styles.webImgBottomHours}>
                      {pitch.openTime} - {pitch.closeTime}
                    </Text>
                  </View>
                </View>

                {/* Right / Bottom Content Block (Matches PitchSearch.tsx lines 354-420) */}
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
                  <View style={[styles.wrapRow, { gap: 5 }]}>
                    <Feather name="map-pin" size={13} color="#64748b" />
                    <Text style={styles.webPitchAddress} numberOfLines={1}>
                      {pitch.address}
                    </Text>
                  </View>

                  {/* Phone */}
                  {pitch.phone ? (
                    <View style={[styles.wrapRow, { gap: 5 }]}>
                      <Feather name="phone-call" size={13} color={COLORS.primary} />
                      <Text style={styles.webPitchPhone}>Liên hệ: {pitch.phone}</Text>
                    </View>
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
                      Ca sân trong ngày ({pitch.slotDurationMinutes || 120} phút/ca):
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

                  {/* Footer: Price & CTA (Matches PitchSearch.tsx lines 404-419) */}
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
                      <Text style={styles.webSelectSlotBtnText}>Chọn Ca Đặt Sân</Text>
                      <Feather name="chevron-right" size={15} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 3. PAGINATION BAR (Matches PitchSearch.tsx lines 426-462) */}
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
    maxWidth: 1440,
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
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastBannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },

  // ============================================================
  // LANDING HERO & FEATURES STYLES (Matches LandingHero.tsx & LandingFeatures.tsx)
  // ============================================================
  liveTickerCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  liveTickerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emeraldDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
  },
  liveTickerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  liveTickerItem: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  webHeroWhiteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 20,
    gap: 16,
  },
  webHeroGrid: {
    gap: 20,
  },
  webHeroLeftCol: {
    gap: 14,
  },
  webHeroSkyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  webHeroSkyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  webHeroH1: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 32,
  },
  webHeroDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  webHeroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
  },
  webHeroPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  webHeroOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
  },
  webHeroOutlineBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  webHeroOwnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  webHeroOwnerBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  webHeroTrustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  webShowcaseCol: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    gap: 12,
  },
  showcaseTabBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 3,
    gap: 4,
  },
  showcaseTabBtn: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  showcaseTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  showcaseTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  showcaseTabBtnTextActive: {
    color: COLORS.white,
  },
  showcaseCardBody: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
  },
  showcaseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  showcaseSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emeraldAvailableBadge: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emeraldAvailableBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  showcaseSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  showcaseSlotItem: {
    flex: 1,
    minWidth: 125,
    backgroundColor: 'rgba(236, 253, 245, 0.5)',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 10,
    gap: 2,
  },
  showcaseSlotCourt: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  showcaseSlotTime: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  showcaseSlotPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  showcaseFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  showcaseFooterLeft: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  showcaseFooterAction: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  showcaseMatchBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 10,
    gap: 4,
  },
  showcaseTeamName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  showcaseScoreBadge: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  showcaseScoreText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  showcaseFullBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  showcaseFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  kpiGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiStatCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    gap: 2,
  },
  kpiStatValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  kpiStatLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  kpiStatSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  featureSectionEyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  featureSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stepFeatureCard: {
    flex: 1,
    minWidth: 230,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 14,
    gap: 8,
  },
  stepNumBadge: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepNumBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  stepCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // ============================================================
  // PITCH SEARCH HEADER & FILTER BOX (Matches PitchSearch.tsx lines 187-320)
  // ============================================================
  pitchSearchHeaderBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
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
    fontWeight: '700',
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
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  displayCountPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  toggleHeroBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleHeroBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  searchFilterGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 11,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    paddingVertical: 7,
  },
  selectBoxControl: {
    flex: 1,
    minWidth: 170,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 11,
    minHeight: 40,
  },
  selectBoxControlActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  selectBoxControlText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  inlineDropdownOptionsPanel: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterSelectPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  filterSelectPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterSelectPillText: {
    fontSize: 13,
    fontWeight: '600',
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
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  webSportTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  webSportTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  webSportTabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  tonightCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tonightCheckboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  clearFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.roseSoft,
  },
  clearFiltersBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.rose,
  },

  // ============================================================
  // SPLIT-CARD PITCH GRID (Matches PitchSearch.tsx lines 323-423)
  // ============================================================
  pitchGridWrap: {
    gap: 16,
  },
  webPitchCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  webPitchImageWrap: {
    position: 'relative',
    backgroundColor: COLORS.surfaceMuted,
  },
  webPitchImage: {
    width: '100%',
    height: '100%',
  },
  webSportBadgeOnImg: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.80)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  webSportBadgeOnImgText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '500',
  },
  webImgBottomHours: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  webPitchContent: {
    flex: 1,
    padding: 16,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  webRatingPill: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webRatingPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  webPitchAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  webPitchPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  webAmenityPill: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webAmenityPillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  webAmenityMorePill: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  webAmenityMoreText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  webSlotsPreviewBlock: {
    paddingTop: 4,
    gap: 6,
  },
  webSlotsPreviewLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  webPreviewSlotChip: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  webPreviewSlotChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
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
    fontWeight: '700',
    color: COLORS.primary,
  },
  webPriceUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  webSelectSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 6,
  },
  webSelectSlotBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Pagination (Matches PitchSearch.tsx lines 426-462)
  paginationBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  paginationInfoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  pageBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pageBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  pageNumBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pageNumBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ============================================================
  // PITCH DETAIL VIEW STYLES (Matches PitchDetail.tsx 100%)
  // ============================================================
  breadcrumbBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backToListBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  breadcrumbPath: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  breadcrumbActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  breadcrumbActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  detailVenueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailVenueInner: {
    gap: 16,
  },
  detailVenueImg: {
    borderRadius: 6,
    backgroundColor: COLORS.surfaceMuted,
  },
  detailVenueInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
  },
  skyTag: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  skyTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  slateTag: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  slateTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  amberRatingTag: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
  },
  amberRatingTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  detailVenueName: {
    fontSize: 20,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Matrix & Sidebar Columns
  detailColumnsWrap: {
    gap: 16,
  },
  matrixCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  matrixTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  matrixSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  dayButton: {
    minWidth: 82,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayButtonName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayButtonDate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  weatherBar: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  weatherBarSky: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#bae6fd',
  },
  weatherBarAmber: {
    backgroundColor: COLORS.amberSoft,
    borderColor: '#fde68a',
  },
  weatherTempPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  weatherTempPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  weatherConditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  weatherTurfStatusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  weatherTipLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  weatherTipPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  weatherTipPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  subCourtFilterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  subCourtTab: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  subCourtTabActive: {
    backgroundColor: '#1e293b',
  },
  subCourtTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  subCourtTabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  peakNoticeText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  subCourtCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 14,
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  subCourtName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  subCourtTypeBadge: {
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subCourtTypeBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  subCourtAvailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  slotButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  matrixSlotBtn: {
    minWidth: 140,
    flex: 1,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    position: 'relative',
    gap: 4,
  },
  matrixSlotBtnEmpty: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  matrixSlotBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  matrixSlotBtnPending: {
    backgroundColor: COLORS.amberSoft,
    borderColor: '#fcd34d',
  },
  matrixSlotBtnBooked: {
    backgroundColor: COLORS.surfaceMuted,
    borderColor: COLORS.borderLight,
    opacity: 0.65,
  },
  matrixSlotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  matrixSlotBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixSlotPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingInfoCard: {
    backgroundColor: COLORS.amberSoft,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  pendingBadge: {
    backgroundColor: '#fde68a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  pendingSlotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  pendingSlotDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  waitlistInlineBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  waitlistInlineBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  closePendingBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closePendingBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Right Ticket Sidebar Card (Matches PitchDetail.tsx lines 781-1180)
  ticketSidebarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  ticketHeaderSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resetTicketText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.rose,
  },
  ticketSummaryBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  fieldSectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  slotCountBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptySelectedBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 6,
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
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedSlotCourt: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  selectedSlotTime: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedSlotPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  removeSlotBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeSlotBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.rose,
  },
  entityTabBtn: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  entityTabBtnActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  entityTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  entityTabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  clubBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
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
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxTick: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '700',
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
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  addonItemCardActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#bae6fd',
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
    fontWeight: '700',
    color: COLORS.primary,
  },
  depositOptionCard: {
    flex: 1,
    minWidth: 130,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  depositOptionCardActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  depositOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  depositOptionSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  costBreakdownBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 6,
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
    fontWeight: '700',
    color: COLORS.text,
  },
  costTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  costDueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  costDueValue: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
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
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitterStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  splitterCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  splitterResultText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  proceedBookBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  proceedBookBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  inlinePaymentConfirmBox: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  inlinePaymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inlinePaymentSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bankInfoBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  bankInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  backStepBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 6,
  },
  backStepBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // E-Ticket Styles
  eTicketHeader: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    padding: 14,
    gap: 4,
  },
  eTicketHeaderBadge: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '700',
  },
  eTicketCode: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eTicketVenueName: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
  },
  eTicketVenueAddr: {
    color: '#f0f9ff',
    fontSize: 13,
  },
  zaloInviteBox: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 6,
    padding: 12,
    gap: 8,
  },
  zaloInviteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  zaloSplitTag: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  zaloMessagePreview: {
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
  },
  copyZaloBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  copyZaloBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 36,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    backgroundColor: COLORS.roseSoft,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    fontSize: 13,
    color: COLORS.rose,
    flex: 1,
  },
  retryBtn: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emptySearchBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptySearchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySearchSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  resetFiltersPrimaryBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 6,
  },
  resetFiltersPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
