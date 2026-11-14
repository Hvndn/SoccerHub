"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Calendar,
  Search,
  Loader2,
  ChevronRight,
  Shield,
  Plus,
  Trash2,
  DollarSign,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Shirt,
  MapPin,
  Phone,
  Swords,
  Copy,
  AlertCircle,
  Info,
  Check,
} from "lucide-react";
import { fetchTournaments, sportLabel } from "@/lib/tournamentService";

interface TeamClubManagementProps {
  user?: any;
  onBackToHome?: () => void;
  onNavigateTab?: (tab: string) => void;
}

// Grassroots club player representation
interface SquadPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  position: "GK" | "DF" | "MF" | "FW";
  role: "Đội Trưởng" | "Đội Phó" | "Thành Viên";
  phone: string;
  rsvpStatus?: "ATTENDING" | "ABSENT" | "LATE";
  paidFee?: boolean;
}

interface ClubExpense {
  id: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category: "Thu Quỹ Tháng" | "Tiền Thuê Sân" | "Tiền Nước Uống" | "Mua Bóng/Áo" | "Khác";
  amount: number;
  note: string;
}

interface ClubScheduleMatch {
  id: string;
  opponent: string;
  date: string;
  timeSlot: string;
  pitchName: string;
  format: "Sân 5" | "Sân 7" | "Sân 11";
  note: string;
  rsvps: Record<string, "ATTENDING" | "ABSENT" | "LATE">;
}

interface GrassrootsClub {
  id: string;
  name: string;
  slug: string;
  slogan: string;
  homePitch: string;
  primaryColor: string;
  secondaryColor: string;
  level: "Văn Phòng Phong Trào" | "Bán Chuyên Chiến" | "Dưỡng Sinh Cuối Tuần";
  fundBalance: number;
  roster: SquadPlayer[];
  expenses: ClubExpense[];
  matches: ClubScheduleMatch[];
}

const DEFAULT_DEMO_CLUB: GrassrootsClub = {
  id: "club-demo-1",
  name: "FC Anh Em Đà Nẵng",
  slug: "fc-anh-em-da-nang",
  slogan: "Đoàn kết - Giao lưu - Thể thao lành mạnh",
  homePitch: "Sân Bóng Chuyên Việt (Đà Nẵng)",
  primaryColor: "#0284c7",
  secondaryColor: "#ffffff",
  level: "Văn Phòng Phong Trào",
  fundBalance: 1850000,
  roster: [
    {
      id: "p1",
      name: "Nguyễn Văn Hùng",
      jerseyNumber: 10,
      position: "MF",
      role: "Đội Trưởng",
      phone: "0905123456",
      rsvpStatus: "ATTENDING",
      paidFee: true,
    },
    {
      id: "p2",
      name: "Trần Minh Quang",
      jerseyNumber: 1,
      position: "GK",
      role: "Đội Phó",
      phone: "0905987654",
      rsvpStatus: "ATTENDING",
      paidFee: true,
    },
    {
      id: "p3",
      name: "Lê Hoàng Long",
      jerseyNumber: 4,
      position: "DF",
      role: "Thành Viên",
      phone: "0914112233",
      rsvpStatus: "ATTENDING",
      paidFee: false,
    },
    {
      id: "p4",
      name: "Phạm Hải Đăng",
      jerseyNumber: 7,
      position: "FW",
      role: "Thành Viên",
      phone: "0935334455",
      rsvpStatus: "ATTENDING",
      paidFee: true,
    },
    {
      id: "p5",
      name: "Võ Thành Đạt",
      jerseyNumber: 8,
      position: "MF",
      role: "Thành Viên",
      phone: "0908778899",
      rsvpStatus: "LATE",
      paidFee: false,
    },
    {
      id: "p6",
      name: "Đặng Quốc Bảo",
      jerseyNumber: 3,
      position: "DF",
      role: "Thành Viên",
      phone: "0977665544",
      rsvpStatus: "ABSENT",
      paidFee: true,
    },
    {
      id: "p7",
      name: "Hoàng Gia Huy",
      jerseyNumber: 9,
      position: "FW",
      role: "Thành Viên",
      phone: "0988223311",
      rsvpStatus: "ATTENDING",
      paidFee: true,
    },
    {
      id: "p8",
      name: "Bùi Tuấn Anh",
      jerseyNumber: 14,
      position: "MF",
      role: "Thành Viên",
      phone: "0934556677",
      rsvpStatus: "ATTENDING",
      paidFee: true,
    },
  ],
  expenses: [
    {
      id: "exp-1",
      date: "12/11/2026",
      type: "EXPENSE",
      category: "Tiền Thuê Sân",
      amount: 450000,
      note: "Sân Chuyên Việt (19:30 - 21:00)",
    },
    {
      id: "exp-2",
      date: "12/11/2026",
      type: "EXPENSE",
      category: "Tiền Nước Uống",
      amount: 120000,
      note: "2 thùng Revive + 1 bình Lavie",
    },
    {
      id: "exp-3",
      date: "01/11/2026",
      type: "INCOME",
      category: "Thu Quỹ Tháng",
      amount: 1600000,
      note: "Thu quỹ định kỳ tháng 11 (8 anh em)",
    },
  ],
  matches: [
    {
      id: "match-1",
      opponent: "FC IT Đà Nẵng",
      date: "Thứ Sáu, 15/11/2026",
      timeSlot: "19:30 - 21:00",
      pitchName: "Sân Bóng Chuyên Việt (Sân 5A)",
      format: "Sân 5",
      note: "Trận giao hữu chia tiền sân 50/50, mặc áo đấu Xanh",
      rsvps: {
        p1: "ATTENDING",
        p2: "ATTENDING",
        p3: "ATTENDING",
        p4: "ATTENDING",
        p5: "LATE",
        p6: "ABSENT",
        p7: "ATTENDING",
        p8: "ATTENDING",
      },
    },
  ],
};

const STORAGE_KEY = "turfzone_player_clubs_v1";

