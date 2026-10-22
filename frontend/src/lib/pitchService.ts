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
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  reviewsCount?: number;
}

export interface CreatePitchPayload {
  name: string;
  address?: string;
  location?: string;
  area?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  avgPricePerHour?: number;
  pricePerHour?: number;
  peakPricePerHour?: number;
  type?: string;
  status?: string;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
  pitchTypes?: string[];
  amenities?: string[];
  imageUrl?: string;
  description?: string;
}

export interface PitchMatrixCourt {
  pitchId: string;
  pitchName: string;
  type: string;
  basePrice: number;
  peakPrice: number;
  status: string;
  slots: PitchMatrixSlot[];
}

export interface PitchMatrixSlot {
  id: string;
  time: string;
  durationMinutes: number;
  bookingId?: number | string | null;
  bookingTimeSlot?: string | null;
  isContinuation?: boolean;
  isGapSlot?: boolean;
  status: string;
  customer?: string;
  phone?: string;
  price: string;
  depositPaid?: string;
  cashDue?: string;
  via?: string;
  code?: string;
  note?: string;
}

export interface PitchStats {
  pitchId: number;
  pitchName: string;
  date: string;
  totalRevenue: number;
  occupancyRate: number;
  totalSlots: number;
  bookedSlots: number;
  onlineBookings: number;
  counterBookings: number;
  openTime?: string;
  closeTime?: string;
  slotDurationMinutes?: number;
}

export interface BookingSearchResult {
  id: number;
  pitchId: number;
  courtName: string;
  bookingDate: string;
  timeSlot: string;
  customerName: string;
  customerPhone: string;
  totalPrice?: number | null;
  depositPaid?: number | null;
  status?: string | null;
  via?: string | null;
  code?: string | null;
  createdAt?: string | null;
}

export async function getAllPitchesApi(): Promise<PitchModel[]> {
  try {
    return await apiRequest<PitchModel[]>('/api/v1/pitches', { method: 'GET' });
  } catch (err) {
    console.error('Lỗi lấy danh sách sân:', err);
    // Nem loi ra ngoai de UI hien bang loi + nut "Thu lai" bi bat.
    // Nuot loi o day lam giao dien hien "khong tim thay cum san" (nham het backend).
  }
}

export async function getPitchByIdApi(id: number | string): Promise<PitchModel | null> {
  try {
    return await apiRequest<PitchModel>(`/api/v1/pitches/${id}`, { method: 'GET' });
  } catch (err) {
    console.error('Lỗi lấy chi tiết sân:', err);
    return null;
  }
}

export async function getMyPitchesApi(): Promise<PitchModel[]> {
  try {
    return await apiRequest<PitchModel[]>('/api/v1/pitches/my-pitches', { method: 'GET' });
  } catch (err) {
    console.error('Lỗi lấy danh sách sân của tôi:', err);
    // Nem loi ra ngoai de bang loi + nut "Thu lai" cua chu san hoat dong.
    throw err;
  }
}

export async function createPitchApi(payload: CreatePitchPayload): Promise<PitchModel> {
  return await apiRequest<PitchModel>('/api/v1/pitches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePitchApi(id: number | string, payload: Partial<CreatePitchPayload>): Promise<PitchModel> {
  return await apiRequest<PitchModel>(`/api/v1/pitches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deletePitchApi(id: number | string): Promise<void> {
  await apiRequest(`/api/v1/pitches/${id}`, { method: 'DELETE' });
}

export async function getPitchMatrixApi(
  pitchId: number | string,
  date: string,
  duration?: number
): Promise<PitchMatrixCourt[]> {
  try {
    const params = new URLSearchParams({ date });
    if (duration) params.append('duration', String(duration));
    return await apiRequest<PitchMatrixCourt[]>(`/api/v1/pitches/${pitchId}/matrix?${params.toString()}`, {
      method: 'GET',
    });
  } catch (err) {
    console.error('Lỗi lấy ma trận ca sân:', err);
    return [];
  }
}

export async function getPitchStatsApi(
  pitchId: number | string,
  date?: string
): Promise<PitchStats | null> {
  try {
    const params = date ? `?date=${date}` : '';
    return await apiRequest<PitchStats>(`/api/v1/pitches/${pitchId}/stats${params}`, {
      method: 'GET',
    });
  } catch (err) {
    console.error('Lỗi lấy thống kê sân:', err);
    return null;
  }
}

export async function getPitchBookingsApi(
  pitchId: number | string,
  date?: string
): Promise<BookingSearchResult[]> {
  try {
    const params = date ? `?date=${date}` : '';
    return await apiRequest<BookingSearchResult[]>(`/api/v1/pitches/${pitchId}/bookings${params}`, {
      method: 'GET',
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách booking:', err);
    return [];
  }
}

export async function bookOfflineApi(
  pitchId: number | string,
  payload: {
    courtName: string;
    timeSlot: string;
    customerName: string;
    customerPhone: string;
    bookingDate: string;
    totalPrice: number;
    depositPaid: number;
    courtType?: string;
    via?: string;
  }
): Promise<BookingSearchResult | null> {
  try {
    return await apiRequest<BookingSearchResult>(`/api/v1/pitches/${pitchId}/book-offline`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Lỗi đặt sân offline:', err);
    throw err;
  }
}

export async function addCourtToPitchApi(
  pitchId: number | string,
  courtName: string
): Promise<{ message: string; pitchTypes: string[] }> {
  return await apiRequest(`/api/v1/pitches/${pitchId}/add-court`, {
    method: 'POST',
    body: JSON.stringify({ courtName }),
  });
}

export async function checkInBookingApi(bookingId: number | string): Promise<any> {
  return await apiRequest(`/api/v1/pitches/bookings/${bookingId}/check-in`, {
    method: 'PUT',
  });
}

export async function cancelBookingApi(
  bookingId: number | string,
  reason?: string,
  cancelledBy?: string
): Promise<any> {
  return await apiRequest(`/api/v1/pitches/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason, cancelledBy }),
  });
}

export async function searchBookingApi(query: string): Promise<BookingSearchResult[]> {
  try {
    return await apiRequest<BookingSearchResult[]>(`/api/v1/pitches/bookings/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
    });
  } catch (err) {
    console.error('Lỗi tra cứu booking:', err);
    return [];
  }
}
