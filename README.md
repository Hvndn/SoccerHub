# Kick-ON - Intelligent Sports Pitch & Tournament Management Platform

> **Đồ Án Tốt Nghiệp:** Xây dựng hệ thống quản lý sân bóng và giải đấu thể thao tích hợp tính năng thông minh (**Kick-ON**)  
> **Tên tiếng Anh:** Development of an Intelligent Sports Pitch and Tournament Management Platform (Kick-ON)

---

## 📌 Kiến Trúc Công Nghệ Dịch Vụ (Multi-Service Architecture)

1. **Backend Core Service (Java Spring Boot 3.2+):**
   - Xử lý nghiệp vụ chính, bảo mật JWT (Auth/Roles).
   - Cơ chế khóa tạm ca sân chống trùng lịch bằng **Redis Distributed Lock**.
   - Khởi tạo & điều hành giải đấu tự động (Vòng tròn & Loại trực tiếp), bảng xếp hạng live.
   - Cập nhật tỷ số trận đấu theo thời gian thực qua **WebSocket (STOMP)**.
   - Gửi thông báo nhắc lịch đấu qua **Spring Mail / Firebase Cloud Messaging**.

2. **AI Recommendation & Elo Microservice (Python FastAPI + Scikit-learn):**
   - Gợi ý cụm sân bóng phù hợp nhất theo khoảng cách PostGIS, ngân sách, khung giờ rảnh và lịch sử đặt sân.
   - Thuật toán ghép trận giao hữu & xếp hạng chỉ số **Elo Rating**.

3. **Database & Cache Layer:**
   - **PostgreSQL 16 + PostGIS:** Lưu trữ dữ liệu quan hệ & tính toán tọa độ khoảng cách sân bóng.
   - **Redis 7:** Bộ nhớ đệm Cache & Distributed Lock ca sân.

4. **Frontend Modern Web App (Next.js 14 + Tailwind CSS + Lucide Icons + Framer Motion):**
   - Giao diện đạt chuẩn **Rich Aesthetics** theo bản vẽ thiết kế Stitch (Project `10676794006502057770`).
   - Tone màu chủ đạo: Pitch Emerald (`#10b981`), Midnight Navy (`#0f172a`), Electric Lime (`#84cc16`).
   - Sơ đồ nhánh đấu tương tác (**Interactive Tournament Bracket Tree UI**).
   - Thanh toán cọc **VietQR** tự động & sinh mã vé vào sân **QR Code Ticket**.
   - Bảng điều khiển dành cho **Chủ Sân / Admin** (Báo cáo doanh thu & Dynamic Pricing).

---

## 🚀 Hướng Dẫn Chạy Hệ Thống

### 1. Khởi chạy toàn bộ hạ tầng bằng Docker Compose
```bash
cd SoccerHub
docker-compose up -d --build
```

### 2. Chạy từng dịch vụ ở môi trường Development Local
- **AI Service (Python FastAPI):**
  ```bash
  cd ai-service
  pip install -r requirements.txt
  uvicorn main:app --reload --port 8000
  ```

- **Backend Core (Java Spring Boot):**
  ```bash
  cd backend-core
  mvn spring-boot:run
  ```

- **Frontend (Next.js App):**
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Truy cập ứng dụng tại: `http://localhost:3000`

---

## 🎯 Các Phân Hệ Chức Năng Chính

| Phân hệ | Mô tả & Tính năng | Giao diện / API |
|---|---|---|
| **Đặt Sân & AI Gợi Ý** | Tìm sân theo GPS PostGIS, AI tính % phù hợp, ma trận khung giờ ca sân, thanh toán cọc VietQR | `/booking`, `/booking/[id]` |
| **Giải Đấu & Bracket** | Bốc thăm nhánh đấu tự động, hiển thị cây nhánh đấu Interactive Bracket, tự động tính BXH | `/tournaments` |
| **Biên Bản Trọng Tài Live** | Trọng tài điều khiển tỷ số, thẻ phạt, bàn thắng real-time truyền phát qua WebSocket | `/referee` |
| **Cộng Đồng & Matchmaking** | Ghép đội giao hữu theo chỉ số Elo, Chợ Kèo Khẩn Cấp tìm viện trợ cầu thủ | `/community` |
| **Chủ Sân & Quản Trị** | Báo cáo doanh thu, tỷ lệ lấp đầy ca sân, cấu hình hệ số giá linh hoạt Dynamic Pricing | `/admin` |
