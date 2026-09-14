import math
import numpy as np
from typing import List, Dict, Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def score_pitch_cluster(cluster: Dict[str, Any], user_pref: Dict[str, Any]) -> float:
    """
    Compute recommendation compatibility score (0 to 100) for a pitch cluster based on:
    - Distance proximity (40% weight)
    - Budget compatibility (25% weight)
    - Pitch type match (20% weight)
    - Average user rating & popularity (15% weight)
    """
    # 1. Distance Score
    user_lat = user_pref.get("latitude", 10.7769)
    user_lon = user_pref.get("longitude", 106.7009)
    pitch_lat = cluster.get("latitude", 10.7769)
    pitch_lon = cluster.get("longitude", 106.7009)
    
    dist_km = haversine_distance(user_lat, user_lon, pitch_lat, pitch_lon)
    # Max distance threshold 20km
    distance_score = max(0.0, 100.0 * (1.0 - (dist_km / 20.0)))
    
    # 2. Budget Score
    budget = user_pref.get("max_budget", 500000)
    avg_price = cluster.get("avg_price_per_hour", 300000)
    if avg_price <= budget:
        budget_score = 100.0
    else:
        diff_ratio = (avg_price - budget) / budget
        budget_score = max(0.0, 100.0 * (1.0 - diff_ratio))
        
    # 3. Pitch Type Score (5-a-side, 7-a-side, 11-a-side)
    pref_type = user_pref.get("pitch_type", "PITCH_7")
    types_available = cluster.get("pitch_types", ["PITCH_7"])
    type_score = 100.0 if pref_type in types_available else 40.0
    
    # 4. Rating & Quality Score
    rating = cluster.get("rating", 4.5)
    rating_score = (rating / 5.0) * 100.0
    
    # Final Weighted Formula
    total_score = (
        0.40 * distance_score +
        0.25 * budget_score +
        0.20 * type_score +
        0.15 * rating_score
    )
    
    return round(total_score, 2)

def recommend_pitches(clusters: List[Dict[str, Any]], user_pref: Dict[str, Any], top_n: int = 5) -> List[Dict[str, Any]]:
    """Return top N recommended pitches sorted by compatibility score."""
    scored_list = []
    user_lat = user_pref.get("latitude", 10.7769)
    user_lon = user_pref.get("longitude", 106.7009)
    
    for cluster in clusters:
        score = score_pitch_cluster(cluster, user_pref)
        dist = haversine_distance(user_lat, user_lon, cluster.get("latitude", 10.7769), cluster.get("longitude", 106.7009))
        
        item = dict(cluster)
        item["compatibility_score"] = score
        item["distance_km"] = round(dist, 2)
        scored_list.append(item)
        
    scored_list.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return scored_list[:top_n]
