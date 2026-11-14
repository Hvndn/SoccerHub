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
  Lock,
  SlidersHorizontal,
  ChevronDown,
  Heart,
  Share2,
  Copy,
  Flame,
} from "lucide-react";
import { API_BASE_URL, apiRequest, ensureLoggedIn, fetchWithTimeout } from "@/lib/api";
import { toastOk, toastErr } from "@/lib/toast";
import { submitTeamReview } from "@/lib/adminService";
import { getFavoritePitchIds, subscribeFavorites } from "@/lib/favoritePitchService";
import FormDots from "./FormDots";

interface MatchmakingMarketplaceProps {
  user?: any;
  onSelectMatch?: (match: any) => void;
  onCreateMatch?: () => void;
  onOpenAuth?: (mode: "login" | "register", role?: "PLAYER" | "OWNER" | "ORGANIZER") => void;
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

export default function MatchmakingMarketplace({
  user,
  onSelectMatch,
  onCreateMatch,
  onOpenAuth,
}: MatchmakingMarketplaceProps) {
  const [activeTab, setActiveTab] = useState<"open" | "matched" | "my_posts">("open");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [onlyFavoritePitches, setOnlyFavoritePitches] = useState(false);

  useEffect(() => {
    setFavoriteIds(getFavoritePitchIds(user?.id));
    const unsub = subscribeFavorites((ids) => {
      setFavoriteIds(ids);
    }, user?.id);
    return unsub;
  }, [user?.id]);
  const [postTypeFilter, setPostTypeFilter] = useState<"ALL" | "MATCH" | "SOS_GUEST">("ALL");
  const [selectedSport, setSelectedSport] = useState("ALL");
  const [selectedPosition, setSelectedPosition] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("ALL");
  const [paymentModel, setPaymentModel] = useState("ALL");
  const [pitches, setPitches] = useState<any[]>([]);
  const [showDetailedFilters, setShowDetailedFilters] = useState(false);
  const [showAgreementDetails, setShowAgreementDetails] = useState(false);

  const hasDetailedFiltersActive =
    selectedSport !== "ALL" ||
    selectedTimeSlot !== "ALL" ||
    paymentModel !== "ALL" ||
    (postTypeFilter === "SOS_GUEST" && selectedPosition !== "ALL");

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
  const [createCaptainPhone, setCreateCaptainPhone] = useState(user?.phone || "");
  const [creating, setCreating] = useState(false);

  const PHONE_REGEX = /^0[1-9][0-9]{8}$/;

  useEffect(() => {
    if (user?.phone) {
      setCreateCaptainPhone((prev) => prev || user.phone || "");
      setAcceptOpponentPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  // Real-time validation cho Form Đăng Kèo
  const createErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (showCreateForm) {
      if (createTeamName.trim().length > 0 && createTeamName.trim().length < 3) {
        errs.teamName = "Tên đội bóng phải có ít nhất 3 ký tự.";
      }
      if (createCaptainPhone.trim().length > 0 && !PHONE_REGEX.test(createCaptainPhone.trim())) {
        errs.captainPhone = "Số điện thoại phải gồm 10 số, bắt đầu bằng 0 (VD: 0905...).";
      }
      if (createFee < 0) {
        errs.fee = "Mức phí dự kiến không được âm.";
      }
    }
    return errs;
  }, [showCreateForm, createTeamName, createCaptainPhone, createFee]);

  const isCreateValid =
    createTeamName.trim().length >= 3 &&
    PHONE_REGEX.test(createCaptainPhone.trim()) &&
    createMatchTime.trim().length > 0 &&
    createPitchName.trim().length > 0 &&
    createFee >= 0;

  // Thỏa thuận kèo giao hữu state
  const [createMatchStyle, setCreateMatchStyle] = useState<"DUONG_SINH" | "NHIET_HUYET">("DUONG_SINH");
  const [createAgeGroup, setCreateAgeGroup] = useState<"U20_U25" | "U25_U35" | "U35_PLUS">("U25_U35");
  const [createHomeKitColor, setCreateHomeKitColor] = useState<string>("Đỏ");
  const [createRefereeOption, setCreateRefereeOption] = useState<"TU_BAT" | "THUE_TRONG_TAI">("TU_BAT");
  const [createWaterOption, setCreateWaterOption] = useState<"CAM_THUNG" | "TU_MANG">("CAM_THUNG");
  const [acceptAwayKitColor, setAcceptAwayKitColor] = useState<string>("Xanh dương");

  const KIT_COLORS = ["Đỏ", "Xanh dương", "Trắng", "Đen", "Vàng", "Xanh lá", "Cam", "Tím"];

  const isKitClashing = (c1?: string, c2?: string) => {
    if (!c1 || !c2) return false;
    const n1 = c1.trim().toLowerCase();
    const n2 = c2.trim().toLowerCase();
    if (n1 === n2) return true;
    const darks = ["đen", "xanh đen", "xanh navy", "tím than", "xanh đậm"];
    if (darks.includes(n1) && darks.includes(n2)) return true;
    const lights = ["trắng", "vàng nhạt", "xám sáng", "kem"];
    if (lights.includes(n1) && lights.includes(n2)) return true;
    return false;
  };

  // Inline accept form
  const [acceptingPost, setAcceptingPost] = useState<any | null>(null);
  const [acceptOpponentTeam, setAcceptOpponentTeam] = useState("");
  const [acceptOpponentPhone, setAcceptOpponentPhone] = useState(user?.phone || "");
  const [accepting, setAccepting] = useState(false);
  const [lastAcceptedPost, setLastAcceptedPost] = useState<any | null>(null);

  // Real-time validation cho Form Bắt Kèo
  const acceptErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (acceptingPost) {
      if (acceptOpponentTeam.trim().length > 0 && acceptOpponentTeam.trim().length < 3) {
        errs.opponentTeam = "Tên đội nhận kèo phải có ít nhất 3 ký tự.";
      }
      if (acceptOpponentPhone.trim().length > 0 && !PHONE_REGEX.test(acceptOpponentPhone.trim())) {
        errs.opponentPhone = "Số điện thoại phải gồm 10 số (VD: 0905...).";
      }
      if (acceptingPost.postType !== "SOS_GUEST" && isKitClashing(acceptingPost.homeKitColor, acceptAwayKitColor)) {
        errs.kitColor = "Trùng tông màu áo với đội nhà. Vui lòng chọn màu áo khác để phân biệt.";
      }
    }
    return errs;
  }, [acceptingPost, acceptOpponentTeam, acceptOpponentPhone, acceptAwayKitColor]);

