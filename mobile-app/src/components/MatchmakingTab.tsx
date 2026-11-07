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
  KIT_COLORS,
  getKitColorInfo,
  useResponsiveLayout,
  todayLocal,
  formatVnd,
  copyTextWithFeedback,
} from '../theme/responsive';
import {
  API_URL,
  AuthUser,
  MatchmakingPostItem,
} from '../services/api';

interface MatchmakingTabProps {
  user: AuthUser | null;
  token: string | null;
  posts: MatchmakingPostItem[];
  onUpdatePosts: (updated: MatchmakingPostItem[]) => void;
}

export default function MatchmakingTab({
  user,
  token,
  posts,
  onUpdatePosts,
}: MatchmakingTabProps) {
  const layout = useResponsiveLayout();

  // Filter States
  const [filterMode, setFilterMode] = useState<'ALL' | 'MATCH' | 'SOS'>('ALL');
  const [sportFilter, setSportFilter] = useState<string>('ALL');
  const [inlineNotice, setInlineNotice] = useState<string | null>(null);

  // Inline Create Form State (NONE | CREATE_MATCH | CREATE_SOS)
  const [activeForm, setActiveForm] = useState<'NONE' | 'CREATE_MATCH' | 'CREATE_SOS'>('NONE');
  const [teamName, setTeamName] = useState(
    user?.fullName ? `FC ${user.fullName}` : 'FC Anh Em Sài Gòn'
  );
  const [captainPhone, setCaptainPhone] = useState(user?.phone || '0909123456');
  const [pitchName, setPitchName] = useState('Tổ Hợp Sân Cỏ Nhân Tạo Chảo Lửa Pro (Sân 7A)');
  const [matchTime, setMatchTime] = useState(`19:00 - 20:30 • Hôm nay (${todayLocal()})`);
  const [pitchType, setPitchType] = useState<'SAN_5' | 'SAN_7' | 'FUTSAL'>('SAN_7');
  const [paymentModel, setPaymentModel] = useState<'50_50' | '70_30' | 'LOSER_PAYS' | 'HOST_COVER'>('50_50');
  const [estimatedFee, setEstimatedFee] = useState('240000');
  const [notes, setNotes] = useState('Giao lưu vui vẻ, giữ chân, không xoạc bóng gầm giày.');

  // Match Terms Agreement Fields
  const [matchStyle, setMatchStyle] = useState('Đá dưỡng sinh / Vui vẻ');
  const [ageGroup, setAgeGroup] = useState('Phong trào (U25 - U35)');
  const [homeKitColor, setHomeKitColor] = useState('Đỏ');
  const [refereeOption, setRefereeOption] = useState('Thuê trọng tài 50-50');

  // SOS Fields
  const [neededCount, setNeededCount] = useState<number>(2);
  const [neededPositions, setNeededPositions] = useState('Thủ môn, Tiền vệ');

  // Inline Accept Match Form State per post ID
  const [acceptingPostId, setAcceptingPostId] = useState<number | null>(null);
  const [oppTeamName, setOppTeamName] = useState(
    user?.fullName ? `FC ${user.fullName}` : 'FC Giao Lưu Phủi'
  );
  const [oppCaptainName, setOppCaptainName] = useState(user?.fullName || 'Nguyễn Minh Quân');
  const [oppPhone, setOppPhone] = useState(user?.phone || '0909123456');
  const [awayKitColor, setAwayKitColor] = useState('Trắng');
  const [acceptBusy, setAcceptBusy] = useState(false);

  const showNotice = (msg: string) => {
    setInlineNotice(msg);
    setTimeout(() => setInlineNotice(null), 4500);
  };

  const handleCreatePost = async (type: 'MATCH' | 'SOS') => {
    const newPost: MatchmakingPostItem = {
      id: Date.now(),
      teamName:
        type === 'SOS'
          ? `🚨 SOS: ${teamName} Cần Gấp ${neededCount} Chân`
          : teamName.trim() || 'FC Phủi Sài Gòn',
      captainName: user?.fullName || 'Đội Trưởng',
      captainPhone: captainPhone.trim() || '0909123456',
      pitchName: pitchName.trim() || 'Sân Cỏ Nhân Tạo Turfzone',
      area: 'TP.HCM',
      pitchType,
      matchTime: matchTime.trim() || `19:00 - 20:30 (${todayLocal()})`,
      skillLevel: type === 'SOS' ? 'Mọi trình độ' : matchStyle,
      paymentModel: type === 'SOS' ? 'HOST_COVER' : paymentModel,
      estimatedFee: type === 'SOS' ? 0 : Number(estimatedFee) || 240000,
      notes:
        type === 'SOS'
          ? `Đội thiếu người đột xuất sát giờ đá, cần gấp ${neededCount} vị trí (${neededPositions}). Anh em gần sân ghé đá giao lưu miễn phí nhé!`
          : notes,
      status: 'OPEN',
      postType: type,
      neededCount: type === 'SOS' ? neededCount : undefined,
      neededPositions: type === 'SOS' ? neededPositions : undefined,
      matchStyle,
      ageGroup,
      homeKitColor,
      refereeOption,
    };

    try {
      const res = await fetch(`${API_URL}/community/matchmaking-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        const saved = await res.json();
        onUpdatePosts([{ ...newPost, ...(saved || {}) }, ...posts]);
      } else {
        onUpdatePosts([newPost, ...posts]);
      }
    } catch {
      onUpdatePosts([newPost, ...posts]);
    }

    setActiveForm('NONE');
    showNotice(
      type === 'SOS'
        ? `🚨 Đã phát tin SOS tìm ${neededCount} viện binh (${neededPositions}) lên đầu sàn Chợ Kèo!`
        : `🤝 Đã đăng kèo giao hữu kèm Phiếu Thỏa Thuận Kèo & Màu Áo (${homeKitColor}) lên sàn!`
    );
  };

  const handleConfirmAccept = async (post: MatchmakingPostItem) => {
    setAcceptBusy(true);
    try {
      await fetch(`${API_URL}/community/matchmaking-posts/${post.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          opponentTeamName: oppTeamName.trim() || 'FC Khách',
          opponentCaptainName: oppCaptainName.trim() || 'Đội Trưởng Khách',
          opponentCaptainPhone: oppPhone.trim() || '0909123456',
          awayKitColor,
        }),
      });
    } catch {
      // Local fallback
    } finally {
      setAcceptBusy(false);
    }

    const updated = posts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            status: 'MATCHED',
            opponentTeamName: oppTeamName.trim() || 'FC Khách',
            opponentCaptainName: oppCaptainName.trim() || 'Đội Trưởng Khách',
            opponentCaptainPhone: oppPhone.trim() || '0909123456',
            awayKitColor,
          }
        : p
    );
    onUpdatePosts(updated);
    setAcceptingPostId(null);
    showNotice(
      `🎉 Đã chốt kèo với ${post.teamName}! Áo chủ nhà: ${post.homeKitColor || 'Đỏ'} — Áo đội bạn: ${awayKitColor}.`
    );
  };

  const sosCount = posts.filter((p) => p.postType === 'SOS' && p.status === 'OPEN').length;

  const filteredPosts = posts.filter((p) => {
    if (filterMode === 'MATCH' && p.postType === 'SOS') return false;
    if (filterMode === 'SOS' && p.postType !== 'SOS') return false;
    if (sportFilter !== 'ALL' && p.pitchType !== sportFilter) return false;
    return true;
  });

  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {/* ============================================================ */}
      {/* 1. BANNER CHỢ KÈO & NÚT TẠO KÈO / PHÁT SOS INLINE */}
      {/* ============================================================ */}
      <View style={styles.heroCard}>
        <View style={styles.wrapRow}>
          <View style={styles.fairPlayBadge}>
            <Text style={styles.fairPlayBadgeText}>🤝 Sàn Ghép Kèo Văn Minh & Cứu Viện Sát Giờ</Text>
          </View>
          {sosCount > 0 && (
            <View style={styles.sosLiveBadge}>
              <Text style={styles.sosLiveBadgeText}>🚨 {sosCount} kèo SOS đang cần viện binh</Text>
            </View>
          )}
        </View>

        <Text style={styles.heroTitle}>Chợ Kèo Giao Hữu & SOS Mượn Chân</Text>
        <Text style={styles.heroSub}>
          Thỏa thuận rõ tính chất trận đấu (Dưỡng sinh / Cọ xát), độ tuổi, trọng tài và tự động cảnh báo chống trùng màu áo trước khi ra sân.
        </Text>

        {/* Action Buttons to open Inline Forms */}
        <View style={[styles.wrapRow, { marginTop: 12 }]}>
          <TouchableOpacity
            onPress={() =>
              setActiveForm(activeForm === 'CREATE_MATCH' ? 'NONE' : 'CREATE_MATCH')
            }
            style={[
              styles.createMatchBtn,
              activeForm === 'CREATE_MATCH' && { backgroundColor: COLORS.primaryDark },
            ]}
          >
            <Text style={styles.createMatchBtnText}>
              {activeForm === 'CREATE_MATCH'
                ? 'Thu Gọn Form Đăng Kèo ▲'
                : '+ Đăng Kèo Tìm Đối Giao Hữu ▼'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setActiveForm(activeForm === 'CREATE_SOS' ? 'NONE' : 'CREATE_SOS')
            }
            style={[
              styles.createSosBtn,
              activeForm === 'CREATE_SOS' && { backgroundColor: COLORS.roseDark },
            ]}
          >
            <Text style={styles.createSosBtnText}>
              {activeForm === 'CREATE_SOS'
                ? 'Thu Gọn Form SOS ▲'
                : '🚨 Phát SOS Thiếu Chân Gấp ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================ */}
        {/* INLINE FORM 1: + ĐĂNG KÈO TÌM ĐỐI & PHIẾU THỎA THUẬN KÈO */}
        {/* ============================================================ */}
        {activeForm === 'CREATE_MATCH' && (
          <View style={styles.inlineCreateCard}>
            <Text style={styles.formHeaderTitle}>
              📑 Tạo Kèo Giao Hữu & Phiếu Thỏa Thuận Trước Trận
            </Text>

            <View style={styles.inputRowWrap}>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Tên đội chủ nhà</Text>
                <TextInput
                  value={teamName}
                  onChangeText={setTeamName}
                  style={styles.textInput}
                  placeholder="VD: FC Anh Em Văn Phòng..."
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Số điện thoại Đội trưởng</Text>
                <TextInput
                  value={captainPhone}
                  onChangeText={setCaptainPhone}
                  keyboardType="phone-pad"
                  style={styles.textInput}
                  placeholder="0909..."
                />
              </View>
            </View>

            <View style={styles.inputRowWrap}>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Sân bóng đã đặt</Text>
                <TextInput
                  value={pitchName}
                  onChangeText={setPitchName}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Khung giờ & Ngày thi đấu</Text>
                <TextInput
                  value={matchTime}
                  onChangeText={setMatchTime}
                  style={styles.textInput}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>1. Tính chất trận đấu (Tránh lệch trình độ / va chạm):</Text>
            <View style={styles.wrapRow}>
              {[
                'Đá dưỡng sinh / Vui vẻ',
                'Cọ xát / Đá nhiệt',
                'Giao lưu nội bộ văn phòng',
              ].map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => setMatchStyle(st)}
                  style={[styles.chip, matchStyle === st && styles.chipActive]}
                >
                  <Text style={[styles.chipText, matchStyle === st && styles.chipTextActive]}>
                    {st.includes('dưỡng sinh') ? '🌱 ' : '🔥 '}
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>2. Độ tuổi trung bình của đội:</Text>
            <View style={styles.wrapRow}>
              {[
                'Trẻ (U20 - U25)',
                'Phong trào (U25 - U35)',
                'Lão tướng / Văn phòng (U35+)',
                'Mọi lứa tuổi',
              ].map((ag) => (
                <TouchableOpacity
                  key={ag}
                  onPress={() => setAgeGroup(ag)}
                  style={[styles.chip, ageGroup === ag && styles.chipActive]}
                >
                  <Text style={[styles.chipText, ageGroup === ag && styles.chipTextActive]}>
                    {ag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>3. Màu áo Đội Chủ Nhà (Chống trùng màu áo trên sân):</Text>
            <View style={styles.wrapRow}>
              {KIT_COLORS.map((kit) => {
                const selected = homeKitColor === kit.name;
                return (
                  <TouchableOpacity
                    key={kit.name}
                    onPress={() => setHomeKitColor(kit.name)}
                    style={[
                      styles.kitChip,
                      selected && styles.kitChipSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.kitDot,
                        { backgroundColor: kit.hex, borderColor: kit.border },
                      ]}
                    />
                    <Text
                      style={[
                        styles.kitChipText,
                        selected && { color: COLORS.primary, fontWeight: '900' },
                      ]}
                    >
                      Áo {kit.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>4. Tùy chọn Trọng tài & Hình thức chia tiền sân:</Text>
            <View style={styles.wrapRow}>
              {[
                'Tự bắt / Giao lưu',
                'Thuê trọng tài 50-50',
                'Có sẵn trọng tài & nước',
              ].map((refOpt) => (
                <TouchableOpacity
                  key={refOpt}
                  onPress={() => setRefereeOption(refOpt)}
                  style={[styles.chip, refereeOption === refOpt && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      refereeOption === refOpt && styles.chipTextActive,
                    ]}
                  >
                    ⚖️ {refOpt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.wrapRow}>
              {[
                { id: '50_50', label: 'Chia đều 50/50' },
                { id: '70_30', label: 'Thắng 30% - Thua 70%' },
                { id: 'LOSER_PAYS', label: 'Đội thua trả 100%' },
                { id: 'HOST_COVER', label: 'Chủ kèo bao sân' },
              ].map((pm) => (
                <TouchableOpacity
                  key={pm.id}
                  onPress={() => setPaymentModel(pm.id as any)}
                  style={[styles.chip, paymentModel === pm.id && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      paymentModel === pm.id && styles.chipTextActive,
                    ]}
                  >
                    💰 {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleCreatePost('MATCH')}
              style={styles.submitMatchBtn}
            >
              <Text style={styles.submitMatchBtnText}>
                🚀 Đăng Kèo Kèm Phiếu Thỏa Thuận Lên Sàn
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* INLINE FORM 2: 🚨 PHÁT SOS THIẾU CHÂN GIỜ CHÓT */}
        {/* ============================================================ */}
        {activeForm === 'CREATE_SOS' && (
          <View style={styles.inlineSosCard}>
            <Text style={[styles.formHeaderTitle, { color: COLORS.roseDark }]}>
              🚨 Phát Tín Hiệu SOS Cần Viện Binh Đá Bù Ngay
            </Text>

            <View style={styles.inputRowWrap}>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Tên đội / Nhóm đá</Text>
                <TextInput
                  value={teamName}
                  onChangeText={setTeamName}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.inputCol}>
                <Text style={styles.fieldLabel}>Sân bóng & Giờ bóng lăn</Text>
                <TextInput
                  value={pitchName}
                  onChangeText={setPitchName}
                  style={styles.textInput}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Số lượng cầu thủ đang thiếu:</Text>
            <View style={styles.wrapRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setNeededCount(n)}
                  style={[styles.chip, neededCount === n && styles.chipSosActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      neededCount === n && styles.chipTextActive,
                    ]}
                  >
                    Thiếu {n} người
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
                'Thủ môn, Tiền vệ',
                'Đá mọi vị trí',
              ].map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => setNeededPositions(pos)}
                  style={[styles.chip, neededPositions === pos && styles.chipSosActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      neededPositions === pos && styles.chipTextActive,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => handleCreatePost('SOS')}
              style={styles.submitSosBtn}
            >
              <Text style={styles.submitSosBtnText}>
                🚨 Phát Tín Hiệu SOS Khẩn Cấp Ngay
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {inlineNotice && (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeBannerText}>{inlineNotice}</Text>
        </View>
      )}

      {/* ============================================================ */}
      {/* 2. BỘ LỌC KÈO TRÊN SÀN (Tất cả / Kèo Giao Hữu / SOS Khẩn) */}
      {/* ============================================================ */}
      <View style={styles.filterBarCard}>
        <View style={styles.wrapRow}>
          {[
            { id: 'ALL', label: `Tất cả (${posts.length})` },
            {
              id: 'MATCH',
              label: `🤝 Kèo Giao Hữu (${posts.filter((p) => p.postType !== 'SOS').length})`,
            },
            {
              id: 'SOS',
              label: `🚨 SOS Thiếu Chân (${ posts.filter((p) => p.postType === 'SOS').length })`,
            },
          ].map((tab) => {
            const active = filterMode === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setFilterMode(tab.id as any)}
                style={[
                  styles.filterTabBtn,
                  active &&
                    (tab.id === 'SOS'
                      ? { backgroundColor: COLORS.rose, borderColor: COLORS.rose }
                      : styles.filterTabBtnActive),
                ]}
              >
                <Text
                  style={[
                    styles.filterTabBtnText,
                    active && { color: COLORS.white, fontWeight: '900' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.wrapRow, { marginTop: 8 }]}>
          {[
            { id: 'ALL', label: 'Mọi loại sân' },
            { id: 'SAN_5', label: 'Sân 5' },
            { id: 'SAN_7', label: 'Sân 7' },
            { id: 'FUTSAL', label: 'Futsal' },
          ].map((sp) => (
            <TouchableOpacity
              key={sp.id}
              onPress={() => setSportFilter(sp.id)}
              style={[
                styles.smallSportPill,
                sportFilter === sp.id && styles.smallSportPillActive,
              ]}
            >
              <Text
                style={[
                  styles.smallSportPillText,
                  sportFilter === sp.id && styles.smallSportPillTextActive,
                ]}
              >
                {sp.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ============================================================ */}
      {/* 3. DANH SÁCH THẺ KÈO & PHIẾU THỎA THUẬN KÈO TRỰC QUAN */}
      {/* ============================================================ */}
      <View
        style={[
          styles.postsGrid,
          layout.gridColumns > 1 && {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: layout.cardGap,
          },
        ]}
      >
        {filteredPosts.map((post) => {
          const isSos = post.postType === 'SOS';
          const isMatched = post.status === 'MATCHED';
          const isAcceptOpen = acceptingPostId === post.id;
          const homeKit = getKitColorInfo(post.homeKitColor || 'Đỏ');
          const awayKit = getKitColorInfo(post.awayKitColor || awayKitColor);
          const isKitClash =
            (post.homeKitColor || 'Đỏ').trim().toLowerCase() ===
            awayKitColor.trim().toLowerCase();

          const cardWidthStyle =
            layout.gridColumns > 1 && !isAcceptOpen
              ? { width: layout.gridCardWidth }
              : { width: '100%' as const };

          return (
            <View
              key={post.id}
              style={[
                styles.postCard,
                cardWidthStyle,
                isSos && styles.postCardSos,
                isMatched && styles.postCardMatched,
              ]}
            >
              {/* Top Badges */}
              <View style={styles.postHeaderRow}>
                <View style={styles.wrapRow}>
                  {isSos ? (
                    <View style={styles.sosBadge}>
                      <Text style={styles.sosBadgeText}>
                        🚨 SOS Cứu Viện • Cần {post.neededCount || 2} người ({post.neededPositions || 'Mọi vị trí'})
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.friendlyBadge}>
                      <Text style={styles.friendlyBadgeText}>🤝 Kèo Giao Hữu Tìm Đối</Text>
                    </View>
                  )}

                  <View style={styles.pitchTypeBadge}>
                    <Text style={styles.pitchTypeBadgeText}>
                      {post.pitchType === 'SAN_5'
                        ? 'Sân 5'
                        : post.pitchType === 'FUTSAL'
                        ? 'Futsal'
                        : 'Sân 7'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    isMatched ? { backgroundColor: COLORS.emeraldSoft } : { backgroundColor: COLORS.amberLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isMatched ? { color: COLORS.emeraldDark } : { color: '#92400e' },
                    ]}
                  >
                    {isMatched ? '✅ Đã chốt đối' : '⚡ Đang chờ bắt kèo'}
                  </Text>
                </View>
              </View>

              {/* Team & Pitch Details */}
              <Text style={styles.postTeamTitle}>{post.teamName}</Text>
              <Text style={styles.postMetaText}>📍 {post.pitchName}</Text>
              <Text style={[styles.postMetaText, { color: COLORS.emeraldDark, fontWeight: '800' }]}>
                ⏰ {post.matchTime}
              </Text>
              <Text style={styles.postMetaText}>
                💰 Chia tiền sân:{' '}
                <Text style={{ fontWeight: '800', color: COLORS.primary }}>
                  {post.paymentModel === 'HOST_COVER'
                    ? 'Miễn phí 100% (Chủ đội bao sân)'
                    : post.paymentModel === '70_30'
                    ? 'Kèo 70/30'
                    : post.paymentModel === 'LOSER_PAYS'
                    ? 'Đội thua trả sân'
                    : 'Chia đều 50/50'}
                </Text>
                {post.estimatedFee > 0 ? ` (~${formatVnd(post.estimatedFee)}/đội)` : ''}
              </Text>

              {/* ============================================================ */}
              {/* 📑 HỘP PHIẾU THỎA THUẬN KÈO & MÀU ÁO HAI ĐỘI */}
              {/* ============================================================ */}
              <View style={styles.termsBox}>
                <Text style={styles.termsBoxHeader}>📑 Phiếu Thỏa Thuận Kèo & Màu Áo Ra Sân</Text>
                <View style={styles.termsBadgeWrap}>
                  <View style={styles.termChip}>
                    <Text style={styles.termChipText}>
                      {(post.matchStyle || 'Đá dưỡng sinh').includes('dưỡng sinh') ? '🌱 ' : '🔥 '}
                      {post.matchStyle || 'Đá dưỡng sinh / Vui vẻ'}
                    </Text>
                  </View>

                  <View style={styles.termChip}>
                    <Text style={styles.termChipText}>
                      👥 {post.ageGroup || 'Phong trào (U25 - U35)'}
                    </Text>
                  </View>

                  <View style={styles.termChip}>
                    <Text style={styles.termChipText}>
                      ⚖️ {post.refereeOption || 'Tự bắt / Giao lưu'}
                    </Text>
                  </View>
                </View>

                {/* Kit Color Row */}
                <View style={styles.kitMatchRow}>
                  <View style={styles.kitTeamPill}>
                    <View
                      style={[
                        styles.kitDot,
                        {
                          backgroundColor: homeKit?.hex || '#ef4444',
                          borderColor: homeKit?.border || '#dc2626',
                        },
                      ]}
                    />
                    <Text style={styles.kitTeamText}>
                      Chủ nhà: Áo {post.homeKitColor || 'Đỏ'}
                    </Text>
                  </View>

                  <Text style={styles.vsText}>⚡ VS</Text>

                  <View style={styles.kitTeamPill}>
                    {post.awayKitColor ? (
                      <>
                        <View
                          style={[
                            styles.kitDot,
                            {
                              backgroundColor: awayKit?.hex || '#ffffff',
                              borderColor: awayKit?.border || '#94a3b8',
                            },
                          ]}
                        />
                        <Text style={styles.kitTeamText}>
                          Đội khách: Áo {post.awayKitColor}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.kitTeamText, { color: COLORS.textMuted }]}>
                        Đội khách: Chọn màu áo khi nhận kèo
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {post.notes ? (
                <Text style={styles.postNote}>💬 “{post.notes}”</Text>
              ) : null}

              {/* Matched Opponent Info or Action Buttons */}
              {isMatched ? (
                <View style={styles.matchedSummaryBox}>
                  <Text style={styles.matchedSummaryText}>
                    🤝 Đã ghép thành công với <Text style={{ fontWeight: '900' }}>{post.opponentTeamName || 'FC Bạn Hữu'}</Text> (Đội trưởng: {post.opponentCaptainName || 'Minh Quân'} • Áo {post.awayKitColor || 'Trắng'})
                  </Text>
                </View>
              ) : (
                <View style={[styles.wrapRow, { marginTop: 10 }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setAcceptingPostId(isAcceptOpen ? null : post.id);
                      // Default to a non-clashing kit color if possible
                      if ((post.homeKitColor || 'Đỏ') === 'Trắng') {
                        setAwayKitColor('Xanh Dương');
                      } else {
                        setAwayKitColor('Trắng');
                      }
                    }}
                    style={[
                      styles.acceptMainBtn,
                      isSos && { backgroundColor: COLORS.rose },
                    ]}
                  >
                    <Text style={styles.acceptMainBtnText}>
                      {isAcceptOpen
                        ? 'Đóng Khung Nhận Kèo ▲'
                        : isSos
                        ? '🚨 Ứng Cứu Kèo SOS Này ▼'
                        : '🤝 Bắt Kèo & Chọn Màu Áo ▼'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      copyTextWithFeedback(
                        'Đã sao chép thông tin kèo để chia sẻ lên Zalo!',
                        `⚽ KÈO BÓNG ĐÁ TRÊN TURFZONE\n🏷️ Đội: ${post.teamName}\n🏟️ Sân: ${post.pitchName}\n⏰ Giờ đá: ${post.matchTime}\n👕 Áo chủ nhà: ${post.homeKitColor || 'Đỏ'} • Tính chất: ${post.matchStyle || 'Vui vẻ'}\n📞 Liên hệ Đội trưởng ${post.captainName}: ${post.captainPhone}`,
                        showNotice
                      )
                    }
                    style={styles.shareZaloBtn}
                  >
                    <Text style={styles.shareZaloBtnText}>📋 Copy Gửi Nhóm Zalo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ============================================================ */}
              {/* INLINE ACCEPT FORM & CẢNH BÁO TRÙNG MÀU ÁO (KIT CLASH) */}
              {/* ============================================================ */}
              {isAcceptOpen && !isMatched && (
                <View style={styles.inlineAcceptBox}>
                  <Text style={styles.acceptFormTitle}>
                    ✍️ Xác Nhận {isSos ? 'Ứng Cứu Quân Số SOS' : 'Bắt Kèo Giao Hữu'}
                  </Text>

                  <View style={styles.inputRowWrap}>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>
                        {isSos ? 'Tên cầu thủ / Nhóm ứng cứu' : 'Tên đội bóng của bạn'}
                      </Text>
                      <TextInput
                        value={oppTeamName}
                        onChangeText={setOppTeamName}
                        style={styles.textInput}
                      />
                    </View>
                    <View style={styles.inputCol}>
                      <Text style={styles.fieldLabel}>Số điện thoại liên hệ</Text>
                      <TextInput
                        value={oppPhone}
                        onChangeText={setOppPhone}
                        keyboardType="phone-pad"
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>
                    👕 Chọn màu áo đội bạn sẽ mặc ra sân (Đội chủ nhà mặc áo {post.homeKitColor || 'Đỏ'}):
                  </Text>
                  <View style={styles.wrapRow}>
                    {KIT_COLORS.map((kit) => {
                      const selected = awayKitColor === kit.name;
                      const clashesWithHost =
                        kit.name.toLowerCase() === (post.homeKitColor || 'Đỏ').toLowerCase();
                      return (
                        <TouchableOpacity
                          key={kit.name}
                          onPress={() => setAwayKitColor(kit.name)}
                          style={[
                            styles.kitChip,
                            selected && styles.kitChipSelected,
                            clashesWithHost && { borderColor: COLORS.amberBright },
                          ]}
                        >
                          <View
                            style={[
                              styles.kitDot,
                              { backgroundColor: kit.hex, borderColor: kit.border },
                            ]}
                          />
                          <Text
                            style={[
                              styles.kitChipText,
                              selected && { color: COLORS.primary, fontWeight: '900' },
                            ]}
                          >
                            Áo {kit.name} {clashesWithHost ? '⚠️' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* KIT CLASH WARNING */}
                  {isKitClash && (
                    <View style={styles.kitClashWarningBox}>
                      <Text style={styles.kitClashWarningTitle}>
                        ⚠️ Cảnh Báo Trùng Màu Áo ({awayKitColor}) Với Đội Chủ Nhà!
                      </Text>
                      <Text style={styles.kitClashWarningSub}>
                        Hai đội cùng mặc áo màu {awayKitColor} sẽ rất khó phân biệt trên sân. Vui lòng chọn màu áo khác hoặc nhắc chủ sân chuẩn bị sẵn 1 bộ áo Bib đối kháng.
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => handleConfirmAccept(post)}
                    disabled={acceptBusy}
                    style={styles.confirmAcceptBtn}
                  >
                    <Text style={styles.confirmAcceptBtnText}>
                      {acceptBusy
                        ? 'Đang chốt kèo...'
                        : `✅ Xác Nhận Chốt Kèo (Mặc Áo ${awayKitColor})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>
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
  fairPlayBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  fairPlayBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  sosLiveBadge: {
    backgroundColor: COLORS.roseSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
  },
  sosLiveBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.rose,
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
  createMatchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  createMatchBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  createSosBtn: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  createSosBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineCreateCard: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 10,
  },
  inlineSosCard: {
    backgroundColor: COLORS.roseSoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: COLORS.roseLight,
    gap: 10,
  },
  formHeaderTitle: {
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
    minWidth: 190,
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
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipSosActive: {
    backgroundColor: COLORS.rose,
    borderColor: COLORS.roseDark,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  kitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  kitChipSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  kitDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
  },
  kitChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  submitMatchBtn: {
    backgroundColor: COLORS.emerald,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
    marginTop: 4,
  },
  submitMatchBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
  submitSosBtn: {
    backgroundColor: COLORS.rose,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
    marginTop: 4,
  },
  submitSosBtnText: {
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
  filterBarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 14,
  },
  filterTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filterTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  smallSportPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceMuted,
  },
  smallSportPillActive: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  smallSportPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  smallSportPillTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  postsGrid: {
    width: '100%',
    gap: 14,
  },
  postCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 4,
    gap: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  postCardSos: {
    borderColor: COLORS.rose,
    borderWidth: 1.5,
    backgroundColor: '#fffafb',
  },
  postCardMatched: {
    borderColor: COLORS.emerald,
  },
  postHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sosBadge: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sosBadgeText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  friendlyBadge: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  friendlyBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  pitchTypeBadge: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pitchTypeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  postTeamTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  postMetaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  termsBox: {
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 6,
    gap: 8,
  },
  termsBoxHeader: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.text,
  },
  termsBadgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  termChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  termChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  kitMatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  kitTeamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  kitTeamText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  vsText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.amber,
  },
  postNote: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  matchedSummaryBox: {
    backgroundColor: COLORS.emeraldSoft,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.emerald,
    marginTop: 8,
  },
  matchedSummaryText: {
    fontSize: 13,
    color: COLORS.emeraldDark,
  },
  acceptMainBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  acceptMainBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },
  shareZaloBtn: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  shareZaloBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  inlineAcceptBox: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    gap: 10,
  },
  acceptFormTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
  },
  kitClashWarningBox: {
    backgroundColor: COLORS.amberSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.amberBright,
    gap: 4,
  },
  kitClashWarningTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400e',
  },
  kitClashWarningSub: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  confirmAcceptBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  confirmAcceptBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
  },
});

