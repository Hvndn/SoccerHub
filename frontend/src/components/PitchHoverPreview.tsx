"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import SafeImage from "@/components/SafeImage";
import { getPitchVisual } from "@/lib/pitchVisuals";
import { Maximize2, ShieldCheck, Users, Images } from "lucide-react";

interface PitchHoverPreviewProps {
  pitchType?: string;
  customTitle?: string;
  customImageUrl?: string;
  images?: string[];
  children: React.ReactNode;
  className?: string;
}

export default function PitchHoverPreview({
  pitchType,
  customTitle,
  customImageUrl,
  images,
  children,
  className = "",
}: PitchHoverPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [coords, setCoords] = useState<{ x: number; y: number; placeAbove: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  const visual = getPitchVisual(pitchType);
  const rawList = images && images.length > 0 ? images : [customImageUrl || visual.imageUrl];
  // Filter valid string images
  const allImages = Array.from(new Set(rawList.filter(Boolean)));
  const displayImage = allImages[activeImgIdx] || allImages[0] || visual.imageUrl;
  const displayTitle = customTitle || visual.label;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tu dong chuyen anh sau moi 2.2 giay neu san co nhieu goc anh
  useEffect(() => {
    if (!isHovered || allImages.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % allImages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isHovered, allImages.length]);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipHeight = 280;
    const placeAbove = rect.top >= tooltipHeight + 16;
    
    // Clamp horizontal center between safe viewport boundaries
    const safeX = Math.max(165, Math.min(window.innerWidth - 165, rect.left + rect.width / 2));
    const targetY = placeAbove ? rect.top - 10 : rect.bottom + 10;

    setCoords({
      x: safeX,
      y: targetY,
      placeAbove,
    });
  };

  const handleMouseEnter = () => {
    setActiveImgIdx(0);
    updatePosition();
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block ${className}`}
    >
      {children}

      {mounted && isHovered && coords && createPortal(
        <div
          role="tooltip"
          className="fixed pointer-events-none transition-opacity duration-200 animate-fade-in"
          style={{
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            transform: coords.placeAbove ? "translate(-50%, -100%)" : "translate(-50%, 0%)",
            zIndex: 999999,
            filter: "drop-shadow(0 20px 35px rgba(15, 23, 42, 0.32))",
          }}
        >
          <div className="w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Ảnh thực tế của sân */}
            <div className="relative h-38 w-full bg-slate-900 overflow-hidden">
              <SafeImage
                src={displayImage}
                alt={displayTitle}
                className="w-full h-full object-cover transition-all duration-700 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-black/30" />

              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[13px] font-bold border shadow-xs ${visual.badgeBg} ${visual.badgeText} ${visual.badgeBorder}`}>
                  {visual.shortLabel}
                </span>
                {allImages.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/80 text-sky-300 border border-slate-700 flex items-center gap-1 shadow-xs">
                    <Images className="w-3 h-3" />
                    <span>{activeImgIdx + 1}/{allImages.length} ảnh</span>
                  </span>
                )}
              </div>

              {/* Chi số chấm tròn indicators khi có nhiều ảnh */}
              {allImages.length > 1 && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-950/60 px-1.5 py-0.5 rounded-full">
                  {allImages.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === activeImgIdx ? "w-3 bg-sky-400" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                <h4 className="font-black text-sm drop-shadow-sm truncate">
                  {displayTitle}
                </h4>
                <p className="text-[13px] text-slate-200 flex items-center gap-1.5 font-medium drop-shadow-xs">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{visual.dimensions}</span>
                </p>
              </div>
            </div>

            {/* Chi tiết thông số sân */}
            <div className="p-3 space-y-2 bg-white text-slate-800 text-[13px]">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block leading-tight">Mặt sân:</span>
                  <span className="text-slate-600">{visual.surface}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-slate-100">
                <Users className="w-4 h-4 text-[#0369a1] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block leading-tight">Phù hợp:</span>
                  <span className="text-slate-600">{visual.bestFor}</span>
                </div>
              </div>
            </div>

            {/* Mũi tên tooltip định vị */}
            {coords.placeAbove ? (
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
            ) : (
              <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
