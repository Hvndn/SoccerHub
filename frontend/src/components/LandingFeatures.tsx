"use client";

import React from "react";
import Reveal from "./Reveal";
import {
 ShieldCheck,
 Users,
 Trophy,
 Activity,
 Zap,
 MapPin,
 TrendingUp,
 BrainCircuit,
 QrCode,
 ArrowRight,
 CheckCircle2,
 XCircle,
 PhoneOff,
 Lightbulb,
 Smartphone,
 Store,
 Clock,
 Sparkles,
 Award,
 ChevronRight
} from "lucide-react";

interface LandingFeaturesProps {
 onExplore: (role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
 onNavigateTab?: (tab: string) => void;
}

export default function LandingFeatures({ onExplore, onNavigateTab }: LandingFeaturesProps) {
 // 4 Core Pillars of Graduation Thesis
 const pillars = [
 {
 id: "booking",
 title: "Cầu Thủ & Đội Bóng",
 subtitle: "Đặt Sân & Chống Trùng Ca",
 badge: "Cầu Thủ",
 icon: Users,
 gradient: "from-[#0369a1] to-[#075985]",
 accentColor: "text-sky-400",
 points: [
 {
 title: "Tìm sân theo khu vực & khung giờ",
 desc: "Ca trống cập nhật trực tiếp từ CSDL."
 },
 {
 title: "Chống trùng ca khi đặt",
 desc: "Ca có đơn chuyển sang Đã Đặt."
 },
 {
 title: "Cọc 50% hoặc 100% qua VietQR",
 desc: "Chính sách hoàn cọc hiển thị trước khi xác nhận."
 }
 ],
 metricLabel: "Luồng đặt sân:",
 metricValue: "3 Bước Trên Web"
 },
 {
 id: "iot",
 title: "Chủ Sân & Quản Lý Doanh Thu",
 subtitle: "Ca Sân, Giá Thuê & Tiền Cọc",
 badge: "Chủ Sân",
 icon: ShieldCheck,
 gradient: "from-emerald-700 to-teal-600",
 accentColor: "text-emerald-400",
 points: [
 {
 title: "Nhập giá ca sân & tiền cọc",
 desc: "Chủ sân tự đặt giá theo khung giờ."
 },
 {
 title: "Nhãn giờ vàng theo khung giờ cao điểm",
 desc: "Để chủ sân điều chỉnh giá ca chiều/tối."
 },
 {
 title: "Bảng doanh thu & sổ cọc",
 desc: "Thống kê từ đơn đặt thật, đối soát cọc khi check-in."
 }
 ],
 metricLabel: "Giá & tiền cọc:",
 metricValue: "Do Chủ Sân Tự Khai"
 },
 {
 id: "tournament",
 title: "Ban Tổ Chức Giải Đấu",
 subtitle: "Giải Đấu Số Hóa Chuẩn VFF",
 badge: "Giải Đấu VFF",
 icon: Trophy,
 gradient: "from-amber-600 to-orange-600",
 accentColor: "text-amber-400",
 points: [
 {
 title: "Tự Động Xếp Lịch & Nhánh Loại",
 desc: "Nhập đội, hệ thống tự sinh bảng đấu và nhánh loại."
 },
 {
 title: "Cập nhật tỷ số & Vua Phá Lưới",
 desc: "Nhập tỷ số, hệ thống tự cập nhật BXH và danh sách ghi bàn."
 },
 {
 title: "Lệ phí đội & quy định phạt minh bạch",
 desc: "Khai báo lệ phí và quy định phạt thẻ trong hồ sơ giải."
 }
 ],
 metricLabel: "Khởi tạo một giải:",
 metricValue: "Vài Phút Trên Web"
 },
 {
 id: "ai-form",
 title: "Chợ Kèo & Phong Độ Thi Đấu",
 subtitle: "Ghép Đối Thủ Theo Trình Độ",
 badge: "Cộng Đồng",
 icon: BrainCircuit,
 gradient: "from-purple-700 to-indigo-600",
 accentColor: "text-purple-400",
 points: [
 {
 title: "Lịch Sử Thi Đấu Theo Từng Trận",
 desc: "Kết quả giải tự tổng hợp thành chuỗi phong độ 5 trận."
 },
 {
 title: "Chợ Kèo Đăng & Nhận Đối Thủ",
 desc: "Đăng kèo lên chợ, đội khác bấm nhận là khớp."
 },
 {
 title: "Hồ Sơ & Thống Kê Cầu Thủ",
 desc: "Theo dõi phong độ, bậc và lịch sử thi đấu."
 }
 ],
 metricLabel: "Nguồn phong độ:",
 metricValue: "Kết Quả Giải Đấu"
 }
 ];

 // Direct Comparison (Traditional vs Turfzone)
 const traditionalIssues = [
 {
 title: "Sổ tay & nhắn Zalo dễ trùng giờ",
 desc: "Chủ sân ghi nhầm ca khi nhiều khách gọi cùng lúc."
 },
 {
 title: "Đèn bật lãng phí, quên tắt",
 desc: "Thất thoát 2–5 triệu tiền điện mỗi tháng."
 },
 {
 title: "Giao hữu lệch trình độ (bị out)",
 desc: "Không biết trình đối thủ, dễ thua 10-0 và mất tinh thần."
 },
 {
 title: "Vẽ nhánh & tính điểm mất nhiều ngày",
 desc: "Cộng điểm hiệu số bằng Excel, dễ sai và khiếu nại."
 }
 ];

 const platformAdvantages = [
 {
 title: "Đơn giữ chỗ lưu ngay trong CSDL",
 desc: "Không ai đặt trùng khung giờ."
 },
 {
 title: "Tiền cọc theo chính sách của từng sân",
 desc: "Cọc 50% hoặc 100% qua VietQR, xem chính sách hoàn cọc trước."
 },
 {
 title: "Bảng điều hành tập trung cho chủ sân",
 desc: "Sân con, ca sân, giá thuê và sổ cọc trong một màn hình."
 },
 {
 title: "Chợ kèo ghép đội theo phong độ",
 desc: "Đội nhận kèo được ghi thẳng vào hệ thống."
 }
 ];

 return (
 <div className="space-y-10 sm:space-y-24">
 {/* --- SECTION 1: 4 TRỤ CỘT ĐỀ TÀI (BENTO GRID) --- */}
 <section className="space-y-5 sm:space-y-8">
 <div className="text-center max-w-3xl mx-auto space-y-3">
 <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0369a1]/10 text-[#0b4f6c] text-[13px] font-black">
 <Sparkles className="w-3.5 h-3.5" />
 <span>Bốn Trụ Cột Đề Tài</span>
 </div>
 <h2 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight">
 Giải Pháp Toàn Diện Cho Thể Thao Số
 </h2>
 <p className="hidden sm:block text-[13px] sm:text-sm text-slate-600 leading-relaxed font-medium">
 Mượt mà từ tìm sân, cáp kèo, đặt cọc đến lúc giải đấu khai tiếng.
 </p>
 </div>

 {/* 4 Pillars Bento Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 lg:gap-8">
 {pillars.map((pillar, pi) => {
 const Icon = pillar.icon;
 return (
 <Reveal key={pillar.id} delay={pi * 80}>
 <div
 className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4 sm:space-y-6 group relative overflow-hidden h-full"
 >
 {/* Decorative Top Ambient Light */}
 <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${pillar.gradient} opacity-5 group-hover:opacity-10 blur-2xl transition-opacity pointer-events-none`} />

 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillar.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
 <Icon className="w-6 h-6" />
 </div>
 <span className="text-[13px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ">
 {pillar.badge}
 </span>
 </div>

 <div>
 <span className="text-[13px] font-bold text-slate-500">{pillar.title}</span>
 <h3 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
 {pillar.subtitle}
 </h3>
 </div>

 {/* Bullet Points */}
 <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
 {pillar.points.map((pt, idx) => (
 <div key={idx} className="flex items-start space-x-2.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <strong className="text-[13px] font-black text-slate-800 block">{pt.title}</strong>
 <p className="text-[13px] text-slate-500 leading-relaxed font-medium mt-0.5">
 {pt.desc}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Bottom Metric Strip */}
 <div className="pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between text-[13px] font-bold">
 <span className="text-slate-500">{pillar.metricLabel}</span>
 <span className="text-sky-700 font-black text-sm">
 {pillar.metricValue}
 </span>
 </div>
 </div>
 </Reveal>
 );
 })}
 </div>
 </section>

 {/* --- SECTION 2: DIRECT COMPARISON (TRUYỀN THỐNG VS Turfzone) --- */}
 <section className="w-full bg-slate-100/90 p-4 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-5 sm:space-y-8">
 <div className="text-center max-w-2xl mx-auto space-y-2">
 <span className="text-[13px] font-extrabold text-[#0b4f6c] block">
 So Sánh Đột Phá
 </span>
 <h2 className="text-xl sm:text-4xl font-black text-slate-900 tracking-tight">
 Vì Sao Chọn Turfzone?
 </h2>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
 {/* Traditional Issues Card */}
 <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-rose-200 space-y-4 sm:space-y-5 shadow-sm">
 <div className="flex items-center justify-between pb-3 border-b border-slate-100 ">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
 <PhoneOff className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-extrabold text-slate-900 text-base">Phương Thức Truyền Thống</h3>
 <p className="text-[13px] text-slate-500 font-medium">Ghi sổ tay, nhắn tin Zalo, giữ chỗ bằng miệng</p>
 </div>
 </div>
 <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[13px]">
 Rủi ro cao
 </span>
 </div>

 <div className="space-y-2.5 sm:space-y-3.5">
 {traditionalIssues.map((item, idx) => (
 <div key={idx} className="flex items-start space-x-3 p-3 sm:p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 ">
 <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
 <div>
 <h4 className="text-[13px] font-extrabold text-slate-900 ">{item.title}</h4>
 <p className="text-[13px] text-slate-500 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Turfzone Smart Way Card */}
 <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-[#0369a1]/40 space-y-4 sm:space-y-5 shadow-xl relative overflow-hidden">
 <div className="flex items-center justify-between pb-3 border-b border-slate-100 ">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-2xl bg-[#0369a1] text-white flex items-center justify-center shrink-0 shadow-md">
 <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
 </div>
 <div>
 <h3 className="font-extrabold text-slate-900 text-base">Hệ Thống Thông Minh Turfzone</h3>
 <p className="text-[13px] text-[#0b4f6c] font-bold">Tự động hóa bằng công nghệ thể thao số</p>
 </div>
 </div>
 <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-extrabold text-[13px] border border-sky-200 ">
 Chuẩn xác 99.9%
 </span>
 </div>

 <div className="space-y-2.5 sm:space-y-3.5">
 {platformAdvantages.map((item, idx) => (
 <div key={idx} className="flex items-start space-x-3 p-3 sm:p-3.5 rounded-2xl bg-[#0369a1]/5 border border-[#0369a1]/15 ">
 <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
 <div>
 <h4 className="text-[13px] font-extrabold text-slate-900 ">{item.title}</h4>
 <p className="text-[13px] text-slate-600 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* --- SECTION 3: FINAL CALL TO ACTION BANNER --- */}
 <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-white text-slate-900 p-5 sm:p-14 border border-slate-200 shadow-2xl">
 <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
 <div className="inline-flex items-center space-x-2 px-4 py-1 rounded-full bg-[#0369a1]/10 border border-[#0369a1]/30 text-sky-700 text-[13px] font-extrabold">
 <Trophy className="w-3.5 h-3.5 text-amber-400" />
 <span>Đồ Án Tốt Nghiệp • Trải Nghiệm Thực Tế</span>
 </div>

 <h2 className="text-2xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
 Sẵn Sàng Trải Nghiệm Thể Thao Số?
 </h2>

 <p className="hidden sm:block text-[13px] sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
 Đặt sân tức thì, theo dõi doanh thu và tổ chức giải đấu chuyên nghiệp.
 </p>

 <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5">
 <button
 type="button"
 onClick={() => onExplore("PLAYER")}
 className="w-full sm:w-auto px-5 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[13px] sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
 >
 <Users className="w-4 h-4" />
 <span>Khám Phá Cổng Cầu Thủ</span>
 </button>

 <button
 type="button"
 onClick={() => onExplore("OWNER")}
 className="w-full sm:w-auto px-5 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-[13px] sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
 >
 <Store className="w-4 h-4 text-[#0b4f6c] " />
 <span>Dành Cho Chủ Sân</span>
 </button>

 <button
 type="button"
 onClick={() => onNavigateTab ? onNavigateTab("tournaments") : onExplore("ORGANIZER")}
 className="w-full sm:w-auto px-5 py-3 sm:px-7 sm:py-3.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-800 font-black text-[13px] sm:text-sm border border-emerald-600/40 transition-all transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
 >
 <Trophy className="w-4 h-4 text-amber-400" />
 <span>Xem Giải Đấu &amp; Cây Nhánh</span>
 </button>
 </div>
 </div>
 </section>
 </div>
 );
}
