"use client";

import React, { useEffect, useMemo, useState } from "react";
import { matchmakingAi } from "@/lib/aiService";
import { buildVietQrUrl } from "@/lib/tournamentService";
import { getAllPitchesApi } from "@/lib/pitchService";
import {
  MapPin,
  Clock,
  Zap,
  Star,
  ShieldCheck,
  PlusCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ArrowUpDown,
  Phone,
  Users,
  AlertTriangle,
  UserCheck,
  MessageCircle,
  LifeBuoy,
} from "lucide-react";
import { API_BASE_URL, apiRequest, ensureLoggedIn, fetchWithTimeout } from "@/lib/api";
import { toastOk, toastErr } from "@/lib/toast";
import { submitTeamReview } from "@/lib/adminService";
import FormDots from "./FormDots";

interface MatchmakingMarketplaceProps {
  user?: any;
  onSelectMatch?: (match: any) => void;
  onCreateMatch?: () => void;
}

function KeoPaymentInfo({ post, pitch }: { post: any; pitch: any }) {
  const fee = Number(post?.estimatedFee ?? 50000);
  const rule =
    post?.paymentModel === "SPLIT_EQUAL"
      ? "Chia đôi tiền sân 50/50"
      : post?.paymentModel === "LOSER_PAYS"
      ? "Đội thua chịu 100% tiền sân"
      : "Chủ kèo bao trọn tiền sân";

  const qr = pitch
    ? buildVietQrUrl({
        bankCode: pitch.bankCode,
        bankAccount: pitch.bankAccount,
        accountName: pitch.accountName,
        entryFee: fee,
        addInfo: `Keo ${(post?.pitchName ?? "").slice(0, 18)}`.slice(0, 25),
      })
    : null;

  return (
    <div className="rounded-md bg-slate-50 border border-slate-200 p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="font-bold text-slate-900 text-[13px]">
          Thanh toán tiền sân • <span className="text-[#0369a1]">{rule}</span>
        </div>
        <p className="text-slate-900 font-bold font-mono text-[14px]">
          {fee.toLocaleString("vi-VN")}đ <span className="font-normal text-slate-500 text-[13px]">/ người</span>
        </p>
        {!qr && (
          <p className="text-[13px] text-slate-600">
            Liên hệ trực tiếp chủ sân{pitch?.phone ? ` (${pitch.phone})` : ""} để thanh toán tại sân.
          </p>
        )}
      </div>
      {qr && (
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src={qr}
            alt="QR chuyển khoản tiền sân"
            className="w-20 h-20 object-contain rounded border border-slate-200 bg-white p-1"
          />
          <div className="text-[13px] text-slate-600 max-w-[140px]">
            <div className="font-bold text-slate-800">Quét VietQR</div>
            <div className="truncate">{pitch?.accountName || "Tài khoản sân"}</div>
            {pitch?.bankAccount && <div className="font-mono">{pitch.bankAccount}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchmakingMarketplace({ user }: MatchmakingMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<"open" | "matched">("open");
  const [postTypeFilter, setPostTypeFilter] = useState<"ALL" | "MATCH" | "SOS_GUEST">("ALL");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedPosition, setSelectedPosition] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("ALL");
  const [paymentModel, setPaymentModel] = useState("ALL");
  const [pitches, setPitches] = useState<any[]>([]);

  // Fair-play rating inline state
  const [reviewPost, setReviewPost] = useState<any>(null);
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewOnTime, setReviewOnTime] = useState(true);
  const [reviewFairPlay, setReviewFairPlay] = useState(true);
  const [reviewSportsmanship, setReviewSportsmanship] = useState(true);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Data from backend
  const [posts, setPosts] = useState<any[]>([]);
  const [matchedPosts, setMatchedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Inline create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createPostType, setCreatePostType] = useState<"MATCH" | "SOS_GUEST">("MATCH");
  const [createNeededPosition, setCreateNeededPosition] = useState<string>("BAT_KY");
  const [createNeededCount, setCreateNeededCount] = useState<number>(1);
  const [createTeamName, setCreateTeamName] = useState("");
  const [createPitchName, setCreatePitchName] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createMatchTime, setCreateMatchTime] = useState("19:30 Tối nay");
  const [createPitchType, setCreatePitchType] = useState("SAN_7");
  const [createPaymentModel, setCreatePaymentModel] = useState("SPLIT_EQUAL");
  const [createFee, setCreateFee] = useState(50000);
  const [createNote, setCreateNote] = useState("");
  const [creating, setCreating] = useState(false);

  // Inline accept form
  const [acceptingPost, setAcceptingPost] = useState<any | null>(null);
  const [acceptOpponentTeam, setAcceptOpponentTeam] = useState("");
  const [acceptOpponentPhone, setAcceptOpponentPhone] = useState(user?.phone || "");
  const [accepting, setAccepting] = useState(false);
  const [lastAcceptedPost, setLastAcceptedPost] = useState<any | null>(null);

  const userName = user?.fullName || user?.name || "Khách";

  const myTeamPost: any | null =
    (user?.phone
      ? posts.find(
          (p: any) =>
            p.captainPhone &&
            user?.phone &&
            String(p.captainPhone).replace(/\s/g, "") === String(user.phone).replace(/\s/g, "")
        )
      : null) ?? null;
  const myWinRate = myTeamPost?.winRate ?? 50;
  const myForm: string = myTeamPost?.form ?? "";
  const myTeamName: string = myTeamPost?.teamName ?? userName;

  const [aiOrder, setAiOrder] = useState<string[] | null>(null);
  const [aiSorting, setAiSorting] = useState(false);

  const formScoreOf = (a: string, b: string) => {
    const x = (a || "").toUpperCase().slice(0, 5);
    const y = (b || "").toUpperCase().slice(0, 5);
    let s = 0;
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      if ("WDL".includes(x[i]) && x[i] === y[i]) s += 1;
    }
    return s;
  };

  const sortBySkill = async () => {
    if (posts.length === 0 || aiSorting) return;
    try {
      setAiSorting(true);
      const res = await matchmakingAi(
        {
          id: "me",
          name: myTeamName,
          win_rate: myWinRate,
          played: myTeamPost?.played ?? 0,
          record: myTeamPost?.record ?? "",
          recent_form: myForm,
        },
        posts.map((p: any) => ({
          id: String(p.id),
          name: p.teamName || "Kèo",
          win_rate: p.winRate ?? 50,
          played: p.played ?? 0,
          record: p.record ?? "",
          recent_form: p.form ?? "",
          contact_phone: p.captainPhone ?? null,
        }))
      );
      if (res && Array.isArray(res.matched_opponents) && res.matched_opponents.length > 0) {
        setAiOrder(res.matched_opponents.map((o: any) => String(o.id)));
      } else {
        setAiOrder(
          [...posts]
            .sort(
              (a: any, b: any) =>
                Math.abs((a.winRate ?? 50) - myWinRate) - Math.abs((b.winRate ?? 50) - myWinRate) ||
                formScoreOf(b.form, myForm) - formScoreOf(a.form, myForm)
            )
            .map((p: any) => String(p.id))
        );
      }
    } finally {
      setAiSorting(false);
    }
  };

  const postPassesFilter = (p: any) => {
    if (postTypeFilter === "MATCH" && p.postType === "SOS_GUEST") return false;
    if (postTypeFilter === "SOS_GUEST" && p.postType !== "SOS_GUEST") return false;
    if (selectedPosition !== "ALL" && p.postType === "SOS_GUEST") {
      if (p.neededPosition && p.neededPosition !== "BAT_KY" && p.neededPosition !== selectedPosition) {
        return false;
      }
    }
    if (selectedSport !== "ALL" && p.pitchType !== selectedSport) return false;
    if (paymentModel !== "ALL" && p.paymentModel !== paymentModel) return false;
    if (selectedTimeSlot === "TONIGHT") {
      const mt = String(p.matchTime ?? "");
      const hour = Number.parseInt(mt.split(":")[0] ?? "0", 10) || 0;
      if (!/mai/i.test(mt) && hour < 17) return false;
    } else if (selectedTimeSlot === "TOMORROW") {
      if (!/mai/i.test(String(p.matchTime ?? ""))) return false;
    }
    const form: string = p.form ?? "";
    const winRate: number = p.winRate ?? 50;
    if (selectedLevel === "Có lịch sử") return form !== "";
    if (selectedLevel === "Phong độ cao") return winRate >= 60;
    if (selectedLevel === "Tân binh") return form === "";
    return true;
  };

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter(postPassesFilter);
    if (!aiOrder) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const ra = aiOrder.indexOf(String(a.id));
      const rb = aiOrder.indexOf(String(b.id));
      return (ra === -1 ? Number.MAX_SAFE_INTEGER : ra) - (rb === -1 ? Number.MAX_SAFE_INTEGER : rb);
    });
  }, [posts, postTypeFilter, selectedPosition, selectedSport, paymentModel, selectedTimeSlot, selectedLevel, aiOrder]);

  const fetchPosts = async () => {
    try {
      setLoadingPosts(true);
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/community/matchmaking-posts`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setPosts(list.filter((p: any) => p.status === "OPEN"));
        setMatchedPosts(list.filter((p: any) => p.status === "MATCHED"));
      }
    } catch (err) {
      console.error("Error fetching matchmaking posts:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    let alive = true;
    getAllPitchesApi()
      .then((list) => {
        if (alive) setPitches(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const findPitchByName = (name?: string | null) => {
    const n = (name ?? "").trim().toLowerCase();
    if (!n) return null;
    const norm = (s: string) =>
      s
        .toLowerCase()
        .replace(/\(.*?\)/g, " ")
        .replace(/[^a-z0-9à-ỹ]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const target = norm(n);
    return (
      pitches.find((p) => norm(String(p.name)) === target) ||
      pitches.find((p) => norm(String(p.name)).includes(target)) ||
      pitches.find((p) => target.includes(norm(String(p.name)))) ||
      null
    );
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      if (!ensureLoggedIn("đăng kèo giao lưu hoặc báo SOS")) return;
      await apiRequest<any>("/api/v1/community/matchmaking-posts", {
        method: "POST",
        body: JSON.stringify({
          teamName: createTeamName.trim() || `FC ${userName}`,
          captainName: userName,
          captainPhone: user?.phone || "",
          pitchName: createPitchName.trim() || "Chưa chọn sân",
          address: createAddress.trim(),
          matchTime: createMatchTime,
          pitchType: createPitchType,
          paymentModel: createPaymentModel,
          estimatedFee: createFee,
          note: createNote.trim() || (createPostType === "SOS_GUEST" ? "Cần người đá ké vui vẻ, văn minh." : "Tìm đối giao lưu vui vẻ, đúng giờ."),
          postType: createPostType,
          neededPosition: createNeededPosition,
          neededCount: createNeededCount,
        }),
      });

      setShowCreateForm(false);
      setCreateTeamName("");
      setCreateNote("");
      fetchPosts();
      toastOk(createPostType === "SOS_GUEST" ? "Đã phát tin SOS mượn chân thành công!" : "Đã đăng kèo thành công!");
    } catch (err: any) {
      toastErr(err?.message || "Lỗi kết nối máy chủ khi tạo bài đăng.");
    } finally {
      setCreating(false);
    }
  };

  const handleAcceptPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingPost) return;
    if (!ensureLoggedIn("nhận kèo")) return;
    try {
      setAccepting(true);
      const data = await apiRequest<any>(
        `/api/v1/community/matchmaking-posts/${acceptingPost.id}/accept`,
        {
          method: "POST",
          body: JSON.stringify({
            opponentTeamName: acceptOpponentTeam.trim() || (acceptingPost.postType === "SOS_GUEST" ? "Viện Binh" : `FC ${userName}`),
            opponentCaptainName: userName,
            opponentCaptainPhone: acceptOpponentPhone.trim() || user?.phone || "",
          }),
        }
      );

      toastOk(data?.message || (acceptingPost.postType === "SOS_GUEST" ? "Nhận chân thành công!" : "Ghép kèo thành công!"));
      setLastAcceptedPost({
        ...acceptingPost,
        captainPhone: acceptingPost.captainPhone,
        captainName: acceptingPost.captainName,
        teamName: acceptingPost.teamName,
        pitchName: acceptingPost.pitchName,
        matchTime: acceptingPost.matchTime,
        postType: acceptingPost.postType,
      });
      setAcceptingPost(null);
      setAcceptOpponentTeam("");
      fetchPosts();
    } catch (err: any) {
      toastErr(err?.message || "Lỗi kết nối máy chủ khi nhận kèo.");
    } finally {
      setAccepting(false);
    }
  };

  const pitchLabel = (pt?: string) =>
    pt === "SAN_7" ? "Sân 7" : pt === "SAN_5" ? "Sân 5" : pt === "FUTSAL" ? "Futsal" : "Sân 11";

  const paymentLabel = (pm?: string) =>
    pm === "SPLIT_EQUAL" ? "Chia đôi 50/50" : pm === "LOSER_PAYS" ? "Đội thua trả" : "Chủ kèo bao sân";

  const positionLabel = (pos?: string) => {
    switch (pos) {
      case "THU_MON":
        return "Thủ Môn";
      case "HAU_VE":
        return "Hậu Vệ";
      case "TIEN_VE":
        return "Tiền Vệ";
      case "TIEN_DAO":
        return "Tiền Đạo";
      default:
        return "Bất Kỳ Vị Trí";
    }
  };

  return (
    <div className="w-full space-y-4 pb-14 text-slate-900">
      {/* THÔNG BÁO VỪA NHẬN KÈO / NHẬN CHÂN SOS THÀNH CÔNG */}
      {lastAcceptedPost && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lastAcceptedPost.postType === "SOS_GUEST"
                  ? "Đã nhận chân viện binh thành công!"
                  : "Đã bắt kèo giao hữu thành công!"}
              </span>
            </div>
            <p className="text-[13px] text-emerald-800">
              Trận đấu: <strong>{lastAcceptedPost.teamName}</strong> tại <strong>{lastAcceptedPost.pitchName}</strong> ({lastAcceptedPost.matchTime}). Vui lòng liên hệ Đội trưởng <strong>{lastAcceptedPost.captainName}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lastAcceptedPost.captainPhone && (
              <>
                <a
                  href={`tel:${lastAcceptedPost.captainPhone}`}
                  className="px-3 py-1.5 rounded bg-white border border-emerald-300 text-emerald-800 text-[13px] font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi {lastAcceptedPost.captainPhone}</span>
                </a>
                <a
                  href={`https://zalo.me/${String(lastAcceptedPost.captainPhone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded bg-[#0369a1] text-white text-[13px] font-bold flex items-center gap-1.5 hover:bg-[#075985] transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Nhắn Zalo</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => setLastAcceptedPost(null)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. HEADER & TABS */}
      <section className="bg-white border border-slate-300 rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Chợ Kèo & SOS Mượn Chân Giờ Chót
            </h1>
            <p className="text-[14px] text-slate-600 mt-1">
              Đăng tin bắt đối thủ giao lưu hoặc phát tín hiệu SOS mượn người đá ké khi đội thiếu chân trước giờ bóng lăn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCreatePostType("SOS_GUEST");
                setShowCreateForm(true);
              }}
              className="px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>🚨 Báo SOS Thiếu Chân</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCreatePostType("MATCH");
                setShowCreateForm((v) => !v);
              }}
              className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showCreateForm && createPostType === "MATCH" ? "Đóng Form" : "+ Đăng Kèo Giao Lưu"}</span>
            </button>
          </div>
        </div>

        {/* INLINE CREATE FORM */}
        {showCreateForm && (
          <form
            onSubmit={handleCreatePost}
            className={`mt-4 p-4 rounded-lg border space-y-3.5 text-[14px] transition-all ${
              createPostType === "SOS_GUEST"
                ? "bg-rose-50/40 border-rose-300"
                : "bg-slate-50 border-slate-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base">
                  {createPostType === "SOS_GUEST"
                    ? "🚨 Đăng Tin SOS Mượn Chân / Tìm Viện Binh Giờ Chót"
                    : "Đăng Tin Tìm Đối Giao Hữu"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-[13px] font-bold">
                  <button
                    type="button"
                    onClick={() => setCreatePostType("MATCH")}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      createPostType === "MATCH" ? "bg-[#0369a1] text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Kèo Giao Hữu
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreatePostType("SOS_GUEST")}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      createPostType === "SOS_GUEST" ? "bg-rose-600 text-white" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    🚨 SOS Mượn Chân
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-500 hover:text-slate-800 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Tên đội bóng (FC) *</label>
                <input
                  type="text"
                  required
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  placeholder={`Ví dụ: FC ${userName}`}
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              {createPostType === "SOS_GUEST" ? (
                <>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">Vị trí cần tìm *</label>
                    <select
                      value={createNeededPosition}
                      onChange={(e) => setCreateNeededPosition(e.target.value)}
                      className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                    >
                      <option value="BAT_KY">⭐ Bất kỳ vị trí</option>
                      <option value="THU_MON">🧤 Thủ Môn (Gôn)</option>
                      <option value="HAU_VE">🛡️ Hậu Vệ (Thòng/Biên)</option>
                      <option value="TIEN_VE">⚡ Tiền Vệ (Giữa)</option>
                      <option value="TIEN_DAO">🎯 Tiền Đạo (Tiền đạo cắm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">Số lượng thiếu *</label>
                    <select
                      value={createNeededCount}
                      onChange={(e) => setCreateNeededCount(Number(e.target.value))}
                      className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                    >
                      <option value={1}>Cần 1 người</option>
                      <option value={2}>Cần 2 người</option>
                      <option value={3}>Cần 3 người</option>
                      <option value={4}>Cần 4+ người</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">Loại sân</label>
                  <select
                    value={createPitchType}
                    onChange={(e) => setCreatePitchType(e.target.value)}
                    className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                  >
                    <option value="SAN_7">Sân 7 người</option>
                    <option value="SAN_5">Sân 5 người</option>
                    <option value="SAN_11">Sân 11 người</option>
                    <option value="FUTSAL">Sân Futsal</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Khung giờ thi đấu *</label>
                <input
                  type="text"
                  required
                  value={createMatchTime}
                  onChange={(e) => setCreateMatchTime(e.target.value)}
                  placeholder="Ví dụ: 19:30 Tối nay"
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Tên sân thi đấu *</label>
                <input
                  type="text"
                  required
                  value={createPitchName}
                  onChange={(e) => setCreatePitchName(e.target.value)}
                  placeholder="Ví dụ: Sân Tuyên Sơn (Sân 7A)"
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Địa chỉ sân (tuỳ chọn)</label>
                <input
                  type="text"
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  placeholder="Ví dụ: Hải Châu, Đà Nẵng"
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  {createPostType === "SOS_GUEST" ? "Chi phí cho người đá ké" : "Hình thức tiền sân"}
                </label>
                <select
                  value={createPaymentModel}
                  onChange={(e) => setCreatePaymentModel(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                >
                  <option value="HOST_COVER">Đội bao sân (0đ - Miễn phí viện binh)</option>
                  <option value="SPLIT_EQUAL">Cưa đôi / Đóng góp nhỏ</option>
                  <option value="LOSER_PAYS">Đội thua trả 100%</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Mức phí dự kiến (đ)</label>
                <input
                  type="number"
                  step={5000}
                  value={createFee}
                  onChange={(e) => setCreateFee(Number(e.target.value))}
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-mono focus:outline-none focus:border-[#0369a1]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Lời nhắn / Yêu cầu</label>
                <input
                  type="text"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder={
                    createPostType === "SOS_GUEST"
                      ? "Ví dụ: Đội đá văn phòng dưỡng sinh, thiếu 1 gôn nhiệt tình, có mặt trước 15p..."
                      : "Giao lưu vui vẻ, đúng giờ, đá đẹp..."
                  }
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-md bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={creating}
                className={`px-5 py-2 rounded-md text-white font-bold flex items-center gap-1.5 cursor-pointer ${
                  createPostType === "SOS_GUEST"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-[#0369a1] hover:bg-[#075985]"
                }`}
              >
                {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {creating
                    ? "Đang phát tin..."
                    : createPostType === "SOS_GUEST"
                    ? "🚨 Phát Tin SOS Lên Chợ Kèo"
                    : "Đăng Kèo Lên Sàn"}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* TAB SWITCHER & FILTERS */}
        <div className="pt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("open");
                setPostTypeFilter("ALL");
              }}
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                activeTab === "open" && postTypeFilter === "ALL"
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Tất Cả ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("open");
                setPostTypeFilter("MATCH");
              }}
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                activeTab === "open" && postTypeFilter === "MATCH"
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              ⚽ Kèo Giao Hữu ({posts.filter((p) => p.postType !== "SOS_GUEST").length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("open");
                setPostTypeFilter("SOS_GUEST");
              }}
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                activeTab === "open" && postTypeFilter === "SOS_GUEST"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
              }`}
            >
              🚨 SOS Mượn Chân ({posts.filter((p) => p.postType === "SOS_GUEST").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("matched")}
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer ${
                activeTab === "matched"
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Kèo Đã Chốt ({matchedPosts.length})
            </button>
          </div>

          {activeTab === "open" && (
            <div className="flex flex-wrap items-center gap-2 text-[14px]">
              {postTypeFilter === "SOS_GUEST" && (
                <select
                  aria-label="Lọc theo vị trí viện binh"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="px-3 py-1.5 rounded-md border border-rose-300 bg-white font-semibold text-rose-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">Mọi vị trí cần</option>
                  <option value="THU_MON">🧤 Thủ Môn</option>
                  <option value="HAU_VE">🛡️ Hậu Vệ</option>
                  <option value="TIEN_VE">⚡ Tiền Vệ</option>
                  <option value="TIEN_DAO">🎯 Tiền Đạo</option>
                </select>
              )}

              <select
                aria-label="Lọc theo loại sân"
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#0369a1]"
              >
                <option value="ALL">Mọi loại sân</option>
                <option value="SAN_7">Sân 7 người</option>
                <option value="SAN_5">Sân 5 người</option>
                <option value="SAN_11">Sân 11 người</option>
                <option value="FUTSAL">Futsal</option>
              </select>

              <select
                aria-label="Lọc theo khung giờ"
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#0369a1]"
              >
                <option value="ALL">Mọi khung giờ</option>
                <option value="TONIGHT">Tối nay (từ 17h)</option>
                <option value="TOMORROW">Ngày mai</option>
              </select>

              <select
                aria-label="Lọc theo tiền sân"
                value={paymentModel}
                onChange={(e) => setPaymentModel(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:border-[#0369a1]"
              >
                <option value="ALL">Mọi hình thức chia tiền</option>
                <option value="HOST_COVER">Chủ kèo bao sân (0đ)</option>
                <option value="SPLIT_EQUAL">Chia đôi 50/50</option>
                <option value="LOSER_PAYS">Đội thua trả 100%</option>
              </select>

              <button
                type="button"
                onClick={sortBySkill}
                disabled={aiSorting || posts.length === 0}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#0369a1]" />
                <span>{aiSorting ? "Đang xếp..." : aiOrder ? "Đã xếp theo trình độ" : "Xếp theo trình độ"}</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. OPEN MATCHES GRID (2 COLUMNS) */}
      {activeTab === "open" && (
        <section>
          {loadingPosts ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-300">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0369a1] mx-auto mb-2" />
              <p className="text-[14px] text-slate-600 font-semibold">Đang tải danh sách kèo giao hữu...</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-300 space-y-3">
              <p className="text-[15px] text-slate-600 font-semibold">
                Không có kèo nào khớp bộ lọc hiện tại.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 rounded-md bg-[#0369a1] text-white text-[14px] font-bold"
              >
                + Đăng Kèo Giao Lưu Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {visiblePosts.map((post) => {
                const isAcceptingThis = acceptingPost?.id === post.id;
                const isSos = post.postType === "SOS_GUEST";
                const neededSlots = Math.max(1, (post.neededCount || 1) - (post.joinedCount || 0));

                return (
                  <article
                    key={post.id}
                    className={`rounded-lg p-4 sm:p-5 border flex flex-col justify-between gap-3.5 transition-all ${
                      isSos
                        ? "bg-rose-50/20 border-rose-300 hover:border-rose-400"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top row: badges & form */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSos ? (
                            <>
                              <span className="px-2.5 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-300 font-bold text-[13px] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>🚨 SOS Mượn Chân Giờ Chót</span>
                              </span>
                              <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[13px]">
                                Cần: {positionLabel(post.neededPosition)} ({neededSlots} người)
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[13px]">
                                Đang tìm đối
                              </span>
                              <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[13px]">
                                {pitchLabel(post.pitchType)}
                              </span>
                            </>
                          )}
                        </div>
                        {!isSos && (
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                            <FormDots form={post.form} size="sm" />
                            <span>
                              {post.record && post.record !== "0-0-0" ? `${post.record} • ` : ""}
                              Thắng {post.winRate ?? 50}%
                            </span>
                          </div>
                        )}
                        {isSos && (
                          <span className="text-[13px] font-bold text-rose-700">
                            Cần gấp hôm nay
                          </span>
                        )}
                      </div>

                      {/* Team Name & Fee */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 truncate">
                            {post.teamName} {isSos ? "(Báo Thiếu Người)" : ""}
                          </h3>
                          <p className="text-[13px] text-slate-600 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-[#0369a1]" />
                              Đội trưởng: {post.captainName}
                            </span>
                            {post.captainPhone && (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-mono">
                                <Phone className="w-3 h-3" />
                                {post.captainPhone}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-base font-bold text-slate-900 font-mono">
                            {post.paymentModel === "HOST_COVER" ? (
                              <span className="text-emerald-700">Miễn phí 0đ</span>
                            ) : (
                              <>
                                {(post.estimatedFee || 50000).toLocaleString("vi-VN")}đ
                                <span className="text-[13px] font-normal text-slate-500">/người</span>
                              </>
                            )}
                          </div>
                          <span className="text-[13px] font-bold text-[#0369a1]">
                            {isSos && post.paymentModel === "HOST_COVER"
                              ? "Đội bao trọn tiền sân"
                              : paymentLabel(post.paymentModel)}
                          </span>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[13px]">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                          <MapPin className="w-4 h-4 text-[#0369a1] shrink-0" />
                          <span className="truncate">
                            {post.pitchName}
                            {post.address ? ` (${post.address})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-800 font-mono font-bold">
                          <Clock className="w-4 h-4 text-[#0369a1] shrink-0" />
                          <span>{post.matchTime}</span>
                        </div>
                      </div>

                      {post.note && (
                        <p className="text-[13px] text-slate-600 line-clamp-2">
                          <strong className="text-slate-700">Lời nhắn:</strong> {post.note}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action or Inline Accept Form */}
                    {isAcceptingThis ? (
                      <form
                        onSubmit={handleAcceptPost}
                        className="p-3 rounded-md bg-sky-50 border border-sky-200 space-y-2.5 text-[13px]"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>
                            {isSos
                              ? `Xác nhận nhận chân viện binh cho ${post.teamName}`
                              : `Xác nhận bắt kèo với ${post.teamName}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => setAcceptingPost(null)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            value={acceptOpponentTeam}
                            onChange={(e) => setAcceptOpponentTeam(e.target.value)}
                            placeholder={isSos ? "Tên của bạn / Biệt danh *" : "Tên FC của bạn *"}
                            className="bg-white px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                          />
                          <input
                            type="tel"
                            required
                            value={acceptOpponentPhone}
                            onChange={(e) => setAcceptOpponentPhone(e.target.value)}
                            placeholder="Số điện thoại Zalo liên hệ *"
                            className="bg-white px-2.5 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-[#0369a1]"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setAcceptingPost(null)}
                            className="px-3 py-1.5 rounded bg-white border border-slate-300 font-bold text-slate-700 cursor-pointer"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={accepting}
                            className={`px-4 py-1.5 rounded text-white font-bold flex items-center gap-1 cursor-pointer ${
                              isSos ? "bg-rose-600 hover:bg-rose-700" : "bg-[#0369a1] hover:bg-[#075985]"
                            }`}
                          >
                            {accepting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>
                              {accepting
                                ? "Đang xác nhận..."
                                : isSos
                                ? "Xác Nhận Tham Gia Ca Đá"
                                : "Chốt Kèo Ngay"}
                            </span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[13px] text-slate-500">
                          {isSos ? `Đang thiếu ${neededSlots} người` : "Sẵn sàng ghép đội ngay"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAcceptingPost(post);
                            setAcceptOpponentTeam(isSos ? userName : `FC ${userName}`);
                          }}
                          className={`px-4 py-2 rounded-md text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isSos ? "bg-rose-600 hover:bg-rose-700" : "bg-[#0369a1] hover:bg-[#075985]"
                          }`}
                        >
                          {isSos ? <UserCheck className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          <span>{isSos ? "Nhận Chân Ngay" : "Nhận Kèo"}</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. MATCHED POSTS GRID (2 COLUMNS) */}
      {activeTab === "matched" && (
        <section>
          {matchedPosts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-300">
              <p className="text-[15px] text-slate-600 font-semibold">
                Chưa có kèo nào đã chốt trên hệ thống.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {matchedPosts.map((post: any) => {
                const isReviewingThis = reviewPost?.id === post.id;
                return (
                  <div
                    key={post.id}
                    className="p-4 sm:p-5 rounded-lg border border-slate-300 bg-white space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                      <div className="min-w-0">
                        <p className="font-bold text-base text-slate-900 truncate">
                          {post.teamName}
                          <span className="font-normal text-slate-500 text-[14px] mx-1.5">đối đầu</span>
                          <span className="text-[#0369a1]">{post.opponentTeamName || "Đã ghép"}</span>
                        </p>
                        <p className="text-[13px] text-slate-600 truncate mt-0.5">
                          {post.pitchName} • {post.matchTime}
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[13px] shrink-0">
                        Đã chốt kèo
                      </span>
                    </div>

                    <KeoPaymentInfo post={post} pitch={findPitchByName(post.pitchName)} />

                    {isReviewingThis ? (
                      <div className="p-3 rounded-md bg-slate-50 border border-slate-300 space-y-2.5 text-[13px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Đánh giá Fair-play: {post.opponentTeamName || post.teamName}
                          </span>
                          <button
                            type="button"
                            onClick={() => setReviewPost(null)}
                            className="text-slate-500 hover:text-slate-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewStars(s)}
                              className="p-0.5"
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  s <= reviewStars ? "text-amber-500 fill-amber-500" : "text-slate-300"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-1.5 font-bold text-slate-800">{reviewStars}/5 sao</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={reviewOnTime}
                              onChange={(e) => setReviewOnTime(e.target.checked)}
                              className="w-4 h-4 accent-[#0369a1]"
                            />
                            Đúng giờ
                          </label>
                          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={reviewFairPlay}
                              onChange={(e) => setReviewFairPlay(e.target.checked)}
                              className="w-4 h-4 accent-[#0369a1]"
                            />
                            Sòng phẳng tiền sân
                          </label>
                          <label className="flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={reviewSportsmanship}
                              onChange={(e) => setReviewSportsmanship(e.target.checked)}
                              className="w-4 h-4 accent-[#0369a1]"
                            />
                            Chơi đẹp
                          </label>
                        </div>
                        <input
                          type="text"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Nhận xét thêm (tuỳ chọn)..."
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white focus:outline-none focus:border-[#0369a1]"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReviewPost(null)}
                            className="px-3 py-1.5 rounded bg-white border border-slate-300 font-bold text-slate-700"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={reviewSubmitting}
                            onClick={async () => {
                              try {
                                setReviewSubmitting(true);
                                const reviewed = post.opponentTeamName || post.teamName;
                                const reviewer =
                                  post.teamName === reviewed ? post.opponentTeamName : post.teamName;
                                await submitTeamReview({
                                  reviewedTeamName: reviewed,
                                  reviewerTeamName: reviewer,
                                  matchmakingPostId: post.id,
                                  stars: reviewStars,
                                  onTime: reviewOnTime,
                                  fairPlay: reviewFairPlay,
                                  sportsmanship: reviewSportsmanship,
                                  comment: reviewComment.trim() || undefined,
                                });
                                toastOk("Đã gửi đánh giá Fair-play!");
                                setReviewPost(null);
                              } catch (err: any) {
                                toastErr(err?.message || "Không gửi được đánh giá.");
                              } finally {
                                setReviewSubmitting(false);
                              }
                            }}
                            className="px-4 py-1.5 rounded bg-[#0369a1] hover:bg-[#075985] text-white font-bold"
                          >
                            {reviewSubmitting ? "Đang gửi..." : "Gửi Đánh Giá"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[13px] text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Cặp đấu đã xác nhận
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewPost(post);
                            setReviewStars(5);
                            setReviewOnTime(true);
                            setReviewFairPlay(true);
                            setReviewSportsmanship(true);
                            setReviewComment("");
                          }}
                          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[13px] font-bold flex items-center gap-1.5 border border-slate-300 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span>Đánh giá Fair-play</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
