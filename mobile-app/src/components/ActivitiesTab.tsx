import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  COLORS,
  useResponsiveLayout,
  formatVnd,
  copyTextWithFeedback,
} from '../theme/responsive';
import {
  API_URL,
  AuthUser,
  BookingItem,
  AttendanceRecord,
  MatchmakingPostItem,
} from '../services/api';

interface ActivitiesTabProps {
  user: AuthUser | null;
  token: string | null;
  bookings: BookingItem[];
  onUpdateBookings: (updated: BookingItem[]) => void;
  onBroadcastSosSuccess: (newPost: MatchmakingPostItem) => void;
  onNavigateTab: (tab: 'booking' | 'tournaments' | 'community' | 'activities' | 'owner') => void;
}

const DEFAULT_ATTENDANCE: Record<number, AttendanceRecord[]> = {
  901: [
    { id: 1, bookingId: 901, playerName: 'Nguyễn Minh Quân (Đội trưởng)', status: 'GOING', position: 'Tiền vệ', extraGuests: 1 },
    { id: 2, bookingId: 901, playerName: 'Trần Hoàng Nam', status: 'GOING', position: 'Thủ môn', extraGuests: 0 },
    { id: 3, bookingId: 901, playerName: 'Lê Quốc Bảo', status: 'GOING', position: 'Hậu vệ', extraGuests: 0 },
    { id: 4, bookingId: 901, playerName: 'Phạm Tuấn Kiệt', status: 'GOING', position: 'Tiền đạo', extraGuests: 1 },
    { id: 5, bookingId: 901, playerName: 'Đỗ Hùng Dũng', status: 'MAYBE', position: 'Tiền vệ', extraGuests: 0, note: 'Đang kẹt họp tới 18h30' },
    { id: 6, bookingId: 901, playerName: 'Vũ Văn Thanh', status: 'ABSENT', position: 'Hậu vệ', extraGuests: 0, note: 'Đi công tác' },
  ],
};

