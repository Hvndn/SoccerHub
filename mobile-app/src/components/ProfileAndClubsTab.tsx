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
  formatVnd,
  copyTextWithFeedback,
} from '../theme/responsive';
import { AuthUser, TournamentItem } from '../services/api';

interface ProfileAndClubsTabProps {
  mode: 'profile' | 'team-management' | 'membership' | 'organizer';
  user: AuthUser | null;
  onUpdateUser?: (next: AuthUser) => void;
  tournaments?: TournamentItem[];
  onNavigateTab?: (tab: any) => void;
}

export default function ProfileAndClubsTab({
  mode,
  user,
  onUpdateUser,
  tournaments = [],
  onNavigateTab,
}: ProfileAndClubsTabProps) {
  const layout = useResponsiveLayout();
  const [inlineToast, setInlineToast] = useState<string | null>(null);

  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || user?.name || 'Nguyễn Văn Cầu Thủ');
  const [editPhone, setEditPhone] = useState(user?.phone || '0905123456');
  const [editPosition, setEditPosition] = useState('Tiền vệ trung tâm (CM / CAM)');
  const [editFoot, setEditFoot] = useState('Chân phải (Thuận cả 2 chân)');
  const [editBio, setEditBio] = useState(
    'Đội trưởng FC Anh Em Hải Châu • Ưu tiên đá đẹp, giữ chân giữ cẳng, đúng giờ.'
  );

  // Team Management State
  const [showCreateClubInline, setShowCreateClubInline] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubArea, setNewClubArea] = useState('Quận Hải Châu, Đà Nẵng');
  const [newClubKit, setNewClubKit] = useState('Đỏ - Trắng');
  const [clubs, setClubs] = useState([
    {
      id: 'c1',
      name: 'FC Anh Em Hải Châu',
      role: 'Đội Trưởng',
      area: 'Quận Hải Châu, Đà Nẵng',
      members: 18,
      fundBalance: 2450000,
      kitColor: 'Đỏ - Trắng',
      winRate: '68%',
      nextMatch: '18:00 Hôm nay • Cụm Sân Đại Nắng (Sân 7A)',
    },
    {
      id: 'c2',
      name: 'CLB Doanh Nghiệp Sông Hàn',
      role: 'Đội Phó & Thủ Quỹ',
      area: 'Quận Sơn Trà, Đà Nẵng',
      members: 22,
      fundBalance: 4800000,
      kitColor: 'Xanh Dương',
      winRate: '74%',
      nextMatch: '19:30 Thứ 5 • Cụm Sân Biển Sơn Trà',
    },
  ]);

  const [fundLogs, setFundLogs] = useState([
    { id: 'f1', title: 'Đóng quỹ tháng 11 (14 thành viên)', amount: 2800000, type: 'IN', date: '01/11/2026' },
    { id: 'f2', title: 'Tiền sân + Nước uống trận gặp FC Liên Chiểu', amount: -380000, type: 'OUT', date: '04/11/2026' },
    { id: 'f3', title: 'Thưởng thắng kèo giao hữu tuần trước', amount: 300000, type: 'IN', date: '06/11/2026' },
  ]);
  const [showAddFundInline, setShowAddFundInline] = useState(false);
  const [fundNote, setFundNote] = useState('');
  const [fundAmount, setFundAmount] = useState('200000');

  // Membership Tier State
  const [activeTier, setActiveTier] = useState<'BASIC' | 'CAPTAIN_PRO' | 'CLUB_VIP'>('CAPTAIN_PRO');

  // Organizer Portal State
  const [showAddManualTeam, setShowAddManualTeam] = useState(false);
  const [manualTeamName, setManualTeamName] = useState('');
  const [manualCaptain, setManualCaptain] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [orgTeams, setOrgTeams] = useState([
    { id: 'ot1', name: 'FC Hải Châu', captain: 'Nguyễn Văn Cầu Thủ', phone: '0905123456', status: 'PAID', group: 'Bảng A' },
    { id: 'ot2', name: 'FC Tia Chớp Sơn Trà', captain: 'Lê Bảo', phone: '0905112233', status: 'PAID', group: 'Bảng A' },
    { id: 'ot3', name: 'FC Liên Chiểu', captain: 'Tuấn Kiệt', phone: '0905876543', status: 'PAID', group: 'Bảng B' },
    { id: 'ot4', name: 'FC Cẩm Lệ United', captain: 'Hoàng Minh', phone: '0905998877', status: 'PENDING', group: 'Bảng B' },
  ]);
  const [drawMessage, setDrawMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setInlineToast(msg);
    setTimeout(() => setInlineToast(null), 3500);
  };

  // ============================================================
  // 1. TEAM MANAGEMENT VIEW (Matches TeamClubManagement.tsx)
  // ============================================================
  if (mode === 'team-management') {
    return (
      <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
        {inlineToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{inlineToast}</Text>
          </View>
        )}

        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>🛡️ Đội Bóng Của Tôi & Quản Lý Quỹ Đội</Text>
            <Text style={styles.headerSub}>
              Quản lý danh sách thành viên CLB, lịch thi đấu nội bộ và sổ thu chi quỹ đội minh bạch
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateClubInline(!showCreateClubInline)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>
              {showCreateClubInline ? 'Đóng Form ▲' : '+ Tạo Đội Bóng Mới'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inline Create Club Form (NO MODAL) */}
        {showCreateClubInline && (
          <View style={styles.inlineFormCard}>
            <Text style={styles.sectionTitle}>➕ Khởi Tạo CLB / Đội Bóng Mới</Text>
            <View style={styles.wrapRow}>
              <TextInput
                value={newClubName}
                onChangeText={setNewClubName}
                placeholder="Tên đội bóng (VD: FC Hòa Xuân)..."
                style={[styles.textInput, { flex: 1, minWidth: 180 }]}
              />
              <TextInput
                value={newClubArea}
                onChangeText={setNewClubArea}
                placeholder="Khu vực sinh hoạt..."
                style={[styles.textInput, { flex: 1, minWidth: 160 }]}
              />
              <TextInput
                value={newClubKit}
                onChangeText={setNewClubKit}
                placeholder="Màu áo truyền thống..."
                style={[styles.textInput, { flex: 1, minWidth: 140 }]}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!newClubName.trim()) return;
                setClubs((prev) => [
                  {
                    id: `c-${Date.now()}`,
                    name: newClubName.trim(),
                    role: 'Đội Trưởng Sáng Lập',
                    area: newClubArea.trim() || 'Đà Nẵng',
                    members: 1,
                    fundBalance: 0,
                    kitColor: newClubKit.trim() || 'Đỏ',
                    winRate: '100%',
                    nextMatch: 'Chưa có lịch trận mới',
                  },
                  ...prev,
                ]);
                setNewClubName('');
                setShowCreateClubInline(false);
                showToast('🎉 Đã tạo đội bóng mới thành công!');
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>✓ Lưu Đội Bóng Mới</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Clubs Grid */}
        <View
          style={[
            styles.gridWrap,
            layout.gridColumns > 1 && { flexDirection: 'row', flexWrap: 'wrap' },
          ]}
        >
          {clubs.map((club) => (
            <View
              key={club.id}
              style={[
                styles.clubCard,
                layout.gridColumns > 1 && { width: layout.gridCardWidth },
              ]}
            >
              <View style={styles.betweenRow}>
                <View style={styles.emeraldPill}>
                  <Text style={styles.emeraldPillText}>{club.role}</Text>
                </View>
                <Text style={styles.clubWinRate}>Tỷ lệ thắng: {club.winRate}</Text>
              </View>
              <Text style={styles.clubName}>{club.name}</Text>
              <Text style={styles.clubMeta}>📍 Khu vực: {club.area}</Text>
              <Text style={styles.clubMeta}>
                👥 Quân số: {club.members} cầu thủ • 👕 Áo: {club.kitColor}
              </Text>
              <View style={styles.nextMatchBanner}>
                <Text style={styles.nextMatchText}>⏰ Lịch gần nhất: {club.nextMatch}</Text>
              </View>
              <View style={styles.betweenRow}>
                <View>
                  <Text style={styles.fundCaption}>Số dư quỹ đội</Text>
                  <Text style={styles.fundValue}>{formatVnd(club.fundBalance)}</Text>
                </View>
                <View style={styles.wrapRow}>
                  {onNavigateTab && (
                    <TouchableOpacity
                      onPress={() => onNavigateTab('community')}
                      style={styles.secondaryBtn}
                    >
                      <Text style={styles.secondaryBtnText}>💬 Phòng Chat Đội</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowAddFundInline(!showAddFundInline)}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>💰 Thu / Chi Quỹ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Inline Fund Ledger Card */}
        <View style={styles.sectionCard}>
          <View style={styles.betweenRow}>
            <Text style={styles.sectionTitle}>📒 Sổ Quỹ Đội Minh Bạch (FC Anh Em Hải Châu)</Text>
            <TouchableOpacity
              onPress={() => setShowAddFundInline(!showAddFundInline)}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>
                {showAddFundInline ? 'Ẩn nhập quỹ ▲' : '+ Ghi khoản Thu/Chi'}
              </Text>
            </TouchableOpacity>
          </View>

          {showAddFundInline && (
            <View style={styles.inlineSubForm}>
              <View style={styles.wrapRow}>
                <TextInput
                  value={fundNote}
                  onChangeText={setFundNote}
                  placeholder="Nội dung thu/chi (VD: Đóng quỹ tuần 2)..."
                  style={[styles.textInput, { flex: 2, minWidth: 180 }]}
                />
                <TextInput
                  value={fundAmount}
                  onChangeText={setFundAmount}
                  keyboardType="numeric"
                  placeholder="Số tiền..."
                  style={[styles.textInput, { flex: 1, minWidth: 120 }]}
                />
              </View>
              <View style={styles.wrapRow}>
                <TouchableOpacity
                  onPress={() => {
                    const val = Number(fundAmount) || 200000;
                    setFundLogs((prev) => [
                      {
                        id: `fl-${Date.now()}`,
                        title: fundNote.trim() || 'Thu quỹ bổ sung',
                        amount: val,
                        type: 'IN',
                        date: 'Hôm nay',
                      },
                      ...prev,
                    ]);
                    setFundNote('');
                    setShowAddFundInline(false);
                    showToast('✅ Đã ghi nhận khoản Thu vào sổ quỹ đội!');
                  }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>+ Ghi Khoản Thu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const val = Number(fundAmount) || 200000;
                    setFundLogs((prev) => [
                      {
                        id: `fl-${Date.now()}`,
                        title: fundNote.trim() || 'Chi tiền sân & nước uống',
                        amount: -val,
                        type: 'OUT',
                        date: 'Hôm nay',
                      },
                      ...prev,
                    ]);
                    setFundNote('');
                    setShowAddFundInline(false);
                    showToast('💸 Đã ghi nhận khoản Chi tiền sân!');
                  }}
                  style={[styles.secondaryBtn, { borderColor: COLORS.roseLight }]}
                >
                  <Text style={[styles.secondaryBtnText, { color: COLORS.rose }]}>
                    - Ghi Khoản Chi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{ gap: 8 }}>
            {fundLogs.map((log) => (
              <View key={log.id} style={styles.fundRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fundRowTitle}>{log.title}</Text>
                  <Text style={styles.fundRowDate}>📅 {log.date}</Text>
                </View>
                <Text
                  style={[
                    styles.fundRowAmount,
                    log.amount >= 0 ? { color: COLORS.emeraldDark } : { color: COLORS.rose },
                  ]}
                >
                  {log.amount >= 0 ? `+${formatVnd(log.amount)}` : formatVnd(log.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ============================================================
  // 2. MEMBERSHIP PORTAL VIEW (Matches MemberCardPortal.tsx)
  // ============================================================
  if (mode === 'membership') {
    const memberCode = `SH-${user?.id || 1}`;
    return (
      <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
        {inlineToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{inlineToast}</Text>
          </View>
        )}

        {/* Digital Sports Pass Card */}
        <View style={styles.sportsPassCard}>
          <View style={styles.betweenRow}>
            <View style={styles.passBadge}>
              <Text style={styles.passBadgeText}>⚡ Thẻ Thể Thao Turfzone</Text>
            </View>
            <Text style={styles.passIdText}>Mã VĐV: #{memberCode}</Text>
          </View>

          <Text style={styles.passHolderName}>
            {user?.fullName || user?.name || 'Nguyễn Văn Cầu Thủ'}
          </Text>
          <Text style={styles.passHolderSub}>
            Hạng thẻ: Đội Trưởng Pro • Khu vực TP. Đà Nẵng • Điểm uy tín: 100/100
          </Text>

          <View style={styles.passPerksRow}>
            <View style={styles.passPerkBox}>
              <Text style={styles.passPerkVal}>Giảm 5%</Text>
              <Text style={styles.passPerkLabel}>Đặt lịch cố định tháng</Text>
            </View>
            <View style={styles.passPerkBox}>
              <Text style={styles.passPerkVal}>Miễn phí</Text>
              <Text style={styles.passPerkLabel}>2 bộ áo Bib & Bóng thi đấu</Text>
            </View>
            <View style={styles.passPerkBox}>
              <Text style={styles.passPerkVal}>Ưu tiên</Text>
              <Text style={styles.passPerkLabel}>Hàng chờ khung giờ vàng</Text>
            </View>
          </View>

          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() =>
                copyTextWithFeedback('Đã sao chép mã thẻ hội viên', memberCode, () =>
                  showToast(`✓ Đã sao chép mã thẻ hội viên #${memberCode}`)
                )
              }
              style={styles.passCopyBtn}
            >
              <Text style={styles.passCopyBtnText}>📋 Sao Chép Mã Check-In #{memberCode}</Text>
            </TouchableOpacity>
            {onNavigateTab && (
              <TouchableOpacity
                onPress={() => onNavigateTab('booking')}
                style={styles.passSecondaryBtn}
              >
                <Text style={styles.passSecondaryBtnText}>⚽ Đặt Sân Áp Dụng Ưu Đãi →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Membership Tiers */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🏅 Các Gói Đặc Quyền Hội Viên & CLB</Text>
          <View style={styles.wrapRow}>
            {[
              {
                id: 'BASIC',
                name: 'Hội Viên Cơ Bản',
                price: 'Miễn phí',
                desc: 'Tích điểm mỗi lần đặt sân, lưu lịch sử thi đấu & nhận thông báo SOS thiếu chân.',
              },
              {
                id: 'CAPTAIN_PRO',
                name: 'Đội Trưởng Pro',
                price: '99.000đ / tháng',
                desc: 'Giảm 5% giờ vàng, miễn phí mượn áo Bib phản quang và ưu tiên hàng chờ ca tối.',
              },
              {
                id: 'CLUB_VIP',
                name: 'CLB Doanh Nghiệp VIP',
                price: '299.000đ / tháng',
                desc: 'Bao sân giải đấu nội bộ, hỗ trợ trọng tài & bảng điểm trực tuyến cho công ty.',
              },
            ].map((tier) => {
              const active = activeTier === tier.id;
              return (
                <TouchableOpacity
                  key={tier.id}
                  onPress={() => {
                    setActiveTier(tier.id as any);
                    showToast(`✨ Đã chọn xem gói: ${tier.name}`);
                  }}
                  style={[styles.tierCard, active && styles.tierCardActive]}
                >
                  <Text style={[styles.tierName, active && { color: COLORS.emeraldDark }]}>
                    {tier.name}
                  </Text>
                  <Text style={styles.tierPrice}>{tier.price}</Text>
                  <Text style={styles.tierDesc}>{tier.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // ============================================================
  // 3. TOURNAMENT ORGANIZER PORTAL VIEW (Matches TournamentOrganizerPortal.tsx)
  // ============================================================
  if (mode === 'organizer') {
    return (
      <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
        {inlineToast && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{inlineToast}</Text>
          </View>
        )}

        <View style={styles.headerCard}>
          <View style={{ flex: 1 }}>
            <View style={styles.wrapRow}>
              <View style={styles.emeraldPill}>
                <Text style={styles.emeraldPillText}>🏆 Cổng Ban Tổ Chức Giải Đấu (BTC)</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>
              Điều Hành Giải Đấu & Duyệt Đội Đăng Ký Trực Tuyến
            </Text>
            <Text style={styles.headerSub}>
              Quản lý danh sách đội tham dự, xác nhận lệ phí, bốc thăm chia bảng inline và cập nhật bảng điểm
            </Text>
          </View>
          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() => setShowAddManualTeam(!showAddManualTeam)}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>
                {showAddManualTeam ? 'Đóng Form ▲' : '+ Thêm Đội Thủ Công'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const groups = ['Bảng A', 'Bảng B'];
                setOrgTeams((prev) =>
                  prev.map((t, i) => ({ ...t, group: groups[i % groups.length] }))
                );
                setDrawMessage(
                  '🎲 Đã bốc thăm chia bảng ngẫu nhiên công bằng cho tất cả các đội!'
                );
              }}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>🎲 Bốc Thăm Chia Bảng Inline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {drawMessage && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{drawMessage}</Text>
          </View>
        )}

        {/* Inline Add Team Form (NO MODAL - Strictly inline as required by GEMINI.md!) */}
        {showAddManualTeam && (
          <View style={styles.inlineFormCard}>
            <Text style={styles.sectionTitle}>➕ Thêm Đội Bóng Thủ Công Vào Giải</Text>
            <View style={styles.wrapRow}>
              <TextInput
                value={manualTeamName}
                onChangeText={setManualTeamName}
                placeholder="Tên đội bóng..."
                style={[styles.textInput, { flex: 1, minWidth: 160 }]}
              />
              <TextInput
                value={manualCaptain}
                onChangeText={setManualCaptain}
                placeholder="Tên đội trưởng..."
                style={[styles.textInput, { flex: 1, minWidth: 150 }]}
              />
              <TextInput
                value={manualPhone}
                onChangeText={setManualPhone}
                placeholder="Số điện thoại..."
                style={[styles.textInput, { flex: 1, minWidth: 130 }]}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!manualTeamName.trim()) return;
                setOrgTeams((prev) => [
                  ...prev,
                  {
                    id: `ot-${Date.now()}`,
                    name: manualTeamName.trim(),
                    captain: manualCaptain.trim() || 'Đội trưởng CLB',
                    phone: manualPhone.trim() || '0905123456',
                    status: 'PAID',
                    group: prev.length % 2 === 0 ? 'Bảng A' : 'Bảng B',
                  },
                ]);
                setManualTeamName('');
                setManualCaptain('');
                setManualPhone('');
                setShowAddManualTeam(false);
                showToast('✓ Đã thêm đội bóng vào danh sách giải đấu!');
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>✓ Xác Nhận Thêm Đội</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Registered Teams List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            📋 Danh Sách Đội Đăng Ký ({orgTeams.length} đội) — Siêu Cúp Đà Nẵng Mở Rộng
          </Text>
          <View style={{ gap: 8 }}>
            {orgTeams.map((team) => (
              <View key={team.id} style={styles.fundRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.wrapRow}>
                    <Text style={styles.fundRowTitle}>{team.name}</Text>
                    <View style={styles.emeraldPill}>
                      <Text style={styles.emeraldPillText}>{team.group}</Text>
                    </View>
                  </View>
                  <Text style={styles.fundRowDate}>
                    👤 Đội trưởng: {team.captain} • 📞 {team.phone}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setOrgTeams((prev) =>
                      prev.map((t) =>
                        t.id === team.id
                          ? { ...t, status: t.status === 'PAID' ? 'PENDING' : 'PAID' }
                          : t
                      )
                    )
                  }
                  style={[
                    styles.statusToggleBtn,
                    team.status === 'PAID'
                      ? { backgroundColor: COLORS.emeraldSoft, borderColor: COLORS.emeraldLight }
                      : { backgroundColor: COLORS.amberSoft, borderColor: COLORS.amberLight },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '800',
                      color: team.status === 'PAID' ? COLORS.emeraldDark : COLORS.amber,
                    }}
                  >
                    {team.status === 'PAID' ? '✓ Đã đóng lệ phí' : '⏳ Chờ xác nhận cọc'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ============================================================
  // 4. DEFAULT: PLAYER PROFILE CONSOLE (Matches PlayerProfileConsole.tsx)
  // ============================================================
  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {inlineToast && (
        <View style={styles.toastBanner}>
          <Text style={styles.toastBannerText}>{inlineToast}</Text>
        </View>
      )}

      {/* Player Card Header */}
      <View style={styles.profileHeroCard}>
        <View style={styles.betweenRow}>
          <View style={styles.wrapRow}>
            <View style={styles.ovrBadge}>
              <Text style={styles.ovrScore}>86</Text>
              <Text style={styles.ovrLabel}>OVR</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{editName}</Text>
              <Text style={styles.profileMeta}>
                ⚽ {editPosition} • 👟 {editFoot}
              </Text>
              <Text style={styles.profileBio}>{editBio}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setEditingProfile(!editingProfile)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>
              {editingProfile ? 'Đóng Chỉnh Sửa ▲' : '✏️ Chỉnh Sửa Hồ Sơ'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 6 Player Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Tốc độ (PAC)', val: 88 },
            { label: 'Dứt điểm (SHO)', val: 85 },
            { label: 'Chuyền bóng (PAS)', val: 89 },
            { label: 'Rê dắt (DRI)', val: 86 },
            { label: 'Phòng ngự (DEF)', val: 78 },
            { label: 'Thể lực (PHY)', val: 90 },
          ].map((st, idx) => (
            <View key={idx} style={styles.statBox}>
              <Text style={styles.statBoxVal}>{st.val}</Text>
              <Text style={styles.statBoxLabel}>{st.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Inline Profile Editor (NO MODAL) */}
      {editingProfile && (
        <View style={styles.inlineFormCard}>
          <Text style={styles.sectionTitle}>✏️ Cập Nhật Thông Tin Cầu Thủ</Text>
          <View style={styles.wrapRow}>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Họ và tên VĐV..."
              style={[styles.textInput, { flex: 1, minWidth: 180 }]}
            />
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Số điện thoại..."
              style={[styles.textInput, { flex: 1, minWidth: 150 }]}
            />
          </View>
          <View style={styles.wrapRow}>
            <TextInput
              value={editPosition}
              onChangeText={setEditPosition}
              placeholder="Vị trí sở trường..."
              style={[styles.textInput, { flex: 1, minWidth: 180 }]}
            />
            <TextInput
              value={editFoot}
              onChangeText={setEditFoot}
              placeholder="Chân thuận..."
              style={[styles.textInput, { flex: 1, minWidth: 150 }]}
            />
          </View>
          <TextInput
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Giới thiệu phong cách thi đấu..."
            style={styles.textInput}
          />
          <TouchableOpacity
            onPress={() => {
              if (onUpdateUser && user) {
                onUpdateUser({ ...user, fullName: editName, name: editName, phone: editPhone });
              }
              setEditingProfile(false);
              showToast('✓ Đã lưu hồ sơ vận động viên thành công!');
            }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>✓ Lưu Thay Đổi Hồ Sơ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Match History & Quick Links */}
      <View style={styles.sectionCard}>
        <View style={styles.betweenRow}>
          <Text style={styles.sectionTitle}>📊 Lịch Sử Thi Đấu & Thành Tích Gần Đây</Text>
          {onNavigateTab && (
            <View style={styles.wrapRow}>
              <TouchableOpacity
                onPress={() => onNavigateTab('my-activities')}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>📋 Vé Đã Đặt & Điểm Danh</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onNavigateTab('team-management')}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>🛡️ Đội Bóng Của Tôi</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {[
          {
            id: 'mh1',
            match: 'FC Anh Em Hải Châu 4 - 2 FC Liên Chiểu',
            venue: 'Cụm Sân Bóng Đá Đại Nắng (Sân 7A)',
            date: '05/11/2026',
            contrib: '⚽ 2 Bàn thắng • 🎯 1 Kiến tạo • ⭐ Cầu thủ xuất sắc nhất trận (MVP)',
          },
          {
            id: 'mh2',
            match: 'FC Anh Em Hải Châu 3 - 3 FC Tia Chớp Sơn Trà',
            venue: 'Cụm Sân Bóng Đá Biển Sơn Trà',
            date: '01/11/2026',
            contrib: '⚽ 1 Bàn thắng • 🎯 2 Kiến tạo • 🤝 Fair-play 100%',
          },
        ].map((item) => (
          <View key={item.id} style={styles.fundRow}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={styles.fundRowTitle}>{item.match}</Text>
              <Text style={styles.fundRowDate}>
                📍 {item.venue} • 📅 {item.date}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.emeraldDark }}>
                {item.contrib}
              </Text>
            </View>
          </View>
        ))}
      </View>
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
  betweenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
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
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  inlineFormCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.emeraldLight,
    gap: 12,
  },
  inlineSubForm: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
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
  },
  gridWrap: {
    gap: 14,
  },
  clubCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  emeraldPill: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  emeraldPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  clubWinRate: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  clubMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  nextMatchBanner: {
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  nextMatchText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  fundCaption: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  fundValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  fundRow: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  fundRowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  fundRowDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  fundRowAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  statusToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Sports Pass Card
  sportsPassCard: {
    backgroundColor: '#064e3b',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  passBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  passBadgeText: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '800',
  },
  passIdText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  passHolderName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },
  passHolderSub: {
    color: '#d1fae5',
    fontSize: 13,
  },
  passPerksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  passPerkBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  passPerkVal: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: '900',
  },
  passPerkLabel: {
    color: COLORS.white,
    fontSize: 13,
  },
  passCopyBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  passCopyBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  passSecondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  passSecondaryBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  tierCard: {
    flex: 1,
    minWidth: 210,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  tierCardActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emerald,
  },
  tierName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  tierPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  tierDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },

  // Profile Console
  profileHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  ovrBadge: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: COLORS.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ovrScore: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },
  ovrLabel: {
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  profileMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.emeraldDark,
    marginTop: 2,
  },
  profileBio: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statBox: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    gap: 2,
  },
  statBoxVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  statBoxLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
});
