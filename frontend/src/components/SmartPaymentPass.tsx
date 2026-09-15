"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Timer,
  CheckCircle2,
  QrCode,
  Lock,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Calendar,
  Clock,
  User,
  Award,
  Video,
  Gift,
  Users,
  Sun,
  Wallet,
  Share2,
  CalendarPlus,
  Info,
  ArrowRight,
  Smartphone,
  Sparkles,
  Building2,
  MapPin,
  RefreshCw,
  Bell
} from "lucide-react";

interface SmartPaymentPassProps {
  bookingData?: {
    pitch?: any;
    slot?: any;
  } | null;
  onBack: () => void;
  onNavigateTab?: (tab: string) => void;
}

export default function SmartPaymentPass({
  bookingData,
  onBack,
  onNavigateTab
}: SmartPaymentPassProps) {
  const [countdown, setCountdown] = useState(585); // 09:45
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    if (label === "bank") {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
    showToast(`Đã sao chép ${label}: ${text}`);
  };

  // Mock slot data fallback
  const pitchName = bookingData?.pitch?.name || "D-Sport Oasis Q7";
  const slotTime = bookingData?.slot?.time || "19:30 - 21:00";
  const slotPitch = bookingData?.slot?.pitchType || "Sân PB-01 • Pro Cushion 8 Lớp";
  const depositAmount = 45000;
  const transferCode = "VS7829 AN";
  const bankAccNum = "98202598888";

  return (
    <div className="w-full space-y-6 pb-20 text-slate-900 dark:text-white animate-fade-in relative">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-[#acf847]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Process & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
            <button onClick={onBack} className="hover:text-[#006c49] flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Đặt Sân Pickleball</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{pitchName}</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#006c49]" />
            <span className="text-[#006c49] font-bold">Thanh toán & Vé Matchday Pass</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center space-x-2">
            <span>Thanh Toán & Kích Hoạt Sân Thông Minh</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#acf847] text-[#102000]">
              <span className="w-2 h-2 rounded-full bg-[#304f00] animate-pulse" />
              <span>IoT Ready</span>
            </span>
          </h1>
        </div>

        {/* Live Countdown Timer Pill */}
        <div className="inline-flex items-center space-x-3 px-4 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Timer className="w-4 h-4 animate-spin text-rose-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Thời gian giữ slot</span>
            <span className="font-mono text-lg font-black text-rose-500 tracking-tight">{formatCountdown(countdown)}</span>
          </div>
        </div>
      </div>

      {/* Stepper Process Navigation */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Step 1: Completed */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Bước 1: Chọn sân & Giờ chơi</span>
              <span className="text-[11px] text-[#006c49] font-semibold truncate">{slotPitch} • {slotTime}</span>
            </div>
          </div>

          {/* Step 2: Active */}
          <div className="flex items-center space-x-3 bg-emerald-500/10 px-3 py-2 rounded-2xl border border-emerald-500/20">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md shadow-emerald-500/30 animate-pulse">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#006c49]">Bước 2: Quét VietQR 247</span>
              <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                {paymentDone ? "✓ Đã nhận diện giao dịch!" : "Đang chờ nhận diện giao dịch..."}
              </span>
            </div>
          </div>

          {/* Step 3: Ready */}
          <div className="flex items-center space-x-3 opacity-75">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
              paymentDone ? "bg-[#acf847] text-[#102000]" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}>
              3
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Bước 3: Nhận Vé & Check-in IoT</span>
              <span className="text-[11px] text-slate-400 truncate">Mở khóa cửa & Bật đèn tự động</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Cockpit Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: VietQR Dynamic Payment Gate (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 border border-slate-200 dark:border-slate-800 space-y-5 relative overflow-hidden">
            {/* Top Accent Light Indicator */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#006c49] via-emerald-400 to-[#acf847]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#006c49] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4 text-[#006c49]" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Cổng VietQR NAPAS 247</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Tự Động Khớp Lệnh
              </span>
            </div>

            {/* Total Due Callout */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Số tiền cọc thanh toán (50%)</span>
                <span className="text-2xl font-black text-[#006c49] font-mono">
                  {depositAmount.toLocaleString("vi-VN")} <span className="text-base font-semibold">₫</span>
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-[#006c49]">
                  Voucher -50k áp dụng
                </span>
                <span className="text-xs text-slate-400 line-through mt-0.5">Tổng gốc: 140.000đ</span>
              </div>
            </div>

            {/* QR Container with Brand & Security Emblems */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl relative group border border-slate-200 dark:border-slate-700">
              <div className="relative bg-white p-4 rounded-2xl shadow-md flex flex-col items-center border border-slate-100">
                {/* QR Header Logos */}
                <div className="flex items-center justify-between w-60 pb-2 mb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1">
                    <span className="font-black text-sm text-[#006c49] tracking-tighter">VaoSan</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#acf847]" />
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-500">
                    <span>MB BANK</span>
                    <span className="text-[#006c49] font-black">•</span>
                    <span>NAPAS 247</span>
                  </div>
                </div>

                {/* Real Dynamic VietQR Image */}
                <div className="w-60 h-60 relative bg-white flex items-center justify-center p-2 rounded-xl">
                  <img
                    src={`https://img.vietqr.io/image/970422-98202598888-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(transferCode)}&accountName=VAOSAN%20SPORTS%20ECOSYSTEM`}
                    alt="VietQR Dynamic Payment"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Scanning Helper */}
                <div className="mt-3 flex items-center space-x-1 text-slate-600 text-xs font-bold">
                  <Smartphone className="w-4 h-4 text-[#006c49]" />
                  <span>Quét bằng App Ngân Hàng / MoMo</span>
                </div>
              </div>
            </div>

            {/* Transfer Details List */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-slate-900 dark:text-white">MB Bank (Quân Đội)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Số tài khoản:</span>
                  <span className="font-mono text-base font-black text-slate-900 dark:text-white">{bankAccNum}</span>
                </div>
                <button
                  onClick={() => handleCopy(bankAccNum, "bank")}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-[#006c49] font-bold text-xs hover:bg-[#006c49] hover:text-white transition-colors shadow-xs flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedBank ? "Đã chép!" : "Sao chép"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400">Tên người thụ hưởng:</span>
                <span className="font-bold text-slate-900 dark:text-white">VAOSAN SPORTS ECOSYSTEM</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">Nội dung chuyển khoản (Bắt buộc):</span>
                  <span className="font-mono text-lg font-black text-[#006c49] tracking-wide">{transferCode}</span>
                </div>
                <button
                  onClick={() => handleCopy(transferCode, "content")}
                  className="px-3.5 py-2 rounded-xl bg-[#006c49] text-white font-bold text-xs hover:bg-[#005236] transition-colors shadow-sm flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5 text-white" />
                  <span>{copiedContent ? "Đã chép!" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            {/* Real-Time Webhook Listening Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex items-center space-x-3 border border-slate-200 dark:border-slate-700">
              <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                <span className="absolute w-3.5 h-3.5 rounded-full bg-[#006c49] animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  {paymentDone ? "Đã xác nhận thanh toán thành công!" : "Đang lắng nghe thanh toán trực tiếp qua Webhook"}
                </span>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Tự động xác nhận sau 1 - 2 giây khi nhận biến động số dư.
                </span>
              </div>
            </div>

            {/* Simulate Fast Test Button */}
            {!paymentDone && (
              <button
                onClick={() => {
                  setPaymentDone(true);
                  showToast("Hệ thống IPN Webhook xác nhận giao dịch 45.000đ thành công!");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
                <span>Giả Lập Xác Nhận Chuyển Khoản Thành Công</span>
              </button>
            )}
          </div>

          {/* Safety Guarantee Pill */}
          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-5 h-5 text-[#006c49] shrink-0" />
            <span>Thanh toán mã hóa bảo mật chuẩn Napas PCI-DSS. Hoàn tiền 100% nếu sân gặp sự cố kỹ thuật trước giờ chơi.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Matchday Pass & Smart IoT Activation (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Card Header / Stadium Scrim Accent */}
            <div className="relative bg-slate-900 text-white p-6 overflow-hidden">
              <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#006c49]/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#acf847]/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 rounded-lg bg-[#acf847] text-[#102000] text-xs font-black uppercase tracking-wider">
                      Matchday QuickPass
                    </span>
                    <span className="font-mono text-xs text-emerald-300 font-bold">#VS-7829-PB</span>
                  </div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#acf847] animate-ping" />
                    <span>Sẵn sàng kích hoạt</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold block">
                    Sân đấu định danh
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight">{slotPitch}</h2>
                  <p className="text-xs text-slate-300 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#acf847]" />
                    <span>Khu Phức Hợp D-Sport Oasis, 142 Nguyễn Thị Thập, P. Tân Hưng, Quận 7</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Perforated Ticket Divider Simulation */}
            <div className="relative h-6 bg-white dark:bg-slate-900 flex items-center">
              <div className="absolute -left-3 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800" />
              <div className="w-full border-b-2 border-dashed border-slate-200 dark:border-slate-800 mx-4" />
              <div className="absolute -right-3 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800" />
            </div>

            {/* Card Body: Key Match Specs & Gate QR */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Match Info Block (7 Cols) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-[#006c49]/10 text-[#006c49] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-[#006c49]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Khung giờ đặt chỗ</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{slotTime}</span>
                      <span className="text-xs text-[#006c49] font-bold">Tối nay (Thứ 6, 18/10) • 90 Phút</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[10px]">Đại diện đặt sân</span>
                      <span className="font-bold text-slate-900 dark:text-white block">Nguyễn Văn An</span>
                      <span className="font-mono text-slate-400 text-[11px]">098 • • • • 321</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 block text-[10px]">Trình độ tương thích</span>
                      <span className="font-extrabold text-[#304f00] dark:text-[#acf847] block">DUPR 3.0</span>
                      <span className="text-slate-400 text-[11px]">Elo: 1,200 Rank C</span>
                    </div>
                  </div>
                </div>

                {/* QuickPass IoT Gate Access QR (5 Cols) */}
                <div className="md:col-span-5 flex flex-col items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200">
                    <QrCode className="w-28 h-28 text-slate-900" />
                    <div className="absolute bottom-1 right-1 bg-[#006c49] text-white p-1 rounded-md">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <span className="mt-2 font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider text-center">
                    Cổng & Tủ Đồ Số #09
                  </span>
                  <span className="text-[11px] text-[#006c49] font-bold text-center">Mã quét bảo mật 1 lần</span>
                </div>
              </div>

              {/* Smart Automation IoT Explanation Callout */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Zap className="w-4 h-4 text-[#006c49]" />
                  <span>Cơ chế kích hoạt IoT Thông Minh</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Quét mã này tại Barrier lối vào CLB D-Sport Oasis: Cửa barrier tự mở, chỉ dẫn điện tử dẫn vào sân PB-01.{" "}
                  <strong className="text-slate-900 dark:text-white">
                    Dàn đèn LED chuẩn thi đấu 500 Lux và máy phát bóng sẽ tự động bật lúc 19:25
                  </strong>{" "}
                  (trước giờ thi đấu 5 phút).
                </p>
              </div>

              {/* Included Perks Visual Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Tiện ích đặc quyền kèm trong vé
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#006c49] font-bold">
                      <Video className="w-4 h-4 text-[#006c49]" />
                      <span>AI Camera Highlight</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Tự động ghi lại và cắt pha bóng đẹp chuẩn HD sau trận đấu.
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#006c49] font-bold">
                      <Gift className="w-4 h-4 text-[#006c49]" />
                      <span>Bóng & Nước Miễn Phí</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Nhận 4 bóng Franklin X-40 + 2 chai Revive lạnh tại quầy check-in.
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center space-x-1.5 text-[#304f00] dark:text-[#acf847] font-bold">
                      <Users className="w-4 h-4 text-[#304f00] dark:text-[#acf847]" />
                      <span>Kèo Mở (1/4 VĐV)</span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Đang mở ghép 1 tay vợt DUPR ~3.0 để đánh đôi match giao lưu.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  onClick={() => showToast("Đã thêm thẻ Matchday Pass vào Apple Wallet!")}
                  className="flex-1 w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-4 h-4 text-white" />
                  <span>Lưu vào Apple / Google Wallet</span>
                </button>

                <button
                  onClick={() => showToast("Đã tạo liên kết chia sẻ vé & bản đồ sân qua Zalo nhóm!")}
                  className="flex-1 w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4 text-[#006c49]" />
                  <span>Chia sẻ Zalo Đội</span>
                </button>

                <button
                  onClick={() => showToast("Đã đồng bộ lịch hẹn thi đấu vào Google Calendar (19:30 Tối nay)")}
                  className="py-3 px-4 rounded-xl bg-emerald-500/10 text-[#006c49] font-bold text-xs hover:bg-emerald-500/20 transition-colors flex items-center justify-center space-x-1.5 shrink-0"
                >
                  <CalendarPlus className="w-4 h-4 text-[#006c49]" />
                  <span>Lịch Google</span>
                </button>
              </div>
            </div>

            {/* Bottom Footer / Next Destination */}
            <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-[#006c49] shrink-0" />
                <span>Cần dời giờ trước 2 tiếng hoặc hỗ trợ khẩn cấp: Hotline <strong>1900 6886</strong></span>
              </div>
              <button
                onClick={() => onNavigateTab?.("SCHEDULE")}
                className="font-extrabold text-[#006c49] hover:underline flex items-center space-x-1 shrink-0"
              >
                <span>Về Quản lý Đặt Chỗ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
