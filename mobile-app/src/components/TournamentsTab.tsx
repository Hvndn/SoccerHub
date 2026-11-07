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
} from '../theme/responsive';
import {
  API_URL,
  AuthUser,
  TournamentItem,
  BracketMatchItem,
  TopScorerItem,
  INITIAL_BRACKET_MATCHES,
  INITIAL_TOP_SCORERS,
} from '../services/api';

interface TournamentsTabProps {
  user: AuthUser | null;
  token: string | null;
  tournaments: TournamentItem[];
  onUpdateTournaments: (updated: TournamentItem[]) => void;
}

const STANDINGS_TEAMS = [
  { rank: 1, team: 'FC Chảo Lửa', played: 4, won: 3, drawn: 1, lost: 0, gd: '+7', pts: 10, form: ['W', 'W', 'D', 'W'] },
  { rank: 2, team: 'FC Tia Chớp', played: 4, won: 2, drawn: 2, lost: 0, gd: '+4', pts: 8, form: ['W', 'D', 'W', 'D'] },
  { rank: 3, team: 'FC Gia Định', played: 4, won: 2, drawn: 1, lost: 1, gd: '+2', pts: 7, form: ['L', 'W', 'W', 'D'] },
  { rank: 4, team: 'FC Văn Phòng SG', played: 4, won: 1, drawn: 0, lost: 3, gd: '-5', pts: 3, form: ['W', 'L', 'L', 'L'] },
];

