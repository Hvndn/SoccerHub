export interface EloRankInfo {
  name: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | "MASTER";
  badge: string;
  badgeClass: string;
  minElo: number;
  nextTierMin?: number;
}

export function getEloRankInfo(elo: number = 1200): EloRankInfo {
  const currentElo = Math.round(elo || 1200);
  if (currentElo >= 1800) {
    return {
      name: "Cao Thủ",
      tier: "MASTER",
      badge: "👑",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
      minElo: 1800,
    };
  } else if (currentElo >= 1600) {
    return {
      name: "Kim Cương",
      tier: "DIAMOND",
      badge: "💎",
      badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-300",
      minElo: 1600,
      nextTierMin: 1800,
    };
  } else if (currentElo >= 1400) {
    return {
      name: "Hạng Vàng",
      tier: "GOLD",
      badge: "🥇",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      minElo: 1400,
      nextTierMin: 1600,
    };
  } else if (currentElo >= 1200) {
    return {
      name: "Hạng Bạc",
      tier: "SILVER",
      badge: "🥈",
      badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
      minElo: 1200,
      nextTierMin: 1400,
    };
  } else {
    return {
      name: "Hạng Đồng",
      tier: "BRONZE",
      badge: "🥉",
      badgeClass: "bg-orange-100 text-orange-900 border-orange-300",
      minElo: 0,
      nextTierMin: 1200,
    };
  }
}