export default function TeamClubManagement({
  user,
  onNavigateTab,
}: TeamClubManagementProps) {
  // Main Sub-tabs: Roster, Treasury, RSVP, Tournament
  const [activeSubTab, setActiveSubTab] = useState<
    "roster" | "treasury" | "rsvp" | "tournament"
  >("roster");

  // Tournament integration states
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Grassroots clubs state
  const [clubs, setClubs] = useState<GrassrootsClub[]>([]);
  const [activeClubId, setActiveClubId] = useState<string>("club-demo-1");

  // Inline forms toggles
  const [showCreateClubForm, setShowCreateClubForm] = useState(false);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [showAddMatchForm, setShowAddMatchForm] = useState(false);
  const [showQrBox, setShowQrBox] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

  // Search filter
  const [searchMember, setSearchMember] = useState("");

  // Quick split calculator state
  const [splitMatchCost, setSplitMatchCost] = useState<number>(600000);
  const [splitPlayerCount, setSplitPlayerCount] = useState<number>(10);

  // New Club Form State
  const [newClubName, setNewClubName] = useState("");
  const [newClubHomePitch, setNewClubHomePitch] = useState("");
  const [newClubSlogan, setNewClubSlogan] = useState("");
  const [newClubLevel, setNewClubLevel] = useState<
    "Văn Phòng Phong Trào" | "Bán Chuyên Chiến" | "Dưỡng Sinh Cuối Tuần"
  >("Văn Phòng Phong Trào");

  // New Member Form State
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberJersey, setNewMemberJersey] = useState<number | string>(9);
  const [newMemberPosition, setNewMemberPosition] = useState<"GK" | "DF" | "MF" | "FW">("MF");
  const [newMemberRole, setNewMemberRole] = useState<"Đội Trưởng" | "Đội Phó" | "Thành Viên">("Thành Viên");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  // New Expense Form State
  const [newExpType, setNewExpType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [newExpCategory, setNewExpCategory] = useState<
    "Thu Quỹ Tháng" | "Tiền Thuê Sân" | "Tiền Nước Uống" | "Mua Bóng/Áo" | "Khác"
  >("Tiền Thuê Sân");
  const [newExpAmount, setNewExpAmount] = useState<number | string>(450000);
  const [newExpNote, setNewExpNote] = useState("");

  // New Match Form State
  const [newMatchOpponent, setNewMatchOpponent] = useState("");
  const [newMatchDate, setNewMatchDate] = useState("Thứ Bảy, 16/11/2026");
  const [newMatchTime, setNewMatchTime] = useState("18:00 - 19:30");
  const [newMatchPitch, setNewMatchPitch] = useState("");
  const [newMatchFormat, setNewMatchFormat] = useState<"Sân 5" | "Sân 7" | "Sân 11">("Sân 5");
  const [newMatchNote, setNewMatchNote] = useState("Kèo giao lưu nhẹ nhàng vui vẻ");

  const myPhone = (user?.phone ?? "").toString().replace(/\s/g, "");

  // Load clubs from local storage / API
  useEffect(() => {
    let saved: GrassrootsClub[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          saved = parsed;
        }
      }
    } catch {
      // ignore
    }

    if (saved.length === 0) {
      saved = [DEFAULT_DEMO_CLUB];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      } catch {
        // ignore
      }
    }

    setClubs(saved);
    if (saved.length > 0) {
      setActiveClubId(saved[0].id);
    }
  }, []);

  // Save to localStorage whenever clubs update
  const saveClubs = (updated: GrassrootsClub[]) => {
    setClubs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Fetch tournaments for the official tournament sub-tab
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchTournaments();
        if (alive) setTournaments(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (alive) setError(e?.message || "Không tải được danh sách giải");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const currentClub = useMemo(() => {
    return clubs.find((c) => c.id === activeClubId) || clubs[0] || DEFAULT_DEMO_CLUB;
  }, [clubs, activeClubId]);

  // Tournament teams registered with user's phone
  const myTeams = useMemo(() => {
    if (!myPhone) return [];
    const out: any[] = [];
    for (const t of tournaments) {
      for (const z of t.teams ?? []) {
        if (String(z.captainPhone ?? "").replace(/\s/g, "") !== myPhone) continue;
        out.push({ ...z, tournament: t });
      }
    }
    return out;
  }, [tournaments, myPhone]);

  const primaryTeam = myTeams[0] ?? null;

  const myMatches = useMemo(() => {
    const out: any[] = [];
    if (!primaryTeam?.teamName) return out;
    for (const t of tournaments) {
      const team = (t.teams ?? []).find(
        (z: any) => String(z.captainPhone ?? "").replace(/\s/g, "") === myPhone
      );
      if (!team?.teamName || !t.bracketJson) continue;
      let bracket: any = null;
      try {
        bracket = JSON.parse(t.bracketJson);
      } catch {
        continue;
      }
      if (!Array.isArray(bracket?.rounds)) continue;
      for (const r of bracket.rounds) {
        for (const m of r.matches ?? []) {
          if (!m.teamA || !m.teamB) continue;
          const isA = m.teamA.name === team.teamName;
          const isB = m.teamB.name === team.teamName;
          if (!isA && !isB) continue;
          out.push({
            id: `${t.id}-${m.matchId}`,
            round: r.name ?? r.roundName ?? "Vòng",
            date: m.matchDate ?? "—",
            time: m.timeSlot ?? "—",
            pitch: m.pitchName ?? t.pitchName ?? t.location ?? "Chưa xếp sân",
            myTeam: isA ? m.teamA.name : m.teamB.name,
            opponent: isA ? m.teamB.name : m.teamA.name,
            status: m.status ?? "PENDING",
            score: m.status === "DONE" ? `${m.scoreA ?? 0} - ${m.scoreB ?? 0}` : "Chưa đấu",
            format: sportLabel(t.sportType),
          });
        }
      }
    }
    return out;
  }, [tournaments, primaryTeam, myPhone]);

  /* =========================================================
   * VALIDATION RULES & INLINE FEEDBACK COMPUTATION
   * ========================================================= */

  // 1. Validation for Creating Club
  const clubNameTrimmed = newClubName.trim();
  const clubNameError = useMemo(() => {
    if (!newClubName) return "";
    if (clubNameTrimmed.length < 3) return "Tên CLB phải có ít nhất 3 ký tự.";
    if (clubNameTrimmed.length > 50) return "Tên CLB không được vượt quá 50 ký tự.";
    if (
      clubs.some(
        (c) => c.name.trim().toLowerCase() === clubNameTrimmed.toLowerCase()
      )
    ) {
      return `Tên CLB "${clubNameTrimmed}" đã tồn tại trên hệ thống. Vui lòng chọn tên khác!`;
    }
    return "";
  }, [newClubName, clubNameTrimmed, clubs]);

  const clubSloganError = useMemo(() => {
    if (newClubSlogan.length > 100) return "Slogan tối đa 100 ký tự.";
    return "";
  }, [newClubSlogan]);

  const clubHomePitchError = useMemo(() => {
    if (newClubHomePitch.trim().length > 80) return "Tên sân không được vượt quá 80 ký tự.";
    return "";
  }, [newClubHomePitch]);

  const isClubValid =
    clubNameTrimmed.length >= 3 &&
    clubNameTrimmed.length <= 50 &&
    !clubNameError &&
    !clubSloganError &&
    !clubHomePitchError;

  // 2. Validation for Adding Squad Player
  const memberNameTrimmed = newMemberName.trim();
  const memberNameError = useMemo(() => {
    if (!newMemberName) return "";
    if (memberNameTrimmed.length < 3) return "Vui lòng nhập tên cầu thủ (tối thiểu 3 ký tự).";
    const words = memberNameTrimmed.split(/\s+/).filter(Boolean);
    if (words.length < 2) return "Vui lòng nhập đầy đủ cả họ và tên (tối thiểu 2 từ).";
    return "";
  }, [newMemberName, memberNameTrimmed]);

  const memberJerseyNumber = Number(newMemberJersey);
  const memberJerseyError = useMemo(() => {
    if (newMemberJersey === "" || isNaN(memberJerseyNumber)) {
      return "Vui lòng nhập số áo hợp lệ.";
    }
    if (memberJerseyNumber < 0 || memberJerseyNumber > 99) {
      return "Số áo hợp lệ từ 0 đến 99.";
    }
    const duplicate = currentClub.roster.find((p) => p.jerseyNumber === memberJerseyNumber);
    if (duplicate) {
      return `Số áo #${memberJerseyNumber} đã thuộc về cầu thủ ${duplicate.name}!`;
    }
    return "";
  }, [newMemberJersey, memberJerseyNumber, currentClub.roster]);

  const memberPhoneTrimmed = newMemberPhone.trim().replace(/\s/g, "");
  const memberPhoneError = useMemo(() => {
    if (!newMemberPhone) return "";
    if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(memberPhoneTrimmed)) {
      return "Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu 03/05/07/08/09).";
    }
    const duplicate = currentClub.roster.find(
      (p) => p.phone && p.phone.replace(/\s/g, "") === memberPhoneTrimmed
    );
    if (duplicate) {
      return `Số điện thoại này đã được đăng ký bởi cầu thủ ${duplicate.name}!`;
    }
    return "";
  }, [newMemberPhone, memberPhoneTrimmed, currentClub.roster]);

  const memberRoleWarning = useMemo(() => {
    if (newMemberRole === "Đội Trưởng") {
      const existingCaptain = currentClub.roster.find((p) => p.role === "Đội Trưởng");
      if (existingCaptain) {
        return `Đội hiện đã có Đội Trưởng (${existingCaptain.name}). Khi thêm mới, vai trò Đội Trưởng sẽ chuyển sang cho cầu thủ này.`;
      }
    }
    return "";
  }, [newMemberRole, currentClub.roster]);

  const isMemberValid =
    memberNameTrimmed.length >= 3 &&
    !memberNameError &&
    !memberJerseyError &&
    (!newMemberPhone || !memberPhoneError);

  // 3. Validation for Treasury Income/Expense
  const expAmountNumber = Number(newExpAmount);
  const expenseAmountError = useMemo(() => {
    if (newExpAmount === "" || isNaN(expAmountNumber)) {
      return "Vui lòng nhập số tiền hợp lệ.";
    }
    if (expAmountNumber < 1000) {
      return "Số tiền giao dịch tối thiểu là 1.000 đ.";
    }
    if (expAmountNumber > 100000000) {
      return "Số tiền giao dịch tối đa là 100.000.000 đ.";
    }
    return "";
  }, [newExpAmount, expAmountNumber]);

  const expenseNoteError = useMemo(() => {
    if (newExpCategory === "Khác" && !newExpNote.trim()) {
      return "Vui lòng nhập ghi chú chi tiết khi chọn danh mục Khác.";
    }
    if (newExpNote.length > 200) {
      return "Ghi chú không được vượt quá 200 ký tự.";
    }
    return "";
  }, [newExpCategory, newExpNote]);

  const isExpenseValid = !expenseAmountError && !expenseNoteError;

  // 4. Validation for Quick Split Calculator
  const splitCostError = useMemo(() => {
    if (splitMatchCost <= 0) return "Tổng chi phí trận đấu phải lớn hơn 0 đ.";
    return "";
  }, [splitMatchCost]);

  const splitCountError = useMemo(() => {
    if (splitPlayerCount < 1) return "Số người chia tiền tối thiểu là 1.";
    if (splitPlayerCount > 50) return "Số người chia tiền tối đa là 50.";
    return "";
  }, [splitPlayerCount]);

  const splitWarning = useMemo(() => {
    if (splitPlayerCount > currentClub.roster.length && currentClub.roster.length > 0) {
      return `Lưu ý: Số người chia (${splitPlayerCount}) nhiều hơn quân số hiện tại của CLB (${currentClub.roster.length} người).`;
    }
    return "";
  }, [splitPlayerCount, currentClub.roster.length]);

  // 5. Validation for Adding Match
  const matchOpponentTrimmed = newMatchOpponent.trim();
  const matchOpponentError = useMemo(() => {
    if (!newMatchOpponent) return "";
    if (matchOpponentTrimmed.length < 2) return "Tên đối thủ phải có ít nhất 2 ký tự.";
    if (
      matchOpponentTrimmed.toLowerCase() === currentClub.name.trim().toLowerCase()
    ) {
      return "Tên đối thủ không được trùng với tên CLB của bạn!";
    }
    return "";
  }, [newMatchOpponent, matchOpponentTrimmed, currentClub.name]);

  const matchDateError = useMemo(() => {
    if (!newMatchDate.trim()) return "Vui lòng nhập ngày thi đấu.";
    return "";
  }, [newMatchDate]);

  const matchTimeError = useMemo(() => {
    if (!newMatchTime.trim()) return "Vui lòng nhập khung giờ thi đấu.";
    return "";
  }, [newMatchTime]);

  const isMatchValid =
    matchOpponentTrimmed.length >= 2 &&
    !matchOpponentError &&
    !matchDateError &&
    !matchTimeError;

  /* =========================================================
   * HANDLERS
   * ========================================================= */

  // Handle adding new club
  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClubValid) return;

    const newClub: GrassrootsClub = {
      id: `club-${Date.now()}`,
      name: clubNameTrimmed,
      slug: clubNameTrimmed.toLowerCase().replace(/\s+/g, "-"),
      slogan: newClubSlogan.trim() || "Chơi hết mình, giao lưu hết sức",
      homePitch: newClubHomePitch.trim() || "Chưa chọn sân nhà",
      primaryColor: "#0284c7",
      secondaryColor: "#ffffff",
      level: newClubLevel,
      fundBalance: 0,
      roster: [
        {
          id: `p-${Date.now()}-1`,
          name: user?.fullName || "Đội Trưởng",
          jerseyNumber: 10,
          position: "MF",
          role: "Đội Trưởng",
          phone: user?.phone || "0900000000",
          rsvpStatus: "ATTENDING",
          paidFee: true,
        },
      ],
      expenses: [],
      matches: [],
    };

    const updated = [newClub, ...clubs];
    saveClubs(updated);
    setActiveClubId(newClub.id);
    setNewClubName("");
    setNewClubHomePitch("");
    setNewClubSlogan("");
    setShowCreateClubForm(false);
  };

  // Handle adding new player to current club
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMemberValid) return;

    // If new player is Captain, demote previous Captain to Vice-Captain
    const updatedRoster = currentClub.roster.map((p) => {
      if (newMemberRole === "Đội Trưởng" && p.role === "Đội Trưởng") {
        return { ...p, role: "Đội Phó" as const };
      }
      return p;
    });

    const newPlayer: SquadPlayer = {
      id: `p-${Date.now()}`,
      name: memberNameTrimmed,
      jerseyNumber: memberJerseyNumber,
      position: newMemberPosition,
      role: newMemberRole,
      phone: memberPhoneTrimmed || "—",
      rsvpStatus: "ATTENDING",
      paidFee: false,
    };

    const updated = clubs.map((c) => {
      if (c.id === currentClub.id) {
        return {
          ...c,
          roster: [...updatedRoster, newPlayer],
        };
      }
      return c;
    });

    saveClubs(updated);
    setNewMemberName("");
    setNewMemberPhone("");
    setNewMemberJersey(
      Math.min(
        99,
        Math.max(
          1,
          ...currentClub.roster.map((p) => p.jerseyNumber).filter((n) => n < 99),
          0
        ) + 1
      )
    );
    setShowAddMemberForm(false);
  };

  // Handle removing a player
  const handleRemoveMember = (playerId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa cầu thủ này khỏi danh sách đội?")) return;
    const updated = clubs.map((c) => {
      if (c.id === currentClub.id) {
        return {
          ...c,
          roster: c.roster.filter((p) => p.id !== playerId),
        };
      }
      return c;
    });
    saveClubs(updated);
  };

  // Handle toggle paid fee
  const handleTogglePaidFee = (playerId: string) => {
    const updated = clubs.map((c) => {
      if (c.id === currentClub.id) {
        return {
          ...c,
          roster: c.roster.map((p) =>
            p.id === playerId ? { ...p, paidFee: !p.paidFee } : p
          ),
        };
      }
      return c;
    });
    saveClubs(updated);
  };

  // Handle adding expense/income
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExpenseValid) return;

    const newRecord: ClubExpense = {
      id: `exp-${Date.now()}`,
      date: new Date().toLocaleDateString("vi-VN"),
      type: newExpType,
      category: newExpCategory,
      amount: expAmountNumber,
      note: newExpNote.trim() || newExpCategory,
    };

    const diff = newExpType === "INCOME" ? newRecord.amount : -newRecord.amount;

    const updated = clubs.map((c) => {
      if (c.id === currentClub.id) {
        return {
          ...c,
          fundBalance: Math.max(0, c.fundBalance + diff),
          expenses: [newRecord, ...c.expenses],
        };
      }
      return c;
    });

    saveClubs(updated);
    setNewExpAmount(450000);
    setNewExpNote("");
    setShowAddExpenseForm(false);
  };

  // Handle RSVP status for a match
  const handleSetRsvp = (matchId: string, playerId: string, status: "ATTENDING" | "ABSENT" | "LATE") => {
    const updated = clubs.map((c) => {
      if (c.id === currentClub.id) {
        return {
          ...c,
          matches: c.matches.map((m) => {
            if (m.id === matchId) {
              return {
                ...m,
                rsvps: {
                  ...m.rsvps,
                  [playerId]: status,
                },
              };
            }
            return m;
          }),
        };
      }
      return c;
    });
    saveClubs(updated);
  };

  // Handle adding new match
  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatchValid) return;

    const newMatch: ClubScheduleMatch = {
      id: `match-${Date.now()}`,
      opponent: matchOpponentTrimmed,
      date: newMatchDate.trim(),
      timeSlot: newMatchTime.trim(),
      pitchName: newMatchPitch.trim() || currentClub.homePitch || "Sân Bóng Thân Quen",
      format: newMatchFormat,
      note: newMatchNote.trim(),
      rsvps: {},
    };

    const updated = clubs.map((c) => {
      if (c.id === currentClub.id) {
        return {
          ...c,
          matches: [newMatch, ...c.matches],
        };
      }
      return c;
    });

    saveClubs(updated);
    setNewMatchOpponent("");
    setShowAddMatchForm(false);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyFeedback(""), 2500);
  };

  // Position badge colors
  const positionBadge = (pos: "GK" | "DF" | "MF" | "FW") => {
    switch (pos) {
      case "GK":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "DF":
        return "bg-blue-100 text-blue-900 border-blue-300";
      case "MF":
        return "bg-emerald-100 text-emerald-900 border-emerald-300";
      case "FW":
        return "bg-rose-100 text-rose-900 border-rose-300";
    }
  };

  // Sub-tabs list
  const subTabs = [
    {
      key: "roster",
      label: `👥 Đội Hình (${currentClub.roster.length})`,
      shortLabel: `👥 Đội Hình (${currentClub.roster.length})`,
    },
    {
      key: "treasury",
      label: "💰 Quỹ Đội & Tiền Sân",
      shortLabel: "💰 Quỹ Đội",
    },
    {
      key: "rsvp",
      label: `📅 Lịch Đá & Điểm Danh (${currentClub.matches.length})`,
      shortLabel: `📅 Lịch Đá (${currentClub.matches.length})`,
    },
    {
      key: "tournament",
      label: `🏆 Giải Đấu & Thành Tích (${myTeams.length})`,
      shortLabel: `🏆 Giải Đấu (${myTeams.length})`,
    },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Top Banner / Club Profile Selector */}
      <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-sky-100 border border-sky-300 text-[#0369a1] flex items-center justify-center shrink-0 shadow-xs">
              <Shield className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 truncate">
                  {currentClub.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[13px] font-semibold">
                  {currentClub.level}
                </span>
                {clubs.length > 1 && (
                  <select
                    value={activeClubId}
                    onChange={(e) => setActiveClubId(e.target.value)}
                    className="text-[13px] font-medium border border-slate-300 rounded px-2 py-1 bg-white text-slate-700 cursor-pointer"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        Đổi sang: {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-[14px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Sân nhà: <strong>{currentClub.homePitch}</strong>
                </span>
                <span>•</span>
                <span className="italic text-slate-500">"{currentClub.slogan}"</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => onNavigateTab?.("matchmaking")}
              className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Swords className="w-4 h-4 shrink-0" />
              <span>Rủ Kèo</span>
              <span className="hidden sm:inline">Cho CLB</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateClubForm(!showCreateClubForm)}
              className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-[14px] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Tạo CLB</span>
              <span className="hidden sm:inline">Mới</span>
            </button>
          </div>
        </div>

        {/* Inline Create Club Form with Immediate Field Validations */}
        {showCreateClubForm && (
          <form
            onSubmit={handleCreateClub}
            className="p-4 rounded-lg bg-sky-50 border border-sky-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#0369a1] inline-flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Khởi Tạo Đội Bóng / Câu Lạc Bộ Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateClubForm(false)}
                className="text-slate-500 hover:text-slate-700 text-[13px] font-medium cursor-pointer"
              >
                Đóng lại ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Tên Câu Lạc Bộ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: FC Galaxy Đà Nẵng"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                    clubNameError
                      ? "border-rose-400 focus:border-rose-500"
                      : newClubName && !clubNameError
                      ? "border-emerald-400 focus:border-emerald-500"
                      : "border-slate-300 focus:border-[#0369a1]"
                  }`}
                />
                {clubNameError ? (
                  <p className="text-[13px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {clubNameError}
                  </p>
                ) : newClubName ? (
                  <p className="text-[13px] text-emerald-700 mt-1 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Tên CLB hợp lệ
                  </p>
                ) : (
                  <p className="text-[13px] text-slate-500 mt-1">Từ 3 đến 50 ký tự</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Sân Bóng Thân Quen (Sân Nhà)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Sân Chuyên Việt, Sân Tuyên Sơn…"
                  value={newClubHomePitch}
                  onChange={(e) => setNewClubHomePitch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1]"
                />
                {clubHomePitchError ? (
                  <p className="text-[13px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {clubHomePitchError}
                  </p>
                ) : (
                  <p className="text-[13px] text-slate-500 mt-1">Sân ruột tập luyện / bắt kèo</p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Khẩu Hiệu / Slogan
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đá đẹp - Thắng cùng nhau"
                  value={newClubSlogan}
                  onChange={(e) => setNewClubSlogan(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1]"
                />
                <div className="flex items-center justify-between mt-1 text-[13px]">
                  {clubSloganError ? (
                    <span className="text-rose-600 font-medium">{clubSloganError}</span>
                  ) : (
                    <span className="text-slate-500">Mô tả tinh thần đội bóng</span>
                  )}
                  <span
                    className={`font-mono ${
                      newClubSlogan.length > 100 ? "text-rose-600 font-bold" : "text-slate-400"
                    }`}
                  >
                    {newClubSlogan.length}/100
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Trình Độ Hoạt Động
                </label>
                <select
                  value={newClubLevel}
                  onChange={(e: any) => setNewClubLevel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
                >
                  <option value="Văn Phòng Phong Trào">Văn Phòng Phong Trào</option>
                  <option value="Bán Chuyên Chiến">Bán Chuyên Chiến</option>
                  <option value="Dưỡng Sinh Cuối Tuần">Dưỡng Sinh Cuối Tuần</option>
                </select>
                <p className="text-[13px] text-slate-500 mt-1">Giúp ghép kèo phù hợp</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-sky-100">
              <button
                type="button"
                onClick={() => setShowCreateClubForm(false)}
                className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 font-medium text-[13px] cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!isClubValid}
                className={`px-4 py-1.5 rounded-md font-bold text-[13px] transition-colors ${
                  isClubValid
                    ? "bg-[#0369a1] hover:bg-[#075985] text-white cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                Lưu Và Tạo CLB
              </button>
            </div>
          </form>
        )}

        {/* Sub-tabs Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {subTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSubTab(tab.key)}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-md text-[13px] sm:text-[14px] font-bold border transition-colors cursor-pointer ${
                  activeSubTab === tab.key
                    ? "bg-[#0369a1] text-white border-[#0369a1]"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {activeSubTab === "roster" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Tìm cầu thủ, số áo…"
                  className="pl-9 pr-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] w-full focus:outline-none focus:border-[#0369a1]"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddMemberForm(!showAddMemberForm)}
                className="px-3 py-1.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm Cầu Thủ</span>
                <span className="sm:hidden">Thêm</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Copy notification popup feedback */}
      {copyFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-md text-[14px] font-semibold flex items-center justify-between">
          <span>✓ {copyFeedback}</span>
        </div>
      )}

      {/* SUB-TAB 1: ROSTER (Đội hình & Số áo) */}
      {activeSubTab === "roster" && (
        <div className="space-y-4">
          {/* Inline Add Member Form with Realtime Validations */}
          {showAddMemberForm && (
            <form
              onSubmit={handleAddMember}
              className="bg-white rounded-lg border border-sky-300 p-4 space-y-3 bg-sky-50/50"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[#0369a1] inline-flex items-center gap-1.5">
                  <Shirt className="w-4 h-4" />
                  Thêm Cầu Thủ Vào Danh Sách Đội
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddMemberForm(false)}
                  className="text-slate-500 hover:text-slate-700 text-[13px] font-medium cursor-pointer"
                >
                  Đóng lại ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2">
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Họ Và Tên Cầu Thủ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lê Minh Trí"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                      memberNameError
                        ? "border-rose-400 focus:border-rose-500"
                        : newMemberName && !memberNameError
                        ? "border-emerald-400 focus:border-emerald-500"
                        : "border-slate-300 focus:border-[#0369a1]"
                    }`}
                  />
                  {memberNameError ? (
                    <p className="text-[13px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {memberNameError}
                    </p>
                  ) : newMemberName ? (
                    <p className="text-[13px] text-emerald-700 mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      Tên cầu thủ hợp lệ
                    </p>
                  ) : (
                    <p className="text-[13px] text-slate-500 mt-1">Gồm họ và tên (tối thiểu 2 từ)</p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Số Áo (0 - 99) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={newMemberJersey}
                    onChange={(e) => setNewMemberJersey(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-md border text-[14px] font-mono font-bold bg-white focus:outline-none ${
                      memberJerseyError
                        ? "border-rose-400 focus:border-rose-500 bg-rose-50/30"
                        : "border-slate-300 focus:border-[#0369a1]"
                    }`}
                  />
                  {memberJerseyError ? (
                    <p className="text-[13px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {memberJerseyError}
                    </p>
                  ) : (
                    <p className="text-[13px] text-slate-500 mt-1">Chưa bị ai chọn</p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Vị Trí Sở Trường
                  </label>
                  <select
                    value={newMemberPosition}
                    onChange={(e: any) => setNewMemberPosition(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
                  >
                    <option value="GK">Thủ Môn (GK)</option>
                    <option value="DF">Hậu Vệ (DF)</option>
                    <option value="MF">Tiền Vệ (MF)</option>
                    <option value="FW">Tiền Đạo (FW)</option>
                  </select>
                  <p className="text-[13px] text-slate-500 mt-1">Sơ đồ chiến thuật</p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Vai Trò Trong Đội
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e: any) => setNewMemberRole(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
                  >
                    <option value="Thành Viên">Thành Viên</option>
                    <option value="Đội Trưởng">Đội Trưởng</option>
                    <option value="Đội Phó">Đội Phó</option>
                  </select>
                  <p className="text-[13px] text-slate-500 mt-1">Ban cán sự</p>
                </div>
              </div>

              {/* Role Warning if selecting Captain when one exists */}
              {memberRoleWarning && (
                <div className="p-2.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[13px] flex items-center gap-1.5">
                  <Info className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>{memberRoleWarning}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Số Điện Thoại / Zalo
                  </label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0905123456 (10 chữ số)"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                      memberPhoneError
                        ? "border-rose-400 focus:border-rose-500"
                        : newMemberPhone && !memberPhoneError
                        ? "border-emerald-400 focus:border-emerald-500"
                        : "border-slate-300 focus:border-[#0369a1]"
                    }`}
                  />
                  {memberPhoneError ? (
                    <p className="text-[13px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {memberPhoneError}
                    </p>
                  ) : newMemberPhone ? (
                    <p className="text-[13px] text-emerald-700 mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      Số điện thoại hợp lệ
                    </p>
                  ) : (
                    <p className="text-[13px] text-slate-500 mt-1">Dùng để rủ đá qua Zalo</p>
                  )}
                </div>

                <div className="flex items-end justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMemberForm(false)}
                    className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-700 font-medium text-[13px] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!isMemberValid}
                    className={`px-4 py-2 rounded-md font-bold text-[13px] transition-colors ${
                      isMemberValid
                        ? "bg-[#0369a1] hover:bg-[#075985] text-white cursor-pointer"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Lưu Cầu Thủ
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Roster Table */}
          <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">
                  Danh Sách Đội Hình Thi Đấu ({currentClub.roster.length} Cầu Thủ)
                </h3>
                <p className="text-[13px] text-slate-600">
                  Quản lý số áo, vị trí, vai trò cán sự và liên hệ nhanh qua điện thoại/Zalo.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-slate-600">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> GK (Thủ môn)
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> DF (Hậu vệ)
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> MF (Tiền vệ)
                </span>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> FW (Tiền đạo)
                </span>
              </div>
            </div>

            {/* Mobile Card List (Zero Horizontal Scroll) */}
            <div className="block sm:hidden divide-y divide-slate-200 bg-slate-50 p-2.5 space-y-2">
              {currentClub.roster
                .filter(
                  (p) =>
                    !searchMember ||
                    p.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                    String(p.jerseyNumber).includes(searchMember) ||
                    p.position.toLowerCase().includes(searchMember.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={`mobile-${p.id}`}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2.5 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white font-mono font-bold text-[14px] shrink-0">
                        {p.jerseyNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 text-[14px] truncate">
                            {p.name}
                          </p>
                          {p.role === "Đội Trưởng" ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[13px] leading-tight">
                              👑 Trưởng
                            </span>
                          ) : p.role === "Đội Phó" ? (
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-300 text-[#0369a1] font-bold text-[13px] leading-tight">
                              ⭐ Phó
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded border font-bold text-[13px] ${positionBadge(
                              p.position
                            )}`}
                          >
                            {p.position}
                          </span>
                          {p.phone && p.phone !== "—" && (
                            <span className="text-[13px] text-slate-600 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {p.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.phone && p.phone !== "—" && (
                        <a
                          href={`tel:${p.phone}`}
                          className="p-2 text-[#0369a1] bg-sky-50 hover:bg-sky-100 rounded-md border border-sky-200"
                          title="Gọi điện"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(p.id)}
                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
                        title="Xóa cầu thủ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-700">
                    <th className="p-3 font-bold text-center w-16">Số Áo</th>
                    <th className="p-3 font-bold">Cầu Thủ</th>
                    <th className="p-3 font-bold">Vị Trí</th>
                    <th className="p-3 font-bold">Vai Trò</th>
                    <th className="p-3 font-bold">Điện Thoại / Zalo</th>
                    <th className="p-3 font-bold text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentClub.roster
                    .filter(
                      (p) =>
                        !searchMember ||
                        p.name.toLowerCase().includes(searchMember.toLowerCase()) ||
                        String(p.jerseyNumber).includes(searchMember) ||
                        p.position.toLowerCase().includes(searchMember.toLowerCase())
                    )
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-mono font-bold text-[14px]">
                            {p.jerseyNumber}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {p.name}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded border font-bold text-[13px] ${positionBadge(
                              p.position
                            )}`}
                          >
                            {p.position === "GK"
                              ? "GK - Thủ Môn"
                              : p.position === "DF"
                              ? "DF - Hậu Vệ"
                              : p.position === "MF"
                              ? "MF - Tiền Vệ"
                              : "FW - Tiền Đạo"}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.role === "Đội Trưởng" ? (
                            <span className="px-2.5 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[13px]">
                              👑 Đội Trưởng
                            </span>
                          ) : p.role === "Đội Phó" ? (
                            <span className="px-2.5 py-0.5 rounded bg-sky-50 border border-sky-300 text-[#0369a1] font-bold text-[13px]">
                              ⭐ Đội Phó
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[13px] font-medium">
                              Thành Viên
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{p.phone}</span>
                            {p.phone && p.phone !== "—" && (
                              <button
                                type="button"
                                onClick={() => handleCopy(p.phone, "số điện thoại")}
                                title="Sao chép SĐT"
                                className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(p.id)}
                            title="Xóa khỏi đội"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TREASURY & PITCH EXPENSES (Quỹ đội & Tiền sân) */}
      {activeSubTab === "treasury" && (
        <div className="space-y-4">
          {/* Fund Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-slate-300 p-4 space-y-1">
              <p className="text-[13px] font-semibold text-slate-600">Số Dư Quỹ Đội Hiện Tại</p>
              <p className="text-2xl font-bold text-[#0369a1] font-mono">
                {currentClub.fundBalance.toLocaleString("vi-VN")} đ
              </p>
              <p className="text-[13px] text-slate-500">Sẵn sàng chi trả tiền thuê sân & nước</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-300 p-4 space-y-1">
              <p className="text-[13px] font-semibold text-slate-600">Tiền Thu Quỹ Tháng Này</p>
              <p className="text-2xl font-bold text-emerald-700 font-mono">
                {currentClub.expenses
                  .filter((e) => e.type === "INCOME")
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString("vi-VN")}{" "}
                đ
              </p>
              <p className="text-[13px] text-slate-500">Đã thu từ thành viên tham gia</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-300 p-4 space-y-1">
              <p className="text-[13px] font-semibold text-slate-600">Đã Chi Sân & Nước Uống</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">
                {currentClub.expenses
                  .filter((e) => e.type === "EXPENSE")
                  .reduce((sum, e) => sum + e.amount, 0)
                  .toLocaleString("vi-VN")}{" "}
                đ
              </p>
              <p className="text-[13px] text-slate-500">Tổng các khoản chi trong tháng</p>
            </div>
          </div>

          {/* Quick Match Fee Splitter with Validations */}
          <div className="bg-white rounded-lg border border-slate-300 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 inline-flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Công Cụ Chia Tiền Sân Nhanh (Campuchia Theo Đầu Người)
                </h3>
                <p className="text-[13px] text-slate-600">
                  Tự động chia đều chi phí thuê sân + nước uống cho số người ra sân hôm nay.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrBox(!showQrBox)}
                className="px-3.5 py-2 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0369a1] border border-sky-300 font-bold text-[13px] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <QrCode className="w-4 h-4" />
                {showQrBox ? "Ẩn Mã VietQR" : "Hiện Mã VietQR Thu Tiền"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Tổng Chi Phí Trận Đấu (Sân + Nước)
                </label>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  value={splitMatchCost}
                  onChange={(e) => setSplitMatchCost(Number(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-md border font-mono font-bold text-[15px] bg-white focus:outline-none ${
                    splitCostError
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-[#0369a1]"
                  }`}
                />
                {splitCostError && (
                  <p className="text-[13px] text-rose-600 font-medium mt-1">
                    {splitCostError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                  Số Cầu Thủ Tham Gia Trận Này
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={splitPlayerCount}
                  onChange={(e) => setSplitPlayerCount(Math.max(1, Number(e.target.value) || 1))}
                  className={`w-full px-3 py-2 rounded-md border font-mono font-bold text-[15px] bg-white focus:outline-none ${
                    splitCountError
                      ? "border-rose-400 focus:border-rose-500"
                      : "border-slate-300 focus:border-[#0369a1]"
                  }`}
                />
                {splitCountError ? (
                  <p className="text-[13px] text-rose-600 font-medium mt-1">
                    {splitCountError}
                  </p>
                ) : splitWarning ? (
                  <p className="text-[13px] text-amber-700 font-medium mt-1">
                    {splitWarning}
                  </p>
                ) : (
                  <p className="text-[13px] text-slate-500 mt-1">
                    Quân số đội hiện có: {currentClub.roster.length} người
                  </p>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-300 rounded-md p-3 flex flex-col justify-center">
                <span className="text-[13px] font-bold text-emerald-800">
                  Mỗi Người Cần Đóng:
                </span>
                <span className="text-xl font-bold font-mono text-emerald-900 mt-0.5">
                  {splitPlayerCount > 0
                    ? Math.round(splitMatchCost / splitPlayerCount).toLocaleString("vi-VN")
                    : 0}{" "}
                  đ / người
                </span>
              </div>
            </div>

            {/* Inline VietQR Box */}
            {showQrBox && (
              <div className="p-4 rounded-lg bg-sky-50 border border-sky-300 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-slate-900 inline-flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#0369a1]" />
                    Quét Mã VietQR Chuyển Khoản Trực Tiếp Cho Thủ Quỹ
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQrBox(false)}
                    className="text-slate-500 hover:text-slate-700 text-[13px] cursor-pointer"
                  >
                    Đóng lại ✕
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-md border border-slate-200">
                  <div className="w-36 h-36 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-2 text-center shrink-0">
                    <img
                      src={`https://api.vietqr.io/image/970422-0905123456-compact2.png?amount=${Math.round(
                        splitMatchCost / Math.max(1, splitPlayerCount)
                      )}&addInfo=${encodeURIComponent(
                        `${currentClub.name} Tien San`
                      )}`}
                      alt="VietQR Tiền Sân"
                      className="w-full h-full object-contain"
                      onError={(e: any) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <span className="text-[13px] font-bold text-slate-700 mt-1">VietQR Chuẩn</span>
                  </div>
                  <div className="space-y-1.5 text-[14px] text-slate-700 flex-1">
                    <p>
                      Ngân hàng: <strong>MBBank (Ngân Hàng Quân Đội)</strong>
                    </p>
                    <p className="flex items-center gap-2">
                      Số tài khoản: <strong className="font-mono text-slate-900">0905123456</strong>
                      <button
                        type="button"
                        onClick={() => handleCopy("0905123456", "số tài khoản")}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Sao chép"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </p>
                    <p>
                      Chủ tài khoản: <strong>NGUYEN VAN HUNG (THỦ QUỸ CLB)</strong>
                    </p>
                    <p>
                      Số tiền mỗi người:{" "}
                      <strong className="text-emerald-700 font-mono">
                        {Math.round(splitMatchCost / Math.max(1, splitPlayerCount)).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        đ
                      </strong>
                    </p>
                    <p className="text-[13px] text-slate-500">
                      Nội dung gợi ý: <code>{currentClub.name} [Tên Cầu Thủ] Tien san</code>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist of Players Paid/Unpaid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-slate-800">
                  Đánh Dấu Cầu Thủ Đã Nộp Tiền Sân Trận Này:
                </span>
                <span className="text-[13px] text-slate-500">
                  Click vào trạng thái để đổi Đã Nộp / Chưa Nộp
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {currentClub.roster.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePaidFee(p.id)}
                    className={`p-2.5 rounded-md border text-left flex items-center justify-between transition-colors cursor-pointer ${
                      p.paidFee
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-rose-50 border-rose-300 text-rose-900"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-[14px] truncate">
                        #{p.jerseyNumber} {p.name}
                      </p>
                      <p className="text-[13px] opacity-75">
                        {Math.round(
                          splitMatchCost / Math.max(1, splitPlayerCount)
                        ).toLocaleString("vi-VN")}{" "}
                        đ
                      </p>
                    </div>
                    {p.paidFee ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction History & Inline Add Expense with Validations */}
          <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-[15px]">
                  Nhật Ký Thu Chi Quỹ Đội Bóng
                </h3>
                <p className="text-[13px] text-slate-600">
                  Minh bạch mọi khoản thu quỹ tháng và chi tiêu tiền sân, nước uống.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
                className="px-3 py-1.5 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[13px] inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Ghi Khoản Thu / Chi Mới
              </button>
            </div>

            {/* Inline Add Expense Form with Realtime Field Validation */}
            {showAddExpenseForm && (
              <form
                onSubmit={handleAddExpense}
                className="p-4 bg-sky-50/60 border-b border-sky-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-[14px] font-bold text-[#0369a1]">
                    Ghi Chép Giao Dịch Thu / Chi Quỹ
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddExpenseForm(false)}
                    className="text-slate-500 hover:text-slate-700 text-[13px] cursor-pointer"
                  >
                    Đóng lại ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Loại Giao Dịch
                    </label>
                    <select
                      value={newExpType}
                      onChange={(e: any) => setNewExpType(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
                    >
                      <option value="EXPENSE">Khoản Chi (Tiền Sân, Nước...)</option>
                      <option value="INCOME">Khoản Thu (Đóng Quỹ Tháng, Tài Trợ...)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Danh Mục
                    </label>
                    <select
                      value={newExpCategory}
                      onChange={(e: any) => setNewExpCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
                    >
                      <option value="Tiền Thuê Sân">Tiền Thuê Sân</option>
                      <option value="Tiền Nước Uống">Tiền Nước Uống</option>
                      <option value="Thu Quỹ Tháng">Thu Quỹ Tháng</option>
                      <option value="Mua Bóng/Áo">Mua Bóng/Áo</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Số Tiền (VND) *
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="1000"
                      required
                      value={newExpAmount}
                      onChange={(e) => setNewExpAmount(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-md border font-mono text-[14px] bg-white focus:outline-none ${
                        expenseAmountError
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-slate-300 focus:border-[#0369a1]"
                      }`}
                    />
                    {expenseAmountError ? (
                      <p className="text-[13px] text-rose-600 font-medium mt-1">
                        {expenseAmountError}
                      </p>
                    ) : (
                      <p className="text-[13px] text-slate-500 mt-1">Tối thiểu 1.000 đ</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                      Ghi Chú Chi Tiết
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Trận Thứ Sáu tại sân 5B"
                      value={newExpNote}
                      onChange={(e) => setNewExpNote(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                        expenseNoteError
                          ? "border-rose-400 focus:border-rose-500"
                          : "border-slate-300 focus:border-[#0369a1]"
                      }`}
                    />
                    {expenseNoteError ? (
                      <p className="text-[13px] text-rose-600 font-medium mt-1">
                        {expenseNoteError}
                      </p>
                    ) : (
                      <p className="text-[13px] text-slate-500 mt-1">Mô tả lý do thu chi</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddExpenseForm(false)}
                    className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 font-medium text-[13px] cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!isExpenseValid}
                    className={`px-4 py-1.5 rounded-md font-bold text-[13px] transition-colors ${
                      isExpenseValid
                        ? "bg-[#0369a1] hover:bg-[#075985] text-white cursor-pointer"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Lưu Giao Dịch
                  </button>
                </div>
              </form>
            )}

            {/* Mobile Transaction Cards */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-slate-50 p-2.5 space-y-2">
              {currentClub.expenses.length === 0 ? (
                <p className="p-6 text-center text-slate-500 text-[14px]">
                  Chưa có khoản thu chi nào được ghi chép.
                </p>
              ) : (
                currentClub.expenses.map((e) => (
                  <div
                    key={`mobile-exp-${e.id}`}
                    className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[14px] text-slate-900">{e.category}</span>
                      <span
                        className={`font-mono font-bold text-[14px] ${
                          e.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {e.type === "INCOME" ? "+" : "-"}
                        {e.amount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    {e.note && (
                      <p className="text-[13px] text-slate-600 line-clamp-2">{e.note}</p>
                    )}
                    <p className="text-[13px] text-slate-400 font-mono">{e.date}</p>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-slate-700">
                    <th className="p-3 font-bold">Ngày</th>
                    <th className="p-3 font-bold">Danh Mục</th>
                    <th className="p-3 font-bold">Ghi Chú</th>
                    <th className="p-3 font-bold text-right">Số Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentClub.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-500 text-[14px]">
                        Chưa có khoản thu chi nào được ghi chép.
                      </td>
                    </tr>
                  ) : (
                    currentClub.expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600 font-mono">{e.date}</td>
                        <td className="p-3 font-bold text-slate-900">{e.category}</td>
                        <td className="p-3 text-slate-600">{e.note}</td>
                        <td
                          className={`p-3 text-right font-mono font-bold ${
                            e.type === "INCOME" ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {e.type === "INCOME" ? "+" : "-"}
                          {e.amount.toLocaleString("vi-VN")} đ
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: MATCH SCHEDULE & RSVP (Lịch đá & Điểm danh) */}
      {activeSubTab === "rsvp" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Lịch Thi Đấu Giao Hữu & Điểm Danh Ra Sân
              </h3>
              <p className="text-[13px] text-slate-600">
                Anh em báo điểm danh [Có Mặt], [Vắng], [Đến Trễ] để ban cán sự chủ động quân số.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMatchForm(!showAddMatchForm)}
              className="px-3.5 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Lên Lịch Kèo Đá Mới
            </button>
          </div>

          {/* Inline Add Match Form with Realtime Validations */}
          {showAddMatchForm && (
            <form
              onSubmit={handleAddMatch}
              className="bg-white rounded-lg border border-sky-300 p-4 space-y-3 bg-sky-50/50"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-bold text-[#0369a1] inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Tạo Lịch Trận Đấu Mới Cho CLB
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddMatchForm(false)}
                  className="text-slate-500 hover:text-slate-700 text-[13px] cursor-pointer"
                >
                  Đóng lại ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Đối Thủ Giao Hữu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: FC Brothers, FC IT…"
                    value={newMatchOpponent}
                    onChange={(e) => setNewMatchOpponent(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                      matchOpponentError
                        ? "border-rose-400 focus:border-rose-500"
                        : newMatchOpponent && !matchOpponentError
                        ? "border-emerald-400 focus:border-emerald-500"
                        : "border-slate-300 focus:border-[#0369a1]"
                    }`}
                  />
                  {matchOpponentError ? (
                    <p className="text-[13px] text-rose-600 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {matchOpponentError}
                    </p>
                  ) : newMatchOpponent ? (
                    <p className="text-[13px] text-emerald-700 mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      Đối thủ hợp lệ
                    </p>
                  ) : (
                    <p className="text-[13px] text-slate-500 mt-1">Không trùng tên CLB của bạn</p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Ngày Thi Đấu *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                      matchDateError
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0369a1]"
                    }`}
                  />
                  {matchDateError && (
                    <p className="text-[13px] text-rose-600 font-medium mt-1">
                      {matchDateError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Khung Giờ Đá *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMatchTime}
                    onChange={(e) => setNewMatchTime(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-md border text-[14px] bg-white focus:outline-none ${
                      matchTimeError
                        ? "border-rose-400 focus:border-rose-500"
                        : "border-slate-300 focus:border-[#0369a1]"
                    }`}
                  />
                  {matchTimeError && (
                    <p className="text-[13px] text-rose-600 font-medium mt-1">
                      {matchTimeError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Thể Thức Sân
                  </label>
                  <select
                    value={newMatchFormat}
                    onChange={(e: any) => setNewMatchFormat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1] cursor-pointer"
                  >
                    <option value="Sân 5">Sân 5 Người</option>
                    <option value="Sân 7">Sân 7 Người</option>
                    <option value="Sân 11">Sân 11 Người</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Địa Điểm Sân Bóng
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống sẽ lấy Sân Nhà của CLB"
                    value={newMatchPitch}
                    onChange={(e) => setNewMatchPitch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 mb-1">
                    Ghi Chú Kèo Đấu
                  </label>
                  <input
                    type="text"
                    value={newMatchNote}
                    onChange={(e) => setNewMatchNote(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[14px] focus:outline-none focus:border-[#0369a1]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setShowAddMatchForm(false)}
                  className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 font-medium text-[13px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!isMatchValid}
                  className={`px-4 py-1.5 rounded-md font-bold text-[13px] transition-colors ${
                    isMatchValid
                      ? "bg-[#0369a1] hover:bg-[#075985] text-white cursor-pointer"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Lưu Kèo Đấu
                </button>
              </div>
            </form>
          )}

          {/* Matches List */}
          {currentClub.matches.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-300 p-8 text-center space-y-2">
              <p className="text-[15px] font-bold text-slate-800">
                CLB chưa có lịch thi đấu giao lưu nào sắp tới.
              </p>
              <p className="text-[13px] text-slate-600">
                Bấm nút "Lên Lịch Kèo Đá Mới" hoặc "Rủ Kèo Cho CLB" để kết nối đối thủ trên Chợ Kèo.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentClub.matches.map((m) => {
                // Calculate RSVP totals
                let attending = 0;
                let absent = 0;
                let late = 0;
                currentClub.roster.forEach((p) => {
                  const st = m.rsvps[p.id] || "ATTENDING";
                  if (st === "ATTENDING") attending++;
                  else if (st === "ABSENT") absent++;
                  else if (st === "LATE") late++;
                });

                return (
                  <div
                    key={m.id}
                    className="bg-white rounded-lg border border-slate-300 p-5 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-sky-100 text-[#0369a1] font-bold text-[13px]">
                            {m.format}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900">
                            {currentClub.name}{" "}
                            <span className="text-slate-400 font-normal">vs</span> {m.opponent}
                          </h4>
                        </div>
                        <p className="text-[14px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {m.date}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {m.timeSlot}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {m.pitchName}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const shareText = `⚽ KÈO ĐẤU CLB ${currentClub.name} vs ${m.opponent}\n📅 Thời gian: ${m.date} (${m.timeSlot})\n📍 Địa điểm: ${m.pitchName}\n📝 Ghi chú: ${m.note}\nAnh em vào Turfzone điểm danh nhé!`;
                            handleCopy(shareText, "thông báo rủ Zalo");
                          }}
                          className="px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[13px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Gửi Nhóm Zalo
                        </button>
                      </div>
                    </div>

                    {/* RSVP Stat Bar */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-[14px]">
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          {attending} Có Mặt
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-bold text-amber-700">
                          <Clock className="w-4 h-4" />
                          {late} Đến Trễ
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-bold text-rose-700">
                          <XCircle className="w-4 h-4" />
                          {absent} Vắng Mặt
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-slate-600">
                        {attending >= (m.format === "Sân 5" ? 6 : 9)
                          ? "✓ Đã đủ quân số ra sân!"
                          : "⚠️ Chưa đủ quân số, cần thêm anh em!"}
                      </p>
                    </div>

                    {/* Member RSVP Status List */}
                    <div className="space-y-2">
                      <p className="text-[13px] font-semibold text-slate-700">
                        Danh Sách Điểm Danh Từng Cầu Thủ:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {currentClub.roster.map((p) => {
                          const currentStatus = m.rsvps[p.id] || "ATTENDING";
                          return (
                            <div
                              key={p.id}
                              className="p-2.5 rounded-md border border-slate-200 bg-white flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[14px] text-slate-900 truncate">
                                  #{p.jerseyNumber} {p.name}
                                </p>
                                <p className="text-[13px] text-slate-500">{p.position}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleSetRsvp(m.id, p.id, "ATTENDING")}
                                  title="Đi được"
                                  className={`px-2 py-1 rounded text-[13px] font-bold cursor-pointer border ${
                                    currentStatus === "ATTENDING"
                                      ? "bg-emerald-600 text-white border-emerald-600"
                                      : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                                  }`}
                                >
                                  Đi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRsvp(m.id, p.id, "LATE")}
                                  title="Đến trễ 15p"
                                  className={`px-2 py-1 rounded text-[13px] font-bold cursor-pointer border ${
                                    currentStatus === "LATE"
                                      ? "bg-amber-500 text-white border-amber-500"
                                      : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                                  }`}
                                >
                                  Trễ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRsvp(m.id, p.id, "ABSENT")}
                                  title="Vắng mặt"
                                  className={`px-2 py-1 rounded text-[13px] font-bold cursor-pointer border ${
                                    currentStatus === "ABSENT"
                                      ? "bg-rose-600 text-white border-rose-600"
                                      : "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200"
                                  }`}
                                >
                                  Bận
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 4: TOURNAMENTS & OFFICIAL BRACKETS (Giải đấu & Thành tích) */}
      {activeSubTab === "tournament" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-[15px]">
                Đội Bóng Đã Đăng Ký Giải Đấu Chính Thức ({myTeams.length})
              </h3>
              <p className="text-[13px] text-slate-600">
                Các giải đấu trên hệ thống Turfzone bạn đã đăng ký theo số điện thoại tài khoản.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-slate-600 text-[14px]">
                <Loader2 className="w-5 h-5 animate-spin text-[#0369a1]" /> Đang tải thông tin giải đấu…
              </div>
            ) : myTeams.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-[15px] font-bold text-slate-800">
                  Bạn chưa đăng ký đội bóng nào trong các giải đấu chính thức.
                </p>
                <p className="text-[14px] text-slate-600">
                  Khi đăng ký tham gia giải đấu, nhánh đấu và lịch đấu sẽ tự động đồng bộ tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.("tournaments")}
                  className="px-4 py-2 rounded-md bg-[#0369a1] hover:bg-[#075985] text-white font-bold text-[14px] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Xem Danh Sách Giải Đấu <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Registered Tournament Cards */}
                <div className="block sm:hidden divide-y divide-slate-100 bg-slate-50 p-2.5 space-y-2">
                  {myTeams.map((z, i) => (
                    <div
                      key={`mobile-team-${z.tournament?.id}-${i}`}
                      className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-[15px] truncate">{z.teamName}</p>
                          <p className="text-[13px] text-slate-600 truncate">{z.tournament?.title || "—"}</p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[13px] shrink-0">
                          {z.registrationStatus === "CONFIRMED"
                            ? "Đã xác nhận"
                            : z.registrationStatus === "PENDING_PAYMENT"
                            ? "Chờ cọc"
                            : z.registrationStatus || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] pt-1.5 border-t border-slate-100">
                        <span className="text-slate-600">
                          Quân số: <strong>{z.memberCount ?? "—"} người</strong>
                        </span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {z.record && z.record !== "0-0-0"
                            ? `${z.record} • Thắng ${z.winRate ?? 0}%`
                            : "Đội mới"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-[14px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-slate-700">
                        <th className="p-3 font-bold">Tên Đội</th>
                        <th className="p-3 font-bold">Giải Đấu</th>
                        <th className="p-3 font-bold">Quân Số</th>
                        <th className="p-3 font-bold">Phong Độ</th>
                        <th className="p-3 font-bold">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {myTeams.map((z, i) => (
                        <tr key={`${z.tournament?.id}-${i}`} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">{z.teamName}</td>
                          <td className="p-3 text-slate-600">{z.tournament?.title || "—"}</td>
                          <td className="p-3 font-mono">{z.memberCount ?? "—"} người</td>
                          <td className="p-3 font-mono text-emerald-700 font-bold">
                            {z.record && z.record !== "0-0-0"
                              ? `${z.record} • Thắng ${z.winRate ?? 0}%`
                              : "Đội mới"}
                          </td>
                          <td className="p-3">
                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[13px]">
                              {z.registrationStatus === "CONFIRMED"
                                ? "Đã xác nhận"
                                : z.registrationStatus === "PENDING_PAYMENT"
                                ? "Chờ xác nhận cọc"
                                : z.registrationStatus || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Matches from registered tournaments */}
          {myMatches.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-[15px]">
                  Lịch Thi Đấu Nhánh Đấu Giải ({myMatches.length} Trận)
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:gap-px bg-slate-200">
                {myMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-[15px] truncate">
                        {m.myTeam} <span className="text-slate-400 font-normal">vs</span> {m.opponent}
                      </p>
                      <p className="text-[13px] text-slate-600 mt-0.5 truncate">
                        {m.round} • {m.date} {m.time !== "—" ? `• ${m.time}` : ""} • {m.pitch}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-slate-900 text-[15px]">{m.score}</p>
                      <p
                        className={`text-[13px] font-bold ${
                          m.status === "DONE" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {m.status === "DONE" ? "Đã kết thúc" : "Sắp diễn ra"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