export default function TournamentsTab({
  user,
  token,
  tournaments,
  onUpdateTournaments,
}: TournamentsTabProps) {
  const layout = useResponsiveLayout();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ONGOING'>('ALL');
  const [selectedTournamentId, setSelectedTournamentId] = useState<number>(
    tournaments[0]?.id ?? 301
  );
  const [subTab, setSubTab] = useState<'BRACKET' | 'MATCHES' | 'STANDINGS'>('MATCHES');
  const [standingsMode, setStandingsMode] = useState<'TEAMS' | 'SCORERS'>('SCORERS');
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  // Inline Team Registration State per tournament ID
  const [registeringTourId, setRegisteringTourId] = useState<number | null>(null);
  const [regTeamName, setRegTeamName] = useState(
    user?.fullName ? `FC ${user.fullName}` : 'FC Anh Em Sài Gòn'
  );
  const [regCaptain, setRegCaptain] = useState(user?.fullName || 'Nguyễn Minh Quân');
  const [regPhone, setRegPhone] = useState(user?.phone || '0909123456');
  const [regKit, setRegKit] = useState('Đỏ');

  // Bracket Matches & Top Scorers State (synchronized when goals/cards are logged!)
  const [matches, setMatches] = useState<BracketMatchItem[]>(INITIAL_BRACKET_MATCHES);
  const [scorers, setScorers] = useState<TopScorerItem[]>(INITIAL_TOP_SCORERS);

  // Inline Digital Match Report Logger State per match ID
  const [activeReportMatchId, setActiveReportMatchId] = useState<string | null>('qf2');
  const [eventType, setEventType] = useState<'GOAL' | 'YELLOW' | 'RED'>('GOAL');
  const [eventTeam, setEventTeam] = useState<'t1' | 't2'>('t1');
  const [eventPlayer, setEventPlayer] = useState('');
  const [eventMinute, setEventMinute] = useState('65');

  const showNotice = (msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 4000);
  };

  const handleRegisterTeam = async (tour: TournamentItem) => {
    if (!regTeamName.trim() || !regPhone.trim()) {
      showNotice('⚠️ Vui lòng nhập tên đội bóng và số điện thoại đội trưởng.');
      return;
    }
    try {
      await fetch(`${API_URL}/tournaments/${tour.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          teamName: regTeamName.trim(),
          captainName: regCaptain.trim(),
          captainPhone: regPhone.trim(),
          kitColor: regKit,
        }),
      });
    } catch {
      // Local fallback
    }
    const updated = tournaments.map((t) =>
      t.id === tour.id
        ? { ...t, registeredTeams: Math.min(t.totalTeams, (t.registeredTeams || 0) + 1) }
        : t
    );
    onUpdateTournaments(updated);
    setRegisteringTourId(null);
    showNotice(
      `🏆 Đã đăng ký đội "${regTeamName.trim()}" tham gia giải "${tour.title}" thành công!`
    );
  };

  const handleAddMatchEvent = (match: BracketMatchItem) => {
    const playerClean = eventPlayer.trim() || 'Nguyễn Quang Hải';
    const minuteNum = Math.max(1, Math.min(120, Number(eventMinute) || 45));
    const teamName = eventTeam === 't1' ? match.t1 : match.t2;

    const newEvent = {
      id: `ev-${Date.now()}`,
      type: eventType,
      team: eventTeam,
      playerName: playerClean,
      minute: minuteNum,
    };

    const updatedMatches = matches.map((m) => {
      if (m.id !== match.id) return m;
      const curS1 = m.s1 ?? 0;
      const curS2 = m.s2 ?? 0;
      return {
        ...m,
        status: m.status === 'UPCOMING' ? ('LIVE' as const) : m.status,
        s1: eventType === 'GOAL' && eventTeam === 't1' ? curS1 + 1 : curS1,
        s2: eventType === 'GOAL' && eventTeam === 't2' ? curS2 + 1 : curS2,
        events: [...m.events, newEvent],
      };
    });
    setMatches(updatedMatches);

    // Synchronize Top Scorers leaderboard automatically
    setScorers((prev) => {
      const idx = prev.findIndex(
        (s) => s.playerName.toLowerCase() === playerClean.toLowerCase()
      );
      let nextList: TopScorerItem[];
      if (idx >= 0) {
        nextList = prev.map((s, i) =>
          i === idx
            ? {
                ...s,
                goals: eventType === 'GOAL' ? s.goals + 1 : s.goals,
                yellowCards: eventType === 'YELLOW' ? s.yellowCards + 1 : s.yellowCards,
                redCards: eventType === 'RED' ? s.redCards + 1 : s.redCards,
              }
            : s
        );
      } else {
        nextList = [
          ...prev,
          {
            rank: prev.length + 1,
            playerName: playerClean,
            teamName,
            goals: eventType === 'GOAL' ? 1 : 0,
            assists: 0,
            yellowCards: eventType === 'YELLOW' ? 1 : 0,
            redCards: eventType === 'RED' ? 1 : 0,
            matchesPlayed: 1,
            mvpCount: eventType === 'GOAL' ? 1 : 0,
          },
        ];
      }
      return nextList
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
        .map((item, i) => ({ ...item, rank: i + 1 }));
    });

    setEventPlayer('');
    showNotice(
      `📱 Đã ghi Biên Bản Điện Tử: ${
        eventType === 'GOAL' ? '⚽ Bàn thắng' : eventType === 'YELLOW' ? '🟨 Thẻ vàng' : '🟥 Thẻ đỏ'
      } — ${playerClean} (${teamName}, phút ${minuteNum}')!`
    );
  };

  const filteredTournaments = tournaments.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  const activeTournament =
    tournaments.find((t) => t.id === selectedTournamentId) || tournaments[0];

  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {/* ============================================================ */}
      {/* 1. BANNER GIẢI ĐẤU PHONG TRÀO & CHỌN GIẢI ĐẤU */}
      {/* ============================================================ */}
      <View style={styles.heroCard}>
        <View style={styles.wrapRow}>
          <View style={styles.trophyBadge}>
            <Text style={styles.trophyBadgeText}>🏆 Hệ Thống Giải Đấu Bóng Đá Phủi Chuyên Nghiệp</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Giải Đấu, Nhánh Đấu & Vua Phá Lưới</Text>
        <Text style={styles.heroSub}>
          Đăng ký đội tham gia trực tiếp, theo dõi cây nhánh đấu Bracket, Biên bản trận đấu điện tử (Ghi bàn & Thẻ phạt) và Bảng xếp hạng Chiếc Giày Vàng.
        </Text>

        {/* Status Filter Pills */}
        <View style={[styles.wrapRow, { marginTop: 12 }]}>
          {[
            { id: 'ALL', label: `Tất cả giải (${tournaments.length})` },
            { id: 'OPEN', label: '🟢 Đang mở đăng ký' },
            { id: 'ONGOING', label: '🔥 Đang khởi tranh' },
          ].map((st) => {
            const active = statusFilter === st.id;
            return (
              <TouchableOpacity
                key={st.id}
                onPress={() => setStatusFilter(st.id as any)}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    active && styles.filterPillTextActive,
                  ]}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {inlineNotice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>{inlineNotice}</Text>
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. DANH SÁCH THẺ GIẢI ĐẤU & ĐĂNG KÝ ĐỘI INLINE */}
      {/* ============================================================ */}
      <View
        style={[
          styles.tourGrid,
          layout.gridColumns > 1 && {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: layout.cardGap,
          },
        ]}
      >
        {filteredTournaments.map((tour) => {
          const isSelected = activeTournament?.id === tour.id;
          const isRegOpen = registeringTourId === tour.id;
          const cardWidthStyle =
            layout.gridColumns > 1 && !isRegOpen
              ? { width: layout.gridCardWidth }
              : { width: '100%' as const };

          return (
            <View
              key={tour.id}
              style={[
                styles.tourCard,
                cardWidthStyle,
                isSelected && styles.tourCardActive,
              ]}
            >
              <View style={styles.tourHeaderRow}>
                <View
                  style={[
                    styles.statusBadge,
                    tour.status === 'OPEN'
                      ? { backgroundColor: COLORS.emeraldSoft }
                      : { backgroundColor: COLORS.amberLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      tour.status === 'OPEN'
                        ? { color: COLORS.emeraldDark }
                        : { color: '#92400e' },
                    ]}
                  >
                    {tour.status === 'OPEN' ? 'Đang mở đăng ký' : 'Đang diễn ra'}
                  </Text>
                </View>

                <View style={styles.sportBadge}>
                  <Text style={styles.sportBadgeText}>⚽ {tour.sportType || 'Sân 7 Người'}</Text>
                </View>
              </View>

              <Text style={styles.tourTitle}>{tour.title}</Text>
              <Text style={styles.tourMeta}>📍 {tour.pitchName || tour.location}</Text>
              <Text style={styles.tourMeta}>
                📅 Khởi tranh: {tour.startDate || '15/11/2026'} • Thể thức: {tour.format || 'Đấu bảng + Loại trực tiếp'}
              </Text>

              <View style={styles.prizeRow}>
                <View style={styles.prizeBox}>
                  <Text style={styles.prizeLabel}>Tổng giải thưởng</Text>
                  <Text style={styles.prizeValue}>{formatVnd(tour.prizePool)}</Text>
                </View>
                <View style={styles.prizeBox}>
                  <Text style={styles.prizeLabel}>Lệ phí tham gia</Text>
                  <Text style={[styles.prizeValue, { color: COLORS.text }]}>
                    {formatVnd(tour.entryFee || 2000000)}
                  </Text>
                </View>
                <View style={styles.prizeBox}>
                  <Text style={styles.prizeLabel}>Số đội đã chốt</Text>
                  <Text style={[styles.prizeValue, { color: COLORS.emeraldDark }]}>
                    {tour.registeredTeams || 12}/{tour.totalTeams || 16} đội
                  </Text>
                </View>
              </View>

              <View style={styles.wrapRow}>
                <TouchableOpacity
                  onPress={() => setSelectedTournamentId(tour.id)}
                  style={[
                    styles.viewBracketBtn,
                    isSelected && { backgroundColor: COLORS.primaryDark },
                  ]}
                >
                  <Text style={styles.viewBracketBtnText}>
                    {isSelected
                      ? '📊 Đang Xem Nhánh Đấu & BXH Bên Dưới'
                      : '📊 Xem Nhánh Đấu & Vua Phá Lưới'}
                  </Text>
                </TouchableOpacity>

                {tour.status === 'OPEN' && (
                  <TouchableOpacity
                    onPress={() => setRegisteringTourId(isRegOpen ? null : tour.id)}
                    style={styles.regTeamBtn}
                  >
                    <Text style={styles.regTeamBtnText}>
                      {isRegOpen ? 'Đóng Đăng Ký ▲' : '+ Đăng Ký Đội Tham Gia ▼'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* INLINE TEAM REGISTRATION FORM */}
              {isRegOpen && (
                <View style={styles.inlineRegBox}>
                  <Text style={styles.inlineRegTitle}>
                    ✍️ Đăng Ký Đội Tham Dự Giải: {tour.title}
                  </Text>

                  <View style={styles.inputRowWrap}>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Tên Đội Bóng (CLB)</Text>
                      <TextInput
                        value={regTeamName}
                        onChangeText={setRegTeamName}
                        style={styles.textInput}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Họ tên Đội Trưởng</Text>
                      <TextInput
                        value={regCaptain}
                        onChangeText={setRegCaptain}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <View style={styles.inputRowWrap}>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Số điện thoại Zalo nhận lịch bốc thăm</Text>
                      <TextInput
                        value={regPhone}
                        onChangeText={setRegPhone}
                        keyboardType="phone-pad"
                        style={styles.textInput}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Màu áo truyền thống của đội</Text>
                      <TextInput
                        value={regKit}
                        onChangeText={setRegKit}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRegisterTeam(tour)}
                    style={styles.submitRegBtn}
                  >
                    <Text style={styles.submitRegBtnText}>
                      ✅ Gửi Hồ Sơ Đăng Ký Đội Ngay
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* ============================================================ */}
      {/* 3. TRUNG TÂM ĐIỀU HÀNH GIẢI ĐẤU: NHÁNH ĐẤU + BIÊN BẢN + VUA PHÁ LƯỚI */}
      {/* ============================================================ */}
      {activeTournament && (
        <View style={styles.hubContainer}>
          <View style={styles.hubHeader}>
            <Text style={styles.hubTitle}>
              🏟️ Trung Tâm Dữ Liệu: {activeTournament.title}
            </Text>
            <Text style={styles.hubSub}>
              Cập nhật trực tiếp sơ đồ nhánh đấu, biên bản bàn thắng/thẻ phạt từng trận và cuộc đua Chiếc Giày Vàng.
            </Text>

            {/* 3 Sub-Tabs matching Web TournamentBracket */}
            <View style={[styles.wrapRow, { marginTop: 12 }]}>
              {[
                { id: 'MATCHES', label: '📱 Biên Bản Trận Đấu & Tỷ Số' },
                { id: 'STANDINGS', label: '👑 Vua Phá Lưới & Bảng Xếp Hạng' },
                { id: 'BRACKET', label: '🌿 Sơ Đồ Nhánh Đấu (Bracket)' },
              ].map((t) => {
                const active = subTab === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setSubTab(t.id as any)}
                    style={[styles.subTabBtn, active && styles.subTabBtnActive]}
                  >
                    <Text
                      style={[
                        styles.subTabBtnText,
                        active && styles.subTabBtnTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ============================================================ */}
          {/* SUB-TAB A: 📱 BIÊN BẢN TRẬN ĐẤU ĐIỆN TỬ & TỶ SỐ TRỰC TIẾP */}
          {/* ============================================================ */}
          {subTab === 'MATCHES' && (
            <View style={styles.matchesSection}>
              {matches.map((m) => {
                const isReportOpen = activeReportMatchId === m.id;
                return (
                  <View key={m.id} style={styles.matchReportCard}>
                    <View style={styles.matchTopMeta}>
                      <View style={styles.roundBadge}>
                        <Text style={styles.roundBadgeText}>{m.matchLabel}</Text>
                      </View>
                      <Text style={styles.matchTimeText}>🕒 {m.time}</Text>
                      <View
                        style={[
                          styles.liveStatusPill,
                          m.status === 'LIVE'
                            ? { backgroundColor: COLORS.roseSoft }
                            : m.status === 'COMPLETED'
                            ? { backgroundColor: COLORS.emeraldSoft }
                            : { backgroundColor: COLORS.surfaceMuted },
                        ]}
                      >
                        <Text
                          style={[
                            styles.liveStatusText,
                            m.status === 'LIVE'
                              ? { color: COLORS.rose }
                              : m.status === 'COMPLETED'
                              ? { color: COLORS.emeraldDark }
                              : { color: COLORS.textMuted },
                          ]}
                        >
                          {m.status === 'LIVE'
                            ? '🔴 Đang đá trực tiếp'
                            : m.status === 'COMPLETED'
                            ? '✅ Đã kết thúc'
                            : '⏳ Sắp diễn ra'}
                        </Text>
                      </View>
                    </View>

                    {/* Scoreboard Row */}
                    <View style={styles.scoreboardRow}>
                      <View style={styles.teamSide}>
                        <Text style={styles.teamNameBig}>{m.t1}</Text>
                      </View>

                      <View style={styles.scoreCenterPill}>
                        <Text style={styles.scoreTextBig}>
                          {m.s1 !== null ? m.s1 : '-'} : {m.s2 !== null ? m.s2 : '-'}
                        </Text>
                      </View>

                      <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
                        <Text style={[styles.teamNameBig, { textAlign: 'right' }]}>{m.t2}</Text>
                      </View>
                    </View>

                    {/* Recorded Events (Goals & Cards) */}
                    {m.events.length > 0 && (
                      <View style={styles.eventsTimeline}>
                        {m.events.map((ev) => (
                          <View key={ev.id} style={styles.eventPill}>
                            <Text style={styles.eventPillText}>
                              {ev.type === 'GOAL' ? '⚽' : ev.type === 'YELLOW' ? '🟨' : '🟥'}{' '}
                              {ev.playerName} ({ev.team === 't1' ? m.t1 : m.t2}) — {ev.minute}'
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Toggle Digital Match Report Button */}
                    <TouchableOpacity
                      onPress={() =>
                        setActiveReportMatchId(isReportOpen ? null : m.id)
                      }
                      style={styles.toggleReportBtn}
                    >
                      <Text style={styles.toggleReportBtnText}>
                        📱 {isReportOpen ? 'Thu Gọn Biên Bản Điện Tử ▲' : 'Mở Biên Bản Điện Tử (Ghi Bàn / Thẻ Phạt) ▼'}
                      </Text>
                    </TouchableOpacity>

                    {/* INLINE DIGITAL MATCH REPORT LOGGER */}
                    {isReportOpen && (
                      <View style={styles.inlineLoggerBox}>
                        <Text style={styles.loggerTitle}>
                          ✍️ Ghi Nhận Diễn Biến Trận Đấu (Tự động cộng tỷ số & Vua phá lưới)
                        </Text>

                        <Text style={styles.fieldLabel}>1. Loại sự kiện trên sân:</Text>
                        <View style={styles.wrapRow}>
                          {[
                            { id: 'GOAL', label: '⚽ Bàn thắng (+1 bàn)' },
                            { id: 'YELLOW', label: '🟨 Thẻ vàng' },
                            { id: 'RED', label: '🟥 Thẻ đỏ' },
                          ].map((et) => (
                            <TouchableOpacity
                              key={et.id}
                              onPress={() => setEventType(et.id as any)}
                              style={[
                                styles.smallChip,
                                eventType === et.id && styles.smallChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.smallChipText,
                                  eventType === et.id && styles.smallChipTextActive,
                                ]}
                              >
                                {et.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={styles.fieldLabel}>2. Chọn đội bóng:</Text>
                        <View style={styles.wrapRow}>
                          <TouchableOpacity
                            onPress={() => setEventTeam('t1')}
                            style={[
                              styles.smallChip,
                              eventTeam === 't1' && styles.smallChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.smallChipText,
                                eventTeam === 't1' && styles.smallChipTextActive,
                              ]}
                            >
                              🛡️ {m.t1}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => setEventTeam('t2')}
                            style={[
                              styles.smallChip,
                              eventTeam === 't2' && styles.smallChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.smallChipText,
                                eventTeam === 't2' && styles.smallChipTextActive,
                              ]}
                            >
                              🛡️ {m.t2}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.inputRowWrap}>
                          <View style={[styles.inputCol, { flex: 2 }]}>
                            <Text style={styles.fieldLabel}>Tên cầu thủ ghi bàn / nhận thẻ</Text>
                            <TextInput
                              value={eventPlayer}
                              onChangeText={setEventPlayer}
                              placeholder="VD: Nguyễn Quang Hải..."
                              style={styles.textInput}
                            />
                          </View>
                          <View style={[styles.inputCol, { flex: 1, minWidth: 90 }]}>
                            <Text style={styles.fieldLabel}>Phút thi đấu</Text>
                            <TextInput
                              value={eventMinute}
                              onChangeText={setEventMinute}
                              keyboardType="numeric"
                              placeholder="65"
                              style={styles.textInput}
                            />
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleAddMatchEvent(m)}
                          style={styles.saveEventBtn}
                        >
                          <Text style={styles.saveEventBtnText}>
                            + Lưu Vào Biên Bản Trận Đấu & Cập Nhật Vua Phá Lưới
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ============================================================ */}
          {/* SUB-TAB B: 👑 VUA PHÁ LƯỚI & BẢNG XẾP HẠNG ĐỘI */}
          {/* ============================================================ */}
          {subTab === 'STANDINGS' && (
            <View style={styles.standingsSection}>
              <View style={styles.wrapRow}>
                <TouchableOpacity
                  onPress={() => setStandingsMode('SCORERS')}
                  style={[
                    styles.modeSwitchBtn,
                    standingsMode === 'SCORERS' && styles.modeSwitchBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeSwitchText,
                      standingsMode === 'SCORERS' && styles.modeSwitchTextActive,
                    ]}
                  >
                    👑 Bảng Vua Phá Lưới & Kiến Tạo ({scorers.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStandingsMode('TEAMS')}
                  style={[
                    styles.modeSwitchBtn,
                    standingsMode === 'TEAMS' && styles.modeSwitchBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeSwitchText,
                      standingsMode === 'TEAMS' && styles.modeSwitchTextActive,
                    ]}
                  >
                    🛡️ Bảng Xếp Hạng Đội Bóng
                  </Text>
                </TouchableOpacity>
              </View>

              {standingsMode === 'SCORERS' ? (
                <View style={{ gap: 10, marginTop: 10 }}>
                  {/* Top 3 Golden Boot Podium */}
                  <View style={styles.podiumRow}>
                    {scorers.slice(0, 3).map((sc, idx) => (
                      <View
                        key={sc.playerName}
                        style={[
                          styles.podiumCard,
                          idx === 0 && styles.podiumCardGold,
                        ]}
                      >
                        <Text style={styles.podiumMedal}>
                          {idx === 0 ? '🥇 Chiếc Giày Vàng' : idx === 1 ? '🥈 Hạng Nhì' : '🥉 Hạng Ba'}
                        </Text>
                        <Text style={styles.podiumName}>{sc.playerName}</Text>
                        <Text style={styles.podiumTeam}>{sc.teamName}</Text>
                        <View style={styles.wrapRow}>
                          <View style={styles.goalCountPill}>
                            <Text style={styles.goalCountPillText}>⚽ {sc.goals} bàn</Text>
                          </View>
                          <View style={styles.assistCountPill}>
                            <Text style={styles.assistCountPillText}>🎯 {sc.assists} kiến tạo</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Full Scorers List */}
                  {scorers.map((sc) => (
                    <View key={sc.playerName} style={styles.scorerRow}>
                      <View style={styles.rankCircle}>
                        <Text style={styles.rankCircleText}>#{sc.rank}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scorerName}>{sc.playerName}</Text>
                        <Text style={styles.scorerTeam}>
                          🛡️ {sc.teamName} • ⭐ {sc.mvpCount} lần Cầu thủ xuất sắc
                        </Text>
                      </View>
                      <View style={styles.scorerStatsRight}>
                        <Text style={styles.scorerGoalsText}>⚽ {sc.goals} bàn</Text>
                        <Text style={styles.scorerSubStats}>
                          🎯 {sc.assists} KT • 🟨 {sc.yellowCards} • 🟥 {sc.redCards}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ gap: 8, marginTop: 10 }}>
                  {STANDINGS_TEAMS.map((st) => (
                    <View key={st.team} style={styles.teamStandingsRow}>
                      <View style={styles.rankCircle}>
                        <Text style={styles.rankCircleText}>{st.rank}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scorerName}>{st.team}</Text>
                        <Text style={styles.scorerTeam}>
                          Đá {st.played} trận • Thắng {st.won} • Hòa {st.drawn} • Thua {st.lost} • Hiệu số {st.gd}
                        </Text>
                      </View>
                      <View style={styles.ptsBadge}>
                        <Text style={styles.ptsBadgeText}>{st.pts} điểm</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ============================================================ */}
          {/* SUB-TAB C: 🌿 SƠ ĐỒ NHÁNH ĐẤU LOẠI TRỰC TIẾP (BRACKET) */}
          {/* ============================================================ */}
          {subTab === 'BRACKET' && (
            <View style={styles.bracketSection}>
              {[
                { round: 'QF', title: '🔥 Vòng Tứ Kết' },
                { round: 'SF', title: '⚡ Vòng Bán Kết' },
                { round: 'FINAL', title: '🏆 Chung Kết Tranh Cúp Vô Địch' },
              ].map((r) => (
                <View key={r.round} style={styles.bracketRoundBlock}>
                  <Text style={styles.bracketRoundTitle}>{r.title}</Text>
                  <View style={styles.wrapRow}>
                    {matches
                      .filter((m) => m.round === r.round)
                      .map((m) => (
                        <View key={m.id} style={styles.bracketNodeCard}>
                          <Text style={styles.bracketNodeMeta}>
                            {m.matchLabel} • {m.time}
                          </Text>
                          <View style={styles.bracketTeamLine}>
                            <Text style={styles.bracketTeamName}>{m.t1}</Text>
                            <Text style={styles.bracketTeamScore}>
                              {m.s1 !== null ? m.s1 : '-'}
                            </Text>
                          </View>
                          <View style={styles.bracketTeamLine}>
                            <Text style={styles.bracketTeamName}>{m.t2}</Text>
                            <Text style={styles.bracketTeamScore}>
                              {m.s2 !== null ? m.s2 : '-'}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
  },
  trophyBadge: {
    backgroundColor: COLORS.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trophyBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 8,
  },
  heroSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    lineHeight: 19,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
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
  tourGrid: {
    width: '100%',
    gap: 14,
    marginBottom: 16,
  },
  tourCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 4,
    gap: 8,
  },
  tourCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  tourHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sportBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sportBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tourTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  tourMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  prizeRow: {
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
  prizeBox: {
    minWidth: 95,
  },
  prizeLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  prizeValue: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.amber,
    marginTop: 2,
  },
  viewBracketBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  viewBracketBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  regTeamBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  regTeamBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineRegBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 10,
  },
  inlineRegTitle: {
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
  submitRegBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  submitRegBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  hubContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 14,
  },
  hubHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceMuted,
    paddingBottom: 12,
  },
  hubTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  hubSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  subTabBtn: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subTabBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  subTabBtnTextActive: {
    color: COLORS.white,
  },
  matchesSection: {
    gap: 12,
  },
  matchReportCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  matchTopMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  roundBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roundBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  matchTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  liveStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveStatusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  teamSide: {
    flex: 1,
  },
  teamNameBig: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  scoreCenterPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreTextBig: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '900',
  },
  eventsTimeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  eventPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  eventPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  toggleReportBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  toggleReportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  inlineLoggerBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 8,
  },
  loggerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
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
  saveEventBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 4,
  },
  saveEventBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  standingsSection: {
    gap: 10,
  },
  modeSwitchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeSwitchBtnActive: {
    backgroundColor: COLORS.amberLight,
    borderColor: COLORS.amberBright,
  },
  modeSwitchText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  modeSwitchTextActive: {
    color: '#92400e',
    fontWeight: '900',
  },
  podiumRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  podiumCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  podiumCardGold: {
    backgroundColor: COLORS.amberSoft,
    borderColor: COLORS.amberBright,
    borderWidth: 1.5,
  },
  podiumMedal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.amber,
  },
  podiumName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  podiumTeam: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  goalCountPill: {
    backgroundColor: COLORS.emeraldSoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalCountPillText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  assistCountPill: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  assistCountPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  rankCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankCircleText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
  },
  scorerName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  scorerTeam: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scorerStatsRight: {
    alignItems: 'flex-end',
  },
  scorerGoalsText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  scorerSubStats: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  teamStandingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  ptsBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ptsBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  bracketSection: {
    gap: 14,
  },
  bracketRoundBlock: {
    gap: 8,
  },
  bracketRoundTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  bracketNodeCard: {
    flex: 1,
    minWidth: 230,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  bracketNodeMeta: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  bracketTeamLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  bracketTeamName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  bracketTeamScore: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
