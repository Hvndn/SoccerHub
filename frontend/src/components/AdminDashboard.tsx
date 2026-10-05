"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { apiRequest } from "@/lib/api";
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
  Activity
} from "lucide-react";

interface AdminDashboardProps {
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function AdminDashboard({ onBackToHome, onNavigateTab }: AdminDashboardProps = {}) {
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

  const [activeSubTab, setActiveSubTab] = useState<"matrix" | "pitches" | "pricing" | "canteen">("matrix");
  const [matrixFilterStatus, setMatrixFilterStatus] = useState<string>("ALL");
  const [matrixFilterType, setMatrixFilterType] = useState<string>("ALL");
  const [matrixFilterTime, setMatrixFilterTime] = useState<string>("ALL");
  const [matrixFilterMethod, setMatrixFilterMethod] = useState<string>("ALL");

  // Dynamic pricing controls
  const [peakHourMultiplier, setPeakHourMultiplier] = useState(1.2);
  const [autoPricing, setAutoPricing] = useState(true);
  const [depositRate, setDepositRate] = useState("50%");
  
  // Real-time notification banner
  const [notification, setNotification] = useState<string | null>(null);

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

  // Operating Hours & Slot Duration State (Đăng ký giờ hoạt động linh hoạt)
  const [operatingOpenTime, setOperatingOpenTime] = useState("13:00");
  const [operatingCloseTime, setOperatingCloseTime] = useState("22:30");
  const [operatingSlotDuration, setOperatingSlotDuration] = useState<number>(90); // 60, 90, 120 phút
  const [isUpdatingHours, setIsUpdatingHours] = useState(false);

  // New Pitch Form state
  const [newPitchName, setNewPitchName] = useState("");
  const [newPitchType, setNewPitchType] = useState("Sân 7 Người");
  const [newPitchBasePrice, setNewPitchBasePrice] = useState("450000");
  const [newPitchPeakPrice, setNewPitchPeakPrice] = useState("600000");

  // Offline Booking Form State
  const [offlinePitchId, setOfflinePitchId] = useState("");
  const [offlineTime, setOfflineTime] = useState("17:30 - 19:00");
  const [offlineCustomer, setOfflineCustomer] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineDepositType, setOfflineDepositType] = useState<"PAID_CASH" | "TRUST">("PAID_CASH");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch real pitch data from backend API
  useEffect(() => {
    setMounted(true);
    fetchRealData();
  }, []);

  const loadMatrixAndStats = async (pitchId: number | string) => {
    try {
      const [matrixRes, statsRes] = await Promise.all([
        apiRequest<any[]>(`/api/v1/pitches/${pitchId}/matrix`),
        apiRequest<any>(`/api/v1/pitches/${pitchId}/stats`)
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
      const price = isPeak ? (targetCourt?.peakPrice || 600000) : (targetCourt?.basePrice || 350000);
      const deposit = offlineDepositType === "PAID_CASH" ? Math.round(price / 2) : 0;

      await apiRequest(`/api/v1/pitches/${currentId}/book-offline`, {
        method: 'POST',
        body: JSON.stringify({
          courtName: targetCourt ? targetCourt.pitchName : offlinePitchId,
          courtType: targetCourt ? targetCourt.type : "Sân 7",
          timeSlot: offlineTime,
          customerName: offlineCustomer.trim(),
          customerPhone: offlinePhone.trim(),
          totalPrice: price,
          depositPaid: deposit,
          via: offlineDepositType === "PAID_CASH" ? "Tạo Tại Quầy (Đã Cọc)" : "Tạo Tại Quầy (Giữ Ca)"
        })
      });

      await loadMatrixAndStats(currentId);
      setShowOfflineModal(false);
      setOfflineCustomer("");
      setOfflinePhone("");
      showToast(`✅ Đã đặt ca thành công cho khách [${offlineCustomer}] và lưu vào database!`);
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
        return;
      } catch (err: any) {
        showToast(`❌ Lỗi check-in: ${err.message}`);
      }
    } else {
      setSelectedSlotForAction(null);
      showToast("⚽ Đã ghi nhận khách vào sân!");
    }
  };

  // Cancel Booking (Xóa thật khỏi MySQL)
  const handleCancelBooking = async (slot: any) => {
    if (!slot) return;
    if (slot.bookingId) {
      try {
        await apiRequest(`/api/v1/pitches/bookings/${slot.bookingId}`, { method: "DELETE" });
        await loadMatrixAndStats(activePitch?.id || 1);
        setSelectedSlotForAction(null);
        showToast("🗑️ Đã hủy ca đặt thành công. Khung giờ đã sẵn sàng cho khách khác.");
        return;
      } catch (err: any) {
        showToast(`❌ Lỗi hủy ca: ${err.message}`);
      }
    } else {
      setSelectedSlotForAction(null);
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
      const startMin = parseMinutes(operatingOpenTime || "13:00");
      const endMin = parseMinutes(operatingCloseTime || "22:30");
      const duration = Number(operatingSlotDuration) || 90;
      const slots: string[] = [];
      let current = startMin;
      while (current + duration <= endMin) {
        slots.push(`${formatTime(current)} - ${formatTime(current + duration)}`);
        current += duration;
      }
      return slots.length > 0 ? slots : ["16:00 - 17:30", "17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"];
    } catch {
      return ["16:00 - 17:30", "17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"];
    }
  }, [operatingOpenTime, operatingCloseTime, operatingSlotDuration]);

