"use client";

import React, { useState, useEffect } from "react";
import { Mail, X, Plus, Trash2, Send, CheckCircle2, AlertCircle, Trophy, Users, Loader2 } from "lucide-react";
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
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournament ? String(tournament.id) : (tournaments.length > 0 ? String(tournaments[0].id) : "")
  );

  const [emailInput, setEmailInput] = useState("");
  const [customMessage, setCustomMessage] = useState(
    "Ban Tổ Chức trân trọng kính mời bạn và đội bóng tham gia tranh tài tại giải đấu. Nhấp vào liên kết bên dưới để đăng ký danh sách đội ngay!"
  );

  const [invitedList, setInvitedList] = useState<string[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeTourney = tournament || tournaments.find((t) => String(t.id) === selectedTournamentId) || null;

  // Cập nhật selectedTournamentId khi prop tournament thay đổi
  useEffect(() => {
    if (tournament) {
      setSelectedTournamentId(String(tournament.id));
    } else if (tournaments.length > 0 && !selectedTournamentId) {
      setSelectedTournamentId(String(tournaments[0].id));
    }
  }, [tournament, tournaments, selectedTournamentId]);

  // Nạp danh sách email đã mời của giải
  useEffect(() => {
    if (!isOpen || !selectedTournamentId) return;
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
  }, [isOpen, selectedTournamentId]);

  if (!isOpen) return null;

  // Gửi thư mời qua email
  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || !emailInput.trim()) return;

    setIsSending(true);
    setFeedback(null);

    try {
      const res = await addTournamentInvite(
        Number(selectedTournamentId),
        emailInput.trim(),
        customMessage.trim()
      );
      setInvitedList(res.invitedEmails || []);
      setEmailInput("");
      setFeedback({
        type: "success",
        text: res.message || `Đã gửi thư mời qua email thành công tới ${res.sentCount ?? "các"} cầu thủ!`
      });
      onInviteSuccess?.();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Không thể gửi thư mời. Vui lòng kiểm tra lại địa chỉ email."
      });
    } finally {
      setIsSending(false);
    }
  };

  // Gỡ email khỏi danh sách mời
  const handleRemoveEmail = async (emailToRemove: string) => {
    if (!selectedTournamentId) return;
    try {
      const res = await removeTournamentInvite(Number(selectedTournamentId), emailToRemove);
      setInvitedList(res.invitedEmails || []);
      setFeedback({
        type: "success",
        text: `Đã gỡ lời mời của ${emailToRemove}.`
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Không thể gỡ lời mời."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white max-w-xl w-full rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200 shadow-2xl relative animate-modal-pop my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0369a1]/10 text-[#0369a1] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 truncate">
                Mời Cầu Thủ & Đội Bóng Qua Email
              </h3>
              <p className="text-[13px] text-slate-500 truncate">
                Gửi thư mời tham gia giải đấu trực tiếp qua email
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng popup mời"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông báo kết quả */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-[13px] font-bold flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
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

        {/* Chọn giải đấu (nếu có danh sách nhiều giải) */}
        {tournaments.length > 1 && !tournament && (
          <div className="space-y-1">
            <label className="text-[13px] font-black text-slate-700">
              Chọn Giải Đấu Muốn Mời:
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[13px] font-bold text-slate-900 focus:outline-none focus:border-[#0369a1]"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status === "ONGOING" ? "Đang đấu" : "Mở đăng ký"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Thông tin vắn tắt giải đấu */}
        {activeTourney && (
          <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 text-slate-800 space-y-1.5">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#0369a1] shrink-0" />
              <span className="text-[13px] font-black text-[#0369a1] truncate">
                {activeTourney.title}
              </span>
            </div>
            <div className="text-[13px] text-slate-600 grid grid-cols-2 gap-1 pt-1 font-medium">
              <span>Sân: <strong>{activeTourney.pitchName || "Đà Nẵng"}</strong></span>
              <span>Thời gian: <strong>{activeTourney.startDate || "Sắp diễn ra"}</strong></span>
              <span>Thể thức: <strong>{activeTourney.sportType || "Sân 7"}</strong></span>
              <span>Đã đăng ký: <strong>{activeTourney.registeredTeams ?? 0}/{activeTourney.totalTeams ?? 16} đội</strong></span>
            </div>
          </div>
        )}

        {/* Form nhập email và gửi thư mời */}
        <form onSubmit={handleSendInvites} className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-black text-slate-800">
                Email Cầu Thủ / Đội Trưởng Muốn Mời:
              </label>
              <span className="text-[13px] text-slate-500">
                Nhập nhiều email cách nhau bởi dấu phẩy (,)
              </span>
            </div>
            <textarea
              rows={2}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="ví dụ: captain.fc@gmail.com, cau-thu-1@turfzone.vn..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-[13px] font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0369a1] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-black text-slate-800">
              Lời Nhắn Kèm Theo Thư Mời (Tùy chọn):
            </label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Lời nhắn từ Ban Tổ Chức gửi đến đội bóng..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-[13px] text-slate-800 focus:outline-none focus:border-[#0369a1]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSending || !emailInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#0369a1] hover:bg-[#025684] text-white text-[13px] font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi thư mời...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Thư Mời Qua Email</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Danh sách các email đã được mời tham gia giải */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-black text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Danh Sách Email Đã Mời ({invitedList.length})
            </span>
            {isLoadingList && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>

          {invitedList.length === 0 ? (
            <p className="text-[13px] text-slate-500 italic py-2">
              Chưa có email nào trong danh sách mời. Nhập email ở trên để gửi thư mời tham gia giải đấu.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {invitedList.map((em) => (
                <span
                  key={em}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[13px] font-mono font-bold"
                >
                  <span>{em}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(em)}
                    title="Gỡ lời mời"
                    className="w-4 h-4 rounded-full text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
