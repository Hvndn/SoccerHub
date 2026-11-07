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
  Image as RNImage,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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

const TURFZONE_LOGO = require('./src/assets/turfzone-logo.png');

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
    level: 'Phong trào',
  });

  // Inline Header Drawers (NO MODAL - 100% Inline)
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);
  const [showSkillFilterPanel, setShowSkillFilterPanel] = useState(false);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState('Phong trào');
  const [selectedLocation, setSelectedLocation] = useState('Toàn quốc');

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
    setShowSkillFilterPanel(false);
  };

  const handleSwitchRoleOrLogin = async (
    targetEmail: string,
    targetPass: string,
    roleOverride: 'PLAYER' | 'OWNER' | 'ORGANIZER' | 'GUEST'
  ) => {
    if (roleOverride === 'GUEST') {
      setToken(null);
      setUser(null);
      setActiveTab('booking');
      setLoginMessage('Đã chuyển sang chế độ Khách (Hiển thị Trang chủ LandingHero + Đặt sân giống Web).');
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
          level: 'Phong trào',
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
        level: 'Phong trào',
      });
      setActiveTab('booking');
      setLoginMessage('✓ Đã chuyển sang giao diện Cầu Thủ Đặt Sân');
    }
  };

  const role = user?.role || 'PLAYER';
  const isGuest = !user || role === 'GUEST' || !user.email;

  // Desktop/Tablet Top Nav Items (Matches Navbar.tsx lines 186-214 100%)
  const topNavItems: {
    id: WebNavTabId;
    label: string;
    featherIcon: keyof typeof Feather.glyphMap;
    badge?: string;
    isSpecial?: boolean;
  }[] =
    role === 'OWNER'
      ? [
          { id: 'admin', label: 'Quản Lý Cụm Sân', featherIcon: 'grid' },
          { id: 'multi-sport', label: 'Sơ Đồ Sân', featherIcon: 'calendar' },
          { id: 'organizer', label: 'Điều Hành Giải Đấu', featherIcon: 'award' },
          { id: 'community', label: 'Cộng Đồng', featherIcon: 'message-circle' },
          { id: 'profile', label: 'Hồ Sơ Cá Nhân', featherIcon: 'user' },
        ]
      : role === 'ORGANIZER'
      ? [
          { id: 'organizer', label: 'Điều Hành Giải Đấu', featherIcon: 'shield', badge: 'BTC', isSpecial: true },
          { id: 'tournaments', label: 'Giải Đấu & BXH', featherIcon: 'award' },
          { id: 'community', label: 'Cộng Đồng', featherIcon: 'message-circle' },
          { id: 'profile', label: 'Hồ Sơ Ban Tổ Chức', featherIcon: 'user' },
        ]
      : [
          { id: 'booking', label: 'Đặt Sân', featherIcon: 'calendar' },
          { id: 'matchmaking', label: 'Chợ Kèo', featherIcon: 'zap', badge: 'Hot', isSpecial: true },
          { id: 'community', label: 'Cộng Đồng', featherIcon: 'message-circle' },
          { id: 'tournaments', label: 'Giải Đấu', featherIcon: 'award' },
          { id: 'team-management', label: 'Đội Bóng', featherIcon: 'users' },
          { id: 'membership', label: 'Thẻ Hội Viên', featherIcon: 'credit-card' },
        ];

  // Mobile Bottom Navigation Bar (Matches Navbar.tsx lines 1360-1409 100%)
  const bottomNavItems: {
    id: WebNavTabId;
    label: string;
    featherIcon: keyof typeof Feather.glyphMap;
    badge?: string;
  }[] =
    role === 'OWNER'
      ? [
          { id: 'admin', label: 'Quản lý', featherIcon: 'grid' },
          { id: 'multi-sport', label: 'Sơ đồ sân', featherIcon: 'calendar' },
          { id: 'organizer', label: 'Giải đấu', featherIcon: 'award' },
          { id: 'community', label: 'Cộng Đồng', featherIcon: 'message-circle' },
          { id: 'profile', label: 'Hồ sơ', featherIcon: 'user' },
        ]
      : role === 'ORGANIZER'
      ? [
          { id: 'organizer', label: 'Điều hành', featherIcon: 'shield' },
          { id: 'tournaments', label: 'BXH Giải', featherIcon: 'award' },
          { id: 'community', label: 'Cộng Đồng', featherIcon: 'message-circle' },
          { id: 'profile', label: 'Hồ sơ', featherIcon: 'user' },
        ]
      : [
          { id: 'booking', label: 'Đặt sân', featherIcon: 'calendar' },
          { id: 'matchmaking', label: 'Chợ Kèo', featherIcon: 'zap', badge: 'Hot' },
          { id: 'community', label: 'Cộng Đồng', featherIcon: 'message-circle' },
          { id: 'tournaments', label: 'Giải đấu', featherIcon: 'award' },
          { id: 'profile', label: isGuest ? 'Đăng nhập' : 'Hồ sơ', featherIcon: 'user' },
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
          {/* Left: Real Turfzone Logo Image (/turfzone-logo.png) */}
          <TouchableOpacity
            onPress={() =>
              navigateToTab(
                role === 'OWNER' ? 'admin' : role === 'ORGANIZER' ? 'organizer' : 'booking'
              )
            }
            activeOpacity={0.85}
            style={styles.brandRow}
          >
            <RNImage
              source={TURFZONE_LOGO}
              style={layout.isPhone ? styles.brandLogoImgPhone : styles.brandLogoImgDesktop}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Center Navigation Links on Desktop (lg:flex in Navbar.tsx) */}
          {layout.isDesktop && (
            <View style={styles.desktopNavRow}>
              {topNavItems.map((item) => {
                const active = activeTab === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => navigateToTab(item.id)}
                    style={[
                      styles.desktopNavPill,
                      active && styles.desktopNavPillActive,
                      item.isSpecial && !active && styles.desktopNavPillSpecial,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={item.featherIcon}
                      size={15}
                      color={
                        active
                          ? COLORS.primary
                          : item.isSpecial
                          ? COLORS.amber
                          : COLORS.textSecondary
                      }
                    />
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
                          item.badge === 'BTC' && { backgroundColor: COLORS.primary },
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

          {/* Right Side Actions (Matches Navbar.tsx lines 504-914 100%) */}
          <View style={styles.navRightRow}>
            {/* Skill & Location Pill for Player on Tablet/Desktop (★ Phong trào | Toàn quốc) */}
            {role === 'PLAYER' && !layout.isPhone && (
              <TouchableOpacity
                onPress={() => {
                  setShowSkillFilterPanel(!showSkillFilterPanel);
                  setShowNotifDrawer(false);
                  setShowUserDropdown(false);
                  setShowHamburgerMenu(false);
                }}
                style={styles.skillLocationPill}
                activeOpacity={0.8}
              >
                <View style={styles.skillPillPart}>
                  <Feather name="star" size={14} color="#eab308" />
                  <Text style={styles.skillPillText}>{selectedSkillLevel}</Text>
                </View>
                <View style={styles.skillPillDivider} />
                <View style={styles.skillPillPart}>
                  <Feather name="compass" size={14} color={COLORS.primary} />
                  <Text style={styles.skillPillText}>{selectedLocation}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Notification Bell Button */}
            <TouchableOpacity
              onPress={() => {
                setShowNotifDrawer(!showNotifDrawer);
                setShowUserDropdown(false);
                setShowHamburgerMenu(false);
                setShowSkillFilterPanel(false);
              }}
              style={[
                styles.iconBtn,
                showNotifDrawer && {
                  backgroundColor: COLORS.primarySoft,
                  borderColor: '#7dd3fc',
                },
              ]}
              activeOpacity={0.8}
            >
              <Feather
                name="bell"
                size={18}
                color={showNotifDrawer ? COLORS.primary : COLORS.textSecondary}
              />
              {unreadCount > 0 && <View style={styles.notifPingDot} />}
            </TouchableOpacity>

            {/* User Profile Pill OR Guest Login/Register Buttons (Matches Navbar.tsx lines 675-885) */}
            {!isGuest ? (
              <TouchableOpacity
                onPress={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDrawer(false);
                  setShowHamburgerMenu(false);
                  setShowSkillFilterPanel(false);
                }}
                style={styles.userProfileWrap}
                activeOpacity={0.8}
              >
                {/* Name & Role on the LEFT (Hidden on compact phone, shown on sm+) */}
                {!layout.isPhone && (
                  <View style={styles.userTextColRightAligned}>
                    <Text style={styles.userPillName} numberOfLines={1}>
                      {user?.fullName || 'Nguyễn Văn Cầu Thủ'}
                    </Text>
                    <View style={styles.userRoleRow}>
                      <Text style={styles.userPillRole}>
                        {role === 'OWNER'
                          ? 'Chủ Sân'
                          : role === 'ORGANIZER'
                          ? 'Ban Tổ Chức'
                          : 'Cầu Thủ'}{' '}
                        • {selectedSkillLevel}
                      </Text>
                      <Feather name="chevron-down" size={13} color={COLORS.primary} />
                    </View>
                  </View>
                )}

                {/* Circular #0369a1 Avatar with sky-400 border on the RIGHT */}
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarCircleText}>
                    {(user?.fullName || user?.name || 'N').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.guestButtonsRow}>
                <TouchableOpacity
                  onPress={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotifDrawer(false);
                    setShowHamburgerMenu(false);
                  }}
                  style={styles.guestLoginBtn}
                >
                  <Feather name="log-in" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.guestLoginBtnText}>Đăng Nhập</Text>
                </TouchableOpacity>
                {!layout.isSmallPhone && (
                  <TouchableOpacity
                    onPress={() => {
                      setShowUserDropdown(true);
                      setShowNotifDrawer(false);
                      setShowHamburgerMenu(false);
                    }}
                    style={styles.guestRegisterBtn}
                  >
                    <Text style={styles.guestRegisterBtnText}>Đăng Ký</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Hamburger Menu Button (Danh Mục Nền Tảng) */}
            <TouchableOpacity
              onPress={() => {
                setShowHamburgerMenu(!showHamburgerMenu);
                setShowNotifDrawer(false);
                setShowUserDropdown(false);
                setShowSkillFilterPanel(false);
              }}
              style={[
                styles.hamburgerBtn,
                showHamburgerMenu && {
                  backgroundColor: COLORS.primarySoft,
                  borderColor: COLORS.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Feather
                name={showHamburgerMenu ? 'x' : 'menu'}
                size={20}
                color={showHamburgerMenu ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================ */}
        {/* INLINE PANEL 0: TRÌNH ĐỘ & KHU VỰC (Matches Navbar.tsx Skill Filter) */}
        {/* ============================================================ */}
        {showSkillFilterPanel && (
          <View
            style={[
              styles.inlineHeaderDrawer,
              { paddingHorizontal: layout.horizontalPadding },
            ]}
          >
            <View style={styles.drawerHeaderRow}>
              <Text style={styles.drawerTitle}>Cài Đặt Trình Độ & Khu Vực Tìm Sân</Text>
              <TouchableOpacity onPress={() => setShowSkillFilterPanel(false)}>
                <Text style={styles.closeDrawerText}>Đóng ▲</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.sectionSubHeader}>Trình độ:</Text>
              {['Vui vẻ', 'Phong trào', 'Bán chuyên'].map((lv) => {
                const active = selectedSkillLevel === lv;
                return (
                  <TouchableOpacity
                    key={lv}
                    onPress={() => setSelectedSkillLevel(lv)}
                    style={[styles.roleSwitchBtn, active && styles.roleSwitchBtnActive]}
                  >
                    <Text
                      style={[
                        styles.roleSwitchBtnText,
                        active && styles.roleSwitchBtnTextActive,
                      ]}
                    >
                      {lv}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.wrapRow}>
              <Text style={styles.sectionSubHeader}>Khu vực:</Text>
              {['Toàn quốc', 'Đà Nẵng', 'Hà Nội', 'TP.HCM'].map((loc) => {
                const active = selectedLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => setSelectedLocation(loc)}
                    style={[styles.roleSwitchBtn, active && styles.roleSwitchBtnActive]}
                  >
                    <Text
                      style={[
                        styles.roleSwitchBtnText,
                        active && styles.roleSwitchBtnTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

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
                <Feather name="bell" size={16} color={COLORS.primary} />
                <Text style={styles.drawerTitle}>Thông báo</Text>
                {unreadCount > 0 && (
                  <View style={styles.primaryCountPill}>
                    <Text style={styles.primaryCountPillText}>{unreadCount} mới</Text>
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
                      backgroundColor: COLORS.primarySoft,
                      borderColor: '#bae6fd',
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
                  {isGuest
                    ? 'Đăng Nhập Tài Khoản Turfzone'
                    : `${user?.fullName || 'Nguyễn Văn Cầu Thủ'} (${user?.email})`}
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
                <View style={styles.wrapRow}>
                  <Feather name="user" size={16} color={COLORS.primary} />
                  <Text style={styles.quickMenuTitle}>Hồ Sơ VĐV & Lịch Sử Thi Đấu</Text>
                </View>
                <Text style={styles.quickMenuSub}>Chỉnh sửa hồ sơ, chỉ số & lịch sử đấu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToTab('my-activities')}
                style={styles.quickMenuCard}
              >
                <View style={styles.wrapRow}>
                  <Feather name="calendar" size={16} color={COLORS.emerald} />
                  <Text style={styles.quickMenuTitle}>Lịch Trình & Vé Đã Đặt</Text>
                </View>
                <Text style={styles.quickMenuSub}>
                  Vé giữ chỗ ({myBookings.length}), Điểm danh & Kèo đã nhận
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToTab('team-management')}
                style={styles.quickMenuCard}
              >
                <View style={styles.wrapRow}>
                  <Feather name="users" size={16} color="#0284c7" />
                  <Text style={styles.quickMenuTitle}>Đội Bóng Của Tôi</Text>
                </View>
                <Text style={styles.quickMenuSub}>Quản lý CLB & Sổ quỹ đội</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigateToTab('membership')}
                style={styles.quickMenuCard}
              >
                <View style={styles.wrapRow}>
                  <Feather name="credit-card" size={16} color={COLORS.amber} />
                  <Text style={styles.quickMenuTitle}>Thẻ Hội Viên #SH-1</Text>
                </View>
                <Text style={styles.quickMenuSub}>Mã QR Check-in sân & Ưu đãi</Text>
              </TouchableOpacity>
            </View>

            {/* Role Switcher (Cầu Thủ / Chủ Sân / Ban Tổ Chức / Khách) */}
            <Text style={styles.sectionSubHeader}>Chuyển nhanh chế độ vai trò (Đồng bộ Web):</Text>
            <View style={styles.wrapRow}>
              {[
                {
                  roleId: 'PLAYER' as const,
                  label: 'Cầu Thủ Đặt Sân',
                  email: 'player@Turfzone.vn',
                  pass: 'player123',
                },
                {
                  roleId: 'OWNER' as const,
                  label: 'Đối Tác Chủ Sân',
                  email: 'owner@Turfzone.vn',
                  pass: 'owner123',
                },
                {
                  roleId: 'ORGANIZER' as const,
                  label: 'Ban Tổ Chức Giải (BTC)',
                  email: 'btc@Turfzone.vn',
                  pass: 'btc123',
                },
                {
                  roleId: 'GUEST' as const,
                  label: 'Chế Độ Khách (Trang Chủ Landing)',
                  email: '',
                  pass: '',
                },
              ].map((r) => {
                const active = (isGuest && r.roleId === 'GUEST') || (!isGuest && role === r.roleId);
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
              <View style={styles.wrapRow}>
                <RNImage
                  source={TURFZONE_LOGO}
                  style={{ width: 110, height: 28 }}
                  resizeMode="contain"
                />
                <Text style={styles.drawerTitle}>• Danh Mục Nền Tảng</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHamburgerMenu(false)}>
                <Text style={styles.closeDrawerText}>Đóng ✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hamburgerGrid}>
              {[
                {
                  id: 'booking' as WebNavTabId,
                  featherIcon: 'calendar' as const,
                  title: 'Đặt Sân Bóng Đá',
                  sub: 'Tìm cụm sân gần nhất & giữ chỗ online',
                },
                {
                  id: 'matchmaking' as WebNavTabId,
                  featherIcon: 'zap' as const,
                  title: 'Chợ Kèo Hot',
                  sub: 'Ghép đối giao hữu & SOS thiếu chân',
                  badge: 'Hot',
                },
                {
                  id: 'community' as WebNavTabId,
                  featherIcon: 'message-circle' as const,
                  title: 'Cộng Đồng',
                  sub: 'Kênh thảo luận, nhóm đội bóng & tin nhắn riêng',
                },
                {
                  id: 'tournaments' as WebNavTabId,
                  featherIcon: 'award' as const,
                  title: 'Giải Đấu & BXH',
                  sub: 'Đăng ký giải, nhánh đấu & lịch sử thi đấu',
                },
                {
                  id: 'membership' as WebNavTabId,
                  featherIcon: 'credit-card' as const,
                  title: 'Thẻ Hội Viên & Ưu Đãi',
                  sub: `Mã VĐV #SH-${user?.id || 1} check-in sân & giải đấu`,
                },
                {
                  id: 'my-activities' as WebNavTabId,
                  featherIcon: 'check-square' as const,
                  title: 'Lịch Trình & Vé Đã Đặt',
                  sub: 'Vé điện tử, Đồng hồ đếm ngược & Điểm danh quân số',
                },
                {
                  id: 'profile' as WebNavTabId,
                  featherIcon: 'user' as const,
                  title: 'Hồ Sơ VĐV & Lịch Sử Thi Đấu',
                  sub: 'Chỉnh sửa hồ sơ VĐV, chỉ số, lịch sử trận đấu',
                },
                {
                  id: 'team-management' as WebNavTabId,
                  featherIcon: 'users' as const,
                  title: 'Đội Bóng Của Tôi',
                  sub: 'Đội đã đăng ký & Lịch đấu của đội',
                },
                {
                  id: 'organizer' as WebNavTabId,
                  featherIcon: 'shield' as const,
                  title: 'Điều Hành Giải Đấu (BTC)',
                  sub: 'Duyệt đội đăng ký & Bốc thăm chia bảng inline',
                },
                {
                  id: 'admin' as WebNavTabId,
                  featherIcon: 'grid' as const,
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
                        active && { backgroundColor: COLORS.primary },
                      ]}
                    >
                      <Feather
                        name={item.featherIcon}
                        size={18}
                        color={active ? COLORS.white : COLORS.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.wrapRow}>
                        <Text
                          style={[
                            styles.hamburgerItemTitle,
                            active && { color: COLORS.primary },
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
      {/* 3. MOBILE / TABLET BOTTOM NAVIGATION BAR (Matches Navbar.tsx lines 1360-1409) */}
      {/* ============================================================ */}
      {!layout.isDesktop && (
        <View
          style={[
            styles.bottomNav,
            { paddingBottom: Math.max(layout.insets.bottom, 6) },
          ]}
        >
          {bottomNavItems.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  if (tab.id === 'profile' && isGuest) {
                    setShowUserDropdown(true);
                  } else {
                    navigateToTab(tab.id);
                  }
                }}
                style={styles.bottomNavItem}
                activeOpacity={0.75}
              >
                {/* Top #0369a1 indicator bar when active (Matches Navbar.tsx line 1397) */}
                {isCurrent && <View style={styles.bottomTopActiveBar} />}

                <View style={styles.bottomIconWrap}>
                  <Feather
                    name={tab.featherIcon}
                    size={20}
                    color={isCurrent ? COLORS.primary : COLORS.textMuted}
                  />
                  {tab.badge && (
                    <View style={styles.bottomHotPill}>
                      <Text style={styles.bottomHotPillText}>{tab.badge}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.bottomNavLabel,
                    isCurrent && styles.bottomNavLabelActive,
                  ]}
                  numberOfLines={1}
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
    borderBottomColor: COLORS.borderLight,
    zIndex: 20,
    elevation: 2,
  },
  navbarInner: {
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: 8,
    gap: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoImgPhone: {
    width: 124,
    height: 32,
  },
  brandLogoImgDesktop: {
    width: 142,
    height: 36,
  },
  desktopNavRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginLeft: 12,
  },
  desktopNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  desktopNavPillActive: {
    backgroundColor: 'rgba(3, 105, 161, 0.10)',
    borderColor: 'rgba(3, 105, 161, 0.30)',
  },
  desktopNavPillSpecial: {
    backgroundColor: COLORS.amberSoft,
    borderColor: COLORS.amberLight,
  },
  desktopNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  desktopNavTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  navHotBadge: {
    backgroundColor: COLORS.amberBright,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  navHotBadgeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  navRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skillLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 8,
  },
  skillPillPart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  skillPillDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
  },
  skillPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    position: 'relative',
  },
  notifPingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.rose,
  },
  userProfileWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderLight,
  },
  userTextColRightAligned: {
    alignItems: 'flex-end',
  },
  userRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  userPillName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  userPillRole: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarCircleText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  guestButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guestLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
  },
  guestLoginBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  guestRegisterBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  guestRegisterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Inline Header Drawers
  inlineHeaderDrawer: {
    width: '100%',
    maxWidth: 1440,
    alignSelf: 'center',
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
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
    fontWeight: '800',
    color: COLORS.text,
  },
  drawerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  primaryCountPill: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  primaryCountPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  markAllReadText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeDrawerText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  notifItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    color: COLORS.primary,
    marginTop: 2,
  },
  quickMenuCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
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
    paddingVertical: 8,
    borderRadius: 8,
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
    fontWeight: '700',
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 40,
  },
  authSubmitBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
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
    color: COLORS.primary,
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  hamburgerItemCardActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: '#7dd3fc',
  },
  hamburgerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
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

  // Body & Bottom Nav (Matches Navbar.tsx lines 1360-1409)
  scrollContent: {
    flexGrow: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'stretch',
    minHeight: 62,
    elevation: 12,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    position: 'relative',
  },
  bottomTopActiveBar: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  bottomIconWrap: {
    position: 'relative',
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  bottomHotPill: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: COLORS.amberBright,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  bottomHotPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  bottomNavLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: '#0b4f6c',
    fontWeight: '700',
  },
});
