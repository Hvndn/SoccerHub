from typing import List, Dict, Any

RESULT_POINTS = {"W": 3, "D": 1, "L": 0}

def form_points(recent_form: str) -> float:
    """Điểm phong độ 5 trận gần nhất: W=3, D=1, L=0. Ký tự đầu = trận mới nhất."""
    if not recent_form:
        return 0.0
    return float(sum(RESULT_POINTS.get(c.upper(), 0) for c in recent_form[:5]))

def form_similarity(form_a: str, form_b: str) -> int:
    """Số vị trí trùng kết quả (căn theo trận mới nhất) — càng giống càng dễ đá."""
    a = (form_a or "").upper()[:5]
    b = (form_b or "").upper()[:5]
    return sum(1 for x, y in zip(a, b) if x == y and x in RESULT_POINTS)

def find_matchmaking_opponents(
    my_team: Dict[str, Any],
    candidate_teams: List[Dict[str, Any]],
    max_win_rate_diff: float = 15.0,
) -> List[Dict[str, Any]]:
    """Lọc và xếp đối thủ theo độ tương đồng phong độ:
    ưu tiên chênh lệch tỷ lệ thắng nhỏ, sau đó tới chuỗi 5 trận giống nhau."""
    my_wr = float(my_team.get("win_rate", 50.0))
    my_form = my_team.get("recent_form", "") or ""
    matched = []

    for team in candidate_teams:
        if team.get("id") == my_team.get("id"):
            continue

        # Doi chua DA GI gi: win_rate = 0 nghia la chua co du lieu, khong phai 0% thang.
        # Neu xep theo 0% se ghep doi tan binh voi tan binh va loai doi gioi.
        if int(team.get("played", 0)) <= 0 and not (team.get("recent_form") or "").strip():
            continue

        wr = float(team.get("win_rate", 50.0))
        diff = abs(wr - my_wr)

        if diff <= max_win_rate_diff:
            item = dict(team)
            item["win_rate_diff"] = round(diff, 1)
            item["form_score"] = form_similarity(my_form, team.get("recent_form", "") or "")
            matched.append(item)

    # uy tin (Fair Play) dung lam khoa sap xep thu hai: cung do lech ty le thang
    # thì doi uy tin cao xep truoc.
    matched.sort(key=lambda x: (x["win_rate_diff"], -x["form_score"], -float(x.get("reputation_score", 0))))
    return matched
