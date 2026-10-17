import { apiRequest, ensureLoggedIn } from "./api";
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
  replyToId?: number | null
): Promise<GroupMessage> {
  return apiRequest<GroupMessage>(`/api/v1/chat-groups/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, replyToId: replyToId ?? null }),
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

/** Bọc lỗi lại thành toast cho gọn phía component. */
export function reportGroupError(err: any, fallback: string): void {
  if (!ensureLoggedIn("thao tác với nhóm chat")) return;
  toastErr(err?.message || fallback);
}