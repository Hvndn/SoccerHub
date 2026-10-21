import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

// Backend API URL - trỏ trực tiếp đến máy chủ hoặc IP mạng LAN
const API_URL = 'http://10.100.19.142:8080/api/v1';

interface Pitch {
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

function MainApp() {
  const insets = useSafeAreaInsets();

  // Navigation tab state tương tự web: booking, tournaments, community, my-activities
  const [activeTab, setActiveTab] = useState<'booking' | 'tournaments' | 'community' | 'activities'>('booking');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('ALL');
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal / Booking Modal State
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('18:00 - 19:30');
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch real pitch data from Spring Boot backend (như web)
  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/pitches`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPitches(data);
          return;
        }
      }
    } catch (e) {
      console.log('Using offline pitches fallback');
    } finally {
      setLoading(false);
    }
  };

  // Lọc sân theo tìm kiếm và môn thể thao
  const filteredPitches = pitches.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedSport === 'ALL') return matchName;
    if (selectedSport === 'SAN_5') return matchName && p.pitchTypes?.includes('SAN_5');
    if (selectedSport === 'SAN_7') return matchName && p.pitchTypes?.includes('SAN_7');
    if (selectedSport === 'FUTSAL') return matchName && p.pitchTypes?.includes('FUTSAL');
    return matchName;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ============================================================ */}
      {/* 1. TOP NAVBAR (Chuẩn giao diện web Turfzone PRO) */}
      {/* ============================================================ */}
      <View style={styles.topNavbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚽</Text>
          </View>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>TURFZONE</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>Hệ Thống Đặt Sân &amp; Giải Đấu</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconCircle}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.avatarCircle}>
            <Text style={styles.avatarText}>TU</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT TÙY THEO TAB */}
      {/* ============================================================ */}
      {activeTab === 'booking' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.mainScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          {/* Hero Banner (Giống LandingHero trên web) */}
          <View style={styles.heroCard}>
            <View style={styles.heroTagRow}>
              <View style={styles.liveIndicator} />
              <Text style={styles.heroTagText}>HỆ THỐNG TRỰC TUYẾN 24/7</Text>
            </View>
            <Text style={styles.heroHeading}>
              Quản Lý Sân Bóng &amp;{'\n'}
              <Text style={styles.heroHeadingHighlight}>Giải Đấu Thể Thao</Text>
            </Text>
            <Text style={styles.heroDesc}>
              Đặt ca trực tiếp từ CSDL • Giữ chỗ tức thì không trùng lịch • Tìm đối thủ giao lưu
            </Text>

            {/* Live Stats Row */}
            <View style={styles.heroStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{pitches.length || 9}+</Text>
                <Text style={styles.statLabel}>Cụm sân</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>100%</Text>
                <Text style={styles.statLabel}>Sân thật</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>4.8★</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
            </View>
          </View>

          {/* Search Box Bar (Giống thanh tìm kiếm web) */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Tìm tên sân bóng, quận huyện, khu vực..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Filter Sport Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {[
              { id: 'ALL', label: 'Tất cả loại sân', icon: '⚽' },
              { id: 'SAN_5', label: 'Sân Cỏ 5 Người', icon: '🟢' },
              { id: 'SAN_7', label: 'Sân Cỏ 7 Người', icon: '🌿' },
              { id: 'FUTSAL', label: 'Futsal Trong Nhà', icon: '🏟️' },
            ].map((sport) => {
              const isActive = selectedSport === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  onPress={() => setSelectedSport(sport.id)}
                  style={[styles.sportPill, isActive && styles.sportPillActive]}
                >
                  <Text style={{ fontSize: 13 }}>{sport.icon}</Text>
                  <Text style={[styles.sportPillText, isActive && styles.sportPillTextActive]}>
                    {sport.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Danh Sách Sân Thật (Pitch Cards) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cụm Sân Thể Thao Sẵn Sàng</Text>
            <Text style={styles.sectionBadge}>{filteredPitches.length} sân</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0369a1" />
              <Text style={styles.loadingText}>Đang tải danh sách sân từ máy chủ...</Text>
            </View>
          ) : (
            filteredPitches.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSelectedPitch(item);
                  setShowBookingModal(true);
                }}
                style={({ pressed }) => [styles.pitchCard, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.pitchImage}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.pitchContent}>
                  <View style={styles.pitchHeaderRow}>
                    <Text style={styles.pitchName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingPillText}>⭐ {item.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  <Text style={styles.pitchAddress} numberOfLines={1}>
                    📍 {item.address}
                  </Text>

                  {/* Amenities Tags */}
                  <View style={styles.amenityRow}>
                    {(item.amenities || ['Giữ xe', 'Wifi', 'Đèn LED']).slice(0, 3).map((amenity, idx) => (
                      <View key={idx} style={styles.amenityTag}>
                        <Text style={styles.amenityTagText}>{amenity}</Text>
                      </View>
                    ))}
                    <Text style={styles.openTimeTag}>🕒 {item.openTime} - {item.closeTime}</Text>
                  </View>

                  <View style={styles.pitchFooterRow}>
                    <View>
                      <Text style={styles.priceLabel}>Giá tham khảo</Text>
                      <Text style={styles.priceAmount}>
                        {item.avgPricePerHour.toLocaleString('vi-VN')} đ{' '}
                        <Text style={styles.priceUnit}>/giờ</Text>
                      </Text>
                    </View>

                    <View style={styles.bookingBtn}>
                      <Text style={styles.bookingBtnText}>Chọn Ca ➜</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* 3. TAB GIẢI ĐẤU (TOURNAMENTS) */}
      {/* ============================================================ */}
      {activeTab === 'tournaments' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.mainScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroHeading}>🏆 Giải Đấu &amp; Bảng Đấu</Text>
            <Text style={styles.heroDesc}>
              Tham gia thi đấu, theo dõi nhánh đấu Bracket trực tiếp và cập nhật bảng xếp hạng phong độ.
            </Text>
          </View>

          {[
            {
              id: 't1',
              title: 'Cúp Vô Địch TurfZone Championship 2026',
              prize: '25.000.000 đ',
              teams: '16 Đội',
              status: 'Đang mở đăng ký',
              badgeColor: '#10b981',
            },
            {
              id: 't2',
              title: 'Giải Bóng Đá Doanh Nghiệp Đà Nẵng',
              prize: '15.000.000 đ',
              teams: '8 Đội',
              status: 'Vòng Tứ Kết',
              badgeColor: '#f59e0b',
            },
          ].map((tour) => (
            <View key={tour.id} style={styles.tourCard}>
              <View style={styles.tourHeader}>
                <Text style={styles.tourTitle}>{tour.title}</Text>
                <View style={[styles.tourBadge, { backgroundColor: tour.badgeColor + '20' }]}>
                  <Text style={[styles.tourBadgeText, { color: tour.badgeColor }]}>{tour.status}</Text>
                </View>
              </View>
              <View style={styles.tourInfoRow}>
                <Text style={styles.tourInfoItem}>💰 Tổng thưởng: <Text style={{ fontWeight: '700', color: '#0369a1' }}>{tour.prize}</Text></Text>
                <Text style={styles.tourInfoItem}>👥 Quy mô: <Text style={{ fontWeight: '700' }}>{tour.teams}</Text></Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Thông báo', 'Đã ghi nhận đăng ký tham dự giải đấu!')}
                style={styles.tourActionBtn}
              >
                <Text style={styles.tourActionBtnText}>Xem Nhánh Đấu &amp; Đăng Ký</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* 4. TAB CỘNG ĐỒNG & TÌM ĐỐI (MATCHMAKING) */}
      {/* ============================================================ */}
      {activeTab === 'community' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.mainScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroHeading}>🤝 Ghép Kèo &amp; Tìm Đối Thủ</Text>
            <Text style={styles.heroDesc}>
              Bắt đối công bằng theo thang điểm phong độ (Fair Play), tìm người đá bù hoặc giao lưu cuối tuần.
            </Text>
          </View>

          {[
            {
              id: 'm1',
              team: 'FC Chiến Hữu Đà Nẵng',
              pitch: 'Cụm Sân Đại Nắng - Q.7',
              time: 'Tối nay 19:30 - 21:00',
              level: 'Kèo Nhẹ Dưỡng Sinh',
              need: 'Cần tìm 1 đối giao lưu 5-5',
            },
            {
              id: 'm2',
              team: 'Bình Thạnh United',
              pitch: 'Sân Lam Sơn - Quận 5',
              time: 'Thứ 4: 20:00 - 21:30',
              level: 'Trình Độ Trung Bình Khá',
              need: 'Chia tiền sân 50/50',
            },
          ].map((item) => (
            <View key={item.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchTeam}>{item.team}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{item.level}</Text>
                </View>
              </View>
              <Text style={styles.matchPitch}>📍 {item.pitch}</Text>
              <Text style={styles.matchTime}>⏰ {item.time}</Text>
              <Text style={styles.matchNeed}>💬 {item.need}</Text>

              <TouchableOpacity
                onPress={() => Alert.alert('Thành công', 'Đã gửi lời mời nhận kèo thi đấu!')}
                style={styles.matchAcceptBtn}
              >
                <Text style={styles.matchAcceptBtnText}>Nhận Kèo Giao Lưu ➜</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* 5. TAB HOẠT ĐỘNG CỦA TÔI (MY ACTIVITIES) */}
      {/* ============================================================ */}
      {activeTab === 'activities' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.mainScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          <View style={styles.profileHeaderCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>TU</Text>
            </View>
            <Text style={styles.profileName}>Cầu Thủ TurfZone Pro</Text>
            <Text style={styles.profileRole}>Vai trò: CẦU THỦ • Hạng Bạc VIP</Text>
            <View style={styles.profileStats}>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>12</Text>
                <Text style={styles.pStatSub}>Trận đã đá</Text>
              </View>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>83%</Text>
                <Text style={styles.pStatSub}>Tỉ lệ thắng</Text>
              </View>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>9.8</Text>
                <Text style={styles.pStatSub}>Điểm Uy Tín</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch Đặt Sân Sắp Tới</Text>
          </View>

          <View style={styles.bookingItemCard}>
            <View style={styles.bCardHeader}>
              <Text style={styles.bPitchName}>Cụm Sân Bóng Đá Đại Nắng</Text>
              <View style={styles.bStatusBadge}>
                <Text style={styles.bStatusText}>Đã xác nhận</Text>
              </View>
            </View>
            <Text style={styles.bDetailText}>📅 Hôm nay • 18:00 - 19:30 (Sân số 2 - Cỏ 7)</Text>
            <Text style={styles.bPriceText}>Đã đặt cọc: 100.000 đ (Chờ thanh toán nốt tại sân)</Text>
          </View>
        </ScrollView>
      )}

      {/* ============================================================ */}
      {/* 6. BOTTOM NAVIGATION DOCK (Chuẩn Mobile Navigation của web) */}
      {/* ============================================================ */}
      <View style={[styles.bottomNavDock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {[
          { id: 'booking', label: 'Đặt Sân', icon: '⚽' },
          { id: 'tournaments', label: 'Giải Đấu', icon: '🏆' },
          { id: 'community', label: 'Tìm Đối', icon: '🤝' },
          { id: 'activities', label: 'Hồ Sơ', icon: '👤' },
        ].map((tab) => {
          const isCurrent = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={styles.navItem}
              activeOpacity={0.7}
            >
              <Text style={[styles.navIcon, isCurrent && styles.navIconActive]}>{tab.icon}</Text>
              <Text style={[styles.navLabel, isCurrent && styles.navLabelActive]}>{tab.label}</Text>
              {isCurrent && <View style={styles.navActiveIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ============================================================ */}
      {/* 7. BOOKING MODAL (Chi tiết & Giữ chỗ sân) */}
      {/* ============================================================ */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedPitch?.name}</Text>
                <Text style={styles.modalSub}>{selectedPitch?.address}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowBookingModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.slotPickerTitle}>Chọn Khung Giờ Thi Đấu Hôm Nay:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotPickerScroll}>
              {['16:00 - 17:30', '17:30 - 19:00', '19:00 - 20:30', '20:30 - 22:00'].map((slot, index) => {
                const isSelected = selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedSlot(slot)}
                    style={[styles.modalSlotPill, isSelected && styles.modalSlotPillActive]}
                  >
                    <Text style={[styles.modalSlotText, isSelected && styles.modalSlotTextActive]}>{slot}</Text>
                    <Text style={[styles.modalSlotSub, isSelected && { color: '#e0f2fe' }]}>
                      {index === 1 || index === 2 ? '⭐ Ca Vàng' : 'Ca Thường'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalPricingCard}>
              <View>
                <Text style={styles.mPriceSub}>Tạm tính (1 ca 90 phút)</Text>
                <Text style={styles.mPriceVal}>
                  {((selectedPitch?.avgPricePerHour || 250000) * 1.5).toLocaleString('vi-VN')} đ
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowBookingModal(false);
                  Alert.alert('Thành Công', `Đã giữ chỗ thành công tại ${selectedPitch?.name} vào khung giờ ${selectedSlot}!`);
                }}
                style={styles.modalConfirmBtn}
              >
                <Text style={styles.modalConfirmText}>Xác Nhận Giữ Chỗ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

// ============================================================
// STYLESHEET (Tokens & Aesthetics chuẩn giao diện web Turfzone)
// ============================================================
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  proBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  mainScroll: {
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  liveIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 28,
  },
  heroHeadingHighlight: {
    color: '#0369a1',
  },
  heroDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 19,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0369a1',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  clearSearch: {
    fontSize: 16,
    color: '#94a3b8',
    padding: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  sportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sportPillActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0369a1',
  },
  sportPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sportPillTextActive: {
    color: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  pitchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  pitchImage: {
    width: '100%',
    height: 160,
  },
  pitchContent: {
    padding: 14,
  },
  pitchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pitchName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  ratingPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  pitchAddress: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  amenityTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  amenityTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  openTimeTag: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  pitchFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0369a1',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
  },
  bookingBtn: {
    backgroundColor: '#0369a1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookingBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  tourCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tourTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  tourBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tourBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tourInfoRow: {
    gap: 4,
    marginBottom: 12,
  },
  tourInfoItem: {
    fontSize: 13,
    color: '#475569',
  },
  tourActionBtn: {
    backgroundColor: '#0369a1',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  tourActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  matchCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchTeam: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  levelBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '700',
  },
  matchPitch: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  matchTime: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
  matchNeed: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  matchAcceptBtn: {
    marginTop: 12,
    backgroundColor: '#10b981',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  matchAcceptBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0369a1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileRole: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  pStatItem: {
    alignItems: 'center',
  },
  pStatVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0369a1',
  },
  pStatSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bookingItemCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bPitchName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  bStatusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  bDetailText: {
    fontSize: 13,
    color: '#475569',
  },
  bPriceText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  bottomNavDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 64,
    position: 'relative',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  navLabelActive: {
    color: '#0369a1',
    fontWeight: '800',
  },
  navActiveIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#0369a1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  slotPickerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  slotPickerScroll: {
    gap: 8,
    marginBottom: 16,
  },
  modalSlotPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalSlotPillActive: {
    backgroundColor: '#0369a1',
    borderColor: '#0284c7',
  },
  modalSlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  modalSlotTextActive: {
    color: '#ffffff',
  },
  modalSlotSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  modalPricingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mPriceSub: {
    fontSize: 11,
    color: '#64748b',
  },
  mPriceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0369a1',
  },
  modalConfirmBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