  const isAcceptValid =
    acceptOpponentTeam.trim().length >= 3 &&
    PHONE_REGEX.test(acceptOpponentPhone.trim()) &&
    (acceptingPost?.postType === "SOS_GUEST" || !isKitClashing(acceptingPost?.homeKitColor, acceptAwayKitColor));

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

    if (onlyFavoritePitches) {
      const matchFav = favoriteIds.some((fId) => {
        if (p.pitchId && Number(p.pitchId) === fId) return true;
        const favPitch = pitches.find((pitch) => Number(pitch.id) === fId);
        if (
          favPitch?.name &&
          p.pitchName &&
          (p.pitchName.toLowerCase().includes(favPitch.name.toLowerCase()) ||
            favPitch.name.toLowerCase().includes(p.pitchName.toLowerCase()))
        ) {
          return true;
        }
        return false;
      });
      if (!matchFav) return false;
    }

    return true;
  };

  const isUrgent = (post: any) => {
    const t = `${post.matchTime || ""} ${post.note || ""}`.toLowerCase();
    return (
      post.postType === "SOS_GUEST" ||
      t.includes("tối nay") ||
      t.includes("gấp") ||
      t.includes("ngay") ||
      t.includes("chiều nay")
    );
  };

  const handleShareZalo = (post: any) => {
    const isSos = post.postType === "SOS_GUEST";
    const typeText = isSos ? "🚨 TÌM CẦU THỦ ĐÁ KÉ / SOS VIỆN BINH" : "⚽ KÈO BÓNG ĐÁ PHONG TRÀO";
    const ruleText =
      post.paymentModel === "SPLIT_EQUAL"
        ? "Chia đôi tiền sân 50/50"
        : post.paymentModel === "LOSER_PAYS"
        ? "Đội thua chịu 100% tiền sân"
        : "Chủ kèo bao trọn tiền sân";
    const text = `${typeText}\n- Đội: ${post.teamName}\n- Sân: ${post.pitchName}${post.address ? ` (${post.address})` : ""}\n- Giờ: ${post.matchTime}\n- Tiền sân: ${ruleText}\n- Liên hệ: ${post.captainName} (${post.captainPhone})\n👉 Vào TurfZone để chốt kèo: ${typeof window !== "undefined" ? window.location.origin : ""}/?tab=matchmaking`;
    navigator.clipboard?.writeText(text);
    toastOk("Đã sao chép nội dung rủ kèo để dán vào Zalo / Facebook!");
  };

  const myPhoneClean = (user?.phone || "").toString().replace(/\D/g, "");
  const myPosts = useMemo(() => {
    if (!user) return [];
    const allList = [...posts, ...matchedPosts];
    return allList.filter((p: any) => {
      const creatorMatch =
        (p.creatorId && user.id && String(p.creatorId) === String(user.id)) ||
        (myPhoneClean && String(p.captainPhone || "").replace(/\D/g, "") === myPhoneClean);
      const acceptedMatch =
        (p.acceptedBy && user.id && String(p.acceptedBy) === String(user.id)) ||
        (myPhoneClean && String(p.opponentPhone || "").replace(/\D/g, "") === myPhoneClean);
      return creatorMatch || acceptedMatch;
    });
  }, [posts, matchedPosts, user, myPhoneClean]);

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter(postPassesFilter);
    if (!aiOrder) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const ra = aiOrder.indexOf(String(a.id));
      const rb = aiOrder.indexOf(String(b.id));
      return (ra === -1 ? Number.MAX_SAFE_INTEGER : ra) - (rb === -1 ? Number.MAX_SAFE_INTEGER : rb);
    });
  }, [posts, postTypeFilter, selectedPosition, selectedSport, paymentModel, selectedTimeSlot, selectedLevel, onlyFavoritePitches, favoriteIds, pitches, aiOrder]);

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
      if (!ensureLoggedIn("đăng kèo giao lưu hoặc báo SOS")) return;
      if (!isCreateValid) {
        toastErr("Vui lòng kiểm tra lại: Tên đội ≥ 3 ký tự, SĐT gồm 10 số và đầy đủ thông tin bắt buộc.");
        return;
      }
      setCreating(true);
      await apiRequest<any>("/api/v1/community/matchmaking-posts", {
        method: "POST",
        body: JSON.stringify({
          teamName: createTeamName.trim(),
          captainName: userName,
          captainPhone: createCaptainPhone.trim(),
          pitchName: createPitchName.trim(),
          address: createAddress.trim(),
          matchTime: createMatchTime.trim(),
          pitchType: createPitchType,
          paymentModel: createPaymentModel,
          estimatedFee: Math.max(0, createFee),
          note: createNote.trim() || (createPostType === "SOS_GUEST" ? "Cần người đá ké vui vẻ, văn minh." : "Tìm đối giao lưu vui vẻ, đúng giờ."),
          postType: createPostType,
          neededPosition: createNeededPosition,
          neededCount: createNeededCount,
          matchStyle: createMatchStyle,
          ageGroup: createAgeGroup,
          homeKitColor: createHomeKitColor,
          refereeOption: createRefereeOption,
          waterOption: createWaterOption,
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
    if (!isAcceptValid) {
      toastErr("Vui lòng kiểm tra lại: Tên đội ≥ 3 ký tự, SĐT 10 số và màu áo không trùng lặp.");
      return;
    }
    try {
      setAccepting(true);
      const data = await apiRequest<any>(
        `/api/v1/community/matchmaking-posts/${acceptingPost.id}/accept`,
        {
          method: "POST",
          body: JSON.stringify({
            opponentTeamName: acceptOpponentTeam.trim(),
            opponentCaptainName: userName,
            opponentCaptainPhone: acceptOpponentPhone.trim(),
            awayKitColor: acceptAwayKitColor,
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
                if (!user) {
                  toastErr("Vui lòng đăng nhập để phát tin SOS mượn chân.");
                  onOpenAuth?.("login", "PLAYER");
                  return;
                }
                setCreatePostType("SOS_GUEST");
                setShowCreateForm(true);
              }}
              className="px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              {user ? <AlertTriangle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>🚨 Báo SOS Thiếu Chân</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  toastErr("Vui lòng đăng nhập để đăng kèo giao lưu trên sàn.");
                  onOpenAuth?.("login", "PLAYER");
                  return;
                }
                setCreatePostType("MATCH");
                setShowCreateForm((v) => !v);
              }}
              className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {user ? <PlusCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
                  className={`w-full bg-white px-3 py-2 rounded-md border text-[13px] focus:outline-none ${
                    createErrors.teamName ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-[#0369a1]"
                  }`}
                />
                {createErrors.teamName && (
                  <p className="text-[13px] text-rose-600 font-medium mt-1">{createErrors.teamName}</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={createCaptainPhone}
                  onChange={(e) => setCreateCaptainPhone(e.target.value)}
                  placeholder="Ví dụ: 0905123456"
                  className={`w-full bg-white px-3 py-2 rounded-md border text-[13px] font-mono focus:outline-none ${
                    createErrors.captainPhone ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-[#0369a1]"
                  }`}
                />
                {createErrors.captainPhone && (
                  <p className="text-[13px] text-rose-600 font-medium mt-1">{createErrors.captainPhone}</p>
                )}
              </div>

              {createPostType === "SOS_GUEST" ? (
                <>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">Vị trí cần tìm *</label>
                    <select
                      value={createNeededPosition}
                      onChange={(e) => setCreateNeededPosition(e.target.value)}
                      className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold text-[13px] focus:outline-none focus:border-[#0369a1]"
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
                      className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold text-[13px] focus:outline-none focus:border-[#0369a1]"
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
                    className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 font-semibold text-[13px] focus:outline-none focus:border-[#0369a1]"
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
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 text-[13px] focus:outline-none focus:border-[#0369a1]"
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
                  className="w-full bg-white px-3 py-2 rounded-md border border-slate-300 text-[13px] focus:outline-none focus:border-[#0369a1]"
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

              {createPostType === "MATCH" && (
                <div className="sm:col-span-2 lg:col-span-4 border border-slate-200 rounded-md bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAgreementDetails((v) => !v)}
                    className="w-full px-3 py-2 text-left text-[13px] font-bold text-slate-700 hover:text-[#0369a1] bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>📑 Thỏa thuận giao hữu chi tiết (Màu áo, Trọng tài, Độ tuổi)</span>
                      <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showAgreementDetails ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showAgreementDetails && (
                    <div className="p-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px] animate-fade-in">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Tính chất thi đấu</label>
                        <select
                          value={createMatchStyle}
                          onChange={(e) => setCreateMatchStyle(e.target.value as any)}
                          className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                        >
                          <option value="DUONG_SINH">🧘 Văn phòng dưỡng sinh</option>
                          <option value="NHIET_HUYET">🔥 Cọ xát nhiệt huyết</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Độ tuổi đội hình</label>
                        <select
                          value={createAgeGroup}
                          onChange={(e) => setCreateAgeGroup(e.target.value as any)}
                          className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                        >
                          <option value="U25_U35">U25 - U35 (Đi làm/Công sở)</option>
                          <option value="U20_U25">U20 - U25 (Sinh viên/Trẻ)</option>
                          <option value="U35_PLUS">U35+ (Lão tướng U35+)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Màu áo đội nhà</label>
                        <select
                          value={createHomeKitColor}
                          onChange={(e) => setCreateHomeKitColor(e.target.value)}
                          className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-bold focus:outline-none focus:border-[#0369a1]"
                        >
                          {KIT_COLORS.map((c) => (
                            <option key={c} value={c}>Áo màu {c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Trọng tài điều khiển</label>
                        <select
                          value={createRefereeOption}
                          onChange={(e) => setCreateRefereeOption(e.target.value as any)}
                          className="w-full bg-white px-2.5 py-1.5 rounded border border-slate-300 font-semibold focus:outline-none focus:border-[#0369a1]"
                        >
                          <option value="TU_BAT">🤝 Hai bên tự bắt Fairplay</option>
                          <option value="THUE_TRONG_TAI">⚖️ Thuê trọng tài (Cưa đôi)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                disabled={creating || !isCreateValid}
                className={`px-5 py-2 rounded-md text-white font-bold text-[14px] flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => {
                setActiveTab("open");
                setPostTypeFilter("ALL");
              }}
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
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
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
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
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
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
              className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "matched"
                  ? "bg-[#0369a1] text-white border-[#0369a1]"
                  : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              Kèo Đã Chốt ({matchedPosts.length})
            </button>
            {user && (
              <button
                type="button"
                onClick={() => setActiveTab("my_posts")}
                className={`px-3.5 py-1.5 rounded-md text-[14px] font-bold border transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeTab === "my_posts"
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                Kèo Của Tôi ({myPosts.length})
              </button>
            )}
          </div>

          {activeTab === "open" && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setOnlyFavoritePitches((prev) => !prev)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  onlyFavoritePitches
                    ? "bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
                title="Lọc chỉ các kèo tại cụm sân ruột của bạn"
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavoritePitches ? "fill-rose-500 text-rose-500" : "text-rose-400"}`} />
                <span>Sân yêu thích {favoriteIds.length > 0 ? `(${favoriteIds.length})` : ""}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDetailedFilters((v) => !v)}
                className={`px-3 py-1.5 rounded-md text-[13px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  hasDetailedFiltersActive
                    ? "bg-sky-50 text-[#0369a1] border-sky-300"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Bộ lọc</span>
                {hasDetailedFiltersActive && (
                  <span className="w-2 h-2 rounded-full bg-[#0369a1]" />
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showDetailedFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* BỘ LỌC CHI TIẾT (PROGRESSIVE DISCLOSURE: BẤM MỞ KHI CẦN) */}
        {activeTab === "open" && showDetailedFilters && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2 text-[13px] animate-fade-in">
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
                onClick={() => {
                  if (!user) {
                    toastErr("Vui lòng đăng nhập để đăng kèo giao lưu trên sàn.");
                    onOpenAuth?.("login", "PLAYER");
                    return;
                  }
                  setShowCreateForm(true);
                }}
                className="px-4 py-2 rounded-md bg-[#0369a1] text-white text-[14px] font-bold flex items-center gap-1.5 mx-auto"
              >
                {!user && <Lock className="w-4 h-4" />}
                <span>+ Đăng Kèo Giao Lưu Đầu Tiên</span>
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
                          {isUrgent(post) && (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[13px] flex items-center gap-1 shadow-2xs">
                              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500 animate-pulse" />
                              <span>Kèo gấp</span>
                            </span>
                          )}
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

                      {!isSos && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[13px]">
                          <span
                            className={`px-2 py-0.5 rounded font-bold border ${
                              post.matchStyle === "NHIET_HUYET"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {post.matchStyle === "NHIET_HUYET" ? "🔥 Cọ xát nhiệt huyết" : "🧘 Dưỡng sinh văn phòng"}
                          </span>

                          <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {post.ageGroup === "U20_U25"
                              ? "U20 - U25"
                              : post.ageGroup === "U35_PLUS"
                              ? "U35+ Lão tướng"
                              : "U25 - U35"}
                          </span>

                          <span className="px-2 py-0.5 rounded font-bold bg-white text-slate-800 border border-slate-300 flex items-center gap-1">
                            <span>Áo chủ nhà:</span>
                            <strong className="text-[#0369a1]">{post.homeKitColor || "Đỏ"}</strong>
                          </span>

                          <span className="px-2 py-0.5 rounded font-bold bg-amber-50 text-amber-900 border border-amber-200">
                            {post.refereeOption === "THUE_TRONG_TAI" ? "⚖️ Thuê trọng tài" : "🤝 Tự bắt Fairplay"}
                          </span>
                        </div>
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
                          <div>
                            <input
                              type="text"
                              required
                              value={acceptOpponentTeam}
                              onChange={(e) => setAcceptOpponentTeam(e.target.value)}
                              placeholder={isSos ? "Tên của bạn / Biệt danh *" : "Tên FC của bạn *"}
                              className={`w-full bg-white px-2.5 py-1.5 rounded border text-[13px] focus:outline-none ${
                                acceptErrors.opponentTeam ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-[#0369a1]"
                              }`}
                            />
                            {acceptErrors.opponentTeam && (
                              <p className="text-[13px] text-rose-600 font-medium mt-1">{acceptErrors.opponentTeam}</p>
                            )}
                          </div>
                          <div>
                            <input
                              type="tel"
                              required
                              value={acceptOpponentPhone}
                              onChange={(e) => setAcceptOpponentPhone(e.target.value)}
                              placeholder="Số điện thoại Zalo liên hệ *"
                              className={`w-full bg-white px-2.5 py-1.5 rounded border text-[13px] font-mono focus:outline-none ${
                                acceptErrors.opponentPhone ? "border-rose-400 focus:border-rose-500" : "border-slate-300 focus:border-[#0369a1]"
                              }`}
                            />
                            {acceptErrors.opponentPhone && (
                              <p className="text-[13px] text-rose-600 font-medium mt-1">{acceptErrors.opponentPhone}</p>
                            )}
                          </div>
                        </div>

                        {!isSos && (
                          <div className="space-y-2 p-2.5 rounded bg-white border border-sky-100">
                            <div>
                              <label className="block font-bold text-slate-700 text-[13px] mb-1">
                                Màu áo thi đấu đội bạn (Bắt buộc khác màu đội nhà):
                              </label>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {KIT_COLORS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setAcceptAwayKitColor(c)}
                                    className={`px-2.5 py-1 rounded text-[13px] font-bold border transition-colors cursor-pointer ${
                                      acceptAwayKitColor === c
                                        ? "bg-[#0369a1] text-white border-[#0369a1]"
                                        : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                                    }`}
                                  >
                                    Áo {c}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {isKitClashing(post.homeKitColor, acceptAwayKitColor) && (
                              <div className="p-2.5 rounded bg-rose-50 border border-rose-300 text-rose-900 text-[13px] font-bold flex items-center gap-1.5 animate-fade-in">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>
                                  ⚠️ Trùng tông màu áo với chủ nhà ({post.homeKitColor || "Đỏ"})! Vui lòng chọn màu áo khác để phân biệt khi ra sân.
                                </span>
                              </div>
                            )}

                            <div className="text-[13px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                              <div>• Tính chất: <strong>{post.matchStyle === "NHIET_HUYET" ? "Cọ xát nhiệt huyết" : "Dưỡng sinh văn phòng"}</strong></div>
                              <div>• Độ tuổi: <strong>{post.ageGroup === "U20_U25" ? "U20 - U25" : post.ageGroup === "U35_PLUS" ? "U35+ Lão tướng" : "U25 - U35"}</strong></div>
                              <div>• Trọng tài: <strong>{post.refereeOption === "THUE_TRONG_TAI" ? "Thuê trọng tài sân (Cưa đôi phí)" : "Hai bên tự bắt Fairplay"}</strong></div>
                            </div>
                          </div>
                        )}
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
                            disabled={accepting || !isAcceptValid}
                            className={`px-4 py-1.5 rounded text-white font-bold flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-slate-500">
                            {isSos ? `Đang thiếu ${neededSlots} người` : "Sẵn sàng ghép đội ngay"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleShareZalo(post)}
                            className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[13px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Sao chép tin rủ kèo để gửi vào nhóm Zalo / Facebook"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#0369a1]" />
                            <span>Rủ Zalo</span>
                          </button>
                        </div>
                        {Boolean(user?.phone && post.captainPhone && user.phone.trim() === post.captainPhone.trim()) ? (
                          <span className="px-3.5 py-1.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[13px] border border-slate-200">
                            Kèo do bạn tạo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                toastErr("Vui lòng đăng nhập để nhận kèo giao lưu hoặc báo đi viện binh.");
                                onOpenAuth?.("login", "PLAYER");
                                return;
                              }
                              setAcceptingPost(post);
                              setAcceptOpponentTeam(isSos ? userName : `FC ${userName}`);
                            }}
                            className={`px-4 py-2 rounded-md text-white font-bold text-[14px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isSos ? "bg-rose-600 hover:bg-rose-700" : "bg-[#0369a1] hover:bg-[#075985]"
                            }`}
                          >
                            {!user ? <Lock className="w-4 h-4" /> : isSos ? <UserCheck className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                            <span>{isSos ? "Nhận Chân Ngay" : "Nhận Kèo"}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 4. MY POSTS TAB (KÈO CỦA TÔI) */}
      {activeTab === "my_posts" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#0369a1]" />
              <span>Kèo Do Bạn Đăng &amp; Kèo Đã Nhận Bắt ({myPosts.length})</span>
            </h2>
            <span className="text-[13px] text-slate-500">Quản lý các trận giao lưu của bạn</span>
          </div>

          {myPosts.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-300 space-y-3">
              <p className="text-[15px] text-slate-700 font-semibold">
                Bạn chưa đăng hoặc nhận bắt kèo nào trên hệ thống.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreatePostType("MATCH");
                  setShowCreateForm(true);
                }}
                className="px-4 py-2 rounded-md bg-[#0369a1] text-white text-[14px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Đăng Kèo Giao Lưu Ngay</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myPosts.map((post: any) => {
                const isCreator =
                  (post.creatorId && user?.id && String(post.creatorId) === String(user.id)) ||
                  (myPhoneClean && String(post.captainPhone || "").replace(/\D/g, "") === myPhoneClean);
                const isMatched = post.status === "MATCHED";

                return (
                  <article
                    key={post.id}
                    className="rounded-lg p-4 sm:p-5 border border-slate-300 bg-white flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[13px] font-bold border ${
                              isCreator
                                ? "bg-sky-50 text-[#0369a1] border-sky-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {isCreator ? "Kèo do bạn đăng" : "Kèo bạn đã nhận bắt"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[13px] font-bold border ${
                              isMatched
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-amber-50 text-amber-900 border-amber-300"
                            }`}
                          >
                            {isMatched ? "Đã chốt kèo" : "Đang chờ đối"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleShareZalo(post)}
                          className="px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-semibold flex items-center gap-1 cursor-pointer"
                          title="Sao chép tin rủ kèo để gửi vào Zalo"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#0369a1]" />
                          <span>Rủ Zalo</span>
                        </button>
                      </div>

                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {post.teamName} {isMatched ? `vs ${post.opponentTeamName || "Đối thủ"}` : ""}
                        </h3>
                        <p className="text-[13px] text-slate-600 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{post.pitchName} {post.address ? `• ${post.address}` : ""}</span>
                        </p>
                        <p className="text-[13px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
                          <span>Thời gian: <strong>{post.matchTime}</strong></span>
                        </p>
                      </div>

                      <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[13px] text-slate-700 space-y-1">
                        <div>
                          Hình thức tiền sân: <strong>{post.paymentModel === "SPLIT_EQUAL" ? "Chia đôi 50/50" : post.paymentModel === "LOSER_PAYS" ? "Đội thua trả 100%" : "Chủ kèo bao sân"}</strong>
                        </div>
                        {post.opponentPhone && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                            <span>SĐT đối thủ: <strong className="font-mono text-slate-900">{post.opponentPhone}</strong></span>
                            <a
                              href={`tel:${post.opponentPhone}`}
                              className="text-[#0369a1] hover:underline font-bold"
                            >
                              Gọi
                            </a>
                            <a
                              href={`https://zalo.me/${String(post.opponentPhone).replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0369a1] hover:underline font-bold"
                            >
                              Zalo
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
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
