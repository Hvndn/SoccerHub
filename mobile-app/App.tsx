import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  COLORS,
  useResponsiveLayout,
} from './src/theme/responsive';
import {
  API_URL,
  AuthUser,
  Pitch,
  BookingItem,
  MatchmakingPostItem,
  TournamentItem,
  FALLBACK_PITCHES,
  FALLBACK_BOOKINGS,
  FALLBACK_MATCHMAKING,
  FALLBACK_TOURNAMENTS,
} from './src/services/api';
import BookingTab from './src/components/BookingTab';
import ActivitiesTab from './src/components/ActivitiesTab';
import MatchmakingTab from './src/components/MatchmakingTab';
import TournamentsTab from './src/components/TournamentsTab';
import OwnerDashboardTab from './src/components/OwnerDashboardTab';

type NavTabId = 'booking' | 'activities' | 'community' | 'tournaments' | 'owner';

function MainApp() {
  const layout = useResponsiveLayout();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTabId>('booking');

  // Auth State (Defaults to logged-in demo player for instant frictionless experience, with inline switcher)
  const [token, setToken] = useState<string | null>('demo-jwt-token');
  const [user, setUser] = useState<AuthUser | null>({
    id: 1,
    fullName: 'Nguyễn Minh Quân',
    email: 'player@Turfzone.vn',
    phone: '0909123456',
    role: 'PLAYER',
    level: 'Đội Trưởng Phủi',
  });

  // Inline Account / Login Drawer in Header (NO MODAL!)
  const [showAuthDrawer, setShowAuthDrawer] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [loginEmail, setLoginEmail] = useState('player@Turfzone.vn');
  const [loginPassword, setLoginPassword] = useState('player123');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  // Live Data States (Synchronized with Spring Boot Backend + Fallback Seed)
  const [pitches, setPitches] = useState<Pitch[]>(FALLBACK_PITCHES);
  const [pitchesLoading, setPitchesLoading] = useState<boolean>(false);
  const [pitchesError, setPitchesError] = useState<string | null>(null);

  const [myBookings, setMyBookings] = useState<BookingItem[]>(FALLBACK_BOOKINGS);
  const [matchPosts, setMatchPosts] = useState<MatchmakingPostItem[]>(FALLBACK_MATCHMAKING);
  const [tournaments, setTournaments] = useState<TournamentItem[]>(FALLBACK_TOURNAMENTS);

  const fetchPitches = async () => {
    setPitchesLoading(true);
    setPitchesError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${API_URL}/pitches`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPitches(data);
        }
      }
    } catch {
      // Keep FALLBACK_PITCHES so UI never breaks when offline
    } finally {
      clearTimeout(timer);
      setPitchesLoading(false);
    }
  };

  const fetchAllBackendData = async (activeToken?: string | null) => {
    const authHeader: Record<string, string> = activeToken
      ? { Authorization: `Bearer ${activeToken}` }
      : {};

    // 1. Fetch Matchmaking Posts
    try {
      const res = await fetch(`${API_URL}/community/matchmaking-posts`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMatchPosts(data);
        }
      }
    } catch {
      // Keep FALLBACK_MATCHMAKING
    }

    // 2. Fetch Tournaments
    try {
      const res = await fetch(`${API_URL}/tournaments`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTournaments(data);
        }
      }
    } catch {
      // Keep FALLBACK_TOURNAMENTS
    }

    // 3. Fetch Bookings
    if (activeToken && activeToken !== 'demo-jwt-token') {
      try {
        const res = await fetch(`${API_URL}/pitches/bookings/search`, {
          headers: authHeader,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMyBookings(data);
          }
        }
      } catch {
        // Keep FALLBACK_BOOKINGS
      }
    }
  };

  useEffect(() => {
    fetchPitches();
    fetchAllBackendData(token);
  }, []);

  const handleDoLogin = async (customEmail?: string, customPass?: string, roleOverride?: string) => {
    const targetEmail = (customEmail ?? loginEmail).trim();
    const targetPass = customPass ?? loginPassword;

    setLoginBusy(true);
    setLoginMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.token) {
        setToken(data.token);
        setUser(data.user || { email: targetEmail, fullName: targetEmail.split('@')[0], role: roleOverride || 'PLAYER' });
        setLoginMessage(`✅ Đã kết nối tài khoản thực: ${targetEmail}`);
        fetchAllBackendData(data.token);
        if (data.user?.role === 'OWNER' || roleOverride === 'OWNER') {
          setActiveTab('owner');
        }
        return;
      }
    } catch {
      // Fallback to local profile switch
    } finally {
      setLoginBusy(false);
    }

    // Smooth local profile switch if backend auth is offline
    const isOwner = roleOverride === 'OWNER' || targetEmail.toLowerCase().includes('owner');
    setToken('demo-jwt-token');
    setUser({
      id: isOwner ? 2 : 1,
      fullName: isOwner ? 'Trần Quốc Tuấn (Chủ Sân)' : 'Nguyễn Minh Quân',
      email: targetEmail,
      phone: isOwner ? '0918888999' : '0909123456',
      role: isOwner ? 'OWNER' : 'PLAYER',
      level: isOwner ? 'Chủ Cụm Sân' : 'Đội Trưởng Phủi',
    });
    if (isOwner) {
      setActiveTab('owner');
    } else if (activeTab === 'owner') {
      setActiveTab('booking');
    }
    setLoginMessage(`✅ Đã chuyển sang tài khoản: ${isOwner ? 'Chủ Sân' : 'Cầu Thủ'} (${targetEmail})`);
  };

  const navItems: { id: NavTabId; label: string; shortLabel: string; icon: string; badge?: number }[] = [
    { id: 'booking', label: 'Đặt Sân Bóng', shortLabel: 'Đặt Sân', icon: '⚽' },
    {
      id: 'activities',
      label: 'Vé & Điểm Danh',
      shortLabel: 'Điểm Danh',
      icon: '📋',
      badge: myBookings.length,
    },
    {
      id: 'community',
      label: 'Chợ Kèo & SOS',
      shortLabel: 'Chợ Kèo',
      icon: '🤝',
      badge: matchPosts.filter((p) => p.postType === 'SOS' && p.status === 'OPEN').length,
    },
    { id: 'tournaments', label: 'Giải Đấu & BXH', shortLabel: 'Giải Đấu', icon: '🏆' },
    { id: 'owner', label: 'Quản Lý Sân', shortLabel: 'Chủ Sân', icon: '🏟️' },
  ];

  const notifications = [
    {
      id: 'n1',
      title: '⏱️ Nhắc giờ ra sân hôm nay (19:00 - 20:30)',
      desc: 'Sân 7A Chảo Lửa Pro • Hiện đã có 6/14 cầu thủ điểm danh Đi chắc chắn.',
      tab: 'activities' as NavTabId,
    },
    {
      id: 'n2',
      title: '🚨 SOS Thiếu Chân gần bạn: FC Bình Thạnh cần 2 vị trí',
      desc: 'Cần gấp 1 Thủ môn & 1 Tiền vệ lúc 18:30 tại Sân Gia Định Arena (Miễn phí tiền sân).',
      tab: 'community' as NavTabId,
    },
    {
      id: 'n3',
      title: '👑 Cập nhật Bảng Vua Phá Lưới Siêu Cúp Turfzone',
      desc: 'Nguyễn Quang Hải đang dẫn đầu danh sách Chiếc Giày Vàng với 7 bàn thắng.',
      tab: 'tournaments' as NavTabId,
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: layout.insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ============================================================ */}
      {/* 1. TOP NAVBAR (Đồng bộ 100% thương hiệu Turfzone Pro trên Web) */}
      {/* ============================================================ */}
      <View style={styles.navbarWrapper}>
        <View
          style={[
            styles.navbarInner,
            { paddingHorizontal: layout.horizontalPadding },
          ]}
        >
          {/* Left: Brand Logo */}
          <TouchableOpacity
            onPress={() => setActiveTab('booking')}
            activeOpacity={0.8}
            style={styles.brandRow}
          >
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>⚽</Text>
            </View>
            <View>
              <View style={styles.brandTitleWrap}>
                <Text style={styles.brandName}>Turfzone</Text>
                <View style={styles.proPill}>
                  <Text style={styles.proPillText}>Pro</Text>
                </View>
              </View>
              <Text style={styles.brandTagline}>Đặt Sân • Chợ Kèo • Giải Đấu</Text>
            </View>
          </TouchableOpacity>

          {/* Center Navigation Pills on Tablet / Desktop */}
          {!layout.isPhone && (
            <View style={styles.desktopNavRow}>
              {navItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setActiveTab(item.id)}
                    style={[styles.desktopNavPill, active && styles.desktopNavPillActive]}
                  >
                    <Text style={styles.desktopNavIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.desktopNavText,
                        active && styles.desktopNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Right: Notification Bell & Account Switcher */}
          <View style={styles.navRightRow}>
            <TouchableOpacity
              onPress={() => {
                setShowNotifDrawer(!showNotifDrawer);
                setShowAuthDrawer(false);
              }}
              style={[
                styles.iconBtn,
                showNotifDrawer && { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
              ]}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
              <View style={styles.redDot} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAuthDrawer(!showAuthDrawer);
                setShowNotifDrawer(false);
              }}
              style={styles.userPillBtn}
            >
              <View style={styles.userAvatarSmall}>
                <Text style={styles.userAvatarSmallText}>
                  {(user?.fullName || 'Q').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.userPillName} numberOfLines={1}>
                {user?.role === 'OWNER' ? 'Chủ Sân' : 'Cầu Thủ'} ▾
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INLINE NOTIFICATION PANEL (Không dùng Modal!) */}
        {showNotifDrawer && (
          <View
            style={[
              styles.inlineHeaderDrawer,
              { paddingHorizontal: layout.horizontalPadding },
            ]}
          >
            <View style={styles.drawerHeaderRow}>
              <Text style={styles.drawerTitle}>🔔 Thông Báo Trực Tiếp Từ Sân Bóng</Text>
              <TouchableOpacity onPress={() => setShowNotifDrawer(false)}>
                <Text style={styles.closeDrawerText}>Đóng ▲</Text>
              </TouchableOpacity>
            </View>
            {notifications.map((n) => (
              <TouchableOpacity
                key={n.id}
                onPress={() => {
                  setActiveTab(n.tab);
                  setShowNotifDrawer(false);
                }}
                style={styles.notifItemCard}
              >
                <Text style={styles.notifItemTitle}>{n.title}</Text>
                <Text style={styles.notifItemDesc}>{n.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* INLINE ACCOUNT & ROLE SWITCHER PANEL (Không dùng Modal!) */}
        {showAuthDrawer && (
          <View
            style={[
              styles.inlineHeaderDrawer,
              { paddingHorizontal: layout.horizontalPadding },
            ]}
          >
            <View style={styles.drawerHeaderRow}>
              <Text style={styles.drawerTitle}>
                👤 Tài Khoản Đang Dùng: {user?.fullName} ({user?.email})
              </Text>
              <TouchableOpacity onPress={() => setShowAuthDrawer(false)}>
                <Text style={styles.closeDrawerText}>Đóng ▲</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerSub}>
              Chuyển nhanh vai trò trải nghiệm 1 chạm (Cầu Thủ Đặt Sân hoặc Chủ Sân Quản Lý):
            </Text>

            <View style={styles.wrapRow}>
              <TouchableOpacity
                onPress={() => {
                  setLoginEmail('player@Turfzone.vn');
                  setLoginPassword('player123');
                  handleDoLogin('player@Turfzone.vn', 'player123', 'PLAYER');
                }}
                style={[
                  styles.roleSwitchBtn,
                  user?.role !== 'OWNER' && styles.roleSwitchBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleSwitchBtnText,
                    user?.role !== 'OWNER' && styles.roleSwitchBtnTextActive,
                  ]}
                >
                  ⚽ Chế Độ Cầu Thủ (player@Turfzone.vn)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setLoginEmail('owner@Turfzone.vn');
                  setLoginPassword('owner123');
                  handleDoLogin('owner@Turfzone.vn', 'owner123', 'OWNER');
                }}
                style={[
                  styles.roleSwitchBtn,
                  user?.role === 'OWNER' && styles.roleSwitchBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.roleSwitchBtnText,
                    user?.role === 'OWNER' && styles.roleSwitchBtnTextActive,
                  ]}
                >
                  🏟️ Chế Độ Chủ Sân (owner@Turfzone.vn)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Login Form */}
            <View style={styles.inlineLoginInputs}>
              <TextInput
                value={loginEmail}
                onChangeText={setLoginEmail}
                autoCapitalize="none"
                placeholder="Email đăng nhập..."
                style={[styles.authInput, { flex: 1, minWidth: 160 }]}
              />
              <TextInput
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                placeholder="Mật khẩu..."
                style={[styles.authInput, { flex: 1, minWidth: 120 }]}
              />
              <TouchableOpacity
                onPress={() => handleDoLogin()}
                disabled={loginBusy}
                style={styles.authSubmitBtn}
              >
                <Text style={styles.authSubmitBtnText}>
                  {loginBusy ? 'Đang kết nối...' : 'Đăng Nhập'}
                </Text>
              </TouchableOpacity>
            </View>

            {loginMessage && (
              <Text style={styles.loginFeedbackText}>{loginMessage}</Text>
            )}
          </View>
        )}
      </View>

      {/* ============================================================ */}
      {/* 2. BODY CONTENT (Bọc trong KeyboardAvoidingView chuẩn Mobile) */}
      {/* ============================================================ */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(layout.insets.bottom, 16) + 84 },
          ]}
        >
          {activeTab === 'booking' && (
            <BookingTab
              pitches={pitches}
              loading={pitchesLoading}
              error={pitchesError}
              onRetryPitches={fetchPitches}
              user={user}
              token={token}
              onBookingSuccess={(newB) => setMyBookings((prev) => [newB, ...prev])}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'activities' && (
            <ActivitiesTab
              user={user}
              token={token}
              bookings={myBookings}
              onUpdateBookings={setMyBookings}
              onBroadcastSosSuccess={(newSos) =>
                setMatchPosts((prev) => [newSos, ...prev])
              }
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'community' && (
            <MatchmakingTab
              user={user}
              token={token}
              posts={matchPosts}
              onUpdatePosts={setMatchPosts}
            />
          )}

          {activeTab === 'tournaments' && (
            <TournamentsTab
              user={user}
              token={token}
              tournaments={tournaments}
              onUpdateTournaments={setTournaments}
            />
          )}

          {activeTab === 'owner' && (
            <OwnerDashboardTab
              user={user}
              pitches={pitches}
              bookings={myBookings}
              onUpdateBookings={setMyBookings}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================================ */}
      {/* 3. BOTTOM NAVIGATION BAR (Responsive cho Điện Thoại) */}
      {/* ============================================================ */}
      {layout.isPhone && (
        <View
          style={[
            styles.bottomNav,
            { paddingBottom: Math.max(layout.insets.bottom, 8) },
          ]}
        >
          {navItems.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={styles.bottomNavItem}
                activeOpacity={0.75}
              >
                <View style={styles.bottomIconWrap}>
                  <Text
                    style={[
                      styles.bottomNavIcon,
                      isCurrent && styles.bottomNavIconActive,
                    ]}
                  >
                    {tab.icon}
                  </Text>
                  {tab.badge && tab.badge > 0 ? (
                    <View
                      style={[
                        styles.navBadge,
                        tab.id === 'community' && { backgroundColor: COLORS.rose },
                      ]}
                    >
                      <Text style={styles.navBadgeText}>{tab.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.bottomNavLabel,
                    isCurrent && styles.bottomNavLabelActive,
                  ]}
                >
                  {tab.shortLabel}
                </Text>
                {isCurrent && <View style={styles.bottomActiveBar} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  navbarWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    zIndex: 20,
    elevation: 3,
  },
  navbarInner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 20,
  },
  brandTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  proPill: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proPillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  brandTagline: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  desktopNavRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  desktopNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  desktopNavPillActive: {
    backgroundColor: COLORS.primary,
  },
  desktopNavIcon: {
    fontSize: 14,
  },
  desktopNavText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  desktopNavTextActive: {
    color: COLORS.white,
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.rose,
  },
  userPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    minHeight: 40,
  },
  userAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarSmallText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  userPillName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  inlineHeaderDrawer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingVertical: 12,
    gap: 10,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    flex: 1,
  },
  closeDrawerText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  drawerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  notifItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 2,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  notifItemDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  roleSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleSwitchBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleSwitchBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  roleSwitchBtnTextActive: {
    color: COLORS.white,
  },
  inlineLoginInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  authInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 40,
  },
  authSubmitBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  authSubmitBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  loginFeedbackText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  scrollContent: {
    paddingTop: 14,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    flex: 1,
    position: 'relative',
  },
  bottomIconWrap: {
    position: 'relative',
  },
  bottomNavIcon: {
    fontSize: 19,
    opacity: 0.55,
  },
  bottomNavIconActive: {
    opacity: 1,
  },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
  },
  navBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  bottomNavLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  bottomActiveBar: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
