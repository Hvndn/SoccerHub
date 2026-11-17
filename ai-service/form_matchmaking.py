from typing import List, Dict, Any, Optional

RESULT_POINTS = {"W": 3, "D": 1, "L": 0}

def get_elo_rank_info(elo: int) -> Dict[str, str]:
    """Phân hạng theo điểm số ELO."""
    if elo >= 1800:
        return {"rank": "Cao Thủ", "tier": "MASTER", "badge": "👑"}
    elif elo >= 1600:
        return {"rank": "Kim Cương", "tier": "DIAMOND", "badge": "💎"}
    elif elo >= 1400:
        return {"rank": "Hạng Vàng", "tier": "GOLD", "badge": "🥇"}
    elif elo >= 1200:
        return {"rank": "Hạng Bạc", "tier": "SILVER", "badge": "🥈"}
    else:
        return {"rank": "Hạng Đồng", "tier": "BRONZE", "badge": "🥉"}

def form_points(recent_form: str, window: int = 5) -> float:
    """Điểm phong độ N trận gần nhất (mặc định 5 trận, <= 0 là tất cả): W=3, D=1, L=0."""
    if not recent_form:
        return 0.0
    form_slice = recent_form[:window] if window > 0 else recent_form
    return float(sum(RESULT_POINTS.get(c.upper(), 0) for c in form_slice))

def form_similarity(form_a: str, form_b: str, window: int = 5) -> int:
    """Số vị trí trùng kết quả trong cửa sổ N trận (căn theo trận mới nhất) — càng giống càng dễ đá."""
    a = (form_a or "").upper()
    b = (form_b or "").upper()
    if window > 0:
        a = a[:window]
        b = b[:window]
    return sum(1 for x, y in zip(a, b) if x == y and x in RESULT_POINTS)

def find_matchmaking_opponents(
    my_team: Dict[str, Any],
    candidate_teams: List[Dict[str, Any]],
    max_win_rate_diff: float = 15.0,
    match_window: int = 5,
    max_elo_diff: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Lọc và xếp đối thủ theo độ tương đồng phong độ & điểm xếp hạng ELO:
    - match_window: Số trận gần nhất dùng để phân tích phong độ (5, 10, 15, hoặc <= 0 là tất cả).
    - Ưu tiên cặp đấu cân sức dựa trên chênh lệch ELO và độ tương đồng phong độ.
    """
    my_wr = float(my_team.get("win_rate", 50.0))
    my_elo = int(my_team.get("elo_rating", 1200))
    my_form = my_team.get("recent_form", "") or ""
    matched = []

    for team in candidate_teams:
        if str(team.get("id")) == str(my_team.get("id")):
            continue

        # Đội chưa đá gì: played = 0 nghĩa là chưa có dữ liệu
        if int(team.get("played", 0)) <= 0 and not (team.get("recent_form") or "").strip():
            continue

        wr = float(team.get("win_rate", 50.0))
        team_elo = int(team.get("elo_rating", 1200))
        wr_diff = abs(wr - my_wr)
        elo_diff = abs(team_elo - my_elo)

        if max_elo_diff is not None and elo_diff > max_elo_diff:
            continue

        if wr_diff <= max_win_rate_diff or elo_diff <= 250:
            item = dict(team)
            item["win_rate_diff"] = round(wr_diff, 1)
            item["elo_rating"] = team_elo
            item["elo_diff"] = elo_diff
            item["rank_info"] = get_elo_rank_info(team_elo)
            item["match_window"] = match_window
            item["form_score"] = form_similarity(my_form, team.get("recent_form", "") or "", window=match_window)
            matched.append(item)

    # Sắp xếp ưu tiên: Chênh lệch ELO nhỏ nhất -> Độ tương đồng phong độ cao nhất -> Chênh lệch WinRate nhỏ -> Uy tín cao
    matched.sort(key=lambda x: (x["elo_diff"], -x["form_score"], x["win_rate_diff"], -float(x.get("reputation_score", 0))))
    return matched
