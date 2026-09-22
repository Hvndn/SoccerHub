"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Plus,
  ArrowRight,
  ArrowLeft,
  QrCode,
  DollarSign,
  Sliders,
  Upload,
  Building,
  Calendar,
  Zap,
  Check,
  Sparkles,
  Info,
  ChevronRight,
  Clock,
  Layers,
  PhoneCall
} from "lucide-react";

interface StadiumOwnerOnboardingProps {
  onComplete?: () => void;
  onBackToHome?: () => void;
}

export default function StadiumOwnerOnboarding({
  onComplete,
  onBackToHome
}: StadiumOwnerOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(2); // Step 2 is active by default as per Stitch spec

  // Form States
  const [stadiumProfile, setStadiumProfile] = useState({
    name: "Cụm Thể Thao Đa Môn D-Sport Oasis Q.7",
    address: "Số 154 Nguyễn Lương Bằng, Phường Tân Phú, Quận 7, TP.HCM",
    lat: "10.7482",
    lng: "106.7214",
    openHours: "06:00 - 23:00",
    phone: "0988 776 655"
  });

  const [pitches, setPitches] = useState([
    { id: 1, name: "Sân Bóng Đá 7A", sport: "Bóng đá 7 người", surface: "Cỏ nhân tạo FIFA Pro 50mm", normalPrice: 380000, peakPrice: 650000, status: "Ready" },
    { id: 2, name: "Sân Bóng Đá 7B", sport: "Bóng đá 7 người", surface: "Cỏ nhân tạo 45mm", normalPrice: 350000, peakPrice: 600000, status: "Ready" },
    { id: 3, name: "Sân PB-01 Pro", sport: "Pickleball Pro", surface: "Sơn Cushion USAPA 8mm", normalPrice: 120000, peakPrice: 240000, status: "Ready" },
    { id: 4, name: "Sân Cầu Lông Sky Court", sport: "Cầu lông", surface: "Thảm PVC Yonex thi đấu", normalPrice: 80000, peakPrice: 150000, status: "Ready" }
  ]);

  const [vietQRInfo, setVietQRInfo] = useState({
    bank: "Vietcombank (VCB)",
    accountNumber: "0071000982341",
    accountName: "TRAN HUU NAM",
    depositRate: "50%"
  });

  const [aiPricingEnabled, setAiPricingEnabled] = useState(true);

  // New Pitch Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPitchName, setNewPitchName] = useState("");
  const [newSport, setNewSport] = useState("Bóng đá 7 người");
  const [newNormalPrice, setNewNormalPrice] = useState(350000);
  const [newPeakPrice, setNewPeakPrice] = useState(600000);

  const handleAddPitch = () => {
    if (!newPitchName) return;
    setPitches([
      ...pitches,
      {
        id: Date.now(),
        name: newPitchName,
        sport: newSport,
        surface: "Tiêu Chuẩn VaoSan Pro",
        normalPrice: newNormalPrice,
        peakPrice: newPeakPrice,
        status: "Ready"
      }
    ]);
    setNewPitchName("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* TOP NAV BAR HEADER */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0b4f6c]/10 dark:bg-sky-500/10 border border-[#0b4f6c]/20 dark:border-sky-400/20 text-[#0b4f6c] dark:text-sky-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>VaoSan Kick-ON Pro Manager • Quy Trình Onboarding Chủ Sân</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Khởi Tạo & Cấu Hình Cụm Sân (Stadium Setup Wizard)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Thiết lập danh mục ca sân, tọa độ GPS PostGIS và tích hợp VietQR tự động khóa slot sau 1s.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right hidden sm:block text-xs">
            <span className="font-extrabold text-slate-900 dark:text-white block">Trần Hữu Nam</span>
            <span className="text-slate-400 font-medium">Hotline Hỗ Trợ: 1900 6886</span>
          </div>
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700"
          >
            Lưu Nháp & Thoát
          </button>
        </div>
      </div>

      {/* STEPPER BAR (4 BƯỚC NỔI BẬT) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Tiến trình hoàn tất: <strong className="text-emerald-500 font-mono text-sm">50% HOÀN TẤT</strong></span>
          <span>Ước tính thời gian còn lại: ~ 3 phút</span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${currentStep * 25}%` }}
          />
        </div>

        {/* Stepper Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
              currentStep === 1
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-[#0b4f6c] shadow-md"
                : currentStep > 1
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              currentStep > 1 ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800"
            }`}>
              {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">Bước 1</span>
              <span className="text-xs font-extrabold block leading-tight">Hồ Sơ & GPS PostGIS</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
              currentStep === 2
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-[#0b4f6c] shadow-md"
                : currentStep > 2
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              currentStep > 2 ? "bg-emerald-500 text-white" : currentStep === 2 ? "bg-white text-slate-900" : "bg-slate-200 dark:bg-slate-800"
            }`}>
              {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">Bước 2</span>
              <span className="text-xs font-extrabold block leading-tight">Khai Báo Sân & Biểu Giá</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
              currentStep === 3
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-[#0b4f6c] shadow-md"
                : currentStep > 3
                ? "bg-emerald-500/10 border-emerald-400 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              currentStep > 3 ? "bg-emerald-500 text-white" : currentStep === 3 ? "bg-white text-slate-900" : "bg-slate-200 dark:bg-slate-800"
            }`}>
              {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">Bước 3</span>
              <span className="text-xs font-extrabold block leading-tight">VietQR & Cọc Tự Động</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
              currentStep === 4
                ? "bg-[#0b4f6c] dark:bg-sky-500 text-white dark:text-slate-950 border-[#0b4f6c] shadow-md"
                : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-xs shrink-0">
              4
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold block opacity-80">Bước 4</span>
              <span className="text-xs font-extrabold block leading-tight">AI Dynamic & Nhận Khách</span>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1 CONTENT: STADIUM PROFILE & GPS POSTGIS */}
      {currentStep === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Bước 1/4: Hồ Sơ Cụm Sân & Tọa Độ GPS PostGIS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Tên Cụm Sân Thể Thao:</label>
              <input
                type="text"
                value={stadiumProfile.name}
                onChange={(e) => setStadiumProfile({ ...stadiumProfile, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#0b4f6c]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Số Điện Thoại Quản Lý / Hotline:</label>
              <input
                type="text"
                value={stadiumProfile.phone}
                onChange={(e) => setStadiumProfile({ ...stadiumProfile, phone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#0b4f6c]"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Địa Chỉ Địa Lý Chi Tiết:</label>
              <input
                type="text"
                value={stadiumProfile.address}
                onChange={(e) => setStadiumProfile({ ...stadiumProfile, address: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-[#0b4f6c]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Tọa Độ PostGIS GPS (Vĩ Độ - Lat):</span>
                <span className="text-[10px] text-emerald-500 font-bold">PostGIS Verified</span>
              </label>
              <input
                type="text"
                value={stadiumProfile.lat}
                onChange={(e) => setStadiumProfile({ ...stadiumProfile, lat: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Tọa Độ PostGIS GPS (Kinh Độ - Lng):</label>
              <input
                type="text"
                value={stadiumProfile.lng}
                onChange={(e) => setStadiumProfile({ ...stadiumProfile, lng: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 CONTENT: PITCH MATRIX & CA CONFIG (STITCH EXACT SPEC) */}
      {currentStep === 2 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Bước 2/4: Khai Báo Danh Mục Sân & Cấu Hình Biểu Giá Ca</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Đã gắn vị trí GPS PostGIS: 10.7482° N, 106.7214° E (Q.7, TP.HCM)</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Sân Mới</span>
            </button>
          </div>

          {/* COURT MATRIX TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 font-extrabold text-slate-700 dark:text-slate-300">
                  <th className="p-3">Tên Sân Con</th>
                  <th className="p-3">Bộ Môn</th>
                  <th className="p-3">Mặt Sân / Thảm</th>
                  <th className="p-3">Giá Giờ Thường</th>
                  <th className="p-3">Giá Giờ Vàng (17:30 - 20:30)</th>
                  <th className="p-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pitches.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium">
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{p.sport}</td>
                    <td className="p-3 text-slate-500">{p.surface}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{p.normalPrice.toLocaleString()}đ</td>
                    <td className="p-3 font-mono font-extrabold text-emerald-500">{p.peakPrice.toLocaleString()}đ</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-400/20">
                        Sẵn Sàng
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 3 CONTENT: VIETQR INTEGRATION */}
      {currentStep === 3 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <QrCode className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400" />
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Bước 3/4: Tích Hợp VietQR Napas247 Nhận Cọc Tự Động</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Chọn Ngân Hàng Thụ Hưởng:</label>
                <select
                  value={vietQRInfo.bank}
                  onChange={(e) => setVietQRInfo({ ...vietQRInfo, bank: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                >
                  <option>Vietcombank (VCB)</option>
                  <option>MBBank (Quân Đội)</option>
                  <option>Techcombank (TCB)</option>
                  <option>VietinBank</option>
                  <option>BIDV</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Số Tài Khoản Ngân Hàng:</label>
                <input
                  type="text"
                  value={vietQRInfo.accountNumber}
                  onChange={(e) => setVietQRInfo({ ...vietQRInfo, accountNumber: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Tên Chủ Tài Khoản (In hoa không dấu):</label>
                <input
                  type="text"
                  value={vietQRInfo.accountName}
                  onChange={(e) => setVietQRInfo({ ...vietQRInfo, accountName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-700 dark:text-slate-300">Tỷ Lệ Đặt Cọc Khóa Slot Tự Động:</label>
                <div className="grid grid-cols-3 gap-2">
                  {["30%", "50%", "100%"].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setVietQRInfo({ ...vietQRInfo, depositRate: rate })}
                      className={`p-2.5 rounded-xl border font-bold text-center transition-all ${
                        vietQRInfo.depositRate === rate
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {rate} {rate === "50%" ? "(Khuyên Dùng)" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PREVIEW VIETQR CARD */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mẫu Mã VietQR Tự Động Đã Kích Hoạt</span>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=VIETQR_ONBOARDING_${vietQRInfo.accountNumber}`}
                alt="VietQR Onboarding Preview"
                className="w-48 h-48 mx-auto object-contain rounded-xl border p-2 bg-white"
              />
              <p className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                {vietQRInfo.accountName} • {vietQRInfo.accountNumber} ({vietQRInfo.bank})
              </p>
              <p className="text-[11px] text-emerald-500 font-bold">
                Tự động kiểm tra giao dịch Napas247 & khóa lịch tức thì trong 1s
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 CONTENT: AI DYNAMIC PRICING & GO LIVE */}
      {currentStep === 4 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-3xl border border-emerald-400/30">
            🎉
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Khởi Tạo Cụm Sân Thành Công!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hệ thống VaoSan đã kết nối xong tọa độ PostGIS, danh mục {pitches.length} sân con và mã nhận cọc VietQR Napas247 cho <strong className="text-slate-900 dark:text-white">{stadiumProfile.name}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 max-w-md mx-auto text-xs text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 dark:text-white">Bật AI Dynamic Pricing Tự Động:</span>
              <button
                type="button"
                onClick={() => setAiPricingEnabled(!aiPricingEnabled)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  aiPricingEnabled ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-700"
                }`}
              >
                {aiPricingEnabled ? "Đã Kích Hoạt" : "Tắt"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Thuật toán AI tự động tăng +20% giờ vàng và giảm -15% giờ vắng mưa rào giúp tối ưu tỷ lệ lấp đầy đạt &gt;90%.
            </p>
          </div>

          <button
            type="button"
            onClick={onComplete}
            className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-xl active:scale-95"
          >
            Mở Cửa Nhận Khách & Chuyển Tới Dashboard Quản Lý →
          </button>
        </div>
      )}

      {/* BOTTOM STICKY ACTION BAR (STITCH SPEC) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-40"
        >
          ← Quay Lại Bước {Math.max(1, currentStep - 1)}
        </button>

        <span className="text-[11px] text-slate-400 font-medium">Đã tự động lưu nháp 20 giây trước</span>

        <button
          type="button"
          onClick={() => {
            if (currentStep < 4) setCurrentStep(currentStep + 1);
            else if (onComplete) onComplete();
          }}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
        >
          <span>
            {currentStep === 4 ? "Hoàn Tất & Mở Cửa Nhận Khách Ngay" : `Lưu & Tiếp Tục Sang Bước ${currentStep + 1} →`}
          </span>
        </button>
      </div>

      {/* ADD NEW PITCH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl animate-modal-pop">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Thêm Sân Mới Vào Cụm</h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tên Sân Con:</label>
                <input
                  type="text"
                  value={newPitchName}
                  onChange={(e) => setNewPitchName(e.target.value)}
                  placeholder="VD: Sân 7C, Sân PB-03"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Bộ Môn Thể Thao:</label>
                <select
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold text-slate-900 dark:text-white"
                >
                  <option>Bóng đá 7 người</option>
                  <option>Bóng đá 5 người</option>
                  <option>Pickleball Pro</option>
                  <option>Cầu lông Yonex</option>
                  <option>Tennis</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Giá Giờ Thường:</label>
                  <input
                    type="number"
                    value={newNormalPrice}
                    onChange={(e) => setNewNormalPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Giá Giờ Vàng:</label>
                  <input
                    type="number"
                    value={newPeakPrice}
                    onChange={(e) => setNewPeakPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold text-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddPitch}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-md"
              >
                Xác Nhận Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
