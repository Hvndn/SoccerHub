import React, { useState, useEffect } from "react";
import { toastErr } from "@/lib/toast";
import { pitchTypeLabel } from "@/lib/pitchLabels";
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
 PhoneCall,
 Trash2,
 Loader2
} from "lucide-react";
import { createPitchApi, getMyPitchesApi, deletePitchApi } from "@/lib/pitchService";

interface StadiumOwnerOnboardingProps {
 onComplete?: () => void;
 onBackToHome?: () => void;
}

export default function StadiumOwnerOnboarding({
 onComplete,
 onBackToHome
}: StadiumOwnerOnboardingProps) {
 const [currentStep, setCurrentStep] = useState(1); // Step 1 is active by default

 // Form States — để trống, chủ sân tự khai báo (không điền sẵn dữ liệu mẫu)
 const [stadiumProfile, setStadiumProfile] = useState({
 name: "",
 address: "",
 lat: "",
 lng: "",
 openHours: "14:00 - 22:30",
 phone: ""
 });

 const [pitches, setPitches] = useState<any[]>([]);

 const [loadingPitches, setLoadingPitches] = useState(false);
 const [submittingPitch, setSubmittingPitch] = useState(false);

 // Fetch real pitches from API on mount
 useEffect(() => {
 fetchMyPitches();
 }, []);

 const fetchMyPitches = async () => {
 setLoadingPitches(true);
 try {
 const data = await getMyPitchesApi();
 if (Array.isArray(data) && data.length > 0) {
 const mapped = data.map((item: any) => ({
 id: item.id,
 name: item.name,
 sport: item.pitchTypes?.[0] ? pitchTypeLabel(item.pitchTypes[0]) : "Chưa khai báo bộ môn",
 surface: item.amenities?.[0] ? `Tiện ích: ${item.amenities[0]}` : "Chưa khai báo mặt sân",
 normalPrice: item.avgPricePerHour || item.pricePerHour || 0,
 peakPrice: item.peakPricePerHour || item.avgPricePerHour || 0,
 status: item.status || "Ready"
 }));
 setPitches(mapped);
 }
 } catch (err) {
 // Không có sân hoặc chưa đăng nhập chủ sân → để trống, không bịa dữ liệu mẫu
 setPitches([]);
 } finally {
 setLoadingPitches(false);
 }
 };

 // Bước 3 không còn form tài khoản giả — xem nội dung "Chính Sách Thanh Toán" bên dưới

 // New Pitch Modal state
 const [showAddModal, setShowAddModal] = useState(false);

 // Form them san hien INLINE (khong popup) -> tu cuon toi khi mo.
 useEffect(() => {
  if (!showAddModal) return;
  const raf = requestAnimationFrame(() => {
   document.getElementById("inline-showaddmodal")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  return () => cancelAnimationFrame(raf);
 }, [showAddModal]);
 const [newPitchName, setNewPitchName] = useState("");
 const [newSport, setNewSport] = useState("Bóng đá 7 người");
 const [newNormalPrice, setNewNormalPrice] = useState(350000);
 const [newPeakPrice, setNewPeakPrice] = useState(600000);

 const handleAddPitch = async () => {
 if (!newPitchName) return;
 setSubmittingPitch(true);
 try {
 const created = await createPitchApi({
 name: newPitchName,
 avgPricePerHour: newNormalPrice,
 peakPricePerHour: newPeakPrice,
 address: stadiumProfile.address || undefined,
 phone: stadiumProfile.phone || undefined
 });

 setPitches((prev) => [
 ...prev,
 {
 id: created.id || Date.now(),
 name: created.name,
 sport: created.pitchTypes?.[0] ? pitchTypeLabel(created.pitchTypes[0]) : "Chưa khai báo bộ môn",
 surface: "Tiện ích: Chưa khai báo",
 normalPrice: created.avgPricePerHour || created.pricePerHour || newNormalPrice,
 peakPrice: created.peakPricePerHour || newPeakPrice,
 status: "Ready"
 }
 ]);
 setNewPitchName("");
 setShowAddModal(false);
 } catch (err: any) {
 toastErr(
 "Không thêm được sân vào CSDL: " +
 (err?.message || "kiểm tra lại đăng nhập chủ sân và kết nối máy chủ")
 );
 } finally {
 setSubmittingPitch(false);
 }
 };

 const [isFinalSubmitting, setIsFinalSubmitting] = useState(false);

 const handleFinalSubmit = async () => {
 if (!stadiumProfile.name.trim()) {
 toastErr("Bạn chưa nhập tên cụm sân ở Bước 1.");
 setCurrentStep(1);
 return;
 }
 setIsFinalSubmitting(true);
 let ok = false;
 try {
 const [openT, closeT] = (stadiumProfile.openHours || "").split("-").map((s) => s.trim());
 const created = await createPitchApi({
 name: stadiumProfile.name,
 address: stadiumProfile.address,
 phone: stadiumProfile.phone || undefined,
 latitude: stadiumProfile.lat ? Number(stadiumProfile.lat) : undefined,
 longitude: stadiumProfile.lng ? Number(stadiumProfile.lng) : undefined,
 openTime: openT || undefined,
 closeTime: closeT || undefined,
 description: stadiumProfile.address
 ? `Cụm sân mở cửa ${stadiumProfile.openHours}.`
 : undefined
 });
 ok = true;
 // Nạp lại danh sách sân thật sau khi tạo
 await fetchMyPitches();
 } catch (err: any) {
 toastErr("Không lưu được cụm sân vào CSDL: " + (err?.message || "lỗi máy chủ"));
 } finally {
 setIsFinalSubmitting(false);
 if (ok && onComplete) onComplete();
 }
 };

 const handleDeletePitch = async (id: number) => {
 try {
 await deletePitchApi(id);
 } catch (e) {
 // ignore
 }
 setPitches((prev) => prev.filter((p) => p.id !== id));
 };

 return (
 <div className="space-y-4 sm:space-y-8 animate-fade-in-up">
 {/* TOP NAV BAR HEADER */}
 <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
 <div>
 <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/20 text-[#0b4f6c] text-[13px] font-bold mb-2">
 <ShieldCheck className="w-4 h-4" />
 <span>Turfzone • Quy Trình Onboarding Chủ Sân</span>
 </div>
 <h1 className="text-lg sm:text-3xl font-black text-slate-900 tracking-tight">
 Khởi Tạo & Cấu Hình Cụm Sân (Stadium Setup Wizard)
 </h1>
 <p className="text-[13px] sm:text-sm text-slate-500 font-medium mt-0.5">
 Khai báo hồ sơ, tọa độ GPS, danh mục sân và mở ca nhận khách — dữ liệu lưu thẳng vào hệ thống.
 </p>
 </div>

 <div className="flex items-center space-x-3 shrink-0">
 <div className="text-right hidden sm:block text-[13px]">
 <span className="font-extrabold text-slate-900 block">Hỗ trợ chủ sân</span>
 <span className="text-slate-500 font-medium">Xem tab "Quản Lý Cụm Sân & Doanh Thu"</span>
 </div>
 <button
 type="button"
 onClick={onBackToHome}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] border border-slate-200 "
 >
 Lưu Nháp & Thoát
 </button>
 </div>
 </div>

 {/* STEPPER BAR (4 BƯỚC NỔI BẬT) */}
 <div className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-4">
 <div className="flex items-center justify-between text-[13px] font-bold text-slate-500">
 <span>Tiến trình hoàn tất: <strong className="text-emerald-500 font-mono text-sm">{currentStep * 25}% HOÀN TẤT</strong></span>
 <span>Bước {currentStep} / 4</span>
 </div>

 {/* Progress Bar Track */}
 <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 ">
 <div
 className="bg-[#0369a1] h-full rounded-full transition-all duration-500"
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
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md"
 : currentStep > 1
 ? "bg-[#0369a1]/10 border-sky-400 text-sky-700 "
 : "bg-slate-50 border-slate-200 text-slate-500"
 }`}
 >
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[13px] shrink-0 ${
 currentStep > 1 ? "bg-[#0369a1] text-white" : "bg-slate-200 "
 }`}>
 {currentStep > 1 ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
 </div>
 <div>
 <span className="text-[13px] font-bold block opacity-80">Bước 1</span>
 <span className="text-[13px] font-extrabold block leading-tight">Hồ Sơ &amp; Địa Chỉ</span>
 </div>
 </button>

 <button
 type="button"
 onClick={() => setCurrentStep(2)}
 className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
 currentStep === 2
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md"
 : currentStep > 2
 ? "bg-[#0369a1]/10 border-sky-400 text-sky-700 "
 : "bg-slate-50 border-slate-200 text-slate-500"
 }`}
 >
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[13px] shrink-0 ${
 currentStep > 2 ? "bg-[#0369a1] text-white" : currentStep === 2 ? "bg-white text-slate-900" : "bg-slate-200 "
 }`}>
 {currentStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
 </div>
 <div>
 <span className="text-[13px] font-bold block opacity-80">Bước 2</span>
 <span className="text-[13px] font-extrabold block leading-tight">Khai Báo Sân & Biểu Giá</span>
 </div>
 </button>

 <button
 type="button"
 onClick={() => setCurrentStep(3)}
 className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
 currentStep === 3
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md"
 : currentStep > 3
 ? "bg-[#0369a1]/10 border-sky-400 text-sky-700 "
 : "bg-slate-50 border-slate-200 text-slate-500"
 }`}
 >
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[13px] shrink-0 ${
 currentStep > 3 ? "bg-[#0369a1] text-white" : currentStep === 3 ? "bg-white text-slate-900" : "bg-slate-200 "
 }`}>
 {currentStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
 </div>
 <div>
 <span className="text-[13px] font-bold block opacity-80">Bước 3</span>
 <span className="text-[13px] font-extrabold block leading-tight">Chính Sách Thanh Toán</span>
 </div>
 </button>

 <button
 type="button"
 onClick={() => setCurrentStep(4)}
 className={`p-3.5 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
 currentStep === 4
 ? "bg-[#0369a1] text-white border-[#0369a1] shadow-md"
 : "bg-slate-50 border-slate-200 text-slate-500"
 }`}
 >
 <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center font-black text-[13px] shrink-0">
 4
 </div>
 <div>
 <span className="text-[13px] font-bold block opacity-80">Bước 4</span>
 <span className="text-[13px] font-extrabold block leading-tight">Kiểm Tra &amp; Mở Cửa</span>
 </div>
 </button>
 </div>
 </div>

 {/* STEP 1 CONTENT: STADIUM PROFILE & GPS POSTGIS */}
 {currentStep === 1 && (
 <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6">
 <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
 <Building className="w-5 h-5 text-[#0b4f6c] " />
 <h2 className="font-extrabold text-lg text-slate-900 ">Bước 1/4: Hồ Sơ Cụm Sân &amp; Tọa Độ GPS</h2>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 text-[13px]">
 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-700 ">Tên Cụm Sân Thể Thao:</label>
 <input
 type="text"
 value={stadiumProfile.name}
 onChange={(e) => setStadiumProfile({ ...stadiumProfile, name: e.target.value })}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-700 ">Số Điện Thoại Quản Lý / Hotline:</label>
 <input
 type="text"
 value={stadiumProfile.phone}
 onChange={(e) => setStadiumProfile({ ...stadiumProfile, phone: e.target.value })}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>

 <div className="md:col-span-2 space-y-1.5">
 <label className="font-extrabold text-slate-700 ">Địa Chỉ Địa Lý Chi Tiết:</label>
 <input
 type="text"
 value={stadiumProfile.address}
 onChange={(e) => setStadiumProfile({ ...stadiumProfile, address: e.target.value })}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-[#0369a1]"
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-700 flex items-center justify-between">
 <span>Tọa Độ GPS (Vĩ Độ - Lat):</span>
 <span className="text-[13px] text-slate-500 font-bold">Tùy chọn</span>
 </label>
 <input
 type="text"
 value={stadiumProfile.lat}
 onChange={(e) => setStadiumProfile({ ...stadiumProfile, lat: e.target.value })}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 "
 />
 </div>

 <div className="space-y-1.5">
 <label className="font-extrabold text-slate-700 ">Tọa Độ GPS (Kinh Độ - Lng):</label>
 <input
 type="text"
 value={stadiumProfile.lng}
 onChange={(e) => setStadiumProfile({ ...stadiumProfile, lng: e.target.value })}
 className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 "
 />
 </div>
 </div>
 </div>
 )}

 {/* STEP 2 CONTENT: PITCH MATRIX & CA CONFIG (STITCH EXACT SPEC) */}
 {currentStep === 2 && (
 <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6">
 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
 <div>
 <h2 className="font-extrabold text-lg text-slate-900 ">Bước 2/4: Khai Báo Danh Mục Sân & Cấu Hình Biểu Giá Ca</h2>
 <p className="text-[13px] text-slate-500">
 {stadiumProfile.lat && stadiumProfile.lng
 ? `Tọa độ đã khai báo: ${stadiumProfile.lat}, ${stadiumProfile.lng}`
 : "Chưa khai báo tọa độ GPS — có thể bỏ trống."}
 </p>
 </div>

 <button
 type="button"
 onClick={() => setShowAddModal(true)}
 className="px-4 py-2 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] shadow-md flex items-center space-x-1.5 transition-all shrink-0"
 >
 <Plus className="w-4 h-4" />
 <span>+ Thêm Sân Mới</span>
 </button>
 </div>

 {/* COURT MATRIX TABLE */}
 <div className="overflow-x-auto">
 <table className="w-full text-left text-[13px] divide-y divide-slate-100 ">
 <thead>
 <tr className="bg-slate-50 font-extrabold text-slate-700 ">
 <th className="p-3">Tên Sân Con</th>
 <th className="p-3">Bộ Môn</th>
 <th className="p-3">Mặt Sân / Thảm</th>
 <th className="p-3">Giá Giờ Thường</th>
 <th className="p-3">Giá Giờ Vàng (17:30 - 20:30)</th>
 <th className="p-3">Trạng Thái</th>
 <th className="p-3 text-right">Thao Tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {loadingPitches ? (
 <tr>
 <td colSpan={7} className="p-4 sm:p-6 text-center text-slate-500 font-bold">
 <div className="flex items-center justify-center space-x-2">
 <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
 <span>Đang tải danh sách sân từ hệ thống database...</span>
 </div>
 </td>
 </tr>
 ) : pitches.length === 0 ? (
 <tr>
 <td colSpan={7} className="p-4 sm:p-6 text-center text-slate-500 font-bold">
 Chưa có sân bóng nào. Hãy bấm "+ Thêm Sân Mới" để tạo sân đầu tiên.
 </td>
 </tr>
 ) : (
 pitches.map((p) => (
 <tr key={p.id} className="hover:bg-slate-50 font-medium">
 <td className="p-3 font-extrabold text-slate-900 ">{p.name}</td>
 <td className="p-3 text-slate-600 ">{p.sport}</td>
 <td className="p-3 text-slate-500">{p.surface}</td>
 <td className="p-3 font-mono font-bold text-slate-900 ">{p.normalPrice.toLocaleString()}đ</td>
 <td className="p-3 font-mono font-extrabold text-emerald-500">{p.peakPrice.toLocaleString()}đ</td>
 <td className="p-3">
 <span className="px-2 py-0.5 rounded-full text-[13px] font-bold bg-[#0369a1]/10 text-emerald-500 border border-sky-400/20">
 Sẵn Sàng
 </span>
 </td>
 <td className="p-3 text-right">
 <button
 type="button"
 onClick={() => handleDeletePitch(p.id)}
 className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
 title="Xóa sân"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* STEP 3 CONTENT: CHÍNH SÁCH THANH TOÁN */}
 {currentStep === 3 && (
 <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6">
 <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
 <QrCode className="w-5 h-5 text-[#0b4f6c] " />
 <h2 className="font-extrabold text-lg text-slate-900 ">Bước 3/4: Chính Sách Thanh Toán &amp; Tiền Cọc</h2>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 text-[13px]">
 <div className="space-y-3">
 <p className="text-[13px] text-slate-500">
 Hệ thống không giữ tiền giúp bạn — luồng thanh toán trong Turfzone chạy như sau:
 </p>
 {[
 { t: "1. Khách đặt ca", d: "Khách chọn khung giờ trống, hệ thống sinh đơn giữ chỗ trong CSDL, ca đó chuyển sang trạng thái Đã Đặt." },
 { t: "2. Thu tiền theo quy định của sân", d: "Khách trả trực tiếp tại quầy hoặc chuyển khoản theo thông tin tài khoản chủ sân tự công bố. Turfzone không can thiệp số tiền này." },
 { t: "3. Check-in khi khách tới", d: "Chủ sân mở mã đơn ở tab Quản Lý Cụm Sân để xác nhận khách đã tới và bàn giao ca." },
 { t: "4. Hủy ca", d: "Nếu khách không tới, chủ sân hủy đơn để ca trở lại trạng thái trống cho người khác đặt." }
 ].map((s) => (
 <div key={s.t} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 ">
 <p className="font-extrabold text-slate-900 ">{s.t}</p>
 <p className="text-[13px] text-slate-500 mt-1">{s.d}</p>
 </div>
 ))}
 </div>

 <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-3 text-left">
 <span className="text-[13px] font-bold text-slate-500 block">Gợi ý khai báo cho khách hàng</span>
 <div className="space-y-2 text-[13px] text-slate-600 ">
 <p>• Ghi rõ mức cọc (nếu có) và chính sách hoàn cọc trong phần <strong>Mô tả sân</strong> ở Bước 1 hoặc tab quản lý.</p>
 <p>• Đăng số tài khoản nhận tiền ở phần mô tả sân.</p>
 <p>• Ca giờ vàng nên để giá cao hơn giờ thường.</p>
 </div>
 <p className="text-[13px] text-sky-700 font-bold pt-2 border-t border-slate-100 ">
 Mọi thay đổi giá và cọc được lưu ngay vào CSDL.
 </p>
 </div>
 </div>
 </div>
 )}

 {/* STEP 4 CONTENT: KIỂM TRA & MỞ CỬA NHẬN KHÁCH */}
 {currentStep === 4 && (
 <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-3 sm:space-y-6 text-center">
 <div className="w-16 h-16 rounded-2xl sm:rounded-3xl bg-[#0369a1]/10 text-emerald-500 flex items-center justify-center mx-auto text-3xl border border-sky-400/30">
 🏟️
 </div>
 <div className="space-y-2 max-w-xl mx-auto">
 <h2 className="text-lg sm:text-2xl font-black text-slate-900 ">Sẵn Sàng Mở Cửa Nhận Khách</h2>
 <p className="text-[13px] text-slate-500 font-medium">
 Bấm nút bên dưới để lưu cụm sân vào hệ thống. Sau đó thêm sân con và biểu giá ở tab
 "Quản Lý Cụm Sân &amp; Doanh Thu".
 </p>
 </div>

 <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 max-w-md mx-auto text-[13px] text-left space-y-2">
 {[
 ["Tên cụm sân", stadiumProfile.name || "Chưa nhập (bắt buộc)"],
 ["Địa chỉ", stadiumProfile.address || "Chưa khai báo"],
 ["Số điện thoại", stadiumProfile.phone || "Chưa khai báo"],
 ["Giờ mở cửa", stadiumProfile.openHours || "14:00 - 22:30"],
 ["Sân đã khai báo", `${pitches.length} sân`]
 ].map(([k, v]) => (
 <div key={k} className="flex items-center justify-between gap-3">
 <span className="font-extrabold text-slate-900 ">{k}:</span>
 <span className="text-slate-500 truncate">{v}</span>
 </div>
 ))}
 </div>

 <button
 type="button"
 onClick={handleFinalSubmit}
 disabled={isFinalSubmitting}
 className="px-5 py-3 sm:px-8 sm:py-3.5 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-2 mx-auto disabled:opacity-50"
 >
 {isFinalSubmitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 <span>Đang Lưu Cụm Sân Vào CSDL...</span>
 </>
 ) : (
 <span>Mở Cửa Nhận Khách & Chuyển Tới Dashboard Quản Lý →</span>
 )}
 </button>
 </div>
 )}

 {/* BOTTOM STICKY ACTION BAR (STITCH SPEC) */}
 <div className="glass-panel p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
 <button
 type="button"
 onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
 disabled={currentStep === 1}
 className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[13px] disabled:opacity-40"
 >
 ← Quay Lại Bước {Math.max(1, currentStep - 1)}
 </button>

 <span className="text-[13px] text-slate-500 font-medium hidden sm:inline">Dữ liệu được lưu khi bạn bấm "Lưu &amp; Tiếp Tục"</span>

 <button
 type="button"
 onClick={() => {
 if (currentStep < 4) setCurrentStep(currentStep + 1);
 else handleFinalSubmit();
 }}
 disabled={isFinalSubmitting}
 className="px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] transition-all shadow-md active:scale-95 flex items-center space-x-1.5 disabled:opacity-50"
 >
 {isFinalSubmitting ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 <span>Đang Lưu CSDL...</span>
 </>
 ) : (
 <>
 <span className="sm:hidden">
 {currentStep === 4 ? "Hoàn Tất & Mở Cửa" : `Tiếp Tục Sang Bước ${currentStep + 1} →`}
 </span>
 <span className="hidden sm:inline">
 {currentStep === 4 ? "Hoàn Tất & Mở Cửa Nhận Khách Ngay" : `Lưu & Tiếp Tục Sang Bước ${currentStep + 1} →`}
 </span>
 </>
 )}
 </button>
 </div>

 {/* ADD NEW PITCH MODAL */}
 {showAddModal && (
 <div id="inline-showaddmodal" className="w-full animate-fade-in">
 <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl max-w-md w-full border border-slate-200 space-y-3 sm:space-y-4 shadow-sm">
 <h3 className="font-extrabold text-base text-slate-900 ">Thêm Sân Mới Vào Cụm</h3>
 <div className="space-y-3 text-[13px]">
 <div className="space-y-1">
 <label className="font-bold text-slate-700 ">Tên Sân Con:</label>
 <input
 type="text"
 value={newPitchName}
 onChange={(e) => setNewPitchName(e.target.value)}
 placeholder="VD: Sân 7C, Sân PB-03"
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 "
 />
 </div>
 <div className="space-y-1">
 <label className="font-bold text-slate-700 ">Bộ Môn Thể Thao:</label>
 <select
 value={newSport}
 onChange={(e) => setNewSport(e.target.value)}
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 "
 >
 <option>Bóng đá 7 người (Sân Cỏ Nhân Tạo)</option>
 <option>Bóng đá 5 người (Sân Cỏ Nhân Tạo)</option>
 <option>Bóng đá 11 người (Sân Cỏ Tự Nhiên)</option>
 <option>Bóng đá Futsal (Sân Trong Nhà)</option>
 </select>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <div className="space-y-1">
 <label className="font-bold text-slate-700 ">Giá Giờ Thường:</label>
 <input
 type="number"
 value={newNormalPrice}
 onChange={(e) => setNewNormalPrice(Number(e.target.value))}
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 "
 />
 </div>
 <div className="space-y-1">
 <label className="font-bold text-slate-700 ">Giá Giờ Vàng:</label>
 <input
 type="number"
 value={newPeakPrice}
 onChange={(e) => setNewPeakPrice(Number(e.target.value))}
 className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-emerald-500"
 />
 </div>
 </div>
 </div>

 <div className="flex space-x-2 pt-2">
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-[13px]"
 >
 Hủy
 </button>
 <button
 type="button"
 disabled={submittingPitch}
 onClick={handleAddPitch}
 className="flex-1 py-2.5 rounded-xl bg-[#0369a1] text-white font-extrabold text-[13px] shadow-md disabled:opacity-50 flex items-center justify-center space-x-1"
 >
 {submittingPitch && <Loader2 className="w-4 h-4 animate-spin" />}
 <span>{submittingPitch ? "Đang Lưu..." : "Xác Nhận Thêm"}</span>
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
