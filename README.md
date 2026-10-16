# SoccerHub — Nền Tảng Quản Lý Sân Bóng & Giải Đấu

> **Đồ Án Tốt Nghiệp:** Xây dựng hệ thống quản lý sân bóng và giải đấu thể thao tích hợp tính năng thông minh.
> Phong độ đội bóng được suy ra từ **lịch sử thi đấu thật** (không dùng điểm Elo cộng dồn).

---

## 🔑 Tài Khoản Demo

Hệ thống tự tạo sẵn khi khởi động lần đầu (`DataInitializer`):

| Vai trò | Email | Mật khẩu | Dùng để demo |
|---|---|---|---|
| Quản trị hệ thống | `admin@soccerhub.vn` | `admin123` | Khu vực `/admin`: KPI, quản lý người dùng/giải/sân, duyệt chợ kèo |
| Cầu thủ | `player@soccerhub.vn` | `player123` | Đặt sân, xem vé, tự hủy vé, tham gia chợ kèo |
| Chủ sân | `owner@soccerhub.vn` | `owner123` | Dashboard cụm sân: doanh thu, tỷ lệ lấp đầy, đơn tại quầy |
| Ban tổ chức | `organizer@soccerhub.vn` | `organizer123` | Tạo giải, bốc thăm, nhập tỷ số, VAR |

Ở màn đăng nhập có nút **đăng nhập nhanh 1 chạm** cho 3 vai trò phía trên.

### Nút bổ sung dữ liệu demo (để kịp dữ liệu khi thuyết trình)

| Nút | Vị trí | Tác dụng |
|---|---|---|
| **Tạo đơn giả lập / Dọn dữ liệu demo** | `/admin` → mục *Đặt sân* | Sinh đơn cho 21 ngày (14 ngày trước · 7 ngày sau) trên toàn bộ cụm sân, có doanh thu & tỷ lệ lấp đầy thật. Mọi đơn sinh ra có mã bắt đầu bằng `SIM-` nên xoá sạch được, không lẫn đơn thật |
| **Giả lập đội (Test) +N** | Tab *Giải đấu* | Bổ sung đủ đội theo sức chứa sân, mỗi đội có danh sách thành viên lưu vào CSDL |
| **Bốc thăm** / **Giả lập KQ cả giải** | Tab *Giải đấu* → *Nhánh Bracket* | Dựng nhánh đấu (seed theo thứ tự đăng ký) và điền tỷ số đến vòng chung kết |

Ngoài ra seed sẵn **một giải đã kết thúc** kèm nhánh đấu và 3 kết quả thi đấu thật, nên bảng xếp hạng phong độ mở ra là có dữ liệu luôn.

---

## 📌 Kiến Trúc Hệ Thống (3 dịch vụ)

1. **Backend Core Service (Java 21 + Spring Boot 3.2 + MySQL)** — cổng 8080
   - Xác thực JWT, 4 vai trò: PLAYER / OWNER / ORGANIZER / ADMIN.
   - **Đặt sân:** ma trận ca theo giờ mở/đóng thật của từng sân, chống trùng ca, sinh mã giữ chỗ `VS-…`, check-in tại quầy, người đặt tự hủy vé.
   - **Giải đấu:** đăng ký đội, bốc thăm theo thứ tự đăng ký, nhập tỷ số, BXH, vua phá lưới, VAR.
   - **Phong độ:** `TeamFormService` quét bảng `match_results` mỗi lần đọc → chuỗi 5 trận gần nhất (ký tự đầu = mới nhất), thành tích T-H-B, tỷ lệ thắng. **Không lưu điểm, không cộng dồn.**
   - **Thống kê chủ sân:** doanh thu thật, tỷ lệ lấp đầy, đếm đơn qua website / tại quầy — tính từ CSDL, không có số liệu cứng.
   - Thông báo nội bộ khi có đơn đặt sân mới.

2. **AI Microservice (Python FastAPI)** — thư mục `ai-service/`, cổng 8000
   - `POST /api/v1/ai/recommend-pitches` — chấm điểm tương thích cụm sân theo ngân sách / thể thức / đánh giá.
   - `POST /api/v1/ai/matchmaking` — ghép kèo theo **tỷ lệ thắng + chuỗi phong độ** (`form_matchmaking.py`).

