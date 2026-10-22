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
/**
 * Backend API URL.
 *
 * Thu tu tu suy ra dia chi may chay Expo (expo-constants) de app luon goi dung
 * backend o may phat trien, khong can sua code moi khi doi mang.
 *
 * - EXPO_PUBLIC_API_URL (env) -> dung cho ban build that (Render/Vercel).
 * - hostUri cua Expo: '192.168.x.x:8081' -> lay IP; 'https://xxx.exp.direct' (tunnel)
 *   -> lay hostname. Truoc day tach theo ':' lay duoc 'https' -> URL sai.
 * - simulator iOS / Expo Go tren cung may -> localhost.
 */
function resolveApiUrl(): string {
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
      // Tunnel: https://abc.exp.direct -> lay hostname (khong phai 'https').
      const host = raw.startsWith('http') ? new URL(raw).hostname : raw.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:8080/api/v1`;
      }
    }
  } catch {
    // Khong co expo-constants -> dung localhost.
  }
  return 'http://localhost:8080/api/v1';
}

const API_URL = resolveApiUrl();

/** Ngay hom nay theo gio VIET NAM (UTC+7) — khong dung toISOString() (UTC). */
function todayLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Mot ca san trong ma tran (chi lay ca con TRONG). */
interface FreeSlot {
  time: string;
  courtName: string;
  courtType: string;
  price: number;
  peak: boolean;
}

interface MatrixCourt {
  pitchId?: string | number;
  pitchName: string;
  type?: string;
  slots: { time: string; status: string; priceValue?: number; price?: string; note?: string }[];
}

interface AuthUser {
  id?: number;
  fullName?: string;
  email: string;
  phone?: string;
  role?: string;
  level?: string;
}

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

/**
 * Man hinh dang nhap — BAT BUOC de dat san (backend yeu cau token).
 * Truoc day app khong co dang nhap: bam "Xac Nhan Giu Cho" chi hien mot Alert
 * gia ma (khong goi API) nguoi dung tin rang da giu cho.
 */
function LoginScreen({
  email, setEmail, password, setPassword, busy, error, onLogin, insets,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  error: string | null;
  onLogin: () => void;
  insets: { top: number; bottom: number };
}) {
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={{ padding: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚽</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>TURFZONE</Text>
            <Text style={styles.brandSubtitle}>Đăng nhập để đặt sân</Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="ban@Turfzone.vn"
          style={{
            borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 14,
            paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fff',
          }}
        />

        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>Mật khẩu</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          style={{
            borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 14,
            paddingVertical: 12, fontSize: 14, color: '#0f172a', backgroundColor: '#fff',
          }}
        />

        {error ? (
          <Text style={{ color: '#b91c1c', fontSize: 13, fontWeight: '700' }}>{error}</Text>
        ) : null}

        <TouchableOpacity
          onPress={onLogin}
          disabled={busy}
          style={{
            backgroundColor: '#0369a1', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
            {busy ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 18 }}>
          Tài khoản demo: player@Turfzone.vn / player123 — chủ sân: owner@Turfzone.vn / owner123
        </Text>
      </View>
    </View>
  );
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
  const [error, setError] = useState<string | null>(null);
  // Đăng nhập: token JWT giữ trong bộ nhớ của app (đặt sân cần xác thực).
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('player@Turfzone.vn');
  const [loginPassword, setLoginPassword] = useState('player123');

  // Ma tran ca that cu cum san dang chon + ca dang chon
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ code: string; total: number } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Du lieu THAT tu backend (thay cho du lieu gia nham).
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [keoPosts, setKeoPosts] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [tabBusy, setTabBusy] = useState(false);

  const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

  const fetchTournaments = async () => {
    try {
      const res = await fetch(`${API_URL}/tournaments`);
      if (!res.ok) return;
      const data = await res.json();
      setTournaments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Lỗi tải giải đấu:', e?.message);
    }
  };

  const fetchKeo = async () => {
    try {
      const res = await fetch(`${API_URL}/community/matchmaking-posts`);
      if (!res.ok) return;
      const data = await res.json();
      setKeoPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Lỗi tải chợ kèo:', e?.message);
    }
  };

  const fetchMyBookings = async () => {
    if (!token) {
      setMyBookings([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/pitches/bookings/search`, {
        headers: { ...authHeaders() },
      });
      if (!res.ok) {
        setMyBookings([]);
        return;
      }
      const data = await res.json();
      setMyBookings(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Lỗi tải đơn của tôi:', e?.message);
    }
  };

  // Nhan keo that (backend ghi doi truong + phong do).
  const acceptKeo = async (post: any) => {
    if (!token) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để nhận kèo.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/community/matchmaking-posts/${post.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          opponentTeamName: `FC ${user?.fullName || user?.email || 'Khách'}`,
          opponentCaptainName: user?.fullName || user?.email || 'Khách',
          opponentCaptainPhone: user?.phone || '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Không nhận được kèo', data?.message || 'Vui lòng thử lại.');
        return;
      }
      Alert.alert('Thành công', data?.message || 'Đã nhận kèo thành công!');
      fetchKeo();
    } catch (e: any) {
      Alert.alert('Lỗi', 'Không kết nối được máy chủ.');
    }
  };

  // Nap du lieu theo tab + sau khi dang nhap.
  useEffect(() => {
    if (!token) return;
    setTabBusy(true);
    Promise.all([fetchTournaments(), fetchKeo(), fetchMyBookings()]).finally(() => setTabBusy(false));
  }, [token, activeTab]);

  // Detail Modal / Booking Modal State
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<FreeSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch real pitch data from Spring Boot backend (như web)
  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
  setLoading(true);
  setError(null);
  try {
  // Timeout 12s: tranh spinner vo han khi backend treo.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
  const res = await fetch(`${API_URL}/pitches`, { signal: controller.signal });
  if (!res.ok) throw new Error(`Máy chủ trả về ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) {
  setPitches(data);
  return;
  }
  setError('Máy chủ trả về dữ liệu không hợp lệ.');
  } finally {
  clearTimeout(timer);
  }
  } catch (e: any) {
  console.log('Lỗi tải danh sách sân:', e?.message);
  setError(
  e?.name === 'AbortError'
  ? 'Máy chủ phản hồi quá chậm. Kiểm tra kết nối rồi thử lại.'
  : 'Không kết nối được máy chủ dữ liệu sân.'
  );
  setPitches([]);
  } finally {
  setLoading(false);
  }
  };
  // Lọc sân theo tìm kiếm và môn thể thao
  // Nap ma tran that cu cum san va lay danh sach ca CON TRONG.
  const loadFreeSlots = async (pitchId: number) => {
    setSlotsLoading(true);
    setFreeSlots([]);
    try {
      const res = await fetch(`${API_URL}/pitches/${pitchId}/matrix?date=${todayLocal()}`);
      if (!res.ok) throw new Error(`Máy chủ trả về ${res.status}`);
      const courts = (await res.json()) as MatrixCourt[];
      const list: FreeSlot[] = [];
      (Array.isArray(courts) ? courts : []).forEach((c) => {
        (c.slots || []).forEach((s) => {
          if (s.status !== 'empty') return;
          const startHour = Number(String(s.time).split(':')[0]);
          list.push({
            time: s.time,
            courtName: c.pitchName,
            courtType: c.type || 'Sân 7',
            price: Number(s.priceValue ?? 0),
            peak: startHour === 17 || startHour === 18 || startHour === 19,
          });
        });
      });
      setFreeSlots(list);
    } catch (e: any) {
      console.log('Lỗi tải ma trận ca:', e?.message);
      setError('Không tải được lịch ca sân. Thử lại sau.');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Đăng nhập: lấy JWT từ backend.
  const doLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoginBusy(true);
    setLoginError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data?.message || 'Đăng nhập không thành công.');
        return;
      }
      setToken(data.token);
      setUser(data.user ?? null);
    } catch (e: any) {
      setLoginError('Không kết nối được máy chủ. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setLoginBusy(false);
    }
  };

  // Đặt sân THẬT: gọi POST /pitches/{id}/book (server tự tính giá + cọc).
  const confirmBooking = async () => {
    if (!selectedPitch || !selectedSlot) {
      setBookingError('Vui lòng chọn một khung giờ còn trống.');
      return;
    }
    if (!token) {
      setBookingError('Bạn cần đăng nhập để đặt sân.');
      return;
    }
    if (!user?.phone) {
      setBookingError('Tài khoản chưa có số điện thoại — hãy cập nhật hồ sơ trước khi đặt sân.');
      return;
    }
    setBookingBusy(true);
    setBookingError(null);
    try {
      const res = await fetch(`${API_URL}/pitches/${selectedPitch.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          courtName: selectedSlot.courtName,
          courtType: selectedSlot.courtType,
          timeSlot: selectedSlot.time,
          bookingDate: todayLocal(),
          customerName: user?.fullName || user?.email || 'Khách',
          customerPhone: user?.phone,
          depositPercent: 50,
          via: 'Đặt qua Website',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(null);
        setBookingError(data?.message || 'Không đặt được ca này. Vui lòng chọn giờ khác.');
        return;
      }
      setBookingResult({ code: data.code || '', total: Number(data.totalPrice ?? 0) });
      await fetchPitches();
    } catch (e: any) {
      setBookingError('Không kết nối được máy chủ. Thử lại sau.');
    } finally {
      setBookingBusy(false);
    }
  };

  const filteredPitches = pitches.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchName = (p.name ?? '').toLowerCase().includes(q) ||
                      (p.address ?? '').toLowerCase().includes(q);
    if (selectedSport === 'SAN_5') return matchName && p.pitchTypes?.includes('SAN_5');
    if (selectedSport === 'SAN_7') return matchName && p.pitchTypes?.includes('SAN_7');
    if (selectedSport === 'FUTSAL') return matchName && p.pitchTypes?.includes('FUTSAL');
    return matchName;
  });

  // Chua dang nhap -> chi hien man hinh dang nhap (dat san can token).
  if (!token) {
  return (
  <LoginScreen
  email={loginEmail}
  setEmail={setLoginEmail}
  password={loginPassword}
  setPassword={setLoginPassword}
  busy={loginBusy}
  error={loginError}
  onLogin={doLogin}
  insets={insets}
  />
  );
  }

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
                {pitches.length}+
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

          {error ? (
            <View style={{
              backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
              borderRadius: 14, padding: 12, marginBottom: 12,
            }}>
              <Text style={{ color: '#b91c1c', fontSize: 13, fontWeight: '700' }}>{error}</Text>
              <TouchableOpacity onPress={fetchPitches} style={{ marginTop: 8 }}>
                <Text style={{ color: '#0369a1', fontSize: 13, fontWeight: '800' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
                  setSelectedSlot(null);
                  setBookingError(null);
                  setBookingResult(null);
                  loadFreeSlots(item.id);
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
                      <Text style={styles.ratingPillText}>⭐ {Number(item.rating ?? 0).toFixed(1)}</Text>
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

          {tournaments.length === 0 ? (
            <Text style={styles.heroDesc}>
              {tabBusy ? 'Đang tải giải đấu...' : 'Chưa có giải đấu nào trên hệ thống.'}
            </Text>
          ) : (
            tournaments.map((tour: any) => (
              <View key={tour.id} style={styles.tourCard}>
                <View style={styles.tourHeader}>
                  <Text style={styles.tourTitle}>{tour.title}</Text>
                  <View
                    style={[
                      styles.tourBadge,
                      { backgroundColor: (tour.status === 'OPEN' ? '#10b981' : '#f59e0b') + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tourBadgeText,
                        { color: tour.status === 'OPEN' ? '#10b981' : '#f59e0b' },
                      ]}
                    >
                      {tour.status === 'OPEN' ? 'Đang mở' : tour.status === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc'}
                    </Text>
                  </View>
                </View>
                <View style={styles.tourInfoRow}>
                  <Text style={styles.tourInfoItem}>
                    💰 Thưởng:{' '}
                    <Text style={{ fontWeight: '700', color: '#0369a1' }}>
                      {Number(tour.prizePool ?? 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </Text>
                  <Text style={styles.tourInfoItem}>
                    👥 Quy mô:{' '}
                    <Text style={{ fontWeight: '700' }}>{tour.totalTeams ?? 0} đội</Text>
                  </Text>
                </View>
                <Text style={styles.tourInfoItem}>
                  📍 {tour.pitchName || tour.location || 'Chưa chọn sân'}
                </Text>
              </View>
            ))
          )}
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

          {keoPosts.length === 0 ? (
            <Text style={styles.heroDesc}>
              {tabBusy ? 'Đang tải chợ kèo...' : 'Chưa có kèo nào đang mở trên sàn.'}
            </Text>
          ) : (
            keoPosts.map((post: any) => (
              <View key={post.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTeam}>{post.teamName || 'Kèo giao lưu'}</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>
                      {post.pitchType === 'SAN_5' ? 'Sân 5' : post.pitchType === 'SAN_11' ? 'Sân 11' : post.pitchType === 'FUTSAL' ? 'Futsal' : 'Sân 7'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.matchPitch}>📍 {post.pitchName || 'Chưa chọn sân'}</Text>
                <Text style={styles.matchTime}>⏰ {post.matchTime || 'Thỏa thuận'}</Text>
                <Text style={styles.matchNeed}>
                  💬 {post.paymentModel === 'LOSER_PAYS' ? 'Đội thua chịu sân' : post.paymentModel === 'HOST_COVER' ? 'Chủ kèo bao trọn gói' : 'Chia tiền sân 50/50'}
                  {post.estimatedFee ? ` • ${Number(post.estimatedFee).toLocaleString('vi-VN')}đ/người` : ''}
                </Text>

                <TouchableOpacity
                  onPress={() => acceptKeo(post)}
                  style={styles.matchAcceptBtn}
                >
                  <Text style={styles.matchAcceptBtnText}>Nhận Kèo Giao Lưu ➜</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
              <Text style={styles.avatarLargeText}>
                {(user?.fullName || user?.email || 'T').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.profileName}>{user?.fullName || user?.email || 'Cầu Thủ'}</Text>
            <Text style={styles.profileRole}>
              Vai trò: {(user?.role || 'PLAYER').toUpperCase()} • {user?.level || 'Chưa xếp bậc'}
            </Text>
            <View style={styles.profileStats}>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>{myBookings.length}</Text>
                <Text style={styles.pStatSub}>Đơn đã đặt</Text>
              </View>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>
                  {myBookings.reduce((s: number, b: any) => s + Number(b.depositPaid ?? 0), 0).toLocaleString('vi-VN')}
                </Text>
                <Text style={styles.pStatSub}>Tổng tiền cọc</Text>
              </View>
              <View style={styles.pStatItem}>
                <Text style={styles.pStatVal}>
                  {myBookings.filter((b: any) => b.status === 'PLAYING' || b.status === 'COMPLETED').length}
                </Text>
                <Text style={styles.pStatSub}>Đã vào sân</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lịch Đặt Sân Sắp Tới</Text>
          </View>

          {myBookings.length === 0 ? (
            <Text style={styles.heroDesc}>
              {tabBusy ? 'Đang tải đơn...' : 'Bạn chưa có đơn đặt sân nào.'}
            </Text>
          ) : (
            myBookings.map((b: any) => (
              <View key={b.id} style={styles.bookingItemCard}>
                <View style={styles.bCardHeader}>
                  <Text style={styles.bPitchName}>{b.courtName || 'Cụm sân'}</Text>
                  <View style={styles.bStatusBadge}>
                    <Text style={styles.bStatusText}>
                      {b.status === 'BOOKED' ? 'Đã đặt' : b.status === 'PLAYING' ? 'Đang đá' : b.status === 'COMPLETED' ? 'Hoàn tất' : b.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bDetailText}>
                  📅 {b.bookingDate} • {b.timeSlot}
                </Text>
                <Text style={styles.bPriceText}>
                  Đã cọc: {Number(b.depositPaid ?? 0).toLocaleString('vi-VN')} đ
                  {Number(b.cashDue ?? 0) > 0
                    ? ` (Còn ${Number(b.cashDue).toLocaleString('vi-VN')} đ tại quầy)`
                    : ' (Đã thanh toán đủ)'}
                </Text>
              </View>
            ))
          )}
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

            <Text style={styles.slotPickerTitle}>Chọn Khung Giờ Trống Hôm Nay:</Text>
            {slotsLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#0369a1" />
                <Text style={styles.loadingText}>Đang tải lịch ca sân...</Text>
              </View>
            ) : freeSlots.length === 0 ? (
              <Text style={styles.modalSub}>Hôm nay cụm sân này đã kín ca. Vui lòng thử ngày khác.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.slotPickerScroll}>
                {freeSlots.map((slot, index) => {
                  const isSelected = selectedSlot?.time === slot.time && selectedSlot?.courtName === slot.courtName;
                  return (
                    <TouchableOpacity
                      key={`${slot.courtName}-${slot.time}-${index}`}
                      onPress={() => { setSelectedSlot(slot); setBookingError(null); }}
                      style={[styles.modalSlotPill, isSelected && styles.modalSlotPillActive]}
                    >
                      <Text style={[styles.modalSlotText, isSelected && styles.modalSlotTextActive]}>{slot.time}</Text>
                      <Text style={[styles.modalSlotSub, isSelected && { color: '#e0f2fe' }]}>
                        {slot.peak ? '⭐ Ca Vàng' : 'Ca Thường'}
                      </Text>
                      <Text style={[styles.modalSlotSub, isSelected && { color: '#e0f2fe' }]}>
                        {slot.price.toLocaleString('vi-VN')}đ
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {bookingError ? (
              <Text style={{ color: '#b91c1c', fontSize: 13, fontWeight: '700', marginTop: 8 }}>{bookingError}</Text>
            ) : null}

            {bookingResult ? (
              <View style={[styles.modalPricingCard, { marginTop: 10 }]}>
                <View>
                  <Text style={styles.mPriceSub}>Đã giữ chỗ thành công</Text>
                  <Text style={styles.mPriceVal}>Mã {bookingResult.code}</Text>
                  <Text style={styles.mPriceSub}>Tổng tiền ca: {bookingResult.total.toLocaleString('vi-VN')}đ</Text>
                </View>
              </View>
            ) : (
              <View style={styles.modalPricingCard}>
                <View>
                  <Text style={styles.mPriceSub}>
                    {selectedSlot ? `Giá ca (${selectedSlot.courtName})` : 'Chọn khung giờ để xem giá'}
                  </Text>
                  <Text style={styles.mPriceVal}>
                    {selectedSlot ? `${selectedSlot.price.toLocaleString('vi-VN')} đ` : '—'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={confirmBooking}
                  disabled={bookingBusy || !selectedSlot}
                  style={[styles.modalConfirmBtn, (bookingBusy || !selectedSlot) && { opacity: 0.55 }]}
                >
                  <Text style={styles.modalConfirmText}>
                    {bookingBusy ? 'Đang giữ chỗ...' : 'Xác Nhận Giữ Chỗ'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    fontSize: 13,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  openTimeTag: {
    fontSize: 13,
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
    fontSize: 13,
    color: '#64748b',
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0369a1',
  },
  priceUnit: {
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  bDetailText: {
    fontSize: 13,
    color: '#475569',
  },
  bPriceText: {
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
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
