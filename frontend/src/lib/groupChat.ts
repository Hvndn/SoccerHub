import { apiRequest, ensureLoggedIn, fetchWithTimeout } from "./api";
import { toastErr, toastOk } from "./toast";

/* =========================================================
 * Group chat — lớp gọi API cho phòng chat nhóm (> 2 người)
 * ========================================================= */

export interface GroupMember {
  email: string;
  name: string;
  isOwner: boolean;
  joinedAt: string;
}

export interface GroupSummary {
  id: number;
  name: string;
  description?: string | null;
  ownerEmail: string;
  ownerName?: string;
  isOwner: boolean;
  memberCount: number;
  createdAt: string;
  unread: number;
  lastMessage: string;
  lastSender: string;
  lastTime: string | null;
  members?: GroupMember[];
}

export interface GroupMessage {
  id: number;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  groupId: number;
  replyToId?: number | null;
  content: string;
  createdAt: string;
  // New fields for file/reaction/read
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  readAt?: string | null;
  reactions?: ReactionSummary[];
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  meReacted: boolean;
}

/** Danh sách nhóm tôi tham gia. */
export async function listMyGroups(): Promise<GroupSummary[]> {
  const data = await apiRequest<GroupSummary[]>("/api/v1/chat-groups");
  return Array.isArray(data) ? data : [];
}

/** Danh sách hội thoại tin nhắn riêng (DM) — dùng cho badge chủ sân. */
export async function listMyConversations(): Promise<
  { partnerEmail: string; partnerName: string; lastMessage: string; lastTime: string; isMine: boolean }[]
> {
  const data = await apiRequest<any[]>("/api/v1/chat/conversations");
  return Array.isArray(data) ? data : [];
}

/** Tạo nhóm mới. memberEmails: danh sách email thêm sẵn. */
export async function createGroup(input: {
  name: string;
  description?: string;
  memberEmails?: string[];
}): Promise<GroupSummary> {
  return apiRequest<GroupSummary>("/api/v1/chat-groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Chi tiết nhóm + danh sách thành viên. */
export async function getGroup(id: number): Promise<GroupSummary> {
  return apiRequest<GroupSummary>(`/api/v1/chat-groups/${id}`);
}

/** Tin nhắn trong nhóm (50 tin mới nhất). */
export async function getGroupMessages(id: number): Promise<GroupMessage[]> {
  const data = await apiRequest<GroupMessage[]>(`/api/v1/chat-groups/${id}/messages`);
  return Array.isArray(data) ? data : [];
}

/** Gửi tin trong nhóm. */
export async function sendGroupMessage(
  id: number,
  content: string,
  replyToId?: number | null,
  fileUrl?: string | null,
  fileType?: string | null,
  fileName?: string | null,
  fileSize?: number | null
): Promise<GroupMessage> {
  return apiRequest<GroupMessage>(`/api/v1/chat-groups/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ 
      content, 
      replyToId: replyToId ?? null,
      fileUrl,
      fileType,
      fileName,
      fileSize
    }),
  });
}

/** Đánh dấu đã đọc nhóm. */
export async function markGroupRead(id: number): Promise<void> {
  await apiRequest(`/api/v1/chat-groups/${id}/read`, { method: "POST" });
}

/** Thêm thành viên (chỉ chủ nhóm). */
export async function addGroupMember(id: number, email: string): Promise<void> {
  await apiRequest(`/api/v1/chat-groups/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  toastOk("Đã thêm thành viên vào nhóm.");
}

/** Gỡ thành viên (chỉ chủ nhóm). */
export async function removeGroupMember(id: number, email: string): Promise<void> {
  await apiRequest(`/api/v1/chat-groups/${id}/members/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
  toastOk("Đã gỡ thành viên khỏi nhóm.");
}

/** Xoá nhóm (chỉ chủ nhóm). */
export async function deleteGroup(id: number): Promise<void> {
  await apiRequest(`/api/v1/chat-groups/${id}`, { method: "DELETE" });
  toastOk("Đã xoá nhóm.");
}

/** Reaction (emoji) cho tin nhắn nhóm. */
export async function reactGroupMessage(messageId: number, emoji: string): Promise<{ reacted: boolean; emoji: string }> {
  const data = await apiRequest<{ reacted: boolean; emoji: string }>(`/api/v1/chat/messages/${messageId}/react`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
  return data;
}

/** Lấy reaction của tin nhắn nhóm. */
export async function getGroupMessageReactions(messageId: number): Promise<ReactionSummary[]> {
  const data = await apiRequest<ReactionSummary[]>(`/api/v1/chat/messages/${messageId}/reactions`);
  return Array.isArray(data) ? data : [];
}

/** Đánh dấu tin nhắn nhóm đã đọc. */
export async function markGroupMessageRead(messageId: number): Promise<void> {
  await apiRequest(`/api/v1/chat/messages/${messageId}/read`, { method: "POST" });
}

/** Upload file cho chat (chung cho group/DM/public). */
export async function uploadChatFile(file: File): Promise<{ fileUrl: string; fileType: string; fileName: string; fileSize: number }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://soccerhub-backend-core-production.up.railway.app"}/api/v1/chat/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Upload thất bại" }));
    throw new Error(err.message || "Upload thất bại");
  }
  return res.json();
}

/** Tìm tin nhắn theo từ khóa. */
export async function searchChatMessages(query: string, withEmail?: string, channel?: string): Promise<any[]> {
  const params = new URLSearchParams({ query });
  if (withEmail) params.append("with", withEmail);
  if (channel) params.append("channel", channel);
  const data = await apiRequest<any[]>(`/api/v1/chat/messages/search?${params.toString()}`);
  return Array.isArray(data) ? data : [];
}

/** Lấy số tin chưa đọc (DM + Group). */
export async function getUnreadCount(): Promise<{ dm: number; group: number; total: number }> {
  const data = await apiRequest<{ dm: number; group: number; total: number }>("/api/v1/chat/unread-count");
  return data || { dm: 0, group: 0, total: 0 };
}

/** Bọc lỗi lại thành toast cho gọn phía component. */
export function reportGroupError(err: any, fallback: string): void {
  if (!ensureLoggedIn("thao tác với nhóm chat")) return;
  toastErr(err?.message || fallback);
}