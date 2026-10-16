/** Gọi AI service (FastAPI, không cần auth). Trả null khi AI offline. */
const AI_BASE_URL =
  (typeof process !== "undefined" &&
    ((process.env as any)?.NEXT_PUBLIC_AI_BASE_URL || (process.env as any)?.AI_BASE_URL)) ||
  (typeof process !== "undefined" && (process.env as any)?.NODE_ENV === "production"
    ? "https://soccerhub-ai-service.onrender.com"
    : "http://localhost:8000");

/** Use Next.js API proxy to avoid CORS issues on mobile */
const USE_PROXY = typeof window !== 'undefined';

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
  win_rate: number;
  recent_form?: string;
  reputation_score?: number;
  preferred_pitch_type?: string;
  contact_phone?: string | null;
  win_rate_diff?: number;
  form_score?: number;
}

// Mobile-friendly timeout (Render cold start can take 30-60s)
const MOBILE_TIMEOUT_MS = 60000; // 60s for cold start
const DEFAULT_TIMEOUT_MS = 15000; // 15s normal

function getTimeout(): number {
  if (typeof window === 'undefined') return DEFAULT_TIMEOUT_MS;
  // Detect mobile - longer timeout for cold starts
  const isMobile = /Mobi|Android|iPhone|iPad/.test(navigator.userAgent);
  return isMobile ? MOBILE_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

async function postAi<T>(path: string, body: unknown, retries = 2): Promise<T | null> {
  const timeoutMs = getTimeout();
  // Use proxy route on client side to avoid CORS
  const baseUrl = USE_PROXY ? '/api/ai' : AI_BASE_URL;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
        credentials: 'omit', // AI service doesn't use cookies
        cache: 'no-store',
      });
      clearTimeout(timer);
      
      if (!res.ok) {
        // Don't retry on client errors (4xx)
        if (res.status >= 400 && res.status < 500) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      
      return (await res.json()) as T;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      
      if (isLastAttempt) {
        // Log error for debugging (only on last attempt)
        if (typeof window !== 'undefined') {
          console.warn(`[AI Service] ${path} failed after ${retries + 1} attempts:`, error);
        }
        return null;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  
  return null;
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
  return postAi<AiRecommendResult>("/recommend-pitches", {
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
  maxWinRateDiff = 15
): Promise<{ matched_opponents: AiTeam[] } | null> {
  if (!candidates.length) return null;
  return postAi("/matchmaking", {
    my_team: myTeam,
    candidate_teams: candidates,
    max_win_rate_diff: maxWinRateDiff,
  });
}
