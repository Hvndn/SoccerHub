"use client";

import React, { useState } from "react";
import PitchSearch from "./PitchSearch";
import {
  Sparkles,
  MapPin,
  Clock,
  Zap,
  Star,
  CheckCircle2,
  Phone,
  CalendarPlus,
  SlidersHorizontal,
  Navigation,
  Trophy,
  Flame,
  Search,
  Heart,
  ShieldCheck,
  Check,
  Lock,
  ArrowRight,
  Activity,
  Layers,
  Tv,
  Car,
  Lightbulb,
  ShowerHead,
  DollarSign,
  Globe,
  Timer,
  RefreshCw,
  Share2
} from "lucide-react";

import { getAllPitchesApi } from "@/lib/pitchService";

interface PlayerDashboardProps {
  user: any;
  onNavigateTab: (tab: string) => void;
  onSelectSlot?: (pitch: any, slot: any) => void;
}

export default function PlayerDashboard({ user, onNavigateTab, onSelectSlot }: PlayerDashboardProps) {
  const [district, setDistrict] = useState("TP. Hồ Chí Minh (Quận 7 & Bình Thạnh)");
  const [pitchFormat, setPitchFormat] = useState("Sân 7 người (Tiêu chuẩn VFF)");
  const [timeSlot, setTimeSlot] = useState("Hôm nay (Giờ Vàng: 17:30 - 21:00)");
  const [priceRange, setPriceRange] = useState("350.000đ - 650.000đ / ca");
  const [activeFilterTag, setActiveFilterTag] = useState("ALL");
  const [favoritePitches, setFavoritePitches] = useState<string[]>([]);
  const [dbPitches, setDbPitches] = useState<any[]>([]);
  const [loadingPitches, setLoadingPitches] = useState(true);

  React.useEffect(() => {
    async function loadPitches() {
      setLoadingPitches(true);
      try {
        const data = await getAllPitchesApi();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: any, idx: number) => ({
            id: item.id ? `pitch-db-${item.id}` : `pitch-real-${idx}`,
            name: item.name,
            distance: `Cách bạn ${1.2 + (idx % 3)} km`,
            totalPitches: item.type || "Cụm Sân Thật Database",
            address: item.address || item.location || "Quận 7, TP.HCM",
            rating: item.rating || 4.9,
            reviews: 128 + idx * 10,
            price: item.pricePerHour ? `${item.pricePerHour.toLocaleString('vi-VN')}đ` : "350.000đ",
            priceUnit: "/h",
            statusBadge: "Sẵn sàng nhận lịch cọc",
            statusBadgeColor: "bg-[#0b4f6c]/20 text-[#0b4f6c] dark:text-sky-400 border-[#0b4f6c]/30",
            imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80",
            facilities: [
              { icon: Lightbulb, label: "Đèn Chiếu LED 800 Lux" },
              { icon: ShowerHead, label: "Phòng Tắm Nước Nóng" },
              { icon: Car, label: "Bãi Xe Ô tô Free" }
            ],
            slots: [
              { time: "17:30", price: "350k", status: "AVAILABLE" },
              { time: "19:00", price: "450k", status: "ACTIVE" },
              { time: "20:30", price: "350k", status: "AVAILABLE" }
            ]
          }));
          setDbPitches(mapped);
        } else {
          setDbPitches([]);
        }
      } catch (err) {
        console.log("Error loading DB pitches in dashboard");
        setDbPitches([]);
      } finally {
        setLoadingPitches(false);
      }
    }
    loadPitches();
  }, [user]);

  const toggleFavorite = (pitchId: string) => {
    setFavoritePitches(prev =>
      prev.includes(pitchId) ? prev.filter(id => id !== pitchId) : [...prev, pitchId]
    );
  };

  const handleBookNow = (pitch: any) => {
    if (onSelectSlot) {
      onSelectSlot(pitch, { time: "19:00 - 20:30", price: pitch.price, pitchType: pitch.name });
    } else {
      onNavigateTab("booking");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* --- TOP SECTION: WELCOME HERO BANNER & COMPACT SMART FILTER (STITCH SPEC) --- */}
      <PitchSearch user={user} onSelectSlot={onSelectSlot || handleBookNow} />



      {/* --- SECTION 3: INTERACTIVE MAP & POSTGIS GEOSPATIAL DIRECTORY --- */}
      <section className="w-full space-y-8">


        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-[#0b4f6c] dark:text-sky-400 uppercase tracking-wider">
              Tọa Độ Không Gian PostGIS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Danh Sách Cụm Sân & Vị Trí Vệ Tinh
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigateTab("booking")}
              className="px-4 py-2.5 bg-[#0b4f6c] text-white rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md"
            >
              <Layers className="w-4 h-4" />
              <span>Hiển Thị Lưới</span>
            </button>
            <button
              onClick={() => onNavigateTab("booking")}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center space-x-1.5 hover:bg-slate-200"
            >
              <MapPin className="w-4 h-4" />
              <span>Toàn Màn Hình Bản Đồ</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Pitches Cards List (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {loadingPitches ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#0b4f6c] dark:text-sky-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Đang tải danh sách sân bóng từ cơ sở dữ liệu...</p>
              </div>
            ) : dbPitches.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 sm:p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                  <MapPin className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Không có sân bóng nào trong cơ sở dữ liệu
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Hiện tại chưa có cụm sân bóng nào được lưu trong CSDL. Vui lòng tạo sân mới nếu bạn là Chủ Sân hoặc quay lại sau.
                  </p>
                </div>
              </div>
            ) : (
              dbPitches.map((pitch) => {
                const isFav = favoritePitches.includes(pitch.id);
                return (
                  <div
                    key={pitch.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-5 group"
                  >
                    <div className="sm:w-56 h-48 sm:h-auto shrink-0 rounded-2xl overflow-hidden relative">
                      <img
                        src={pitch.imageUrl}
                        alt={pitch.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                        {pitch.distance}
                      </span>
                      <span className="absolute bottom-3 right-3 bg-[#0b4f6c] text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                        {pitch.totalPitches}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between flex-1 space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-[#0b4f6c] dark:group-hover:text-sky-400 transition-colors">
                              {pitch.name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{pitch.address}</span>
                            </p>
                          </div>
                          <button
                            onClick={() => toggleFavorite(pitch.id)}
                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? "text-rose-500 fill-rose-500" : ""}`} />
                          </button>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-slate-800 dark:text-slate-200">{pitch.statusBadge}</span>
                        </div>

                        {/* Facilities */}
                        <div className="flex flex-wrap gap-1.5 pt-3">
                          {pitch.facilities.map((fac: any, idx: number) => {
                            const IconComp = fac.icon;
                            return (
                              <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center space-x-1">
                                <IconComp className="w-3.5 h-3.5 text-[#0b4f6c] dark:text-sky-400" />
                                <span>{fac.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Giá từ</span>
                          <span className="text-base font-extrabold text-[#0b4f6c] dark:text-sky-400 font-mono">{pitch.price} {pitch.priceUnit}</span>
                        </div>
                        <button
                          onClick={() => handleBookNow(pitch)}
                          className="px-4 py-2.5 rounded-xl bg-[#0b4f6c] hover:bg-[#07384d] text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
                        >
                          <CalendarPlus className="w-4 h-4 text-white" />
                          <span>Xem Ca Sân</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column (5 Cols): Satellite PostGIS Interactive Preview Map Card */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-5 h-5 text-sky-400" />
                  <span className="font-extrabold text-base text-white">Bản Đồ Vệ Tinh PostGIS</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  GPS Active
                </span>
              </div>

              {/* Map Preview Artwork Box */}
              <div className="relative h-96 rounded-2xl overflow-hidden border border-slate-800 group">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80"
                  alt="PostGIS Map Preview"
                  className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-slate-950/40" />

                {/* Dynamic Map Pins */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce">
                  {dbPitches.length > 0 ? (
                    <div className="px-3 py-1 rounded-full bg-[#0b4f6c] text-white font-mono font-bold text-xs shadow-xl border border-white/20">
                      {dbPitches[0].name} ({dbPitches[0].distance || "1.2km"})
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full bg-slate-800 text-amber-400 font-mono font-bold text-xs shadow-xl border border-amber-500/30">
                      Không có sân bóng trong CSDL
                    </div>
                  )}
                  <div className="w-3 h-3 bg-[#0b4f6c] rotate-45 -mt-1 border-r border-b border-white/20" />
                </div>

                {dbPitches.length > 1 && (
                  <div className="absolute bottom-1/4 left-1/4 flex flex-col items-center">
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-400 font-mono font-bold text-[10px] shadow-lg border border-amber-500/30">
                      {dbPitches[1]?.name} (2.5km)
                    </div>
                  </div>
                )}

                {dbPitches.length > 2 && (
                  <div className="absolute top-1/4 right-1/4 flex flex-col items-center">
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/90 text-sky-400 font-mono font-bold text-[10px] shadow-lg border border-sky-500/30">
                      {dbPitches[2]?.name} (3.1km)
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => onNavigateTab("booking")}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-extrabold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Mở Bản Đồ PostGIS Toàn Màn Hình</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
