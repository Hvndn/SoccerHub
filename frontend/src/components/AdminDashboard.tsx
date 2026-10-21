"use client";

import React, { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { formatMoney } from "@/lib/tournamentService";
import { simulateBookings } from "@/lib/adminService";
import BusinessContacts from "@/components/BusinessContacts";
import OwnerReportExport from "@/components/OwnerReportExport";
import OwnerCharts from "@/components/OwnerCharts";
import {
 ShieldCheck,
 TrendingUp,
 Calendar,
 DollarSign,
 Settings,
 CheckCircle2,
 BarChart2,
 Zap,
 Clock,
 AlertTriangle,
 Coffee,
 Wrench,
 Sliders,
 Check,
 Layers,
 Sparkles,
 MapPin,
 RefreshCw,
 Sun,
 CloudRain,
 UserCheck,
 UserX,
 PhoneCall,
 Plus,
 QrCode,
 Search,
 Filter,
 AlertCircle,
 ArrowRight,
 X,
 Building,
 CheckCheck,
 Bell,
 Share2,
 ChevronRight,
 Download,
 Edit3,
 Trash2,
 PieChart,
 Tag,
 Activity,
 Volume2,
 Pencil
} from "lucide-react";
import {
 playNotificationChime,
 subscribeToBookingEvents,
 broadcastBookingEvent,
 RealtimeBookingEvent
} from "@/lib/realtimeService";

interface AdminDashboardProps {
 onBackToHome?: () => void;
 onNavigateTab?: (tab: string) => void;
 /** Mở cuộc trò chuyện riêng với đối tác (dùng cho kênh liên lạc với Ban Tổ Chức). */
 onStartDm?: (partnerEmail: string, partnerName: string) => void;
}

export default function AdminDashboard({ onBackToHome, onNavigateTab, onStartDm }: AdminDashboardProps = {}) {
 const [mounted, setMounted] = useState(false);
 const [realPitches, setRealPitches] = useState<any[]>([]);
 const [activePitch, setActivePitch] = useState<any | null>(null);
 const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(true);
 const [pitchStats, setPitchStats] = useState({
 totalRevenue: 0,
 occupancyRate: 0,
 totalSlots: 0,
 bookedSlots: 0,
 onlineBookings: 0,
 counterBookings: 0
 });

 const [activeSubTab, setActiveSubTab] = useState<"matrix" | "pitches" | "pricing" | "canteen" | "reports">("matrix");
 const [matrixFilterStatus, setMatrixFilterStatus] = useState<string>("ALL");
 const [matrixFilterType, setMatrixFilterType] = useState<string>("ALL");
 const [matrixFilterTime, setMatrixFilterTime] = useState<string>("ALL");
 const [matrixFilterMethod, setMatrixFilterMethod] = useState<string>("ALL");
  // Thời lượng ca cố định 2 tiếng (120 phút) — chủ sân không chọn 1h/1.5h nữa.
  const MATRIX_DURATION = 120;

 // Dynamic pricing controls
 // Nháp giá sân đang chỉnh ở tab "Giá Thuê Sân" (đối chiếu với bảng pitches)
 const [priceDraft, setPriceDraft] = useState<Record<string, { avg: string; peak: string }>>({});
 const [savingPriceId, setSavingPriceId] = useState<string | null>(null);

 const getPriceDraft = (p: any) =>
 priceDraft[String(p.id)] ?? {
 avg: String(p.avgPricePerHour ?? ""),
 peak: String(p.peakPricePerHour ?? ""),
 };

 const savePitchPrice = async (p: any) => {
 const draft = getPriceDraft(p);
 const avg = Number(draft.avg);
 const peak = Number(draft.peak);
 if (!avg || avg <= 0) {
 showToast("Giá thường phải lớn hơn 0.");
 return;
 }
 if (peak && peak < avg) {
 showToast("Giá giờ vàng phải lớn hơn hoặc bằng giá thường.");
 return;
 }
 setSavingPriceId(String(p.id));
 try {
 await apiRequest(`/api/v1/pitches/${p.id}/price`, {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 avgPricePerHour: avg,
 peakPricePerHour: peak || null,
 }),
 });
 showToast(`Đã lưu giá cho ${p.name}.`);
 await fetchRealData();
 } catch (e: any) {
 showToast(e?.message || "Cập nhật giá thất bại, thử lại sau.");
 } finally {
 setSavingPriceId(null);
 }
 };
 
 // Real-time notification banner
 const [notification, setNotification] = useState<string | null>(null);
 const [simBusy, setSimBusy] = useState<"gen" | "clear" | null>(null);

 // Live Owner Matrix Data (Stateful from Real Database)
 const [pitchMatrix, setPitchMatrix] = useState<any[]>([]);

 // Canteen Sales Inventory State
 const [canteenItems, setCanteenItems] = useState([
 { id: "c1", name: "Nước Điện Giải Revive 500ml", price: 15000, soldToday: 48, stock: 120 },
 { id: "c2", name: "Nước Khoáng Lavie 500ml", price: 10000, soldToday: 65, stock: 200 },
 { id: "c3", name: "Thuê Giày Đã Bóng đinh TF (Đôi)", price: 40000, soldToday: 12, stock: 35 },
 { id: "c4", name: "Thuê Bộ Áo Bib Tập Luyện (Bộ 10 Áo)", price: 30000, soldToday: 18, stock: 40 },
 { id: "c5", name: "Bóng Động Lực FIFA Size 5", price: 45000, soldToday: 10, stock: 15 }
 ]);

 // Modals state
 const [showOfflineModal, setShowOfflineModal] = useState(false);
 const [showAddPitchModal, setShowAddPitchModal] = useState(false);
 const [showHoursModal, setShowHoursModal] = useState(false);
 const [showConfigModal, setShowConfigModal] = useState(false);
 const [selectedSlotForAction, setSelectedSlotForAction] = useState<any | null>(null);
 const [searchCodeInput, setSearchCodeInput] = useState("");
 const [toastMsg, setToastMsg] = useState<string | null>(null);

 // Cancel Reason Modal State
 const [showCancelModal, setShowCancelModal] = useState(false);
 const [cancelReasonInput, setCancelReasonInput] = useState("");
 const [slotToCancel, setSlotToCancel] = useState<any | null>(null);

 // Operating Hours & Slot Duration State (Đăng ký giờ hoạt động linh hoạt)
 const [operatingOpenTime, setOperatingOpenTime] = useState("13:00");
 const [operatingCloseTime, setOperatingCloseTime] = useState("22:30");
 const [operatingSlotDuration, setOperatingSlotDuration] = useState<number>(120); // Ca 2 tiếng (120 phút - thi đấu & giao trả ca)
 const [isUpdatingHours, setIsUpdatingHours] = useState(false);

 // New Pitch Form state
 const [newPitchName, setNewPitchName] = useState("");
 const [newPitchType, setNewPitchType] = useState("Sân 7 Người");
 const [newPitchBasePrice, setNewPitchBasePrice] = useState("450000");
 const [newPitchPeakPrice, setNewPitchPeakPrice] = useState("600000");

