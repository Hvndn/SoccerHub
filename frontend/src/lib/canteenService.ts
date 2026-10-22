import { apiRequest } from "@/lib/api";

/** Món Canteen / cho thuê vật tư tại quầy của một cụm sân. */
export interface CanteenItem {
  id: number;
  pitchId: number;
  ownerId: number;
  name: string;
  unit?: string | null;
  price: number;
  stock: number;
  soldToday: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Danh sách món (chủ sân: theo cụm sân đang chọn; ADMIN: toàn hệ thống). */
export async function listCanteenItems(pitchId?: number | null): Promise<CanteenItem[]> {
  const qs = pitchId ? `?pitchId=${pitchId}` : "";
  const data = await apiRequest<CanteenItem[]>(`/api/v1/canteen/items${qs}`);
  return Array.isArray(data) ? data : [];
}

/** Thêm mới một món. */
export async function createCanteenItem(payload: {
  pitchId: number;
  name: string;
  price: number;
  stock?: number;
  unit?: string;
}): Promise<CanteenItem> {
  return await apiRequest<CanteenItem>("/api/v1/canteen/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Sửa tên / giá / tồn kho. */
export async function updateCanteenItem(
  id: number,
  payload: { name?: string; price?: number; stock?: number; unit?: string }
): Promise<CanteenItem> {
  return await apiRequest<CanteenItem>(`/api/v1/canteen/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Bán N đơn vị (trừ tồn kho, cộng số đã bán trong ngày). */
export async function sellCanteenItem(id: number, qty = 1): Promise<CanteenItem> {
  return await apiRequest<CanteenItem>(`/api/v1/canteen/items/${id}/sell`, {
    method: "POST",
    body: JSON.stringify({ qty }),
  });
}

/** Xoá một món. */
export async function deleteCanteenItem(id: number): Promise<void> {
  await apiRequest(`/api/v1/canteen/items/${id}`, { method: "DELETE" });
}
