"use client";

import React, { useState } from "react";
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
  Star,
  ArrowRight,
  CheckCircle2,
  XCircle,
  PhoneOff,
  Lightbulb,
  Smartphone,
  Store,
  Clock,
  Sparkles
} from "lucide-react";

interface LandingFeaturesProps {
  onExplore: () => void;
}

export default function LandingFeatures({ onExplore }: LandingFeaturesProps) {
  const [activeTab, setActiveTab] = useState<"comparison" | "flow">("comparison");

  const pillars = [
    {
      title: "Cầu Thủ & Đội Bóng",
      subtitle: "Đá bóng không gián đoạn",
      icon: Users,
      badge: "Player Ecosystem",
      points: [
        {
          icon: MapPin,
          label: "Bản đồ GPS PostGIS 500m",
          desc: "Quét toàn bộ cụm sân trống gần bạn nhất theo thời gian thực, đặt slot giữ chỗ ngay chỉ với 1 chạm."
        },
        {
          icon: BrainCircuit,
          label: "AI Ghép Đội • Chợ Kèo SOS",
          desc: "Thiếu người trước giờ bóng lăn? Thuật toán cân bằng Elo 1.400 - 1.500 tìm viện binh tương thích trong 15 phút."
        },
        {
          icon: ShieldCheck,
          label: "Ví Ký Quỹ Smart Escrow",
          desc: "Tiền cọc được bảo vệ tự động. Hoàn 100% nếu chủ sân báo sự cố hoặc mưa ngập hủy trận không tranh cãi."
        }
      ],
      metricLabel: "Thời gian khớp kèo TB:",
      metricValue: "11 phút 40 giây"
    },
    {
      title: "Chủ Sân & Quản Lý",
      subtitle: "Tự Động Hóa Vận Hành",
      icon: ShieldCheck,
      badge: "IoT & Revenue",
      points: [
        {
          icon: Zap,
          label: "IoT Dàn Đèn MQTT / ESP32",
          desc: "Bật tự động trước giờ đá 5 phút, tự ngắt khi hết giờ. Tiết kiệm ngay 25% chi phí điện thoại và điện năng."
        },
        {
          icon: TrendingUp,
          label: "Dynamic Pricing Thông Minh",
          desc: "Tự động hạ giá giờ ế kích cầu người chơi và tối ưu doanh thu tối đa trong các khung giờ cao điểm."
        },
        {
          icon: QrCode,
          label: "VietQR Đối Soát Tức Thì",
          desc: "Khách thanh toán cọc • hệ thống tự động chốt lịch. Không còn tình trạng bùng giờ hoặc trùng lịch ca."
        }
      ],
      metricLabel: "Tỷ lệ giảm chi phí điện:",
      metricValue: "-25.4% / tháng"
    },
    {
      title: "Ban Tổ Chức Giải Đấu",
      subtitle: "Giải Đấu Số Hóa Chuẩn VFF",
      icon: Trophy,
      badge: "Tournament Hub",
      points: [
        {
          icon: Trophy,
          label: "AI Phân Hạt Giống • Xếp Lịch",
          desc: "Bốc thăm chia bảng tự động, phân nhánh knock-out, tránh trùng giờ sân và chống va chạm lịch trọng tài."
        },
        {
          icon: Activity,
          label: "Biên Bản • BXH Live Realtime",
          desc: "Trọng tài nhập thẻ phạt, bàn thắng trên mobile. Cổ động viên và cầu thủ xem BXH cập nhật từng giây."
        },
        {
          icon: Users,
          label: "Tài Chính • Quỹ Giải Minh Bạch",
          desc: "Thu lệ phí qua Napas247, tự động trừ tiền thẻ vàng/đỏ và công khai thu chi giải đấu cho tất cả lãnh đội."
        }
      ],
      metricLabel: "Thời gian lập giải rút ngắn:",
      metricValue: "Từ 3 ngày → 15 phút"
    }
  ];

  const traditionalIssues = [
    {
      title: "Trùng lịch ca (Double-booking)",
      desc: "Nhân viên ghi sổ chép nhầm tên 2 đội vào 1 sân, dẫn đến cãi vã, mất mặt lãnh đội."
    },
    {
      title: "Bùng giờ, tranh chấp cọc",
      desc: "Đội khách bùng giờ không đền bù, hoặc mưa to chủ sân không chịu hoàn cọc."
    },
    {
      title: "Quên tắt đèn & lãng phí điện năng",
      desc: "Sân trống khách nhưng dàn đèn công suất cao vẫn bật cả đêm, gây đội chi phí 20-30%."
    },
    {
      title: "Hủy trận phút chót vì thiếu người",
      desc: "Đồng đội báo bận lúc 18h, không cách nào tìm được viện binh cùng đẳng cấp để bù quân."
    }
  ];

  const platformAdvantages = [
    {
      title: "Khóa Slot Mutex <20ms",
      desc: "Khi thanh toán VietQR bắt đầu, slot được khóa tức thì trên cơ sở dữ liệu phân tán. Không bao giờ trùng ca."
    },
    {
      title: "Hợp đồng Escrow bảo vệ 2 chiều",
      desc: "Chủ sân nhận cọc chắc chắn; Người chơi được hoàn tiền tự động 100% nếu có thiên tai bất khả kháng."
    },
    {
      title: "IoT Dàn Đèn thông minh MQTT",
      desc: "Đèn tự bật đúng 19h25 và tự tắt 21h05. Cắt bỏ hoàn toàn chi phí phát sinh do nhân viên sơ suất."
    },
    {
      title: "Chợ Kèo SOS • Ghép viện binh cấp tốc",
      desc: "AI tìm kiếm và bắn thông báo tới 50+ cầu thủ rảnh tay quanh cụm sân có Elo ngang ngửa đội hình của bạn."
    }
  ];

  const steps = [
    {
      num: "01.",
      title: "Chọn Sân & Khung Giờ",
      desc: "Tra cứu sân trống gần nhất, xem ảnh thực tế mặt cỏ, vị trí cụm sân và bảng giá minh bạch."
    },
    {
      num: "02.",
      title: "Quét VietQR Khóa Ca",
      desc: "Hệ thống Napas247 xác thực giao dịch trong 3 giây, tự động phát sinh mã check-in điện tử cho cả đội."
    },
    {
      num: "03.",
      title: "Vào Sân • Đèn Tự Sáng",
      desc: "Dàn đèn tự kích hoạt theo giờ đặt, sẵn sàng cho trận đấu cuồng nhiệt không chậm trễ một phút."
    }
  ];

  const testimonials = [
    {
      name: "Nguyễn Hoàng Minh",
      role: "Chủ nhiệm Cụm Thể Thao Chuyên Việt (8 sân 7)",
      comment: "Từ khi áp dụng PitchHub quản lý 8 sân cỏ nhân tạo, doanh thu hàng tháng tăng 28%. Tuyệt vời nhất là hệ thống IoT tự động đóng ngắt dàn đèn, hết hẳn cảnh nhân viên trực quên tắt đèn gây lãng phí hàng triệu tiền điện, cũng không còn ai bị bùng ca giờ vàng nữa.",
      rating: 5,
      avatar: "HM"
    },
    {
      name: "Nguyễn Tuấn Anh",
      role: "Đội trưởng FC Tia Chớp • Elo 1450",
      comment: "Tìm kèo và ghép viện binh siêu tiện! Có hôm 18h30 đội mình thiếu đúng 2 vị trí hậu vệ cánh, mở app bật Chợ Kèo SOS đúng 10 phút là có 2 bạn vào đá cùng vừa khít trình độ Elo 1450. Trận đấu cực kỳ cân bằng và hào hứng.",
      rating: 5,
      avatar: "TA"
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-20">
      {/* --- TRUSTED PARTNERS & ATHLETIC HUBS STRIP --- */}
      <section className="w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400 uppercase tracking-wider shrink-0">
            Được tin dùng bởi hơn 450+ cụm sân & đối tác hạ tầng
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-slate-700 dark:text-slate-300 font-bold text-xs">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
              <span>Cụm Thể Thao Chuyên Việt</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
              <span>KingSport Mễ Trì</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Cụm Sân Lam Sơn Q.5</span>
            </span>
            <span className="flex items-center space-x-1.5 text-[#0b4f6c] dark:text-sky-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>VFF Grassroots Tech</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span>VietQR Napas247</span>
            </span>
          </div>
        </div>
      </section>

      {/* --- 3 CORE VALUE PILLARS --- */}
      <section className="space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3.5 py-1.5 rounded-full bg-[#0b4f6c]/10 dark:bg-sky-400/20 text-[#0b4f6c] dark:text-sky-300 text-xs font-extrabold uppercase tracking-wider border border-[#0b4f6c]/20">
            Hệ Sinh Thái Toàn Diện
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Một Nền Tảng. Ba Lực Lượng Vận Hành Thể Thao.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            PitchHub tái cấu trúc toàn bộ vòng đời trận đấu từ lúc tìm sân, cáp kèo, mở dàn đèn sân bóng cho đến khi tiếng còi bế mạc giải đấu vang lên.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, idx) => {
            const IconMain = pillar.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#0b4f6c]/10 dark:bg-sky-400/20 flex items-center justify-center text-[#0b4f6c] dark:text-sky-300 group-hover:bg-[#0b4f6c] group-hover:text-white transition-all">
                      <IconMain className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {pillar.badge}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400 uppercase tracking-wider block">
                      {pillar.title}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                      {pillar.subtitle}
                    </h3>
                  </div>

                  {/* Points list */}
                  <div className="space-y-4 pt-2">
                    {pillar.points.map((pt, i) => {
                      const PtIcon = pt.icon;
                      return (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                            <PtIcon className="w-4 h-4 text-[#0b4f6c] dark:text-sky-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {pt.label}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5">
                              {pt.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">{pillar.metricLabel}</span>
                  <span className="font-mono text-[#0b4f6c] dark:text-sky-400 font-extrabold">{pillar.metricValue}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* --- COMPARISON MATRIX SECTION --- */}
      <section className="w-full bg-slate-100/80 dark:bg-slate-900/60 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400 uppercase tracking-wider block">
              Trải Nghiệm Thực Tế
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Tại Sao Chọn PitchHub Thay Vì Đặt Sân Qua Điện Thoại & Zalo?
            </h2>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center space-x-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setActiveTab("comparison")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "comparison"
                  ? "bg-[#0b4f6c] text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              So Sánh Trực Tiếp
            </button>
            <button
              onClick={() => setActiveTab("flow")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "flow"
                  ? "bg-[#0b4f6c] text-white shadow-md"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Quy Trình 3 Bước
            </button>
          </div>
        </div>

        {activeTab === "comparison" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Old Way Card */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-rose-200 dark:border-rose-950 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                    <PhoneOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Cách Đặt Sân Truyền Thống</h3>
                    <p className="text-xs text-slate-500 font-medium">Gọi điện thoại, sổ tay ghi chép, nhắn tin Zalo</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase">
                  Rủi ro cao
                </span>
              </div>

              <div className="space-y-4">
                {traditionalIssues.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PitchHub Way Card */}
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-[#0b4f6c]/40 dark:border-sky-500/40 space-y-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0b4f6c] text-white flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">PitchHub Smart Platform</h3>
                    <p className="text-xs text-[#0b4f6c] dark:text-sky-400 font-bold">Tự động hóa 100% bằng công nghệ thể thao số</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#0b4f6c]/10 text-[#0b4f6c] dark:bg-sky-400/20 dark:text-sky-300 font-extrabold text-[10px] uppercase">
                  Chuẩn xác 99.9%
                </span>
              </div>

              <div className="space-y-4">
                {platformAdvantages.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-2xl bg-[#0b4f6c]/5 dark:bg-sky-500/10 border border-[#0b4f6c]/15 dark:border-sky-500/20">
                    <CheckCircle2 className="w-5 h-5 text-[#0b4f6c] dark:text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
                <span className="font-mono text-3xl font-extrabold text-[#0b4f6c] dark:text-sky-400 block">{st.num}</span>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{st.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- TESTIMONIALS & APP CTA BANNER --- */}
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-10 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400 uppercase tracking-wider block">Cộng Đồng Đánh Giá</span>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Lắng Nghe Tiếng Nói Từ Người Trong Cuộc</h3>
          </div>
          <div className="flex items-center space-x-1.5 text-amber-500 font-extrabold text-xs bg-amber-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-amber-200 dark:border-slate-700">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>5.0 / 5.0 Đánh giá hài lòng</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((item, idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center space-x-1 text-amber-500">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-500" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic font-medium leading-relaxed">
                "{item.comment}"
              </p>
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-9 h-9 rounded-full bg-[#0b4f6c] text-white flex items-center justify-center font-bold text-xs">
                  {item.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* High-Impact Bottom Dark Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0b4f6c]/40 border border-[#0b4f6c]/60 text-sky-300 text-xs font-extrabold uppercase">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Khởi Tranh Ngay Hôm Nay</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Sẵn Sàng Nâng Tầm Trải Nghiệm Bóng Đá Của Bạn?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                Gia nhập hơn 120.000 cầu thủ và 450 cụm sân trên toàn quốc. Đặt sân, cáp kèo chuẩn Elo và quản lý giải đấu chưa bao giờ dễ dàng và chuyên nghiệp đến thế.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={onExplore}
                  className="px-6 py-3.5 rounded-2xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <span>Tải Ứng Dụng PitchHub</span>
                </button>
                <button
                  onClick={onExplore}
                  className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2 active:scale-95"
                >
                  <Store className="w-4 h-4 text-sky-400" />
                  <span>Đăng Ký Cụm Sân Đối Tác (Thử 30 ngày)</span>
                </button>
              </div>
            </div>

            {/* App Mockup Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-xs bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-extrabold text-white text-xs">Kèo Ghép Đang Tìm</span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 font-bold">18:30 Tối Nay</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0b4f6c] text-white flex items-center justify-center font-bold text-xs">FC</div>
                    <div>
                      <h4 className="font-bold text-white text-xs">FC Tia Chớp</h4>
                      <p className="text-[10px] text-slate-400">Thiếu 2 người • Sân 7 cỏ mịn</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-extrabold text-sky-400 block">Elo 1450</span>
                    <span className="text-[10px] font-bold text-emerald-400 block">Sân Q7</span>
                  </div>
                </div>

                <button
                  onClick={onExplore}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-bold rounded-xl text-center transition-colors block"
                >
                  Mở Bản Đồ Quét Kèo Toàn Thành Phố →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