export default function ActivitiesTab({
  user,
  token,
  bookings,
  onUpdateBookings,
  onBroadcastSosSuccess,
  onNavigateTab,
}: ActivitiesTabProps) {
  const layout = useResponsiveLayout();

  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const [countdownMinutes, setCountdownMinutes] = useState<number>(48);
  const [remindedIds, setRemindedIds] = useState<number[]>([]);

  // Inline Attendance State per booking
  const [openAttendanceId, setOpenAttendanceId] = useState<number | null>(
    bookings[0]?.id ?? null
  );
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceRecord[]>>(DEFAULT_ATTENDANCE);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [newMateName, setNewMateName] = useState('');
  const [newMatePhone, setNewMatePhone] = useState('');
  const [newMatePos, setNewMatePos] = useState('Đá mọi vị trí');
  const [newMateStatus, setNewMateStatus] = useState<'GOING' | 'MAYBE' | 'ABSENT'>('GOING');
  const [newMateGuests, setNewMateGuests] = useState<number>(0);

  // Inline SOS Form State per booking
  const [openSosBookingId, setOpenSosBookingId] = useState<number | null>(null);
  const [sosNeededCount, setSosNeededCount] = useState<number>(2);
  const [sosPosition, setSosPosition] = useState<string>('Thủ môn & Hậu vệ');
  const [sosFeePolicy, setSosFeePolicy] = useState<'FREE' | 'SPLIT' | 'WATER'>('FREE');
  const [sosBusy, setSosBusy] = useState(false);

  // Inline Reschedule State per booking
  const [openRescheduleId, setOpenRescheduleId] = useState<number | null>(null);
  const [newSlotChoice, setNewSlotChoice] = useState('20:30 - 22:00');

  const showNotice = (msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 4000);
  };

  // Live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownMinutes((prev) => (prev > 5 ? prev - 1 : 48));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendanceForBooking = async (bookingId: number) => {
    setAttendanceBusy(true);
    try {
      const res = await fetch(`${API_URL}/pitches/bookings/${bookingId}/attendance`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        if (items.length > 0) {
          setAttendanceMap((prev) => ({ ...prev, [bookingId]: items }));
          return;
        }
      }
    } catch {
      // Fallback to local state
    } finally {
      setAttendanceBusy(false);
    }
    if (!attendanceMap[bookingId]) {
      setAttendanceMap((prev) => ({
        ...prev,
        [bookingId]: DEFAULT_ATTENDANCE[901] || [],
      }));
    }
  };

  const toggleAttendancePanel = (bookingId: number) => {
    if (openAttendanceId === bookingId) {
      setOpenAttendanceId(null);
      return;
    }
    setOpenAttendanceId(bookingId);
    setOpenSosBookingId(null);
    setOpenRescheduleId(null);
    loadAttendanceForBooking(bookingId);
  };

  const handleQuickSelfVote = async (
    booking: BookingItem,
    status: 'GOING' | 'MAYBE' | 'ABSENT'
  ) => {
    const myName = user?.fullName || booking.customerName || 'Nguyễn Minh Quân (Tôi)';
    const currentList = attendanceMap[booking.id] || DEFAULT_ATTENDANCE[901] || [];

    try {
      const res = await fetch(`${API_URL}/pitches/bookings/${booking.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          playerName: myName,
          playerPhone: user?.phone || '0909123456',
          status,
          position: 'Tiền vệ',
          extraGuests: 0,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        if (saved?.id) {
          const filtered = currentList.filter((r) => r.playerName !== myName);
          setAttendanceMap((prev) => ({
            ...prev,
            [booking.id]: [saved, ...filtered],
          }));
          showNotice(`Đã cập nhật trạng thái điểm danh của bạn: ${status === 'GOING' ? 'Đi chắc chắn' : status === 'MAYBE' ? '50/50' : 'Báo vắng'}`);
          return;
        }
      }
    } catch {
      // Local fallback
    }

    const existingIdx = currentList.findIndex((r) => r.playerName.includes(myName));
    let updatedList: AttendanceRecord[];
    if (existingIdx >= 0) {
      updatedList = currentList.map((r, i) => (i === existingIdx ? { ...r, status } : r));
    } else {
      updatedList = [
        {
          id: Date.now(),
          bookingId: booking.id,
          playerName: myName,
          status,
          position: 'Tiền vệ',
          extraGuests: 0,
        },
        ...currentList,
      ];
    }
    setAttendanceMap((prev) => ({ ...prev, [booking.id]: updatedList }));
    showNotice(
      `Đã ghi nhận điểm danh của bạn: ${
        status === 'GOING' ? '✅ Đi chắc chắn' : status === 'MAYBE' ? '🤔 50/50 Đang bận' : '❌ Báo vắng'
      }`
    );
  };

  const handleAddTeammate = async (booking: BookingItem) => {
    if (!newMateName.trim()) {
      showNotice('⚠️ Vui lòng nhập tên đồng đội cần thêm vào danh sách.');
      return;
    }
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      bookingId: booking.id,
      playerName: newMateName.trim(),
      playerPhone: newMatePhone.trim(),
      status: newMateStatus,
      position: newMatePos,
      extraGuests: newMateGuests,
    };

    try {
      await fetch(`${API_URL}/pitches/bookings/${booking.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newRecord),
      });
    } catch {
      // Local fallback
    }

    const currentList = attendanceMap[booking.id] || [];
    setAttendanceMap((prev) => ({
      ...prev,
      [booking.id]: [...currentList, newRecord],
    }));
    setNewMateName('');
    setNewMatePhone('');
    setNewMateGuests(0);
    showNotice(`✅ Đã thêm ${newRecord.playerName} (${newRecord.position}) vào danh sách điểm danh!`);
  };

  const handleRemoveAttendance = async (bookingId: number, recordId: number) => {
    try {
      await fetch(`${API_URL}/pitches/bookings/${bookingId}/attendance/${recordId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Local fallback
    }
    const currentList = attendanceMap[bookingId] || [];
    setAttendanceMap((prev) => ({
      ...prev,
      [bookingId]: currentList.filter((r) => r.id !== recordId),
    }));
  };

  const handleRemindHandover = async (booking: BookingItem) => {
    try {
      await fetch(`${API_URL}/pitches/bookings/${booking.id}/remind-handover`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Handled gracefully
    }
    if (!remindedIds.includes(booking.id)) {
      setRemindedIds((prev) => [...prev, booking.id]);
    }
    showNotice(
      `🔔 Đã phát thông báo nhắc giờ ra sân & chuẩn bị trả sân văn minh cho ca ${booking.timeSlot} (${booking.courtName})!`
    );
  };

  const handleBroadcastSos = async (booking: BookingItem) => {
    setSosBusy(true);
    const feeVal =
      sosFeePolicy === 'FREE'
        ? 0
        : sosFeePolicy === 'WATER'
        ? 30000
        : Math.round((booking.totalPrice || 350000) / 14);
    const paymentModel =
      sosFeePolicy === 'FREE' ? 'HOST_COVER' : '50_50';

    const payload: MatchmakingPostItem = {
      id: Date.now(),
      teamName: `🚨 SOS: FC ${user?.fullName || 'Turfzone'} Cần Gấp ${sosNeededCount} Chân`,
      captainName: user?.fullName || booking.customerName || 'Đội Trưởng',
      captainPhone: user?.phone || booking.customerPhone || '0909123456',
      pitchName: `${booking.pitchName || 'Sân bóng Turfzone'} (${booking.courtName})`,
      area: 'TP.HCM',
      pitchType: booking.courtType?.includes('5') ? 'SAN_5' : 'SAN_7',
      matchTime: `${booking.timeSlot} • Ngày ${booking.bookingDate}`,
      skillLevel: 'Mọi trình độ (Vui vẻ, Fair-Play)',
      paymentModel,
      estimatedFee: feeVal,
      notes: `Đội đã đặt sẵn sân (${booking.code}) nhưng thiếu đột xuất ${sosNeededCount} vị trí (${sosPosition}). Anh em gần sân ghé đá giao lưu ngay nhé!`,
      status: 'OPEN',
      postType: 'SOS',
      neededCount: sosNeededCount,
      neededPositions: sosPosition,
      matchStyle: 'Đá dưỡng sinh / Vui vẻ',
      ageGroup: 'Mọi lứa tuổi',
      homeKitColor: 'Đỏ',
      refereeOption: 'Tự bắt / Giao lưu',
    };

    try {
      const res = await fetch(`${API_URL}/community/matchmaking-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        onBroadcastSosSuccess({ ...payload, ...(saved || {}) });
      } else {
        onBroadcastSosSuccess(payload);
      }
    } catch {
      onBroadcastSosSuccess(payload);
    } finally {
      setSosBusy(false);
      setOpenSosBookingId(null);
      showNotice(
        `🚨 Đã phát tín hiệu SOS tuyển ${sosNeededCount} viện binh (${sosPosition}) lên Chợ Kèo thành công!`
      );
    }
  };

  const handleConfirmReschedule = async (booking: BookingItem) => {
    try {
      await fetch(`${API_URL}/pitches/bookings/${booking.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          newTimeSlot: newSlotChoice,
          newDate: booking.bookingDate,
        }),
      });
    } catch {
      // Local fallback
    }
    const updated = bookings.map((b) =>
      b.id === booking.id ? { ...b, timeSlot: newSlotChoice } : b
    );
    onUpdateBookings(updated);
    setOpenRescheduleId(null);
    showNotice(`🔄 Đã dời lịch vé ${booking.code} sang khung giờ mới: ${newSlotChoice}!`);
  };

  const activeBooking = bookings[0] || null;

  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {/* ============================================================ */}
      {/* 1. HỒ SƠ CẦU THỦ & THỐNG KÊ NHANH */}
      {/* ============================================================ */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarBigText}>
              {(user?.fullName || user?.email || 'Q').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.wrapRow}>
              <Text style={styles.profileName}>
                {user?.fullName || 'Nguyễn Minh Quân'}
              </Text>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>
                  {user?.role === 'OWNER' ? 'Chủ Sân' : user?.role === 'ORGANIZER' ? 'Ban Tổ Chức' : 'Đội Trưởng Phủi'}
                </Text>
              </View>
            </View>
            <Text style={styles.profileSub}>
              📧 {user?.email || 'player@Turfzone.vn'} • 📞 {user?.phone || '0909123456'}
            </Text>
            <Text style={styles.profileFairPlay}>
              🛡️ Điểm uy tín đặt sân: <Text style={{ fontWeight: '900', color: COLORS.emeraldDark }}>100% Fair-Play</Text> (Không bùng kèo)
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{bookings.length}</Text>
            <Text style={styles.statCap}>Vé đặt sân</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {formatVnd(bookings.reduce((s, b) => s + Number(b.depositPaid ?? 0), 0))}
            </Text>
            <Text style={styles.statCap}>Tổng tiền đã cọc</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: COLORS.emeraldDark }]}>4.9★</Text>
            <Text style={styles.statCap}>Phong độ đội</Text>
          </View>
        </View>
      </View>

      {inlineNotice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>{inlineNotice}</Text>
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. ⏱️ ĐỒNG HỒ ĐẾM NGƯỢC CA ĐÁ & NHẮC TRẢ SÂN VĂN MINH */}
      {/* ============================================================ */}
      {activeBooking && (
        <View style={styles.countdownCard}>
          <View style={styles.countdownHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.wrapRow}>
                <View style={styles.liveClockBadge}>
                  <Text style={styles.liveClockBadgeText}>⏱️ Đồng Hồ Ca Đá Sắp Tới</Text>
                </View>
                <View style={styles.handoverSafeBadge}>
                  <Text style={styles.handoverSafeBadgeText}>🤝 Văn Hóa Trả Sân Đúng Giờ</Text>
                </View>
              </View>
              <Text style={styles.countdownTitle}>
                {activeBooking.pitchName || 'Sân Cỏ Nhân Tạo Turfzone'} — {activeBooking.courtName}
              </Text>
              <Text style={styles.countdownSub}>
                📅 Ngày {activeBooking.bookingDate} • Khung giờ: {activeBooking.timeSlot}
              </Text>
            </View>

            <View style={styles.timerCircle}>
              <Text style={styles.timerValue}>{countdownMinutes}p</Text>
              <Text style={styles.timerUnit}>Tới giờ bóng lăn</Text>
            </View>
          </View>

          <View style={styles.handoverTipBox}>
            <Text style={styles.handoverTipText}>
              💡 <Text style={{ fontWeight: '800' }}>Nhắc nhở văn minh:</Text> Hệ thống tự động báo trước 10 phút cuối ca để anh em gom bóng, kiểm tra giày/áo Bib và nhường sân đúng giờ cho ca kế tiếp.
            </Text>
          </View>

          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() =>
                copyTextWithFeedback(
                  'Đã sao chép mẫu tin nhắc giờ ra sân Zalo!',
                  `⏰ NHẮC GIỜ RA SÂN HÔM NAY\n🏟️ Sân: ${activeBooking.pitchName || 'Turfzone'} (${activeBooking.courtName})\n🕒 Ca đá: ${activeBooking.timeSlot} (${activeBooking.bookingDate})\n💰 Tiền còn thanh toán tại quầy: ${formatVnd(activeBooking.cashDue)}\nAnh em có mặt trước 15 phút khởi động và nhớ thu dọn đồ đạc trả sân đúng giờ nhé!`,
                  showNotice
                )
              }
              style={styles.zaloRemindBtn}
            >
              <Text style={styles.zaloRemindBtnText}>📋 Copy Nhắc Đội Trên Zalo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleRemindHandover(activeBooking)}
              style={[
                styles.bellRemindBtn,
                remindedIds.includes(activeBooking.id) && { backgroundColor: COLORS.emeraldDark },
              ]}
            >
              <Text style={styles.bellRemindBtnText}>
                {remindedIds.includes(activeBooking.id)
                  ? '✅ Đã Phát Chuông Nhắc Đội'
                  : '🔔 Báo Chuông Nhắc Toàn Đội'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ============================================================ */}
      {/* 3. DANH SÁCH VÉ ĐẶT SÂN ĐIỆN TỬ & BẢNG ĐIỂM DANH QUÂN SỐ 1 CHẠM */}
      {/* ============================================================ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎫 Vé Đặt Sân & Bảng Điểm Danh Đội</Text>
        <TouchableOpacity onPress={() => onNavigateTab('booking')} style={styles.newBookingLink}>
          <Text style={styles.newBookingLinkText}>+ Đặt thêm ca mới</Text>
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Bạn chưa có vé đặt sân nào</Text>
          <Text style={styles.emptySub}>
            Hãy chọn một cụm sân và giữ khung giờ trống để nhận vé điện tử và mở bảng điểm danh quân số cho đội.
          </Text>
          <TouchableOpacity
            onPress={() => onNavigateTab('booking')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>⚽ Tìm Sân & Đặt Ca Ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        bookings.map((b) => {
          const list = attendanceMap[b.id] || DEFAULT_ATTENDANCE[901] || [];
          const goingRecords = list.filter((r) => r.status === 'GOING');
          const maybeRecords = list.filter((r) => r.status === 'MAYBE');
          const absentRecords = list.filter((r) => r.status === 'ABSENT');
          const totalGoingPlayers = goingRecords.reduce(
            (sum, r) => sum + 1 + Number(r.extraGuests ?? 0),
            0
          );
          const targetPlayers = b.courtType?.includes('5') ? 10 : 14;
          const missingCount = Math.max(0, targetPlayers - totalGoingPlayers);
          const feePerPerson =
            totalGoingPlayers > 0
              ? Math.ceil((b.totalPrice || 480000) / totalGoingPlayers / 1000) * 1000
              : 0;

          const isAttendanceOpen = openAttendanceId === b.id;
          const isSosOpen = openSosBookingId === b.id;
          const isRescheduleOpen = openRescheduleId === b.id;

          return (
            <View key={b.id} style={styles.ticketCard}>
              {/* Ticket Header */}
              <View style={styles.ticketTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.wrapRow}>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>🎫 {b.code || `TZ-${b.id}`}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {b.status === 'BOOKED'
                          ? 'Đã giữ sân'
                          : b.status === 'PLAYING'
                          ? 'Đang thi đấu'
                          : 'Hoàn tất'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.ticketPitchName}>
                    {b.pitchName || 'Tổ Hợp Sân Cỏ Nhân Tạo Turfzone'}
                  </Text>
                  <Text style={styles.ticketCourtInfo}>
                    🏟️ {b.courtName} • 📅 {b.bookingDate} • ⏰ {b.timeSlot}
                  </Text>
                </View>
              </View>

              {/* Financial breakdown */}
              <View style={styles.financeRow}>
                <View style={styles.financeCell}>
                  <Text style={styles.financeLabel}>Tổng tiền ca</Text>
                  <Text style={styles.financeVal}>{formatVnd(b.totalPrice)}</Text>
                </View>
                <View style={styles.financeCell}>
                  <Text style={styles.financeLabel}>Đã cọc giữ chỗ</Text>
                  <Text style={[styles.financeVal, { color: COLORS.emeraldDark }]}>
                    {formatVnd(b.depositPaid)}
                  </Text>
                </View>
                <View style={styles.financeCell}>
                  <Text style={styles.financeLabel}>Còn trả tại sân</Text>
                  <Text style={[styles.financeVal, { color: COLORS.amber }]}>
                    {formatVnd(b.cashDue)}
                  </Text>
                </View>
              </View>

              {b.note ? (
                <Text style={styles.ticketNote}>📝 Ghi chú: {b.note}</Text>
              ) : null}

              {/* Action Toolbar (flexWrap so buttons NEVER get clipped!) */}
              <View style={styles.ticketActionWrap}>
                <TouchableOpacity
                  onPress={() => toggleAttendancePanel(b.id)}
                  style={[
                    styles.actionBtnPrimary,
                    isAttendanceOpen && { backgroundColor: COLORS.primaryDark },
                  ]}
                >
                  <Text style={styles.actionBtnPrimaryText}>
                    📋 Điểm Danh Quân Số ({totalGoingPlayers}/{targetPlayers}) {isAttendanceOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setOpenSosBookingId(isSosOpen ? null : b.id);
                    setOpenAttendanceId(null);
                    setOpenRescheduleId(null);
                  }}
                  style={[styles.actionBtnSos, isSosOpen && { backgroundColor: COLORS.roseDark }]}
                >
                  <Text style={styles.actionBtnSosText}>
                    🚨 Phát SOS Thiếu Chân {isSosOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setOpenRescheduleId(isRescheduleOpen ? null : b.id);
                    setOpenAttendanceId(null);
                    setOpenSosBookingId(null);
                  }}
                  style={styles.actionBtnSecondary}
                >
                  <Text style={styles.actionBtnSecondaryText}>
                    🔄 Đổi Giờ Ca Đá {isRescheduleOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ============================================================ */}
              {/* INLINE PANEL A: 📋 BẢNG ĐIỂM DANH QUÂN SỐ CA ĐÁ 1 CHẠM */}
              {/* ============================================================ */}
              {isAttendanceOpen && (
                <View style={styles.inlineAttendanceBox}>
                  <View style={styles.attHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attTitle}>
                        📋 Bảng Điểm Danh Quân Số & Chia Tiền Sân Tự Động
                      </Text>
                      <Text style={styles.attSub}>
                        Thay thế tin nhắn trôi trong nhóm Zalo — chạm 1 nút để chốt số lượng ra sân hôm nay.
                      </Text>
                    </View>
                  </View>

                  {/* 1-Touch Self Vote Buttons */}
                  <Text style={styles.fieldLabel}>Báo danh nhanh phần bạn:</Text>
                  <View style={styles.wrapRow}>
                    <TouchableOpacity
                      onPress={() => handleQuickSelfVote(b, 'GOING')}
                      style={styles.voteGoingBtn}
                    >
                      <Text style={styles.voteGoingBtnText}>✅ Đi chắc chắn</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleQuickSelfVote(b, 'MAYBE')}
                      style={styles.voteMaybeBtn}
                    >
                      <Text style={styles.voteMaybeBtnText}>🤔 50/50 Đang bận</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleQuickSelfVote(b, 'ABSENT')}
                      style={styles.voteAbsentBtn}
                    >
                      <Text style={styles.voteAbsentBtnText}>❌ Báo vắng</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Progress & Auto Fee Split Summary */}
                  <View style={styles.progressSummaryCard}>
                    <View style={styles.progressTopRow}>
                      <Text style={styles.progressCountText}>
                        Quân số có mặt: <Text style={{ color: COLORS.emeraldDark, fontWeight: '900' }}>{totalGoingPlayers}/{targetPlayers} người</Text> ({maybeRecords.length} dự kiến, {absentRecords.length} báo vắng)
                      </Text>
                      <Text style={styles.feeSplitText}>
                        💸 Chia tiền sân: ~{formatVnd(feePerPerson)}/người
                      </Text>
                    </View>

                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(100, Math.round((totalGoingPlayers / targetPlayers) * 100))}%`,
                            backgroundColor:
                              totalGoingPlayers >= targetPlayers ? COLORS.emerald : COLORS.primary,
                          },
                        ]}
                      />
                    </View>

                    {missingCount > 0 && (
                      <View style={styles.missingAlertRow}>
                        <Text style={styles.missingAlertText}>
                          ⚠️ Đang thiếu <Text style={{ fontWeight: '900' }}>{missingCount} cầu thủ</Text> để đủ 2 đội chia sân!
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSosNeededCount(Math.min(5, missingCount));
                            setOpenAttendanceId(null);
                            setOpenSosBookingId(b.id);
                          }}
                          style={styles.switchToSosBtn}
                        >
                          <Text style={styles.switchToSosBtnText}>
                            🚨 Bật SOS Tuyển {missingCount} Viện Binh ➜
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Attendance Roster List */}
                  {attendanceBusy ? (
                    <ActivityIndicator color={COLORS.primary} />
                  ) : (
                    <View style={styles.rosterList}>
                      {list.map((rec) => (
                        <View key={rec.id} style={styles.rosterRow}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.wrapRow}>
                              <Text style={styles.rosterName}>
                                {rec.status === 'GOING'
                                  ? '✅'
                                  : rec.status === 'MAYBE'
                                  ? '🤔'
                                  : '❌'}{' '}
                                {rec.playerName}
                              </Text>
                              {rec.position && (
                                <View style={styles.posBadge}>
                                  <Text style={styles.posBadgeText}>{rec.position}</Text>
                                </View>
                              )}
                              {Number(rec.extraGuests ?? 0) > 0 && (
                                <View style={styles.guestBadge}>
                                  <Text style={styles.guestBadgeText}>
                                    +{rec.extraGuests} bạn đi kèm
                                  </Text>
                                </View>
                              )}
                            </View>
                            {rec.note ? (
                              <Text style={styles.rosterNote}>💬 {rec.note}</Text>
                            ) : null}
                          </View>

                          <TouchableOpacity
                            onPress={() => handleRemoveAttendance(b.id, rec.id)}
                            style={styles.removeMateBtn}
                          >
                            <Text style={styles.removeMateBtnText}>Xóa</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Add Teammate Inline Form */}
                  <View style={styles.addMateBox}>
                    <Text style={styles.fieldLabel}>➕ Thêm nhanh đồng đội báo qua điện thoại/Zalo:</Text>
                    <View style={styles.inputRowWrap}>
                      <TextInput
                        value={newMateName}
                        onChangeText={setNewMateName}
                        placeholder="Tên cầu thủ (VD: Hoàng Anh)..."
                        style={[styles.textInput, { flex: 1, minWidth: 160 }]}
                      />
                      <TextInput
                        value={newMatePhone}
                        onChangeText={setNewMatePhone}
                        placeholder="SĐT (tùy chọn)..."
                        keyboardType="phone-pad"
                        style={[styles.textInput, { flex: 1, minWidth: 130 }]}
                      />
                    </View>

                    <Text style={styles.fieldLabel}>Vị trí sở trường:</Text>
                    <View style={styles.wrapRow}>
                      {['Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo', 'Đá mọi vị trí'].map((pos) => (
                        <TouchableOpacity
                          key={pos}
                          onPress={() => setNewMatePos(pos)}
                          style={[
                            styles.smallChip,
                            newMatePos === pos && styles.smallChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallChipText,
                              newMatePos === pos && styles.smallChipTextActive,
                            ]}
                          >
                            {pos}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.wrapRow}>
                      <TouchableOpacity
                        onPress={() => setNewMateGuests((g) => (g >= 3 ? 0 : g + 1))}
                        style={styles.smallChip}
                      >
                        <Text style={styles.smallChipText}>
                          👥 Dắt thêm bạn: +{newMateGuests} người
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleAddTeammate(b)}
                        style={styles.addMateSubmitBtn}
                      >
                        <Text style={styles.addMateSubmitBtnText}>+ Lưu Vào Danh Sách</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Copy Zalo Attendance Summary */}
                  <TouchableOpacity
                    onPress={() => {
                      const goingStr = goingRecords
                        .map(
                          (r, i) =>
                            `${i + 1}. ${r.playerName} (${r.position || 'Cầu thủ'}${
                              r.extraGuests ? ` +${r.extraGuests} bạn` : ''
                            })`
                        )
                        .join('\n');
                      const summaryText =
                        `📋 CHỐT QUÂN SỐ CA ĐÁ (${b.timeSlot} - ${b.bookingDate})\n` +
                        `🏟️ Sân: ${b.pitchName || 'Turfzone'} (${b.courtName})\n` +
                        `✅ Đi chắc chắn (${totalGoingPlayers}/${targetPlayers}):\n${goingStr || 'Chưa có'}\n` +
                        `💸 Dự kiến chia tiền sân: ${formatVnd(feePerPerson)}/người\n` +
                        (missingCount > 0
                          ? `🚨 Hiện còn thiếu ${missingCount} chân, anh em nào đi được báo gấp nhé!`
                          : `🔥 Đã đủ quân số chia 2 đội!`);
                      copyTextWithFeedback(
                        'Đã sao chép danh sách điểm danh để dán vào nhóm Zalo!',
                        summaryText,
                        showNotice
                      );
                    }}
                    style={styles.copyZaloFullBtn}
                  >
                    <Text style={styles.copyZaloFullBtnText}>
                      📋 Copy Danh Sách Điểm Danh & Chia Tiền Gửi Zalo
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ============================================================ */}
              {/* INLINE PANEL B: 🚨 PHÁT TIN SOS THIẾU CHÂN GIỜ CHÓT */}
              {/* ============================================================ */}
              {isSosOpen && (
                <View style={styles.inlineSosBox}>
                  <Text style={styles.sosTitle}>
                    🚨 Phát Tín Hiệu SOS Tìm Viện Binh Đá Bù Giờ Chót
                  </Text>
                  <Text style={styles.sosSub}>
                    Tin SOS sẽ được ghim nổi bật đầu bảng Chợ Kèo để các cầu thủ tự do quanh khu vực sân ứng cứu ngay!
                  </Text>

                  <Text style={styles.fieldLabel}>Số lượng cầu thủ đang thiếu:</Text>
                  <View style={styles.wrapRow}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <TouchableOpacity
                        key={num}
                        onPress={() => setSosNeededCount(num)}
                        style={[
                          styles.sosNumChip,
                          sosNeededCount === num && styles.sosNumChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sosNumChipText,
                            sosNeededCount === num && styles.sosNumChipTextActive,
                          ]}
                        >
                          Thiếu {num} người
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Vị trí cần tuyển gấp:</Text>
                  <View style={styles.wrapRow}>
                    {[
                      'Thủ môn',
                      'Hậu vệ',
                      'Tiền vệ',
                      'Tiền đạo',
                      'Thủ môn & Hậu vệ',
                      'Đá mọi vị trí',
                    ].map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        onPress={() => setSosPosition(pos)}
                        style={[
                          styles.smallChip,
                          sosPosition === pos && styles.sosChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallChipText,
                            sosPosition === pos && styles.sosChipTextActive,
                          ]}
                        >
                          {pos}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Chính sách tiền sân cho viện binh:</Text>
                  <View style={styles.wrapRow}>
                    {[
                      { id: 'FREE', label: '🎁 Miễn phí 100% (Chủ đội bao sân)' },
                      { id: 'WATER', label: '🥤 Chỉ góp 30k tiền nước' },
                      { id: 'SPLIT', label: '🤝 Chia đều tiền sân (~35k/người)' },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSosFeePolicy(opt.id as any)}
                        style={[
                          styles.smallChip,
                          sosFeePolicy === opt.id && styles.sosChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.smallChipText,
                            sosFeePolicy === opt.id && styles.sosChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleBroadcastSos(b)}
                    disabled={sosBusy}
                    style={styles.sosSubmitBtn}
                  >
                    <Text style={styles.sosSubmitBtnText}>
                      {sosBusy
                        ? 'Đang phát tín hiệu SOS...'
                        : `🚨 Phát Ngay Lên Chợ Kèo (Tuyển ${sosNeededCount} người)`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ============================================================ */}
              {/* INLINE PANEL C: 🔄 ĐỔI GIỜ / DỜI LỊCH CA ĐÁ */}
              {/* ============================================================ */}
              {isRescheduleOpen && (
                <View style={styles.inlineRescheduleBox}>
                  <Text style={styles.attTitle}>🔄 Đổi Khung Giờ Ca Đá ({b.bookingDate})</Text>
                  <Text style={styles.attSub}>
                    Chọn khung giờ còn trống khác trong ngày để chuyển tiền cọc sang ca mới:
                  </Text>

                  <View style={styles.wrapRow}>
                    {['16:00 - 17:30', '17:30 - 19:00', '19:00 - 20:30', '20:30 - 22:00'].map(
                      (slot) => (
                        <TouchableOpacity
                          key={slot}
                          onPress={() => setNewSlotChoice(slot)}
                          style={[
                            styles.smallChip,
                            newSlotChoice === slot && styles.smallChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.smallChipText,
                              newSlotChoice === slot && styles.smallChipTextActive,
                            ]}
                          >
                            ⏰ {slot}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleConfirmReschedule(b)}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>
                      ✅ Xác Nhận Đổi Sang Ca {newSlotChoice}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBig: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBigText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  rolePill: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  rolePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  profileFairPlay: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceMuted,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statCap: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.borderLight,
  },
  noticeBanner: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1.5,
    borderColor: COLORS.emerald,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  noticeBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  countdownCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.amberBright,
    marginBottom: 16,
    gap: 12,
  },
  countdownHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  liveClockBadge: {
    backgroundColor: COLORS.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveClockBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  handoverSafeBadge: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  handoverSafeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  countdownTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 6,
  },
  countdownSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timerCircle: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 105,
  },
  timerValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  timerUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  handoverTipBox: {
    backgroundColor: COLORS.amberSoft,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.amberLight,
  },
  handoverTipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 19,
  },
  zaloRemindBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  zaloRemindBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  bellRemindBtn: {
    backgroundColor: COLORS.amber,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  bellRemindBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  newBookingLink: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  newBookingLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  codeBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  codeBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statusBadge: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  ticketPitchName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8,
  },
  ticketCourtInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  financeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  financeCell: {
    minWidth: 95,
  },
  financeLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  financeVal: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  ticketNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  ticketActionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnSos: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  actionBtnSosText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 42,
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineAttendanceBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 10,
  },
  attHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  attSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  voteGoingBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  voteGoingBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  voteMaybeBtn: {
    backgroundColor: COLORS.amberBright,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  voteMaybeBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  voteAbsentBtn: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.rose,
    minHeight: 40,
    justifyContent: 'center',
  },
  voteAbsentBtnText: {
    color: COLORS.rose,
    fontSize: 13,
    fontWeight: '800',
  },
  progressSummaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  progressTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  progressCountText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  feeSplitText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  missingAlertRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.roseSoft,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
    gap: 8,
  },
  missingAlertText: {
    fontSize: 13,
    color: COLORS.roseDark,
    flex: 1,
    minWidth: 180,
  },
  switchToSosBtn: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  switchToSosBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  rosterList: {
    gap: 6,
  },
  rosterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  posBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  posBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  guestBadge: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  guestBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  rosterNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  removeMateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceMuted,
  },
  removeMateBtnText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  addMateBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  inputRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 42,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  smallChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  smallChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  smallChipTextActive: {
    color: COLORS.white,
  },
  addMateSubmitBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  addMateSubmitBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  copyZaloFullBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  copyZaloFullBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineSosBox: {
    backgroundColor: COLORS.roseSoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.roseLight,
    gap: 10,
  },
  sosTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.roseDark,
  },
  sosSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sosNumChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
  },
  sosNumChipActive: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.roseDark,
  },
  sosNumChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.roseDark,
  },
  sosNumChipTextActive: {
    color: COLORS.white,
  },
  sosChipActive: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.roseDark,
  },
  sosChipTextActive: {
    color: COLORS.white,
  },
  sosSubmitBtn: {
    backgroundColor: COLORS.rose,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  sosSubmitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  inlineRescheduleBox: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
});

