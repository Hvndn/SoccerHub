"use client";

import React, { useState, useEffect, useMemo } from "react";
import SafeImage from "@/components/SafeImage";
import {
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Search,
  Loader2,
  PhoneCall,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import PitchDetail from "./PitchDetail";
import { getAllPitchesApi } from "@/lib/pitchService";
import { pitchTypeLabel, isPeakSlot } from "@/lib/pitchLabels";
import { subscribeToBookingEvents } from "@/lib/realtimeService";

interface PitchSearchProps {
  user?: any;
}

const SPORT_CODE_TO_TAB: Record<string, string> = {
  SAN_5: "SAN5",
  SAN_7: "SAN7",
  SAN_11: "SAN11",
  FUTSAL: "FUTSAL",
};

const toSportTabs = (types?: string[] | null): string[] =>
  (types ?? []).map(
    (t) => SPORT_CODE_TO_TAB[String(t).trim().toUpperCase()] ?? String(t).trim().toUpperCase()
  );

export default function PitchSearch({ user }: PitchSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedTimeSlotFilter, setSelectedTimeSlotFilter] = useState("ALL");
  const [maxBudget, setMaxBudget] = useState(800000);
  const [onlyAvailableTonight, setOnlyAvailableTonight] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [selectedPitchForSlot, setSelectedPitchForSlot] = useState<any>(null);
  const [realPitches, setRealPitches] = useState<any[]>([]);
  const [loadingRealPitches, setLoadingRealPitches] = useState(false);
  const [pitchLoadError, setPitchLoadError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PITCHES_PER_PAGE = 8;

  useEffect(() => {
    setSelectedPitchForSlot(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("pitchId")) {
        url.searchParams.delete("pitchId");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [user?.email, user?.id]);

  const handleOpenPitch = (pitch: any) => {
    if (!pitch) return;
    setSelectedPitchForSlot(pitch);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("pitchId", String(pitch.id));
      window.history.pushState({ pitchId: pitch.id }, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBackFromPitch = () => {
    setSelectedPitchForSlot(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("pitchId")) {
        url.searchParams.delete("pitchId");
        window.history.pushState({}, "", url.toString());
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("pitchId");
      if (!pid) {
        setSelectedPitchForSlot(null);
      } else if (realPitches.length > 0) {
        const found = realPitches.find((p) => String(p.id) === pid);
        if (found) setSelectedPitchForSlot(found);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [realPitches]);

  const fetchPitches = async () => {
    setLoadingRealPitches(true);
    setPitchLoadError(null);
    try {
      const data = await getAllPitchesApi();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any, idx: number) => {
          const rawId = item.id ? item.id.toString().replace(/\D/g, "") : (idx + 1).toString();
          const basePrice = item.avgPricePerHour || item.pricePerHour || 350000;
          const peakPrice = item.peakPricePerHour || Math.round(basePrice * 1.3);
          const openTime = item.openTime || "14:00";
          const closeTime = item.closeTime || "22:30";
          const slotDur = item.slotDurationMinutes || 120;

          const address = item.address || item.area || "Chưa khai báo địa chỉ";
          const pitchName = item.name || "Cụm sân chưa đặt tên";

          const startH = parseInt(openTime.split(":")[0]) || 14;
          const endH = parseInt(closeTime.split(":")[0]) || 22;
          const dynamicSlots: any[] = [];
          const stepMin = slotDur > 0 ? slotDur : 120;
          const openMin = startH * 60;
          const closeMin = endH * 60;
          for (let m = openMin; m + stepMin <= closeMin; m += stepMin) {
            const h = Math.floor(m / 60);
            const mm = m % 60;
            const endTotal = m + stepMin;
            const timeLabel = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")} - ${String(
              Math.floor(endTotal / 60)
            ).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;
            const isPeak = isPeakSlot(timeLabel);
            dynamicSlots.push({
              time: timeLabel,
              price: `${Math.round((isPeak ? peakPrice : basePrice) / 1000)}k`,
              status: "AVAILABLE",
              tag: isPeak ? "Ca Vàng" : "Ca Thường",
            });
          }
          if (dynamicSlots.length === 0) {
            dynamicSlots.push(
              { time: "14:00 - 16:00", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Chiều" },
              { time: "16:00 - 18:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "Thường" },
              { time: "18:00 - 20:00", price: `${Math.round(peakPrice / 1000)}k`, status: "AVAILABLE", tag: "Ca Vàng" },
              { time: "20:00 - 22:00", price: `${Math.round(basePrice / 1000)}k`, status: "AVAILABLE", tag: "Ca Tối" }
            );
          }

          const sportTabs: string[] = toSportTabs(item.pitchTypes);
          const sport: string =
            sportTabs.includes("FUTSAL") && /futsal/i.test(String(item.name || ""))
              ? "FUTSAL"
              : sportTabs.includes("SAN11") && /sân 11|11 người/i.test(String(item.name || ""))
              ? "SAN11"
              : sportTabs.includes("SAN7")
              ? "SAN7"
              : sportTabs.includes("SAN5")
              ? "SAN5"
              : sportTabs[0] || "SAN7";

          const districtCode = address.includes("Liên Chiểu")
            ? "LIEN_CHIEU"
            : address.includes("Hải Châu")
            ? "HAI_CHAU"
            : address.includes("Thanh Khê")
            ? "THANH_KHE"
            : address.includes("Sơn Trà")
            ? "SON_TRA"
            : address.includes("Cẩm Lệ")
            ? "CAM_LE"
            : "LIEN_CHIEU";

          const districtName = address.includes("Liên Chiểu")
            ? "Q. Liên Chiểu"
            : address.includes("Hải Châu")
            ? "Q. Hải Châu"
            : address.includes("Thanh Khê")
            ? "Q. Thanh Khê"
            : address.includes("Sơn Trà")
            ? "Q. Sơn Trà"
            : address.includes("Cẩm Lệ")
            ? "Q. Cẩm Lệ"
            : "Đà Nẵng";

          return {
            id: item.id || `pitch-db-${rawId}`,
            numericId: Number(rawId) || 1,
            name: pitchName,
            address: address,
            latitude: item.latitude ?? 16.0544,
            longitude: item.longitude ?? 108.2022,
            district: districtCode,
            districtName: districtName,
            phone: item.phone || "",
            ownerName: item.ownerName || "",
            openTime: openTime,
            closeTime: closeTime,
            slotDurationMinutes: slotDur,
            sport: sport,
            sportList: sportTabs,
            sportBadge: pitchTypeLabel(sport) || "Sân 7 người",
            rating: item.rating ?? null,
            reviewsCount: item.reviewsCount ?? 0,
            priceOriginal: basePrice,
            priceDiscounted: basePrice,
            peakPrice: peakPrice,
            pitchTypes: item.pitchTypes && item.pitchTypes.length > 0 ? item.pitchTypes : [],
            amenities: item.amenities && item.amenities.length > 0 ? item.amenities : [],
            imageUrl:
              item.imageUrl ||
              (idx % 2 === 0
                ? "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=1000&q=80"
                : "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80"),
            timeSlots: dynamicSlots,
          };
        });
        setRealPitches(mapped);

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const pid = params.get("pitchId");
          if (pid) {
            const found = mapped.find((p: any) => String(p.id) === pid);
            if (found) setSelectedPitchForSlot(found);
          }
        }
      }
    } catch {
      setPitchLoadError("Không kết nối được máy chủ dữ liệu sân. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setLoadingRealPitches(false);
    }
  };

  useEffect(() => {
    fetchPitches();
    const unsubscribe = subscribeToBookingEvents(() => {
      fetchPitches();
    });
    return () => unsubscribe();
  }, []);

  const sportsTabs = [
    { id: "ALL", name: "Tất cả loại sân" },
    { id: "SAN7", name: "Sân 7 người" },
    { id: "SAN5", name: "Sân 5 người" },
    { id: "FUTSAL", name: "Sân Futsal" },
    { id: "SAN11", name: "Sân 11 người" },
  ];

  const districtList = [
    { id: "ALL", name: "Toàn TP. Đà Nẵng" },
    { id: "HAI_CHAU", name: "Quận Hải Châu" },
    { id: "LIEN_CHIEU", name: "Quận Liên Chiểu" },
    { id: "THANH_KHE", name: "Quận Thanh Khê" },
    { id: "CAM_LE", name: "Quận Cẩm Lệ" },
    { id: "SON_TRA", name: "Quận Sơn Trà" },
  ];

  const filteredPitches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return realPitches.filter((p) => {
      if (q) {
        const matchName = String(p.name || "").toLowerCase().includes(q);
        const matchAddr = String(p.address || "").toLowerCase().includes(q);
        if (!matchName && !matchAddr) return false;
      }
      if (selectedSport !== "ALL" && !(p.sportList ?? [p.sport]).includes(selectedSport)) return false;
      if (selectedDistrict !== "ALL" && p.district !== selectedDistrict) return false;
      if (p.priceDiscounted > maxBudget) return false;
      if (selectedTimeSlotFilter !== "ALL") {
        const slots: any[] = p.timeSlots ?? [];
        const hit = slots.some((s: any) => {
          if (selectedTimeSlotFilter === "PEAK") return isPeakSlot(s.time);
          if (selectedTimeSlotFilter === "AFTERNOON") return /^(14|15|16):/.test(s.time);
          if (selectedTimeSlotFilter === "NIGHT") return /^(20|21|22):/.test(s.time);
          return true;
        });
        if (!hit) return false;
      }
      if (onlyAvailableTonight) {
        const openTonight = (p.timeSlots ?? []).some(
          (s: any) => s.status === "AVAILABLE" && /^(17|18|19|20|21|22):/.test(s.time)
        );
        if (!openTonight) return false;
      }
      return true;
    });
  }, [realPitches, searchQuery, selectedSport, selectedDistrict, maxBudget, selectedTimeSlotFilter, onlyAvailableTonight]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSport, selectedDistrict, maxBudget, selectedTimeSlotFilter, onlyAvailableTonight]);

  const totalPages = Math.ceil(filteredPitches.length / PITCHES_PER_PAGE) || 1;
  const paginatedPitches = useMemo(() => {
    const start = (currentPage - 1) * PITCHES_PER_PAGE;
    return filteredPitches.slice(start, start + PITCHES_PER_PAGE);
  }, [filteredPitches, currentPage]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedSport("ALL");
    setSelectedDistrict("ALL");
    setSelectedTimeSlotFilter("ALL");
    setMaxBudget(800000);
    setOnlyAvailableTonight(false);
  };

  if (selectedPitchForSlot) {
    return (
      <PitchDetail
        pitch={selectedPitchForSlot}
        user={user}
        onBack={handleBackFromPitch}
      />
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {toastMsg && (
        <div className="fixed bottom-24 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-[14px] font-bold">{toastMsg}</span>
        </div>
      )}

      {/* 1. TIÊU ĐỀ TRANG & THANH CÔNG CỤ TRA CỨU SÂN TRUYỀN THỐNG */}
      <section className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Đặt Sân Bóng Đá Trực Tuyến
            </h1>
            <p className="text-[14px] text-slate-600 mt-0.5">
              Chọn cụm sân, xem bảng giờ trống thực tế và đặt giữ ca trực tiếp với chủ sân
            </p>
          </div>
          <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-600">
            <span>Hiển thị <strong className="text-slate-900">{filteredPitches.length}</strong> cụm sân</span>
          </div>
        </div>

        {/* Hàng lọc 1: Tìm theo tên/địa chỉ + Khu vực + Khung giờ + Mức giá */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên sân hoặc tên đường, quận..."
              className="w-full pl-9 pr-3 py-2.5 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0369a1]"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Khu vực"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1] cursor-pointer"
            >
              {districtList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Khung giờ"
              value={selectedTimeSlotFilter}
              onChange={(e) => setSelectedTimeSlotFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1] cursor-pointer"
            >
              <option value="ALL">Tất cả khung giờ</option>
              <option value="PEAK">Giờ cao điểm (17:00 - 20:00)</option>
              <option value="AFTERNOON">Ca chiều (14:00 - 17:00)</option>
              <option value="NIGHT">Ca tối (20:00 - 22:30)</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Mức giá tối đa"
              value={maxBudget}
              onChange={(e) => setMaxBudget(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-[14px] font-semibold text-slate-900 focus:outline-none focus:border-[#0369a1] cursor-pointer"
            >
              <option value={800000}>Mọi mức giá</option>
              <option value={300000}>Dưới 300k/giờ</option>
              <option value={400000}>Dưới 400k/giờ</option>
              <option value={500000}>Dưới 500k/giờ</option>
            </select>
          </div>
        </div>

        {/* Hàng lọc 2: Các tab loại sân + Checkbox ca trống tối nay */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar scroll-smooth">
            {sportsTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSport(tab.id)}
                className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold transition-colors cursor-pointer border shrink-0 whitespace-nowrap ${
                  selectedSport === tab.id
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-[14px] font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailableTonight}
                onChange={(e) => setOnlyAvailableTonight(e.target.checked)}
                className="w-4 h-4 accent-[#0369a1] rounded cursor-pointer"
              />
              <span>Còn ca trống tối nay</span>
            </label>

            {(searchQuery ||
              selectedSport !== "ALL" ||
              selectedDistrict !== "ALL" ||
              selectedTimeSlotFilter !== "ALL" ||
              maxBudget < 800000 ||
              onlyAvailableTonight) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[14px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. THÔNG BÁO LỖI KẾT NỐI (NẾU CÓ) */}
      {pitchLoadError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3.5">
          <div className="flex items-center gap-2 text-[14px] font-bold text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{pitchLoadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchPitches}
            disabled={loadingRealPitches}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0369a1] text-white text-[14px] font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRealPitches ? "animate-spin" : ""}`} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* 3. DANH SÁCH CỤM SÂN (LƯỚI 2 CỘT RỘNG RÃI, 8 SÂN / TRANG) */}
      {loadingRealPitches ? (
        <div className="bg-white rounded-lg p-12 border border-slate-300 text-center space-y-2">
          <Loader2 className="w-7 h-7 text-[#0369a1] animate-spin mx-auto" />
          <p className="text-[15px] font-semibold text-slate-600">Đang tải danh sách cụm sân...</p>
        </div>
      ) : filteredPitches.length === 0 ? (
        <div className="bg-white rounded-lg p-10 border border-slate-300 text-center space-y-3">
          <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Không tìm thấy cụm sân phù hợp</h3>
            <p className="text-[14px] text-slate-600">
              Vui lòng thử chọn quận khác hoặc mở rộng bộ lọc tìm kiếm.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-md bg-[#0369a1] text-white text-[14px] font-bold cursor-pointer"
          >
            Xem tất cả sân
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedPitches.map((pitch) => (
            <article
              key={pitch.id}
              className="bg-white rounded-lg overflow-hidden border border-slate-300 hover:border-[#0369a1] transition-colors flex flex-col sm:flex-row"
            >
              {/* Cột Ảnh Sân */}
              <div
                onClick={() => handleOpenPitch(pitch)}
                className="sm:w-2/5 relative min-h-[180px] sm:min-h-[210px] bg-slate-900 cursor-pointer shrink-0 overflow-hidden"
              >
                <SafeImage
                  src={pitch.imageUrl}
                  alt={pitch.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                  <span className="px-2.5 py-0.5 rounded bg-slate-900/90 text-white font-bold text-[14px]">
                    {pitch.pitchTypes?.[0] ? pitchTypeLabel(pitch.pitchTypes[0]) : pitch.sportBadge}
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[14px] font-semibold bg-slate-900/80 px-2.5 py-1 rounded">
                  <span className="truncate">{pitch.districtName}</span>
                  <span className="font-mono shrink-0">
                    {pitch.openTime} - {pitch.closeTime}
                  </span>
                </div>
              </div>

              {/* Cột Thông Tin & Chọn Giờ Nhanh */}
              <div className="sm:w-3/5 p-4 flex flex-col justify-between space-y-3 min-w-0">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h2
                      onClick={() => handleOpenPitch(pitch)}
                      className="text-base sm:text-lg font-bold text-slate-900 hover:text-[#0369a1] cursor-pointer leading-snug line-clamp-1"
                    >
                      {pitch.name}
                    </h2>
                    {pitch.rating ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[14px] font-bold text-slate-900 shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {pitch.rating}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[14px] text-slate-600 flex items-start gap-1.5 line-clamp-1">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span className="truncate">{pitch.address}</span>
                  </p>

                  {pitch.phone && (
                    <p className="text-[14px] text-slate-600 flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Liên hệ: <strong className="text-slate-800 font-mono">{pitch.phone}</strong></span>
                    </p>
                  )}

                  {(pitch.amenities ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pitch.amenities.slice(0, 3).map((a: string) => (
                        <span
                          key={a}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[14px] border border-slate-200"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Khung giờ đặt nhanh */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[14px] font-semibold text-slate-600 block">
                    Ca sân trong ngày ({pitch.slotDurationMinutes} phút/ca):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pitch.timeSlots.slice(0, 4).map((ts: any, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleOpenPitch(pitch)}
                        className="px-2.5 py-1 rounded border border-slate-300 bg-slate-50 text-slate-800 hover:bg-[#0369a1] hover:text-white hover:border-[#0369a1] font-mono text-[14px] font-semibold transition-colors cursor-pointer"
                      >
                        {ts.time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Giá tiền & Nút đặt sân */}
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200">
                  <div>
                    <span className="text-[14px] text-slate-500 block">Giá thuê từ</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-[#0369a1] font-mono">
                        {pitch.priceDiscounted.toLocaleString("vi-VN")}đ
                      </span>
                      <span className="text-[14px] text-slate-600">/giờ</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPitch(pitch)}
                    className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Chọn Ca Đặt Sân</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 4. PHÂN TRANG (8 SÂN / TRANG) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-300 bg-white p-3.5 rounded-lg border">
          <span className="text-[14px] text-slate-600 font-semibold">
            Trang <strong>{currentPage}</strong> / {totalPages} (Tổng {filteredPitches.length} cụm sân)
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 150, behavior: "smooth" });
              }}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 150, behavior: "smooth" });
                }}
                className={`w-9 h-9 rounded-md text-[14px] font-bold cursor-pointer ${
                  currentPage === page
                    ? "bg-[#0369a1] text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 150, behavior: "smooth" });
              }}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
