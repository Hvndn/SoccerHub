/** Gọi trực tiếp AI service (FastAPI, không cần auth). Trả null khi AI offline. */
const AI_BASE_URL =
  (typeof process !== "undefined" && (process.env as any)?.NEXT_PUBLIC_AI_BASE_URL) ||
  "http://localhost:8000";

export interface AiPitchCluster {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  avg_price_per_hour: number;
  pitch_types: string[];
  rating?: number;
  image_url?: string | null;
  address?: string | null;
  compatibility_score?: number;
}

export interface AiRecommendResult {
  status: string;
  total_evaluated: number;
  recommendations: AiPitchCluster[];
}

export interface AiTeam {
  id: string;
  name: string;
  elo_rating: number;
  reputation_score?: number;
  preferred_pitch_type?: string;
  contact_phone?: string | null;
}

async function postAi<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${AI_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getAiBaseUrl(): string {
  return AI_BASE_URL;
}

export async function recommendPitches(
  clusters: AiPitchCluster[],
  preference: {
    latitude?: number;
    longitude?: number;
    max_budget?: number;
    pitch_type?: string;
    top_n?: number;
  }
): Promise<AiRecommendResult | null> {
  if (!clusters.length) return null;
  return postAi<AiRecommendResult>("/api/v1/ai/recommend-pitches", {
    user_preference: {
      latitude: preference.latitude ?? 16.0544,
      longitude: preference.longitude ?? 108.2022,
      max_budget: preference.max_budget ?? 500000,
      pitch_type: preference.pitch_type ?? "PITCH_7",
      top_n: preference.top_n ?? 3,
    },
    clusters,
  });
}

export async function matchmakingAi(
  myTeam: AiTeam,
  candidates: AiTeam[],
  maxEloDiff = 250
): Promise<{ matched_opponents: AiTeam[] } | null> {
  if (!candidates.length) return null;
  return postAi("/api/v1/ai/matchmaking", {
    my_team: myTeam,
    candidate_teams: candidates,
    max_elo_diff: maxEloDiff,
  });
}
