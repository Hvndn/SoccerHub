"use client";

import React, { useState } from "react";
import { Sparkles, MapPin, Clock, DollarSign, Star, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";

interface PitchSearchProps {
  onSelectSlot: (pitch: any, slot: any) => void;
}

export default function PitchSearch({ onSelectSlot }: PitchSearchProps) {
  const [pitchType, setPitchType] = useState("PITCH_7");
  const [maxBudget, setMaxBudget] = useState(400000);
  const [selectedPitchForSlot, setSelectedPitchForSlot] = useState<any>(null);

  const mockPitches = [
    {
      id: "pitch-101",
      name: "Cụm Sân Bóng Đá Thể Thao Kick-ON Pro Q7",
      address: "128 Nguyễn Thị Thập, Quận 7, TP.HCM",
      latitude: 10.7412,
      longitude: 106.7123,
      avgPricePerHour: 350000,
      rating: 4.9,
      matchPct: 98,
      distanceKm: 1.2,
      pitchTypes: ["Sân 5", "Sân 7", "Sân 11"],
      amenities: ["Đèn LED cao cấp", "Căn tin & Nước", "Bãi xe ô tô", "Phòng thay đồ"],
      imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
      aiReason: "Gần vị trí của bạn 1.2km • Khung giờ rảnh 18:30 - 20:00 sẵn sàng • Đúng ngân sách < 400k"
    },
    {
      id: "pitch-102",
      name: "Sân Bóng Cỏ Nhân Tạo Tân Bình Stadium",
      address: "45 Cộng Hòa, Quận Tân Bình, TP.HCM",
      latitude: 10.8015,
      longitude: 106.6542,
      avgPricePerHour: 300000,
      rating: 4.7,
      matchPct: 91,
      distanceKm: 3.5,
      pitchTypes: ["Sân 5", "Sân 7"],
      amenities: ["Đèn chiếu sáng", "Cho thuê giày & áo đấu", "Bãi xe máy"],
      imageUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80",
      aiReason: "Giá tốt nhất khu vực • Được đánh giá 4.7★ • Mặt cỏ vừa thay mới"
    },
    {
      id: "pitch-103",
      name: "Cụm Sân Bóng Phú Nhuận Arena",
      address: "18 Hoàng Văn Thụ, Quận Phú Nhuận, TP.HCM",
      latitude: 10.7988,
      longitude: 106.6789,
      avgPricePerHour: 420000,
      rating: 4.8,
      matchPct: 86,
      distanceKm: 4.1,
      pitchTypes: ["Sân 7", "Sân 11"],
      amenities: ["Đèn LED Fixture", "Trọng tài chuyên nghiệp", "Hệ thống VAR Mini"],
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
      aiReason: "Phù hợp thi đấu giải lớn • Có hệ thống VAR Mini • Trọng tài cấp quận"
    }
  ];

  const slots = [
    { id: "slot-1", time: "17:00 - 18:30", price: 300000, status: "AVAILABLE", pitchType: "Sân 7A (Cỏ nhân tạo)" },
    { id: "slot-2", time: "18:30 - 20:00", price: 450000, status: "BOOKED", pitchType: "Sân 7A (Cỏ nhân tạo)" },
    { id: "slot-3", time: "20:00 - 21:30", price: 450000, status: "AVAILABLE", pitchType: "Sân 7A (Cỏ nhân tạo)" },
    { id: "slot-4", time: "17:00 - 18:30", price: 280000, status: "AVAILABLE", pitchType: "Sân 5B (Cỏ nhân tạo)" },
    { id: "slot-5", time: "18:30 - 20:00", price: 380000, status: "HOLD", pitchType: "Sân 5B (Khóa tạm 5p)" },
    { id: "slot-6", time: "20:00 - 21:30", price: 380000, status: "AVAILABLE", pitchType: "Sân 5B (Cỏ nhân tạo)" },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero AI Search Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 border border-pitch-emerald/30">
        <div className="relative z-10 space-y-8">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full glass-panel-emerald mb-2">
              <Sparkles className="w-4 h-4 text-pitch-lime animate-pulse" />
              <span className="text-xs font-bold text-pitch-lime uppercase tracking-wider">AI Recommendation Engine v2.4</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Tìm Ca Sân & Gợi Ý AI Thông Minh
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Tự động đề xuất cụm sân bóng phù hợp nhất theo khoảng cách PostGIS, khung giờ rảnh và ngân sách của bạn.
            </p>
          </div>

          {/* Interactive Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2 text-pitch-emerald" /> Loại Sân Thi Đấu
              </label>
              <select
                value={pitchType}
                onChange={(e) => setPitchType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-pitch-emerald"
              >
                <option value="PITCH_5">Sân 5 Người (Futsal / Cỏ)</option>
                <option value="PITCH_7">Sân 7 Người (Tiêu chuẩn)</option>
                <option value="PITCH_11">Sân 11 Người (Thi đấu lớn)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1.5 text-pitch-lime" /> Ngân Sách Tối Đa</span>
                <span className="text-pitch-lime font-extrabold">{maxBudget.toLocaleString('vi-VN')} đ/h</span>
              </label>
              <input
                type="range"
                min="200000"
                max="600000"
                step="50000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-pitch-emerald cursor-pointer mt-3"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-pitch-emerald" /> Khu Vực Ưu Tiên
              </label>
              <input
                type="text"
                readOnly
                value="Quận 7, TP. Hồ Chí Minh (GPS Bật)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-pitch-lime focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Cards Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
            <Sparkles className="w-6 h-6 text-pitch-lime mr-2.5" /> Top Cụm Sân Được AI Đề Xuất Cho Bạn
          </h2>
          <span className="text-xs font-semibold text-slate-400">Hiển thị {mockPitches.length} kết quả tối ưu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockPitches.map((pitch) => (
            <div
              key={pitch.id}
              className="glass-panel rounded-3xl overflow-hidden hover:border-pitch-emerald/60 transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-2xl"
            >
              <div>
                {/* Pitch Thumbnail & AI Score Ribbon */}
                <div className="relative h-52 sm:h-56 overflow-hidden">
                  <img
                    src={pitch.imageUrl}
                    alt={pitch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/20" />
                  
                  {/* Match Percentage Badge */}
                  <div className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-pitch-navy/90 backdrop-blur-md border border-pitch-lime/40 flex items-center space-x-1.5 stadium-shadow">
                    <Sparkles className="w-4 h-4 text-pitch-lime" />
                    <span className="text-xs font-extrabold text-pitch-lime">{pitch.matchPct}% Phù Hợp</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-bold text-white">
                    <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-pitch-emerald" /> {pitch.distanceKm} km
                    </span>
                    <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-pitch-lime flex items-center">
                      <Star className="w-3.5 h-3.5 mr-1 text-amber-400 fill-amber-400" /> {pitch.rating}
                    </span>
                  </div>
                </div>

                {/* Pitch Info */}
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white leading-snug group-hover:text-pitch-emerald transition-colors">
                    {pitch.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center leading-relaxed">
                    <MapPin className="w-4 h-4 mr-1.5 shrink-0 text-slate-500" /> {pitch.address}
                  </p>

                  {/* AI Explanation Pill */}
                  <div className="p-4 rounded-2xl bg-pitch-emerald/10 border border-pitch-emerald/20 text-xs text-pitch-emerald font-medium leading-relaxed">
                    💡 <strong>Lý do gợi ý:</strong> {pitch.aiReason}
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {pitch.amenities.map((item, idx) => (
                      <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer & Action */}
              <div className="p-6 pt-4 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Giá trung bình</span>
                  <span className="text-lg font-extrabold text-pitch-lime">{pitch.avgPricePerHour.toLocaleString('vi-VN')} đ/h</span>
                </div>
                <button
                  onClick={() => setSelectedPitchForSlot(pitch)}
                  className="px-5 py-3 rounded-xl bg-pitch-emerald hover:bg-pitch-darkEmerald text-white font-extrabold text-xs transition-all duration-200 flex items-center space-x-1.5 stadium-shadow"
                >
                  <span>Chọn Ca Sân</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slot Matrix Modal */}
      {selectedPitchForSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel max-w-3xl w-full rounded-3xl p-6 sm:p-10 space-y-8 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPitchForSlot(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-pitch-emerald">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ma Trận Khung Giờ Ca Sân Trực Tiếp</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{selectedPitchForSlot.name}</h3>
              <p className="text-xs text-slate-400">{selectedPitchForSlot.address}</p>
            </div>

            {/* Timeline Matrix */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <span>Chọn ca đấu ngày: <strong className="text-white">Hôm nay (15/09/2026)</strong></span>
                <div className="flex items-center space-x-4 text-xs font-semibold">
                  <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-pitch-emerald mr-1.5" /> Trống</span>
                  <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5" /> Khóa 5p</span>
                  <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-700 mr-1.5" /> Đã Đặt</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {slots.map((slot) => {
                  const isAvailable = slot.status === "AVAILABLE";
                  const isHold = slot.status === "HOLD";
                  return (
                    <div
                      key={slot.id}
                      className={`p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        isAvailable
                          ? "bg-slate-900/90 border-slate-700 hover:border-pitch-emerald cursor-pointer shadow-md"
                          : isHold
                          ? "bg-amber-950/30 border-amber-500/40 opacity-80"
                          : "bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-pitch-lime block">{slot.pitchType}</span>
                        <span className="text-lg font-extrabold text-white block">{slot.time}</span>
                        <span className="text-xs font-semibold text-slate-400">{slot.price.toLocaleString('vi-VN')} đ</span>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => {
                            onSelectSlot(selectedPitchForSlot, slot);
                            setSelectedPitchForSlot(null);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-pitch-emerald text-white text-xs font-bold hover:bg-pitch-darkEmerald transition-colors shadow-lg"
                        >
                          Đặt Ca
                        </button>
                      ) : (
                        <span className={`text-xs px-3 py-1.5 rounded-xl font-bold ${
                          isHold ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-500"
                        }`}>
                          {isHold ? "Khóa 5p" : "Đã Đặt"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
