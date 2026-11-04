"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SafeImage from "@/components/SafeImage";
import {
  ShieldCheck,
  Users,
  Trophy,
  CheckCircle2,
  Store,
  Calendar,
  MapPin,
  ArrowRight,
  QrCode,
  Sparkles,
  Star,
  Clock,
} from "lucide-react";
import { API_BASE_URL, fetchWithTimeout } from "@/lib/api";
import { pitchTypeLabel } from "@/lib/pitchLabels";

interface LandingFeaturesProps {
  onExplore: (role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingFeatures({ onExplore, onNavigateTab }: LandingFeaturesProps) {
  const [allPitches, setAllPitches] = useState<any[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    fetchWithTimeout(`${API_BASE_URL}/api/v1/pitches`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!alive) return;
        if (Array.isArray(data)) {
          setAllPitches(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingPitches(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filteredPitches = useMemo(() => {
    const list = allPitches.filter((p) => {
      if (typeFilter !== "all") {
        const t = String(p.type || "").toUpperCase();
        if (typeFilter === "7" && !t.includes("7")) return false;
        if (typeFilter === "5" && !t.includes("5")) return false;
        if (typeFilter === "11" && !t.includes("11")) return false;
      }
      if (districtFilter !== "all") {
        const loc = `${p.location || ""} ${p.address || ""} ${p.name || ""}`.toLowerCase();
        if (!loc.includes(districtFilter.toLowerCase())) return false;
      }
      return true;
    });
    return (list.length > 0 ? list : allPitches).slice(0, 3);
  }, [allPitches, typeFilter, districtFilter]);

  const services = [
    {
      id: "booking",
      title: "Đặt Sân Bóng Trực Tuyến",
      badge: "Cầu thủ",
      accent: "from-sky-500 to-[#0369a1]",
      badgeTone: "bg-sky-50 text-[#0369a1] border-sky-200",
      iconTone: "bg-sky-50 text-[#0369a1] border-sky-200",
      icon: Calendar,
      ctaLabel: "Đặt sân ngay",
      onAction: () => onExplore("PLAYER"),
      points: [
        "Xem bảng giờ trống thực tế của từng sân",
        "Giữ ca và thanh toán tiền cọc qua VietQR",
        "Đổi lịch hoặc hủy ca theo quy định chủ sân",
      ],
    },
    {
      id: "owner",
      title: "Quản Lý Cụm Sân & Lịch Đặt",
      badge: "Chủ sân",
      accent: "from-emerald-500 to-teal-600",
      badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: ShieldCheck,
      ctaLabel: "Quản lý cụm sân",
      onAction: () => onExplore("OWNER"),
      points: [
        "Cài đặt khung giờ hoạt động và bảng giá",
        "Theo dõi lịch đặt sân, duyệt cọc và khóa ca",
        "Báo cáo doanh thu theo ngày và tháng",
      ],
    },
    {
      id: "tournament",
      title: "Tổ Chức & Quản Lý Giải Đấu",
      badge: "Ban tổ chức",
      accent: "from-amber-500 to-orange-600",
      badgeTone: "bg-amber-50 text-amber-800 border-amber-200",
      iconTone: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Trophy,
      ctaLabel: "Khám phá giải đấu",
      onAction: () => (onNavigateTab ? onNavigateTab("tournaments") : onExplore("ORGANIZER")),
      points: [
        "Tạo giải đấu mở tự do hoặc mời qua email",
        "Bốc thăm chia bảng và tạo lịch thi đấu",
        "Cập nhật tỷ số, bảng xếp hạng và thẻ phạt",
      ],
    },
    {
      id: "matchmaking",
      title: "Tìm Đối Giao Hữu & Đội Bóng",
      badge: "Cộng đồng",
      accent: "from-rose-500 to-pink-600",
      badgeTone: "bg-rose-50 text-rose-700 border-rose-200",
      iconTone: "bg-rose-50 text-rose-600 border-rose-200",
      icon: Users,
      ctaLabel: "Tìm đối giao hữu",
      onAction: () => (onNavigateTab ? onNavigateTab("matchmaking") : onExplore("PLAYER")),
      points: [
        "Đăng tin tìm đối thủ giao lưu theo khung giờ",
        "Quản lý danh sách thành viên câu lạc bộ",
        "Trao đổi trực tiếp với chủ sân và đội bạn",
      ],
    },
  ];

  const steps = [
    {
      step: "Bước 1",
      title: "Chọn sân & khung giờ trống",
      desc: "Tra cứu mặt sân 5, 7 hoặc 11 người theo quận và khung giờ thực tế.",
      icon: Calendar,
      tone: "bg-sky-50 text-[#0369a1] border-sky-200",
    },
    {
      step: "Bước 2",
      title: "Quét mã VietQR giữ sân",
      desc: "Đặt cọc 50% hoặc thanh toán đủ qua mã QR ngân hàng tự động xác nhận.",
      icon: QrCode,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      step: "Bước 3",
      title: "Nhận vé QR & ra sân thi đấu",
      desc: "Check-in nhanh tại sân bằng mã đặt chỗ và tích điểm thẻ hội viên.",
      icon: Sparkles,
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  const filterChips = [
    { id: "all", label: "Tất cả mặt sân" },
    { id: "7", label: "Sân 7 người" },
    { id: "5", label: "Sân 5 / Futsal" },
    { id: "11", label: "Sân 11 người" },
  ];

  const districtChips = [
    { id: "all", label: "Toàn Đà Nẵng" },
    { id: "Hải Châu", label: "Hải Châu" },
    { id: "Sơn Trà", label: "Sơn Trà" },
    { id: "Thanh Khê", label: "Thanh Khê" },
    { id: "Cẩm Lệ", label: "Cẩm Lệ" },
    { id: "Ngũ Hành Sơn", label: "Ngũ Hành Sơn" },
  ];

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* PHẦN 1: KHÁM PHÁ CỤM SÂN TƯƠNG TÁC TRỰC TIẾP (GIAO DIỆN SÁNG) */}
      {!loadingPitches && allPitches.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3.5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#0369a1] mb-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>Sân bóng tiêu biểu tại Đà Nẵng</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Cụm Sân Sẵn Sàng Phục Vụ Hôm Nay
              </h2>
            </div>

            {/* Bộ lọc loại mặt sân tương tác ngay tại chỗ */}
            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setTypeFilter(chip.id)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                    typeFilter === chip.id
                      ? "bg-[#0369a1] text-white"
                      : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thanh chọn nhanh Quận/Huyện tại Đà Nẵng */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-bold text-slate-500 flex items-center gap-1 mr-1">
              <MapPin className="w-3.5 h-3.5 text-[#0369a1]" />
              <span>Khu vực:</span>
            </span>
            {districtChips.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDistrictFilter(d.id)}
                className={`px-3 py-1 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                  districtFilter === d.id
                    ? "bg-sky-100 text-[#0369a1] border border-sky-300"
                    : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 border border-transparent"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredPitches.map((pitch, idx) => {
                const price = Number(pitch.pricePerHour || 300000);
                return (
                  <motion.div
                    layout
                    key={pitch.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                    onClick={() => onExplore("PLAYER")}
                    className="group bg-white landing-card-interactive border border-slate-200 overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="relative h-44 bg-sky-50 overflow-hidden border-b border-slate-100">
                        <SafeImage
                          src={pitch.imageUrl || "/images/copa-action.png"}
                          alt={pitch.name || "Sân bóng Đà Nẵng"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-emerald-700 border border-emerald-200 font-black text-[13px] flex items-center gap-1.5 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Đang mở đặt ca</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-[#0369a1] border border-sky-200 font-bold text-[13px] shadow-2xs">
                            {pitchTypeLabel(pitch.type)}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="text-[13px] font-bold text-[#0369a1] flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{pitch.location || pitch.address || "Đà Nẵng"}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-[#0369a1] transition-colors line-clamp-2">
                          {pitch.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-600 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#0369a1]" />
                            <span>05:00 - 23:00</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Giữ ca VietQR</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[13px] text-slate-500 font-semibold block">
                          Giá thuê từ
                        </span>
                        <span className="text-base font-black text-[#0369a1]">
                          {price.toLocaleString("vi-VN")}đ
                          <span className="text-[13px] font-semibold text-slate-500">/giờ</span>
                        </span>
                      </div>

                      <span className="px-3.5 py-2 rounded-xl bg-[#0369a1] group-hover:bg-[#075985] text-white font-bold text-[13px] flex items-center gap-1.5 transition-colors">
                        <span>Chọn Khung Giờ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </section>
      )}

      {/* PHẦN 2: BENTO GRID HỆ SINH THÁI DỊCH VỤ */}
      <section className="space-y-5">
        <div className="border-b border-slate-200 pb-3.5 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[13px] font-bold text-[#0369a1] block mb-0.5">
              Giải pháp toàn diện cho bóng đá phong trào
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Hệ Sinh Thái Dịch Vụ Trên Turfzone
            </h2>
            <p className="text-[14px] text-slate-600 font-medium">
              Kết nối cầu thủ, đội bóng, chủ sân và ban tổ chức giải đấu trên một nền tảng duy nhất
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {services.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.07 }}
                className="relative bg-white landing-card-interactive p-5 sm:p-6 border border-slate-200 flex flex-col justify-between space-y-5 overflow-hidden group"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${item.accent}`}
                />

                <div className="space-y-3.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.iconTone}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[13px] font-bold px-2.5 py-1 rounded-lg border ${item.badgeTone}`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    {item.title}
                  </h3>

                  <div className="space-y-2.5 pt-0.5">
                    {item.points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[14px] text-slate-600 font-medium leading-snug">
                          {pt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={item.onAction}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 group-hover:bg-[#0369a1] text-slate-800 group-hover:text-white border border-slate-200 group-hover:border-[#0369a1] font-bold text-[14px] transition-all active:scale-95 flex items-center justify-between cursor-pointer"
                >
                  <span>{item.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PHẦN 3: QUY TRÌNH ĐẶT SÂN TƯƠNG TÁC TRONG 3 BƯỚC */}
      <section className="bg-white landing-shell-radius p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[13px] font-bold text-emerald-700 block mb-0.5">
              Nhanh chóng · Minh bạch · Tự động
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Quy Trình Đặt Sân Chỉ Trong 3 Bước
            </h3>
          </div>
          <span className="text-[13px] font-semibold text-slate-500">
            Nhấp vào từng bước để xem chi tiết
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`landing-card-radius p-5 flex items-start gap-4 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-sky-50/70 border-[#0369a1]"
                    : "bg-slate-50/80 border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 font-black ${s.tone}`}
                >
                  <StepIcon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-extrabold text-[#0369a1]">
                      {s.step}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded bg-[#0369a1] text-white text-[13px] font-bold">
                        Đang xem
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {s.title}
                  </h4>
                  <p className="text-[14px] text-slate-600 font-medium leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PHẦN 4: BANNER KÊU GỌI HÀNH ĐỘNG GIAO DIỆN SÁNG (DAYLIGHT CTA) */}
      <section className="relative overflow-hidden landing-shell-radius bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-slate-900 p-6 sm:p-8 lg:p-10 border border-sky-200">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-sky-100 text-[#0369a1] border border-sky-200 text-[13px] font-bold">
              Bắt đầu cùng Turfzone ngay hôm nay
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight">
              Bạn muốn đặt sân thi đấu hay đăng ký quản lý cụm sân?
            </h3>
            <p className="text-[14px] sm:text-base text-slate-600 font-medium max-w-2xl">
              Chọn đúng vai trò của bạn để trải nghiệm trọn vẹn hệ thống đặt sân, ghép kèo và điều hành giải đấu tự động.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <button
                type="button"
                onClick={() => onExplore("PLAYER")}
                className="btn-shine-effect px-5 py-3 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-black text-[14px] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>Tài Khoản Cầu Thủ</span>
              </button>

              <button
                type="button"
                onClick={() => onExplore("OWNER")}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-extrabold text-[14px] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-[#0369a1]" />
                <span>Tài Khoản Chủ Sân</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onNavigateTab ? onNavigateTab("tournaments") : onExplore("ORGANIZER")
                }
                className="px-5 py-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 font-bold text-[14px] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Xem Giải Đấu</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-4 items-center justify-center">
            <div className="w-56 h-56 relative animate-float-slow">
              <SafeImage
                src="/images/epic-goal-player.png"
                alt="Cầu thủ Turfzone"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
