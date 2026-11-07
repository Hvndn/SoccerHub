import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  COLORS,
  useResponsiveLayout,
  todayLocal,
  formatVnd,
} from '../theme/responsive';
import {
  AuthUser,
  BookingItem,
  Pitch,
} from '../services/api';

interface OwnerDashboardTabProps {
  user: AuthUser | null;
  pitches: Pitch[];
  bookings: BookingItem[];
  onUpdateBookings: (updated: BookingItem[]) => void;
}

export default function OwnerDashboardTab({
  user,
  pitches,
  bookings,
  onUpdateBookings,
}: OwnerDashboardTabProps) {
  const layout = useResponsiveLayout();

  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInCustomer, setWalkInCustomer] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInCourt, setWalkInCourt] = useState('Sân 7A');
  const [walkInSlot, setWalkInSlot] = useState('17:30 - 19:00');
  const [walkInPrice, setWalkInPrice] = useState('480000');
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 3500);
  };

  const totalRevenue = bookings.reduce((s, b) => s + Number(b.totalPrice ?? 0), 0);
  const totalDeposited = bookings.reduce((s, b) => s + Number(b.depositPaid ?? 0), 0);
  const totalCashDue = bookings.reduce((s, b) => s + Number(b.cashDue ?? 0), 0);

  const handleCreateWalkIn = () => {
    if (!walkInCustomer.trim() || !walkInPhone.trim()) {
      showNotice('⚠️ Vui lòng nhập tên khách và số điện thoại đặt tại quầy.');
      return;
    }
    const priceNum = Number(walkInPrice) || 480000;
    const newB: BookingItem = {
      id: Date.now(),
      code: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
      pitchId: pitches[0]?.id || 1,
      pitchName: pitches[0]?.name || 'Tổ Hợp Sân Cỏ Nhân Tạo Chảo Lửa Pro',
      courtName: walkInCourt,
      courtType: walkInCourt.includes('5') ? 'Sân 5' : 'Sân 7',
      bookingDate: todayLocal(),
      timeSlot: walkInSlot,
      status: 'PLAYING',
      totalPrice: priceNum,
      depositPaid: priceNum,
      cashDue: 0,
      customerName: walkInCustomer.trim(),
      customerPhone: walkInPhone.trim(),
      note: 'Khách đặt trực tiếp tại quầy/Zalo chủ sân',
    };
    onUpdateBookings([newB, ...bookings]);
    setWalkInCustomer('');
    setWalkInPhone('');
    setShowWalkInForm(false);
    showNotice(`✅ Đã khóa lịch ca ${walkInSlot} (${walkInCourt}) cho khách ${newB.customerName}!`);
  };

  const handleToggleBookingStatus = (booking: BookingItem, nextStatus: string) => {
    const updated = bookings.map((b) =>
      b.id === booking.id
        ? {
            ...b,
            status: nextStatus,
            cashDue: nextStatus === 'COMPLETED' ? 0 : b.cashDue,
            depositPaid: nextStatus === 'COMPLETED' ? b.totalPrice : b.depositPaid,
          }
        : b
    );
    onUpdateBookings(updated);
    showNotice(
      `✅ Đã cập nhật đơn ${booking.code} sang trạng thái: ${
        nextStatus === 'PLAYING' ? 'Đang đá trên sân' : 'Đã thu đủ tiền & Hoàn tất'
      }!`
    );
  };

  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      <View style={styles.heroCard}>
        <View style={styles.wrapRow}>
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>🏟️ Trung Tâm Điều Hành Cụm Sân & Doanh Thu</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>
          Quản Trị Sân Bóng ({user?.fullName || 'Chủ Sân Turfzone'})
        </Text>
        <Text style={styles.heroSub}>
          Theo dõi lịch lấp đầy sân theo thời gian thực, đối soát tiền cọc VietQR và ghi nhận khách đặt trực tiếp tại quầy.
        </Text>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Tổng doanh thu ca</Text>
            <Text style={styles.kpiValue}>{formatVnd(totalRevenue)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Đã nhận cọc QR</Text>
            <Text style={[styles.kpiValue, { color: COLORS.emeraldDark }]}>
              {formatVnd(totalDeposited)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Cần thu tại sân</Text>
            <Text style={[styles.kpiValue, { color: COLORS.amber }]}>
              {formatVnd(totalCashDue)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowWalkInForm(!showWalkInForm)}
          style={styles.walkInToggleBtn}
        >
          <Text style={styles.walkInToggleBtnText}>
            {showWalkInForm
              ? 'Thu Gọn Form Giữ Sân Tại Quầy ▲'
              : '+ Tạo Đơn Khách Quen / Giữ Sân Tại Quầy (Inline) ▼'}
          </Text>
        </TouchableOpacity>

        {/* INLINE WALK-IN BOOKING FORM */}
        {showWalkInForm && (
          <View style={styles.inlineWalkInBox}>
            <Text style={styles.formTitle}>📝 Ghi Nhận Khách Đặt Nhanh Qua Điện Thoại / Tại Quầy</Text>
            <View style={styles.inputRowWrap}>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Tên đội / Khách đặt</Text>
                <TextInput
                  value={walkInCustomer}
                  onChangeText={setWalkInCustomer}
                  placeholder="VD: Anh Tuấn FC..."
                  style={styles.textInput}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Số điện thoại</Text>
                <TextInput
                  value={walkInPhone}
                  onChangeText={setWalkInPhone}
                  keyboardType="phone-pad"
                  placeholder="0909..."
                  style={styles.textInput}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Chọn sân con & Khung giờ:</Text>
            <View style={styles.wrapRow}>
              {['Sân 5A', 'Sân 5B', 'Sân 7A', 'Sân 7B'].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setWalkInCourt(c)}
                  style={[styles.chip, walkInCourt === c && styles.chipActive]}
                >
                  <Text style={[styles.chipText, walkInCourt === c && styles.chipTextActive]}>
                    🏟️ {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.wrapRow}>
              {['16:00 - 17:30', '17:30 - 19:00', '19:00 - 20:30', '20:30 - 22:00'].map((sl) => (
                <TouchableOpacity
                  key={sl}
                  onPress={() => setWalkInSlot(sl)}
                  style={[styles.chip, walkInSlot === sl && styles.chipActive]}
                >
                  <Text style={[styles.chipText, walkInSlot === sl && styles.chipTextActive]}>
                    ⏰ {sl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={handleCreateWalkIn} style={styles.saveWalkInBtn}>
              <Text style={styles.saveWalkInBtnText}>✅ Khóa Ca Sân & Lưu Vào Lịch Hôm Nay</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {inlineNotice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>{inlineNotice}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>📋 Danh Sách Đơn Đặt Sân & Đối Soát Tại Quầy</Text>
      {bookings.map((b) => (
        <View key={b.id} style={styles.bookingRowCard}>
          <View style={styles.bookingTop}>
            <Text style={styles.bookingCode}>🎫 {b.code}</Text>
            <View
              style={[
                styles.statusBadge,
                b.status === 'COMPLETED'
                  ? { backgroundColor: COLORS.emeraldSoft }
                  : { backgroundColor: COLORS.primarySoft },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  b.status === 'COMPLETED'
                    ? { color: COLORS.emeraldDark }
                    : { color: COLORS.primary },
                ]}
              >
                {b.status === 'BOOKED'
                  ? 'Đã cọc giữ chỗ'
                  : b.status === 'PLAYING'
                  ? 'Đang đá trên sân'
                  : 'Đã thu đủ tiền'}
              </Text>
            </View>
          </View>

          <Text style={styles.bookingTitle}>
            🏟️ {b.courtName} • ⏰ {b.timeSlot} ({b.bookingDate})
          </Text>
          <Text style={styles.bookingMeta}>
            👤 Khách: {b.customerName || 'Cầu Thủ'} ({b.customerPhone || '0909123456'})
          </Text>
          <Text style={styles.bookingMeta}>
            💰 Tổng: {formatVnd(b.totalPrice)} • Đã cọc: {formatVnd(b.depositPaid)} • Còn thu:{' '}
            <Text style={{ fontWeight: '900', color: COLORS.rose }}>{formatVnd(b.cashDue)}</Text>
          </Text>

          <View style={[styles.wrapRow, { marginTop: 8 }]}>
            {b.status === 'BOOKED' && (
              <TouchableOpacity
                onPress={() => handleToggleBookingStatus(b, 'PLAYING')}
                style={styles.checkInBtn}
              >
                <Text style={styles.checkInBtnText}>⚽ Nhận Sân (Check-in)</Text>
              </TouchableOpacity>
            )}
            {b.status !== 'COMPLETED' && (
              <TouchableOpacity
                onPress={() => handleToggleBookingStatus(b, 'COMPLETED')}
                style={styles.collectCashBtn}
              >
                <Text style={styles.collectCashBtnText}>
                  💵 Xác Nhận Đã Thu Đủ Tiền & Trả Sân
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
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
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
    gap: 10,
  },
  ownerBadge: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownerBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  kpiLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 4,
  },
  walkInToggleBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  walkInToggleBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineWalkInBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 10,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  inputRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  inputCol: {
    flex: 1,
    minWidth: 160,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
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
    minHeight: 42,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  saveWalkInBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  saveWalkInBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 10,
  },
  bookingRowCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 10,
    gap: 6,
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  bookingMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  checkInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  checkInBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  collectCashBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  collectCashBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
});

