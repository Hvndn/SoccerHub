"use client";

import React, { useState, useEffect } from "react";
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
  const [revenueData, setRevenueData] = useState<any | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"matrix" | "pitches" | "pricing" | "canteen">("matrix");
  const [matrixFilterStatus, setMatrixFilterStatus] = useState<string>("ALL");
  const [matrixFilterType, setMatrixFilterType] = useState<string>("ALL");

  // Dynamic pricing controls
  const [peakHourMultiplier, setPeakHourMultiplier] = useState(1.2);
  const [autoPricing, setAutoPricing] = useState(true);
  const [depositRate, setDepositRate] = useState("50%");
  
  // Real-time notification banner
  const [notification, setNotification] = useState<string | null>(
    "🔔 Đơn đặt mới: Cầu thủ Nguyễn Văn An đã đặt cọc 300.000đ cho Sân 7A ca 19:00 - 20:30 qua VietQR Napas247!"
  );

  // Live Owner Matrix Data (Stateful)
  const [pitchMatrix, setPitchMatrix] = useState([
    {
      pitchId: "p7a",
      pitchName: "Sân 7A FIFA Cỏ Nhân Tạo",
      type: "Sân 7 Người",
      basePrice: 500000,
      peakPrice: 600000,
      status: "ACTIVE",
      slots: [
        { id: "s1", time: "16:00 - 17:30", status: "booked", customer: "Trần Hữu Nam", phone: "0918 223 456", price: "450k", depositPaid: "225k", cashDue: "225k", via: "VietQR Online", code: "VS-7829-01" },
        { id: "s2", time: "17:30 - 19:00", status: "playing", customer: "FC FPT Telecom", phone: "0909 888 777", price: "600k", depositPaid: "300k", cashDue: "0k (Thu đủ)", via: "Check-in Đã Vào Sân", code: "VS-7829-02" },
        { id: "s3", time: "19:00 - 20:30", status: "booked", customer: "Nguyễn Văn An", phone: "0988 776 655", price: "600k", depositPaid: "300k", cashDue: "300k", via: "VietQR Online", code: "VS-7829-03" },
        { id: "s4", time: "20:30 - 22:00", status: "resale", customer: "FC Dragon King (Pass)", phone: "0934 112 233", price: "325k", depositPaid: "0k", cashDue: "325k", via: "Sàn Nhượng Gấp", code: "VS-7829-04" }
      ]
    },
    {
      pitchId: "p7b",
      pitchName: "Sân 7B Cỏ Tiêu Chuẩn VFF",
      type: "Sân 7 Người",
      basePrice: 450000,
      peakPrice: 550000,
      status: "ACTIVE",
      slots: [
        { id: "s5", time: "16:00 - 17:30", status: "empty", customer: "Ca Trống", phone: "—", price: "400k", depositPaid: "0k", cashDue: "0k", via: "Sẵn sàng nhận khách", code: "—" },
        { id: "s6", time: "17:30 - 19:00", status: "playing", customer: "FC Real Star", phone: "0912 345 678", price: "600k", depositPaid: "300k", cashDue: "0k", via: "Check-in Đã Vào Sân", code: "VS-7829-06" },
        { id: "s7", time: "19:00 - 20:30", status: "booked", customer: "Lê Văn Cường (Khách Quen)", phone: "0914 555 789", price: "600k", depositPaid: "300k", cashDue: "300k", via: "Tạo Tại Quầy", code: "VS-7829-07" },
        { id: "s8", time: "20:30 - 22:00", status: "booked", customer: "Học Viện U15", phone: "0977 123 456", price: "500k", depositPaid: "500k", cashDue: "0k", via: "Cố Định Tháng", code: "VS-7829-08" }
      ]
    },
    {
      pitchId: "p5a",
      pitchName: "Sân 5A Futsal Trong Nhà",
      type: "Sân 5 Người",
      basePrice: 300000,
      peakPrice: 420000,
      status: "ACTIVE",
      slots: [
        { id: "s9", time: "16:00 - 17:30", status: "booked", customer: "FC Giao Hữu 5v5", phone: "0903 445 566", price: "300k", depositPaid: "150k", cashDue: "150k", via: "MoMo Online", code: "VS-7829-09" },
        { id: "s10", time: "17:30 - 19:00", status: "booked", customer: "FC Tech Hub", phone: "0989 999 000", price: "420k", depositPaid: "210k", cashDue: "210k", via: "VietQR Online", code: "VS-7829-10" },
        { id: "s11", time: "19:00 - 20:30", status: "playing", customer: "FC Futsal Pro", phone: "0916 222 333", price: "420k", depositPaid: "210k", cashDue: "0k", via: "Check-in Đã Vào Sân", code: "VS-7829-11" },
        { id: "s12", time: "20:30 - 22:00", status: "empty", customer: "Ca Trống", phone: "—", price: "340k", depositPaid: "0k", cashDue: "0k", via: "Sẵn sàng nhận khách", code: "—" }
      ]
    },
    {
      pitchId: "p11a",
      pitchName: "Sân 11 Tiêu Chuẩn Quốc Tế FIFA",
      type: "Sân 11",
      basePrice: 900000,
      peakPrice: 1200000,
      status: "ACTIVE",
      slots: [
        { id: "s13", time: "16:00 - 17:30", status: "booked", customer: "FC Liên Quân Q.7", phone: "0908 112 334", price: "900k", depositPaid: "450k", cashDue: "450k", via: "VietQR Online", code: "VS-11A-01" },
        { id: "s14", time: "17:30 - 19:00", status: "playing", customer: "FC Sinh Viên Tôn Đức Thắng", phone: "0938 554 433", price: "1200k", depositPaid: "600k", cashDue: "0k", via: "Check-in Đã Vào Sân", code: "VS-11A-02" },
        { id: "s15", time: "19:00 - 20:30", status: "booked", customer: "FC Ngân Hàng ACB", phone: "0919 778 899", price: "1200k", depositPaid: "600k", cashDue: "600k", via: "MoMo Online", code: "VS-11A-03" },
        { id: "s16", time: "20:30 - 22:00", status: "empty", customer: "Ca Trống", phone: "—", price: "950k", depositPaid: "0k", cashDue: "0k", via: "Sẵn sàng nhận khách", code: "—" }
      ]
    }
  ]);

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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<any | null>(null);
  const [searchCodeInput, setSearchCodeInput] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Pitch Form state
  const [newPitchName, setNewPitchName] = useState("");
  const [newPitchType, setNewPitchType] = useState("Sân 7 Người");
  const [newPitchBasePrice, setNewPitchBasePrice] = useState("450000");
  const [newPitchPeakPrice, setNewPitchPeakPrice] = useState("600000");

  // Offline Booking Form State
  const [offlinePitchId, setOfflinePitchId] = useState("p7a");
  const [offlineTime, setOfflineTime] = useState("20:30 - 22:00");
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

  const fetchRealData = async () => {
    setIsLoadingBackend(true);
    try {
      const pitches = await apiRequest<any[]>("/api/v1/pitches");
      if (pitches && pitches.length > 0) {
        setRealPitches(pitches);
        const current = pitches[0];
        setActivePitch(current);
        loadCourtsForPitch(current);
      }
      try {
        const rev = await apiRequest<any>("/api/v1/admin/revenue-report");
        if (rev) setRevenueData(rev);
      } catch (e) {
        // silent
      }
    } catch (err: any) {
      console.warn("Backend API sync notice:", err.message);
    } finally {
      setIsLoadingBackend(false);
    }
  };

  const loadCourtsForPitch = (pitch: any) => {
    if (!pitch) return;
    const base = pitch.avgPricePerHour || 450000;
    const peak = pitch.peakPricePerHour || 600000;
    const types = (pitch.pitchTypes && pitch.pitchTypes.length > 0)
      ? pitch.pitchTypes
      : ["Sân 7 Cỏ Nhân Tạo", "Sân 5 Futsal"];

    const courts = types.map((typeStr: string, idx: number) => {
      const is7 = typeStr.toLowerCase().includes("7");
      const is5 = typeStr.toLowerCase().includes("5");
      const is11 = typeStr.toLowerCase().includes("11");
      const label = is7 ? "Sân 7 Người" : is5 ? "Sân 5 Người" : is11 ? "Sân 11" : typeStr;
      const courtName = `${label} ${String.fromCharCode(65 + idx)} (${pitch.name ? (pitch.name.length > 18 ? pitch.name.slice(0, 18) + '...' : pitch.name) : 'Cỏ Nhân Tạo'})`;
      const courtBase = is11 ? Math.round(base * 2) : is7 ? base : Math.round(base * 0.75);
      const courtPeak = is11 ? Math.round(peak * 2) : is7 ? peak : Math.round(peak * 0.75);

      return {
        pitchId: `pitch-${pitch.id}-${idx}`,
        pitchName: courtName,
        type: label,
        basePrice: courtBase,
        peakPrice: courtPeak,
        status: "ACTIVE",
        slots: [
          { id: `s-${pitch.id}-${idx}-1`, time: "16:00 - 17:30", status: idx === 0 ? "booked" : "empty", customer: idx === 0 ? "Trần Hữu Nam" : "Ca Trống", phone: idx === 0 ? "0918 223 456" : "—", price: `${Math.round(courtBase/1000)}k`, depositPaid: idx === 0 ? `${Math.round(courtBase/2000)}k` : "0k", cashDue: idx === 0 ? `${Math.round(courtBase/2000)}k` : "0k", via: idx === 0 ? "VietQR Online" : "Sẵn sàng nhận khách", code: `VS-${pitch.id}-01` },
          { id: `s-${pitch.id}-${idx}-2`, time: "17:30 - 19:00", status: "playing", customer: "FC Sài Gòn Warriors", phone: "0909 888 777", price: `${Math.round(courtPeak/1000)}k`, depositPaid: `${Math.round(courtPeak/2000)}k`, cashDue: "0k (Thu đủ)", via: "Check-in Đã Vào Sân", code: `VS-${pitch.id}-02` },
          { id: `s-${pitch.id}-${idx}-3`, time: "19:00 - 20:30", status: "booked", customer: "Nguyễn Văn An", phone: "0988 776 655", price: `${Math.round(courtPeak/1000)}k`, depositPaid: `${Math.round(courtPeak/2000)}k`, cashDue: `${Math.round(courtPeak/2000)}k`, via: "VietQR Online", code: `VS-${pitch.id}-03` },
          { id: `s-${pitch.id}-${idx}-4`, time: "20:30 - 22:00", status: idx % 2 === 0 ? "resale" : "empty", customer: idx % 2 === 0 ? "FC Hùng Dũng Q.7 (Pass)" : "Ca Trống", phone: idx % 2 === 0 ? "0934 112 233" : "—", price: `${Math.round((courtBase*0.8)/1000)}k`, depositPaid: "0k", cashDue: `${Math.round((courtBase*0.8)/1000)}k`, via: idx % 2 === 0 ? "Sàn Nhượng Gấp" : "Sẵn sàng nhận khách", code: `VS-${pitch.id}-04` }
        ]
      };
    });

    setPitchMatrix(courts);
    if (courts.length > 0) {
      setOfflinePitchId(courts[0].pitchId);
    }
  };

  const handleSelectPitch = (pitch: any) => {
    setActivePitch(pitch);
    loadCourtsForPitch(pitch);
    showToast(`🏟️ Đã chuyển sang cụm sân: [${pitch.name}]`);
  };

  // Add new pitch handler
  const handleCreateNewPitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPitchName.trim()) {
      showToast("❌ Vui lòng nhập tên sân con mới!");
      return;
    }

    const newId = `pitch-${Date.now()}`;
    const newPitch = {
      pitchId: newId,
      pitchName: newPitchName,
      type: newPitchType,
      basePrice: Number(newPitchBasePrice) || 450000,
      peakPrice: Number(newPitchPeakPrice) || 600000,
      status: "ACTIVE",
      slots: [
        { id: `${newId}-s1`, time: "16:00 - 17:30", status: "empty", customer: "Ca Trống", phone: "—", price: `${(Number(newPitchBasePrice)/1000).toFixed(0)}k`, depositPaid: "0k", cashDue: "0k", via: "Mới khởi tạo", code: "—" },
        { id: `${newId}-s2`, time: "17:30 - 19:00", status: "empty", customer: "Ca Trống", phone: "—", price: `${(Number(newPitchPeakPrice)/1000).toFixed(0)}k`, depositPaid: "0k", cashDue: "0k", via: "Mới khởi tạo", code: "—" },
        { id: `${newId}-s3`, time: "19:00 - 20:30", status: "empty", customer: "Ca Trống", phone: "—", price: `${(Number(newPitchPeakPrice)/1000).toFixed(0)}k`, depositPaid: "0k", cashDue: "0k", via: "Mới khởi tạo", code: "—" },
        { id: `${newId}-s4`, time: "20:30 - 22:00", status: "empty", customer: "Ca Trống", phone: "—", price: `${(Number(newPitchBasePrice)/1000).toFixed(0)}k`, depositPaid: "0k", cashDue: "0k", via: "Mới khởi tạo", code: "—" }
      ]
    };

    setPitchMatrix(prev => [...prev, newPitch]);
    setShowAddPitchModal(false);
    setNewPitchName("");
    showToast(`🎉 Đã thêm thành công [${newPitchName}] vào danh sách quản lý cụm sân!`);
  };

  // Offline Booking submit
  const handleOfflineBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineCustomer.trim() || !offlinePhone.trim()) {
      showToast("❌ Vui lòng nhập đầy đủ tên và số điện thoại khách!");
      return;
    }

    try {
      await apiRequest('/api/v1/pitches/book-slot', {
        method: 'POST',
        body: JSON.stringify({
          slotId: offlineTime,
          customerName: offlineCustomer,
          phone: offlinePhone,
          pitchId: activePitch?.id || 1,
          price: 500000
        })
      });
    } catch (err) {
      console.warn("Backend sync notice:", err);
    }

    setPitchMatrix(prev =>
      prev.map(p => {
        if (p.pitchId === offlinePitchId) {
          return {
            ...p,
            slots: p.slots.map(s => {
              if (s.time === offlineTime) {
                return {
                  ...s,
                  status: "booked",
                  customer: `${offlineCustomer} (Vãng Lai)`,
                  phone: offlinePhone,
                  depositPaid: offlineDepositType === "PAID_CASH" ? "250k (Mặt quầy)" : "0k (Giữ tin tưởng)",
                  cashDue: offlineDepositType === "PAID_CASH" ? "250k" : "500k",
                  via: "Tạo Tại Quầy",
                  code: `SH-OFFLINE-${Math.floor(1000 + Math.random() * 9000)}`
                };
              }
              return s;
            })
          };
        }
        return p;
      })
    );

    setShowOfflineModal(false);
    setOfflineCustomer("");
    setOfflinePhone("");
    showToast(`✅ Đã khóa slot ${offlineTime} thành công cho khách vãng lai ${offlineCustomer}!`);
  };

  // Confirm Check-in
  const handleConfirmCheckin = (slotId: string) => {
    setPitchMatrix(prev =>
      prev.map(p => ({
        ...p,
        slots: p.slots.map(s => {
          if (s.id === slotId) {
            return {
              ...s,
              status: "playing",
              cashDue: "0k (Đã thu đủ)",
              via: "Check-in Đã Vào Sân"
            };
          }
          return s;
        })
      }))
    );
    setSelectedSlotForAction(null);
    showToast("⚽ Đã thu tiền mặt & kích hoạt hệ thống đèn LED sân! Khách đã vào sân thi đấu.");
  };

  // Handle No-Show Penalty
  const handleNoShowPenalty = (slotId: string, customerName: string) => {
    setPitchMatrix(prev =>
      prev.map(p => ({
        ...p,
        slots: p.slots.map(s => {
          if (s.id === slotId) {
            return {
              ...s,
              status: "resale",
              customer: `${customerName} (No-Show)`,
              via: "Tịch Thu Cọc • Mở Sàn Nhượng",
              price: "320k (-30% Giờ Vàng)"
            };
          }
          return s;
        })
      }))
    );
    setSelectedSlotForAction(null);
    showToast(`⚠️ Đã ghi nhận [Bùng Kèo] đối với ${customerName}! Tịch thu cọc 50% & đăng bài Sàn Nhượng Gấp.`);
  };

  // Filter matrix slots based on state
  const filteredMatrix = pitchMatrix
    .filter(pitch => matrixFilterType === "ALL" || pitch.type.includes(matrixFilterType))
    .map(pitch => ({
      ...pitch,
      slots: pitch.slots.filter(s => {
        if (matrixFilterStatus === "ALL") return true;
        if (matrixFilterStatus === "BOOKED") return s.status === "booked";
        if (matrixFilterStatus === "PLAYING") return s.status === "playing";
        if (matrixFilterStatus === "EMPTY") return s.status === "empty";
        if (matrixFilterStatus === "RESALE") return s.status === "resale";
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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0b4f6c]/10 dark:bg-sky-500/10 border border-[#0b4f6c]/20 dark:border-sky-400/20 text-[#0b4f6c] dark:text-sky-400 text-xs font-bold mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{activePitch?.address || "Số 154 Nguyễn Lương Bằng, Tp. Đà Nẵng"}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Hotline: {activePitch?.phone || "0988 776 652"}</span>
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
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
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
              onClick={() => setShowAddPitchModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#07384d] dark:hover:bg-sky-400 text-white dark:text-slate-950 font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Sân Con Mới</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOfflineModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <PhoneCall className="w-4 h-4" />
              <span>+ Tạo Đặt Ca Tại Quầy</span>
            </button>
          </div>
        </div>

        {/* SUB TAB NAVIGATION TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab("matrix")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "matrix"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Sơ Đồ Ca Sân Live Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pitches")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "pitches"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Danh Sách Sân Con ({pitchMatrix.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("pricing")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "pricing"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>AI Dynamic Pricing & Giờ Vàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("canteen")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeSubTab === "canteen"
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-md"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <Coffee className="w-4 h-4 text-emerald-400" />
            <span>Quản Lý Canteen & Vật Tư</span>
          </button>
        </div>
      </div>

      {/* TOP KPI OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Doanh Thu Hôm Nay</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">16.480.000 VNĐ</div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> VietQR 12.8M • Mặt quầy 3.68M
          </span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tỷ Lệ Lấp Đầy Ca Sân</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">92%</div>
          <span className="text-[11px] font-bold text-emerald-500">Khóa 14 / 16 ca đặt (Giờ vàng 100%)</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Đơn Cọc VietQR Online</span>
          <div className="text-2xl sm:text-3xl font-black text-sky-500 font-mono">11 Ca Online</div>
          <span className="text-[11px] font-bold text-slate-500">Tự động giữ slot trong 1 giây</span>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Khách Vãng Lai Tại Quầy</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">3 Ca Trực Tiếp</div>
          <span className="text-[11px] font-bold text-amber-500">Khóa lịch ca tức thì trên toàn sàn</span>
        </div>
      </div>

      {/* QUICK SEARCH & CHECK-IN TOOLBAR */}
      <div className="glass-panel p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-[#0b4f6c]/10 dark:bg-sky-500/20 text-[#0b4f6c] dark:text-sky-300 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">Tra Cứu Mã Vé & Check-in Tiếp Nhận</span>
            <span className="text-[11px] text-slate-400">Nhập mã vé đặt cọc hoặc Số Điện Thoại khách để check-in mở đèn</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchCodeInput}
              onChange={(e) => setSearchCodeInput(e.target.value)}
              placeholder="VD: VS-7829-01 hoặc SĐT..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={() => {
              if (!searchCodeInput.trim()) return;
              const found = pitchMatrix.flatMap(p => p.slots).find(s => s.code.toLowerCase().includes(searchCodeInput.toLowerCase()) || s.phone.includes(searchCodeInput));
              if (found) {
                setSelectedSlotForAction(found);
              } else {
                showToast(`❌ Không tìm thấy đơn ca nào khớp với mã "${searchCodeInput}"`);
              }
            }}
            className="px-4 py-2 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 text-xs font-extrabold shadow-sm shrink-0"
          >
            Tra Cứu
          </button>
        </div>
      </div>

      {/* --- SUB-TAB CONTENT 1: LIVE MATRIX VIEW --- */}
      {activeSubTab === "matrix" && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Sơ Đồ Ca Sân Thời Gian Thực (Owner Live Grid Matrix)
                </h2>
              </div>

              {/* MATRIX FILTER BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <span className="text-slate-400 px-2 text-[11px]">Trạng thái:</span>
                  <button
                    onClick={() => setMatrixFilterStatus("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterStatus === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setMatrixFilterStatus("BOOKED")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterStatus === "BOOKED" ? "bg-emerald-500 text-white shadow-xs" : "text-slate-500"}`}
                  >
                    Đã Cọc
                  </button>
                  <button
                    onClick={() => setMatrixFilterStatus("PLAYING")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterStatus === "PLAYING" ? "bg-rose-500 text-white shadow-xs" : "text-slate-500"}`}
                  >
                    Đang Đá
                  </button>
                  <button
                    onClick={() => setMatrixFilterStatus("EMPTY")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterStatus === "EMPTY" ? "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"}`}
                  >
                    Ca Trống
                  </button>
                </div>

                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <span className="text-slate-400 px-2 text-[11px]">Loại:</span>
                  <button
                    onClick={() => setMatrixFilterType("ALL")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterType === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-500"}`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setMatrixFilterType("Sân 7")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterType === "Sân 7" ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs" : "text-slate-500"}`}
                  >
                    Sân 7
                  </button>
                  <button
                    onClick={() => setMatrixFilterType("Sân 5")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterType === "Sân 5" ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs" : "text-slate-500"}`}
                  >
                    Sân 5
                  </button>
                  <button
                    onClick={() => setMatrixFilterType("Sân 11")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${matrixFilterType === "Sân 11" ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 shadow-xs" : "text-slate-500"}`}
                  >
                    Sân 11
                  </button>
                </div>
              </div>
            </div>

            {/* COLOR CODES LEGEND */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
              <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Đã Cọc (CONFIRMED)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Đã Check-in Đá (IN_USE)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-500">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Sàn Nhượng Ca Gấp</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>Ca Trống (AVAILABLE)</span>
              </span>
            </div>

            {/* PITCH MATRIX GRID */}
            <div className="space-y-4 pt-2">
              {filteredMatrix.map((pitch) => (
                <div key={pitch.pitchId} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">{pitch.pitchName}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold">
                        {pitch.type}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Giá cơ bản: <strong className="text-slate-900 dark:text-white">{(pitch.basePrice/1000).toFixed(0)}k/ca</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    {pitch.slots.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlotForAction(slot)}
                        className={`p-3.5 rounded-2xl border space-y-1.5 transition-all cursor-pointer hover:scale-[1.02] shadow-xs ${
                          slot.status === "playing"
                            ? "bg-rose-500/10 border-rose-400 text-rose-600 dark:text-rose-400 font-bold"
                            : slot.status === "booked"
                            ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold"
                            : slot.status === "resale"
                            ? "bg-amber-500/10 border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-400"
                        }`}
                      >
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="font-extrabold">{slot.time}</span>
                          <span className="font-black">{slot.price}</span>
                        </div>
                        
                        <p className="font-black text-slate-900 dark:text-white truncate text-xs">{slot.customer}</p>
                        
                        <div className="text-[10px] space-y-0.5 opacity-90 font-mono">
                          <span className="block text-slate-500">Cọc: <strong className="text-emerald-600 dark:text-emerald-400">{slot.depositPaid}</strong></span>
                          {slot.status === "booked" && (
                            <span className="block text-rose-500">Thu tại quầy: <strong>{slot.cashDue}</strong></span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span className="truncate">{slot.via}</span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </div>
                      </div>
                    ))}
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
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Building className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                  <span>Danh Sách Sân Con Trong Cụm ({pitchMatrix.length} Sân)</span>
                </h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Quản lý giá thuê, tình trạng sân và tiện ích cho từng sân con trong trung tâm thể thao.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPitchModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Sân Con Mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pitchMatrix.map((pitch) => (
                <div key={pitch.pitchId} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{pitch.pitchName}</h3>
                        <span className="px-2 py-0.5 rounded bg-[#0b4f6c]/10 text-[#0b4f6c] dark:text-sky-400 text-[10px] font-mono font-bold">
                          {pitch.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Mã sân: {pitch.pitchId}</span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                      ĐANG HOẠT ĐỘNG
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">GIÁ GIỜ THƯỜNG</span>
                      <strong className="text-slate-900 dark:text-white font-extrabold">{pitch.basePrice.toLocaleString("vi-VN")} đ/ca</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">GIÁ GIỜ VÀNG (+20%)</span>
                      <strong className="text-amber-500 font-black">{pitch.peakPrice.toLocaleString("vi-VN")} đ/ca</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-slate-400">Tiện ích: Đèn LED 500W, Cỏ FIFA, Wifi 6, Nước uống</span>
                    <button
                      onClick={() => showToast(`⚙️ Đã mở bảng chỉnh sửa giá cho [${pitch.pitchName}]`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300"
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
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                  autoPricing ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-700"
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
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-extrabold text-xs"
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Thêm Sân Con Mới Vào Cụm</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddPitchModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPitch} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tên Sân Con Mới:</label>
                <input
                  type="text"
                  required
                  value={newPitchName}
                  onChange={(e) => setNewPitchName(e.target.value)}
                  placeholder="VD: Sân 7C Cỏ Nhân Tạo Mới"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Loại Sân Thể Thao:</label>
                <select
                  value={newPitchType}
                  onChange={(e) => setNewPitchType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c]"
                >
                  <option value="Sân 7 Người">Sân 7 Người (Cỏ Nhân Tạo Chuẩn VFF)</option>
                  <option value="Sân 5 Người">Sân 5 Người (Mini Cỏ / Futsal)</option>
                  <option value="Sân 11 Người">Sân 11 Người (Tiêu Chuẩn FIFA)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Giá Giờ Thường (VNĐ):</label>
                  <input
                    type="number"
                    value={newPitchBasePrice}
                    onChange={(e) => setNewPitchBasePrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Giá Giờ Vàng (VNĐ):</label>
                  <input
                    type="number"
                    value={newPitchPeakPrice}
                    onChange={(e) => setNewPitchPeakPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0b4f6c]"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPitchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0b4f6c] dark:bg-sky-500 hover:bg-[#083a50] text-white dark:text-slate-950 font-black text-xs shadow-md transition-colors"
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Tạo Đặt Ca Vãng Lai (Hotline/Quầy)</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowOfflineModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOfflineBookingSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Chọn Sân Con:</label>
                <select
                  value={offlinePitchId}
                  onChange={(e) => setOfflinePitchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {pitchMatrix.map(p => (
                    <option key={p.pitchId} value={p.pitchId}>{p.pitchName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Khung Giờ Đặt:</label>
                <select
                  value={offlineTime}
                  onChange={(e) => setOfflineTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="16:00 - 17:30">16:00 - 17:30 (Giờ thường - 400k)</option>
                  <option value="17:30 - 19:00">17:30 - 19:00 (Giờ vàng - 600k)</option>
                  <option value="19:00 - 20:30">19:00 - 20:30 (Giờ vàng - 600k)</option>
                  <option value="20:30 - 22:00">20:30 - 22:00 (Giờ đêm - 500k)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tên Khách Đặt:</label>
                <input
                  type="text"
                  required
                  value={offlineCustomer}
                  onChange={(e) => setOfflineCustomer(e.target.value)}
                  placeholder="VD: Anh Cường FC Phủ Diễn"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Số Điện Thoại Khách:</label>
                <input
                  type="text"
                  required
                  value={offlinePhone}
                  onChange={(e) => setOfflinePhone(e.target.value)}
                  placeholder="VD: 0914 555 789"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1 pt-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Hình Thức Đặt Cọc:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOfflineDepositType("PAID_CASH")}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-[11px] ${
                      offlineDepositType === "PAID_CASH"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Đã Thu Cọc Mặt Quầy (50%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfflineDepositType("TRUST")}
                    className={`p-2.5 rounded-xl font-bold border transition-all text-[11px] ${
                      offlineDepositType === "TRUST"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
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
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md transition-colors"
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-sky-500" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Chi Tiết & Check-in Ca Đặt</h3>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedSlotForAction(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khách đặt:</span>
                  <strong className="text-slate-900 dark:text-white font-extrabold">{selectedSlotForAction.customer}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{selectedSlotForAction.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Khung giờ:</span>
                  <strong className="font-mono text-emerald-500 font-black">{selectedSlotForAction.time}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã vé check-in:</span>
                  <strong className="font-mono text-sky-500">{selectedSlotForAction.code}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Tiền cọc đã thu:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{selectedSlotForAction.depositPaid}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Tiền còn lại thu tại quầy:</span>
                  <span className="font-mono text-rose-500 text-sm font-black">{selectedSlotForAction.cashDue}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmCheckin(selectedSlotForAction.id)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>Xác Nhận Thu Đủ Tiền & Mở Đèn Đá</span>
              </button>

              <button
                type="button"
                onClick={() => handleNoShowPenalty(selectedSlotForAction.id, selectedSlotForAction.customer)}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-xs border border-rose-500/20 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <UserX className="w-4 h-4" />
                <span>Xử Lý Khách Bùng Kèo (No-Show 15p)</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

