from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from recommendation import recommend_pitches
from form_matchmaking import find_matchmaking_opponents

app = FastAPI(
    title="Turfzone AI Recommendation & Form Matchmaking API",
    description="Microservice AI gợi ý sân bóng và ghép đội theo phong độ thi đấu cho hệ thống Turfzone",
    version="2.0.0"
)

# Cho phép frontend gọi trực tiếp từ trình duyệt
import os

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,https://soccer-hub-wheat.vercel.app").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,  # AI service không dùng auth/cookie
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Schemas ---
class UserPreferenceRequest(BaseModel):
    latitude: float = 16.0544
    longitude: float = 108.2022
    # gt=0: max_budget = 0 se gay ZeroDivisionError o recommendation.py (HTTP 500)
    max_budget: float = Field(default=500000.0, gt=0, le=100_000_000)
    pitch_type: str = "SAN_7"  # ma chuan cua backend (SAN_5/SAN_7/SAN_11/FUTSAL)
    top_n: int = Field(default=5, ge=1, le=50)  # -1 se lam mat 1 ket qua

class PitchClusterItem(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    avg_price_per_hour: float
    pitch_types: List[str]
    rating: float = 4.5
    image_url: Optional[str] = None
    address: Optional[str] = None

class PitchRecommendationRequest(BaseModel):
    user_preference: UserPreferenceRequest
    clusters: List[PitchClusterItem]

class TeamItem(BaseModel):
    id: str
    name: str
    win_rate: float = 50.0
    # So tran da da: 0 = CHUA DA gi (khac voi 0% thang)
    played: int = 0
    record: str = ""
    recent_form: str = ""
    reputation_score: float = 95.0
    preferred_pitch_type: str = "SAN_7"
    contact_phone: Optional[str] = None

class MatchmakingRequest(BaseModel):
    my_team: TeamItem
    candidate_teams: List[TeamItem]
    max_win_rate_diff: float = 15.0

# --- API Endpoints ---
@app.get("/")
def root():
    return {
        "service": "Turfzone AI Engine",
        "status": "ONLINE",
        "endpoints": ["/api/v1/ai/recommend-pitches", "/api/v1/ai/matchmaking"]
    }

@app.post("/api/v1/ai/recommend-pitches")
def api_recommend_pitches(req: PitchRecommendationRequest):
    clusters_dict = [c.model_dump() for c in req.clusters]
    pref_dict = req.user_preference.model_dump()
    recommended = recommend_pitches(clusters_dict, pref_dict, top_n=req.user_preference.top_n)
    return {
        "status": "SUCCESS",
        "total_evaluated": len(clusters_dict),
        "recommendations": recommended
    }

@app.post("/api/v1/ai/matchmaking")
def api_matchmaking(req: MatchmakingRequest):
    my_team_dict = req.my_team.model_dump()
    candidates_dict = [c.model_dump() for c in req.candidate_teams]
    opponents = find_matchmaking_opponents(my_team_dict, candidates_dict, max_win_rate_diff=req.max_win_rate_diff)
    return {
        "status": "SUCCESS",
        "my_team_win_rate": req.my_team.win_rate,
        "matched_opponents": opponents
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