3. **Frontend (Next.js 14 App Router + Tailwind CSS + Framer Motion)** — cổng 3000
   - Ứng dụng 1 trang theo tab: Đặt sân · Chợ kèo · Giải đấu · Vé của tôi · Hồ sơ · Đội của tôi.
   - Route riêng: `/tournaments/new`, `/tournaments/register`, `/admin`.
   - Có `error.tsx` (error boundary) và `not-found.tsx` (trang 404) — lỗi runtime không còn ra màn trắng.

---

## 🚀 Hướng Dẫn Chạy Local

- **1. MySQL:** tạo database `soccerhub_db` (mặc định `root/1234`, cấu hình tại `backend-core/src/main/resources/application.yml`).

- **2. AI Service:**
  ```bash
  cd ai-service
  pip install -r requirements.txt
  python main.py          # cổng 8000
  ```

- **3. Backend Core:**
  ```bash
  cd backend-core
  mvn spring-boot:run     # cổng 8080
  ```

- **4. Frontend:**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Truy cập: `http://localhost:3000`

> Nếu chạy frontend local nhưng backend chưa bật, trỏ sang bản deploy:
> ```bash
> $env:NEXT_PUBLIC_API_BASE_URL='https://soccerhub-backend-core-production.up.railway.app'; npm run dev
> ```

---

## 🎯 Các Phân Hệ Chính

| Phân hệ | Mô tả (khớp với code đang chạy) | Giao diện |
|---|---|---|
| **Đặt Sân** | Tìm kiếm & xem chi tiết cụm sân, ma trận ca theo ngày, đặt ca → sinh mã giữ chỗ lưu vào CSDL | Tab *Đặt sân* |
| **Giải Đấu** | Tạo giải, đăng ký đội (kèm STK nhận lệ phí nếu BTC khai báo → QR VietQR dựng từ STK đó), bốc thăm nhánh, nhập tỷ số, BXH, vua phá lưới, VAR | `/tournaments` |
| **Cộng Đồng** | Bài đăng tìm đối thủ, **BXH Phong Độ 5 Trận** lấy từ lịch sử thi đấu thật, danh sách kèo mở | Tab *Chợ kèo* |
| **Thẻ Thành Viên** | Thông tin thẻ & chỉ số thi đấu tính từ giải / bracket / goal_events trong CSDL | Tab *Thẻ Thành Viên* |
| **Chủ Sân** | Onboarding cụm sân, quản lý giá ca, ma trận ca, thống kê doanh thu & lấp đầy, đơn tại quầy, check-in bằng mã | Tab *Quản Lý Cụm Sân* |

### Về thanh toán (trung thực)
- Hệ thống **chưa tích hợp cổng thanh toán tự động**. Đặt qua web sinh **mã giữ chỗ**; khách cọc trực tiếp với chủ sân, đối soát khi check-in.
- Giải đấu: BTC khai báo tài khoản ngân hàng trong hồ sơ giải → hệ thống dựng QR từ **vietqr.io** dựa trên STK đó; BTC tự xác nhận đã thu lệ phí.
- Không có escrow/ký quỹ tự động, không Napas247, không IoT/MQTT/barrier.

---

## 🎨 Ghi chú thiết kế

- **Màu thương hiệu:** `#0ea5e9` (cyan) cho toàn bộ nút; hover/focus dùng `#0284c7`.
  Chữ thương hiệu `#0b4f6c` giữ cho phần chữ để đảm bảo độ tương phản WCAG AA.
- **Dark mode:** hỗ trợ đầy đủ, mọi panel/ảnh/chữ đều có biến thể `dark:`.
- **Mobile:** không tràn ngang ở 390px trên toàn bộ các route (đã kiểm tra tự động).

---

## 🗂 Cấu Trúc Thư Mục

```
SoccerHub/
├── backend-core/    # Spring Boot API (cổng 8080)
├── ai-service/      # FastAPI — gợi ý sân & ghép kèo theo phong độ (cổng 8000)
├── frontend/        # Next.js app (cổng 3000)
└── README.md
```