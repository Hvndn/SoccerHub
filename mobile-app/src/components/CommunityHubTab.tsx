import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import {
  COLORS,
  useResponsiveLayout,
} from '../theme/responsive';
import { AuthUser } from '../services/api';

interface CommunityHubTabProps {
  user: AuthUser | null;
  onNavigateTab?: (tab: any) => void;
}

interface ChatRoom {
  id: string;
  name: string;
  category: 'CHANNEL' | 'TEAM' | 'DM';
  subtitle: string;
  unread: number;
  onlineCount?: number;
  phone?: string;
  contacted?: boolean;
}

interface ChatMsg {
  id: string;
  sender: string;
  roleBadge?: string;
  time: string;
  text: string;
  isMe?: boolean;
}

const INITIAL_ROOMS: ChatRoom[] = [
  {
    id: 'ch-tim-doi',
    name: '# tim-doi-nhanh',
    category: 'CHANNEL',
    subtitle: 'Bắt đối giao hữu tối nay tại Đà Nẵng',
    unread: 3,
    onlineCount: 48,
  },
  {
    id: 'ch-gio-vang',
    name: '# san-gio-vang',
    category: 'CHANNEL',
    subtitle: 'Thông báo trống ca 17h30 - 20h30 các cụm sân',
    unread: 1,
    onlineCount: 35,
  },
  {
    id: 'ch-pass-san',
    name: '# pass-san-nhanh',
    category: 'CHANNEL',
    subtitle: 'Nhượng lại ca sân giá ưu đãi khi đội bận đột xuất',
    unread: 0,
    onlineCount: 29,
  },
  {
    id: 'ch-giai-dau',
    name: '# giai-dau',
    category: 'CHANNEL',
    subtitle: 'Thảo luận Siêu Cúp Đà Nẵng Mở Rộng 2026',
    unread: 2,
    onlineCount: 64,
  },
  {
    id: 'team-hai-chau',
    name: '🛡️ CLB Anh Em Hải Châu',
    category: 'TEAM',
    subtitle: 'Nhóm nội bộ đội bóng • 18 thành viên',
    unread: 2,
    onlineCount: 9,
    contacted: true,
  },
  {
    id: 'team-son-tra',
    name: '🛡️ FC Tia Chớp Sơn Trà',
    category: 'TEAM',
    subtitle: 'Nhóm chiến thuật & quỹ đội • 15 thành viên',
    unread: 0,
    onlineCount: 6,
    contacted: true,
  },
  {
    id: 'dm-hoang-nam',
    name: '👤 Hoàng Nam (Đội trưởng FC Rồng Việt)',
    category: 'DM',
    subtitle: 'Đã gửi lời mời giao hữu tối Thứ 5 tuần này',
    unread: 1,
    phone: '0905123456',
    contacted: true,
  },
  {
    id: 'dm-chu-san',
    name: '🏟️ Quản lý Cụm Sân Đại Nắng',
    category: 'DM',
    subtitle: 'Đã xác nhận giữ ca Sân 7A lúc 18:00',
    unread: 0,
    phone: '0905112233',
    contacted: true,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMsg[]> = {
  'ch-tim-doi': [
    {
      id: 'm1',
      sender: 'Hoàng Nam (FC Rồng Việt)',
      roleBadge: 'Đội trưởng',
      time: '17:15',
      text: 'Tối nay 18:00 - 20:00 bên mình đã đặt sẵn Sân 7A Cụm Sân Đại Nắng (Hải Châu), cần tìm đối văn phòng đá vui vẻ chia tiền sân 50-50. Anh em nào nhận kèo báo mình nhé!',
    },
    {
      id: 'm2',
      sender: 'Tuấn Kiệt (FC Liên Chiểu)',
      roleBadge: 'Uy tín 98%',
      time: '17:18',
      text: 'Bên mình có 2 anh em bận đột xuất ca 18:30 sân Liên Chiểu, cần 1 Thủ môn + 1 Tiền vệ đá hộ, miễn phí tiền sân và bao nước luôn anh em ơi!',
    },
    {
      id: 'm3',
      sender: 'Nguyễn Văn Cầu Thủ',
      roleBadge: 'Bạn',
      time: '17:22',
      text: 'Đội mình tuần sau trống tối Thứ 4 khu vực Hải Châu hoặc Cẩm Lệ, có đội nào giao lưu Sân 7 không ạ?',
      isMe: true,
    },
  ],
  'ch-gio-vang': [
    {
      id: 'g1',
      sender: 'Ban Quản Lý Sân Đại Nắng',
      roleBadge: 'Chủ sân',
      time: '16:40',
      text: '🔥 Thông báo: Sân 7B vừa có đội dời lịch nên trống khung giờ vàng 18:00 - 20:00 tối nay. Đội nào đặt nhanh trên tab Đặt Sân được tặng kèm 1 thùng nước suối ướp lạnh nhé!',
    },
  ],
  'ch-pass-san': [
    {
      id: 'p1',
      sender: 'Lê Bảo (FC Hòa Xuân)',
      roleBadge: 'Đội trưởng',
      time: '15:20',
      text: 'Pass nhanh ca Sân 5A Cẩm Lệ lúc 19:00 tối nay, đã cọc 150k, nhượng lại 100k cho đội nào lấy giúp!',
    },
  ],
  'ch-giai-dau': [
    {
      id: 't1',
      sender: 'Ban Tổ Chức Giải Đà Nẵng',
      roleBadge: 'BTC Giải',
      time: '14:00',
      text: '🏆 Siêu Cúp Bóng Đá Phủi Đà Nẵng Mở Rộng 2026 hiện đã có 12/16 đội xác nhận lệ phí. Còn 4 suất cuối cùng trước khi khóa sổ bốc thăm!',
    },
  ],
  'team-hai-chau': [
    {
      id: 'th1',
      sender: 'Hoàng Nam (Đội trưởng)',
      roleBadge: 'Đội trưởng',
      time: '16:10',
      text: 'Anh em nhớ vào mục Lịch Trình & Vé Đã Đặt điểm danh quân số cho trận tối nay lúc 18:00 nhé! Hiện đã có 11/14 người báo Đi chắc chắn.',
    },
  ],
  'team-son-tra': [
    {
      id: 'ts1',
      sender: 'Lê Bảo',
      roleBadge: 'Thủ quỹ',
      time: '11:30',
      text: 'Quỹ đội tháng 11 hiện còn dư 1.850.000đ. Tuần này đá xong mình trích quỹ liên hoan nhẹ nhé anh em!',
    },
  ],
  'dm-hoang-nam': [
    {
      id: 'dm1',
      sender: 'Hoàng Nam (FC Rồng Việt)',
      roleBadge: 'Đội trưởng',
      time: '17:05',
      text: 'Chào bạn, tối Thứ 5 tuần này đội bạn có rảnh giao lưu Sân 7 tại cụm sân Đại Nắng không? Chia 50-50 tiền sân + trọng tài nhé.',
    },
  ],
  'dm-chu-san': [
    {
      id: 'dm2',
      sender: 'Quản lý Cụm Sân Đại Nắng',
      roleBadge: 'Chủ sân',
      time: '16:50',
      text: 'Sân đã nhận cọc giữ chỗ mã #SH-2026-8891 của đội bạn. Đúng 17:50 hệ thống đèn Sân 7A sẽ bật sẵn đón anh em nhé!',
    },
  ],
};

export default function CommunityHubTab({ user, onNavigateTab }: CommunityHubTabProps) {
  const layout = useResponsiveLayout();
  const [rooms, setRooms] = useState<ChatRoom[]>(INITIAL_ROOMS);
  const [activeRoomId, setActiveRoomId] = useState<string>('ch-tim-doi');
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMsg[]>>(INITIAL_MESSAGES);
  const [roomFilter, setRoomFilter] = useState<'ALL' | 'UNREAD' | 'DM' | 'CONTACTED'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [draftMsg, setDraftMsg] = useState('');

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];
  const currentMessages = messagesMap[activeRoom.id] || [];

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      !searchText.trim() ||
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.subtitle.toLowerCase().includes(searchText.toLowerCase());
    if (!matchSearch) return false;
    if (roomFilter === 'UNREAD') return r.unread > 0;
    if (roomFilter === 'DM') return r.category === 'DM';
    if (roomFilter === 'CONTACTED') return Boolean(r.contacted);
    return true;
  });

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r))
    );
  };

  const handleSendMessage = (customText?: string) => {
    const textToSend = (customText ?? draftMsg).trim();
    if (!textToSend) return;
    const now = new Date();
    const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ChatMsg = {
      id: `msg-${Date.now()}`,
      sender: user?.fullName || user?.name || 'Nguyễn Văn Cầu Thủ',
      roleBadge: 'Bạn',
      time: timeLabel,
      text: textToSend,
      isMe: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeRoom.id]: [...(prev[activeRoom.id] || []), newMsg],
    }));
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeRoom.id
          ? { ...r, subtitle: `Bạn: ${textToSend}`, contacted: true }
          : r
      )
    );
    if (!customText) setDraftMsg('');
  };

  const quickTemplates = [
    '⚽ Đội mình nhận kèo này nhé, giữ ca giúp mình!',
    '📍 Cho mình xin định vị sân và số Zalo đội trưởng nhé',
    '🚨 Tối nay đội mình còn thiếu 2 chân, có bạn nào ghép không?',
  ];

  return (
    <View style={[styles.container, { paddingHorizontal: layout.horizontalPadding }]}>
      {/* Header Banner (Matches CommunityHub.tsx on Web) */}
      <View style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <View style={styles.wrapRow}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>💬 Trực Tiếp Cộng Đồng</Text>
            </View>
            <Text style={styles.onlineSummaryText}>182 cầu thủ & đội trưởng đang trực tuyến</Text>
          </View>
          <Text style={styles.headerTitle}>Cộng Đồng Bóng Đá Phủi & Phòng Chat Đội Bóng</Text>
          <Text style={styles.headerSubtitle}>
            Kênh thảo luận chung, nhóm chat nội bộ CLB và nhắn tin thương lượng trực tiếp với đội trưởng / chủ sân
          </Text>
        </View>

        {onNavigateTab && (
          <View style={styles.wrapRow}>
            <TouchableOpacity
              onPress={() => onNavigateTab('matchmaking')}
              style={styles.shortcutBtnRose}
            >
              <Text style={styles.shortcutBtnRoseText}>🔥 Sang Chợ Kèo & SOS →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onNavigateTab('team-management')}
              style={styles.shortcutBtnEmerald}
            >
              <Text style={styles.shortcutBtnEmeraldText}>🛡️ Quản Lý Đội Bóng</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main 2-Column Chat Layout */}
      <View
        style={[
          styles.mainGrid,
          layout.isDesktop && { flexDirection: 'row', alignItems: 'flex-start' },
        ]}
      >
        {/* LEFT COLUMN: KÊNH THẢO LUẬN, NHÓM ĐỘI BÓNG & TIN NHẮN RIÊNG */}
        <View style={[styles.sidebarCard, layout.isDesktop && { flex: 4 }]}>
          <Text style={styles.sectionTitle}>Danh Sách Kênh & Tin Nhắn</Text>

          {/* Search Input */}
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Tìm kênh, tên CLB hoặc đội trưởng..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />

          {/* Filter Chips (Tất cả / Chưa đọc / Tin nhắn riêng / Đã liên hệ) */}
          <View style={styles.wrapRow}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'UNREAD', label: 'Chưa đọc' },
              { id: 'DM', label: 'Tin nhắn riêng' },
              { id: 'CONTACTED', label: 'Đã liên hệ' },
            ].map((f) => {
              const active = roomFilter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setRoomFilter(f.id as any)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Room Items */}
          <View style={{ gap: 8 }}>
            {filteredRooms.map((room) => {
              const active = room.id === activeRoom.id;
              return (
                <TouchableOpacity
                  key={room.id}
                  onPress={() => handleSelectRoom(room.id)}
                  style={[styles.roomCard, active && styles.roomCardActive]}
                  activeOpacity={0.8}
                >
                  <View style={styles.roomTopRow}>
                    <Text
                      style={[styles.roomName, active && { color: COLORS.emeraldDark }]}
                      numberOfLines={1}
                    >
                      {room.name}
                    </Text>
                    {room.unread > 0 ? (
                      <View style={styles.unreadPill}>
                        <Text style={styles.unreadPillText}>{room.unread} mới</Text>
                      </View>
                    ) : room.onlineCount ? (
                      <Text style={styles.onlineCountText}>🟢 {room.onlineCount}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.roomSubtitle} numberOfLines={1}>
                    {room.subtitle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* RIGHT COLUMN: ACTIVE CHAT ROOM CONVERSATION */}
        <View style={[styles.chatAreaCard, layout.isDesktop && { flex: 8 }]}>
          {/* Active Room Header */}
          <View style={styles.chatHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatHeaderTitle}>{activeRoom.name}</Text>
              <Text style={styles.chatHeaderSub}>{activeRoom.subtitle}</Text>
            </View>
            {activeRoom.phone && (
              <View style={styles.wrapRow}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${activeRoom.phone}`)}
                  style={styles.callBtn}
                >
                  <Text style={styles.callBtnText}>📞 Gọi điện</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://zalo.me/${activeRoom.phone}`)}
                  style={styles.zaloBtn}
                >
                  <Text style={styles.zaloBtnText}>💬 Mở Zalo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Messages List */}
          <View style={styles.messagesList}>
            {currentMessages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
                ]}
              >
                <View style={styles.messageHeaderRow}>
                  <Text
                    style={[
                      styles.messageSender,
                      msg.isMe && { color: COLORS.emeraldDark },
                    ]}
                  >
                    {msg.sender}
                  </Text>
                  {msg.roleBadge && (
                    <View
                      style={[
                        styles.roleTag,
                        msg.isMe && { backgroundColor: COLORS.emerald },
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleTagText,
                          msg.isMe && { color: COLORS.white },
                        ]}
                      >
                        {msg.roleBadge}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.messageTime}>{msg.time}</Text>
                </View>
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            ))}
          </View>

          {/* Quick Reply Templates */}
          <View style={styles.quickReplySection}>
            <Text style={styles.quickReplyLabel}>⚡ Mẫu phản hồi nhanh 1 chạm:</Text>
            <View style={styles.wrapRow}>
              {quickTemplates.map((tpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSendMessage(tpl)}
                  style={styles.quickReplyChip}
                >
                  <Text style={styles.quickReplyChipText}>{tpl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Composer Bar */}
          <View style={styles.composerRow}>
            <TextInput
              value={draftMsg}
              onChangeText={setDraftMsg}
              placeholder={`Nhắn tin vào ${activeRoom.name}...`}
              placeholderTextColor="#94a3b8"
              style={styles.composerInput}
            />
            <TouchableOpacity
              onPress={() => handleSendMessage()}
              style={styles.sendBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.sendBtnText}>Gửi Tin Nhắn →</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  liveBadge: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  onlineSummaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shortcutBtnRose: {
    backgroundColor: COLORS.roseSoft,
    borderWidth: 1,
    borderColor: COLORS.roseLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  shortcutBtnRoseText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.rose,
  },
  shortcutBtnEmerald: {
    backgroundColor: COLORS.emeraldSoft,
    borderWidth: 1,
    borderColor: COLORS.emeraldLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  shortcutBtnEmeraldText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  mainGrid: {
    gap: 16,
  },
  sidebarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  searchInput: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.text,
  },
  filterChip: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.emerald,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  roomCard: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  roomCardActive: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emerald,
  },
  roomTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  unreadPill: {
    backgroundColor: COLORS.rose,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadPillText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  onlineCountText: {
    fontSize: 13,
    color: COLORS.emeraldDark,
    fontWeight: '700',
  },
  roomSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chatAreaCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  chatHeaderTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  chatHeaderSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  callBtn: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  zaloBtn: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  zaloBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  messagesList: {
    gap: 10,
  },
  messageBubble: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.bg,
    borderColor: COLORS.borderLight,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.emeraldSoft,
    borderColor: COLORS.emeraldLight,
  },
  messageHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  messageSender: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  roleTag: {
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  messageTime: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  quickReplySection: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  quickReplyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  quickReplyChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickReplyChipText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  composerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  composerInput: {
    flex: 1,
    minWidth: 200,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  sendBtn: {
    backgroundColor: COLORS.emerald,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  sendBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
