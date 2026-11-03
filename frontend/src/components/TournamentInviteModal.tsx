"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Mail,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Users,
  Loader2,
  Lock,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { addTournamentInvite, removeTournamentInvite, fetchJoinAccess } from "@/lib/organizerService";
import { Tournament } from "@/lib/tournamentService";

interface TournamentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament?: Tournament | null;
  tournaments?: Tournament[];
  onInviteSuccess?: () => void;
}

export default function TournamentInviteModal({
  isOpen,
  onClose,
  tournament,
  tournaments = [],
  onInviteSuccess,
}: TournamentInviteModalProps) {
  const inviteOnlyTourneys = useMemo(
    () => tournaments.filter((t) => t.joinMode === "INVITE_ONLY"),
    [tournaments]
  );

  const initialId = tournament
    ? String(tournament.id)
    : inviteOnlyTourneys.length > 0
    ? String(inviteOnlyTourneys[0].id)
    : "";

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(initialId);
  const [emailInput, setEmailInput] = useState("");
  const [customMessage, setCustomMessage] = useState(
    "Ban Tổ Chức trân trọng kính mời bạn và đội bóng tham gia tranh tài tại giải đấu. Nhấp vào liên kết để nộp hồ sơ đăng ký ngay!"
  );

  const [invitedList, setInvitedList] = useState<string[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeTourney =
    tournament ||
    tournaments.find((t) => String(t.id) === selectedTournamentId) ||
    null;

  const isInviteOnly = activeTourney?.joinMode === "INVITE_ONLY";

  useEffect(() => {
    if (tournament) {
      setSelectedTournamentId(String(tournament.id));
    } else if (inviteOnlyTourneys.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(String(inviteOnlyTourneys[0].id));
    }
  }, [tournament, inviteOnlyTourneys, selectedTournamentId]);

  useEffect(() => {
    if (!isOpen || !selectedTournamentId || !isInviteOnly) return;
    let alive = true;
    setIsLoadingList(true);
    setFeedback(null);

    fetchJoinAccess(Number(selectedTournamentId))
      .then((acc) => {
        if (alive) setInvitedList(acc.invitedEmails || []);
      })
      .catch(() => {
        if (alive) setInvitedList([]);
      })
      .finally(() => {
        if (alive) setIsLoadingList(false);
      });

    return () => {
      alive = false;
    };
  }, [isOpen, selectedTournamentId, isInviteOnly]);

  if (!isOpen) return null;

  const handleCopyInviteLink = () => {
    if (!selectedTournamentId) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const link = `${origin}/tournaments/register?tournamentId=${selectedTournamentId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || !emailInput.trim()) return;

    if (!isInviteOnly) {
      setFeedback({
        type: "error",
        text: "Giải đấu này không có ràng buộc mời email. Chỉ các giải 'INVITE_ONLY' mới có thể gửi thư mời.",
      });
      return;
    }

    const emails = emailInput
      .split(/[,;\s]+/)
      .map((em) => em.trim().toLowerCase())
      .filter((em) => em.includes("@"));

    if (emails.length === 0) {
      setFeedback({
        type: "error",
        text: "Vui lòng nhập ít nhất một địa chỉ email hợp lệ (có chứa ký tự @).",
      });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      let lastRes: any = null;
      for (const email of emails) {
        lastRes = await addTournamentInvite(
          Number(selectedTournamentId),
          email,
          customMessage.trim()
        );
      }
      setInvitedList(lastRes?.invitedEmails || []);
      setEmailInput("");
      setFeedback({
        type: "success",
        text: `Đã gửi thư mời và cấp quyền tham gia cho ${emails.length} email thành công!`,
      });
      onInviteSuccess?.();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Không thể gửi thư mời. Vui lòng kiểm tra lại địa chỉ email.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    if (!selectedTournamentId) return;
    try {
      const res = await removeTournamentInvite(Number(selectedTournamentId), emailToRemove);
      setInvitedList(res.invitedEmails || []);
      setFeedback({
        type: "success",
        text: `Đã gỡ lời mời của ${emailToRemove}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Không thể gỡ lời mời.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white max-w-xl w-full rounded-lg p-5 space-y-4 border border-slate-300 shadow-xl relative animate-modal-pop my-auto max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate flex items-center gap-2">
                <span>Mời Đội Tham Gia Giải (Email)</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[12px] font-bold inline-flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Giải Kín
                </span>
              </h3>
              <p className="text-[13px] text-slate-500 truncate">
                Cấp quyền tham gia và gửi thư mời cho đội bóng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng popup mời"
            className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông báo kết quả */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-[13px] font-bold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                : "bg-rose-50 text-rose-800 border border-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="flex-1">{feedback.text}</span>
          </div>
        )}

        {/* Chọn giải đấu (nếu có nhiều giải INVITE_ONLY) */}
        {inviteOnlyTourneys.length > 1 && !tournament && (
          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-700">
              Chọn Giải Đấu Kín Có Ràng Buộc Email:
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
            >
              {inviteOnlyTourneys.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status === "ONGOING" ? "Đang đấu" : "Mở đăng ký"} • {t.registeredTeams ?? 0}/{t.totalTeams ?? "—"} đội)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cảnh báo nếu giải đang chọn KHÔNG PHẢI là INVITE_ONLY */}
        {!isInviteOnly && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[13px] space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Giải đấu này đang mở tự do (Ai cũng có thể tham gia)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Nếu bạn muốn giới hạn danh sách tham gia qua email, hãy chuyển sang chế độ <strong>“Chỉ mời qua email (INVITE_ONLY)”</strong> trong bảng điều hành giải.
            </p>
          </div>
        )}

        {/* Thông tin vắn tắt giải đấu */}
        {activeTourney && (
          <div className="p-3.5 rounded-lg bg-sky-50/70 border border-sky-300 text-slate-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-[#0369a1] shrink-0" />
                <span className="text-[13px] font-bold text-[#0369a1] truncate">
                  {activeTourney.title}
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[12px] font-bold shrink-0 border ${
                  isInviteOnly
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-100 text-emerald-900 border-emerald-300"
                }`}
              >
                {isInviteOnly ? "🔒 Chỉ mời email" : "🔓 Tự do tham gia"}
              </span>
            </div>
            <div className="text-[13px] text-slate-600 grid grid-cols-2 gap-1 pt-1">
              <span>Sân: <strong>{activeTourney.pitchName || "Đà Nẵng"}</strong></span>
              <span>Thời gian: <strong>{activeTourney.startDate || "Sắp diễn ra"}</strong></span>
              <span>Đã đăng ký: <strong>{activeTourney.registeredTeams ?? 0}/{activeTourney.totalTeams ?? 16} đội</strong></span>
            </div>
          </div>
        )}

        {/* Hộp sao chép liên kết mời nhanh */}
        {selectedTournamentId && (
          <div className="p-3 rounded-lg border border-slate-300 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-[#0369a1]" />
                Đường dẫn đăng ký trực tiếp:
              </span>
              <span className="text-[12px] text-slate-500">Gửi qua Zalo/Facebook</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/tournaments/register?tournamentId=${selectedTournamentId}`}
                className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white font-mono text-[12px] text-slate-700 outline-none"
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="px-3 py-1.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white text-[12px] font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Đã chép!" : "Sao chép"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Form nhập email và gửi thư mời */}
        {isInviteOnly && (
          <form onSubmit={handleSendInvites} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-bold text-slate-800">
                  Địa Chỉ Email Đội Trưởng / Cầu Thủ Được Phép Tham Gia:
                </label>
                <span className="text-[12px] text-slate-500">
                  Nhiều email cách nhau bởi dấu phẩy (,)
                </span>
              </div>
              <textarea
                rows={2}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="ví dụ: captain.fc@gmail.com, doibong@gmail.com..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0369a1] resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[13px] font-bold text-slate-800">
                Lời Nhắn Kèm Theo Thư Mời (Tùy chọn):
              </label>
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Lời nhắn từ Ban Tổ Chức gửi đến đội bóng..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0369a1]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSending || !emailInput.trim()}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[13px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi thư mời…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Thư Mời Email</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Danh sách các email đã được mời tham gia giải */}
        {isInviteOnly && (
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                Danh Sách Email Đã Được Phép Đăng Ký ({invitedList.length})
              </span>
              {isLoadingList && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
            </div>

            {invitedList.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic py-1">
                Chưa có email nào trong danh sách mời. Nhập email ở trên để cấp quyền tham gia giải.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {invitedList.map((em) => (
                  <span
                    key={em}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[13px] font-mono font-bold"
                  >
                    <span>{em}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(em)}
                      title="Gỡ lời mời"
                      className="w-4 h-4 rounded-full text-amber-600 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
