"use client";

import React from "react";
import { MapPin, Clock, ShieldCheck, Zap, Star, Phone, Flame, Sparkles } from "lucide-react";
import FormDots from "./FormDots";

/** Chuyển reputationScore (0-100) sang số sao (1-5). */
function scoreToStars(score: number | null | undefined): number {
  const s = Math.max(0, Math.min(100, score ?? 98));
  return Math.max(1, Math.round((s / 100) * 5));
}

const SKILL_LABEL: Record<string, { label: string; tone: string }> = {
  GA_MO: { label: "Gà mờ", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PHONG_TRAO: { label: "Phong trào", tone: "bg-sky-100 text-sky-800 border-sky-200" },
  PHUI_CUNG: { label: "Phủi cứng", tone: "bg-rose-100 text-rose-700 border-rose-200" },
};

const PAYMENT_LABEL: Record<string, string> = {
  SPLIT_EQUAL: "Chia đôi (50/50)",
  LOSER_PAYS: "Đội thua trả",
  HOST_COVER: "Chủ kèo bao trọn",
};

export interface MatchmakingCardProps {
  post: any;
  isMatched?: boolean;
  isAiTop?: boolean;
  aiOffline?: boolean;
  onAccept?: (post: any) => void;
  onReview?: (post: any) => void;
}

/**
 * Thẻ bài đăng tìm đối giao hữu — hiển thị đầy đủ thông tin theo spec Prompt 3:
 * Tên đội, cụm sân, khung giờ, thể thức tiền sân, điểm uy tín (sao),
 * chuỗi phong độ 5 trận (W xanh, D xám, L đỏ) và nút "Nhận kèo".
 */
export default function MatchmakingCard({
  post,
  isMatched = false,
  isAiTop = false,
  aiOffline = false,
  onAccept,
  onReview,
}: MatchmakingCardProps) {
  const stars = scoreToStars(post.reputationScore);
  const skill = SKILL_LABEL[post.skillLevel] || SKILL_LABEL.PHONG_TRAO;

  return (
    <article className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-md hover:shadow-xl transition-all space-y-4">
      {/* Header: status + skill level + AI badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-extrabold text-[13px] border ${
              isMatched
                ? "bg-slate-100 text-slate-500 border-slate-200"
                : "bg-rose-500/10 text-rose-700 border-rose-500/30"
            }`}
          >
            <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>{isMatched ? "Đã có đối thủ" : "Kèo đang mở"}</span>
          </span>
          <span className={`px-2.5 py-1 rounded-lg font-bold text-[13px] border ${skill.tone}`}>
            {skill.label}
          </span>
          {isAiTop && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-black text-[13px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiOffline ? "Hợp phong độ nhất" : "AI đề xuất"}</span>
            </span>
          )}
        </div>

        {/* Fair-play rating (sao) */}
        <div className="flex items-center gap-1" title={`Uy tín Fair-play: ${stars}/5 sao`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i <= stars ? "text-amber-500 fill-amber-500" : "text-slate-300"}`}
            />
          ))}
          <span className="text-[13px] font-bold text-slate-500 ml-1">{post.reputationScore ?? 98}</span>
        </div>
      </div>

      {/* Team name + captain */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>{post.teamName}</span>
            <span className="text-[13px] px-2 py-0.5 rounded bg-sky-100 text-sky-900 font-bold">
              Cap: {post.captainName}
            </span>
          </h3>
          <div className="flex items-center space-x-2 text-[13px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-900 font-bold">
              <MapPin className="w-4 h-4 text-[#0b4f6c]" />
              <span>{post.pitchName}</span>
            </span>
            {post.address && (
              <>
                <span>•</span>
                <span>{post.address}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col md:items-end bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-xl">
          <div className="text-xl font-black text-slate-900 font-mono">
            {(post.estimatedFee || 50000).toLocaleString("vi-VN")}đ{" "}
            <span className="text-[13px] font-normal text-slate-500">/người</span>
          </div>
          <span className="text-[13px] font-bold text-[#0b4f6c]">
            {PAYMENT_LABEL[post.paymentModel] || post.paymentModel}
          </span>
        </div>
      </div>

      {/* Note */}
      {post.note && (
        <div className="p-3 bg-slate-50 rounded-xl text-[13px] text-slate-700 border border-slate-200/60">
          <span className="font-bold text-slate-500 mr-1">Ghi chú:</span>
          <span>{post.note}</span>
        </div>
      )}

      {/* Matched info */}
      {isMatched && (
        <div className="p-3 bg-sky-50 border border-[#0369a1]/30 rounded-xl text-[13px] flex items-center justify-between">
          <div>
            <span className="font-bold text-sky-900">Đối thủ đã nhận: </span>
            <strong className="text-slate-900">{post.opponentTeamName}</strong> (Cap: {post.opponentCaptainName})
          </div>
          <span className="text-sky-700 font-mono font-bold text-[13px]">Đã chốt kèo</span>
        </div>
      )}

      {/* Form dots + win rate */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-slate-900 font-mono text-sm font-bold">
          <ShieldCheck className="w-4 h-4 text-[#0b4f6c]" />
          <FormDots form={post.form} size="sm" />
          <span className="text-slate-500 font-sans font-bold">
            {post.record && post.record !== "0-0-0" ? `${post.record} • ` : ""}Thắng {post.winRate ?? 50}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isMatched ? (
            <>
              <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-bold">
                Đã Đầy Đội
              </span>
              {onReview && (
                <button
                  type="button"
                  onClick={() => onReview(post)}
                  className="px-3 py-2 rounded-xl bg-[#0369a1]/10 hover:bg-[#0369a1]/20 text-[#0369a1] text-[13px] font-bold transition-all flex items-center gap-1.5 border border-[#0369a1]/30"
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Đánh giá</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onAccept?.(post)}
              className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#075985] text-white font-extrabold text-[13px] shadow-md transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Nhận Kèo Giao Lưu Ngay</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// (icon helpers removed — using lucide-react directly)