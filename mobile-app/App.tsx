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
  normalizePitchItem,
} from './src/services/api';
import BookingTab from './src/components/BookingTab';
import ActivitiesTab from './src/components/ActivitiesTab';
import MatchmakingTab from './src/components/MatchmakingTab';
import CommunityHubTab from './src/components/CommunityHubTab';
import TournamentsTab from './src/components/TournamentsTab';
import OwnerDashboardTab from './src/components/OwnerDashboardTab';
import ProfileAndClubsTab from './src/components/ProfileAndClubsTab';

export type WebNavTabId =
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

function MainApp() {
  const layout = useResponsiveLayout();

  // Active Navigation Tab (100% synchronized with Web page.tsx & Navbar.tsx)
  const [activeTab, setActiveTab] = useState<WebNavTabId>('booking');

  // Auth State (Synchronized with Web page.tsx default player account)
  const [token, setToken] = useState<string | null>('demo-jwt-token');
  const [user, setUser] = useState<AuthUser | null>({
    id: 1,
    fullName: 'Nguyễn Văn Cầu Thủ',
    name: 'Nguyễn Văn Cầu Thủ',
    email: 'player@Turfzone.vn',
    phone: '0905123456',
    role: 'PLAYER',
    level: 'Cầu Thủ Đặt Sân',
  });

  // Inline Header Drawers (NO MODAL!)
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [loginEmail, setLoginEmail] = useState('player@Turfzone.vn');
  const [loginPassword, setLoginPassword] = useState('player123');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  // Live Data States (Synchronized with Spring Boot Backend + Đà Nẵng Fallback Seed)
  const [pitches, setPitches] = useState<Pitch[]>(FALLBACK_PITCHES);
  const [pitchesLoading, setPitchesLoading] = useState<boolean>(false);
  const [pitchesError, setPitchesError] = useState<string | null>(null);

  const [myBookings, setMyBookings] = useState<BookingItem[]>(FALLBACK_BOOKINGS);
  const [matchPosts, setMatchPosts] = useState<MatchmakingPostItem[]>(FALLBACK_MATCHMAKING);
  const [tournaments, setTournaments] = useState<TournamentItem[]>(FALLBACK_TOURNAMENTS);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Đặt sân thành công',
      desc: 'Sân 7A (Cụm Sân Bóng Đá Đại Nắng) lúc 18:00 hôm nay đã được giữ chỗ.',
      time: 'Vừa xong',
      unread: true,
      targetTab: 'my-activities' as WebNavTabId,
    },
    {
      id: 2,
      title: 'Kèo giao hữu mới gần bạn',
      desc: 'FC Anh Em Văn Phòng Hải Châu vừa đăng tìm đối thủ Sân 7 (50/50) tối nay.',
      time: '15 phút trước',
      unread: true,
      targetTab: 'matchmaking' as WebNavTabId,
    },
    {
      id: 3,
      title: 'Giải đấu đang mở đăng ký',
      desc: 'Siêu Cúp Bóng Đá Phủi Đà Nẵng Mở Rộng 2026 còn 4 suất đăng ký cuối cùng.',
      time: '1 giờ trước',
      unread: false,
      targetTab: 'tournaments' as WebNavTabId,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

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
          setPitches(data.map((item, idx) => normalizePitchItem(item, idx)));
        }
      }
    } catch {
      // Keep FALLBACK_PITCHES (Đà Nẵng)
    } finally {
      clearTimeout(timer);
      setPitchesLoading(false);
    }
  };

  const fetchAllBackendData = async (activeToken?: string | null) => {
    const authHeader: Record<string, string> = activeToken
      ? { Authorization: `Bearer ${activeToken}` }
      : {};

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

  const navigateToTab = (nextTab: WebNavTabId) => {
    // Normalize legacy aliases
    const resolved: WebNavTabId =
      nextTab === 'activities'
        ? 'my-activities'
        : nextTab === 'owner'
        ? 'admin'
        : nextTab;
    setActiveTab(resolved);
    setShowHamburgerMenu(false);
    setShowNotifDrawer(false);
    setShowUserDropdown(false);
  };

  const handleSwitchRoleOrLogin = async (
    targetEmail: string,
    targetPass: string,
    roleOverride: 'PLAYER' | 'OWNER' | 'ORGANIZER' | 'GUEST'
  ) => {
    if (roleOverride === 'GUEST') {
      setToken(null);
      setUser({
        id: 0,
        fullName: 'Khách Tham Quan',
        name: 'Khách Tham Quan',
        email: '',
        role: 'GUEST',
      });
      setActiveTab('booking');
      setLoginMessage('Đã chuyển sang chế độ Khách (Hiển thị Trang chủ giới thiệu + Đặt sân).');
      return;
    }

    setLoginBusy(true);
    setLoginMessage(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim(), password: targetPass }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.token) {
        setToken(data.token);
        const resolvedRole = data.user?.role || roleOverride;
        setUser({
          id: data.user?.id || 1,
          fullName: data.user?.fullName || data.user?.name || targetEmail.split('@')[0],
          name: data.user?.fullName || data.user?.name || targetEmail.split('@')[0],
          email: targetEmail,
          phone: data.user?.phone || '0905123456',
          role: resolvedRole,
        });
        fetchAllBackendData(data.token);
        setActiveTab(
          resolvedRole === 'OWNER'
            ? 'admin'
            : resolvedRole === 'ORGANIZER'
            ? 'organizer'
            : 'booking'
        );
        setLoginMessage(`✓ Đã kết nối tài khoản: ${targetEmail}`);
        return;
      }
    } catch {
      // Fallback local role switch
    } finally {
      setLoginBusy(false);
    }

    setToken('demo-jwt-token');
    if (roleOverride === 'OWNER') {
      setUser({
        id: 2,
        fullName: 'Trần Quốc Tuấn (Chủ Sân)',
        name: 'Trần Quốc Tuấn (Chủ Sân)',
        email: 'owner@Turfzone.vn',
        phone: '0905888999',
        role: 'OWNER',
        level: 'Đối Tác Chủ Sân',
      });
      setActiveTab('admin');
      setLoginMessage('✓ Đã chuyển sang giao diện Đối Tác Chủ Sân');
    } else if (roleOverride === 'ORGANIZER') {
      setUser({
        id: 3,
        fullName: 'Lê Hoàng Minh (BTC Giải)',
        name: 'Lê Hoàng Minh (BTC Giải)',
        email: 'btc@Turfzone.vn',
        phone: '0905777888',
        role: 'ORGANIZER',
        level: 'Ban Tổ Chức Giải',
      });
      setActiveTab('organizer');
      setLoginMessage('✓ Đã chuyển sang giao diện Ban Tổ Chức Giải');
    } else {
      setUser({
        id: 1,
        fullName: 'Nguyễn Văn Cầu Thủ',
        name: 'Nguyễn Văn Cầu Thủ',
        email: targetEmail || 'player@Turfzone.vn',
        phone: '0905123456',
        role: 'PLAYER',
        level: 'Cầu Thủ Đặt Sân',
      });
      setActiveTab('booking');
      setLoginMessage('✓ Đã chuyển sang giao diện Cầu Thủ Đặt Sân');
    }
  };

  const role = user?.role || 'PLAYER';
  const isGuest = !user || role === 'GUEST' || !user.email;

  // Desktop/Tablet Top Nav Items (Matches Navbar.tsx 100%)
  const topNavItems: { id: WebNavTabId; label: string; badge?: string }[] =
    role === 'OWNER'
      ? [
          { id: 'admin', label: 'Quản Lý Cụm Sân' },
          { id: 'multi-sport', label: 'Sơ Đồ Sân' },
          { id: 'organizer', label: 'Điều Hành Giải Đấu' },
          { id: 'community', label: 'Cộng Đồng' },
          { id: 'profile', label: 'Hồ Sơ Cá Nhân' },
        ]
      : role === 'ORGANIZER'
      ? [
          { id: 'organizer', label: 'Điều Hành Giải Đấu', badge: 'BTC' },
          { id: 'tournaments', label: 'Giải Đấu & BXH' },
          { id: 'community', label: 'Cộng Đồng' },
          { id: 'profile', label: 'Hồ Sơ Ban Tổ Chức' },
        ]
      : [
          { id: 'booking', label: 'Đặt Sân' },
          { id: 'matchmaking', label: 'Chợ Kèo', badge: 'Hot' },
          { id: 'community', label: 'Cộng Đồng' },
          { id: 'tournaments', label: 'Giải Đấu' },
          { id: 'team-management', label: 'Đội Bóng' },
          { id: 'membership', label: 'Thẻ Hội Viên' },
        ];

  // Mobile Bottom Navigation Bar (Matches Navbar.tsx lines 696-749 100%)
  const bottomNavItems: { id: WebNavTabId; label: string; icon: string; badge?: string }[] =
    role === 'OWNER'
      ? [
          { id: 'admin', label: 'Quản lý', icon: '🏟️' },
          { id: 'multi-sport', label: 'Sơ đồ sân', icon: '📅' },
          { id: 'organizer', label: 'Giải đấu', icon: '🏆' },
          { id: 'community', label: 'Cộng Đồng', icon: '💬' },
          { id: 'profile', label: 'Hồ sơ', icon: '👤' },
        ]
      : role === 'ORGANIZER'
      ? [
          { id: 'organizer', label: 'Điều hành', icon: '🛡️' },
          { id: 'tournaments', label: 'BXH Giải', icon: '🏆' },
          { id: 'community', label: 'Cộng Đồng', icon: '💬' },
          { id: 'profile', label: 'Hồ sơ', icon: '👤' },
        ]
      : [
          { id: 'booking', label: 'Đặt sân', icon: '⚽' },
          { id: 'matchmaking', label: 'Chợ Kèo', icon: '🔥', badge: 'Hot' },
          { id: 'community', label: 'Cộng Đồng', icon: '💬' },
          { id: 'tournaments', label: 'Giải đấu', icon: '🏆' },
          { id: 'profile', label: isGuest ? 'Đăng nhập' : 'Hồ sơ', icon: '👤' },
        ];

  return (
    <View style={[styles.root, { paddingTop: layout.insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

      {/* ============================================================ */}
      {/* 1. TOP NAVBAR (100% Parity with frontend/src/components/Navbar.tsx) */}
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
            onPress={() =>
              navigateToTab(
                role === 'OWNER' ? 'admin' : role === 'ORGANIZER' ? 'organizer' : 'booking'
              )
            }
            activeOpacity={0.8}
            style={styles.brandRow}
          >
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🏆</Text>
            </View>
            <Text style={styles.brandName}>
              Turf<Text style={{ color: COLORS.emerald }}>zone</Text>
            </Text>
          </TouchableOpacity>

          {/* Center Navigation Links on Tablet / Desktop */}
          {!layout.isPhone && (
            <View style={styles.desktopNavRow}>
              {topNavItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigateToTab(item.id)}
                    style={[styles.desktopNavPill, active && styles.desktopNavPillActive]}
                  >
                    <Text
                      style={[
                        styles.desktopNavText,
                        active && styles.desktopNavTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.badge && (
                      <View
                        style={[
                          styles.navHotBadge,
                          item.badge === 'BTC' && { backgroundColor: COLORS.emerald },
                        ]}
                      >
                        <Text style={styles.navHotBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Right: Notification Bell + User Profile Pill + Hamburger Menu (Danh Mục Nền Tảng) */}
          <View style={styles.navRightRow}>
            {/* Notification Bell */}
            <TouchableOpacity
              onPress={() => {
                setShowNotifDrawer(!showNotifDrawer);
                setShowUserDropdown(false);
                setShowHamburgerMenu(false);
              }}
              style={[
                styles.iconBtn,
                showNotifDrawer && {
                  backgroundColor: COLORS.emeraldSoft,
                  borderColor: COLORS.emeraldLight,
                },
              ]}
            >
              <Text style={{ fontSize: 16 }}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifCountBadge}>
                  <Text style={styles.notifCountText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* User Profile / Role Switcher Button */}
            <TouchableOpacity
              onPress={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifDrawer(false);
                setShowHamburgerMenu(false);
              }}
              style={styles.userPillBtn}
            >
              <View style={styles.userAvatarSmall}>
                <Text style={styles.userAvatarSmallText}>
                  {(user?.fullName || user?.name || 'N').trim().charAt(0).toUpperCase()}
                </Text>
              </View>
              {!layout.isSmallPhone && (
                <View>
                  <Text style={styles.userPillName} numberOfLines={1}>
                    {isGuest ? 'Đăng Nhập' : user?.fullName || 'Nguyễn Văn Cầu Thủ'}
                  </Text>
                  <Text style={styles.userPillRole}>
                    {role === 'OWNER'
                      ? 'Đối Tác Chủ Sân'
                      : role === 'ORGANIZER'
                      ? 'Ban Tổ Chức Giải'
                      : isGuest
                      ? 'Khách Tham Quan'
                      : 'Cầu Thủ Đặt Sân'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Hamburger Menu Button (Danh Mục Nền Tảng) */}
            <TouchableOpacity
              onPress={() => {
                setShowHamburgerMenu(!showHamburgerMenu);
                setShowNotifDrawer(false);
                setShowUserDropdown(false);
              }}
              style={[
                styles.hamburgerBtn,
                showHamburgerMenu && {
                  backgroundColor: COLORS.emeraldSoft,
                  borderColor: COLORS.emerald,
                },
              ]}
            >
              <Text style={styles.hamburgerIconText}>
                {showHamburgerMenu ? '✕' : '☰'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* INLINE DRAWER 1: TRUNG TÂM THÔNG BÁO (Matches Navbar.tsx) */}
        {/* ============================================================ */}
        {showNotifDrawer && (
          <View
            style={[
              styles.inlineHeaderDrawer,
              { paddingHorizontal: layout.horizontalPadding },
            ]}
          >
            <View style={styles.drawerHeaderRow}>
              <View style={styles.wrapRow}>
                <Text style={styles.drawerTitle}>🔔 Trung Tâm Thông Báo</Text>
                {unreadCount > 0 && (
                  <View style={styles.emeraldCountPill}>
                    <Text style={styles.emeraldCountPillText}>{unreadCount} mới</Text>
                  </View>
                )}
              </View>
              <View style={styles.wrapRow}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={() =>
                      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                    }
                  >
                    <Text style={styles.markAllReadText}>✓ Đánh dấu đã đọc</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifDrawer(false)}>
                  <Text style={styles.closeDrawerText}>Đóng ▲</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ gap: 8 }}>
              {notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    setNotifications((prev) =>
                      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                    );
                    navigateToTab(item.targetTab);
                  }}
                  style={[
                    styles.notifItemCard,
                    item.unread && {
                      backgroundColor: COLORS.emeraldSoft,
                      borderColor: COLORS.emeraldLight,
                    },
                  ]}
                >
                  <View style={styles.drawerHeaderRow}>
                    <Text style={styles.notifItemTitle}>{item.title}</Text>
                    <Text style={styles.notifTimeText}>{item.time}</Text>
                  </View>
                  <Text style={styles.notifItemDesc}>{item.desc}</Text>
                  <Text style={styles.notifOpenLink}>Mở xem ngay →</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* INLINE DRAWER 2: HỒ SƠ & CHUYỂN ĐỔI VAI TRÒ (Matches Navbar.tsx) */}
        {/* ============================================================ */}
        {showUserDropdown && (
          <View
            style={[
              styles.inlineHeaderDrawer,
              { paddingHorizontal: layout.horizontalPadding },
            ]}
          >
            <View style={styles.drawerHeaderRow}>
              <View>
                <Text style={styles.drawerTitle}>
                  👤 {user?.fullName || 'Nguyễn Văn Cầu Thủ'} ({user?.email || 'Khách'})
                </Text>
                <Text style={styles.drawerSub}>
                  Truy cập nhanh hồ sơ cá nhân hoặc chuyển đổi vai trò trải nghiệm (Đồng bộ 100% Web)
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowUserDropdown(false)}>
                <Text style={styles.closeDrawerText}>Đóng ▲</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Links matching User Dropdown on Web */}
            <View style={styles.wrapRow}>
              <TouchableOpacity
                onPress={() => navigateToTab('profile')}
                style={styles.quickMenuCard}
              >
                <Text style={styles.quickMenuTitle}>👤 Hồ Sơ VĐV & Rating</Text>
                <Text style={styles.quickMenuSub}>Cập nhật kỹ năng & lịch sử đấu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToTab('my-activities')}
                style={styles.quickMenuCard}
              >
                <Text style={styles.quickMenuTitle}>🎫 Lịch Trình & Vé Đã Đặt</Text>
                <Text style={styles.quickMenuSub}>
                  Vé giữ chỗ ({myBookings.length}), Điểm danh & Kèo đã nhận
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToTab('team-management')}
                style={styles.quickMenuCard}
              >
                <Text style={styles.quickMenuTitle}>🛡️ Đội Bóng Của Tôi</Text>
                <Text style={styles.quickMenuSub}>Quản lý CLB & Sổ quỹ đội</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToTab('membership')}
                style={styles.quickMenuCard}
              >
                <Text style={styles.quickMenuTitle}>⚡ Thẻ Hội Viên #SH-1</Text>
                <Text style={styles.quickMenuSub}>Mã QR Check-in sân & Ưu đãi</Text>
              </TouchableOpacity>
            </View>

            {/* Role Switcher (Cầu Thủ / Chủ Sân / Ban Tổ Chức / Khách) */}
            <Text style={styles.sectionSubHeader}>🔄 Chuyển nhanh chế độ vai trò:</Text>
            <View style={styles.wrapRow}>
              {[
                {
                  roleId: 'PLAYER' as const,
                  label: '⚽ Cầu Thủ Đặt Sân',
                  email: 'player@Turfzone.vn',
                  pass: 'player123',
                },
                {
                  roleId: 'OWNER' as const,
                  label: '🏟️ Đối Tác Chủ Sân',
                  email: 'owner@Turfzone.vn',
                  pass: 'owner123',
                },
                {
                  roleId: 'ORGANIZER' as const,
                  label: '🏆 Ban Tổ Chức Giải (BTC)',
                  email: 'btc@Turfzone.vn',
                  pass: 'btc123',
                },
                {
                  roleId: 'GUEST' as const,
                  label: '🌐 Chế Độ Khách (Trang Chủ)',
                  email: '',
                  pass: '',
                },
              ].map((r) => {
                const active = role === r.roleId;
                return (
                  <TouchableOpacity
                    key={r.roleId}
                    onPress={() => handleSwitchRoleOrLogin(r.email, r.pass, r.roleId)}
                    style={[styles.roleSwitchBtn, active && styles.roleSwitchBtnActive]}
                  >
                    <Text
                      style={[
                        styles.roleSwitchBtnText,
                        active && styles.roleSwitchBtnTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
                onPress={() => handleSwitchRoleOrLogin(loginEmail, loginPassword, 'PLAYER')}
                disabled={loginBusy}
                style={styles.authSubmitBtn}
              >
                <Text style={styles.authSubmitBtnText}>
                  {loginBusy ? 'Đang kết nối...' : 'Đăng Nhập'}
                </Text>
              </TouchableOpacity>
            </View>

            {loginMessage && <Text style={styles.loginFeedbackText}>{loginMessage}</Text>}
          </View>
        )}

        {/* ============================================================ */}
        {/* INLINE DRAWER 3: DANH MỤC NỀN TẢNG (Matches Hamburger Menu in Navbar.tsx 100%) */}
        {/* ============================================================ */}
        {showHamburgerMenu && (
          <View
            style={[
              styles.inlineHeaderDrawer,
              { paddingHorizontal: layout.horizontalPadding },
            ]}
          >
            <View style={styles.drawerHeaderRow}>
              <Text style={styles.drawerTitle}>📂 Danh Mục Nền Tảng</Text>
              <TouchableOpacity onPress={() => setShowHamburgerMenu(false)}>
                <Text style={styles.closeDrawerText}>Đóng ✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hamburgerGrid}>
              {[
                {
                  id: 'booking' as WebNavTabId,
                  icon: '📅',
                  title: 'Đặt Sân Bóng Đá',
                  sub: 'Tìm cụm sân gần nhất & giữ chỗ online',
                },
                {
                  id: 'matchmaking' as WebNavTabId,
                  icon: '🔥',
                  title: 'Chợ Kèo Hot',
                  sub: 'Ghép đối giao hữu & SOS thiếu chân',
                  badge: 'Hot',
                },
                {
                  id: 'community' as WebNavTabId,
                  icon: '💬',
                  title: 'Cộng Đồng',
                  sub: 'Kênh thảo luận, nhóm đội bóng & tin nhắn riêng',
                },
                {
                  id: 'tournaments' as WebNavTabId,
                  icon: '🏆',
                  title: 'Giải Đấu & BXH',
                  sub: 'Đăng ký giải, nhánh đấu & lịch sử thi đấu',
                },
                {
                  id: 'membership' as WebNavTabId,
                  icon: '⚡',
                  title: 'Thẻ Hội Viên & Ưu Đãi',
                  sub: `Mã VĐV #SH-${user?.id || 1} check-in sân & giải đấu`,
                },
                {
                  id: 'my-activities' as WebNavTabId,
                  icon: '🎫',
                  title: 'Lịch Trình & Vé Đã Đặt',
                  sub: 'Vé điện tử, Đồng hồ đếm ngược & Điểm danh quân số',
                },
                {
                  id: 'profile' as WebNavTabId,
                  icon: '👤',
                  title: 'Hồ Sơ VĐV & Lịch Sử Thi Đấu',
                  sub: 'Chỉnh sửa hồ sơ VĐV, chỉ số, lịch sử trận đấu',
                },
                {
                  id: 'team-management' as WebNavTabId,
                  icon: '🛡️',
                  title: 'Đội Bóng Của Tôi',
                  sub: 'Đội đã đăng ký & Lịch đấu của đội',
                },
                {
                  id: 'organizer' as WebNavTabId,
                  icon: '📋',
                  title: 'Điều Hành Giải Đấu (BTC)',
                  sub: 'Duyệt đội đăng ký & Bốc thăm chia bảng inline',
                },
                {
                  id: 'admin' as WebNavTabId,
                  icon: '🏟️',
                  title: 'Quản Lý Cụm Sân (Chủ Sân)',
                  sub: 'Sơ đồ sân trực tiếp, duyệt cọc & doanh thu ca',
                },
              ].map((item) => {
                const active = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigateToTab(item.id)}
                    style={[
                      styles.hamburgerItemCard,
                      active && styles.hamburgerItemCardActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.hamburgerIconBox,
                        active && { backgroundColor: COLORS.emerald },
                      ]}
                    >
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.wrapRow}>
                        <Text
                          style={[
                            styles.hamburgerItemTitle,
                            active && { color: COLORS.emeraldDark },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {item.badge && (
                          <View style={styles.navHotBadge}>
                            <Text style={styles.navHotBadgeText}>{item.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.hamburgerItemSub}>{item.sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ============================================================ */}
      {/* 2. MAIN CONTENT AREA (100% Parity with frontend/src/app/page.tsx) */}
      {/* ============================================================ */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(layout.insets.bottom, 16) + 88 },
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
              onNavigateTab={navigateToTab}
              isGuest={isGuest}
            />
          )}

          {activeTab === 'matchmaking' && (
            <MatchmakingTab
              user={user}
              token={token}
              posts={matchPosts}
              onUpdatePosts={setMatchPosts}
            />
          )}

          {activeTab === 'community' && (
            <CommunityHubTab user={user} onNavigateTab={navigateToTab} />
          )}

          {activeTab === 'tournaments' && (
            <TournamentsTab
              user={user}
              token={token}
              tournaments={tournaments}
              onUpdateTournaments={setTournaments}
            />
          )}

          {(activeTab === 'my-activities' || activeTab === 'activities') && (
            <ActivitiesTab
              user={user}
              token={token}
              bookings={myBookings}
              onUpdateBookings={setMyBookings}
              onBroadcastSosSuccess={(newSos) => {
                setMatchPosts((prev) => [newSos, ...prev]);
                navigateToTab('matchmaking');
              }}
              onNavigateTab={navigateToTab}
            />
          )}

          {(activeTab === 'profile' ||
            activeTab === 'team-management' ||
            activeTab === 'membership' ||
            activeTab === 'organizer') && (
            <ProfileAndClubsTab
              mode={activeTab}
              user={user}
              onUpdateUser={setUser}
              tournaments={tournaments}
              onNavigateTab={navigateToTab}
            />
          )}

          {(activeTab === 'admin' ||
            activeTab === 'multi-sport' ||
            activeTab === 'owner') && (
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
      {/* 3. MOBILE BOTTOM NAVIGATION BAR (100% Parity with Navbar.tsx) */}
      {/* ============================================================ */}
      {layout.isPhone && (
        <View
          style={[
            styles.bottomNav,
            { paddingBottom: Math.max(layout.insets.bottom, 8) },
          ]}
        >
          {bottomNavItems.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => navigateToTab(tab.id)}
                style={styles.bottomNavItem}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.bottomIconWrap,
                    isCurrent && styles.bottomIconWrapActive,
                  ]}
                >
                  <Text style={styles.bottomNavIcon}>{tab.icon}</Text>
                  {tab.badge && (
                    <View style={styles.bottomHotDot} />
                  )}
                </View>
                <Text
                  style={[
                    styles.bottomNavLabel,
                    isCurrent && styles.bottomNavLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
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
    borderBottomColor: COLORS.border,
    zIndex: 20,
    elevation: 3,
  },
  navbarInner: {
    width: '100%',
    maxWidth: 1280,
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
    borderRadius: 11,
    backgroundColor: COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 19,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  desktopNavRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  desktopNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  desktopNavPillActive: {
    backgroundColor: COLORS.emeraldSoft,
  },
  desktopNavText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  desktopNavTextActive: {
    color: COLORS.emeraldDark,
    fontWeight: '800',
  },
  navHotBadge: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  navHotBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  notifCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.rose,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifCountText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  userPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 40,
  },
  userAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.emerald,
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
    color: COLORS.text,
  },
  userPillRole: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },

  // Inline Header Drawers
  inlineHeaderDrawer: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 14,
    gap: 12,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  drawerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emeraldCountPill: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emeraldCountPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },
  closeDrawerText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  notifItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  notifTimeText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  notifItemDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  notifOpenLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
    marginTop: 2,
  },
  quickMenuCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  quickMenuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickMenuSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  sectionSubHeader: {
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: COLORS.emerald,
    borderColor: COLORS.emerald,
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
    backgroundColor: COLORS.text,
    paddingHorizontal: 16,
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
    fontWeight: '700',
    color: COLORS.emeraldDark,
  },

  // Hamburger Menu (Danh Mục Nền Tảng)
  hamburgerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hamburgerItemCard: {
    flex: 1,
    minWidth: 250,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hamburgerItemCardActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emerald,
  },
  hamburgerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  hamburgerItemSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Body & Bottom Nav
  scrollContent: {
    flexGrow: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 6,
    elevation: 12,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 52,
  },
  bottomIconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    position: 'relative',
  },
  bottomIconWrapActive: {
    backgroundColor: COLORS.emeraldSoft,
  },
  bottomNavIcon: {
    fontSize: 18,
  },
  bottomHotDot: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.rose,
  },
  bottomNavLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: COLORS.emeraldDark,
    fontWeight: '800',
  },
});
