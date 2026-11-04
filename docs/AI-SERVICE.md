# AI Service — FastAPI

Microservice AI của Turfzone (`ai-service/`) giải quyết hai bài toán bằng **luật chấm điểm (rule-based)**, không dùng model học máy: gợi ý cụm sân theo khoảng cách/ngân sách/thể thức/đánh giá và ghép kèo theo tỷ lệ thắng + chuỗi phong độ.

- Framework: FastAPI (Python), chạy bằng Uvicorn; cổng local `8000`, production do Render cấp qua `$PORT`.
- Không kết nối cơ sở dữ liệu, không lưu trạng thái, không xác thực (không JWT/cookie). Code nằm trong 3 file: `main.py` (app + schema + route), `recommendation.py`, `form_matchmaking.py`.
- Tài liệu mô tả đúng theo code hiện tại, không mô tả tính năng dự kiến.

## Mục lục

1. [Kiến trúc & khởi chạy](#1-kiến-trúc--khởi-chạy)
2. [API](#2-api)
3. [Thuật toán gợi ý sân](#3-thuật-toán-gợi-ý-sân)
4. [Thuật toán ghép kèo](#4-thuật-toán-ghép-kèo)
5. [Tích hợp với backend/frontend](#5-tích-hợp-với-backendfrontend)
6. [Hạn chế & hướng mở rộng](#6-hạn-chế--hướng-mở-rộng)

---

## 1. Kiến trúc & khởi chạy

### 1.1 Thành phần

| File | Vai trò | Nội dung chính |
|---|---|---|
| `ai-service/main.py` | Entrypoint ASGI | `FastAPI(title="Turfzone AI Recommendation & Form Matchmaking API", version="2.0.0")`, CORS, 5 Pydantic model, 4 route, `uvicorn.run` khi chạy trực tiếp |
| `ai-service/recommendation.py` | Chấm điểm sân | `haversine_distance()`, `score_pitch_cluster()`, `recommend_pitches()` |
| `ai-service/form_matchmaking.py` | Ghép kèo | `form_points()`, `form_similarity()`, `find_matchmaking_opponents()` |
| `ai-service/requirements.txt` | Phụ thuộc | Chỉ 3 gói: `fastapi>=0.100.0`, `uvicorn>=0.20.0`, `pydantic>=2.0.0` |

`requirements.txt` ghi rõ: trước đây có `scikit-learn`, `pandas`, `pymysql`, `cryptography`, `numpy` nhưng **không import ở đâu**, làm Render cold start lâu (proxy phải chờ tới 55 giây) nên đã loại bỏ.

### 1.2 Cổng & cách chạy

| Ngữ cảnh | Lệnh | Cổng | Ghi chú |
|---|---|---|---|
| Local theo `run.bat` | `cd ai-service && python main.py` | `8000` | `uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)` — **reload bật**, chỉ dùng khi phát triển |
| Local độc lập | `uvicorn main:app --host 0.0.0.0 --port 8000` | `8000` | Không reload |
| Production (`render.yaml`) | `uvicorn main:app --host 0.0.0.0 --port $PORT` | Render cấp | Không reload, 1 worker mặc định |

Cài đặt: `cd ai-service && pip install -r requirements.txt && python main.py`, kiểm tra `curl http://localhost:8000/health` → `{"status":"ONLINE"}`. `host="0.0.0.0"` bắt buộc để truy cập từ ngoài container; `python main.py` không dùng cho production vì `reload=True` sinh watcher tiến trình.

### 1.3 CORS

```python
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001,https://soccer-hub-wheat.vercel.app",
).split(",")
```

| Thuộc tính | Giá trị trong code | Hệ quả |
|---|---|---|
| `allow_origins` | `ALLOWED_ORIGINS`, phân tách bằng dấu phẩy | Thiếu domain Vercel thật thì trình duyệt chặn |
| `allow_credentials` | `False` | Không dùng cookie — đúng vì không có auth |
| `allow_methods` | `["*"]` | Cho mọi method dù chỉ dùng `POST` |
| `allow_headers` | `["*"]` | Cho mọi header, kể cả `Authorization` (không dùng) |

`render.yaml` đặt `ALLOWED_ORIGINS="https://soccer-hub-wheat.vercel.app,http://localhost:3000,http://localhost:3001"`. Đổi domain Vercel phải sửa biến này ở Render.

### 1.4 Đặc điểm vận hành

- Không có middleware/`Depends` xác thực: ai biết URL đều gọi được nếu qua CORS.
- Không logging nghiệp vụ (chỉ log mặc định Uvicorn/FastAPI), không cache, không đọc/ghi file, không MySQL.
- Pydantic v2, dùng `model_dump()`; service sống độc lập với backend và DB (backend chết vẫn gọi AI được và ngược lại).

---

## 2. API

Base URL local `http://localhost:8000`; production `https://<service>.onrender.com`.

### 2.1 Bảng endpoint

| Method | Path | Body | Response | Ghi chú |
|---|---|---|---|---|
| `GET` | `/` | — | `{service, status, endpoints[]}` | Kiểm tra sống, liệt kê endpoint |
| `GET` | `/health` | — | `{"status":"ONLINE"}` | Dùng cho smoke test/probe |
| `POST` | `/api/v1/ai/recommend-pitches` | `PitchRecommendationRequest` | `{status, total_evaluated, recommendations[]}` | Chấm điểm & xếp hạng cụm sân |
| `POST` | `/api/v1/ai/matchmaking` | `MatchmakingRequest` | `{status, my_team_win_rate, matched_opponents[]}` | Lọc & xếp đối thủ |

`GET /` trả `{"service": "Turfzone AI Engine", "status": "ONLINE", "endpoints": ["/api/v1/ai/recommend-pitches", "/api/v1/ai/matchmaking"]}`. Ngoài ra FastAPI tự sinh `/docs` và `/openapi.json`. Không có `PUT/PATCH/DELETE`, không có endpoint lưu kết quả.

### 2.2 Schema `PitchRecommendationRequest`

| Model | Field | Kiểu | Mặc định | Ràng buộc / ý nghĩa |
|---|---|---|---|---|
| `UserPreferenceRequest` | `latitude` | float | `16.0544` | Vĩ độ người dùng (mặc định trung tâm Đà Nẵng) |
| | `longitude` | float | `108.2022` | Kinh độ người dùng |
| | `max_budget` | float | `500000` | `gt=0`, `le=100_000_000`; `0` bị chặn ở validate (trước đây gây `ZeroDivisionError` → HTTP 500) |
| | `pitch_type` | str | `"SAN_7"` | Mã chuẩn backend: `SAN_5` / `SAN_7` / `SAN_11` / `FUTSAL` |
| | `top_n` | int | `5` | `ge=1`, `le=50`; `-1` bị trả 422 (trước đây làm mất 1 kết quả) |
| `PitchClusterItem` | `id` | str | bắt buộc | ID cụm sân phía backend |
| | `name` | str | bắt buộc | Tên cụm sân |
| | `latitude`, `longitude` | float | bắt buộc | Toạ độ cụm sân |
| | `avg_price_per_hour` | float | bắt buộc | Giá trung bình/giờ (VND) |
| | `pitch_types` | list[str] | bắt buộc | Các thể thức có tại cụm sân |
| | `rating` | float | `4.5` | Thang điểm 5 |
| | `image_url`, `address` | str \| null | `null` | Ảnh đại diện, địa chỉ |
| `PitchRecommendationRequest` | `user_preference` | object | bắt buộc | Ở trên |
| | `clusters` | list[object] | bắt buộc | Danh sách cụm sân cần chấm |

### 2.3 Ví dụ `POST /api/v1/ai/recommend-pitches`

Request:

```json
{
  "user_preference": {"latitude": 16.0544, "longitude": 108.2022, "max_budget": 400000, "pitch_type": "SAN_7", "top_n": 2},
  "clusters": [
    {"id": "1", "name": "Sân Hòa Xuân", "latitude": 16.0311, "longitude": 108.2214, "avg_price_per_hour": 350000, "pitch_types": ["SAN_7", "SAN_5"], "rating": 4.6},
    {"id": "2", "name": "Sân Futsal Thanh Khê", "latitude": 16.0653, "longitude": 108.1877, "avg_price_per_hour": 450000, "pitch_types": ["FUTSAL"], "rating": 4.2}
  ]
}
```

Response (số liệu tính đúng theo code, đã làm tròn):

```json
{
  "status": "SUCCESS",
  "total_evaluated": 2,
  "recommendations": [
    {"id": "1", "name": "Sân Hòa Xuân", "latitude": 16.0311, "longitude": 108.2214, "avg_price_per_hour": 350000, "pitch_types": ["SAN_7", "SAN_5"], "rating": 4.6, "image_url": null, "address": null, "compatibility_score": 92.19, "distance_km": 3.3},
    {"id": "2", "name": "Sân Futsal Thanh Khê", "latitude": 16.0653, "longitude": 108.1877, "avg_price_per_hour": 450000, "pitch_types": ["FUTSAL"], "rating": 4.2, "image_url": null, "address": null, "compatibility_score": 78.54, "distance_km": 1.97}
  ]
}
```

| Field bổ sung | Ý nghĩa |
|---|---|
| `compatibility_score` | Điểm tương thích 0–100, làm tròn 2 chữ số |
| `distance_km` | Khoảng cách haversine (km), làm tròn 2 chữ số |

Mỗi phần tử `recommendations[]` giữ **toàn bộ** field của cluster đã validate (`model_dump()`), nên `image_url`/`address` luôn xuất hiện (mặc định `null`) kể cả khi client không gửi.

### 2.4 Schema `MatchmakingRequest`

| Model | Field | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|---|
| `TeamItem` | `id` | str | bắt buộc | Khoá đội, dùng để loại chính mình |
| | `name` | str | bắt buộc | Tên đội |
| | `win_rate` | float | `50.0` | Tỷ lệ thắng (%), backend tính từ lịch sử thật |
| | `played` | int | `0` | Số trận đã đá; `0` = **chưa có dữ liệu** (khác 0% thắng) |
| | `record` | str | `""` | Thành tích `"3-1-2"`; **không dùng** để tính điểm |
| | `recent_form` | str | `""` | 5 trận gần nhất, ký tự đầu = mới nhất, `W/D/L` |
| | `reputation_score` | float | `95.0` | Điểm uy tín/fair-play, khoá sắp xếp thứ ba |
| | `preferred_pitch_type` | str | `"SAN_7"` | Thể thức ưa thích; **không dùng** để tính điểm |
| | `contact_phone` | str \| null | `null` | Chỉ truyền qua (passthrough) |
| `MatchmakingRequest` | `my_team` | object | bắt buộc | Đội của người dùng |
| | `candidate_teams` | list[object] | bắt buộc | Đối thủ tiềm năng |
| | `max_win_rate_diff` | float | `15.0` | Ngưỡng chênh lệch tỷ lệ thắng (điểm %); không có validate |

### 2.5 Ví dụ `POST /api/v1/ai/matchmaking`

Request:

```json
{
  "my_team": {"id": "me", "name": "FC Chủ Nhà", "win_rate": 62.5, "played": 8, "recent_form": "WWDLW", "reputation_score": 92.0},
  "candidate_teams": [
    {"id": "a", "name": "FC A", "win_rate": 60.0, "played": 10, "recent_form": "WWDLW", "reputation_score": 95.0},
    {"id": "b", "name": "FC B", "win_rate": 58.0, "played": 12, "recent_form": "WWLDL", "reputation_score": 88.0},
    {"id": "c", "name": "FC C", "win_rate": 40.0, "played": 6, "recent_form": "LLWDL", "reputation_score": 90.0},
    {"id": "d", "name": "FC D", "win_rate": 0.0, "played": 0, "recent_form": "", "reputation_score": 95.0},
    {"id": "e", "name": "FC E", "win_rate": 70.0, "played": 9, "recent_form": "WDWWL", "reputation_score": 99.0}
  ],
  "max_win_rate_diff": 15.0
}
```

Response:

```json
{
  "status": "SUCCESS",
  "my_team_win_rate": 62.5,
  "matched_opponents": [
    {"id": "a", "name": "FC A", "win_rate": 60.0, "played": 10, "record": "", "recent_form": "WWDLW", "reputation_score": 95.0, "preferred_pitch_type": "SAN_7", "contact_phone": null, "win_rate_diff": 2.5, "form_score": 5},
    {"id": "b", "name": "FC B", "win_rate": 58.0, "played": 12, "record": "", "recent_form": "WWLDL", "reputation_score": 88.0, "preferred_pitch_type": "SAN_7", "contact_phone": null, "win_rate_diff": 4.5, "form_score": 2},
    {"id": "e", "name": "FC E", "win_rate": 70.0, "played": 9, "record": "", "recent_form": "WDWWL", "reputation_score": 99.0, "preferred_pitch_type": "SAN_7", "contact_phone": null, "win_rate_diff": 7.5, "form_score": 1}
  ]
}
```

- `c` bị loại vì `|40,0 − 62,5| = 22,5 > 15`.
- `d` bị loại vì `played = 0` **và** `recent_form` rỗng.
- Field bổ sung: `win_rate_diff` (làm tròn 1 chữ số) và `form_score` (0–5).

### 2.6 Mã lỗi

- `422`: sai kiểu, thiếu field bắt buộc, vi phạm `gt/le/ge` (`max_budget: 0`, `top_n: 0`); body mặc định FastAPI `{"detail":[{"loc":[...],"msg":...,"type":...}]}` (**suy luận** từ hành vi chuẩn của FastAPI; code không có handler tuỳ biến).
- `500`: lỗi không bắt được trong hàm tính điểm, body mặc định FastAPI/Starlette.

Service không tự trả `404` cho endpoint sai (Starlette đảm nhiệm), không rate limit, không handler `HTTPException` tuỳ biến dù đã import.

---

## 3. Thuật toán gợi ý sân

Hàm chính `recommend_pitches(clusters, user_pref, top_n=5)`. Mỗi cụm sân được chấm 4 thành phần quy về thang 0–100 rồi cộng có trọng số.

### 3.1 Điểm khoảng cách (trọng số 0.40)

Khoảng cách haversine với bán kính Trái Đất `R = 6371 km`:

```text
a = sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)
d = 2R · atan2(√a, √(1−a))
distance_score = max(0, 100 · (1 − d / 20))
```

| `d` (km) | 0 | 2 | 5 | 10 | 20 | 25 |
|---|---|---|---|---|---|---|
| `distance_score` | 100 | 90 | 75 | 50 | 0 | 0 |

Ngưỡng cứng 20 km; ngoài ngưỡng thành phần này bằng 0 nhưng cụm sân vẫn có thể được gợi ý nhờ các thành phần khác.

### 3.2 Điểm ngân sách (trọng số 0.25)

```text
avg_price ≤ max_budget  → 100
ngược lại                → clamp(100 · (1 − (avg_price − max_budget)/max_budget), 0, 100)
```

| `avg_price` | `max_budget` | `budget_score` |
|---|---|---|
| 350.000 | 400.000 | 100 |
| 450.000 | 400.000 | 87,5 |
| 500.000 | 500.000 | 100 |
| 600.000 | 500.000 | 80 |
| 1.000.000 | 500.000 | 0 |

Hàm phạt tuyến tính theo **tỷ lệ vượt** ngân sách (không theo số tiền tuyệt đối): giá gấp đôi ngân sách thì về 0. Ở tầng hàm, thiếu `avg_price_per_hour` → `300000`, thiếu `max_budget` → `500000` (qua API hai field này bắt buộc/đã validate nên không xảy ra).

### 3.3 Điểm thể thức (trọng số 0.20)

```text
pref_type  = chuẩn hoá(user_pref.pitch_type)
type_score = 100 nếu pref_type ∈ {chuẩn hoá(t) | t ∈ cluster.pitch_types}, ngược lại 40
```

Chuẩn hoá: `strip().upper()` rồi map alias `PITCH_5→SAN_5`, `PITCH_7→SAN_7`, `PITCH_11→SAN_11`, `PITCH_FUTSAL→FUTSAL`, `FUTSAL→FUTSAL`, nhờ vậy frontend cũ gửi `PITCH_7` vẫn khớp `SAN_7` (trước đây lệch 12 điểm tương thích). Không khớp vẫn được **40 điểm** (mất 12/20 điểm), không bị loại.

### 3.4 Điểm đánh giá (trọng số 0.15)

```text
rating_score = (rating / 5) · 100      # 4.5 → 90
```

Thành phần biến thiên hẹp: rating 4,0–5,0 chỉ tạo 80–100, tức chênh tối đa 3 điểm sau trọng số.

### 3.5 Công thức tổng

```text
compatibility_score = 0.40·distance_score + 0.25·budget_score + 0.20·type_score + 0.15·rating_score
```

Tổng trọng số = 1.00 nên điểm thuộc 0–100; sàn thực tế là `0.20·40 = 8` (khi các thành phần khác bằng 0). Kết quả `round(..., 2)`.

### 3.6 Ví dụ số (khớp response ở mục 2.3)

| Thành phần | Cụm 1 — Hòa Xuân: 3,3049 km; 350.000/400.000; có `SAN_7`; 4.6 | Cụm 2 — Futsal Thanh Khê: 1,9671 km; 450.000/400.000; `FUTSAL`; 4.2 |
|---|---|---|
| Khoảng cách | `100·(1 − 3,3049/20)` = 83,4755 → 33,3902 | `100·(1 − 1,9671/20)` = 90,1643 → 36,0657 |
| Ngân sách | 350.000 ≤ 400.000 = 100 → 25,0000 | `100·(1 − 50.000/400.000)` = 87,5 → 21,8750 |
| Thể thức | 100 → 20,0000 | 40 → 8,0000 |
| Đánh giá | `4.6/5·100` = 92 → 13,8000 | `4.2/5·100` = 84 → 12,6000 |
| **Tổng** | **92,19** | **78,54** |

Cụm 2 gần hơn nhưng thua vì sai thể thức và vượt ngân sách — đúng thứ tự ưu tiên mà trọng số thể hiện: khoảng cách 40% > ngân sách 25% > thể thức 20% > đánh giá 15%.

### 3.7 Thứ tự & xử lý biên

- Sắp xếp giảm dần theo `compatibility_score` (`list.sort(reverse=True)`) — **sort ổn định**, cụm cùng điểm giữ thứ tự client gửi lên.
- Cắt `[:top_n]`; `top_n` do client quyết định (validate 1–50). Không phân trang, `total_evaluated` = số cụm **trước** khi cắt.
- Không khử trùng theo toạ độ/tên, không đảm bảo đa dạng khu vực.
- Ở tầng hàm (không qua validate): toạ độ thiếu → `16.0544 / 108.2022`; `pitch_types` thiếu → `["SAN_7"]`; `rating` thiếu → `4.5`. Qua API, `latitude/longitude/pitch_types` là field bắt buộc.
- `budget <= 0` có xử lý phòng thủ (`budget_score = 0`) nhưng thực tế không tới được vì `max_budget` có `gt=0`.
- Chi phí `O(n log n)`, mỗi cụm 1 lần haversine; không giới hạn `n`.

---

## 4. Thuật toán ghép kèo

Hàm chính `find_matchmaking_opponents(my_team, candidate_teams, max_win_rate_diff=15.0)`.

### 4.1 Đầu vào & nguồn dữ liệu

| Đầu vào | Nguồn thật | Cách dùng |
|---|---|---|
| `win_rate` / `played` | `TeamFormService` tính từ bảng `match_results` | Khoá lọc chính; `played = 0` để nhận biết chưa có dữ liệu |
| `recent_form` | Chuỗi 5 ký tự `W/D/L`, ký tự đầu = mới nhất | Điểm tương đồng phong độ |
| `reputation_score` | Điểm uy tín/fair-play của đội | Khoá sắp xếp cuối |
| `record`, `preferred_pitch_type`, `contact_phone` | Backend | Không tham gia tính điểm |

### 4.2 Điểm phong độ & độ tương đồng

`form_points(recent_form)` — tổng điểm 5 trận, `W=3, D=1, L=0`, lấy tối đa 5 ký tự đầu:

```text
form_points("WWDLW") = 3+3+1+0+3 = 10     # tối đa 15
```

Hàm này **được định nghĩa nhưng không được gọi** trong luồng ghép kèo (dead code); API trả `form_score` là số vị trí trùng, không phải `form_points`.

`form_similarity(a, b)` — số vị trí trùng kết quả, căn theo trận mới nhất:

```text
form_similarity("WWDLW", "WWLDL") = 2     # trùng ở vị trí 1 (W) và 2 (W)
```

Chuỗi rỗng → 0; chuỗi dài hơn 5 bị cắt còn 5; so sánh bằng `zip` nên chỉ xét `min(len(a), len(b))` vị trí; ký tự ngoài `W/D/L` không tính là trùng.

### 4.3 Quy trình lọc (tuần tự cho từng đội)

1. Bỏ qua nếu `team.id == my_team.id`.
2. Bỏ qua nếu `played <= 0` **và** `recent_form` rỗng — đội chưa có dữ liệu (tránh ghép đội mới với đội mới và loại đội giỏi).
3. Tính `diff = |team.win_rate − my_team.win_rate|`.
4. Giữ nếu `diff <= max_win_rate_diff` (**bao gồm biên**: chênh đúng 15 vẫn nhận).
5. Gắn `win_rate_diff = round(diff, 1)` và `form_score = form_similarity(my_form, team.recent_form)`.

Không giới hạn số đối thủ trả về, không có điểm tổng hợp, không dự đoán xác suất thắng.

### 4.4 Sắp xếp

```python
matched.sort(key=lambda x: (x["win_rate_diff"], -x["form_score"], -float(x.get("reputation_score", 0))))
```

Ưu tiên: chênh lệch tỷ lệ thắng **nhỏ nhất** → phong độ **giống nhất** → uy tín **cao nhất**. Hai tiêu chí sau chỉ phá thế hoà của tiêu chí trước.

### 4.5 Ví dụ số (khớp response ở mục 2.5)

`my_team`: `win_rate = 62,5`, `recent_form = "WWDLW"`, ngưỡng 15.

| Đội | `win_rate` | `diff` | `form_score` | Kết quả |
|---|---|---|---|---|
| A | 60,0 | 2,5 | 5 | Giữ — hạng 1 |
| B | 58,0 | 4,5 | 2 | Giữ — hạng 2 |
| E | 70,0 | 7,5 | 1 | Giữ — hạng 3 |
| C | 40,0 | 22,5 | — | Loại — vượt ngưỡng |
| D | 0,0 | 62,5 | — | Loại — chưa có dữ liệu (`played = 0`, form rỗng) |

Nếu hai đội cùng `diff` và cùng `form_score`, đội `reputation_score` cao hơn đứng trước.

### 4.6 Biên & lưu ý

- `max_win_rate_diff` âm → gần như chắc chắn trả mảng rỗng (trừ khi `diff = 0` và ngưỡng `≥ 0`); không validate nên client tự chịu.
- `win_rate` không bị chặn 0–100: giá trị `150` hay `-20` vẫn nhận và làm lệch `diff`.
- `my_team` **không** bị kiểm tra "chưa có dữ liệu": đội mới (mặc định 50%) vẫn so với đội đã đá.
- Đội có `played > 0` và `win_rate = 0` vẫn bị coi là thua nhiều và lọc theo ngưỡng — đúng thiết kế.
- Không xét thể thức sân, khu vực, giờ đá, trình độ cầu thủ, lịch rảnh.

---

## 5. Tích hợp với backend/frontend

### 5.1 Luồng gọi

```text
Trình duyệt (Next.js client component)
   │  POST /api/ai/recommend-pitches | /api/ai/matchmaking
   ▼
Next.js route handler: frontend/src/app/api/ai/[...slug]/route.ts
   │  POST {AI_BASE_URL}/api/v1/ai/{path}   (timeout 55s)
   ▼
FastAPI trên Render: /api/v1/ai/*
```

- **Frontend là bên duy nhất gọi AI service**, qua `frontend/src/lib/aiService.ts`, từ `PitchSearch.tsx` (gợi ý sân) và `MatchmakingMarketplace.tsx` (sắp xếp kèo).
- **Backend Spring Boot không gọi AI service.** `application.yml` có khoá `ai-service.url: ${AI_SERVICE_URL:http://localhost:8000}` nhưng không file Java nào đọc khoá này (đã kiểm tra `AI_SERVICE_URL`, `@Value` trong `backend-core`). Đây là cấu hình chết.
- **Mobile app (Expo) không gọi AI service.** `mobile-app/App.tsx` chỉ gọi backend: `/auth/login`, `/pitches`, `/pitches/{id}/matrix`, `/pitches/{id}/book`, `/pitches/bookings/search`, `/tournaments`, `/community/matchmaking-posts`, `/community/matchmaking-posts/{id}/accept`.

### 5.2 Proxy Next.js

| Hành vi | Giá trị trong code | Mục đích |
|---|---|---|
| Chọn base URL | `NEXT_PUBLIC_AI_BASE_URL` → `AI_BASE_URL` → production `https://Turfzone-ai-service.onrender.com` → dev `http://localhost:8000` | Không gãy khi quên biến môi trường |
| `maxDuration` | `60` | Chịu cold start Render (Vercel Pro mới tôn trọng; gói thấp hơn có thể cắt sớm — **suy luận**, không kiểm chứng được trong repo) |
| Timeout upstream | `55.000` ms (`AbortController`) | Khớp cold start |
| Whitelist path | `{"/recommend-pitches", "/matchmaking"}` | Không thành proxy mở |
| Giới hạn body | `256 KB` (kiểm tra cả `content-length` lẫn độ dài thực) | Chống payload lớn |
| CORS trả về | `Access-Control-Allow-Origin: *` | Cho client ngoài gọi (rộng, không dùng auth) |
| Body không phải JSON | `502`, `"AI service trả về dữ liệu không hợp lệ."` | Tránh giao diện đọc `recommendations` của trang HTML lỗi |
| Timeout / lỗi mạng | `504`, `"AI service timeout (cold start)"` / `503`, `"AI service unavailable"` | |
| Path sai / JSON sai / body lớn | `404` `"Endpoint AI không hợp lệ."`; `400` `"Body phải là JSON hợp lệ."`; `413` `"Dữ liệu gửi lên quá lớn."` | |

Proxy chỉ có `POST` và `OPTIONS`; status upstream được giữ nguyên khi forward.

### 5.3 Client: timeout, retry, fallback

- Timeout mỗi lượt: 15 s desktop / 60 s mobile, luôn bị chặn bởi ngân sách tổng `TOTAL_BUDGET_MS = 32000`.
- 3 lượt (1 + 2 retry), backoff `min(1000·2^attempt, 3000)`; lỗi `4xx` **không** retry, trả `null` ngay.
- Trên trình duyệt (`USE_PROXY = typeof window !== 'undefined'`) luôn gọi qua `/api/ai`; phía server (SSR) gọi thẳng `AI_BASE_URL`.

| Màn hình | Hành vi khi AI chết/rỗng |
|---|---|
| Gợi ý sân (`PitchSearch`) | `aiResults` = mảng rỗng; danh sách sân thường từ backend vẫn hiển thị; có cờ "AI đang chậm" sau 3 s |
| Sắp xếp kèo (`MatchmakingMarketplace`) | Bật cờ `aiOffline`, tự sort theo `\|winRate − myWinRate\|` rồi tới `formScoreOf(form, myForm)` — công thức sao chép phía client |

AI là tính năng tăng cường, không phải đường găng: service chết không làm hỏng luồng đặt sân.

### 5.4 Biến môi trường liên quan

| Biến | Nơi dùng | Bắt buộc? | Ghi chú |
|---|---|---|---|
| `ALLOWED_ORIGINS` | `ai-service/main.py` | Nên đặt | Mặc định đã có domain Vercel hiện tại; đổi domain phải sửa |
| `NEXT_PUBLIC_AI_BASE_URL` | `frontend/src/lib/aiService.ts`, route proxy | Không | Có mặc định production trong code; đổi phải redeploy vì là biến `NEXT_PUBLIC_*` (nhúng lúc build) |
| `AI_BASE_URL` | Route proxy (server-side) | Không | Chỉ đọc ở server, không lộ ra bundle |
| `AI_SERVICE_URL` | `application.yml` (`ai-service.url`) | Không | **Không được dùng ở đâu trong code Java** |

### 5.5 Cold start Render free

- Request đầu có thể mất 30–60 s; proxy đợi tối đa 55 s. Vượt 55 s → người dùng nhận `504`, client còn thử lại trong ngân sách 32 s rồi fallback.
- Repo không có cơ chế warm-up định kỳ (**suy luận**: muốn giảm cold start cần cron/ping ngoài; chưa có cấu hình nào làm việc này).

---

## 6. Hạn chế & hướng mở rộng

### 6.1 Đúng theo code hiện tại

| Hạn chế | Biểu hiện trong code |
|---|---|
| Không có học máy | 100% rule-based, trọng số viết cứng `0.40/0.25/0.20/0.15`; không import `sklearn`/`numpy`; không file model |
| Không lưu trạng thái | Không DB, không cache, không log lịch sử request; restart là mất hết |
| Không xác thực | Không middleware auth, `allow_credentials=False`; ai biết URL đều gọi được |
| Không rate limit | Không giới hạn tần suất, không CAPTCHA |
| Không biết tính khả dụng thật | Không nhận ngày/khung giờ/ca trống; không biết sân còn chỗ hay không |
| Trọng số không cấu hình được | Đổi phải sửa code và deploy |
| Ngưỡng khoảng cách cứng | 20 km cố định, không theo thời gian/loại phương tiện |
| Ít tín hiệu | Không dùng sở thích cá nhân, lịch sử đặt, giờ ưa thích, tiện ích sân |
| Ghép kèo đơn giản | Lọc theo 1 biến + 2 khoá phụ; bỏ qua `record`, `preferred_pitch_type`, `contact_phone` |
| Không giới hạn kết quả ghép kèo | Trả toàn bộ đội qua ngưỡng (frontend tự cắt) |
| Dead code / thiếu test | `form_points()` không được gọi, `HTTPException` import thừa; không thư mục test, CI chỉ `py_compile main.py` |
| Không observability | Không log request/độ trễ, không metrics; `/health` chỉ trả `ONLINE` |
| Rủi ro CORS | Phụ thuộc `ALLOWED_ORIGINS`; proxy Next.js lại trả `*` |

### 6.2 Hướng mở rộng (đề xuất, chưa có trong code)

1. **Cấu hình hoá trọng số** qua biến môi trường/file cấu hình, kèm test hồi quy cho vài bộ input cố định.
2. **Đưa tính khả dụng vào bài toán**: nhận `free_slots`, `date`, `start_time`; loại cụm sân kín ca trước khi chấm điểm.
3. **Học trọng số từ dữ liệu thật** (log lựa chọn của người dùng) thay vì chọn tay — chỉ nên làm khi đủ mẫu.
4. **Ghép kèo theo ràng buộc**: thêm giờ đá, khu vực, thể thức, số cầu thủ; dùng bài toán matching thay vì lọc tuần tự.
5. **Bảo vệ endpoint**: API key nội bộ hoặc JWT ngắn hạn giữa Next.js và AI service, kèm rate limit theo IP.
6. **Bổ sung test**: unit test cho `score_pitch_cluster` và `find_matchmaking_opponents` với biên (`budget = 0`, `max_win_rate_diff` âm, form rỗng).
7. **Observability & ghim phiên bản**: log có `request_id`, đếm thời gian xử lý; ghim phiên bản trong `requirements.txt` (hiện dùng `>=`) để tránh vỡ khi Render build lại.