  // Danh sách các khung giờ thực tế (lấy từ dữ liệu ma trận hoặc từ cấu hình giờ hoạt động)
  const matrixSlots = Array.from(
    new Set(pitchMatrix.flatMap(p => (p.slots || []).map((s: any) => s.time)))
  ).filter(Boolean);

  const availableTimeSlots: string[] = matrixSlots.length > 0 ? matrixSlots : computedFallbackSlots;

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
    <div className="space-y-8 animate-fade-in-up pb-16">
      {/* Toast Feedback Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Real-time Order Notification Banner */}
      {notification && (
        <div className="bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 px-5 py-3 rounded-2xl shadow-lg border border-sky-400/30 flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-3 text-xs font-bold">
            <Bell className="w-4 h-4 animate-bounce text-amber-300 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white dark:text-slate-950/80 dark:hover:text-slate-950 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER BANNER WITH REAL BACKEND DATA */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0b4f6c]/10 dark:bg-sky-500/10 border border-[#0b4f6c]/20 dark:border-sky-400/20 text-[#0b4f6c] dark:text-sky-400 text-sm font-bold mb-2">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>
                {activePitch 
                  ? `${activePitch.name.toUpperCase()} — HỆ THỐNG ĐIỀU HÀNH CHỦ SÂN PRO` 
                  : "HỆ THỐNG ĐIỀU HÀNH CHỦ SÂN BÓNG ĐÁ SOCCERHUB PRO"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>{activePitch ? activePitch.name : "Trung Tâm Quản Lý Cụm Sân & Doanh Thu"}</span>
              {isLoadingBackend && <RefreshCw className="w-5 h-5 text-sky-500 animate-spin" />}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{activePitch?.address || "Số 154 Nguyễn Lương Bằng, Tp. Đà Nẵng"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Hotline: <strong className="text-slate-800 dark:text-slate-200">{activePitch?.phone || "0988 776 652"}</strong></span>
              </span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Chủ sân: {activePitch?.ownerName || "Hồ Văn Diện"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {realPitches.length > 1 && (
              <select
                value={activePitch?.id || ""}
                onChange={(e) => {
                  const p = realPitches.find(x => x.id.toString() === e.target.value);
                  if (p) handleSelectPitch(p);
                }}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
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
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBackend ? 'animate-spin text-sky-500' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowHoursModal(true)}
              className="px-4.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm sm:text-base shadow-xs transition-all active:scale-95 flex items-center space-x-2"
              title="Cài đặt thời gian mở/đóng cửa và thời lượng ca sân (1h, 1.5h, 2h)"
            >
              <Clock className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
              <span>Giờ Mở Sân: {operatingOpenTime} - {operatingCloseTime} ({operatingSlotDuration}p/ca)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddPitchModal(true)}
              className="px-4.5 py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#07384d] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-black text-sm sm:text-base shadow-md transition-all active:scale-95 flex items-center space-x-2"
            >
              <Plus className="w-4.5 h-4.5 shrink-0" />
              <span>+ Thêm Sân Con Mới</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOfflineModal(true)}
              className="px-4.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm sm:text-base shadow-md transition-all active:scale-95 flex items-center space-x-2"
            >
              <PhoneCall className="w-4.5 h-4.5 shrink-0" />
              <span>+ Tạo Đặt Ca Tại Quầy</span>
            </button>
          </div>
        </div>

        {/* SUB TAB NAVIGATION TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab("matrix")}
            className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "matrix"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <BarChart2 className="w-5 h-5 shrink-0" />
            <span>Sơ Đồ Ca Sân Live Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pitches")}
            className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "pitches"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Building className="w-5 h-5 shrink-0" />
            <span>Danh Sách Sân Con ({pitchMatrix.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pricing")}
            className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "pricing"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Sliders className="w-5 h-5 text-amber-400 shrink-0" />
            <span>AI Dynamic Pricing & Giờ Vàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("canteen")}
            className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "canteen"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Coffee className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Quản Lý Canteen & Vật Tư</span>
          </button>
        </div>
      </div>

      {/* TOP KPI OVERVIEW CARDS (REAL-TIME LIVE DATA FROM MYSQL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Doanh Thu Hôm Nay</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">
            {(pitchStats.totalRevenue || 0).toLocaleString("vi-VN")} VNĐ
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1 shrink-0" /> Online {pitchStats.onlineBookings} ca • Quầy {pitchStats.counterBookings} ca
          </span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Tỷ Lệ Lấp Đầy Ca Sân</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {pitchStats.occupancyRate}%
          </div>
          <span className="text-xs font-bold text-emerald-500">
            Khóa {pitchStats.bookedSlots} / {pitchStats.totalSlots} ca đặt
          </span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Đơn Cọc VietQR Online</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-500 font-mono">
            {pitchStats.onlineBookings} Ca Online
          </div>
          <span className="text-xs font-bold text-slate-500">Tự động giữ slot qua VietQR Napas247</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider block">Khách Vãng Lai Tại Quầy</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
            {pitchStats.counterBookings} Ca Trực Tiếp
          </div>
          <span className="text-xs font-bold text-amber-500">Khóa lịch ca tức thì trên toàn sàn</span>
        </div>
      </div>

      {/* QUICK SEARCH & CHECK-IN TOOLBAR */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-[#0b4f6c]/10 dark:bg-sky-500/20 text-[#0b4f6c] dark:text-sky-300 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-black text-slate-900 dark:text-white block">Tra Cứu Mã Vé & Check-in Tiếp Nhận</span>
            <span className="text-xs text-slate-400">Nhập mã vé đặt cọc hoặc Số Điện Thoại khách để check-in mở đèn</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchCodeInput}
              onChange={(e) => setSearchCodeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchBooking(); }}
              placeholder="VD: VS-1-7102 hoặc SĐT khách..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={handleSearchBooking}
            className="px-6 py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 text-sm sm:text-base font-black shadow-sm shrink-0 hover:opacity-90 active:scale-95 transition-all"
          >
            Tra Cứu
          </button>
        </div>
      </div>

      {/* --- SUB-TAB CONTENT 1: LIVE MATRIX VIEW --- */}
      {activeSubTab === "matrix" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5 shrink-0">
                <BarChart2 className="w-5.5 h-5.5 text-[#0b4f6c] dark:text-sky-400" />
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Sơ Đồ Ca Sân Thời Gian Thực (Owner Live Grid Matrix)
                  </h2>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Cấu hình giờ: <strong className="font-mono text-indigo-500 text-sm font-bold">{operatingOpenTime} - {operatingCloseTime}</strong> ({operatingSlotDuration} phút/ca • {availableTimeSlots.length} ca hoạt động)
                  </span>
                </div>
              </div>

              {/* BỘ LỌC DẠNG 4 DROPDOWN TIỆN LỢI ĐỂ KIỂM TRA */}
              <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                {/* 1. DROPDOWN TRẠNG THÁI CA */}
                <div className="flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm">
                  <span className="text-slate-600 dark:text-slate-300 pl-2.5 text-sm font-bold">Trạng thái:</span>
                  <select
                    value={matrixFilterStatus}
                    onChange={(e) => setMatrixFilterStatus(e.target.value)}
                    className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] dark:focus:ring-sky-500 cursor-pointer shadow-xs"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="BOOKED">🟢 Đã Cọc (CONFIRMED)</option>
                    <option value="PLAYING">🔴 Đang Đá (IN_USE)</option>
                    <option value="EMPTY">⚪ Ca Trống (AVAILABLE)</option>
                    <option value="RESALE">🟡 Sàn Nhượng Gấp</option>
                  </select>
                </div>

                {/* 2. DROPDOWN LOẠI SÂN */}
                <div className="flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm">
                  <span className="text-slate-600 dark:text-slate-300 pl-2.5 text-sm font-bold">Loại sân:</span>
                  <select
                    value={matrixFilterType}
                    onChange={(e) => setMatrixFilterType(e.target.value)}
                    className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] dark:focus:ring-sky-500 cursor-pointer shadow-xs"
                  >
                    <option value="ALL">Tất cả loại sân</option>
                    <option value="Sân 5">Sân 5 Người</option>
                    <option value="Sân 7">Sân 7 Người</option>
                    <option value="Sân 11">Sân 11 Tiêu Chuẩn</option>
                  </select>
                </div>

                {/* 3. DROPDOWN KHUNG GIỜ / CA SÂN */}
                <div className="flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm">
                  <span className="text-slate-600 dark:text-slate-300 pl-2.5 text-sm font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Khung giờ:</span>
                  </span>
                  <select
                    value={matrixFilterTime}
                    onChange={(e) => setMatrixFilterTime(e.target.value)}
                    className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono cursor-pointer shadow-xs"
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
                <div className="flex items-center space-x-2 bg-slate-100/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm">
                  <span className="text-slate-600 dark:text-slate-300 pl-2.5 text-sm font-bold flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Hình thức:</span>
                  </span>
                  <select
                    value={matrixFilterMethod}
                    onChange={(e) => setMatrixFilterMethod(e.target.value)}
                    className="bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                  >
                    <option value="ALL">Tất cả hình thức</option>
                    <option value="ONLINE">📱 VietQR Napas247 Online</option>
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
                    className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-sm font-bold flex items-center space-x-1.5 transition-all active:scale-95"
                    title="Đặt lại tất cả các bộ lọc về mặc định"
                  >
                    <X className="w-4 h-4" />
                    <span>Đặt Lại</span>
                  </button>
                )}
              </div>
            </div>

            {/* COLOR CODES LEGEND */}
            <div className="flex flex-wrap items-center gap-5 text-sm font-bold pt-1">
              <span className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-xs shrink-0" />
                <span>Đã Cọc (CONFIRMED)</span>
              </span>
              <span className="flex items-center space-x-2 text-rose-500">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-xs shrink-0" />
                <span>Đã Check-in Đá (IN_USE)</span>
              </span>
              <span className="flex items-center space-x-2 text-amber-500">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-xs shrink-0" />
                <span>Sàn Nhượng Ca Gấp</span>
              </span>
              <span className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                <span>Ca Trống (AVAILABLE)</span>
              </span>
            </div>

            {/* PITCH MATRIX GRID */}
            <div className="space-y-4 pt-2">
              {filteredMatrix.map((pitch) => (
                <div key={pitch.pitchId} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2.5">
                      <span className="font-black text-slate-900 dark:text-white text-base">{pitch.pitchName}</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
                        {pitch.type}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Giá cơ bản: <strong className="text-slate-900 dark:text-white font-bold text-sm">{(pitch.basePrice/1000).toFixed(0)}k/ca</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    {pitch.slots.length === 0 ? (
                      <div className="col-span-full py-8 text-center text-sm text-slate-400 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                        <span>Không có ca đá nào phù hợp với bộ lọc khung giờ / hình thức đã chọn.</span>
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
                          className={`p-4 rounded-2xl border space-y-2 transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${
                            slot.status === "playing"
                              ? "bg-rose-500/10 border-rose-400 text-rose-600 dark:text-rose-400 font-bold"
                              : slot.status === "booked"
                              ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold"
                              : slot.status === "resale"
                              ? "bg-amber-500/10 border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50/20"
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs font-mono">
                            <span className="font-extrabold text-sm">{slot.time}</span>
                            <span className="font-black text-sm">{slot.price}</span>
                          </div>
                          
                          <p className={`font-black truncate text-sm ${slot.status === "empty" ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                            {slot.customer}
                          </p>
                          
                          <div className="text-xs space-y-1 opacity-90 font-mono">
                            <span className="block text-slate-500">Cọc: <strong className={slot.status === "empty" ? "text-slate-400" : "text-emerald-600 dark:text-emerald-400 font-bold"}>{slot.depositPaid}</strong></span>
                            {slot.status === "booked" && (
                              <span className="block text-rose-500 font-bold">Thu tại quầy: <strong>{slot.cashDue}</strong></span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                            <span className="truncate font-semibold">{slot.via}</span>
                            <ChevronRight className="w-4 h-4 shrink-0" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB CONTENT 2: PITCH INVENTORY & MANAGEMENT --- */}
      {activeSubTab === "pitches" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
                  <Building className="w-5.5 h-5.5 text-[#0b4f6c] dark:text-sky-400" />
                  <span>Danh Sách Sân Con Trong Cụm ({pitchMatrix.length} Sân)</span>
                </h2>
                <p className="text-sm text-slate-400 font-medium mt-1">
                  Quản lý giá thuê, tình trạng sân và tiện ích cho từng sân con trong trung tâm thể thao.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPitchModal(true)}
                className="px-4.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition-all flex items-center space-x-2 active:scale-95"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>+ Thêm Sân Con Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pitchMatrix.map((pitch) => (
                <div key={pitch.pitchId} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">{pitch.pitchName}</h3>
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 text-xs font-mono font-bold">
                          {pitch.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium mt-0.5 block">Mã sân: {pitch.pitchId}</span>
                    </div>

                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                      ĐANG HOẠT ĐỘNG
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm font-mono p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-xs font-semibold">GIÁ GIỜ THƯỜNG</span>
                      <strong className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">{pitch.basePrice.toLocaleString("vi-VN")} đ/ca</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs font-semibold">GIÁ GIỜ VÀNG (+20%)</span>
                      <strong className="text-amber-500 font-black text-sm sm:text-base">{pitch.peakPrice.toLocaleString("vi-VN")} đ/ca</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className="text-slate-400 text-xs sm:text-sm">Tiện ích: Đèn LED 500W, Cỏ FIFA, Wifi 6, Nước uống</span>
                    <button
                      onClick={() => showToast(`⚙️ Đã mở bảng chỉnh sửa giá cho [${pitch.pitchName}]`)}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-2xs"
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

      {/* --- SUB-TAB CONTENT 3: AI DYNAMIC PRICING --- */}
      {activeSubTab === "pricing" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Dynamic Pricing Manager</h3>
              </div>
              <button
                type="button"
                onClick={() => setAutoPricing(!autoPricing)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-mono font-bold transition-all shadow-xs ${
                  autoPricing ? "bg-emerald-500 text-white" : "bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {autoPricing ? "TỰ ĐỘNG AI: BẬT" : "TỰ ĐỘNG AI: TẮT"}
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hệ thống AI tự động điều chỉnh giá theo nhu cầu thời gian thực: Tăng giá giờ vàng khung 17:30 - 20:30 khi lấp đầy trên 90% và giảm giá kích cầu giờ vắng.
            </p>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                  <span>Hệ Số Tăng Giá Giờ Vàng (Peak Multiplier):</span>
                  <span className="text-[#0b4f6c] dark:text-sky-400 font-mono font-black text-sm">x{peakHourMultiplier}</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.5"
                  step="0.05"
                  value={peakHourMultiplier}
                  onChange={(e) => setPeakHourMultiplier(Number(e.target.value))}
                  className="w-full accent-[#0b4f6c] dark:accent-sky-400 cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/20 space-y-2 text-xs">
                <div className="flex justify-between font-extrabold text-amber-600 dark:text-amber-400">
                  <span className="flex items-center space-x-1">
                    <Sun className="w-4 h-4" />
                    <span>Dự Đoán Nhu Cầu Tối Nay:</span>
                  </span>
                  <span>98% Lấp Đầy</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  AI gợi ý duy trì hệ số x1.2 cho Sân 7A & Sân 7B. Doanh thu ước tính tăng thêm +2.4M VNĐ.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showToast("Đã cập nhật cấu hình thuật toán giá AI thành công!")}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white font-black text-xs shadow-md"
              >
                Áp Dụng Cấu Hình AI
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Quy Tắc Đặt Cọc & Giữ Chỗ</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 dark:text-white block">Tỷ Lệ Tiền Cọc Bắt Buộc Khi Đặt Web/App:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositRate("30%")}
                    className={`p-3 rounded-xl font-extrabold border transition-all ${
                      depositRate === "30%"
                        ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-sky-400"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    30% Cọc Tối Thiểu
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositRate("50%")}
                    className={`p-3 rounded-xl font-extrabold border transition-all ${
                      depositRate === "50%"
                        ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-sky-400"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    50% Cọc Tối Thiểu
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-extrabold text-slate-900 dark:text-white block">Quy Tắc Tịch Thu Cọc Khi No-Show:</span>
                <p className="text-[11px] text-slate-500">
                  Nếu đội đặt sân không check-in quá 15 phút sau giờ bắt đầu ca mà không báo trước, hệ thống tự động tịch thu 100% tiền cọc và đẩy ca lên Sàn Nhượng Gấp với giá giảm 30%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUB-TAB CONTENT 4: CANTEEN POS --- */}
      {activeSubTab === "canteen" && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Coffee className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Quản Lý Dịch Vụ Canteen & Cho Thuê Vật Tư Tại Quầy
              </h2>
            </div>
            <button
              onClick={() => showToast("🎉 Đã lưu tồn kho Canteen!")}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xs transition-all active:scale-95"
            >
              Lưu Kho Canteen
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {canteenItems.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">{item.name}</span>
                  <span className="font-mono font-black text-emerald-500 text-xs">{item.price.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Đã bán hôm nay: <strong className="text-slate-900 dark:text-white">{item.soldToday}</strong></span>
                  <span>Tồn kho: <strong className="text-sky-500">{item.stock}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW PITCH (Thêm Sân Con Mới) */}
      {mounted && showAddPitchModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddPitchModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <Plus className="w-5.5 h-5.5 text-[#0b4f6c] dark:text-sky-400" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Thêm Sân Con Mới Vào Cụm</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddPitchModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPitch} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Tên Sân Con Mới:</label>
                <input
                  type="text"
                  required
                  value={newPitchName}
                  onChange={(e) => setNewPitchName(e.target.value)}
                  placeholder="VD: Sân 7C Cỏ Nhân Tạo Mới"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Loại Sân Thể Thao:</label>
                <select
                  value={newPitchType}
                  onChange={(e) => setNewPitchType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] text-sm cursor-pointer"
                >
                  <option value="Sân 7 Người">Sân 7 Người (Cỏ Nhân Tạo Chuẩn VFF)</option>
                  <option value="Sân 5 Người">Sân 5 Người (Mini Cỏ / Futsal)</option>
                  <option value="Sân 11 Người">Sân 11 Người (Tiêu Chuẩn FIFA)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">Giá Giờ Thường (VNĐ):</label>
                  <input
                    type="number"
                    value={newPitchBasePrice}
                    onChange={(e) => setNewPitchBasePrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">Giá Giờ Vàng (VNĐ):</label>
                  <input
                    type="number"
                    value={newPitchPeakPrice}
                    onChange={(e) => setNewPitchPeakPrice(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c] text-sm"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">
                    Giờ hoạt động cụm: {operatingOpenTime} - {operatingCloseTime}
                  </span>
                  <span className="text-xs text-slate-500">
                    Độ dài ca: {operatingSlotDuration} phút/ca (Áp dụng {availableTimeSlots.length} ca tự động)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPitchModal(false);
                    setShowHoursModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shrink-0 shadow-xs"
                >
                  Đổi Giờ
                </button>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPitchModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#083a50] text-white dark:text-slate-950 font-black text-sm shadow-md transition-colors"
                >
                  Tạo Sân Mới
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: CREATE OFFLINE BOOKING FOR WALK-IN CUSTOMERS */}
      {mounted && showOfflineModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOfflineModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <Plus className="w-5.5 h-5.5 text-emerald-500" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Tạo Đặt Ca Vãng Lai (Hotline/Quầy)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowOfflineModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOfflineBookingSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Chọn Sân Con:</label>
                <select
                  value={offlinePitchId}
                  onChange={(e) => setOfflinePitchId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
                >
                  {pitchMatrix.map(p => (
                    <option key={p.pitchId} value={p.pitchId}>{p.pitchName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Khung Giờ Đặt:</label>
                <select
                  value={offlineTime}
                  onChange={(e) => setOfflineTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm cursor-pointer"
                >
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Tên Khách Đặt:</label>
                <input
                  type="text"
                  required
                  value={offlineCustomer}
                  onChange={(e) => setOfflineCustomer(e.target.value)}
                  placeholder="VD: Anh Cường FC Phủ Diễn"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Số Điện Thoại Khách:</label>
                <input
                  type="text"
                  required
                  value={offlinePhone}
                  onChange={(e) => setOfflinePhone(e.target.value)}
                  placeholder="VD: 0914 555 789"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Hình Thức Đặt Cọc:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOfflineDepositType("PAID_CASH")}
                    className={`p-3.5 rounded-xl font-bold border transition-all text-sm ${
                      offlineDepositType === "PAID_CASH"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
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
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
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
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition-colors"
                >
                  Xác Nhận Khóa Slot
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: CHECK-IN & NO-SHOW MANAGEMENT ACTION */}
      {mounted && selectedSlotForAction && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSlotForAction(null);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <QrCode className="w-5.5 h-5.5 text-sky-500" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Chi Tiết & Check-in Ca Đặt</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedSlotForAction(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2.5 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Khách đặt:</span>
                  <strong className="text-slate-900 dark:text-white font-black text-sm">{selectedSlotForAction.customer}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <strong className="font-mono text-slate-900 dark:text-white font-bold">{selectedSlotForAction.phone}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Khung giờ:</span>
                  <strong className="font-mono text-emerald-500 font-black text-sm">{selectedSlotForAction.time}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mã vé check-in:</span>
                  <strong className="font-mono text-sky-500 font-extrabold text-sm">{selectedSlotForAction.code}</strong>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>Tiền cọc đã thu:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black text-base">{selectedSlotForAction.depositPaid}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                  <span>Tiền còn lại thu tại quầy:</span>
                  <span className="font-mono text-rose-500 text-base font-black">{selectedSlotForAction.cashDue}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              {selectedSlotForAction.status === "booked" && (
                <button
                  type="button"
                  onClick={() => handleConfirmCheckin(selectedSlotForAction)}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Xác Nhận Check-in Vào Sân & Mở Đèn</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCancelBooking(selectedSlotForAction)}
                className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-sm border border-rose-500/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <Trash2 className="w-4.5 h-4.5" />
                <span>Hủy Đơn Đặt Này (Trả Về Ca Trống)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 4: CÀI ĐẶT THỜI GIAN HOẠT ĐỘNG & THỜI LƯỢNG CA SÂN */}
      {mounted && showHoursModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHoursModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-modal-pop my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-5.5 h-5.5 text-indigo-500" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Cấu Hình Giờ Hoạt Động & Ca Sân</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowHoursModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Mỗi cụm sân có thời gian mở cửa riêng biệt (ví dụ mở từ <strong className="text-indigo-500 font-mono font-bold">13:00</strong> hoặc <strong className="text-indigo-500 font-mono font-bold">15:00</strong>) và thời lượng ca linh hoạt (<strong className="text-slate-900 dark:text-white font-bold">1 tiếng</strong>, <strong className="text-slate-900 dark:text-white font-bold">1.5 tiếng</strong> hoặc <strong className="text-slate-900 dark:text-white font-bold">2 tiếng</strong>). Sơ đồ ca sẽ tự động phân chia nhịp nhàng theo thông số này.
            </p>

            <form onSubmit={handleUpdateOperatingHours} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">Giờ Mở Cửa:</label>
                  <select
                    value={operatingOpenTime}
                    onChange={(e) => setOperatingOpenTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                  >
                    {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800 dark:text-slate-200">Giờ Đóng Cửa:</label>
                  <select
                    value={operatingCloseTime}
                    onChange={(e) => setOperatingCloseTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm cursor-pointer"
                  >
                    {["20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30", "24:00"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-extrabold text-slate-800 dark:text-slate-200">Thời Lượng Mỗi Ca Sân:</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { value: 60, label: "1 Tiếng (60p)" },
                    { value: 90, label: "1.5 Tiếng (90p)" },
                    { value: 120, label: "2 Tiếng (120p)" },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setOperatingSlotDuration(dur.value)}
                      className={`py-3.5 px-2 rounded-xl font-bold border transition-all text-sm text-center ${
                        operatingSlotDuration === dur.value
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <span className="font-extrabold text-indigo-700 dark:text-indigo-300 block text-xs">
                  Xem trước các ca sân sinh tự động ({availableTimeSlots.length} ca):
                </span>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {availableTimeSlots.map((slot) => (
                    <span key={slot} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHoursModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingHours}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isUpdatingHours && <RefreshCw className="w-4 h-4 animate-spin mr-1" />}
                  <span>Lưu & Chia Lại Ca Sân</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

