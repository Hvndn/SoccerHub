import math
from typing import List, Dict, Any

K_FACTOR = 32

def calculate_expected_score(rating_a: float, rating_b: float) -> float:
    """Calculate expected probability of Team A winning against Team B."""
    return 1.0 / (1.0 + math.pow(10, (rating_b - rating_a) / 400.0))

def update_elo_ratings(rating_a: float, rating_b: float, score_a: int, score_b: int) -> Dict[str, float]:
    """
    Calculate updated Elo ratings for Team A and Team B based on match result.
    score_a > score_b -> Team A wins (actual_a = 1.0)
    score_a < score_b -> Team B wins (actual_a = 0.0)
    score_a == score_b -> Draw (actual_a = 0.5)
    """
    expected_a = calculate_expected_score(rating_a, rating_b)
    expected_b = calculate_expected_score(rating_b, rating_a)
    
    if score_a > score_b:
        actual_a = 1.0
        actual_b = 0.0
    elif score_a < score_b:
        actual_a = 0.0
        actual_b = 1.0
    else:
        actual_a = 0.5
        actual_b = 0.5
        
    new_rating_a = rating_a + K_FACTOR * (actual_a - expected_a)
    new_rating_b = rating_b + K_FACTOR * (actual_b - expected_b)
    
    return {
        "new_rating_a": round(new_rating_a, 1),
        "new_rating_b": round(new_rating_b, 1),
        "delta_a": round(new_rating_a - rating_a, 1),
        "delta_b": round(new_rating_b - rating_b, 1)
    }

def find_matchmaking_opponents(my_team: Dict[str, Any], candidate_teams: List[Dict[str, Any]], max_elo_diff: float = 200.0) -> List[Dict[str, Any]]:
    """Filter and rank candidate opponent teams by Elo proximity and reputation."""
    my_elo = my_team.get("elo_rating", 1200.0)
    matched = []
    
    for team in candidate_teams:
        if team.get("id") == my_team.get("id"):
            continue
            
        team_elo = team.get("elo_rating", 1200.0)
        diff = abs(team_elo - my_elo)
        
        if diff <= max_elo_diff:
            win_prob = round(calculate_expected_score(my_elo, team_elo) * 100, 1)
            item = dict(team)
            item["elo_diff"] = round(diff, 1)
            item["win_probability_pct"] = win_prob
            matched.append(item)
            
    matched.sort(key=lambda x: x["elo_diff"])
    return matched
