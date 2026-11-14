"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  ExternalLink,
  Phone,
  Clock,
  Star,
  X,
  Sparkles,
} from "lucide-react";

export interface PitchMapItem {
  id: string | number;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  priceOriginal?: number;
  rating?: number | null;
  reviewsCount?: number;
  imageUrl?: string;
  sport?: string;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  districtName?: string;
  timeSlots?: any[];
}

interface PitchInteractiveMapProps {
  pitches: PitchMapItem[];
  selectedPitchId?: string | number | null;
  onSelectPitch?: (pitch: PitchMapItem) => void;
  singlePitchMode?: boolean;
  height?: string;
  className?: string;
}

// Tính khoảng cách Haversine giữa 2 tọa độ (km)
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Bán kính trái đất km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function PitchInteractiveMap({
  pitches,
  selectedPitchId,
  onSelectPitch,
  singlePitchMode = false,
  height = "520px",
  className = "",
}: PitchInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [activePitch, setActivePitch] = useState<PitchMapItem | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<"standard" | "voyager">("voyager");
  const [tileLayerInstance, setTileLayerInstance] = useState<any>(null);

  // Khởi tạo bản đồ Leaflet
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    // Load leaflet dynamic
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Tránh re-initialize Leaflet
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Tọa độ trung tâm mặc định: Đà Nẵng (16.0544, 108.2022) hoặc sân đầu tiên
      const defaultLat = pitches[0]?.latitude || 16.0544;
      const defaultLng = pitches[0]?.longitude || 108.2022;
      const initialZoom = singlePitchMode ? 15 : 13;

      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager tiles (sáng, nét, hiện đại chuẩn mobile/web)
      const tileUrl =
        mapStyle === "voyager"
          ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      setTileLayerInstance(tileLayer);
      mapInstanceRef.current = map;

      // Group chứa các marker
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;

      // Thêm markers cho từng sân
      renderPitchMarkers(L, map, markersLayer);
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [pitches, singlePitchMode]);

  // Cập nhật Markers khi danh sách sân hoặc sân được chọn thay đổi
  const renderPitchMarkers = (L: any, map: any, markersLayer: any) => {
    markersLayer.clearLayers();

    const bounds: [number, number][] = [];

    pitches.forEach((pitch, idx) => {
      const lat = pitch.latitude || 16.0544 + (idx * 0.004 - 0.008);
      const lng = pitch.longitude || 108.2022 + ((idx % 3) * 0.005 - 0.005);
      bounds.push([lat, lng]);

      const isSelected = selectedPitchId && String(pitch.id) === String(selectedPitchId);
      const priceText = pitch.priceOriginal
        ? `${Math.round(pitch.priceOriginal / 1000)}k`
        : "300k";

      // Tạo HTML Custom Marker đẹp mắt
      const iconHtml = `
        <div class="group cursor-pointer relative -translate-x-1/2 -translate-y-full transition-transform hover:scale-110 ${
          isSelected ? "scale-110 z-50" : "z-20"
        }">
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-lg border-2 font-bold text-[13px] whitespace-nowrap transition-all ${
            isSelected
              ? "bg-[#0369a1] text-white border-white ring-4 ring-[#0369a1]/30"
              : "bg-white text-slate-800 border-[#0369a1] hover:bg-sky-50"
          }">
            <span class="text-xs">⚽</span>
            <span class="font-black">${priceText}</span>
          </div>
          <div class="w-2.5 h-2.5 bg-[#0369a1] rotate-45 mx-auto -mt-1 shadow-sm border-r border-b border-white"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-pitch-pin",
        html: iconHtml,
        iconSize: [60, 36],
        iconAnchor: [30, 36],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayer);

      marker.on("click", () => {
        setActivePitch(pitch);
        map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
      });

      if (isSelected) {
        setActivePitch(pitch);
        map.setView([lat, lng], 15);
      }
    });

    // Tự động căn chỉnh bao quát tất cả sân nếu không ở chế độ 1 sân
    if (!singlePitchMode && bounds.length > 1 && map) {
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } catch {
        // Fallback
      }
    }
  };

  // Bật định vị người dùng (GPS)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationNotice("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          import("leaflet").then((L) => {
            const map = mapInstanceRef.current;
            if (!map) return;

            // Xóa user marker cũ nếu có
            if (userMarkerRef.current) {
              map.removeLayer(userMarkerRef.current);
            }

            // Tạo icon vị trí của người dùng với hiệu ứng pulse
            const userIconHtml = `
              <div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-sky-600 border-2 border-white shadow-md"></span>
              </div>
            `;
            const userIcon = L.divIcon({
              className: "user-loc-pin",
              html: userIconHtml,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            const marker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
            userMarkerRef.current = marker;

            map.flyTo([latitude, longitude], 14, { duration: 1.2 });
            setLocationNotice("📍 Đã định vị vị trí hiện tại của bạn!");
            setTimeout(() => setLocationNotice(null), 4000);
          });
        }
      },
      () => {
        setLocating(false);
        setLocationNotice("Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí trong trình duyệt.");
        setTimeout(() => setLocationNotice(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Reset view to all pitches
  const handleResetView = () => {
    if (!mapInstanceRef.current || pitches.length === 0) return;
    const bounds = pitches.map((p, idx) => [
      p.latitude || 16.0544 + (idx * 0.004 - 0.008),
      p.longitude || 108.2022 + ((idx % 3) * 0.005 - 0.005),
    ]) as [number, number][];
    try {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } catch {
      // Fallback
    }
  };

  // Mở Google Maps chỉ đường
  const openGoogleMapsDirection = (pitch: PitchMapItem) => {
    const lat = pitch.latitude || 16.0544;
    const lng = pitch.longitude || 108.2022;
    const query = encodeURIComponent(`${pitch.name} ${pitch.address || ""}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${query}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-300 shadow-md bg-slate-100 ${className}`}
      style={{ height }}
    >
      {/* Bản đồ Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Thông báo vị trí */}
      {locationNotice && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-[13px] font-bold shadow-lg backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span>{locationNotice}</span>
        </div>
      )}

      {/* Bảng điều khiển góc trên bên phải (Zoom, GPS, Reset) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        {/* Nút GPS tìm quanh tôi */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          title="Tìm vị trí của tôi"
          className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          <Compass className={`w-5 h-5 ${locating ? "animate-spin text-[#0369a1]" : "text-[#0369a1]"}`} />
        </button>

        {/* Nút Reset góc nhìn */}
        {!singlePitchMode && (
          <button
            type="button"
            onClick={handleResetView}
            title="Xem toàn bộ sân"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-md transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-slate-700" />
          </button>
        )}

        {/* Cụm Zoom In / Zoom Out */}
        <div className="flex flex-col bg-white rounded-xl border border-slate-300 shadow-md overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Phóng to"
            className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-200 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Thu nhỏ"
            className="p-2 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thẻ ghim số lượng sân góc trên bên trái */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-300 shadow-md text-slate-900 text-[13px] font-extrabold flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#0369a1]" />
          <span>{pitches.length} Cụm Sân</span>
        </div>
      </div>

      {/* Popup / Card Thông Tin Sân Đang Chọn (Nằm phía dưới bản đồ - Inline không che màn hình) */}
      {activePitch && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-30 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xl p-4 text-slate-900 relative backdrop-blur-sm">
            {/* Nút đóng card */}
            <button
              type="button"
              onClick={() => setActivePitch(null)}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* Hình ảnh sân */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                <img
                  src={
                    activePitch.imageUrl ||
                    "https://images.unsplash.com/photo-1529900241452-f47268d87ec9?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={activePitch.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thông tin chính */}
              <div className="min-w-0 flex-1 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0369a1] font-bold text-[13px] border border-sky-200">
                    {activePitch.districtName || "Đà Nẵng"}
                  </span>
                  {userLocation && (
                    <span className="text-[13px] font-bold text-emerald-700">
                      📍 ~{calculateDistanceKm(userLocation.lat, userLocation.lng, activePitch.latitude, activePitch.longitude)} km
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-[15px] text-slate-900 leading-tight mt-1 truncate">
                  {activePitch.name}
                </h3>

                <p className="text-[13px] text-slate-600 truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{activePitch.address || "Chưa có địa chỉ"}</span>
                </p>

                <div className="flex items-center gap-3 mt-1.5 text-[13px]">
                  <span className="font-black text-[#0369a1]">
                    {activePitch.priceOriginal
                      ? `${activePitch.priceOriginal.toLocaleString("vi-VN")}đ / trận`
                      : "Liên hệ giá"}
                  </span>
                  {activePitch.rating && (
                    <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{activePitch.rating.toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
              {onSelectPitch && (
                <button
                  type="button"
                  onClick={() => onSelectPitch(activePitch)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0369a1] hover:bg-[#0284c7] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>Xem Sân &amp; Đặt Lịch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => openGoogleMapsDirection(activePitch)}
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-[13px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Mở chỉ đường Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-700" />
                <span>Chỉ Đường</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