// Sửa hồ sơ cụm sân (trước đây chỉ sửa được giá + giờ mở cửa)
const [showEditInfoModal, setShowEditInfoModal] = useState(false);

 // Cac form quan tri (Sua ho so / Them san / Dat ca / Gio mo cua) hien INLINE o cuoi trang
 // -> tu cuon toi khi mo de chu san khong phai tim.
 useEffect(() => {
  const open = showEditInfoModal || showAddPitchModal || showOfflineModal || selectedSlotForAction || showHoursModal || showCancelModal;
  if (!open) return;
  const raf = requestAnimationFrame(() => {
   const el = document.querySelector('[id^="admin-inline-"]');
   el?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [showEditInfoModal, showAddPitchModal, showOfflineModal, selectedSlotForAction, showHoursModal, showCancelModal]);
const [isSavingInfo, setIsSavingInfo] = useState(false);
const [infoName, setInfoName] = useState("");
const [infoAddress, setInfoAddress] = useState("");
const [infoArea, setInfoArea] = useState("");
const [infoPhone, setInfoPhone] = useState("");
const [infoImageUrl, setInfoImageUrl] = useState("");
const [infoDescription, setInfoDescription] = useState("");
const [infoPitchTypes, setInfoPitchTypes] = useState<string[]>([]);
const [infoAmenities, setInfoAmenities] = useState<string[]>([]);

// Danh sách gợi ý GỘP thêm các giá trị đang lưu trong DB. Nếu chỉ dùng danh sách
// cố định thì các tiện ích cũ (ví dụ "Giữ xe", "Áo bib", "Đèn LED") không khớp
// chip nào, bấm "Lưu Hồ Sơ" sẽ ghi đè mất chúng.
const PITCH_TYPE_OPTIONS = [
"Sân 5 Người", "Sân 7 Người", "Sân 11 Người", "Futsal", "Cỏ tự nhiên",
];
const AMENITY_OPTIONS = [
"Đèn chiếu sáng", "CCTV", "Phòng thay đồ", "Căng tin",
"Cho thuê giày", "Bãi xe", "WiFi", "Nước uống",
];
const pitchTypeOptions = Array.from(new Set([...PITCH_TYPE_OPTIONS, ...infoPitchTypes]));
const amenityOptions = Array.from(new Set([...AMENITY_OPTIONS, ...infoAmenities]));

// Mở modal sửa hồ sơ và nạp dữ liệu cụm sân hiện tại vào form
const openEditInfoModal = () => {
const p: any = activePitch;
setInfoName(p?.name ?? "");
setInfoAddress(p?.address ?? "");
setInfoArea(p?.area ?? "");
setInfoPhone(p?.phone ?? "");
setInfoImageUrl(p?.imageUrl ?? "");
setInfoDescription(p?.description ?? "");
setInfoPitchTypes(Array.isArray(p?.pitchTypes) ? [...p.pitchTypes] : []);
setInfoAmenities(Array.isArray(p?.amenities) ? [...p.amenities] : []);
setShowEditInfoModal(true);
};

/** Bật/tắt một mục trong danh sách bộ môn hoặc tiện ích. */
const toggleInfoList = (
value: string,
current: string[],
setter: (next: string[]) => void
) => {
setter(
current.includes(value)
? current.filter((v) => v !== value)
: [...current, value]
);
};

const handleSavePitchInfo = async (e: React.FormEvent) => {
e.preventDefault();
const currentId = activePitch?.id;
if (!currentId) {
showToast("Chưa chọn cụm sân cần cập nhật.");
return;
}
if (!infoName.trim() || !infoAddress.trim()) {
showToast("Tên và địa chỉ cụm sân là bắt buộc.");
return;
}
setIsSavingInfo(true);
try {
await apiRequest(`/api/v1/pitches/${currentId}`, {
method: "PUT",
body: JSON.stringify({
name: infoName.trim(),
address: infoAddress.trim(),
area: infoArea.trim(),
phone: infoPhone.trim(),
imageUrl: infoImageUrl.trim(),
description: infoDescription.trim(),
pitchTypes: infoPitchTypes,
amenities: infoAmenities,
}),
});
await fetchRealData();
setShowEditInfoModal(false);
showToast("✅ Đã cập nhật hồ sơ cụm sân.");
} catch (err: any) {
showToast(`❌ ${err?.message || "Không lưu được hồ sơ cụm sân"}`);
} finally {
setIsSavingInfo(false);
}
};

 // Danh sách 14 ngày tới để chủ sân linh hoạt chuyển ngày xem lịch đặt
 const upcomingDays = useMemo(() => {
 const days: Array<{
 iso: string;
 dayOfWeek: string;
 dateFormatted: string;
 label: string;
 display: string;
 }> = [];
 const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
 const now = new Date();
 for (let i = 0; i < 14; i++) {
 const d = new Date(now);
 d.setDate(now.getDate() + i);
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 const iso = `${year}-${month}-${date}`;
 const dayOfWeek = dayNames[d.getDay()];
 const dateFormatted = `${date}/${month}`;
 const label = i === 0 ? "Hôm Nay" : i === 1 ? "Ngày Mai" : dayOfWeek;
 days.push({
 iso,
 dayOfWeek,
 dateFormatted,
 label,
 display: `${label} (${dateFormatted})`
 });
 }
 return days;
 }, []);

 // Ngày đang xem sơ đồ ca sân (mặc định là Hôm nay)
 const [matrixDate, setMatrixDate] = useState<string>(() => {
 const d = new Date();
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 return `${year}-${month}-${date}`;
 });

 // Offline Booking Form State (Kèm ngày đặt tại quầy)
 const [offlineDate, setOfflineDate] = useState<string>(() => {
 const d = new Date();
 const year = d.getFullYear();
 const month = String(d.getMonth() + 1).padStart(2, "0");
 const date = String(d.getDate()).padStart(2, "0");
 return `${year}-${month}-${date}`;
 });
 const [offlinePitchId, setOfflinePitchId] = useState("");
  const OFFLINE_DURATION = 120; // Ca đặt tại quầy cố định 2 tiếng (120 phút)
  const [offlineTime, setOfflineTime] = useState("");
 const [offlineCustomer, setOfflineCustomer] = useState("");
 const [offlinePhone, setOfflinePhone] = useState("");
 const [offlineDepositType, setOfflineDepositType] = useState<"PAID_CASH" | "TRUST">("PAID_CASH");

 // Realtime Live Booking Alerts State
 const [realtimeAlert, setRealtimeAlert] = useState<RealtimeBookingEvent | null>(null);
 const [alertsHistory, setAlertsHistory] = useState<RealtimeBookingEvent[]>([]);
 const lastBookedSlotsRef = React.useRef<number>(0);

 // Refs đọc đồng thời matrixDate và thời lượng ca cố định trong async callbacks
 const matrixDateRef = React.useRef<string>(matrixDate);
 matrixDateRef.current = matrixDate;



 const showToast = (msg: string) => {
 setToastMsg(msg);
 setTimeout(() => setToastMsg(null), 3500);
 };

 const loadMatrixAndStats = async (
 pitchId: number | string,
 duration = MATRIX_DURATION,
 date = matrixDateRef.current
 ) => {
 try {
 const [matrixRes, statsRes] = await Promise.all([
 apiRequest<any[]>(`/api/v1/pitches/${pitchId}/matrix?date=${date}&duration=${duration}`),
 apiRequest<any>(`/api/v1/pitches/${pitchId}/stats?date=${date}`)
 ]);
 if (matrixRes && Array.isArray(matrixRes)) {
 setPitchMatrix(matrixRes);
 if (matrixRes.length > 0 && !offlinePitchId) {
 setOfflinePitchId(matrixRes[0].pitchName);
 }
 }
 if (statsRes) {
 setPitchStats(statsRes);
 if (statsRes.openTime) setOperatingOpenTime(statsRes.openTime);
 if (statsRes.closeTime) setOperatingCloseTime(statsRes.closeTime);
 if (statsRes.slotDurationMinutes) setOperatingSlotDuration(statsRes.slotDurationMinutes);
 }
 } catch (err: any) {
 console.warn("Lỗi tải matrix/stats từ database:", err.message);
 }
 };

 // Hàm chuyển ngày xem lịch ca sân
 const handleSelectDate = (dateStr: string) => {
 setMatrixDate(dateStr);
 matrixDateRef.current = dateStr;
 const currentId = activePitch?.id || 1;
 loadMatrixAndStats(currentId, MATRIX_DURATION, dateStr);
 };

 // Fetch real pitch data from backend API & Subscribe Realtime
 useEffect(() => {
 setMounted(true);
 fetchRealData();

 // 1. Lắng nghe sự kiện Realtime đa tab / đa role (0 mili-giây)
 const unsubscribe = subscribeToBookingEvents((event) => {
 if (event.type === "BOOKING_CREATED") {
 playNotificationChime();
 setRealtimeAlert(event);
 setAlertsHistory((prev) => [event, ...prev].slice(0, 10));

 const dateLabel = event.bookingDate 
 ? (event.bookingDate === matrixDateRef.current ? "Hôm nay" : event.bookingDate)
 : "Hôm nay";
 showToast(`⚡ CÓ ĐƠN ĐẶT SÂN MỚI! Khách ${event.customerName} (${event.customerPhone}) vừa cọc ca [${event.timeSlot}] ngày [${dateLabel}] của [${event.courtName}]!`);
 
 // Cập nhật ma trận ca sân & doanh thu tức thời theo ngày đang xem
 const currentId = activePitch?.id || 1;
 loadMatrixAndStats(currentId, MATRIX_DURATION, matrixDateRef.current);
 } else if (event.type === "BOOKING_CANCELLED") {
 const currentId = activePitch?.id || 1;
 loadMatrixAndStats(currentId, MATRIX_DURATION, matrixDateRef.current);
 }
 });

 // 2. Heartbeat Polling mỗi 4 giây (Đồng bộ đa trình duyệt / đa thiết bị khác nhau theo ngày đang chọn)
 const heartbeatInterval = setInterval(async () => {
 const currentId = activePitch?.id || 1;
 try {
 const statsRes = await apiRequest<any>(`/api/v1/pitches/${currentId}/stats?date=${matrixDateRef.current}`);
 if (statsRes && typeof statsRes.bookedSlots === "number") {
 if (lastBookedSlotsRef.current > 0 && statsRes.bookedSlots > lastBookedSlotsRef.current) {
 playNotificationChime();
 showToast(`🔔 Cụm sân vừa nhận thêm đơn đặt cọc mới! Đã tự động cập nhật sơ đồ ca.`);
 loadMatrixAndStats(currentId, MATRIX_DURATION, matrixDateRef.current);
 }
 lastBookedSlotsRef.current = statsRes.bookedSlots;
 }
 } catch (e) {
 // silent fallback
 }
 }, 4000);

 return () => {
 unsubscribe();
 clearInterval(heartbeatInterval);
 };
 }, [activePitch?.id]);

 const handleUpdateOperatingHours = async (e: React.FormEvent) => {
 e.preventDefault();
 const currentId = activePitch?.id || 1;
 setIsUpdatingHours(true);
 try {
 await apiRequest(`/api/v1/pitches/${currentId}/operating-hours`, {
 method: "PUT",
 body: JSON.stringify({
 openTime: operatingOpenTime,
 closeTime: operatingCloseTime,
 slotDurationMinutes: operatingSlotDuration
 })
 });
 await loadMatrixAndStats(currentId);
 setShowHoursModal(false);
 showToast(`⚡ Đã cập nhật giờ mở cửa (${operatingOpenTime} - ${operatingCloseTime}) và ca ${operatingSlotDuration} phút!`);
 } catch (err: any) {
 showToast(`❌ Lỗi cập nhật: ${err.message || 'Không thể lưu cài đặt'}`);
 } finally {
 setIsUpdatingHours(false);
 }
 };

 const fetchRealData = async () => {
 setIsLoadingBackend(true);
 try {
 const pitches = await apiRequest<any[]>("/api/v1/pitches");
 if (pitches && pitches.length > 0) {
 setRealPitches(pitches);
 const current = pitches[0];
 setActivePitch(current);
 await loadMatrixAndStats(current.id);
 }
 } catch (err: any) {
 console.warn("Backend API sync notice:", err.message);
 } finally {
 setIsLoadingBackend(false);
 }
 };

 const handleSelectPitch = async (pitch: any) => {
 setActivePitch(pitch);
 await loadMatrixAndStats(pitch.id);
 showToast(`🏟️ Đã kết nối cụm sân: [${pitch.name}]`);
 };

 // Add new pitch handler (Lưu thật vào MySQL)
 const handleCreateNewPitch = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newPitchName.trim()) {
 showToast("❌ Vui lòng nhập tên sân con mới!");
 return;
 }

 const currentId = activePitch?.id || 1;
 try {
 await apiRequest(`/api/v1/pitches/${currentId}/add-court`, {
 method: "POST",
 body: JSON.stringify({
 courtName: newPitchName.trim(),
 courtType: newPitchType,
 basePrice: Number(newPitchBasePrice) || 350000,
 peakPrice: Number(newPitchPeakPrice) || 500000
 })
 });
 await loadMatrixAndStats(currentId);
 setShowAddPitchModal(false);
 setNewPitchName("");
 showToast(`🎉 Đã thêm sân [${newPitchName}] vào database cụm sân!`);
 } catch (err: any) {
 showToast(`❌ Lỗi thêm sân con: ${err.message || 'Không thể lưu vào hệ thống'}`);
 }
 };

 // Offline Booking submit (Lưu thật vào MySQL)
 const handleOfflineBookingSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!offlineCustomer.trim() || !offlinePhone.trim()) {
 showToast("❌ Vui lòng nhập đầy đủ tên và số điện thoại khách!");
 return;
 }

 const currentId = activePitch?.id || 1;
 try {
 const targetCourt = pitchMatrix.find(p => p.pitchName === offlinePitchId || p.pitchId === offlinePitchId) || pitchMatrix[0];
 const isPeak = offlineTime.includes("17:30") || offlineTime.includes("19:00");
 const baseHourPrice = isPeak ? (targetCourt?.peakPrice || 600000) : (targetCourt?.basePrice || 350000);
 const hourMultiplier = OFFLINE_DURATION / 60.0;
 const price = Math.round(baseHourPrice * hourMultiplier);
 const deposit = offlineDepositType === "PAID_CASH" ? Math.round(price / 2) : 0;

 await apiRequest(`/api/v1/pitches/${currentId}/book-offline`, {
 method: 'POST',
 body: JSON.stringify({
 courtName: targetCourt ? targetCourt.pitchName : offlinePitchId,
 courtType: targetCourt ? targetCourt.type : "Sân 7",
 bookingDate: offlineDate,
 timeSlot: offlineTime,
 customerName: offlineCustomer.trim(),
 customerPhone: offlinePhone.trim(),
 totalPrice: price,
 depositPaid: deposit,
 via: offlineDepositType === "PAID_CASH" ? "Tạo Tại Quầy (Đã Cọc)" : "Tạo Tại Quầy (Giữ Ca)"
 })
 });

 // Nếu ngày đặt trùng hoặc chủ sân muốn xem ngày vừa đặt, cập nhật matrix
 setMatrixDate(offlineDate);
 matrixDateRef.current = offlineDate;
 await loadMatrixAndStats(currentId, MATRIX_DURATION, offlineDate);
 setShowOfflineModal(false);
 setOfflineCustomer("");
 setOfflinePhone("");
 showToast(`✅ Đã đặt ca thành công ngày [${offlineDate}] cho khách [${offlineCustomer}] và lưu vào database!`);

 // Phát sự kiện Realtime cho các Tab khác (bao gồm Cầu Thủ và Navbar)
 broadcastBookingEvent({
 type: "BOOKING_CREATED",
 pitchId: currentId,
 customerName: offlineCustomer.trim(),
 customerPhone: offlinePhone.trim(),
 courtName: targetCourt ? targetCourt.pitchName : offlinePitchId,
 timeSlot: offlineTime,
 bookingDate: offlineDate,
 totalPrice: price,
 depositPaid: deposit,
 via: offlineDepositType === "PAID_CASH" ? "Tạo Tại Quầy (Đã Cọc)" : "Tạo Tại Quầy (Giữ Ca)"
 });
 } catch (err: any) {
 showToast(`❌ Lỗi đặt ca: ${err.message || 'Khung giờ này đã có người đặt trước!'}`);
 }
 };

 // Confirm Check-in (Cập nhật thật vào MySQL)
 const handleConfirmCheckin = async (slot: any) => {
 if (!slot) return;
 if (slot.bookingId) {
 try {
 await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}/check-in`, { method: "PUT" });
 await loadMatrixAndStats(activePitch?.id || 1);
 setSelectedSlotForAction(null);
 showToast("⚽ Check-in thành công! Khách đã vào sân thi đấu.");

 broadcastBookingEvent({
 type: "BOOKING_CHECKED_IN",
 pitchId: activePitch?.id || 1,
 bookingId: slot.bookingId,
 customerName: slot.customer
 });
 return;
 } catch (err: any) {
 showToast(`❌ Lỗi check-in: ${err.message}`);
 }
 } else {
 setSelectedSlotForAction(null);
 showToast("⚽ Đã ghi nhận khách vào sân!");
 }
 };

 // Cancel Booking - Step 1: Show modal to collect reason
 const handleCancelBooking = async (slot: any) => {
 if (!slot) return;
 if (slot.bookingId) {
 // Đóng modal check-in hiện tại để tránh đè giao diện
 setSlotToCancel(slot);
 setCancelReasonInput("");
 setSelectedSlotForAction(null);
 setShowCancelModal(true);
 } else {
 setSelectedSlotForAction(null);
 }
 };

 // Cancel Booking - Step 2: Confirm with reason and call API
 const handleConfirmCancel = async () => {
 const slot = slotToCancel;
 if (!slot || !cancelReasonInput.trim()) {
 showToast("⚠️ Vui lòng nhập lý do hủy ca.");
 return;
 }
 try {
  // Dùng endpoint hủy kèm lý do (giữ đơn ở trạng thái CANCELLED + báo khách).
  let cancelRes: any = null;
  try {
  cancelRes = await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}/cancel`, {
  method: "POST",
  body: JSON.stringify({
  reason: cancelReasonInput.trim(),
  cancelledBy: "OWNER"
  })
  });
  } catch (e: any) {
  // Chỉ fallback khi backend cũ chưa có endpoint (404). Mọi lỗi khác (403, 400...)
  // phải ném ra để không xóa nhầm đơn của cụm sân khác.
  if (e?.status !== 404) throw e;
  await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}`, { method: "DELETE" });
  }

 await loadMatrixAndStats(activePitch?.id || 1);
 setSelectedSlotForAction(null);
 setShowCancelModal(false);
 setSlotToCancel(null);
 setCancelReasonInput("");
  const refundMsg = cancelRes?.refundDeposit ? ` Nhớ hoàn lại ${formatMoney(cancelRes.refundDeposit)} tiền cọc cho khách.` : "";
  showToast(`🗑️ ${cancelRes?.message || "Đã hủy ca đặt."}${refundMsg}`);

 // Broadcast event with reason so customer's Navbar gets notified
 broadcastBookingEvent({
 type: "BOOKING_CANCELLED",
 pitchId: activePitch?.id || 1,
 bookingId: slot.bookingId,
 courtName: activePitch?.name || "sân",
 timeSlot: slot.time || slot.timeSlot || "",
 cancelReason: cancelReasonInput.trim(),
 cancelledBy: "OWNER"
 } as any);
 } catch (err: any) {
 showToast(`❌ Lỗi hủy ca: ${err.message}`);
 }
 };

 // Tra cứu mã vé hoặc SĐT từ API backend
 const handleSearchBooking = async () => {
 if (!searchCodeInput.trim()) return;
 try {
 const res = await apiRequest<any[]>(`/api/v1/pitches/bookings/search?query=${encodeURIComponent(searchCodeInput.trim())}`);
 if (res && res.length > 0) {
 const found = res[0];
 setSelectedSlotForAction({
 id: `booking-${found.id}`,
 bookingId: found.id,
 customer: found.customerName,
 phone: found.customerPhone,
 time: found.timeSlot,
 price: `${found.totalPrice ? Math.round(found.totalPrice / 1000) : 0}k`,
 depositPaid: `${found.depositPaid ? Math.round(found.depositPaid / 1000) : 0}k`,
 cashDue: `${found.cashDue ? Math.round(found.cashDue / 1000) : 0}k`,
 status: found.status ? found.status.toLowerCase() : "booked",
 via: found.via || "Tạo Tại Quầy",
 code: found.code || "—"
 });
 showToast(`🔍 Tìm thấy đơn vé: [${found.code}] của khách ${found.customerName}`);
 } else {
 showToast(`❌ Không tìm thấy đơn ca nào khớp với từ khóa "${searchCodeInput}"`);
 }
 } catch (e: any) {
 showToast(`❌ Lỗi tra cứu: ${e.message}`);
 }
 };

 // Tự động tính toán các ca sân xem trước/fallback từ giờ mở, đóng cửa và thời lượng ca
 const computedFallbackSlots = useMemo(() => {
 try {
 const parseMinutes = (t: string) => {
 const [h, m] = (t || "").split(":").map(Number);
 return (h || 0) * 60 + (m || 0);
 };
 const formatTime = (totalMin: number) => {
 const h = Math.floor(totalMin / 60) % 24;
 const m = totalMin % 60;
 return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
 };
 const startMin = parseMinutes(operatingOpenTime || "14:00");
 const endMin = parseMinutes(operatingCloseTime || "22:30");
 const duration = Number(operatingSlotDuration) || 120;
 const slots: string[] = [];
 let current = startMin;
 while (current + duration <= endMin) {
 slots.push(`${formatTime(current)} - ${formatTime(current + duration)}`);
 current += duration;
 }
 return slots.length > 0 ? slots : ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 } catch {
 return ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 }
 }, [operatingOpenTime, operatingCloseTime, operatingSlotDuration]);

 // Danh sách các khung giờ thực tế (lấy từ dữ liệu ma trận hoặc từ cấu hình giờ hoạt động)
 const matrixSlots = Array.from(
 new Set(pitchMatrix.flatMap(p => (p.slots || []).map((s: any) => s.time)))
 ).filter(Boolean);

 const availableTimeSlots: string[] = matrixSlots.length > 0 ? matrixSlots : computedFallbackSlots;

 // Tính danh sách ca đặt tại quầy theo thời lượng cố định 2 tiếng (120 phút)
 const offlineAvailableSlots = useMemo(() => {
 try {
 const parseMinutes = (t: string) => {
 const [h, m] = (t || "").split(":").map(Number);
 return (h || 0) * 60 + (m || 0);
 };
 const formatTime = (totalMin: number) => {
 const h = Math.floor(totalMin / 60) % 24;
 const m = totalMin % 60;
 return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
 };
 const startMin = parseMinutes(operatingOpenTime || "14:00");
 const endMin = parseMinutes(operatingCloseTime || "22:30");
 const dur = OFFLINE_DURATION;
 const slots: string[] = [];
 let current = startMin;
 while (current + dur <= endMin) {
 slots.push(`${formatTime(current)} - ${formatTime(current + dur)}`);
 current += dur;
 }
 return slots.length > 0 ? slots : ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 } catch {
 return ["14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00"];
 }
 }, [operatingOpenTime, operatingCloseTime, OFFLINE_DURATION]);

 // Filter matrix slots based on state (status, type, time slot, and booking method)
 const filteredMatrix = pitchMatrix
 .filter(pitch => matrixFilterType === "ALL" || pitch.type.includes(matrixFilterType))
 .map(pitch => ({
 ...pitch,
 slots: (pitch.slots || []).filter((s: any) => {
 // 1. Lọc theo trạng thái
 if (matrixFilterStatus === "BOOKED" && s.status !== "booked") return false;
 if (matrixFilterStatus === "PLAYING" && s.status !== "playing") return false;
 if (matrixFilterStatus === "EMPTY" && s.status !== "empty") return false;
 if (matrixFilterStatus === "RESALE" && s.status !== "resale") return false;

 // 2. Lọc theo khoảng thời gian (Khung giờ)
 if (matrixFilterTime === "PEAK") {
 // Giờ vàng chiều tối (17:30 - 20:30)
 if (!s.time.includes("17:30") && !s.time.includes("19:00")) return false;
 } else if (matrixFilterTime === "OFF_PEAK") {
 // Giờ thường và ca đêm (16:00 - 17:30 và 20:30 - 22:00)
 if (s.time.includes("17:30") || s.time.includes("19:00")) return false;
 } else if (matrixFilterTime !== "ALL") {
 if (s.time !== matrixFilterTime) return false;
 }

 // 3. Lọc theo hình thức đặt sân
 if (matrixFilterMethod === "ONLINE") {
 const via = (s.via || "").toLowerCase();
 if (!via.includes("vietqr") && !via.includes("online") && !via.includes("momo")) return false;
 } else if (matrixFilterMethod === "OFFLINE") {
 const via = (s.via || "").toLowerCase();
 if (!via.includes("quầy") && !via.includes("trực tiếp")) return false;
 } else if (matrixFilterMethod === "RESALE") {
 const via = (s.via || "").toLowerCase();
 if (!via.includes("nhượng") && s.status !== "resale") return false;
 } else if (matrixFilterMethod === "EMPTY") {
 if (s.status !== "empty") return false;
 }

 return true;
 })
 }));

 return (
 <div className="space-y-4 sm:space-y-8 animate-fade-in-up pb-16">
 {/* Toast Feedback Notification */}
 {toastMsg && (
 <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up">
 <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
 <span className="text-[13px] font-bold">{toastMsg}</span>
 </div>
 )}

 {/* POPUP THÔNG BÁO ĐƠN ĐẶT SÂN REALTIME TỪ CẦU THỦ */}
 {realtimeAlert && (
 <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-sky-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 animate-modal-pop relative overflow-hidden">
 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#0369a1]/10 rounded-full blur-2xl pointer-events-none" />
 
 <div className="flex items-start space-x-3.5 relative z-10">
 <div className="w-12 h-12 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-lg animate-bell-wiggle">
 <Bell className="w-6 h-6 fill-white text-white" />
 </div>
 <div className="space-y-1">
 <div className="flex items-center space-x-2">
 <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[13px] tracking-wider shadow-xs">
 ⚡ ĐƠN ĐẶT SÂN MỚI TỨC THỜI
 </span>
 <span className="text-[13px] font-mono text-sky-800 font-bold">Vừa đặt cọc xong</span>
 </div>
 <h3 className="text-base sm:text-lg font-black text-slate-900 ">
 Khách hàng <span className="text-amber-600 underline underline-offset-2">{realtimeAlert.customerName}</span> ({realtimeAlert.customerPhone}) vừa cọc ca thi đấu!
 </h3>
 <p className="text-[13px] text-sky-800 font-medium flex flex-wrap items-center gap-x-2">
 <span>🏟️ {realtimeAlert.courtName}</span>
 <span>•</span>
 <span>⏰ Ca: <strong className="text-slate-900 font-mono">{realtimeAlert.timeSlot}</strong></span>
 <span>•</span>
 <span>💰 Đã cọc: <strong className="text-amber-600 font-mono font-bold">{(realtimeAlert.depositPaid || 0).toLocaleString('vi-VN')}đ</strong></span>
 <span>•</span>
 <span>💳 Qua: <strong className="text-slate-900 ">{realtimeAlert.via || "Tại quầy"}</strong></span>
 </p>
 </div>
 </div>

 <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 relative z-10">
 <button
 type="button"
 onClick={() => playNotificationChime()}
 className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[13px] flex items-center space-x-1 transition-all cursor-pointer"
 title="Phát lại âm thanh chuông thông báo"
 >
 <Volume2 className="w-4 h-4" />
 <span>Phát lại chuông</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setRealtimeAlert(null);
 showToast("✓ Đã xác nhận đơn! Ma trận ca sân đã cập nhật trạng thái mới nhất.");
 }}
 className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[13px] shadow-lg transition-all active:scale-95 cursor-pointer"
 >
 Đã Nhận Đơn ✓
 </button>
 </div>
 </div>
 )}

 {/* Real-time Order Notification Banner */}
 {notification && (
 <div className="bg-[#0369a1] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-lg border border-sky-400/30 flex items-center justify-between animate-fade-in">
 <div className="flex items-center space-x-3 text-[13px] font-bold">
 <Bell className="w-4 h-4 animate-bell-wiggle text-amber-300 shrink-0" />
 <span>{notification}</span>
 </div>
 <button
 onClick={() => setNotification(null)}
 className="text-white/80 hover:text-white p-1"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 )}

 {/* HEADER BANNER WITH REAL BACKEND DATA */}
 <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-4 shadow-sm">
 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
 {/* min-w-[480px] ở xl: chặn cột trái bị ép về 0px khi dãy nút bên phải
     (max-content ~1286px) chiếm hết chỗ → chữ tiêu đề rớt thành cột dọc. */}
 <div className="min-w-0 flex-1 xl:min-w-[480px]">
 <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/20 text-[#0b4f6c] text-sm font-bold mb-2">
 <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
 <span>
 Bảng Điều Hành Chủ Sân
 </span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
 <span>{activePitch ? activePitch.name.replace(/đà nẵng/i, "Đà Nẵng") : "Chưa chọn cụm sân nào"}</span>
 {isLoadingBackend && <RefreshCw className="w-5 h-5 text-[#0369a1] animate-spin" />}
 </h1>
 <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium mt-1">
 <span className="flex items-center gap-1.5">
 <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
 <span>{activePitch?.address || "Chưa khai báo địa chỉ"}</span>
 </span>
 <span>•</span>
 <span className="flex items-center gap-1.5">
 <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0" />
 <span>Hotline: <strong className="text-slate-800 ">{activePitch?.phone || "Chưa khai báo"}</strong></span>
 </span>
 <span>•</span>
 <span className="text-sky-700 font-bold">
 Chủ sân: {activePitch?.ownerName || "Chưa khai báo"}
 </span>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2.5 min-w-0">
 {realPitches.length > 1 && (
 <select
 value={activePitch?.id || ""}
 onChange={(e) => {
 const p = realPitches.find(x => x.id.toString() === e.target.value);
 if (p) handleSelectPitch(p);
 }}
 className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 cursor-pointer shadow-xs"
 >
 {realPitches.map(p => (
 <option key={p.id} value={p.id}>{p.name}</option>
 ))}
 </select>
 )}

 <button
 type="button"
 onClick={fetchRealData}
 title="Đồng bộ dữ liệu thật từ CSDL"
 className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95 border border-slate-200 "
 >
 <RefreshCw className={`w-4 h-4 ${isLoadingBackend ? 'animate-spin text-[#0369a1]' : ''}`} />
 </button>

 <button
 type="button"
 onClick={() => setShowHoursModal(true)}
 className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[13px] sm:text-sm shadow-xs transition-all active:scale-95 flex items-center space-x-1.5 whitespace-normal sm:whitespace-nowrap shrink-0"
 title="Cài đặt khung giờ mở cửa và đóng cửa cụm sân"
 >
 <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
 <span>Giờ Mở Sân: {operatingOpenTime} - {operatingCloseTime} (Ca 2 tiếng)</span>
 </button>

 {onNavigateTab && (
 <button
 type="button"
 onClick={() => onNavigateTab("owner-onboarding")}
 className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1.5 whitespace-nowrap shrink-0 cursor-pointer"
 title="Khởi tạo hoặc thiết lập cụm sân mới qua Wizard 4 bước"
 >
 <Building className="w-4 h-4 shrink-0" />
  <span>+ Cụm Sân Mới</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => setShowAddPitchModal(true)}
 className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1.5 whitespace-nowrap shrink-0"
 >
 <Plus className="w-4 h-4 shrink-0" />
  <span>Thêm Sân Con</span>
 </button>

 <button
 type="button"
  onClick={() => { setOfflineTime(offlineAvailableSlots[0] ?? ""); setShowOfflineModal(true); }}
 className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] sm:text-sm shadow-md transition-all active:scale-95 flex items-center space-x-1.5 whitespace-nowrap shrink-0"
 >
 <PhoneCall className="w-4 h-4 shrink-0" />
  <span>Đặt Ca Quầy</span>
 </button>
 </div>
 </div>

 {/* SUB TAB NAVIGATION TOOLBAR */}
 <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 ">
 <button
 type="button"
 onClick={() => setActiveSubTab("matrix")}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === "matrix"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <BarChart2 className="w-4 h-4 shrink-0" />
 <span>Ma Trận Ca Sân</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab("pitches")}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === "pitches"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <Building className="w-4 h-4 shrink-0" />
 <span>Sân Con ({pitchMatrix.length})</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab("pricing")}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === "pricing"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
 <span>Giá &amp; Tiền Cọc</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab("canteen")}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === "canteen"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <Coffee className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>Canteen &amp; Vật Tư</span>
 </button>

 <button
 type="button"
 onClick={() => setActiveSubTab("reports")}
 className={`px-3.5 sm:px-4 py-2 rounded-xl text-[13px] sm:text-sm font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${
 activeSubTab === "reports"
 ? "bg-[#0369a1] text-white shadow-md"
 : "bg-slate-100 text-slate-700 hover:bg-slate-200"
 }`}
 >
 <PieChart className="w-4 h-4 text-emerald-400 shrink-0" />
 <span>Doanh Thu &amp; Báo Cáo</span>
 </button>
 </div>
 </div>

 {/* Kênh liên lạc với Ban Tổ Chức (B2B) */}
 <BusinessContacts viewerRole="OWNER" onStartDm={onStartDm} />

 {/* --- SUB-TAB CONTENT 5: DOANH THU & XUAT BAO CAO (rieng biet, khong gop voi cac tab khac) --- */}
 {activeSubTab === "reports" && (
 <div className="space-y-3 sm:space-y-6">
 {/* === BIỂU ĐỒ THỐNG KÊ CHỦ SÂN (recharts) === */}
 <OwnerCharts activePitch={activePitch} />

 {/* Dữ liệu trống -> gợi ý tạo dữ liệu demo ngay tại dashboard chủ sân
 (trước đây chỉ ADMIN tạo được ở /admin, chủ sân không có cách nào) */}
 {(pitchStats.bookedSlots ?? 0) === 0 && !isLoadingBackend && (
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
 <div className="flex-1 min-w-0">
 <p className="text-[13px] font-black text-slate-700 flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
 Cụm sân chưa có đơn nào
 </p>
 <p className="text-[13px] text-slate-500 mt-0.5">
 Tạo dữ liệu demo 14 ngày trước · 7 ngày sau để có số liệu.
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 disabled={simBusy !== null}
 onClick={async () => {
 try {
 setSimBusy("gen");
 const res = await simulateBookings({
 pitchId: activePitch?.id || 1,
 pastDays: 14,
 futureDays: 7,
 perDay: 6,
 });
 showToast(`Đã tạo ${res.created} đơn giả lập cho cụm sân.`);
 // Nạp lại ma trận + thống kê để số liệu hiện ra ngay
 await loadMatrixAndStats(activePitch?.id || 1);
 } catch (e: any) {
 showToast(e?.message || "Không tạo được dữ liệu demo.");
 } finally {
 setSimBusy(null);
 }
 }}
 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50"
 >
 <Sparkles className="w-3.5 h-3.5" />
 {simBusy === "gen" ? "Đang tạo…" : "Tạo đơn giả lập"}
 </button>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
 <div className="glass-panel p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">
 Doanh Thu {matrixDate === upcomingDays[0]?.iso ? "Hôm Nay" : `Ngày ${matrixDate.split("-").reverse().join("/")}`}
 </span>
 <div className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
 {(pitchStats.totalRevenue || 0).toLocaleString("vi-VN")} VNĐ
 </div>
 <span className="text-[13px] font-bold text-sky-700 flex items-center">
 <TrendingUp className="w-4 h-4 mr-1 shrink-0" /> Online {pitchStats.onlineBookings} ca • Quầy {pitchStats.counterBookings} ca
 </span>
 </div>

 <div className="glass-panel p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">Tỷ Lệ Lấp Đầy Ca Sân</span>
 <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
 {pitchStats.occupancyRate}%
 </div>
 <span className="text-[13px] font-bold text-emerald-500">
 Khóa {pitchStats.bookedSlots} / {pitchStats.totalSlots} ca đặt
 </span>
 </div>

 <div className="glass-panel p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">Đơn Cọc VietQR Online</span>
 <div className="text-2xl sm:text-3xl font-black text-[#0369a1] font-mono">
 {pitchStats.onlineBookings} Ca Online
 </div>
 <span className="text-[13px] font-bold text-slate-500">Ca đặt qua trang đặt sân của Turfzone</span>
 </div>

 <div className="glass-panel p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-2">
 <span className="text-sm font-bold text-slate-500 tracking-wider block">Khách Vãng Lai Tại Quầy</span>
 <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
 {pitchStats.counterBookings} Ca Trực Tiếp
 </div>
 <span className="text-[13px] font-bold text-amber-700">Khóa lịch ca tức thì trên toàn sàn</span>
 </div>
 </div>

 {/* === XUẤT BÁO CÁO THỐNG KÊ (CSV cho Excel + gửi email) === */}
 <OwnerReportExport />
 </div>
 )}

 {/* QUICK SEARCH & CHECK-IN TOOLBAR */}
 {activeSubTab === "matrix" && (
 <div className="glass-panel p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white ">
 <div className="flex items-center space-x-3 w-full sm:w-auto">
 <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0b4f6c] flex items-center justify-center shrink-0">
 <QrCode className="w-5 h-5" />
 </div>
 <div>
 <span className="text-sm font-black text-slate-900 block">Tra Cứu Mã Vé & Check-in</span>
 <span className="hidden sm:inline text-[13px] text-slate-500">Nhập mã vé hoặc SĐT khách</span>
 </div>
 </div>

 <div className="flex items-center space-x-2.5 w-full sm:w-auto">
 <div className="relative flex-1 sm:w-80">
 <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
 <input
 type="text"
 value={searchCodeInput}
 onChange={(e) => setSearchCodeInput(e.target.value)}
 onKeyDown={(e) => { if (e.key === "Enter") handleSearchBooking(); }}
 placeholder="VD: VS-1-7102 hoặc SĐT khách..."
 className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
 />
 </div>
 <button
 onClick={handleSearchBooking}
 className="px-6 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white text-sm sm:text-base font-black shadow-sm shrink-0 active:scale-95 transition-all"
 >
 Tra Cứu
 </button>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 1: LIVE MATRIX VIEW --- */}
 {activeSubTab === "matrix" && (
 <div className="space-y-3 sm:space-y-6">
 <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4">
 <div className="flex items-center space-x-2.5 shrink-0">
 <BarChart2 className="w-5.5 h-5.5 text-[#0b4f6c] " />
 <div>
 <h2 className="text-xl font-black text-slate-900 ">
 Sơ Đồ Ca Sân Thời Gian Thực
 </h2>
 <span className="hidden sm:block text-[13px] text-slate-500 mt-0.5">
 Giờ mở: <strong className="font-mono text-indigo-500 text-sm font-bold">{operatingOpenTime} - {operatingCloseTime}</strong> • Ca 2 tiếng (120 phút)
 </span>
 </div>
 </div>

 {/* BỘ LỌC DẠNG DROPDOWN VÀ CHỌN THỜI LƯỢNG TIỆN LỢI */}
 <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
  {/* Thời lượng ca cố định 2 tiếng (120 phút) — không còn bộ chọn 1h/1.5h/2h */}

 {/* 1. DROPDOWN TRẠNG THÁI CA */}
 <div className="flex items-center space-x-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-sm">
 <span className="text-slate-600 pl-2.5 text-sm font-bold">Trạng thái:</span>
 <select
 value={matrixFilterStatus}
 onChange={(e) => setMatrixFilterStatus(e.target.value)}
 className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer shadow-xs"
 >
 <option value="ALL">Tất cả trạng thái</option>
 <option value="BOOKED">🟢 Đã Cọc</option>
 <option value="PLAYING">🔴 Đang Đá (IN_USE)</option>
 <option value="EMPTY">⚪ Ca Trống (AVAILABLE)</option>
 <option value="RESALE">🟡 Sàn Nhượng Gấp</option>
 </select>
 </div>

 {/* 2. DROPDOWN LOẠI SÂN */}
 <div className="flex items-center space-x-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-sm">
 <span className="text-slate-600 pl-2.5 text-sm font-bold">Loại sân:</span>
 <select
 value={matrixFilterType}
 onChange={(e) => setMatrixFilterType(e.target.value)}
 className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer shadow-xs"
 >
 <option value="ALL">Tất cả loại sân</option>
 <option value="Sân 5">Sân 5 Người</option>
 <option value="Sân 7">Sân 7 Người</option>
 <option value="Sân 11">Sân 11 Tiêu Chuẩn</option>
 </select>
 </div>

 {/* 3. DROPDOWN KHUNG GIỜ / CA SÂN */}
 <div className="flex items-center space-x-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-sm">
 <span className="text-slate-600 pl-2.5 text-sm font-bold flex items-center gap-1.5">
 <Clock className="w-4 h-4 text-[#0369a1] shrink-0" />
 <span>Khung giờ:</span>
 </span>
 <select
 value={matrixFilterTime}
 onChange={(e) => setMatrixFilterTime(e.target.value)}
 className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] font-mono cursor-pointer shadow-xs"
 >
 <option value="ALL">Tất cả ca ({availableTimeSlots.length} ca)</option>
 <option value="PEAK">⭐ Khung Giờ Vàng (Cao Điểm)</option>
 {availableTimeSlots.map((slot) => (
 <option key={slot} value={slot}>
 {slot}
 </option>
 ))}
 </select>
 </div>

 {/* 4. DROPDOWN HÌNH THỨC ĐẶT SÂN */}
 <div className="flex items-center space-x-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-sm">
 <span className="text-slate-600 pl-2.5 text-sm font-bold flex items-center gap-1.5">
 <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
 <span>Hình thức:</span>
 </span>
 <select
 value={matrixFilterMethod}
 onChange={(e) => setMatrixFilterMethod(e.target.value)}
 className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] cursor-pointer shadow-xs"
 >
 <option value="ALL">Tất cả hình thức</option>
 <option value="ONLINE">📱 Đặt qua Website Turfzone</option>
 <option value="OFFLINE">☎️ Tạo Tại Quầy (Vãng Lai)</option>
 <option value="RESALE">🔄 Sàn Nhượng Ca Gấp</option>
 <option value="EMPTY">⚪ Ca Trống Chưa Đặt</option>
 </select>
 </div>

 {/* NÚT RESET BỘ LỌC */}
 {(matrixFilterStatus !== "ALL" || matrixFilterType !== "ALL" || matrixFilterTime !== "ALL" || matrixFilterMethod !== "ALL") && (
 <button
 onClick={() => {
 setMatrixFilterStatus("ALL");
 setMatrixFilterType("ALL");
 setMatrixFilterTime("ALL");
 setMatrixFilterMethod("ALL");
 }}
 className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-sm font-bold flex items-center space-x-1.5 transition-all active:scale-95"
 title="Đặt lại tất cả các bộ lọc về mặc định"
 >
 <X className="w-4 h-4" />
 <span>Đặt Lại</span>
 </button>
 )}
 </div>
 </div>

 {/* THANH CHỌN NGÀY THI ĐẤU (QUAN TRỌNG: CHỦ SÂN XEM ĐƯỢC CA ĐẶT CỦA MỌI NGÀY) */}
 <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
 <div className="flex items-center space-x-2.5">
 <div className="w-9 h-9 rounded-xl bg-[#0369a1]/15 text-[#0b4f6c] flex items-center justify-center shrink-0">
 <Calendar className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center space-x-2">
 <span className="text-[13px] font-black text-slate-700">
 Lịch Đặt Ca Ngày:
 </span>
 <span className="px-2.5 py-0.5 rounded-lg bg-[#0369a1] text-white font-black text-[13px] font-mono shadow-xs">
 {upcomingDays.find(d => d.iso === matrixDate)?.display || `Ngày ${matrixDate.split("-").reverse().join("/")}`}
 </span>
 {matrixDate === upcomingDays[0]?.iso ? (
 <span className="text-[13px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-extrabold">
 🟢 Hôm Nay
 </span>
 ) : (
 <span className="text-[13px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-extrabold">
 📅 Ngày Tương Lai
 </span>
 )}
 </div>
 <p className="hidden sm:block text-[13px] text-slate-500 mt-0.5">
 Bấm vào các ngày bên dưới để xem sơ đồ ca, khách đã cọc và doanh thu của ngày đó
 </p>
 </div>
 </div>

 <div className="flex items-center space-x-2 shrink-0">
 <div className="flex items-center space-x-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 ">
 <span className="text-[13px] font-bold text-slate-500 whitespace-nowrap">Chọn ngày khác:</span>
 <input
 type="date"
 value={matrixDate}
 onChange={(e) => {
 if (e.target.value) handleSelectDate(e.target.value);
 }}
 className="text-[13px] font-bold font-mono text-slate-900 bg-transparent cursor-pointer focus:outline-none"
 />
 </div>
 {matrixDate !== upcomingDays[0]?.iso && (
 <button
 type="button"
 onClick={() => handleSelectDate(upcomingDays[0]?.iso || "")}
 className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-[#0b4f6c] font-extrabold text-[13px] transition-colors border border-sky-200 shrink-0 cursor-pointer"
 >
 ↩ Về Hôm Nay
 </button>
 )}
 </div>
 </div>

 {/* Quick Pick Date Pills */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
 {upcomingDays.slice(0, 10).map((day) => {
 const isSelected = matrixDate === day.iso;
 return (
 <button
 key={day.iso}
 type="button"
 onClick={() => handleSelectDate(day.iso)}
 className={`px-3 py-1.5 rounded-xl text-[13px] font-black whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
 isSelected
 ? "bg-[#0369a1] text-white shadow-md scale-102 ring-2 ring-[#0369a1]/50"
 : "bg-white text-slate-700 border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 "
 }`}
 >
 <span>{day.label}</span>
 <span className={`text-[13px] font-mono px-1.5 py-0.2 rounded-md ${
 isSelected 
 ? "bg-white/20 text-white font-bold" 
 : "bg-slate-100 text-slate-500"
 }`}>
 {day.dateFormatted}
 </span>
 </button>
 );
 })}
 </div>
 </div>

 {/* COLOR CODES LEGEND */}
 <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm font-bold pt-1">
 <span className="flex items-center space-x-2 text-sky-700 ">
 <span className="w-3.5 h-3.5 rounded-full bg-[#0369a1] shadow-xs shrink-0" />
 <span>Đã Cọc</span>
 </span>
 <span className="flex items-center space-x-2 text-rose-600">
 <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs shrink-0" />
 <span>Đã Check-in Đá (IN_USE)</span>
 </span>
 <span className="flex items-center space-x-2 text-amber-700">
 <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs shrink-0" />
 <span>Sàn Nhượng Ca Gấp</span>
 </span>
 <span className="flex items-center space-x-2 text-slate-500">
 <span className="w-3.5 h-3.5 rounded-full bg-slate-300 shrink-0" />
 <span>Ca Trống (AVAILABLE)</span>
 </span>
 </div>

 {/* PITCH MATRIX GRID */}
 <div className="space-y-3 sm:space-y-4 pt-2">
 {filteredMatrix.length === 0 ? (
 <div className="py-12 text-center text-sm text-slate-500 bg-white/40 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2">
 <AlertCircle className="w-8 h-8 text-amber-700" />
 <span className="font-bold text-slate-700 ">Không tìm thấy sân con hoặc ca đá nào phù hợp</span>
 <span className="text-[13px]">Vui lòng chọn Đặt Lại bộ lọc để hiển thị toàn bộ ma trận ca sân</span>
 </div>
 ) : (
 filteredMatrix.map((pitch) => (
 <div key={pitch.pitchId} className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
 <div className="flex justify-between items-center text-sm">
 <div className="flex items-center space-x-2.5">
  <span className="font-black text-slate-900 text-base">{pitchTypeLabel(pitch.pitchName) || pitch.pitchName}</span>
 <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-[13px] font-mono text-slate-700 font-bold">
 {pitchTypeLabel(pitch.type)}
 </span>
 </div>
 <div className="text-[13px] font-mono text-slate-500">
 Giá cơ bản: <strong className="text-slate-900 font-bold text-sm">{(pitch.basePrice/1000).toFixed(0)}k/ca</strong>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
 {pitch.slots.length === 0 ? (
 <div className="col-span-full py-6 sm:py-8 text-center text-sm text-slate-500 bg-white/40 rounded-xl border border-dashed border-slate-200 flex items-center justify-center space-x-2">
 <AlertCircle className="w-5 h-5 text-slate-500" />
 <span>Không có ca đá nào khớp bộ lọc.</span>
 </div>
 ) : (
 pitch.slots.map((slot: any) => (
 <div
 key={slot.id}
 onClick={() => {
 if (slot.status === "empty") {
 setOfflinePitchId(pitch.pitchName);
 setOfflineTime(slot.time);
 setShowOfflineModal(true);
 } else {
 setSelectedSlotForAction(slot);
 }
 }}
 className={`p-3 sm:p-4 rounded-2xl border space-y-2 transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${
 slot.isContinuation
 ? "bg-indigo-500/10 border-indigo-400 text-indigo-700 font-bold"
 : slot.isGapSlot
 ? "bg-amber-500/10 border-dashed border-amber-400 text-amber-800 font-bold hover:bg-amber-500/20"
 : slot.status === "playing"
 ? "bg-rose-500/10 border-rose-400 text-rose-600 font-bold"
 : slot.status === "booked"
 ? "bg-[#0369a1]/10 border-sky-400 text-sky-700 font-bold"
 : slot.status === "resale"
 ? "bg-amber-500/10 border-amber-400 text-amber-600 font-bold"
 : "bg-white border-slate-200 text-slate-500 hover:border-sky-400 hover:bg-sky-50/20"
 }`}
 >
 <div className="flex justify-between items-center text-[13px] font-mono">
 <span className="font-extrabold text-sm">{slot.time}</span>
 <span className="font-black text-sm">{slot.price}</span>
 </div>
 
 <div className="flex items-center gap-1.5 flex-wrap">
 <p className={`font-black truncate text-sm ${slot.status === "empty" ? "text-slate-500" : "text-slate-900 "}`}>
 {slot.customer}
 </p>
 {slot.isContinuation && (
 <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 text-[13px] font-black tracking-wider">
 🔗 Ca Nối Dài
 </span>
 )}
 {slot.isGapSlot && (
 <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 text-[13px] font-black tracking-wider">
 ⚡ Khe Trống {slot.durationMinutes}p
 </span>
 )}
 </div>

 {/* HIỂN THỊ KHUNG GIỜ THỰC TẾ NẾU ĐẶT 2 TIẾNG HOẶC LỆCH GIỜ Ô */}
 {slot.bookingTimeSlot && slot.bookingTimeSlot !== slot.time && (
 <div className="text-[13px] font-bold text-[#0369a1] bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200/60 ">
 ⏰ Giờ đá thực: <span className="font-mono">{slot.bookingTimeSlot}</span>
 </div>
 )}
 
 <div className="text-[13px] space-y-1 opacity-90 font-mono">
 <span className="block text-slate-500">
 Cọc: <strong className={slot.isContinuation ? "text-indigo-600 font-bold" : slot.status === "empty" ? "text-slate-500" : "text-sky-700 font-bold"}>
 {slot.isContinuation ? "Đã tính ở ca trước" : slot.depositPaid}
 </strong>
 </span>
 {slot.status === "booked" && !slot.isContinuation && (
 <span className="block text-rose-600 font-bold">Thu tại quầy: <strong>{slot.cashDue}</strong></span>
 )}
 {slot.isContinuation && (
 <span className="block text-slate-500 text-[13px]">Cùng đơn: #{slot.code}</span>
 )}
 </div>

 <div className="flex items-center justify-between text-[13px] pt-2 border-t border-slate-200/50 ">
 <span className="truncate font-semibold">{slot.isContinuation ? "Ca lấn giờ tiếp nối" : slot.via}</span>
 <ChevronRight className="w-4 h-4 shrink-0" />
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )))}
 </div>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 2: PITCH INVENTORY & MANAGEMENT --- */}
 {activeSubTab === "pitches" && (
 <div className="space-y-3 sm:space-y-6">
 <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-4">
 <div>
 <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2.5">
 <Building className="w-5.5 h-5.5 text-[#0b4f6c] " />
 <span>Danh Sách Sân Con Trong Cụm ({pitchMatrix.length} Sân)</span>
 </h2>
 <p className="hidden sm:block text-sm text-slate-500 font-medium mt-1">
 Quản lý giá thuê, tình trạng sân và tiện ích cho từng sân con trong trung tâm thể thao.
 </p>
 </div>

 <button
 type="button"
 onClick={() => setShowAddPitchModal(true)}
 className="px-4 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95"
 >
 <Plus className="w-4 h-4" />
 <span>+ Thêm Sân Con Mới</span>
 </button>
 </div>

 {/* Nút sửa hồ sơ + giờ mở cửa (trước đây thiếu API sửa hồ sơ cụm sân) */}
 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={openEditInfoModal}
 className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-sm shadow-sm transition-all flex items-center space-x-2 active:scale-95"
 >
 <Pencil className="w-4 h-4 text-[#0b4f6c]" />
 <span>Sửa Hồ Sơ Cụm Sân</span>
 </button>
 <button
 type="button"
 onClick={() => setShowHoursModal(true)}
 className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-sm shadow-sm transition-all flex items-center space-x-2 active:scale-95"
 >
 <Clock className="w-4 h-4 text-[#0b4f6c]" />
 <span>Giờ Mở Cửa</span>
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
 {pitchMatrix.map((pitch) => (
 <div key={pitch.pitchId} className="p-3 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 sm:space-y-4">
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center space-x-2.5">
 <h3 className="font-black text-lg text-slate-900 ">{pitch.pitchName}</h3>
 <span className="px-2.5 py-0.5 rounded-lg bg-[#0369a1]/10 text-[#0b4f6c] text-[13px] font-mono font-bold">
 {pitchTypeLabel(pitch.type)}
 </span>
 </div>
 <span className="text-[13px] text-slate-500 font-medium mt-0.5 block">Mã sân: {pitch.pitchId}</span>
 </div>

 <span className="px-3 py-1 rounded-full bg-[#0369a1]/10 text-emerald-500 text-[13px] font-bold border border-[#0369a1]/20">
 Đang hoạt động
 </span>
 </div>

 <div className="grid grid-cols-2 gap-3 text-sm font-mono p-3.5 rounded-xl bg-white border border-slate-200 ">
 <div>
 <span className="text-slate-500 block text-[13px] font-semibold">Giá giờ thường</span>
 <strong className="text-slate-900 font-extrabold text-sm sm:text-base">{pitch.basePrice.toLocaleString("vi-VN")} đ/ca</strong>
 </div>
 <div>
 <span className="text-slate-500 block text-[13px] font-semibold">Giá giờ vàng</span>
 <strong className="text-amber-700 font-black text-sm sm:text-base">{pitch.peakPrice.toLocaleString("vi-VN")} đ/ca</strong>
 </div>
 </div>

 <div className="flex items-center justify-between text-sm pt-2">
 <span className="text-slate-500 text-[13px] sm:text-sm">
 Tiện ích:{" "}
 {activePitch?.amenities?.length
 ? activePitch.amenities.join(", ")
 : "Chưa khai báo tiện ích trong hồ sơ sân"}
 </span>
 <button
 onClick={() => setActiveSubTab("pricing")}
 className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-300 transition-colors shadow-2xs"
 >
 Sửa Giá Sân
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 3: GIÁ THUÊ SÂN (ghi vào bảng pitches qua API) --- */}
 {activeSubTab === "pricing" && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
 <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
 <div className="flex items-center space-x-2">
 <Sliders className="w-5 h-5 text-[#0b4f6c] " />
 <h3 className="font-extrabold text-base text-slate-900 ">Giá Thuê Sân Hiện Tại</h3>
 </div>
 </div>

 <p className="hidden sm:block text-[13px] text-slate-500">
 Giá đọc và ghi thẳng vào bảng <code>pitches</code> trong CSDL. Ca bắt đầu từ 17:00, 18:00 và
 19:00 được tính theo giá giờ vàng khi thanh toán.
 </p>

 <div className="space-y-3 sm:space-y-4 pt-2">
 {realPitches.length === 0 ? (
 <p className="text-[13px] text-slate-500 p-4 rounded-2xl bg-slate-50 border border-slate-200 ">
 Chưa có cụm sân nào trong CSDL.
 </p>
 ) : (
 realPitches.map((p: any) => {
 const draft = getPriceDraft(p);
 const saving = savingPriceId === String(p.id);
 return (
 <div
 key={String(p.id)}
 className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
 >
 <div className="flex items-center justify-between gap-3">
 <span className="font-extrabold text-sm text-slate-900 truncate">
 {p.name}
 </span>
 <span className="text-[13px] font-mono text-slate-500 shrink-0">
 {p.openTime ?? "—"} - {p.closeTime ?? "—"}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <label className="space-y-1">
 <span className="text-[13px] font-bold text-slate-500">
 Giá thường (đ/ca)
 </span>
 <input
 type="number"
 step={10000}
 value={draft.avg}
 onChange={(e) =>
 setPriceDraft({
 ...priceDraft,
 [String(p.id)]: { ...draft, avg: e.target.value },
 })
 }
 className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0369a1]"
 />
 </label>
 <label className="space-y-1">
 <span className="text-[13px] font-bold text-slate-500">
 Giá giờ vàng (đ/ca)
 </span>
 <input
 type="number"
 step={10000}
 value={draft.peak}
 onChange={(e) =>
 setPriceDraft({
 ...priceDraft,
 [String(p.id)]: { ...draft, peak: e.target.value },
 })
 }
 className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-[#0369a1]"
 />
 </label>
 </div>
 <button
 type="button"
 disabled={saving}
 onClick={() => savePitchPrice(p)}
 className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] shadow-md transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
 >
 {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
 {saving ? "Đang lưu..." : "Lưu giá sân"}
 </button>
 </div>
 );
 })
 )}
 </div>
 </div>

 <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
 <ShieldCheck className="w-5 h-5 text-emerald-500" />
 <h3 className="font-extrabold text-base text-slate-900 ">Tiền Cọc & Giữ Chỗ</h3>
 </div>

 <div className="space-y-3 sm:space-y-4 text-[13px]">
 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
 <span className="font-extrabold text-slate-900 block">
 Cọc khi đặt qua web / app: 50% giá ca
 </span>
 <p className="hidden sm:block text-[13px] text-slate-500">
 Màn thanh toán VietQR hiển thị số cọc = 50% giá ca đã chọn; phần còn lại thu tại quầy
 khi khách check-in.
 </p>
 </div>

 <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
 <span className="font-extrabold text-slate-900 block">
 Cọc đặt tại quầy: do chủ sân nhập
 </span>
 <p className="hidden sm:block text-[13px] text-slate-500">
 Khi đặt offline, số tiền cọc được nhập cùng đơn và hiển thị trong ma trận
 (đã cọc / còn phải thu).
 </p>
 </div>

 <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-1.5">
 <span className="font-extrabold text-amber-700 block">
 Khách không đến (no-show)
 </span>
 <p className="hidden sm:block text-[13px] text-slate-500">
 Hệ thống không tự động phạt cọc. Chủ sân đóng ca tại tab Ma trận với lý do
 “khách không đến”, phần cọc và phạt do hai bên tự thoả thuận ngoài hệ thống.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* --- SUB-TAB CONTENT 4: CANTEEN POS --- */}
 {activeSubTab === "canteen" && (
 <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-5">
 <div className="flex items-center justify-between border-b border-slate-100 pb-4">
 <div className="flex items-center space-x-2">
 <Coffee className="w-5 h-5 text-amber-700" />
 <h2 className="text-lg font-extrabold text-slate-900 ">
 Quản Lý Dịch Vụ Canteen & Cho Thuê Vật Tư Tại Quầy
 </h2>
 </div>
 <button
 onClick={() => showToast("🎉 Đã lưu tồn kho Canteen!")}
 className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-xs transition-all active:scale-95"
 >
 Lưu Kho Canteen
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
 {canteenItems.map((item) => (
 <div key={item.id} className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
 <div className="flex justify-between items-start">
 <span className="font-extrabold text-[13px] text-slate-900 ">{item.name}</span>
 <span className="font-mono font-black text-emerald-500 text-[13px]">{item.price.toLocaleString("vi-VN")}đ</span>
 </div>
 <div className="flex justify-between text-[13px] text-slate-500 font-mono">
 <span>Đã bán hôm nay: <strong className="text-slate-900 ">{item.soldToday}</strong></span>
 <span>Tồn kho: <strong className="text-[#0369a1]">{item.stock}</strong></span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* MODAL 0: SỬA HỒ SƠ CỤM SÂN (tên, địa chỉ, SĐT, bộ môn, tiện ích, ảnh, mô tả) */}
  {showEditInfoModal && (
  <div id="admin-inline-edit-info" className="w-full animate-fade-in">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 border border-slate-200 overflow-hidden">
  <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
  <div className="flex items-center gap-2.5">
  <Pencil className="w-5 h-5 text-[#0369a1]" />
  <h3 className="font-black text-lg text-slate-900">Sửa Hồ Sơ Cụm Sân</h3>
  </div>
  <button
  type="button"
  onClick={() => setShowEditInfoModal(false)}
  className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
  aria-label="Đóng"
  >
  <X className="w-5 h-5" />
  </button>
  </div>

  <p className="px-5 sm:px-6 pt-4 text-[13px] text-slate-500 leading-relaxed">
  Thông tin này hiển thị công khai cho cầu thủ khi tìm sân. Giá thuê và giờ mở cửa được sửa ở tab riêng.
  </p>

  <form onSubmit={handleSavePitchInfo} className="px-5 sm:px-6 py-4 space-y-3.5">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div className="space-y-1.5 sm:col-span-2">
  <label className="font-extrabold text-slate-800 text-sm">Tên cụm sân <span className="text-rose-500">*</span></label>
  <input
  type="text"
  value={infoName}
  onChange={(e) => setInfoName(e.target.value)}
  required
  placeholder="VD: Turfzone Đà Nẵng"
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
  />
  </div>

  <div className="space-y-1.5 sm:col-span-2">
  <label className="font-extrabold text-slate-800 text-sm">Địa chỉ <span className="text-rose-500">*</span></label>
  <input
  type="text"
  value={infoAddress}
  onChange={(e) => setInfoAddress(e.target.value)}
  required
  placeholder="VD: 123 Trần Phú, Hải Châu, Đà Nẵng"
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
  />
  </div>

  <div className="space-y-1.5">
  <label className="font-extrabold text-slate-800 text-sm">Khu vực</label>
  <input
  type="text"
  value={infoArea}
  onChange={(e) => setInfoArea(e.target.value)}
  placeholder="VD: Quận Hải Châu, Đà Nẵng"
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
  />
  </div>

  <div className="space-y-1.5">
  <label className="font-extrabold text-slate-800 text-sm">Số điện thoại</label>
  <input
  type="tel"
  value={infoPhone}
  onChange={(e) => setInfoPhone(e.target.value)}
  placeholder="VD: 0901234567"
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
  />
  </div>

  <div className="space-y-1.5 sm:col-span-2">
  <label className="font-extrabold text-slate-800 text-sm">Ảnh cụm sân (URL)</label>
  <input
  type="text"
  inputMode="url"
  value={infoImageUrl}
  onChange={(e) => setInfoImageUrl(e.target.value)}
  placeholder="https://images.unsplash.com/..."
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
  />
  </div>
  </div>

  {/* Bộ môn — chủ sân tự khai báo, không bịa sẵn */}
  <div className="space-y-2">
  <label className="font-extrabold text-slate-800 text-sm">Bộ môn thể thao</label>
  <div className="flex flex-wrap gap-2">
  {pitchTypeOptions.map((t) => (
  <button
  key={t}
  type="button"
  onClick={() => toggleInfoList(t, infoPitchTypes, setInfoPitchTypes)}
  className={`px-3 py-1.5 rounded-xl text-[13px] font-bold border transition-colors ${
  infoPitchTypes.includes(t)
  ? "bg-[#0369a1] text-white border-[#0369a1]"
  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
  }`}
  >
  {t}
  </button>
  ))}
  </div>
  </div>

  {/* Tiện ích */}
  <div className="space-y-2">
  <label className="font-extrabold text-slate-800 text-sm">Tiện ích đi kèm</label>
  <div className="flex flex-wrap gap-2">
  {amenityOptions.map((a) => (
  <button
  key={a}
  type="button"
  onClick={() => toggleInfoList(a, infoAmenities, setInfoAmenities)}
  className={`px-3 py-1.5 rounded-xl text-[13px] font-bold border transition-colors ${
  infoAmenities.includes(a)
  ? "bg-[#0369a1] text-white border-[#0369a1]"
  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
  }`}
  >
  {a}
  </button>
  ))}
  </div>
  </div>

  <div className="space-y-1.5">
  <label className="font-extrabold text-slate-800 text-sm">Mô tả cụm sân</label>
  <textarea
  value={infoDescription}
  onChange={(e) => setInfoDescription(e.target.value)}
  rows={3}
  placeholder="Mô tả chất lượng mặt cỏ, vị trí, chỗ để xe..."
  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm resize-y"
  />
  </div>

  <div className="flex gap-3 pt-2">
  <button
  type="button"
  onClick={() => setShowEditInfoModal(false)}
  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
  >
  Huỷ Bỏ
  </button>
  <button
  type="submit"
  disabled={isSavingInfo || !infoName.trim() || !infoAddress.trim()}
  className="flex-1 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
  {isSavingInfo ? "Đang lưu…" : "Lưu Hồ Sơ"}
  </button>
  </div>
  </form>
  </div>
  </div>
  )}

  {/* MODAL 1: ADD NEW PITCH (Thêm Sân Con Mới) */}
 {showAddPitchModal && (
  <div id="admin-inline-add-pitch" className="w-full animate-fade-in">
 <div 
 className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl max-w-md w-full border border-slate-200 space-y-3 sm:space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
 <div className="flex items-center space-x-2.5">
 <Plus className="w-5.5 h-5.5 text-[#0b4f6c] " />
 <h3 className="font-black text-lg text-slate-900 ">Thêm Sân Con Mới Vào Cụm</h3>
 </div>
 <button 
 type="button"
 onClick={() => setShowAddPitchModal(false)} 
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleCreateNewPitch} className="space-y-3 sm:space-y-4 text-sm">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Tên Sân Con Mới:</label>
 <input
 type="text"
 required
 value={newPitchName}
 onChange={(e) => setNewPitchName(e.target.value)}
 placeholder="VD: Sân 7C Cỏ Nhân Tạo Mới"
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Loại Sân Thể Thao:</label>
 <select
 value={newPitchType}
 onChange={(e) => setNewPitchType(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
 >
 <option value="Sân 7 Người">Sân 7 Người (Cỏ Nhân Tạo Chuẩn VFF)</option>
 <option value="Sân 5 Người">Sân 5 Người (Mini Cỏ / Futsal)</option>
 <option value="Sân 11 Người">Sân 11 Người (Tiêu Chuẩn FIFA)</option>
 </select>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Giá Giờ Thường (VNĐ):</label>
 <input
 type="number"
 value={newPitchBasePrice}
 onChange={(e) => setNewPitchBasePrice(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Giá Giờ Vàng (VNĐ):</label>
 <input
 type="number"
 value={newPitchPeakPrice}
 onChange={(e) => setNewPitchPeakPrice(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>
 </div>

 <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
 <div className="space-y-0.5">
 <span className="text-[13px] font-bold text-indigo-700 block">
 Giờ hoạt động cụm: {operatingOpenTime} - {operatingCloseTime}
 </span>
 <span className="text-[13px] text-slate-500">
 Độ dài ca: {operatingSlotDuration} phút/ca (Áp dụng {availableTimeSlots.length} ca tự động)
 </span>
 </div>
 <button
 type="button"
 onClick={() => {
 setShowAddPitchModal(false);
 setShowHoursModal(true);
 }}
 className="px-3.5 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-sm transition-colors shrink-0 shadow-xs"
 >
 Đổi Giờ
 </button>
 </div>

 <div className="flex space-x-2 pt-2">
 <button
 type="button"
 onClick={() => setShowAddPitchModal(false)}
 className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Hủy
 </button>
 <button
 type="submit"
 className="flex-1 py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-md transition-colors"
 >
 Tạo Sân Mới
 </button>
 </div>
 </form>
 </div>
  </div>
  )}

 {/* MODAL 2: CREATE OFFLINE BOOKING FOR WALK-IN CUSTOMERS */}
 {showOfflineModal && (
  <div id="admin-inline-offline" className="w-full animate-fade-in">
 <div 
 className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl max-w-md w-full border border-slate-200 space-y-3 sm:space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
 <div className="flex items-center space-x-2.5">
 <Plus className="w-5.5 h-5.5 text-emerald-500" />
 <h3 className="font-black text-lg text-slate-900 ">Tạo Đơn Tại Quầy</h3>
 </div>
 <button 
 type="button"
 onClick={() => setShowOfflineModal(false)} 
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleOfflineBookingSubmit} className="space-y-3 sm:space-y-4 text-sm">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 flex items-center justify-between">
 <span>Ngày Thi Đấu:</span>
 <span className="text-[13px] text-sky-700 font-bold">
 {upcomingDays.find(d => d.iso === offlineDate)?.label || offlineDate}
 </span>
 </label>
 <div className="flex items-center space-x-2">
 <select
 value={offlineDate}
 onChange={(e) => setOfflineDate(e.target.value)}
 className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
 >
 {upcomingDays.map(d => (
 <option key={d.iso} value={d.iso}>
 {d.label} ({d.dateFormatted}) - {d.dayOfWeek}
 </option>
 ))}
 </select>
 <input
 type="date"
 value={offlineDate}
 onChange={(e) => {
 if (e.target.value) setOfflineDate(e.target.value);
 }}
 className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 text-[13px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Chọn Sân Con:</label>
 <select
 value={offlinePitchId}
 onChange={(e) => setOfflinePitchId(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
 >
 {pitchMatrix.map(p => (
 <option key={p.pitchId} value={p.pitchId}>{pitchTypeLabel(p.pitchName) || p.pitchName}</option>
 ))}
 </select>
 </div>

  <div className="rounded-xl bg-sky-50 border border-sky-200 px-3 py-2.5">
  <span className="text-[13px] font-extrabold text-sky-900 flex items-center gap-1.5">
  <Clock className="w-3.5 h-3.5 text-sky-700" />
  Thời lượng ca: <strong className="font-black">2 tiếng (120 phút)</strong> — cố định
  </span>
  </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Khung Giờ Đặt:</label>
 <select
 value={offlineTime}
 onChange={(e) => setOfflineTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm cursor-pointer"
 >
 {offlineAvailableSlots.map((slot) => (
 <option key={slot} value={slot}>
 {slot}
 </option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Tên Khách Đặt:</label>
 <input
 type="text"
 required
 value={offlineCustomer}
 onChange={(e) => setOfflineCustomer(e.target.value)}
 placeholder="VD: Anh Cường FC Hải Châu"
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Số Điện Thoại Khách:</label>
 <input
 type="text"
 required
 value={offlinePhone}
 onChange={(e) => setOfflinePhone(e.target.value)}
 placeholder="VD: 0914 555 789"
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] text-sm"
 />
 </div>

 <div className="space-y-1.5 pt-1">
 <label className="font-extrabold text-slate-800 ">Hình Thức Đặt Cọc:</label>
 <div className="grid grid-cols-2 gap-2.5">
 <button
 type="button"
 onClick={() => setOfflineDepositType("PAID_CASH")}
 className={`p-3.5 rounded-xl font-bold border transition-all text-sm ${
 offlineDepositType === "PAID_CASH"
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-xs"
 : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
 }`}
 >
 Đã Thu Cọc Mặt Quầy (50%)
 </button>
 <button
 type="button"
 onClick={() => setOfflineDepositType("TRUST")}
 className={`p-3.5 rounded-xl font-bold border transition-all text-sm ${
 offlineDepositType === "TRUST"
 ? "bg-amber-500 text-white border-amber-500 shadow-xs"
 : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
 }`}
 >
 Chưa Cọc (Khách Quen Tin Tưởng)
 </button>
 </div>
 </div>

 <div className="flex space-x-2 pt-2">
 <button
 type="button"
 onClick={() => setShowOfflineModal(false)}
 className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Hủy
 </button>
 <button
 type="submit"
 className="flex-1 py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-colors"
 >
 Xác Nhận Giữ Ca
 </button>
 </div>
 </form>
 </div>
  </div>
  )}

 {/* MODAL 3: CHECK-IN & NO-SHOW MANAGEMENT ACTION */}
 {selectedSlotForAction && (
  <div id="admin-inline-slot-action" className="w-full animate-fade-in">
 <div 
 className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl max-w-md w-full border border-slate-200 space-y-3 sm:space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
 <div className="flex items-center space-x-2.5">
 <QrCode className="w-5.5 h-5.5 text-[#0369a1]" />
 <h3 className="font-black text-lg text-slate-900 ">Chi Tiết & Check-in Ca Đặt</h3>
 </div>
 <button 
 type="button"
 onClick={() => setSelectedSlotForAction(null)} 
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="space-y-3.5 text-sm">
 <div className="p-4 rounded-2xl bg-slate-50 space-y-2.5 border border-slate-200/60 ">
 <div className="flex justify-between items-center">
 <span className="text-slate-500">Khách đặt:</span>
 <strong className="text-slate-900 font-black text-sm">{selectedSlotForAction.customer}</strong>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-slate-500">Số điện thoại:</span>
 <strong className="font-mono text-slate-900 font-bold">{selectedSlotForAction.phone}</strong>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-slate-500">Khung giờ:</span>
 <strong className="font-mono text-emerald-500 font-black text-sm">{selectedSlotForAction.time}</strong>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-slate-500">Mã vé check-in:</span>
 <strong className="font-mono text-[#0369a1] font-extrabold text-sm">{selectedSlotForAction.code}</strong>
 </div>
 </div>

 <div className="p-4 rounded-2xl bg-[#0369a1]/10 border border-[#0369a1]/20 space-y-2">
 <div className="flex justify-between items-center text-sm font-bold text-slate-900 ">
 <span>Tiền cọc đã thu:</span>
 <span className="font-mono text-sky-700 font-black text-base">{selectedSlotForAction.depositPaid}</span>
 </div>
 <div className="flex justify-between items-center text-sm font-bold text-slate-900 ">
 <span>Tiền còn lại thu tại quầy:</span>
 <span className="font-mono text-rose-600 text-base font-black">{selectedSlotForAction.cashDue}</span>
 </div>
 </div>
 </div>

 <div className="space-y-2.5 pt-2">
 {selectedSlotForAction.status === "booked" && (
 <button
 type="button"
 onClick={() => handleConfirmCheckin(selectedSlotForAction)}
 className="w-full py-3.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95"
 >
 <UserCheck className="w-5 h-5" />
 <span>Xác Nhận Check-in Vào Sân & Mở Đèn</span>
 </button>
 )}

 <button
 type="button"
 onClick={() => handleCancelBooking(selectedSlotForAction)}
 className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-bold text-sm border border-rose-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
 >
 <Trash2 className="w-4 h-4" />
 <span>Hủy Đơn Đặt Này (Trả Về Ca Trống)</span>
 </button>
 </div>
 </div>
  </div>
  )}

 {/* MODAL 4: CÀI ĐẶT THỜI GIAN HOẠT ĐỘNG & THỜI LƯỢNG CA SÂN */}
 {showHoursModal && (
  <div id="admin-inline-hours" className="w-full animate-fade-in">
 <div 
 className="bg-white p-4 sm:p-7 rounded-2xl sm:rounded-3xl max-w-md w-full border border-slate-200 space-y-3 sm:space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
 <div className="flex items-center space-x-2.5">
 <Clock className="w-5.5 h-5.5 text-indigo-500" />
 <h3 className="font-black text-lg text-slate-900 ">Cấu Hình Giờ Hoạt Động Cụm Sân</h3>
 </div>
 <button 
 type="button"
 onClick={() => setShowHoursModal(false)} 
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <p className="text-sm text-slate-600 leading-relaxed">
  Chủ sân thiết lập thời gian bắt đầu mở cửa và đóng cửa cụm sân. Mọi ca thi đấu đều dùng chung thời lượng <strong className="text-sky-700 font-bold">2 tiếng (120 phút)</strong>.
 </p>

 <form onSubmit={handleUpdateOperatingHours} className="space-y-3 sm:space-y-4 text-sm">
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Giờ Bắt Đầu Mở Cửa:</label>
 <select
 value={operatingOpenTime}
 onChange={(e) => setOperatingOpenTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
 >
 {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-800 ">Giờ Kết Thúc Đóng Cửa:</label>
 <select
 value={operatingCloseTime}
 onChange={(e) => setOperatingCloseTime(e.target.value)}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
 >
 {["20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "24:00"].map((t) => (
 <option key={t} value={t}>{t}</option>
 ))}
 </select>
 </div>
 </div>

 {/* Thông báo cơ chế đặt linh hoạt theo yêu cầu người dùng */}
 <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 space-y-1.5">
 <div className="flex items-center space-x-2 text-sky-800 font-extrabold text-[13px]">
 <Sparkles className="w-4 h-4 text-emerald-500" />
 <span>Cơ Chế Đặt Sân Linh Hoạt</span>
 </div>
 <p className="text-[13px] text-slate-600 leading-relaxed">
  Mọi ca thi đấu dùng chung thời lượng <strong className="text-slate-900 font-bold">2 tiếng (120 phút)</strong>. Hệ thống tự động tính tiền và phân ca theo thời gian thực tế.
 </p>
 </div>

 <div className="flex space-x-2.5 pt-2">
 <button
 type="button"
 onClick={() => setShowHoursModal(false)}
 className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Đóng
 </button>
 <button
 type="submit"
 disabled={isUpdatingHours}
 className="flex-1 py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
 >
 {isUpdatingHours && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}
 <span>Lưu Giờ Hoạt Động Sân</span>
 </button>
 </div>
 </form>
 </div>
  </div>
  )}
 {/* MODAL HỦY CA ĐẶT SÂN KÈM LÝ DO THÔNG BÁO TỚI KHÁCH HÀNG */}
 {showCancelModal && (
 <div 
  id="admin-inline-cancel" className="w-full animate-fade-in"
  >
 <div 
 className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-pop my-auto"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
 <Trash2 className="w-5 h-5 text-rose-600 " />
 </div>
 <div>
 <h3 className="font-extrabold text-base text-rose-700 ">Xác Nhận Hủy Ca Đặt Sân</h3>
 <p className="text-[13px] text-rose-600 font-medium mt-0.5">
 Ca: <strong>{slotToCancel?.time || slotToCancel?.timeSlot || "Không rõ"}</strong> &bull; Khách: <strong>{slotToCancel?.customer || "Không rõ"}</strong>
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => {
 setShowCancelModal(false);
 setSlotToCancel(null);
 setCancelReasonInput("");
 }}
 className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-rose-100/50 transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="px-6 py-5 space-y-3 sm:space-y-4">
 <div>
 <label className="block text-[13px] font-extrabold text-slate-800 mb-2">
 Lý Do Hủy Ca <span className="text-rose-600">*</span>
 </label>

 {/* Preset reasons */}
 <div className="flex flex-wrap gap-1.5 mb-3">
 {[
 "Sân bị hư hỏng cần sửa chữa",
 "Sự kiện đặc biệt tại cụm sân",
 "Lỗi hệ thống đặt trùng giờ",
 "Điều kiện thời tiết xấu"
 ].map(reason => (
 <button
 key={reason}
 type="button"
 onClick={() => setCancelReasonInput(reason)}
 className={`px-2.5 py-1 rounded-lg text-[13px] font-bold transition-all border ${
 cancelReasonInput === reason
 ? "bg-rose-600 text-white border-rose-600 shadow-sm"
 : "bg-slate-100 text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600"
 }`}
 >
 {reason}
 </button>
 ))}
 </div>

 <textarea
 value={cancelReasonInput}
 onChange={(e) => setCancelReasonInput(e.target.value)}
 placeholder="Hoặc nhập lý do cụ thể... (bắt buộc)"
 rows={3}
 className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
 />
 </div>

 <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2">
 <span className="text-sm shrink-0">⚠️</span>
 <p className="text-[13px] text-amber-700 font-medium leading-relaxed">
 Lý do hủy sẽ được gửi ngay tới thông báo của khách hàng. Khung giờ này sẽ mở lại cho người đặt mới.
 </p>
 </div>
 </div>

 {/* Footer */}
 <div className="px-6 py-4 border-t border-slate-100 flex space-x-3">
 <button
 type="button"
 onClick={() => {
 setShowCancelModal(false);
 if (slotToCancel) {
 setSelectedSlotForAction(slotToCancel);
 }
 setSlotToCancel(null);
 setCancelReasonInput("");
 }}
 className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
 >
 Quay Lại
 </button>
 <button
 type="button"
 onClick={handleConfirmCancel}
 disabled={!cancelReasonInput.trim()}
 className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center space-x-1.5"
 >
 <Trash2 className="w-4 h-4" />
 <span>Xác Nhận Hủy Ca</span>
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

