import { apiRequest } from './api';

export interface PitchModel {
  id: number | string;
  name: string;
  address?: string;
  location?: string;
  area?: string;
  phone?: string;
  ownerId?: number;
  ownerName?: string;
  latitude?: number;
  longitude?: number;
  avgPricePerHour?: number;
  pricePerHour?: number;
  peakPricePerHour?: number;
  rating?: number;
  type?: string;
  status?: string;
  pitchTypes?: string[];
  amenities?: string[];
  imageUrl?: string;
  description?: string;
}

export interface CreatePitchPayload {
  name: string;
  address?: string;
  location?: string;
  area?: string;
  phone?: string;
  avgPricePerHour?: number;
  pricePerHour?: number;
  peakPricePerHour?: number;
  type?: string;
  status?: string;
  pitchTypes?: string[];
  amenities?: string[];
  imageUrl?: string;
  description?: string;
}

export async function getAllPitchesApi(): Promise<PitchModel[]> {
  try {
    return await apiRequest<PitchModel[]>('/api/v1/pitches', { method: 'GET' });
  } catch (err) {
    console.error('Lỗi lấy danh sách sân:', err);
    return [];
  }
}

export async function getMyPitchesApi(): Promise<PitchModel[]> {
  try {
    return await apiRequest<PitchModel[]>('/api/v1/pitches/my-pitches', { method: 'GET' });
  } catch (err) {
    console.error('Lỗi lấy danh sách sân của tôi:', err);
    return [];
  }
}

export async function createPitchApi(payload: CreatePitchPayload): Promise<PitchModel> {
  return await apiRequest<PitchModel>('/api/v1/pitches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePitchApi(id: number | string): Promise<void> {
  await apiRequest(`/api/v1/pitches/${id}`, { method: 'DELETE' });
}

export async function bookSlotApi(payload: { pitchId?: string | number; slotId?: string; customerName?: string }): Promise<any> {
  try {
    return await apiRequest('/api/v1/pitches/book-slot', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Lỗi khi cọc slot:', err);
    return null;
  }
}
