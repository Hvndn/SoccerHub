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
  Heart,
} from "lucide-react";
import { API_BASE_URL, fetchWithTimeout } from "@/lib/api";
import { pitchTypeLabel } from "@/lib/pitchLabels";
import { useAuth } from "@/context/AuthContext";
import {
  getFavoritePitchIds,
  toggleFavoritePitch,
  subscribeFavorites,
} from "@/lib/favoritePitchService";
import { toastOk, toastInfo } from "@/lib/toast";

interface LandingFeaturesProps {
  onExplore: (role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
  onNavigateTab?: (tab: string) => void;
}

export default function LandingFeatures({ onExplore, onNavigateTab }: LandingFeaturesProps) {
  const { user } = useAuth();
  const [allPitches, setAllPitches] = useState<any[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    setFavoriteIds(getFavoritePitchIds(user?.id));
    const unsub = subscribeFavorites((ids) => {
      setFavoriteIds(ids);
    }, user?.id);
    return unsub;
  }, [user?.id]);

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

  // Sân yêu thích của người dùng hiện tại
  const myFavoritePitches = useMemo(() => {
    if (!favoriteIds.length || !allPitches.length) return [];
    return allPitches.filter((p) => favoriteIds.includes(Number(p.id)));
  }, [allPitches, favoriteIds]);

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
    const source = list.length > 0 ? list : allPitches;
    // Sắp xếp ưu tiên: Sân yêu thích (thả tim) được đưa lên đầu danh sách
    const sorted = [...source].sort((a, b) => {
      const isFavA = favoriteIds.includes(Number(a.id)) ? 1 : 0;
      const isFavB = favoriteIds.includes(Number(b.id)) ? 1 : 0;
      return isFavB - isFavA;
    });
    return sorted.slice(0, 3);
  }, [allPitches, typeFilter, districtFilter, favoriteIds]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("booking");

  const services = [
    {
      id: "booking",
      title: "Đặt Sân Bóng Trực Tuyến",
      badge: "Cầu thủ",
      accent: "bg-[#0369a1]",
      badgeTone: "bg-sky-50 text-[#0369a1] border-sky-200",
      iconTone: "bg-sky-50 text-[#0369a1] border-sky-200",
      icon: Calendar,
      ctaLabel: "Đặt Sân Ngay",
      image: "/images/copa-action.png",
      visualTag: "⚡ Giữ ca & cọc tức thì",
      onAction: () => (onNavigateTab ? onNavigateTab("booking") : onExplore("PLAYER")),
      points: [
        "Xem bảng giờ trống thực tế của từng cụm sân",
        "Giữ ca và thanh toán tiền cọc qua VietQR tự động",
        "Đổi lịch hoặc hủy ca minh bạch theo quy định chủ sân",
      ],
    },
    {
      id: "owner",
      title: "Quản Lý Cụm Sân & Lịch Đặt",
      badge: "Chủ sân",
      accent: "bg-emerald-600",
      badgeTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconTone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: ShieldCheck,
      ctaLabel: "Quản Lý Cụm Sân",
      image: "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1200&q=80",
      visualTag: "📊 Tự động hóa lịch sân",
      onAction: () => onExplore("OWNER"),
      points: [
        "Cài đặt khung giờ hoạt động và bảng giá linh hoạt",
        "Theo dõi lịch đặt sân, duyệt cọc và khóa ca nhanh",
        "Báo cáo doanh thu trực quan theo ngày và tháng",
      ],
    },
    {
      id: "tournament",
      title: "Tổ Chức & Quản Lý Giải Đấu",
      badge: "Ban tổ chức",
      accent: "bg-amber-500",
      badgeTone: "bg-amber-50 text-amber-800 border-amber-200",
      iconTone: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Trophy,
      ctaLabel: "Khám Phá Giải Đấu",
      image: "/images/epic-goal-player.png",
      visualTag: "🏆 Bốc thăm & BXH trực tiếp",
      onAction: () => (onNavigateTab ? onNavigateTab("tournaments") : onExplore("ORGANIZER")),
      points: [
        "Tạo giải đấu mở tự do hoặc mời đội qua email",
        "Bốc thăm chia bảng và sinh lịch thi đấu tự động",
        "Cập nhật tỷ số, bảng xếp hạng và vua phá lưới",
      ],
    },
    {
      id: "matchmaking",
      title: "Tìm Đối Giao Hữu & Đội Bóng",
      badge: "Cộng đồng",
      accent: "bg-rose-600",
      badgeTone: "bg-rose-50 text-rose-700 border-rose-200",
      iconTone: "bg-rose-50 text-rose-600 border-rose-200",
      icon: Users,
      ctaLabel: "Tìm Đối Giao Hữu",
      image: "/images/copa-players-art.png",
      visualTag: "🤝 Kèo cáp & SOS mượn chân",
      onAction: () => (onNavigateTab ? onNavigateTab("matchmaking") : onExplore("PLAYER")),
      points: [
        "Đăng tin tìm đối thủ giao lưu theo trình độ và giờ đá",
        "Giao lưu SOS tìm chân đá khẩn cấp theo vị trí",
        "Thỏa thuận màu áo, trọng tài và chi phí minh bạch",
      ],
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Chọn Sân & Giờ",
      desc: "Xem lịch trống thực tế theo từng quận",
      icon: Calendar,
      tone: "bg-sky-50 text-[#0369a1] border-sky-200",
    },
    {
      step: "02",
      title: "Cọc VietQR Tức Thì",
      desc: "Thanh toán tự động, giữ chỗ ngay 0s",
      icon: QrCode,
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      step: "03",
      title: "Check-in & Ra Sân",
      desc: "Quét mã vé điện tử tại sân thi đấu",
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

          {/* Biểu ngữ Cá Nhân Hóa Cụm Sân Thân Quen khi đã thả tim */}
          {user && myFavoritePitches.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-sky-50 border border-rose-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Heart className="w-4 h-4 fill-white text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">
                    Cụm Sân Thân Quen Của Bạn ({myFavoritePitches.length} sân đã lưu)
                  </p>
                  <p className="text-[13px] text-slate-500">
                    Hệ thống ưu tiên hiển thị sân ruột để bạn kiểm tra ca trống và cọc sân nhanh nhất.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => (onNavigateTab ? onNavigateTab("booking") : onExplore("PLAYER"))}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-rose-600 border border-rose-200 text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Xem Bảng Giờ Đặt Sân</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredPitches.map((pitch, idx) => {
                const price = Number(pitch.pricePerHour || 300000);
                const isFav = favoriteIds.includes(Number(pitch.id));
                return (
                  <motion.div
                    layout
                    key={pitch.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3, delay: idx * 0.06 }}
                    onClick={() => onExplore("PLAYER")}
                    className={`group bg-white landing-card-interactive overflow-hidden flex flex-col justify-between cursor-pointer border ${
                      isFav ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                    }`}
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
                          {isFav && (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50/95 backdrop-blur-xs text-rose-700 border border-rose-200 font-bold text-[13px] flex items-center gap-1 shadow-2xs">
                              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                              <span>Sân ruột</span>
                            </span>
                          )}
                        </div>

                        {/* Nút Thả Tim / Yêu Thích Sân */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const res = toggleFavoritePitch(pitch.id, user?.id);
                            if (res.isFavorite) {
                              toastOk(`Đã thêm "${pitch.name}" vào sân yêu thích!`);
                            } else {
                              toastInfo(`Đã bỏ "${pitch.name}" khỏi sân yêu thích.`);
                            }
                          }}
                          className={`absolute top-3 right-3 z-10 p-2 rounded-xl backdrop-blur-md shadow-xs transition-transform active:scale-90 hover:scale-110 cursor-pointer ${
                            isFav
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-white/90 text-slate-400 hover:text-rose-500 border border-slate-200"
                          }`}
                          title={isFav ? "Bỏ yêu thích sân này" : "Thêm vào sân yêu thích"}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>
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

      {/* PHẦN 2: SHOWCASE HỆ SINH THÁI DỊCH VỤ DỰA TRÊN HÌNH ẢNH & VAI TRÒ */}
      <section className="space-y-4">
        <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-[13px] font-bold text-[#0369a1] block mb-0.5">
              Giải pháp toàn diện cho bóng đá phong trào
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Hệ Sinh Thái Dịch Vụ Trên Turfzone
            </h2>
            <p className="text-[14px] text-slate-600 font-medium">
              Chọn vai trò của bạn để khám phá tính năng và công cụ chuyên biệt
            </p>
          </div>
        </div>

        {/* Thanh chọn vai trò */}
        <div className="flex flex-wrap gap-2">
          {services.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedServiceId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedServiceId(item.id)}
                className={`px-3.5 py-2 sm:py-2.5 rounded-xl font-bold text-[14px] flex items-center gap-2 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0369a1] text-white border-[#0369a1] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Khối Showcase Trực Quan Hình Ảnh & Nội Dung (Thu Gọn Chuẩn Compact SaaS) */}
        {(() => {
          const current = services.find((s) => s.id === selectedServiceId) || services[0];
          const CurrentIcon = current.icon;
          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:max-h-[350px]">
              {/* Cột Trái (7 cột): Điểm mạnh cốt lõi & CTA */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-lg border ${current.badgeTone}`}>
                      Dành cho {current.badge}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-500 flex items-center gap-1">
                      <CurrentIcon className="w-3.5 h-3.5" />
                      Turfzone Platform
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {current.title}
                  </h3>

                  <div className="space-y-2 pt-0.5">
                    {current.points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[13px] sm:text-[14px] text-slate-700 font-medium leading-relaxed">
                          {pt}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={current.onAction}
                    className="py-2.5 px-5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] sm:text-[14px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                  >
                    <span>{current.ctaLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cột Phải (5 cột): Hình ảnh minh họa gọn gàng, cân đối */}
              <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full lg:max-h-[350px] bg-slate-900 overflow-hidden">
                <SafeImage
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover object-center brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Huy hiệu trực quan trên hình */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[13px] border border-white/15">
                    {current.visualTag}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-md text-slate-900 font-bold text-[13px]">
                    Turfzone 2026
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* PHẦN 3: QUY TRÌNH ĐẶT SÂN TƯƠNG TÁC TRONG 3 BƯỚC (INFOGRAPHIC GỌN GÀNG) */}
      <section className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              Quy Trình Đặt Sân Tự Động
            </h3>
          </div>
          <span className="text-[13px] font-bold text-[#0369a1] bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
            3 Bước • 30 Giây
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, idx) => {
            const StepIcon = s.icon;
            return (
              <div
                key={idx}
                className="relative p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#0369a1] transition-all flex items-center gap-3.5 group"
              >
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 font-black ${s.tone} group-hover:scale-105 transition-transform`}
                >
                  <StepIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black font-mono text-[#0369a1]">
                      {s.step}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 truncate">
                      {s.title}
                    </h4>
                  </div>
                  <p className="text-[13px] text-slate-600 font-medium truncate mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PHẦN 4: BANNER KÊU GỌI HÀNH ĐỘNG GIAO DIỆN SÁNG (TINH GIẢN CHỮ, TẬP TRUNG HÀNH ĐỘNG) */}
      <section className="relative overflow-hidden rounded-2xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-sky-50 text-[#0369a1] border border-sky-200 text-[13px] font-bold">
              ⚡ Sân bóng phủi • Kèo đấu • Giải đấu
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              Sẵn sàng cho trận bóng tiếp theo của bạn?
            </h3>
            <p className="text-[14px] text-slate-600 font-medium">
              Tìm sân trống gần nhất hoặc hợp tác đăng ký quản lý sân cùng Turfzone.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onExplore("PLAYER")}
              className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Đặt Sân Ngay</span>
            </button>

            <button
              type="button"
              onClick={() => onExplore("OWNER")}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-[14px] transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-[#0369a1]" />
              <span>Dành Cho Chủ Sân</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
