from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from recommendation import recommend_pitches
from elo_matchmaking import update_elo_ratings, find_matchmaking_opponents

app = FastAPI(
    title="SoccerHub AI Recommendation & Elo Matchmaking API",
    description="Microservice AI gợi ý sân bóng và ghép đội theo Elo cho hệ thống SoccerHub",
    version="1.0.0"
)

# --- Data Schemas ---
class UserPreferenceRequest(BaseModel):
    latitude: float = 10.7769
    longitude: float = 106.7009
    max_budget: float = 500000.0
    pitch_type: str = "PITCH_7"
    top_n: int = 5

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

class EloUpdateRequest(BaseModel):
    rating_a: float
    rating_b: float
    score_a: int
    score_b: int

class TeamItem(BaseModel):
    id: str
    name: str
    elo_rating: float
    reputation_score: float = 95.0
    preferred_pitch_type: str = "PITCH_7"
    contact_phone: Optional[str] = None

class MatchmakingRequest(BaseModel):
    my_team: TeamItem
    candidate_teams: List[TeamItem]
    max_elo_diff: float = 250.0

# --- API Endpoints ---
@app.get("/")
def root():
    return {
        "service": "SoccerHub AI Engine",
        "status": "ONLINE",
        "endpoints": ["/api/v1/ai/recommend-pitches", "/api/v1/ai/calculate-elo", "/api/v1/ai/matchmaking"]
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

@app.post("/api/v1/ai/calculate-elo")
def api_calculate_elo(req: EloUpdateRequest):
    result = update_elo_ratings(req.rating_a, req.rating_b, req.score_a, req.score_b)
    return {
        "status": "SUCCESS",
        "elo_result": result
    }

@app.post("/api/v1/ai/matchmaking")
def api_matchmaking(req: MatchmakingRequest):
    my_team_dict = req.my_team.model_dump()
    candidates_dict = [c.model_dump() for c in req.candidate_teams]
    opponents = find_matchmaking_opponents(my_team_dict, candidates_dict, max_elo_diff=req.max_elo_diff)
    return {
        "status": "SUCCESS",
        "my_team_elo": req.my_team.elo_rating,
        "matched_opponents": opponents
    }
