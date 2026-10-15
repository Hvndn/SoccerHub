# SoccerHub — Nền Tảng Quản Lý Sân Bóng & Giải Đấu

> **Đồ Án Tốt Nghiệp:** Xây dựng hệ thống quản lý sân bóng và giải đấu thể thao tích hợp tính năng thông minh (**Kick-ON**)
> **Tên tiếng Anh:** Development of an Intelligent Sports Pitch and Tournament Management Platform (Kick-ON)

---

## 📌 Kiến Trúc Hệ Thống (3 dịch vụ chạy local)

1. **Backend Core Service (Java 21 + Spring Boot 3.2 + MySQL):**
   - Xử lý nghiệp vụ chính, bảo mật JWT (PLAYER / OWNER / ORGANIZER / ADMIN).
   - Đặt ca sân: kiểm tra trùng ca trong CSDL, sinh mã giữ chỗ, check-in tại quầy.
   - Giải đấu: đăng ký đội, bốc thăm nhánh đấu (lưu `bracketJson`), nhập tỷ số → tự tính BXH & cập nhật Elo.
   - Cộng đồng: bài đăng ghép kèo, gợi ý đối thủ theo Elo, bảng xếp hạng.
   - Thống kê chủ sân: doanh thu, tỷ lệ lấp đầy, đếm ca đặt qua website / tại quầy.
   - Thông báo nội bộ (Notification) khi có đơn đặt sân mới.

2. **AI Microservice (Python FastAPI — thư mục `ai-service/`, cổng 8000):**
   - `POST /api/v1/ai/recommend-pitches` — gợi ý cụm sân theo ngân sách/khung giờ.
   - `POST /api/v1/ai/calculate-elo` — tính điểm Elo khi lưu kết quả trận.
   - `POST /api/v1/ai/matchmaking` — ghép trận giao hữu theo Elo.

3. **Frontend (Next.js 14 App Router + Tailwind CSS + Framer Motion):**
   - Ứng dụng 1 trang với các phân hệ theo tab: trang chủ, đặt sân (ma trận ca), chi tiết sân (mã giữ chỗ), giải đấu (cây nhánh), cộng đồng, thẻ thành viên, dashboard Chủ Sân / Admin.
   - Route riêng: `/tournaments`, `/tournaments/new`, `/tournaments/register`, `/admin`.

---

## 🚀 Hướng Dẫn Chạy Local

Không dùng Docker — chạy từng dịch vụ:

- **1. MySQL:** tạo database `soccerhub_db` (mặc định `root/1234`, cấu hình trong `backend-core/src/main/resources/application.yml`).

- **2. AI Service (Python FastAPI):**
  ```bash
  cd ai-service
  pip install -r requirements.txt
  python main.py          # cổng 8000
  ```

- **3. Backend Core (Java Spring Boot):**
  ```bash
  cd backend-core
  mvn spring-boot:run     # cổng 8080
  ```

- **4. Frontend (Next.js):**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Truy cập: `http://localhost:3000`

---

## 🎯 Các Phân Hệ Chính

| Phân hệ | Mô tả (đúng với code đang chạy) | Giao diện |
|---|---|---|
| **Đặt Sân** | Tìm kiếm & xem chi tiết cụm sân, ma trận khung giờ theo ngày, đặt ca → sinh mã giữ chỗ lưu vào CSDL | Tab Đặt Sân |
| **Giải Đấu** | Tạo giải, đăng ký đội (kèm STK nhận lệ phí nếu BTC khai báo → QR VietQR sinh từ STK đó), bốc thăm nhánh, nhập tỷ số, BXH, vua phá lưới | `/tournaments` |
| **Cộng Đồng** | Bài đăng tìm đối theo Elo, bảng xếp hạng Elo lấy từ tài khoản thật, danh sách kèo mở | Tab Cộng Đồng |
| **Thẻ Thành Viên** | Thông tin thẻ & chỉ số thi đấu tính từ giải/bracket/goal_events trong CSDL | Tab Thẻ Thành Viên |
| **Chủ Sân** | Onboarding cụm sân, quản lý giá ca, ma trận ca, thống kê doanh thu & lấp đầy, tạo đơn tại quầy, check-in bằng mã | Tab Quản Lý Cụm Sân / `/admin` |

### Về thanh toán (trung thực)
- Hệ thống **chưa tích hợp cổng thanh toán tự động**. Đặt qua web sinh **mã giữ chỗ**; khách cọc trực tiếp với chủ sân, đối soát khi check-in.
- Giải đấu: BTC khai báo tài khoản ngân hàng trong hồ sơ giải → hệ thống dựng QR từ **vietqr.io** dựa trên STK đó; BTC tự xác nhận đã thu lệ phí.
- Không có escrow/ký quỹ tự động, không Napas247, không IoT/MQTT/barrier.

---

## 🗂 Cấu Trúc Thư Mục

```
SoccerHub/
├── backend-core/    # Spring Boot API (cổng 8080)
├── ai-service/      # FastAPI Elo & gợi ý (cổng 8000)
├── frontend/        # Next.js app (cổng 3000)
└── README.md
```
