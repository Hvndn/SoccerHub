# API Reference — Turfzone Backend

Tài liệu tham chiếu toàn bộ REST API của dịch vụ `backend-core` (Spring Boot 3.2 / Java 17 / MySQL, cổng mặc định `8080`) trong đồ án Turfzone. Nội dung được trích trực tiếp từ mã nguồn hiện tại: 16 controller trong `backend-core/src/main/java/com/turfzone/controller/`, cấu hình bảo mật trong `com/turfzone/security/`, các DTO trong `com/turfzone/dto/` và entity trong `com/turfzone/model/`. Mục tiêu là để frontend (`Next.js 14`), mobile-app (`Expo/React Native`) và người chấm đồ án đối chiếu được hành vi thật của server: đúng `method`, đúng `path`, đúng tên field JSON, đúng mã lỗi và đúng điều kiện nghiệp vụ — không suy diễn thêm.

**Mục lục**

- [1. Quy ước chung](#1-quy-ước-chung)
- [2. Bảng tổng hợp 131 endpoint](#2-bảng-tổng-hợp-131-endpoint)
- [3. Auth & hồ sơ](#3-auth--hồ-sơ)
- [4. Sân & lịch ca](#4-sân--lịch-ca)
- [5. Đặt sân & vé](#5-đặt-sân--vé)
- [6. Giải đấu](#6-giải-đấu)
- [7. Báo cáo & email giải đấu](#7-báo-cáo--email-giải-đấu)
- [8. Cộng đồng / chợ kèo](#8-cộng-đồng--chợ-kèo)
- [9. CLB & đội](#9-clb--đội)
- [10. Chat cộng đồng](#10-chat-cộng-đồng)
- [11. Chat nhóm](#11-chat-nhóm)
- [12. Căn tin & thông báo](#12-căn-tin--thông-báo)
- [13. Quản trị (admin)](#13-quản-trị-admin)
- [14. Báo cáo & email chủ sân, Health](#14-báo-cáo--email-chủ-sân-health)
- [15. Ma trận phân quyền](#15-ma-trận-phân-quyền)
- [16. Ghi chú tích hợp](#16-ghi-chú-tích-hợp)

---

## 1. Quy ước chung

### 1.1 Base URL và prefix

| Môi trường | Base URL |
| --- | --- |
| Local (mặc định) | `http://localhost:8080` |
| Biến môi trường | Cổng đọc từ `${PORT:8080}` (`backend-core/src/main/resources/application.yml`) |
| Frontend dev | `http://localhost:8080` — `frontend/src/lib/api.ts:12` |
| Frontend production | `https://turfzone-core-production.up.railway.app` — `frontend/src/lib/api.ts:7` |

Toàn bộ endpoint nghiệp vụ nằm dưới prefix `/api/v1`. Hai ngoại lệ: `GET /` và `GET /health` (cùng một handler với `GET /api/v1/health`).

### 1.2 Xác thực

- Header: `Authorization: Bearer <JWT>` (`JwtAuthenticationFilter.java:66-72`).
- Token do `JwtTokenProvider.generateToken(email, role)` sinh ra: thuật toán `HS256`, `subject` = email đăng nhập, claim `role` = tên `UserRole` (`JwtTokenProvider.java:64-75`).
- **Thời hạn token: 86.400.000 ms = 24 giờ**, khai báo cứng trong `application.yml` (`jwt.expiration: 86400000`), không đọc từ biến môi trường. Secret lấy từ `${JWT_SECRET:}`; nếu để trống, ứng dụng dùng secret dự phòng trong mã nguồn và ghi cảnh báo lúc khởi động (`JwtTokenProvider.java:26-46`).
- Token của tài khoản bị khóa (`enabled = false`) bị từ chối ngay ở filter, kể cả khi token còn hạn (`JwtAuthenticationFilter.java:44-49`).
- Filter tra `User` từ DB theo email ở **mỗi request** rồi mới gắn `Authentication`, nên `@AuthenticationPrincipal User` chính là entity `User` đang đăng nhập.

### 1.3 Bốn vai trò

`UserRole` (`backend-core/src/main/java/com/turfzone/model/UserRole.java`): `PLAYER`, `OWNER`, `ORGANIZER`, `ADMIN`.

| Vai trò | Ý nghĩa nghiệp vụ |
| --- | --- |
| `PLAYER` | Cầu thủ: đặt sân, đăng ký giải, chat, chợ kèo, CLB |
| `OWNER` | Chủ cụm sân: quản lý sân con, giá, giờ mở cửa, đơn tại quầy, căn tin, báo cáo doanh thu |
| `ORGANIZER` | Ban tổ chức giải: tạo/sửa giải, bốc thăm, xếp lịch, nhập kết quả, duyệt đội |
| `ADMIN` | Quản trị hệ thống: toàn quyền, quản lý người dùng, kiểm duyệt, xóa dữ liệu |

Đăng ký công khai **luôn** tạo tài khoản `PLAYER` — client gửi `role` gì cũng bị bỏ qua (`AuthService.java:76-81`). Vai trò chỉ được cấp qua `PATCH /api/v1/admin/users/{id}/role`.

### 1.4 Định dạng lỗi thực tế

Dự án **không** có `@RestControllerAdvice`/`@ExceptionHandler` toàn cục (không có file `*Exception*.java` trong `com/turfzone`). Vì vậy mỗi controller tự dựng body lỗi, tồn tại **ba** định dạng:

| Định dạng | Nơi dùng |
| --- | --- |
| `{"message": "..."}` | Đa số endpoint: `AuthController`, `PitchBookingController`, `ClubController`, `ChatController`, `ChatGroupController`, `CanteenController`, `NotificationController`, `AdminController`, `AdminManageController`, `OwnerReportController`, `TournamentEmailController`, `TournamentReportController`, hầu hết `TournamentController` |
| `{"error": "..."}` | `CommunityController` (đăng ký kèo, nhận kèo, gửi đánh giá) — `CommunityController.java:70,112,133,266,279,284`; và `POST /api/v1/tournaments/{id}/register` (mọi nhánh lỗi) — `TournamentController.java:1550-1630` |
| `{"status": "ERROR", "message": "..."}` | Riêng `POST /api/v1/admin/dynamic-pricing` — `OwnerAdminController.java:169-234` |

Mã HTTP dùng trong code: `400` (dữ liệu sai/vi phạm nghiệp vụ), `401` (controller tự trả khi `@AuthenticationPrincipal` là `null`), `403` (sai chủ sở hữu/sai vai trò, hoặc do Spring Security chặn), `404` (không tìm thấy), `429` (đăng nhập sai quá nhiều), `500` (lỗi hệ thống).

> [!NOTE]
> Khi request thiếu token hoặc thiếu vai trò ở tầng `@PreAuthorize`, `SecurityConfig` không cấu hình `authenticationEntryPoint` nên Spring Security trả **403 với body rỗng** (không phải 401 JSON). Chỉ các endpoint nằm trong danh sách `permitAll` mới có cơ hội nhận `401` kèm `{"message": ...}` do chính controller trả.

### 1.5 Kiểu dữ liệu ngày giờ và tiền

| Kiểu | Định dạng | Ví dụ |
| --- | --- | --- |
| Ngày (`bookingDate`, `startDate`, `from`, `to`) | Chuỗi `yyyy-MM-dd` | `2026-10-25` |
| Khung giờ (`timeSlot`) | Chuỗi `"HH:mm - HH:mm"` | `"18:00 - 20:00"` |
| `LocalDateTime` (`createdAt`, `joinedAt`, `registeredAt`, `drawnAt`) | ISO-8601, **không** offset/timezone | `2026-10-25T11:22:38.123456` |
| Tiền (`totalPrice`, `depositPaid`, `entryFee`, `prizePool`) | Số nguyên VND | `350000` |
| Thời lượng ca (`slotDurationMinutes`) | Số nguyên phút | `60`, `90`, `120` |
| Mốc thời gian Health | Epoch milliseconds | `1761358958000` |

Giờ vàng (peak) được xác định theo **giờ bắt đầu** của ca: `17`, `18`, `19` — dùng chung một chỗ `TimeSlotUtil.isPeakStart()` (`TimeSlotUtil.java:56-65`).

Công thức doanh thu dùng chung `RevenueUtil.settledRevenue()` (`RevenueUtil.java:19-34`): `0` nếu đơn `CANCELLED`; ngược lại `depositPaid + cashCollected` (nếu `cashCollected` null thì dùng `cashDue`), chỉ cộng phần tiền mặt khi trạng thái là `PLAYING` hoặc `COMPLETED`.

### 1.6 CORS

`SecurityConfig.java:60-78`:

- Origin cho phép: biến môi trường `ALLOWED_ORIGINS`, mặc định `http://localhost:3000`, `http://localhost:3001`, `https://turfzone-wheat.vercel.app`, `https://soccer-hub-wheat.vercel.app` (phân tách bằng dấu phẩy).
- Method: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Header cho phép: `Authorization`, `Content-Type`, `X-Requested-With`; header lộ ra: `Authorization`.
- `allowCredentials = true` (vì vậy **không** được dùng `*` cho origin), `maxAge = 3600s`.
- `csrf` bị tắt, session `STATELESS`, `frameOptions` bị tắt (phục vụ H2 console).

### 1.7 Path công khai và quy tắc `@PreAuthorize`

`SecurityConfig.java:49-53` — danh sách `permitAll`:

```
"/", "/health", "/api/v1/health", "/api/v1/auth/**", "/h2-console/**", "/error",
"/api/v1/chat/files/**",
"/api/v1/pitches/**", "/api/v1/tournaments/**", "/api/v1/community/**"
```

Mọi path còn lại (`/api/v1/clubs/**`, `/api/v1/chat/**`, `/api/v1/chat-groups/**`, `/api/v1/canteen/**`, `/api/v1/notifications/**`, `/api/v1/admin/**`, `/api/v1/reports/**`) rơi vào `anyRequest().authenticated()` — **bắt buộc có token**, kể cả khi method không có `@PreAuthorize`.

Vì `/pitches/**`, `/tournaments/**`, `/community/**` được `permitAll`, các thao tác ghi ở ba nhóm này **phụ thuộc hoàn toàn vào `@PreAuthorize`** ở method. Các annotation đang dùng:

| Annotation | Ý nghĩa |
| --- | --- |
| `@PreAuthorize("isAuthenticated()")` | Chỉ cần đăng nhập, mọi vai trò |
| `@PreAuthorize("hasRole('ADMIN')")` | Chỉ ADMIN |
| `@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")` | Chủ sân hoặc ADMIN |
| `@PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")` | BTC, chủ sân hoặc ADMIN |
| `@PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")` | Như trên (thứ tự khác, cùng nghĩa) |
| `@PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")` | BTC hoặc ADMIN (nhóm email giải đấu) |

Ngoài annotation, nhiều endpoint còn kiểm tra **chủ sở hữu** trong code — kiểm tra này độc lập với vai trò, và là lớp chống IDOR chính:

- `PitchService.assertCanManage()` (`PitchService.java:65-78`): ADMIN bỏ qua; cụm sân chưa có `ownerId` thì chỉ ADMIN; ngược lại `pitch.ownerId` phải bằng `user.id`.
- `PitchBookingController.assertOwnsPitch()` (`PitchBookingController.java:1100-1112`) và `assertOwnsBooking()` (`:1081-1097`): cùng quy tắc, dùng cho đơn đặt và sân con.
- `OwnerAdminController`, `OwnerReportController`, `CanteenController`: lọc dữ liệu theo `pitchRepository.findByOwnerId(me.getId())`.
- `ClubController` / `ChatGroupController`: kiểm tra "đại diện CLB" / "thành viên nhóm" trong code, không dùng vai trò.

---

## 2. Bảng tổng hợp 131 endpoint

Đúng theo `.tmp/endpoints.txt` (method + path trích tự động từ annotation). Cột "Quyền truy cập" là quyền hiệu lực sau khi cộng `SecurityConfig` + `@PreAuthorize` + kiểm tra owner trong code.

| Method | Path | Nhóm | Quyền truy cập |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/audit-logs` | 13. Admin | ADMIN |
| GET | `/api/v1/admin/bookings` | 13. Admin | ADMIN |
| DELETE | `/api/v1/admin/maintenance/orphans` | 13. Admin | ADMIN |
| DELETE | `/api/v1/admin/matchmaking-posts/{id}` | 13. Admin | ADMIN |
| GET | `/api/v1/admin/overview` | 13. Admin | ADMIN |
| GET | `/api/v1/admin/users/legacy` | 13. Admin | ADMIN |
| DELETE | `/api/v1/admin/users/{id}` | 13. Admin | ADMIN |
| PATCH | `/api/v1/admin/users/{id}/role` | 13. Admin | ADMIN |
| PATCH | `/api/v1/admin/users/{id}/status` | 13. Admin | ADMIN |
| POST | `/api/v1/admin/bookings/{id}/cancel` | 13. Admin | ADMIN |
| GET | `/api/v1/admin/insights` | 13. Admin | ADMIN |
| GET | `/api/v1/admin/users` | 13. Admin | ADMIN |
| GET | `/api/v1/admin/users/{id}/detail` | 13. Admin | ADMIN |
| POST | `/api/v1/auth/google` | 3. Auth | Công khai |
| POST | `/api/v1/auth/login` | 3. Auth | Công khai |
| GET | `/api/v1/auth/me` | 3. Auth | Công khai ở tầng HTTP, controller trả 401 nếu thiếu token |
| PUT | `/api/v1/auth/me` | 3. Auth | Công khai ở tầng HTTP, controller trả 401 nếu thiếu token |
| POST | `/api/v1/auth/register` | 3. Auth | Công khai |
| GET | `/api/v1/canteen/items` | 12. Căn tin | OWNER, ADMIN (+ phải là chủ cụm sân khi truyền `pitchId`) |
| POST | `/api/v1/canteen/items` | 12. Căn tin | OWNER, ADMIN (+ chủ cụm sân) |
| DELETE | `/api/v1/canteen/items/{id}` | 12. Căn tin | OWNER, ADMIN (+ chủ món) |
| PUT | `/api/v1/canteen/items/{id}` | 12. Căn tin | OWNER, ADMIN (+ chủ món) |
| POST | `/api/v1/canteen/items/{id}/sell` | 12. Căn tin | OWNER, ADMIN (+ chủ món) |
| GET | `/api/v1/chat/admin/messages` | 10. Chat | ADMIN |
| DELETE | `/api/v1/chat/admin/messages/{id}` | 10. Chat | ADMIN |
| GET | `/api/v1/chat/channels` | 10. Chat | Đăng nhập |
| GET | `/api/v1/chat/conversations` | 10. Chat | Đăng nhập |
| GET | `/api/v1/chat/files/{filename:.+}` | 10. Chat | Công khai |
| GET | `/api/v1/chat/messages` | 10. Chat | Đăng nhập (theo `SecurityConfig`) |
| POST | `/api/v1/chat/messages` | 10. Chat | Đăng nhập |
| GET | `/api/v1/chat/messages/search` | 10. Chat | Đăng nhập |
| DELETE | `/api/v1/chat/messages/{id}` | 10. Chat | Đăng nhập + là tác giả tin nhắn |
| POST | `/api/v1/chat/messages/{id}/pin` | 10. Chat | Đăng nhập + là tác giả tin nhắn |
| POST | `/api/v1/chat/messages/{id}/react` | 10. Chat | Đăng nhập |
| GET | `/api/v1/chat/messages/{id}/reactions` | 10. Chat | Đăng nhập |
| POST | `/api/v1/chat/messages/{id}/read` | 10. Chat | Đăng nhập + là người nhận |
| GET | `/api/v1/chat/unread-count` | 10. Chat | Đăng nhập |
| POST | `/api/v1/chat/upload` | 10. Chat | Đăng nhập |
| GET | `/api/v1/chat/users` | 10. Chat | Đăng nhập |
| GET | `/api/v1/chat-groups` | 11. Chat nhóm | Đăng nhập (class-level) |
| POST | `/api/v1/chat-groups` | 11. Chat nhóm | Đăng nhập (class-level) |
| DELETE | `/api/v1/chat-groups/{id}` | 11. Chat nhóm | Đăng nhập + chủ nhóm |
| GET | `/api/v1/chat-groups/{id}` | 11. Chat nhóm | Đăng nhập + thành viên nhóm |
| POST | `/api/v1/chat-groups/{id}/members` | 11. Chat nhóm | Đăng nhập + chủ nhóm |
| DELETE | `/api/v1/chat-groups/{id}/members/{targetEmail}` | 11. Chat nhóm | Đăng nhập + chủ nhóm |
| GET | `/api/v1/chat-groups/{id}/messages` | 11. Chat nhóm | Đăng nhập + thành viên nhóm |
| POST | `/api/v1/chat-groups/{id}/messages` | 11. Chat nhóm | Đăng nhập + thành viên nhóm |
| POST | `/api/v1/chat-groups/{id}/read` | 11. Chat nhóm | Đăng nhập + thành viên nhóm |
| POST | `/api/v1/clubs` | 9. CLB | Đăng nhập |
| GET | `/api/v1/clubs/mine` | 9. CLB | Đăng nhập |
| DELETE | `/api/v1/clubs/{id}` | 9. CLB | Đăng nhập + đại diện CLB |
| GET | `/api/v1/clubs/{id}` | 9. CLB | Đăng nhập (theo `SecurityConfig`) |
| PUT | `/api/v1/clubs/{id}` | 9. CLB | Đăng nhập + đại diện CLB |
| POST | `/api/v1/clubs/{id}/members` | 9. CLB | Đăng nhập + đại diện CLB |
| DELETE | `/api/v1/clubs/{id}/members/{email}` | 9. CLB | Đăng nhập + đại diện CLB |
| PATCH | `/api/v1/clubs/{id}/members/{email}/representative` | 9. CLB | Đăng nhập + đại diện CLB |
| GET | `/api/v1/community/matchmaking-posts` | 8. Cộng đồng | Công khai |
| POST | `/api/v1/community/matchmaking-posts` | 8. Cộng đồng | Đăng nhập |
| POST | `/api/v1/community/matchmaking-posts/{id}/accept` | 8. Cộng đồng | Đăng nhập |
| GET | `/api/v1/community/players/leaderboard` | 8. Cộng đồng | Công khai |
| POST | `/api/v1/community/reviews` | 8. Cộng đồng | Đăng nhập |
| GET | `/api/v1/community/reviews/{teamName}` | 8. Cộng đồng | Công khai |
| GET | `/api/v1/community/urgent-market` | 8. Cộng đồng | Công khai |
| GET | `/` | 14. Health | Công khai |
| POST | `/api/v1/notifications/broadcast` | 12. Thông báo | ADMIN |
| GET | `/api/v1/notifications/mine` | 12. Thông báo | Đăng nhập (theo `SecurityConfig`) |
| DELETE | `/api/v1/notifications/{id}` | 12. Thông báo | ADMIN |
| PATCH | `/api/v1/notifications/{id}/read` | 12. Thông báo | Đăng nhập + thông báo phải dành cho mình |
| POST | `/api/v1/admin/dynamic-pricing` | 14. Báo cáo chủ sân | OWNER, ADMIN (class-level) + chủ cụm sân |
| GET | `/api/v1/admin/revenue-report` | 14. Báo cáo chủ sân | OWNER, ADMIN (class-level) |
| GET | `/api/v1/reports/bookings.csv` | 14. Báo cáo chủ sân | OWNER, ADMIN |
| GET | `/api/v1/reports/email-status` | 14. Báo cáo chủ sân | OWNER, ADMIN |
| GET | `/api/v1/reports/revenue.csv` | 14. Báo cáo chủ sân | OWNER, ADMIN |
| POST | `/api/v1/reports/send-email` | 14. Báo cáo chủ sân | OWNER, ADMIN |
| GET | `/api/v1/reports/summary.csv` | 14. Báo cáo chủ sân | OWNER, ADMIN |
| GET | `/api/v1/pitches` | 4. Sân & lịch ca | Công khai |
| POST | `/api/v1/pitches` | 4. Sân & lịch ca | OWNER, ADMIN |
| GET | `/api/v1/pitches/bookings/search` | 5. Đặt sân & vé | Đăng nhập |
| DELETE | `/api/v1/pitches/bookings/{bookingId}` | 5. Đặt sân & vé | OWNER, ADMIN + chủ sân của đơn |
| POST | `/api/v1/pitches/bookings/{bookingId}/cancel` | 5. Đặt sân & vé | OWNER, ADMIN + chủ sân của đơn |
| POST | `/api/v1/pitches/bookings/{bookingId}/cancel-by-customer` | 5. Đặt sân & vé | Đăng nhập + SĐT trùng SĐT trên đơn |
| PUT | `/api/v1/pitches/bookings/{bookingId}/check-in` | 5. Đặt sân & vé | OWNER, ADMIN + chủ sân của đơn |
| DELETE | `/api/v1/pitches/clear-all` | 4. Sân & lịch ca | ADMIN |
| GET | `/api/v1/pitches/my-pitches` | 4. Sân & lịch ca | Đăng nhập (controller trả 401 nếu thiếu token) |
| DELETE | `/api/v1/pitches/simulate-bookings` | 4. Sân & lịch ca | ADMIN, OWNER |
| POST | `/api/v1/pitches/simulate-bookings` | 4. Sân & lịch ca | ADMIN, OWNER |
| DELETE | `/api/v1/pitches/{id}` | 4. Sân & lịch ca | OWNER, ADMIN + chủ cụm sân |
| GET | `/api/v1/pitches/{id}` | 4. Sân & lịch ca | Công khai |
| PUT | `/api/v1/pitches/{id}` | 4. Sân & lịch ca | OWNER, ADMIN + chủ cụm sân |
| POST | `/api/v1/pitches/{id}/add-court` | 4. Sân & lịch ca | OWNER, ADMIN + chủ cụm sân |
| POST | `/api/v1/pitches/{id}/book` | 5. Đặt sân & vé | Đăng nhập |
| POST | `/api/v1/pitches/{id}/book-offline` | 5. Đặt sân & vé | Đăng nhập + chủ cụm sân (hoặc ADMIN) |
| GET | `/api/v1/pitches/{id}/bookings` | 5. Đặt sân & vé | Đăng nhập (che PII nếu không phải chủ sân/ADMIN) |
| GET | `/api/v1/pitches/{id}/matrix` | 4. Sân & lịch ca | Công khai (che PII) |
| PUT | `/api/v1/pitches/{id}/operating-hours` | 4. Sân & lịch ca | OWNER, ADMIN + chủ cụm sân |
| PUT | `/api/v1/pitches/{id}/price` | 4. Sân & lịch ca | OWNER, ADMIN + chủ cụm sân |
| GET | `/api/v1/pitches/{id}/stats` | 4. Sân & lịch ca | Công khai (ẩn `totalRevenue` nếu không phải chủ sân/ADMIN) |
| GET | `/api/v1/tournaments` | 6. Giải đấu | Công khai (che PII) |
| POST | `/api/v1/tournaments` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/scorers/top` | 6. Giải đấu | Công khai |
| DELETE | `/api/v1/tournaments/{id}` | 6. Giải đấu | ADMIN |
| GET | `/api/v1/tournaments/{id}` | 6. Giải đấu | Công khai (che PII) |
| PUT | `/api/v1/tournaments/{id}` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/{id}/access` | 6. Giải đấu | Công khai (ẩn danh sách email mời) |
| PUT | `/api/v1/tournaments/{id}/access` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/{id}/bracket` | 6. Giải đấu | Công khai |
| POST | `/api/v1/tournaments/{id}/draw` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/fill-teams` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/{id}/finance` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/invites` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| DELETE | `/api/v1/tournaments/{id}/invites/{email}` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/matches` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| DELETE | `/api/v1/tournaments/{id}/matches/{matchId}` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/{id}/referees` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/referees` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| DELETE | `/api/v1/tournaments/{id}/referees/{refId}` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/register` | 6. Giải đấu | Đăng nhập |
| POST | `/api/v1/tournaments/{id}/schedule` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/{id}/scorers` | 6. Giải đấu | Công khai |
| POST | `/api/v1/tournaments/{id}/simulate-results` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| DELETE | `/api/v1/tournaments/{id}/simulated-teams` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| PATCH | `/api/v1/tournaments/{id}/status` | 6. Giải đấu | ADMIN |
| POST | `/api/v1/tournaments/{id}/teams/confirm-payment` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/teams/manual` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| GET | `/api/v1/tournaments/{id}/teams/pending` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/teams/{teamName}/approve` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/teams/{teamName}/reject` | 6. Giải đấu | ORGANIZER, OWNER, ADMIN |
| POST | `/api/v1/tournaments/{id}/notify-schedule` | 7. Báo cáo & email giải | ORGANIZER, ADMIN |
| POST | `/api/v1/tournaments/{id}/notify-team/approve` | 7. Báo cáo & email giải | ORGANIZER, ADMIN |
| POST | `/api/v1/tournaments/{id}/notify-team/reject` | 7. Báo cáo & email giải | ORGANIZER, ADMIN |
| GET | `/api/v1/tournaments/{id}/report.csv` | 7. Báo cáo & email giải | ORGANIZER, ADMIN |

> [!NOTE]
> Bảy endpoint khai báo bằng `@GetMapping` / `@PostMapping` trần (không có path) trong danh sách trên: `GET`+`POST /api/v1/pitches`, `GET`+`POST /api/v1/tournaments`, `GET`+`POST /api/v1/chat-groups`, `POST /api/v1/clubs`. Chúng nằm đúng ở path gốc của controller, không phải `/api/v1/pitches/` hay `/api/v1/tournaments/...` khác.

---

## 3. Auth & hồ sơ

`AuthController.java` — prefix `/api/v1/auth` (toàn bộ nhóm này `permitAll`).

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Công khai | Đăng ký tài khoản mới, trả JWT |
| POST | `/api/v1/auth/login` | Công khai | Đăng nhập bằng email hoặc số điện thoại |
| POST | `/api/v1/auth/google` | Công khai | Đăng nhập bằng Google ID token |
| GET | `/api/v1/auth/me` | Token (controller tự kiểm tra) | Lấy hồ sơ người đang đăng nhập |
| PUT | `/api/v1/auth/me` | Token (controller tự kiểm tra) | Cập nhật hồ sơ |

### 3.1 `POST /api/v1/auth/register`

Body — `RegisterRequest`: `fullName`, `email`, `password`, `phone`, `role`, `position`, `area`, `favoriteSport`, `level`.

Logic đáng chú ý (`AuthService.register`, `AuthService.java:30-109`):

- `fullName` bắt buộc. Định danh đăng nhập nhận **email hoặc số điện thoại** trong field `email`:
  - Nếu khớp `EMAIL_PATTERN` → dùng email (lowercase).
  - Nếu khớp `PHONE_PATTERN` → `email = "<phone>@phone.Turfzone.vn"`.
  - Không khớp cả hai → `400` `{"message": "Định dạng không hợp lệ. ..."}`.
- `password` phải ≥ 6 ký tự, ngược lại `400` `{"message": "Mật khẩu quá ngắn. ..."}`.
- Trùng email/SĐT → `400` kèm gợi ý chuyển sang tab đăng nhập.
- **`role` trong body bị bỏ qua hoàn toàn** — luôn tạo `PLAYER` (`AuthService.java:81`). `position` mặc định `"Cầu Thủ Pro"`, `favoriteSport` mặc định `"football"`, `level` mặc định `"Nghiệp dư"`, `avatar` là chữ viết tắt của họ tên, `profileCompleted = false`.
- Thành công: `201 Created`, body `AuthResponse`:

```json
{ "token": "<JWT>", "tokenType": "Bearer",
  "user": { "id": 42, "fullName": "...", "email": "...", "phone": "...", "role": "PLAYER", "avatar": "NA",
            "isClubRep": false, "profileCompleted": false, "token": null },
  "message": "Đăng ký tài khoản Turfzone cho '...' thành công!" }
```

Lỗi hệ thống không mong đợi → `500` `{"message": "Đã xảy ra lỗi hệ thống: ..."}`.

### 3.2 `POST /api/v1/auth/login`

Body — `LoginRequest`: `email`, `password`. Field `email` chấp nhận **cả email lẫn số điện thoại**; server tra lần lượt `findByEmail(lowercase)` → `findByPhone(raw)` → `findByEmail(raw + "@phone.Turfzone.vn")` (`AuthService.java:123-125`).

- Sai tài khoản/mật khẩu → `400` với **một thông báo chung** `"Email hoặc số điện thoại không đúng, hoặc mật khẩu chưa chính xác."` (cố ý không phân biệt để chống dò tài khoản).
- Tài khoản bị khóa → `400` `"Tài khoản đã bị quản trị viên khóa. ..."`.
- **Chống brute-force**: đếm số lần sai theo khóa `email|IP` (IP lấy từ `X-Forwarded-For`, fallback `RemoteAddr`) trong cửa sổ 5 phút; sai quá 5 lần → `429` `{"message": "Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút."}` (`AuthController.java:35-110`). Bộ đếm nằm trong `ConcurrentHashMap` của tiến trình — reset khi restart và không chia sẻ giữa nhiều instance.
- Thành công: `200` cùng cấu trúc `AuthResponse` như đăng ký.

### 3.3 `POST /api/v1/auth/google`

Body `{"idToken": "<Google ID token>"}`. Thiếu token → `400` `{"message": "Thiếu ID token Google."}`. Server xác thực qua `GoogleAuthService.verify()` (cần biến `GOOGLE_CLIENT_ID`; để trống thì tính năng tắt và verify sẽ lỗi) rồi `findOrCreateUser`.

Response **khác** đăng ký/đăng nhập: không có `tokenType`, gồm `token`, `user`, `message` (`AuthController.java:126-129`).

### 3.4 `GET /api/v1/auth/me` và `PUT /api/v1/auth/me`

- `GET`: trả `UserDto` của người đang đăng nhập. Không có token → `401` `{"message": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."}` (vì path `permitAll` nên controller tự kiểm tra `currentUser == null`).
- `PUT`: body — `UpdateProfileRequest`: `fullName`, `email`, `phone`, `position`, `area`, `favoriteSport`, `level`, `avatar`, `dominantFoot`, `jerseyNumber`, `height`, `weight`, `preferredTime`, `currentClub`, `profileCompleted`.
  - Field `null` = giữ nguyên; chuỗi rỗng ở các chỉ số cầu thủ = xóa để trống.
  - **Đổi email**: kiểm tra định dạng + chống trùng, ghi email mới, và trả thêm `token` mới ngay trong `UserDto` (token cũ gắn `subject = email` cũ nên mất hiệu lực). Client phải thay token nếu response có field `token` (`AuthService.java:238-242`).
  - Đổi `fullName` khi role là `OWNER` sẽ đồng bộ `ownerName` cho toàn bộ cụm sân của chủ sân đó (`AuthService.java:226-235`).
  - `profileCompleted` chỉ được bật (`true`), không nhận `false`.
  - Lỗi nghiệp vụ → `400` `{"message": ...}`; lỗi khác → `500`.

`UserDto` — các field JSON trả về: `id`, `fullName`, `email`, `phone`, `role`, `position`, `area`, `favoriteSport`, `level`, `avatar`, `dominantFoot`, `jerseyNumber`, `height`, `weight`, `preferredTime`, `currentClub`, `isClubRep`, `profileCompleted`, `token` (null trừ khi vừa đổi email).

> [!NOTE]
> Trong `AuthService.updateUserProfile`, khối gán `profileCompleted` bị lồng **bên trong** `if (req.getArea() != null)` (`AuthService.java:196-202`). Hệ quả: client gửi `profileCompleted: true` mà không gửi `area` thì cờ này **không** được lưu. Đây là lỗi thụt lề trong mã nguồn, cần sửa trước khi nghiệm thu luồng onboarding.

---

## 4. Sân & lịch ca

`PitchBookingController.java` — prefix `/api/v1/pitches` (`permitAll`, nên quyền ghi do `@PreAuthorize` quyết định).

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/pitches` | Công khai | Danh sách toàn bộ cụm sân |
| POST | `/api/v1/pitches` | OWNER, ADMIN | Tạo cụm sân mới |
| GET | `/api/v1/pitches/my-pitches` | Đăng nhập | Các cụm sân tôi sở hữu |
| GET | `/api/v1/pitches/{id}` | Công khai | Chi tiết một cụm sân |
| PUT | `/api/v1/pitches/{id}` | OWNER, ADMIN + chủ sân | Cập nhật hồ sơ cụm sân |
| DELETE | `/api/v1/pitches/{id}` | OWNER, ADMIN + chủ sân | Xóa cụm sân |
| POST | `/api/v1/pitches/{id}/add-court` | OWNER, ADMIN + chủ sân | Thêm sân con vào cụm |
| PUT | `/api/v1/pitches/{id}/operating-hours` | OWNER, ADMIN + chủ sân | Đổi giờ mở/đóng cửa và độ dài ca |
| PUT | `/api/v1/pitches/{id}/price` | OWNER, ADMIN + chủ sân | Đổi giá thường / giá giờ vàng |
| GET | `/api/v1/pitches/{id}/matrix` | Công khai | Ma trận ca sân theo ngày |
| GET | `/api/v1/pitches/{id}/stats` | Công khai | Thống kê doanh thu & công suất trong ngày |
| DELETE | `/api/v1/pitches/clear-all` | ADMIN | Xóa toàn bộ cụm sân |
| POST | `/api/v1/pitches/simulate-bookings` | ADMIN, OWNER | Sinh đơn đặt giả lập |
| DELETE | `/api/v1/pitches/simulate-bookings` | ADMIN, OWNER | Xóa đơn giả lập |

### 4.1 `GET /api/v1/pitches`

Trả `List<Pitch>` — **entity đầy đủ**, không phân trang, không lọc. Field: `id`, `name`, `address`, `area`, `phone`, `bankCode`, `bankAccount`, `accountName`, `ownerId`, `ownerName`, `latitude`, `longitude`, `avgPricePerHour`, `peakPricePerHour`, `rating`, `openTime`, `closeTime`, `slotDurationMinutes`, `pitchTypes[]`, `amenities[]`, `courtBasePrices{}`, `courtPeakPrices{}`, `imageUrl`, `description`, `createdAt`, `updatedAt`.

> [!NOTE]
> Vì trả nguyên entity, endpoint công khai này cũng lộ `bankCode`/`bankAccount`/`accountName` của chủ sân. Nếu cần che, phải tạo DTO chứ không thể dựa vào tầng bảo mật.

### 4.2 `POST /api/v1/pitches`

`@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")`. Body — `CreatePitchRequest`:

| Field | Bắt buộc | Mặc định nếu thiếu |
| --- | --- | --- |
| `name` | Có | — (`400` `"Vui lòng nhập tên cụm sân bóng đá."`) |
| `address` | Có | — (`400` `"Vui lòng nhập địa chỉ cụm sân."`) |
| `area`, `phone`, `latitude`, `longitude`, `description` | Không | `phone` lấy từ hồ sơ chủ sân |
| `avgPricePerHour` | Không | `350000` |
| `peakPricePerHour` | Không | `450000` |
| `openTime` / `closeTime` | Không | `"14:00"` / `"22:30"` |
| `slotDurationMinutes` | Không | `120` |
| `pitchTypes[]`, `amenities[]` | Không | mảng rỗng |
| `imageUrl` | Không | URL ảnh Unsplash mặc định |

Response `201 Created` + entity `Pitch` vừa tạo. Sau khi tạo, nếu `profileCompleted` của chủ sân đang `false`/`null`, server bật thành `true` (`PitchBookingController.java:60-63`).

### 4.3 `PUT /api/v1/pitches/{id}` — hồ sơ cụm sân

Quyền: `hasAnyRole('OWNER','ADMIN')` **và** `PitchService.assertCanManage()` → chủ sân khác nhận `400 {"message": "Bạn không phải chủ sân của cụm sân này."}`.

Body đọc từng key (`PitchService.updatePitchInfo`, `PitchService.java:125-165`): `name`, `address`, `area`, `phone`, `bankCode`, `bankAccount`, `accountName`, `description`, `imageUrl`, `latitude`, `longitude`, `pitchTypes[]`, `amenities[]`.

- Chỉ field **có mặt** trong body mới được ghi; `pitchTypes`/`amenities` gửi mảng rỗng bị **bỏ qua** (tránh xóa trắng do client chưa chọn).
- `name`/`address` rỗng → `400`.
- Response: `{"message": "Đã cập nhật hồ sơ cụm sân.", "pitch": {...}}`.

### 4.4 `PUT /api/v1/pitches/{id}/operating-hours`

Body: `openTime`, `closeTime`, `slotDurationMinutes` (thiếu `slotDurationMinutes` → **giữ nguyên** thời lượng hiện tại, không mặc định 90).

Response:

```json
{
  "message": "Cập nhật thời gian hoạt động của cụm sân thành công!",
  "openTime": "14:00", "closeTime": "22:30", "slotDurationMinutes": 90,
  "generatedSlots": ["14:00 - 15:30", "15:30 - 17:00"]
}
```

`generatedSlots` sinh theo đúng `slotDurationMinutes` vừa lưu; nếu giờ không parse được, fallback 4 ca 2 giờ `14:00 - 16:00 … 20:00 - 22:00`.

### 4.5 `PUT /api/v1/pitches/{id}/price`

Body: `avgPricePerHour`, `peakPricePerHour`. Giá `<= 0` bị bỏ qua (giữ nguyên). Sau khi gán, nếu `peakPricePerHour < avgPricePerHour` → `400 {"message": "Giá giờ vàng phải lớn hơn hoặc bằng giá thường."}` (`PitchService.java:110-113`). Response: `{"message": "Đã cập nhật giá sân thành công.", "pitch": {...}}`.

### 4.6 `GET /api/v1/pitches/{id}/matrix`

Query param: `date` (`yyyy-MM-dd`, mặc định hôm nay), `duration` (phút, mặc định `pitch.slotDurationMinutes` hoặc 120).

Response là **mảng các sân con**:

```json
[{ "pitchId": "court-7-0", "pitchName": "Sân 7A Cỏ Nhân Tạo", "type": "Sân 7 Người",
   "basePrice": 350000, "peakPrice": 500000, "status": "ACTIVE",
   "slots": [{ "id": "booking-123", "time": "18:00 - 20:00", "durationMinutes": 120,
               "bookingId": 123, "bookingTimeSlot": "18:00 - 20:00", "isContinuation": false,
               "status": "booked", "customer": "N*** A", "phone": "0912****678",
               "via": "Đặt qua Website", "code": "VS-7-A1B2C3", "price": "700k", "priceValue": 700000,
               "depositPaid": "350k", "cashDue": "350k", "note": "Đơn chính (18:00 - 20:00)" }] }]
```

Quy tắc nghiệp vụ quan trọng:

- `type` suy ra từ tên sân con: chứa `"7"` → `Sân 7 Người`, chứa `"5"` → `Sân 5 Người`, chứa `"11"` → `Sân 11`, còn lại `Sân Tiêu Chuẩn` (`PitchBookingController.java:309-312`).
- Giá sân con: ưu tiên `courtBasePrices`/`courtPeakPrices` do chủ sân khai; nếu không có thì hệ số `Sân 11 ×2`, `Sân 7 ×1`, `Sân 5 ×0.75` trên giá cụm (`:315-325`).
- Đơn `CANCELLED` **không** chiếm ca (`:301-303`).
- Ca bị đặt một phần vẫn sinh **ca lọt khe** (`isGapSlot: true`, `id` dạng `gap-{pitchId}-{courtIdx}-{phútBắtĐầu}`, `via` = `"⚡ Ca Lọt Khe (Tận dụng giờ trống)"`) cho các khoảng trống ≥ 60 phút (`:393-488`). Toàn bộ slot được sắp theo giờ bắt đầu.
- **Che PII**: chỉ chủ sân của cụm (hoặc ADMIN) thấy `customer`/`phone` thật; người khác nhận `maskName`/`maskPhone` (`:350-354`, `:534-544`, `:750-755`).
- `price` là chuỗi đã chia 1000 kèm `"k"`; `priceValue` là số chính xác để FE tính tiền.

> [!NOTE]
> Nếu `pitchTypes` rỗng, endpoint này **tự tạo và lưu** hai sân con mặc định `"Sân 7A Cỏ Nhân Tạo"`, `"Sân 5B Futsal"` (`:282-286`). Một request `GET` có tác dụng phụ ghi DB — cần biết khi debug dữ liệu.

### 4.7 `GET /api/v1/pitches/{id}/stats`

Query: `date`. Response (Map):

`pitchId`, `pitchName`, `date`, `totalRevenue` (**chỉ** chủ sân/ADMIN), `occupancyRate` (%), `totalSlots`, `bookedSlots`, `onlineBookings`, `counterBookings`, `cancelledBookings`, `openTime`, `closeTime`, `slotDurationMinutes`, `hourlyBookings: [{ "hour": 18, "count": 3 }]`.

- `totalSlots = số sân con × số ca/ngày`; `occupancyRate = round(bookedSlots × 100 / totalSlots)`.
- Phân loại kênh: `via` chứa `"Website"`/`"VietQR"`/`"Online"`/`"MoMo"` → `onlineBookings`, còn lại → `counterBookings`.
- Đơn `CANCELLED` bị loại khỏi doanh thu và công suất, nhưng vẫn đếm ở `cancelledBookings`.

### 4.8 `POST /api/v1/pitches/{id}/add-court`

Body `{"courtName": "...", "basePrice": 400000, "peakPrice": 600000}` (`basePrice`/`peakPrice` không bắt buộc).

- `courtName` rỗng → `400`; trùng tên sân con đã có → `400` `"Sân con này đã tồn tại trong cụm sân."`.
- Response: `{"message": "Thêm sân con mới thành công!", "pitchTypes": [...]}`.
- Giá riêng của sân con được ghi vào `courtBasePrices` / `courtPeakPrices` (map theo tên sân con).

### 4.9 `DELETE /api/v1/pitches/clear-all` và `POST|DELETE /api/v1/pitches/simulate-bookings`

`DELETE /clear-all` (`hasRole('ADMIN')`) gọi `pitchRepository.deleteAll()`, trả `{"message": "Đã xóa tất cả dữ liệu sân bóng mẫu thành công."}`.

> [!WARNING]
> `DELETE /api/v1/pitches/clear-all` xóa **toàn bộ** cụm sân trong hệ thống, không thể hoàn tác, và **không** xóa đơn đặt sân tương ứng. Các đơn còn lại trở thành "mồ côi": vẫn được cộng vào `totalRevenue` của `GET /api/v1/admin/overview` (hàm này cộng doanh thu của mọi booking, không kiểm tra `pitchId` còn tồn tại — `AdminController.java:74-76`).

`POST /simulate-bookings` — query: `pitchId` (tùy chọn), `pastDays` (mặc định 14, kẹp 0–60), `futureDays` (7, kẹp 0–60), `perDay` (5, kẹp 1–30). Chủ sân chỉ sinh được trên cụm sân của mình (`assertOwnsPitch`); ADMIN sinh được mọi cụm. Đơn sinh ra có mã `SIM-{pitchId}-{5 chữ số}` và trạng thái ngẫu nhiên (`COMPLETED`/`PLAYING`/`BOOKED`/`CANCELLED`). Response: `created`, `pitches`, `pastDays`, `futureDays`, `perDay`, `settledRevenue`, `message`.

`DELETE /simulate-bookings` — xóa các booking có `code` bắt đầu bằng `SIM-`; chủ sân chỉ xóa được của cụm sân mình. Response: `{"deleted": 120, "message": "Đã xóa 120 đơn giả lập."}`.

> [!WARNING]
> Hai endpoint `simulate-bookings` ghi/xóa hàng loạt đơn đặt sân thật trong bảng `bookings` (chỉ khác ở tiền tố `SIM-`). Chúng **không** bị giới hạn ở môi trường dev/demo và không có cờ cấu hình tắt. Trên môi trường production phải chặn ở gateway hoặc bỏ annotation trước khi bàn giao.

### 4.10 `GET /api/v1/pitches/my-pitches`, `GET /api/v1/pitches/{id}`, `DELETE /api/v1/pitches/{id}`

- `my-pitches`: trả các `Pitch` có `ownerId = currentUser.id`; không token → `401` `{"message": "Vui lòng đăng nhập với tài khoản Chủ Sân."}`. Không kiểm tra role — `PLAYER` gọi sẽ nhận mảng rỗng.
- `GET /{id}`: không tồn tại → `404` `{"message": "Không tìm thấy cụm sân bóng đá với mã ID: <id>"}`.
- `DELETE /{id}`: `hasAnyRole('OWNER','ADMIN')` + `assertCanManage`; **chỉ xóa bản ghi cụm sân**, đơn đặt sân của cụm đó vẫn còn trong DB. Response `{"message": "Đã xóa cụm sân thành công."}`.

---

## 5. Đặt sân & vé

Cùng controller `PitchBookingController.java`, prefix `/api/v1/pitches`.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| POST | `/api/v1/pitches/{id}/book` | Đăng nhập | Khách đặt sân trực tuyến |
| POST | `/api/v1/pitches/{id}/book-offline` | Đăng nhập + chủ sân | Chủ sân tạo đơn tại quầy |
| GET | `/api/v1/pitches/{id}/bookings` | Đăng nhập | Danh sách đơn trong ngày của cụm sân |
| GET | `/api/v1/pitches/bookings/search` | Đăng nhập | Tra cứu đơn theo mã vé / SĐT |
| DELETE | `/api/v1/pitches/bookings/{bookingId}` | OWNER, ADMIN + chủ sân | Hủy đơn (giữ bản ghi) |
| POST | `/api/v1/pitches/bookings/{bookingId}/cancel` | OWNER, ADMIN + chủ sân | Hủy đơn kèm lý do, thông báo khách |
| POST | `/api/v1/pitches/bookings/{bookingId}/cancel-by-customer` | Đăng nhập + chủ vé | Khách tự hủy vé của mình |
| PUT | `/api/v1/pitches/bookings/{bookingId}/check-in` | OWNER, ADMIN + chủ sân | Check-in khách vào sân |

Trạng thái đơn (`Booking.status`): `BOOKED` → `PLAYING` (check-in) → `COMPLETED`; hoặc `CANCELLED`. Ngoài ra model có giá trị `RESALE` nhưng không endpoint nào ghi giá trị này.

### 5.1 `POST /api/v1/pitches/{id}/book`

Body (Map):

| Field | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `courtName` | Có | Phải **thuộc** `pitch.pitchTypes` |
| `timeSlot` | Có* | `"HH:mm - HH:mm"`, phải nằm trong giờ mở cửa. *Không bắt buộc khi `fullDay=true` |
| `fullDay` | Không | `true` = CLB bao trọn sân con cả ngày (giờ mở → giờ đóng cửa). Server tự tính `timeSlot` và tổng giá = tổng tất cả ca chuẩn trong ngày |
| `isClubBooking` | Không | `true` = đơn đặt dưới danh nghĩa CLB (ma trận hiển thị "Bao Sân") |
| `clubName` | Không | Tên CLB/đội bóng; mặc định `"CLB Cầu Thủ"` nếu `isClubBooking=true` mà bỏ trống |
| `customerName` | Có | |
| `customerPhone` | Có | Dùng để tra email gửi thông báo |
| `bookingDate` | Không | Mặc định hôm nay; không nhận ngày đã qua |
| `courtType` | Không | Mặc định `"Sân 7"` |
| `depositPercent` | Không | Chỉ nhận `50` hoặc `100`, giá trị khác quy về `50` |
| `via` | Không | Mặc định `"Đặt qua Website"` |

Server **luôn tự tính** `totalPrice` (`computeSlotPrice`), `depositPaid` (`computeDeposit`) và `cashDue = totalPrice - depositPaid`; client không thể gửi giá. Với `fullDay=true`, `totalPrice` = tổng giá **tất cả** ca chuẩn trong ngày (ca thường + ca vàng), khớp đúng bảng giá ma trận.

Các bước kiểm tra theo thứ tự (`PitchBookingController.java:827-915`):

1. Thiếu field bắt buộc → `400` `"Vui lòng nhập đầy đủ thông tin đặt sân."`
2. Khóa dòng sân `SELECT ... FOR UPDATE` (`pitchRepository.findByIdForUpdate`) để chống bán trùng ca khi 2 request đồng thời.
3. Sân con không thuộc cụm → `400` `"Sân con không thuộc cụm sân này. ..."`.
4. Ngày đã qua/sai định dạng → `400` `"Ngày đặt không hợp lệ hoặc đã qua. ..."`.
5. Ngoài giờ mở cửa → `400` `"Khung giờ nằm ngoài giờ mở cửa của cụm sân (open - close)."`.
6. Trùng giờ (overlap với đơn khác cùng sân con; đơn `CANCELLED` được bỏ qua vì ca đã trống lại) → `400` `"Khung giờ này đã có đội đặt hoặc bị trùng giờ với một ca thi đấu khác! Vui lòng chọn giờ khác."`
7. Vi phạm ràng buộc unique khi lưu → `400` `"Khung giờ này vừa được đặt. Vui lòng chọn giờ khác."`

Thành công: `201 Created` + entity `Booking` (field: `id`, `pitchId`, `courtName`, `courtType`, `bookingDate`, `timeSlot`, `customerName`, `customerPhone`, `totalPrice`, `depositPaid`, `cashDue`, `cashCollected`, `status`, `via`, `code`, `cancelReason`, `cancelledBy`, `createdAt`, `updatedAt`).

Mã vé sinh tự động: `VS-{pitchId}-{6 ký tự hex ngẫu nhiên in hoa}` (ví dụ `VS-7-A1B2C3`), cột `code` là unique.

> [!NOTE]
> `POST /book` **không** gửi email/thông báo (hàm `sendBookingEmails` chỉ được gọi trong luồng `book-offline`). Ngoài ra endpoint chỉ yêu cầu đăng nhập, không đối chiếu `customerPhone` với SĐT của tài khoản — bất kỳ tài khoản nào cũng đặt được với tên/SĐT bất kỳ.

### 5.2 `POST /api/v1/pitches/{id}/book-offline`

Alias thứ hai: `POST /api/v1/pitches/{id}/offline-book` (`@PostMapping(value = {"/{id}/book-offline", "/{id}/offline-book"})`).

Body giống `book`, thêm `courtType`, `via` (mặc định `"Tạo Tại Quầy"`). Khác biệt:

- Bắt buộc người gọi là chủ cụm sân hoặc ADMIN (`assertOwnsPitch`) — chủ sân khác nhận `400` `"Bạn không phải chủ sân của cụm sân này."`.
- Sau khi lưu: gửi notification cho **chính chủ sân** (`targetEmail = email chủ sân`, type `BOOKING`), rồi gửi email xác nhận cho khách + email báo chủ sân trong một thread nền (`sendBookingEmails`). Lỗi email không làm hỏng việc tạo đơn.
- Thành công: `201 Created` + entity `Booking`.

### 5.3 `GET /api/v1/pitches/{id}/bookings`

Query `date` (mặc định hôm nay). Chỉ yêu cầu đăng nhập, nhưng nội dung phụ thuộc người gọi:

- ADMIN hoặc chủ sân của chính cụm sân: trả **đầy đủ** gồm `customerPhone`, `cancelReason`, `cancelledBy`.
- Người khác: trả bản đã che — `customerName` dạng `"N*** A"`, `customerPhone` dạng `"0912****678"`; **không** có `cancelReason`/`cancelledBy`.

Field trả về: `id`, `pitchId`, `courtName`, `courtType`, `bookingDate`, `timeSlot`, `customerName`, `customerPhone`, `status`, `via`, `code`, `createdAt` (+ 3 field trên nếu có quyền).

### 5.4 `GET /api/v1/pitches/bookings/search`

Query bắt buộc `query` — tra theo **mã vé chính xác** trước, nếu không thấy thì tìm gần đúng theo SĐT (`findByCustomerPhoneContaining`). Trả `List<Booking>` (entity thô).

Phạm vi kết quả (`PitchBookingController.java:1405-1430`): ADMIN thấy tất cả; chủ sân thấy đơn thuộc cụm sân mình; người dùng thường chỉ thấy đơn có `customerPhone` trùng SĐT trong hồ sơ của mình. Query rỗng → `400` `"Vui lòng nhập mã vé hoặc số điện thoại."`

### 5.5 Ba cách hủy đơn

| Endpoint | Điều kiện | `cancelledBy` | Ghi chú |
| --- | --- | --- | --- |
| `DELETE /bookings/{bookingId}` | OWNER/ADMIN + chủ sân của đơn | `"OWNER"` (luôn) | Query `reason` tùy chọn, mặc định `"Chủ sân hủy ca đặt"` |
| `POST /bookings/{bookingId}/cancel` | OWNER/ADMIN + chủ sân của đơn | `"ADMIN"` nếu người gọi là ADMIN, ngược lại `"OWNER"` | Body `{"reason": "..."}` tùy chọn |
| `POST /bookings/{bookingId}/cancel-by-customer` | Đăng nhập + SĐT hồ sơ trùng SĐT trên đơn | `"CUSTOMER"` | Không hủy được vé đã hủy / đã bắt đầu / ngày đã qua |

Cả ba đều **giữ bản ghi** ở trạng thái `CANCELLED` (không xóa cứng) để khách xem lịch sử và chủ sân đối chiếu cọc; ca lập tức trống lại vì ma trận/thống kê lọc `CANCELLED`.

- `DELETE`: response `{"message", "bookingId", "customerName", "cancelReason"}`. Không yêu cầu body.
- `cancel`: response đầy đủ `{"message", "bookingId", "code", "customerName", "customerPhone", "courtName", "timeSlot", "bookingDate", "cancelReason", "cancelledBy", "refundDeposit", "notified"}`. `refundDeposit` = `depositPaid` hiện tại; `notified = true` khi tra được email khách từ SĐT.
- `cancel-by-customer`:
  - Hồ sơ chưa có SĐT → `400` `"Tài khoản của bạn chưa có số điện thoại nên không tự hủy được. ..."`.
  - SĐT không khớp → `403` `"Bạn chỉ có thể hủy vé đặt bằng chính số điện thoại của mình."`.
  - Vé đã hủy → `400` `"Vé này đã được hủy trước đó."`; trạng thái `PLAYING`/`COMPLETED` → `400` `"Ca đã bắt đầu hoặc đã diễn ra nên không thể tự hủy. ..."`; ngày đã qua → `400` `"Ca đã qua không thể tự hủy trực tuyến. ..."`.
  - Response `{"message", "bookingId", "code", "refundDeposit"}`.
- Không tìm thấy đơn ở cả ba → `404` `{"message": "Không tìm thấy đơn đặt này."}` (riêng `cancel-by-customer`: `"Không tìm thấy vé đặt này."`).

> [!WARNING]
> Trong `cancel-by-customer`, biến `cancelOwnerEmail` được tính (dòng 1325-1332) nhưng **không được dùng**: lời gọi `notificationService.notify("OWNER", "Khách hủy ca: ...", ...)` truyền `targetEmail = null` (`PitchBookingController.java:1334-1338`). Hệ quả: thông báo chứa **tên và số điện thoại đầy đủ của khách** được phát cho **mọi** tài khoản OWNER, trái với comment ngay trên đó. Cần sửa thành `notify("OWNER", cancelOwnerEmail, ...)`.

### 5.6 `PUT /api/v1/pitches/bookings/{bookingId}/check-in`

- Đơn không tồn tại → `404`; không phải chủ sân của đơn → `400` `"Bạn không phải chủ sân của đơn đặt này."`; đơn `CANCELLED` → `400` `"Đơn này đã hủy, không thể check-in."`.
- Hiệu ứng: `status = "PLAYING"`, `cashCollected = cashDue` (giữ lại tiền mặt đã thu), `cashDue = 0`.
- Response: `{"message": "Check-in thành công! Khách đã vào sân.", "booking": {...}}`.

---

## 6. Giải đấu

`TournamentController.java` — prefix `/api/v1/tournaments` (`permitAll`; quyền ghi theo `@PreAuthorize`).

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/tournaments` | Công khai | Danh sách giải (đã che PII) |
| POST | `/api/v1/tournaments` | ORGANIZER, OWNER, ADMIN | Tạo giải |
| GET | `/api/v1/tournaments/{id}` | Công khai | Chi tiết giải (đã che PII) |
| PUT | `/api/v1/tournaments/{id}` | ORGANIZER, OWNER, ADMIN | Sửa thông tin giải |
| PATCH | `/api/v1/tournaments/{id}/status` | ADMIN | Đổi trạng thái giải |
| DELETE | `/api/v1/tournaments/{id}` | ADMIN | Xóa giải + kết quả + bàn thắng |
| GET | `/api/v1/tournaments/{id}/finance` | ORGANIZER, OWNER, ADMIN | Thống kê tài chính giải |
| POST | `/api/v1/tournaments/{id}/fill-teams` | ORGANIZER, OWNER, ADMIN | Giả lập đủ đội (demo) |
| POST | `/api/v1/tournaments/{id}/draw` | ORGANIZER, OWNER, ADMIN | Bốc thăm / xếp lịch vòng tròn |
| DELETE | `/api/v1/tournaments/{id}/simulated-teams` | ORGANIZER, OWNER, ADMIN | Xóa đội giả lập |
| POST | `/api/v1/tournaments/{id}/matches` | ORGANIZER, OWNER, ADMIN | Nhập kết quả một trận |
| DELETE | `/api/v1/tournaments/{id}/matches/{matchId}` | ORGANIZER, OWNER, ADMIN | Hủy kết quả một trận |
| POST | `/api/v1/tournaments/{id}/simulate-results` | ORGANIZER, OWNER, ADMIN | Giả lập kết quả toàn giải (demo) |
| GET | `/api/v1/tournaments/{id}/scorers` | Công khai | BXH vua phá lưới của giải |
| GET | `/api/v1/tournaments/scorers/top` | Công khai | Top vua phá lưới toàn hệ thống |
| POST | `/api/v1/tournaments/{id}/schedule` | ORGANIZER, OWNER, ADMIN | Xếp ngày/giờ/sân cho các trận |
| GET | `/api/v1/tournaments/{id}/bracket` | Công khai | Nhánh đấu đã bốc thăm |
| POST | `/api/v1/tournaments/{id}/register` | Đăng nhập | Cầu thủ đăng ký đội |
| GET | `/api/v1/tournaments/{id}/access` | Công khai | Chế độ tham gia + email mời |
| PUT | `/api/v1/tournaments/{id}/access` | ORGANIZER, OWNER, ADMIN | Đặt chế độ tham gia + danh sách mời |
| POST | `/api/v1/tournaments/{id}/invites` | ORGANIZER, OWNER, ADMIN | Mời một email |
| DELETE | `/api/v1/tournaments/{id}/invites/{email}` | ORGANIZER, OWNER, ADMIN | Gỡ một lời mời |
| POST | `/api/v1/tournaments/{id}/teams/manual` | ORGANIZER, OWNER, ADMIN | Thêm đội thủ công (CONFIRMED) |
| POST | `/api/v1/tournaments/{id}/teams/confirm-payment` | ORGANIZER, OWNER, ADMIN | Xác nhận đã thu lệ phí |
| GET | `/api/v1/tournaments/{id}/teams/pending` | ORGANIZER, OWNER, ADMIN | Danh sách đội chờ duyệt |
| POST | `/api/v1/tournaments/{id}/teams/{teamName}/approve` | ORGANIZER, OWNER, ADMIN | Duyệt đội |
| POST | `/api/v1/tournaments/{id}/teams/{teamName}/reject` | ORGANIZER, OWNER, ADMIN | Từ chối đội |
| GET | `/api/v1/tournaments/{id}/referees` | ORGANIZER, OWNER, ADMIN | Danh sách trọng tài |
| POST | `/api/v1/tournaments/{id}/referees` | ORGANIZER, OWNER, ADMIN | Thêm trọng tài |
| DELETE | `/api/v1/tournaments/{id}/referees/{refId}` | ORGANIZER, OWNER, ADMIN | Xóa trọng tài |

### 6.1 Đọc giải và cơ chế che PII

`GET /tournaments` và `GET /tournaments/{id}` trả Map (không phải entity) do `sanitizeTournament` dựng từ entity qua `ObjectMapper` (`TournamentController.java:52-92`):

- Người có quyền (`ADMIN`, `ORGANIZER`, `OWNER`) thấy **đầy đủ**.
- Người khác: `invitedEmails` chỉ còn email **của chính mình**; với mỗi phần tử `teams[]`, `captainEmail` bị che dạng `a***@d***.vn`, `captainPhone`/`subCaptainPhone` dạng `0912****678` — **trừ** đội mà SĐT/email đội trưởng trùng với hồ sơ người xem.
- `GET /{id}` không tồn tại → `404` body rỗng.

Field của một giải: `id`, `title`, `description`, `sportType` (`SAN_7`/`SAN_5`/`SAN_11`/`FUTSAL`), `format` (`KNOCKOUT`/`ROUND_ROBIN`), `pitchName`, `location`, `totalTeams`, `registeredTeams`, `prizePool`, `entryFee`, `startDate`, `endDate`, `registrationDeadline`, `status` (`OPEN`/`ONGOING`/`COMPLETED`), `bannerUrl`, `joinMode` (`PUBLIC`/`INVITE_ONLY`), `invitedEmails[]`, `bankCode`, `bankAccount`, `accountName`, `bracketJson`, `createdAt`, `teams[]`.

Mỗi phần tử `teams[]` (`TournamentTeamEntry`): `teamName`, `captainName`, `captainEmail`, `captainPhone`, `subCaptainPhone`, `memberCount`, `memberNames` (chuỗi phân tách bằng dấu phẩy), `form`, `record`, `winRate`, `played`, `won`, `drawn`, `lost` (các field phong độ là `@Transient`, tính live từ lịch sử thi đấu qua `TeamFormService`), `registrationStatus` (`PENDING_PAYMENT`/`CONFIRMED`/`SIMULATED`), `simulated`, `registeredAt`.

> [!NOTE]
> `GET /api/v1/tournaments` gọi `attachForms` một lần cho toàn bộ giải (1 query phong độ), không còn N+1 như bản cũ.

### 6.2 `POST /api/v1/tournaments` — tạo giải

Body là entity `Tournament` (các field ở mục 6.1). Server **ghi đè** những field do hệ thống quản lý (`TournamentController.java:131-167`):

- `id = null` (chống client gửi id để MERGE đè giải của người khác).
- `registeredTeams = 0`, `bracketJson = null`, `teams = []`.
- `status` mặc định `"OPEN"`; `joinMode` chỉ nhận `PUBLIC`/`INVITE_ONLY` (sai → `PUBLIC`); `format` chỉ nhận `KNOCKOUT`/`ROUND_ROBIN` (sai → `KNOCKOUT`).
- Trả `200 OK` + entity `Tournament` đã lưu (không phải 201).

### 6.3 `PUT /api/v1/tournaments/{id}` — sửa giải

Chỉ nhận các field có mặt trong body; **không** cho sửa `registeredTeams`, `teams`, `bracketJson`, `status`, `createdAt` (`TournamentController.java:187-271`).

| Field | Ràng buộc |
| --- | --- |
| `title` | Không được rỗng |
| `description`, `pitchName`, `location`, `startDate`, `endDate`, `registrationDeadline`, `bannerUrl`, `bankCode`, `bankAccount`, `accountName` | Gán trực tiếp |
| `sportType` | Một trong `SAN_7`, `SAN_5`, `SAN_11`, `FUTSAL`; **không đổi được** khi giải đã có đội |
| `format` | `KNOCKOUT`/`ROUND_ROBIN`; **không đổi được** khi đã có đội hoặc đã bốc thăm |
| `totalTeams` | ≥ 2 và **không nhỏ hơn** số đội hiện có |
| `prizePool`, `entryFee` | ≥ 0 |

Lỗi → `400` `{"message": ...}`; giải không tồn tại → `400` `"Giải đấu không tồn tại"`. Thành công → `200` + entity.

### 6.4 Trạng thái và vòng đời

- `PATCH /{id}/status` (**chỉ ADMIN**): body `{"status": "OPEN" | "ONGOING" | "COMPLETED"}`; giá trị khác → `400` `"Trạng thái không hợp lệ: X"`. Response `{"message", "id", "status"}`.
- `DELETE /{id}` (**chỉ ADMIN**): xóa toàn bộ `MatchResult`, `GoalEvent` của giải rồi xóa giải; response `{"message": "Đã xóa giải đấu cùng kết quả và bàn thắng liên quan.", "id": ...}`.
- `GET /{id}/finance`: `tournamentId`, `tournamentTitle`, `status`, `entryFee`, `prizePool`, `totalTeams` (số đội trong danh sách), `capacity` (`totalTeams` cấu hình), `confirmedTeams`, `pendingTeams`, `simulatedTeams`, `totalCollected` (= `confirmed × entryFee`, **không** tính đội `SIMULATED`), `totalAwaiting` (= `pending × entryFee`), `prizeToPay` (chỉ khác 0 khi giải `COMPLETED`), `netAfterPrize`, `fillPercent`.

### 6.5 `POST /api/v1/tournaments/{id}/register`

Body: `teamName` (bắt buộc, 3–60 ký tự), `subCaptainPhone`, `memberCount` (mặc định 12, kẹp 1–30). Danh tính đội trưởng **lấy từ token** (`fullName`, `email`, `phone`), client không khai được.

Thứ tự kiểm tra (`TournamentController.java:1546-1674`):

1. Không có token → `401` `{"error": "Vui lòng đăng nhập để đăng ký đội."}`
2. Giải không tồn tại → `400` `{"error": "Giải đấu không tồn tại"}`
3. Đủ sức chứa (đếm đội `CONFIRMED`+`SIMULATED` so với `totalTeams`) → `400` `{"error": "Giải đấu đã đủ số lượng đội đăng ký"}`
4. Giải không còn `OPEN` → `400` `{"error": "Giải đấu không còn mở đăng ký."}`
5. Quá `registrationDeadline` → `400` `{"error": "Đã qua hạn đăng ký của giải đấu."}`
6. Giải `INVITE_ONLY` và email không có trong `invitedEmails` → `403` `{"error": "Giải đấu này chỉ mời tham gia qua email. ..."}`
7. `teamName` sai độ dài → `400`; trùng tên đội trong giải → `400` `{"error": "Tên đội đã tồn tại trong giải này."}`
8. Tài khoản đã đăng ký đội khác trong cùng giải (trùng `captainEmail` hoặc `captainPhone`) → `400` `{"error": "Bạn đã đăng ký đội trong giải này rồi."}`
9. Hồ sơ chưa có SĐT → `400` `{"error": "Vui lòng cập nhật số điện thoại trong hồ sơ trước khi đăng ký."}`

> [!WARNING]
> Toàn bộ nhánh lỗi của endpoint này dùng key `"error"` trong khi phần còn lại của `TournamentController` dùng `"message"`. Frontend đã phải đọc cả hai (`frontend/src/lib/api.ts:205-206`); client mới nên xử lý cả hai key.

Thành công: `200 OK`

```json
{ "message": "Nộp đơn thành công! Vui lòng thanh toán lệ phí và chờ BTC xác nhận.",
  "tournamentId": 5, "registeredTeams": 9, "paymentStatus": "PENDING_PAYMENT",
  "team": { "teamName": "...", "captainName": "...", "...": "..." } }
```

Đội mới có `registrationStatus = "PENDING_PAYMENT"`; đồng thời gửi notification cho `ORGANIZER` và `ADMIN`.

### 6.6 Bốc thăm và sinh nhánh đấu — `POST /{id}/draw`

- Giải chưa có ≥ 2 đội **không** ở trạng thái `PENDING_PAYMENT` → `400` `"Cần ít nhất 2 đội đã đóng lệ phí mới bốc thăm được."`
- Hạt giống = thứ tự `registeredAt` tăng dần (`null` xếp cuối) (`:681-684`).
- `format = ROUND_ROBIN`: dùng vòng tròn 1 lượt (circle method); đội lẻ mỗi vòng có một `BYE`.
- `format = KNOCKOUT`: nâng lên lũy thừa 2 gần nhất; đội hạt giống cao được `BYE`; các vòng sau sinh trận với ô `"Thắng R1-M1"` và `tbd: true`.
- Kết quả lưu vào `Tournament.bracketJson` (JSON string) và phát notification `ALL`.
- Response: `{"message": "Bốc thăm thành công cho N đội!", "bracket": {...}}`; lỗi serialize → `500`.

Cấu trúc `bracket`: `tournamentId`, `title`, `drawnAt`, `method` (`"SEEDED_REGISTRATION"` hoặc `"ROUND_ROBIN"`), `teamCount`, `rounds: [{ "name": "Tứ kết", "matches": [...] }]`.

Mỗi trận: `matchId` (`R1-M1`, `R1-BYE1`, `R2-M1`…), `teamA`/`teamB` (`{name, form, record, winRate, seed?, tbd?}`), `scoreA`, `scoreB`, `status` (`SCHEDULED`/`TBD`/`BYE`/`DONE`), `winner`, và sau khi xếp lịch có thêm `matchDate`, `timeSlot`, `pitchName`. Trận `BYE` có `bye` thay cho `teamA`/`teamB`.

`GET /{id}/bracket`: trả đúng object trên; chưa bốc thăm → `404` `{"message": "Giải chưa bốc thăm chia cặp."}`.

### 6.7 Nhập / hủy kết quả trận

`POST /{id}/matches` — body:

```json
{ "matchId": "R1-M1", "scoreA": 3, "scoreB": 1,
  "yellowCardsA": 1, "yellowCardsB": 2, "redCardsA": 0, "redCardsB": 0,
  "substitutionsA": 2, "substitutionsB": 3, "mvpPlayer": "Nguyễn Văn A", "notes": "...",
  "scorers": [{ "playerName": "Nguyễn Văn A", "teamName": "FC A", "goals": 2, "assists": 1 }] }
```

Điều kiện và lỗi (`TournamentController.java:854-1053`):

- Chưa bốc thăm → `400` `"Giải chưa bốc thăm nên chưa thể nhập kết quả."`; thiếu `matchId` hoặc tỷ số âm/không phải số → `400`; knockout mà hòa → `400` `"Vòng Knockout cần phân thắng bại, không nhận tỷ số hòa."`
- Không tìm thấy `matchId` → `400`; trận không ở `SCHEDULED` → `400` `"Trận này không thể nhập điểm (đã đá / miễn / chờ đội)."`; cặp đấu còn `tbd` → `400`.
- `scorers` (tùy chọn): cầu thủ thuộc đội khác → `400`; **tổng bàn của cầu thủ phải khớp tỷ số đội**, lệch → `400` `"Tổng bàn cầu thủ (...) lệch tỷ số đội (...). Kiểm tra lại."`
- Hiệu ứng: cập nhật trận trong bracket (`DONE`, `winner`), đẩy đội thắng vào ô vòng sau, tự chuyển trận cha sang `SCHEDULED` khi đủ 2 đội (`promoteMatchIfReady`), lưu `MatchResult` + `GoalEvent`, phát notification `ALL`.
- Response: `{"message", "winner", "formChanges": [{"team","before","after"}], "bracket"}` — `before`/`after` là `{played, won, drawn, lost, winRate, form, record}`.

`DELETE /{id}/matches/{matchId}` — hủy kết quả:

- Trận không ở `DONE` → `400` `"Trận này chưa có kết quả để huỷ."`
- Với knockout: nếu **vòng sau đã có trận `DONE`** → `400` `"Không thể huỷ vì trận ... ở vòng sau đã có kết quả. Hãy huỷ từ vòng sau trở đi trước."` (vòng tròn được bỏ qua kiểm tra này).
- Hiệu ứng: xóa `MatchResult`, xóa `GoalEvent`, trả ô `"Thắng {matchId}"` về `tbd: true`, đặt trận về `SCHEDULED`.
- Response: `{"message", "matchId", "goalEventsRemoved", "bracket"}`.

### 6.8 Xếp lịch — `POST /{id}/schedule`

Body tùy chọn: `startDate` (`yyyy-MM-dd`, mặc định `tournament.startDate`), `matchesPerDay` (mặc định 2), `daysBetweenRounds` (mặc định 2), `startHour` (mặc định 17), `matchMinutes` (mặc định 120).

- Chưa bốc thăm → `400`; `startDate` không parse được → `400` `"Ngày bắt đầu không hợp lệ (cần yyyy-MM-dd)."`
- Mỗi trận (bỏ qua `BYE`) được gán `matchDate`, `timeSlot` (`"HH:mm - HH:mm"`), `pitchName` (lấy `tournament.pitchName` → `location` → `"Sân BTC"`).
- Response: `{"message": "Đã xếp lịch cho N trận đấu!", "scheduled": N, "bracket": {...}}` + notification `ALL`.

### 6.9 Vua phá lưới

- `GET /{id}/scorers`: mảng `{playerName, teamName, goals, assists, rank}`, gộp theo cặp `playerName + teamName`, sắp theo `goals` rồi `assists`. Giải không tồn tại → **`400`** `{"message": "Giải đấu không tồn tại"}` (không phải 404).
- `GET /scorers/top`: query `limit` (mặc định 5, kẹp 1–20), cùng cấu trúc, gộp toàn hệ thống.

### 6.10 Duyệt đội và xác nhận lệ phí

- `GET /{id}/teams/pending`: mảng `{teamName, captainName, captainPhone, captainEmail, memberCount, registeredAt}` cho các đội `PENDING_PAYMENT`.
- `POST /{id}/teams/confirm-payment`: body `{"teamName": "..."}`; thiếu tên → `400`; không thấy đội → `400`; nếu số đội đã vào giải (`CONFIRMED`+`SIMULATED`) đã đủ `totalTeams` → `400` `"Giải đã đủ N đội. Hãy tăng sức chứa hoặc bỏ bớt đội trước khi duyệt thêm."`; thành công → `{"message", "team"}`.
- `POST /{id}/teams/{teamName}/approve`: chỉ duyệt đội đang `PENDING_PAYMENT`; kiểm tra sức chứa → `400` `"Giải đấu đã đủ số đội (N)."`; không thấy → `400` `"Không tìm thấy đội chờ duyệt: X"`.
- `POST /{id}/teams/{teamName}/reject`: **xóa** đội `PENDING_PAYMENT` khỏi danh sách, cập nhật `registeredTeams`; không thấy → `400`.
- `POST /{id}/teams/manual`: body `{teamName*, captainName, captainPhone, memberNames, memberCount, subCaptainPhone}`. Đội được tạo với `registrationStatus = "CONFIRMED"` (sẵn sàng bốc thăm), `captainEmail = null`; nếu không có `memberNames` thì sinh `"Cầu thủ 1..N"`. Endpoint này **xóa toàn bộ kết quả + bracket** của giải (`clearTournamentResults` + `bracketJson = null`). Lỗi dùng key `"message"`.

### 6.11 Quyền tham gia và lời mời

- `GET /{id}/access` → `{"joinMode": "PUBLIC"|"INVITE_ONLY", "invitedEmails": [...]}`. Danh sách email chỉ trả cho `ADMIN`/`ORGANIZER`/`OWNER`; người khác nhận mảng rỗng (PII).
- `PUT /{id}/access` → body `{"joinMode": "PUBLIC"|"INVITE_ONLY", "invitedEmails": ["a@b.vn"]}`. Gửi `invitedEmails` sẽ **ghi đè** toàn bộ danh sách (email thiếu `@` bị loại, tự lowercase, tự chống trùng). Response `{"message", "joinMode", "invitedEmails"}`.
- `POST /{id}/invites` → body `{"email": "..."}`; email thiếu `@` → `400`; thêm vào danh sách và **tự chuyển** `joinMode` sang `INVITE_ONLY` nếu đang `PUBLIC`.
- `DELETE /{id}/invites/{email}` → gỡ lời mời (không lỗi nếu email không có trong danh sách), trả `{"message", "invitedEmails"}`.

### 6.12 Trọng tài

- `GET /{id}/referees` → mảng `{id, name, email, phone, status, notes, assignedAt}` (`status` mặc định `ACTIVE`).
- `POST /{id}/referees` → body `{name* (2–80 ký tự), email, phone, notes}`. Trùng email trong giải → `400` `"Trọng tài này đã có trong giải."`; trùng SĐT → `400` `"Số điện thoại này đã được dùng."`; thành công `{"message", "id"}`.
- `DELETE /{id}/referees/{refId}` → luôn trả `{"message": "Đã xóa trọng tài.", "id": ...}` (kể cả khi `refId` không tồn tại).

### 6.13 Dữ liệu giả lập của giải

`POST /{id}/fill-teams` — body tùy chọn `{"count": n}`; thêm đội ảo (`registrationStatus = "SIMULATED"`, `simulated = true`, đủ quân số ngẫu nhiên theo `sportType`) cho tới `totalTeams`. Xóa `bracketJson` cũ. Response `{"message", "added", "registeredTeams"}`. Nếu đã đủ đội: `{"message": "Giải đã đủ N đội, không cần giả lập thêm.", "added": 0, "registeredTeams": N}`.

`DELETE /{id}/simulated-teams` — xóa mọi đội `simulated = true` hoặc `registrationStatus = "SIMULATED"`, **xóa toàn bộ kết quả trận + bàn thắng** và `bracketJson`. Response `{"message", "removed", "registeredTeams"}`.

`POST /{id}/simulate-results` — random tỷ số cho mọi trận `SCHEDULED`/`TBD` đã đủ 2 đội, ghi `MatchResult` + `GoalEvent` ngẫu nhiên từ đội hình, đẩy đội thắng đi tiếp; nếu trận cuối cùng (vòng cuối chỉ có 1 trận) đã `DONE` và có `winner` thì đặt `status = "COMPLETED"`. Response `{"message", "simulated", "champion", "bracket"}`.

> [!WARNING]
> `fill-teams` và `simulate-results` sinh dữ liệu giả vào **cùng bảng** với dữ liệu thật, không có cờ môi trường, và `simulate-results` có thể tự đặt giải sang `COMPLETED`. Chúng yêu cầu role `ORGANIZER`/`OWNER`/`ADMIN` nhưng **không kiểm tra giải này có thuộc người gọi hay không** (entity `Tournament` không có trường chủ sở hữu/BTC). Bất kỳ tài khoản `ORGANIZER` nào cũng thao tác được trên giải của người khác — đây là lỗ hổng phân quyền theo chiều ngang cần xử lý trước khi bàn giao.

---

## 7. Báo cáo & email giải đấu

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| POST | `/api/v1/tournaments/{id}/notify-team/approve` | ORGANIZER, ADMIN | Email báo đội được duyệt |
| POST | `/api/v1/tournaments/{id}/notify-team/reject` | ORGANIZER, ADMIN | Email báo đội bị từ chối |
| POST | `/api/v1/tournaments/{id}/notify-schedule` | ORGANIZER, ADMIN | Email lịch thi đấu cho mọi đội |
| GET | `/api/v1/tournaments/{id}/report.csv` | ORGANIZER, ADMIN | Xuất báo cáo tổng kết giải (CSV) |

### 7.1 Ba endpoint email

`TournamentEmailController.java`. Cả ba dùng chung điều kiện: giải không tồn tại → `400 {"message": "Giải đấu không tồn tại"}`.

| Endpoint | Tham số | Hành vi |
| --- | --- | --- |
| `notify-team/approve` | `teamName` (**query param bắt buộc**) | Tìm đội theo tên **chính xác, phân biệt hoa thường** (`.equals`, không `.equalsIgnoreCase`) → không thấy `400` `"Không tìm thấy đội."`. Gửi HTML cho `team.captainEmail` |
| `notify-team/reject` | `teamName` (bắt buộc), `reason` (tùy chọn, mặc định `"Giải đã đủ số lượng đội đăng ký."`) | Gửi HTML kèm lý do; nếu không tìm thấy đội thì `to = null` → trả 200 với message "không gửi được" |
| `notify-schedule` | không | Yêu cầu đã bốc thăm (`bracketJson` khác rỗng) → chưa có thì `400` `"Giải chưa bốc thăm, chưa có lịch thi đấu."`. Gửi cho **tất cả** `captainEmail` hợp lệ (khử trùng lặp) |

Response: `notify-team/approve` và `notify-team/reject` trả `{"message", "sent": true|false}`; `notify-schedule` trả `{"message": "Đã gửi email lịch thi đấu tới N đội.", "sent": x, "skipped": y}`.

> [!NOTE]
> Gửi email phụ thuộc `EmailService.isReady()` (`MAIL_ENABLED=true` + `MAIL_USERNAME`/`MAIL_PASSWORD`). Khi hệ thống chưa bật, endpoint vẫn trả **HTTP 200** nhưng `sent = false` và message "Không gửi được email (SMTP chưa bật hoặc lỗi)." — client phải đọc `sent`, đừng chỉ nhìn mã HTTP.

### 7.2 `GET /api/v1/tournaments/{id}/report.csv`

Trả file CSV (`Content-Type: text/csv; charset=UTF-8`, có BOM UTF-8 để Excel đọc đúng tiếng Việt), header `Content-Disposition: attachment; filename="<ten-giai>-bao-cao.csv"`. Tên file được lọc bỏ ký tự đặc biệt; rỗng thì dùng `giai-dau`.

Nội dung gồm 6 khối (`TournamentReportController.java:104-183`): thông tin giải, danh sách đội (`STT, Đội, Đội trưởng, SĐT, Số thành viên, Trạng thái`), kết quả thi đấu (`Mã trận, Vòng, Đội A, Tỷ số, Đội B, Người thắng, Ngày thi đấu`), BXH phong độ (`Số trận, Thắng, Hòa, Thua, Tỷ lệ thắng, Chuỗi form`), thống kê tổng, và thời điểm xuất.

Lưu ý bảo mật: giá trị bắt đầu bằng `=`, `+`, `-`, `@` được thêm tiền tố `'` để chống CSV/Excel formula injection (`TournamentReportController.java:41-46`).

Giải không tồn tại → `400` `{"message": "Giải đấu không tồn tại"}` (không phải CSV).

---

## 8. Cộng đồng / chợ kèo

`CommunityController.java` — prefix `/api/v1/community` (`permitAll`).

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/community/matchmaking-posts` | Công khai | Danh sách bài đăng kèo giao hữu |
| POST | `/api/v1/community/matchmaking-posts` | Đăng nhập | Đăng kèo mới |
| POST | `/api/v1/community/matchmaking-posts/{id}/accept` | Đăng nhập | Nhận kèo |
| GET | `/api/v1/community/urgent-market` | Công khai | Chợ kèo khẩn cấp (dẫn xuất từ bài `OPEN`) |
| GET | `/api/v1/community/players/leaderboard` | Công khai | Top 10 đội theo tỷ lệ thắng |
| POST | `/api/v1/community/reviews` | Đăng nhập | Chấm điểm Fair-play cho đội |
| GET | `/api/v1/community/reviews/{teamName}` | Công khai | Đánh giá của một đội |

Hệ thống **không dùng điểm Elo**: mọi xếp hạng tính từ lịch sử thi đấu thật (`TeamFormService`).

### 8.1 `GET /api/v1/community/matchmaking-posts`

Trả `List<MatchmakingPost>`, mới nhất trước, mỗi phần tử được gắn thêm 3 field `@Transient` tính live: `form` (chuỗi 5 trận, ví dụ `"WWDLW"`), `record` (ví dụ `"3-1-1"`), `winRate` (%).

Field của bài đăng: `id`, `teamName`, `captainName`, `captainPhone`, `reputationScore` (mặc định 98), `pitchName`, `address`, `matchTime` (chuỗi tự do, ví dụ `"19:30 Tối nay"`), `pitchType`, `paymentModel` (`SPLIT_EQUAL`/`LOSER_PAYS`/`HOST_COVER`), `estimatedFee`, `note`, `status` (`OPEN`/`MATCHED`/`CANCELLED`), `opponentTeamName`, `opponentCaptainName`, `opponentCaptainPhone`, `matchedAt`, `createdAt`.

> [!WARNING]
> Endpoint công khai này trả `captainPhone` **nguyên văn** của mọi bài đăng — không có token cũng đọc được toàn bộ số điện thoại đội trưởng. Đây là dữ liệu cá nhân; nếu cần che phải sửa ở tầng controller (chưa có cơ chế che như nhóm sân/giải đấu).

### 8.2 `POST /api/v1/community/matchmaking-posts`

Body: `teamName`, `captainName`, `captainPhone`, `pitchName`, `address`, `matchTime`, `pitchType`, `paymentModel`, `estimatedFee`, `note`.

- Thiếu một trong `teamName`, `captainPhone`, `matchTime`, `pitchName` → `400` `{"error": "Thiếu thông tin: cần teamName, captainPhone, matchTime và pitchName để đăng kèo."}`.
- `estimatedFee` không phải số → `400` `{"error": "Phí dự kiến không hợp lệ."}`.
- `captainName` rỗng sẽ lấy bằng `captainPhone`; `status = "OPEN"`.
- Thành công: **`200 OK`** (không phải 201) + entity bài đăng đã gắn `form`/`record`/`winRate`.

### 8.3 `POST /api/v1/community/matchmaking-posts/{id}/accept`

Body: `opponentTeamName`, `opponentCaptainName`, `opponentCaptainPhone`.

- Kèo không tồn tại → `400` `{"error": "Kèo giao lưu không tồn tại hoặc đã hủy"}`.
- Kèo không còn `OPEN` → `400` `{"error": "Kèo này đã có đối thủ nhận!"}`.
- Người nhận trùng SĐT với chủ kèo → `400` `{"error": "Bạn không thể tự nhận kèo của đội mình."}`.
- Thiếu `opponentTeamName`/`opponentCaptainPhone` → `400` `{"error": "Thiếu thông tin đội nhận kèo: ..."}`.
- Hiệu ứng: `status = "MATCHED"`, gán `opponent*`, `matchedAt = now`; tra email chủ kèo theo SĐT để gửi notification type `MATCHMAKING`.
- Response: `{"message": "Ghép kèo thành công! Chúc hai đội thi đấu Fairplay.", "post": {...}}`.

### 8.4 `GET /api/v1/community/urgent-market`

Dẫn xuất từ các bài `OPEN` (không có bảng riêng). Mỗi phần tử: `id`, `matchTitle` (`"<teamName> cần đối thủ"`), `teamName`, `captainName`, `time`, `location` (`pitchName` + `" • "` + `address` nếu có), `form`, `record`, `winRate`, `fee`, `note`, `createdAt`.

### 8.5 `GET /api/v1/community/players/leaderboard`

Gom mọi `teamName` từ `teams[]` của tất cả giải, tính phong độ, sắp theo `winRate` giảm dần → `played` giảm dần → tên tăng dần, lấy **top 10**. Mỗi dòng: `teamName`, `played`, `won`, `drawn`, `lost`, `winRate`, `form`, `record`, `rank`.

### 8.6 `POST /api/v1/community/reviews`

Body: `reviewedTeamName`, `matchmakingPostId`, `stars` (1–5, kẹp giá trị), `onTime`, `fairPlay`, `sportsmanship` (mặc định `true`), `comment`.

- `reviewerTeamName` **bị ghi đè** bằng `fullName` của tài khoản đang đăng nhập (`CommunityController.java:262-264`) — chống tự nâng uy tín bằng cách đổi tên đội.
- Thiếu tên đội bị đánh giá → `400` `{"error": "Thiếu tên đội bị đánh giá / đội đánh giá."}`; tự đánh giá đội mình → `400` `{"error": "Không thể tự đánh giá đội của mình."}`.
- **Bắt buộc** có `matchmakingPostId` → thiếu `400` `{"error": "Thiếu mã bài đăng kèo giao lưu."}`.
- Mỗi đội chỉ chấm 1 lần/bài đăng → trùng `400` `{"error": "Bạn đã đánh giá bài đăng này rồi."}`.
- Sau khi lưu, tính lại `reputationScore` của đội bị đánh giá: `0.6 × (avgStars/5×100) + 0.4 × (tỷLệFairPlay×100)`, kẹp 0–100, rồi ghi vào **mọi** bài đăng của đội đó (`:333-361`).
- Response: `{"message": "Đã gửi đánh giá Fair-play cho đội X.", "review": {...}}`.

### 8.7 `GET /api/v1/community/reviews/{teamName}`

`{teamName}` là path variable — cần URL-encode nếu tên đội có dấu cách/ký tự đặc biệt. Response: `{"teamName", "avgStars" (làm tròn 1 chữ số), "reviewCount", "reviews": [{id, reviewedTeamName, reviewerTeamName, matchmakingPostId, stars, onTime, fairPlay, sportsmanship, comment, createdAt}]}`.

---

## 9. CLB & đội

`ClubController.java` — prefix `/api/v1/clubs`. Nhóm này **không** nằm trong `permitAll` nên mọi endpoint đều cần token. Quyền quản lý CLB dựa trên cờ "đại diện" trong bảng `club_members`, **không** dựa trên `UserRole`.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| POST | `/api/v1/clubs` | Đăng nhập | Tạo CLB (người tạo là đại diện) |
| GET | `/api/v1/clubs/mine` | Đăng nhập | CLB tôi đại diện / là thành viên |
| GET | `/api/v1/clubs/{id}` | Đăng nhập | Chi tiết CLB |
| PUT | `/api/v1/clubs/{id}` | Đăng nhập + đại diện | Sửa thông tin CLB |
| DELETE | `/api/v1/clubs/{id}` | Đăng nhập + đại diện | Xóa CLB |
| POST | `/api/v1/clubs/{id}/members` | Đăng nhập + đại diện | Thêm thành viên bằng email |
| DELETE | `/api/v1/clubs/{id}/members/{email}` | Đăng nhập + đại diện | Gỡ thành viên |
| PATCH | `/api/v1/clubs/{id}/members/{email}/representative` | Đăng nhập + đại diện | Bổ nhiệm / thu hồi đại diện |

### 9.1 `POST /api/v1/clubs`

Body: `name` (**3–100 ký tự**, sai → `400` `{"message": "Tên CLB phải từ 3 đến 100 ký tự."}`), `description`, `area` (mặc định `user.area`), `phone` (mặc định `user.phone`), `logoUrl`, `maxMembers` (0 = không giới hạn, kẹp ≤ 500).

- `slug` sinh tự động từ tên (bỏ dấu tiếng Việt, thêm hậu tố `-2`, `-3`… nếu trùng).
- Người tạo được thêm vào `club_members` với `isRepresentative = true` và cờ `User.isClubRep` được bật.
- Response: `{"message": "Đã tạo CLB \"X\". Bạn là đại diện CLB.", "club": {...}}`.

### 9.2 `GET /api/v1/clubs/mine`

Trả mảng gồm hai loại phần tử:

- CLB tôi là đại diện (kể cả CLB tôi không tạo): object đầy đủ `id`, `name`, `slug`, `description`, `area`, `phone`, `logoUrl`, `ownerEmail`, `ownerName`, `maxMembers`, `createdAt`, `memberCount`, `memberList[]`, `canManage: true`.
- CLB tôi chỉ là thành viên: object tối giản `id`, `name`, `slug`, `logoUrl`, `area`, `memberCount`, `canManage: false`.

### 9.3 `GET /api/v1/clubs/{id}`

Không tồn tại → `400` `{"message": "Không tìm thấy CLB"}` (**không phải 404**). `memberList` chỉ có dữ liệu khi người xem là thành viên hoặc đại diện; người ngoài nhận `memberList: []` để không lộ email/SĐT (`ClubController.java:146-151`).

Mỗi phần tử `memberList`: `email`, `name`, `phone`, `isRepresentative`, `joinedAt`.

### 9.4 Các thao tác quản lý

| Endpoint | Body | Lỗi nghiệp vụ |
| --- | --- | --- |
| `PUT /{id}` | `name`, `slug`, `description`, `area`, `phone`, `logoUrl`, `maxMembers` | Không phải đại diện → `403` `{"message": "Chỉ đại diện CLB mới sửa được thông tin CLB."}`; tên sai độ dài → `400`. Đổi tên mà không gửi `slug` → slug sinh lại |
| `DELETE /{id}` | — | Không phải đại diện → `403`; xóa toàn bộ thành viên rồi xóa CLB, cập nhật lại cờ `isClubRep` cho tất cả email liên quan |
| `POST /{id}/members` | `email*`, `name`, `phone` | Không phải đại diện → `403`; email thiếu `@` → `400`; đã là thành viên → `400`; vượt `maxMembers` → `400` `"CLB đã đủ số thành viên tối đa."`. Tên/SĐT tự lấy từ hồ sơ nếu tài khoản tồn tại |
| `DELETE /{id}/members/{email}` | — | Không phải đại diện → `403`; tự gỡ mình → `400` `"Bạn không thể tự gỡ mình khỏi CLB."` |
| `PATCH /{id}/members/{email}/representative` | `{"isRepresentative": true/false}` | Không phải đại diện → `403`; không phải thành viên → `400`; vượt 3 đại diện → `400` `"Mỗi CLB tối đa 3 đại diện."`; tự thu hồi quyền của mình → `400`; thu hồi đại diện cuối cùng → `400` `"Không thể thu hồi vai trò của đại diện cuối cùng của CLB."` |

Các endpoint trả `{"message": ..., "club": {...}}` (riêng `DELETE /{id}` chỉ trả `{"message": "Đã xóa CLB \"X\"."}`).

---

## 10. Chat cộng đồng

`ChatController.java` — prefix `/api/v1/chat`. Chỉ `GET /files/{filename:.+}` là công khai; các endpoint còn lại cần token qua `SecurityConfig`.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/chat/channels` | Đăng nhập | Danh sách 10 kênh + tin ghim + tin cuối |
| GET | `/api/v1/chat/messages` | Đăng nhập | 50 tin của kênh, hoặc DM với một người |
| POST | `/api/v1/chat/messages` | Đăng nhập | Gửi tin (kênh / DM / reply) |
| GET | `/api/v1/chat/messages/search` | Đăng nhập | Tìm tin theo từ khóa |
| DELETE | `/api/v1/chat/messages/{id}` | Đăng nhập + tác giả | Xóa tin của mình |
| POST | `/api/v1/chat/messages/{id}/pin` | Đăng nhập + tác giả | Ghim / bỏ ghim |
| POST | `/api/v1/chat/messages/{id}/react` | Đăng nhập | Thêm / bỏ reaction |
| GET | `/api/v1/chat/messages/{id}/reactions` | Đăng nhập | Reaction gộp theo emoji |
| POST | `/api/v1/chat/messages/{id}/read` | Đăng nhập + người nhận | Đánh dấu đã đọc |
| GET | `/api/v1/chat/conversations` | Đăng nhập | Danh sách hội thoại DM |
| GET | `/api/v1/chat/users` | Đăng nhập | Tìm người dùng để nhắn |
| GET | `/api/v1/chat/unread-count` | Đăng nhập | Số tin chưa đọc (DM + nhóm) |
| POST | `/api/v1/chat/upload` | Đăng nhập | Upload file đính kèm |
| GET | `/api/v1/chat/files/{filename:.+}` | Công khai | Tải / xem file đã upload |
| GET | `/api/v1/chat/admin/messages` | ADMIN | Danh sách tin công khai để kiểm duyệt |
| DELETE | `/api/v1/chat/admin/messages/{id}` | ADMIN | Xóa tin bất kỳ |

### 10.1 Kênh công khai

Danh sách slug hợp lệ (cố định trong code, `ChatController.java:57-60`): `general`, `vang-lai`, `bu-thieu-nguoi`, `doi-30p`, `tinh-trang-san`, `khieu-nai`, `ho-dap-luat`, `do-dung-cu`, `tuyen-cau-thu`, `giai-dau`. Slug lạ hoặc thiếu → tự quy về `general` (`normalizeChannel`).

`GET /channels` trả mảng: `slug`, `name`, `desc`, `lastMessage`, `lastSender`, `lastSenderEmail`, `lastTime`, `memberCount` (số người gửi khác nhau trong 50 tin cuối), `pinned` (`{id, content, senderName, createdAt}` hoặc `null`).

`GET /messages` — query `channel` (mặc định `general`) hoặc `with` (email người muốn nhắn riêng):
- Có `with` và đã đăng nhập → 50 tin DM hai chiều (mới nhất trước khi đảo), trả theo thứ tự **cũ → mới**.
- Không có `with` → 50 tin công khai của kênh, đảo thành **cũ → mới**.

`POST /messages` — body: `content` (**bắt buộc**, ≤ 500 ký tự), `recipientEmail`, `recipientName`, `channel`, `replyToId`.

- Nội dung rỗng → `400` `{"message": "Tin nhắn không được rỗng."}`; > 500 ký tự → `400` `{"message": "Tin nhắn tối đa 500 ký tự."}`.
- Có `recipientEmail` → tin DM (`channel` bị ép `general`); không có → tin kênh, `channel` chuẩn hóa theo danh sách trên.
- `senderName`, `senderEmail`, `senderRole` lấy từ tài khoản. Response `200` + entity `ChatMessage`.

`ChatMessage` field: `id`, `senderName`, `senderEmail`, `senderRole`, `recipientEmail`, `recipientName`, `channel`, `groupId`, `replyToId`, `pinned`, `fileUrl`, `fileType`, `fileName`, `fileSize`, `readAt`, `content`, `createdAt`.

### 10.2 Ghim, xóa, reaction, đã đọc

- `POST /messages/{id}/pin?value=true|false` — query `value` là **bắt buộc** (thiếu → `400` do Spring không bind được). Chỉ tác giả: sai → `403` `{"message": "Chỉ tác giả mới ghim được tin nhắn."}`; tin không tồn tại → `404`. Ghim mới sẽ **bỏ ghim** các tin khác cùng kênh (mỗi kênh tối đa 1 tin ghim). Response là entity `ChatMessage` đã lưu.
- `DELETE /messages/{id}` — chỉ tác giả (`403` `"Chỉ tác giả mới xóa được tin nhắn."`), xóa cứng, response `{"deleted": true}`.
- `POST /messages/{id}/react?emoji=<emoji>` — query `emoji` bắt buộc. Toggle: đã có reaction đó thì xóa và trả `{"reacted": false, "emoji": "..."}`, chưa có thì thêm và trả `{"reacted": true, "emoji": "..."}`.
- `GET /messages/{id}/reactions` — mảng `{emoji, count, users: ["ab****", ...], meReacted: bool}`; email người react bị che 2 ký tự đầu + `****`.
- `POST /messages/{id}/read` — chỉ người nhận (`403` `"Chỉ người nhận mới đánh dấu đã đọc."`); set `readAt` nếu chưa có; response `{"read": true, "readAt": "..."}`.

> [!NOTE]
> Trong `markRead`, nhánh xử lý `groupId` là **dead code** (chỉ có comment, không làm gì) — tin nhắn nhóm dùng cơ chế `lastReadAt` của `ChatGroupMember` chứ không dùng `readAt` từng tin.

### 10.3 Tìm kiếm, hội thoại, người dùng

- `GET /messages/search` — query bắt buộc `query`; tùy chọn `with` (tìm trong DM) hoặc `channel`. Lọc client-side trên tối đa 50 tin gần nhất của phạm vi đó, giới hạn 50 kết quả, **không** tìm toàn bộ lịch sử. Response là mảng `ChatMessage`.
- `GET /conversations` — mảng `{partnerEmail, partnerName, lastMessage, lastTime, isMine}`. Nguồn dữ liệu là 50 tin DM gần nhất của user (`findDirectMessagesForUser` giới hạn `LIMIT 50`), nên danh sách hội thoại cũng chỉ phản ánh 50 tin gần nhất.
- `GET /users?query=&role=` — `query` **bắt buộc có nội dung**, rỗng → trả `[]` (chống dump toàn bộ người dùng). Lọc theo tên/email chứa `query` (lowercase), tùy chọn `role` (`PLAYER`/`OWNER`/`ORGANIZER`/`ADMIN`), loại bỏ chính mình, tối đa 20 kết quả. Mỗi dòng `{name, email, role}`.

### 10.4 Chưa đọc, upload, phục vụ file

- `GET /unread-count` → `{"dm": <số tin DM chưa đọc>, "group": <tổng tin nhóm mới hơn lastReadAt>, "total": dm + group}`. Lưu ý: nhóm mà user chưa từng đọc (`lastReadAt = null`) **không** được cộng vào `group`.
- `POST /upload` — `multipart/form-data`, field `file`. Chỉ nhận `image/*`, `application/pdf`, `application/msword`, `.docx`; dung lượng ≤ 10 MB. File lưu tại `uploads/chat/yyyy/MM/dd/<uuid><ext>`. Response:
  ```json
  { "fileUrl": "/api/v1/chat/files/<uuid>.png", "fileType": "IMAGE", "fileName": "anh-goc.png", "fileSize": 204800 }
  ```
  Lỗi: file rỗng → `400`; sai loại → `400` `"Chỉ cho phép ảnh (jpg/png/webp) và PDF/DOC."`; quá lớn → `400` `"File quá lớn (tối đa 10MB)."`; lỗi ghi đĩa → `500`.
- `GET /files/{filename:.+}` — công khai, trả file `inline` kèm `Cache-Control: public, max-age=3600`; không tìm thấy → `404`. Hàm quét **đệ quy** toàn bộ `uploads/chat` để tìm file theo tên.

> [!NOTE]
> `POST /messages` hiện **không** đọc `fileUrl`/`fileType`/`fileName`/`fileSize` từ body (`ChatController.java:268-311`), nên file upload xong chưa thể gắn vào tin nhắn — `ChatMessage.fileUrl` không bao giờ được ghi. Cần sửa `send()` trước khi dùng endpoint upload cho tệp đính kèm chat (xem mục 16.4, điểm 17).

> [!WARNING]
> Tên file lưu trên đĩa chỉ là UUID + phần mở rộng, nhưng `fileUrl` **không** chứa đường dẫn ngày (`/api/v1/chat/files/<uuid>.png`), nên endpoint phục vụ phải quét đệ quy cả cây thư mục cho mỗi request — chi phí tăng theo số file. Ngoài ra thư mục `uploads/` nằm trong working directory của tiến trình, không phải volume bền vững: trên nền tảng deploy dạng ephemeral (Railway/Heroku) **file sẽ mất sau mỗi lần restart**, và không chia sẻ được khi chạy nhiều instance.

### 10.5 Kiểm duyệt (ADMIN)

- `GET /chat/admin/messages?channel=&limit=` — query `limit` mặc định 100 (kẹp 1–500), nhưng truy vấn nền `findTop50AllPublic()`/`findTop50ByChannel()` đã giới hạn 50 bản ghi, nên **`limit > 50` không bao giờ trả nhiều hơn 50 tin**.
- `DELETE /chat/admin/messages/{id}` — xóa cứng, không giới hạn tác giả; response `{"message": "Đã xóa tin nhắn.", "id": ...}`; không tồn tại → `404`.

---

## 11. Chat nhóm

`ChatGroupController.java` — prefix `/api/v1/chat-groups`, có `@PreAuthorize("isAuthenticated()")` **ở cấp class** nên mọi method đều yêu cầu đăng nhập. Ngoài ra mọi endpoint đọc/ghi tin đều kiểm tra tư cách thành viên trong code.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/chat-groups` | Đăng nhập | Nhóm tôi tham gia + số tin chưa đọc |
| POST | `/api/v1/chat-groups` | Đăng nhập | Tạo nhóm |
| GET | `/api/v1/chat-groups/{id}` | Thành viên | Chi tiết nhóm + thành viên |
| GET | `/api/v1/chat-groups/{id}/messages` | Thành viên | 50 tin mới nhất |
| POST | `/api/v1/chat-groups/{id}/messages` | Thành viên | Gửi tin |
| POST | `/api/v1/chat-groups/{id}/read` | Thành viên | Đánh dấu đã đọc |
| POST | `/api/v1/chat-groups/{id}/members` | Chủ nhóm | Thêm thành viên |
| DELETE | `/api/v1/chat-groups/{id}/members/{targetEmail}` | Chủ nhóm | Gỡ thành viên |
| DELETE | `/api/v1/chat-groups/{id}` | Chủ nhóm | Xóa nhóm |

Giới hạn: `MAX_MEMBERS = 30`, `MAX_NAME = 60`.

Phân biệt lỗi: nhóm không tồn tại → `404` `{"message": "Nhóm không tồn tại."}`; không phải thành viên → `403` `{"message": "Bạn không phải thành viên của nhóm này."}`; không phải chủ nhóm → `403` `{"message": "Chỉ chủ nhóm mới được thay đổi thành viên."}`.

### 11.1 Tạo nhóm — `POST /api/v1/chat-groups`

Body: `name` (**3–60 ký tự**), `description` (≤ 200 ký tự), `memberEmails` (mảng email, tùy chọn).

- Tên trùng (không phân biệt hoa thường) → `400` `{"message": "Đã có nhóm trùng tên \"X\". Hãy chọn tên khác."}`.
- Mô tả > 200 → `400` `{"message": "Mô tả tối đa 200 ký tự."}`.
- Người tạo thành `ownerEmail`/`ownerName` và tự động là thành viên `isOwner = true`; `memberEmails` được thêm ngay (bỏ qua email trùng/rỗng/chính mình, dừng khi đủ 30).
- Response `200` + summary: `id`, `name`, `description`, `ownerEmail`, `ownerName`, `isOwner`, `memberCount`, `createdAt`, `unread`, `lastMessage`, `lastSender`, `lastTime`.

### 11.2 Đọc và gửi tin

- `GET /{id}/messages` — 50 tin mới nhất, đảo thành **cũ → mới**; trả entity `ChatMessage`.
- `POST /{id}/messages` — body `{content* (≤ 500), replyToId}`; rỗng → `400` `{"message": "Tin nhắn không được rỗng."}`; quá 500 → `400`; người gửi tự động được cập nhật `lastReadAt`; response `200` + `ChatMessage`.
- `POST /{id}/read` — cập nhật `lastReadAt = now`; response `{"message": "Đánh dấu đã đọc.", "id": ...}` (chuỗi thực tế: `"Đã đánh dấu đã đọc."`).
- `GET /{id}` — summary + `members: [{email, name, isOwner, joinedAt}]`.

### 11.3 Quản lý thành viên

- `POST /{id}/members` — body `{"email": "..."}`; thiếu email → `400` `"Thiếu email thành viên."`; tự thêm mình → `400` `"Bạn đã là chủ nhóm."`; đã là thành viên → `400`; đủ 30 → `400` `"Nhóm đã đủ 30 thành viên."`; email không ứng với tài khoản nào → `400` `"Không tìm thấy tài khoản này."`; thành công `{"message": "Đã thêm thành viên.", "email": "..."}`.
- `DELETE /{id}/members/{targetEmail}` — chủ nhóm không tự gỡ mình (`400` `"Chủ nhóm không thể tự gỡ mình."`); không phải thành viên → `400`; thành công `{"message": "Đã gỡ thành viên.", "email": "..."}`.
- `DELETE /{id}` — xóa thành viên, tin nhắn của nhóm rồi xóa nhóm; response `{"message": "Đã xóa nhóm.", "id": ...}`.

> [!WARNING]
> `deleteGroup` chỉ xóa tối đa **50** tin nhắn gần nhất vì dùng `messageRepository.findTopMessagesByGroupId(id)` (câu query có `LIMIT 50`) rồi `deleteAll` (`ChatGroupController.java:347-349`). Tin nhắn cũ hơn **vẫn nằm lại** trong bảng `chat_messages` dưới dạng mồ côi (`groupId` trỏ tới nhóm đã xóa). Cần thay bằng truy vấn xóa theo `groupId` không giới hạn.

---

## 12. Căn tin & thông báo

### 12.1 Căn tin

`CanteenController.java` — prefix `/api/v1/canteen`, cần token (không thuộc `permitAll`).

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/canteen/items` | OWNER, ADMIN | Danh sách món |
| POST | `/api/v1/canteen/items` | OWNER, ADMIN | Thêm món |
| PUT | `/api/v1/canteen/items/{id}` | OWNER, ADMIN + chủ món | Sửa món |
| POST | `/api/v1/canteen/items/{id}/sell` | OWNER, ADMIN + chủ món | Bán N đơn vị |
| DELETE | `/api/v1/canteen/items/{id}` | OWNER, ADMIN + chủ món | Xóa món |

`CanteenItem` field: `id`, `pitchId`, `ownerId`, `name`, `unit`, `price`, `stock`, `soldToday`, `soldDate`, `createdAt`, `updatedAt`.

- `GET /items?pitchId=` — ADMIN không truyền `pitchId` → toàn bộ; có `pitchId` → lọc theo cụm sân (OWNER không sở hữu → `403` `{"message": "Bạn không phải chủ sân của cụm sân này."}`); OWNER không truyền `pitchId` → mọi món thuộc `ownerId` của mình.
- `POST /items` — body `{name*, pitchId*, price*, stock, unit}`; thiếu `name` → `400` `"Vui lòng nhập tên món."`; thiếu `pitchId` → `400` `"Vui lòng chọn cụm sân."`; `price <= 0`/không phải số → `400` `"Giá bán phải lớn hơn 0."`; cụm sân không tồn tại → `400`. Thành công `201` + entity.
- `PUT /items/{id}` — body `{name, price, stock, unit}`; chỉ ghi giá trị hợp lệ (`price > 0`, `stock >= 0`); không có quyền → `403` `"Bạn không có quyền sửa món của cụm sân này."`; không tìm thấy → `400` `"Không tìm thấy món này."`; response `200` + entity.
- `POST /items/{id}/sell` — body tùy chọn `{"qty": n}` (mặc định 1); thiếu tồn kho → `400` `"Tồn kho không đủ (còn X)."`; tự reset `soldToday` khi sang ngày mới; response `200` + entity sau khi trừ `stock` và cộng `soldToday`.
- `DELETE /items/{id}` — response `{"message": "Đã xoá món.", "id": ...}`.

### 12.2 Thông báo

`NotificationController.java` — prefix `/api/v1/notifications`. **Không** có `@PreAuthorize` ở cấp class; chỉ 2 method có `hasRole('ADMIN')`.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/notifications/mine` | Đăng nhập | 25 thông báo mới nhất dành cho tôi |
| PATCH | `/api/v1/notifications/{id}/read` | Đăng nhập + đúng người nhận | Đánh dấu đã đọc |
| POST | `/api/v1/notifications/broadcast` | ADMIN | Gửi thông báo theo nhóm vai trò |
| DELETE | `/api/v1/notifications/{id}` | ADMIN | Xóa thông báo |

`Notification` field: `id`, `targetRole`, `targetEmail`, `title`, `message`, `type`, `link`, `read`, `createdAt`.

- `GET /mine` — không token → `401` `{"message": "Chưa đăng nhập."}`. Lấy 50 bản ghi mới nhất rồi lọc (`NotificationService.mine`): nếu có `targetEmail` thì **chỉ** người đó thấy; nếu không có `targetEmail` thì thấy khi `targetRole = "ALL"` hoặc bằng role của mình; trả tối đa 25 bản ghi.
- `PATCH /{id}/read` — không tìm thấy → `400` `{"message": "Không tìm thấy thông báo."}`; không dành cho mình (khác role **và** khác email, không phải `ALL`) → `403` `{"message": "Bạn không có quyền thao tác thông báo này."}`; thành công `{"message": "Đã đánh dấu đã đọc.", "id": ...}`. ADMIN được phép đánh dấu mọi thông báo.
- `POST /broadcast` — body `{title*, message*, targetRole, link}`; thiếu tiêu đề/nội dung → `400` `{"message": "Thiếu tiêu đề hoặc nội dung."}`; `targetRole` chỉ nhận `ALL`/`PLAYER`/`OWNER`/`ORGANIZER`/`ADMIN` (sai → `ALL`); `type` của thông báo là `SYSTEM`; ghi audit log; response `{"message": "Đã gửi thông báo tới nhóm X.", "targetRole": "X"}`.
- `DELETE /{id}` — xóa + audit; không tồn tại → `400` `{"message": "Không tìm thấy thông báo."}`.

> [!NOTE]
> `PATCH /notifications/{id}/read` và `GET /notifications/mine` không có `@PreAuthorize`, nhưng vẫn bắt buộc đăng nhập vì `/api/v1/notifications/**` không nằm trong danh sách `permitAll` của `SecurityConfig`.

---

## 13. Quản trị (admin)

Ba controller dùng chung prefix `/api/v1/admin` nhưng **khác cấp quyền** — điểm rất dễ nhầm:

| Controller | Annotation cấp class | Phạm vi |
| --- | --- | --- |
| `AdminController` | `@PreAuthorize("hasRole('ADMIN')")` | 9 endpoint quản trị hệ thống |
| `AdminManageController` | `@PreAuthorize("hasRole('ADMIN')")` | 4 endpoint quản trị nâng cao |
| `OwnerAdminController` | `@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")` | 2 endpoint báo cáo/giá — **chủ sân cũng gọi được** |

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/overview` | ADMIN | KPI dashboard |
| GET | `/api/v1/admin/audit-logs` | ADMIN | Nhật ký thao tác admin |
| GET | `/api/v1/admin/users` | ADMIN | Danh sách người dùng (phân trang, tìm kiếm) |
| GET | `/api/v1/admin/users/legacy` | ADMIN | Danh sách người dùng (không phân trang) |
| GET | `/api/v1/admin/users/{id}/detail` | ADMIN | Hồ sơ + lịch sử của một người dùng |
| PATCH | `/api/v1/admin/users/{id}/status` | ADMIN | Khóa / mở khóa tài khoản |
| PATCH | `/api/v1/admin/users/{id}/role` | ADMIN | Đổi vai trò |
| DELETE | `/api/v1/admin/users/{id}` | ADMIN | Xóa tài khoản |
| GET | `/api/v1/admin/bookings` | ADMIN | Đơn đặt sân mới nhất |
| POST | `/api/v1/admin/bookings/{id}/cancel` | ADMIN | Hủy đơn + hoàn cọc |
| DELETE | `/api/v1/admin/matchmaking-posts/{id}` | ADMIN | Gỡ bài đăng chợ kèo |
| GET | `/api/v1/admin/insights` | ADMIN | Top cụm sân doanh thu, top khách |
| DELETE | `/api/v1/admin/maintenance/orphans` | ADMIN | Dọn kết quả/bàn thắng mồ côi |

### 13.1 Dashboard và nhật ký

- `GET /overview` → `totalUsers`, `totalPitches`, `totalTournaments`, `openTournaments`, `totalBookings`, `totalMatchmakingPosts`, `totalRevenue` (cộng `RevenueUtil.settledRevenue` của **mọi** booking trong bảng), `countByRole: {PLAYER, OWNER, ORGANIZER, ADMIN}`.
- `GET /audit-logs?group=&limit=` — `limit` mặc định 100, kẹp 1–300 (`AdminAuditService.recent`). Mỗi dòng: `id`, `adminEmail`, `adminName`, `actionGroup`, `action`, `target`, `detail`, `createdAt`. Các `actionGroup` xuất hiện trong code: `USER`, `TOURNAMENT`, `BOOKING`, `CHAT`, `NOTIFICATION`, `MATCHMAKING`.

### 13.2 Người dùng

- `GET /users?page=&size=&q=&role=` — `page` mặc định 0, `size` mặc định 20 (kẹp 1–200), `q` tìm trên `fullName + email + phone + level + area`, `role` lọc theo vai trò. Response: `{content: [User...], total, page, size, totalPages, countByRole}`. Phần tử `content` là entity `User` (trường `password` có `@JsonIgnore` nên **không** bị serialize).
- `GET /users/legacy` — toàn bộ người dùng, không phân trang, sắp `id` giảm dần; mỗi dòng `{id, fullName, email, phone, role, area, level, enabled, createdAt}` (`createdAt` là chuỗi ISO).
- `GET /users/{id}/detail` — `{"user": {id, fullName, email, phone, role, position, area, level, favoriteSport, enabled, createdAt, updatedAt, dominantFoot, jerseyNumber, height, weight, currentClub}, "bookingCount", "totalSpent", "matchmakingPosts": [...]}`. `totalSpent` = tổng `depositPaid` + `cashDue` (chỉ cộng `cashDue` khi `PLAYING`/`COMPLETED`) của các đơn không hủy; đơn được tra theo **SĐT**. Không tìm thấy → `400` `{"message": "Không tìm thấy người dùng."}`.
- `PATCH /users/{id}/status` — body **bắt buộc** có `enabled` (`true` mở khóa, `false` khóa); thiếu → `400` `{"message": "Thiếu trường 'enabled' (true = mở khóa, false = khóa)."}`; tự khóa mình → `400` `{"message": "Không thể tự khóa tài khoản của chính mình."}`; response `{"message", "id", "enabled"}`. Tài khoản bị khóa không đăng nhập được và token cũ mất hiệu lực ngay.
- `PATCH /users/{id}/role` — body `{"role": "PLAYER"|"OWNER"|"ORGANIZER"|"ADMIN"}`; giá trị lạ → `400` `{"message": "Vai trò không hợp lệ: X"}`; tự đổi role mình → `400`. Khi đổi sang `OWNER` → `profileCompleted = false` (bắt khai cụm sân), sang `PLAYER` → `profileCompleted = true`.
- `DELETE /users/{id}` — tự xóa mình → `400`; xóa ADMIN cuối cùng → `400` `{"message": "Không thể xóa quản trị viên cuối cùng."}`; response `{"message": "Đã xóa tài khoản X.", "id": ...}`.

### 13.3 Đơn đặt sân và kiểm duyệt

- `GET /bookings?limit=` — `limit` mặc định 100, kẹp 1–500; trả entity `Booking` sắp `id` giảm dần.
- `POST /bookings/{id}/cancel` — body tùy chọn `{"reason": "..."}` (mặc định `"Quản trị viên huỷ đơn do khiếu nại từ khách"`); đặt `status = "CANCELLED"`, `cancelledBy = "ADMIN"`, ghi audit; response `{"message": "Đã huỷ đơn #N. Khoản cọc sẽ được hoàn lại cho khách.", "refundAmount": <depositPaid>}`. Đơn không tồn tại → `400`.
- `DELETE /matchmaking-posts/{id}` — xóa bài đăng + audit; response `{"message": "Đã gỡ bài đăng khỏi chợ kèo.", "id": ...}`; không tồn tại → `400`.
- `GET /insights` — `topPitches: [{pitchId, pitchName, revenue}]` (top 5 theo doanh thu đã thu), `topCustomers: [{customerName, customerPhone, totalSpent, bookingCount}]` (top 5 theo `totalPrice`, gom theo SĐT).

> [!NOTE]
> `GET /admin/insights` tính `totalSpent` của khách bằng `booking.totalPrice` (toàn bộ giá trị đơn) trong khi `/overview` và `/revenue-report` dùng `RevenueUtil.settledRevenue` (cọc + tiền mặt đã thu). Hai màn hình có thể lệch số; đây là điểm không nhất quán trong code hiện tại.

### 13.4 Bảo trì dữ liệu

`DELETE /maintenance/orphans` — quét toàn bộ `match_results` và `goal_events`, xóa những bản ghi có `tournamentId` không còn tồn tại. Response `{"message": "Đã dọn X kết quả và Y bàn thắng mồ côi.", "matchResults": X, "goalEvents": Y}`.

> [!WARNING]
> Endpoint này xóa cứng dữ liệu và không có dry-run. Chạy nhầm khi bảng `tournaments` đang được nạp lại (ví dụ restore DB từng phần) sẽ xóa sạch kết quả thi đấu. Chỉ nên gọi khi đã sao lưu.

---

## 14. Báo cáo & email chủ sân, Health

### 14.1 Cấu hình giá và doanh thu (dưới prefix `/admin`)

`OwnerAdminController.java` — **annotation cấp class là `hasAnyRole('OWNER', 'ADMIN')`**, không phải ADMIN-only dù path nằm dưới `/api/v1/admin`.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/admin/revenue-report` | OWNER, ADMIN | Doanh thu 6 tháng + công suất |
| POST | `/api/v1/admin/dynamic-pricing` | OWNER, ADMIN + chủ cụm sân | Cập nhật bảng giá linh hoạt |

`GET /revenue-report` — chỉ tính các cụm sân của người gọi (ADMIN: toàn bộ). Response:

```json
{ "totalRevenueThisMonth": 12500000, "avgOccupancyRate": "37%", "totalBookings": 42,
  "peakHoursRate": "52%",
  "monthlyChart": [{ "month": "Tháng 5", "revenue": 9000000, "bookings": 30, "occupancyRate": 28 }],
  "generatedAt": "2026-10-25T11:22:38.123" }
```

- `monthlyChart` luôn có đúng 6 phần tử (5 tháng trước + tháng hiện tại); nhãn tháng khác năm sẽ kèm năm (`"Tháng 12 2025"`).
- `avgOccupancyRate`/`peakHoursRate` là **chuỗi có `%`**, không phải số.
- Công suất tháng = số sân con × số ca/ngày (`TimeSlotUtil.slotsPerDay`) × số ngày trong tháng.

`POST /dynamic-pricing` — body `{pitchId*, avgPricePerHour, peakPricePerHour, peakHours}`:

- Thiếu `pitchId` → `400` `{"status": "ERROR", "message": "Thiếu pitchId — không xác định được cụm sân cần áp dụng giá."}`; `pitchId` không phải số → `400`; không tìm thấy cụm sân → `404`.
- Không phải chủ cụm sân và không phải ADMIN → `403` `{"status": "ERROR", "message": "Bạn không có quyền sửa giá cụm sân này."}`.
- Giá `<= 0` → `400`; không parse được số → `400` `"Giá phải là số hợp lệ."`; `peakPricePerHour < avgPricePerHour` → `400` `"Giá giờ vàng không được thấp hơn giá giờ thường."`.
- Thành công: `{"status": "SUCCESS", "message": "Đã cập nhật bảng giá linh hoạt cho cụm sân \"X\".", "configApplied": {pitchId, pitchName, avgPricePerHour, peakPricePerHour, peakHours?}}`.

> [!NOTE]
> `peakHours` chỉ được **echo lại** trong `configApplied`, không được lưu vào DB (entity `Pitch` không có trường này). Giờ vàng thực tế luôn cố định theo `TimeSlotUtil.isPeakStart` (17h/18h/19h).

### 14.2 Báo cáo CSV và email

`OwnerReportController.java` — prefix `/api/v1/reports`, **không có annotation cấp class**, mỗi method tự khai `hasAnyRole('OWNER', 'ADMIN')`.

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/api/v1/reports/revenue.csv` | OWNER, ADMIN | Doanh thu theo tháng (CSV) |
| GET | `/api/v1/reports/bookings.csv` | OWNER, ADMIN | Chi tiết đơn đặt sân (CSV) |
| GET | `/api/v1/reports/summary.csv` | OWNER, ADMIN | Tổng quan cụm sân (CSV) |
| GET | `/api/v1/reports/email-status` | OWNER, ADMIN | Kiểm tra hệ thống email đã bật chưa |
| POST | `/api/v1/reports/send-email` | OWNER, ADMIN | Gửi báo cáo qua email (đính kèm CSV) |

Ba endpoint CSV đều trả `Content-Disposition: attachment` + `text/csv; charset=UTF-8` + BOM UTF-8, và **chỉ chứa dữ liệu của các cụm sân thuộc người gọi** (ADMIN: toàn bộ) — không thể xuất báo cáo cụm sân người khác.

| Endpoint | Query | Tên file | Nội dung |
| --- | --- | --- | --- |
| `revenue.csv` | `months` (mặc định 6, kẹp 1–24) | `bao-cao-doanh-thu.csv` | Mỗi tháng: `Tháng, Năm, Số đơn, Doanh thu, Số đơn hủy` |
| `bookings.csv` | `from`, `to` (mặc định đầu tháng → hôm nay) | `bao-cao-don-dat-san.csv` | `Ngày, Cụm sân, Sân, Khung giờ, Khách hàng, SĐT, Tổng tiền, Đã cọc, Còn lại, Trạng thái, Kênh, Mã` + dòng `TỔNG` |
| `summary.csv` | `days` (mặc định 30, kẹp 1–365) | `bao-cao-tong-quan.csv` | `Cụm sân, Số sân con, Giờ mở, Giờ đóng, Giá giờ, Giá giờ vàng, Tổng đơn, Tổng doanh thu` + tỷ lệ lấp đầy ước tính |

`GET /email-status` → `{"enabled": true|false, "message": "Hệ thống đã bật gửi email." | "Hệ thống chưa bật gửi email (thiếu MAIL_ENABLED / MAIL_USERNAME / MAIL_PASSWORD)."}`.

`POST /send-email` — body `{toEmail*, type: "revenue"|"bookings"|"summary", months, days, from, to}`:

- `toEmail` không hợp lệ → `400` `{"message": "Địa chỉ email nhận báo cáo không hợp lệ."}`.
- `type` khác ba giá trị trên → mặc định `revenue`.
- Gửi thất bại → `400` kèm gợi ý: nếu `isReady()` → `"Không gửi được email. Kiểm tra lại cấu hình SMTP (MAIL_USERNAME / MAIL_PASSWORD)."`, ngược lại → `"Hệ thống chưa bật gửi email. Hãy đặt MAIL_ENABLED=true và cấu hình SMTP trong biến môi trường."`.
- Thành công: `{"message": "Đã gửi báo cáo tới X.", "filename": "bao-cao-doanh-thu.csv", "toEmail": "X"}`.
- Email gửi **đồng bộ** trong request (khác luồng đặt sân dùng thread nền) nên thời gian phản hồi phụ thuộc SMTP.

> [!NOTE]
> Cấu hình mail (`application.yml`): `MAIL_ENABLED` (mặc định `false`), `MAIL_HOST` (`smtp.gmail.com`), `MAIL_PORT` (`587`), `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_FROM_NAME`. Với Gmail phải dùng "mật khẩu ứng dụng" 16 ký tự, không dùng mật khẩu đăng nhập thường.

### 14.3 Health

| Method | Path | Quyền | Mô tả ngắn |
| --- | --- | --- | --- |
| GET | `/` | Công khai | Health check (kiêm `/health` và `/api/v1/health`) |

`HealthController.java` map ba path `"/"`, `"/health"`, `"/api/v1/health"` vào cùng một handler:

```json
{ "status": "UP", "service": "Turfzone-backend-core", "timestamp": 1761358958000 }
```

`timestamp` là epoch milliseconds (`System.currentTimeMillis()`). Endpoint này không kiểm tra kết nối DB — vẫn trả `UP` kể cả khi MySQL đang chết (hữu ích để kiểm tra service đã bind cổng, không dùng để kiểm tra sức khỏe dữ liệu).

---

## 15. Ma trận phân quyền

Suy ra từ `SecurityConfig` + `@PreAuthorize` + các hàm kiểm tra chủ sở hữu trong code. `✅` = được phép, `❌` = bị chặn, `◐` = được nhưng chỉ trên dữ liệu của chính mình / đã bị che PII.

| Nhóm endpoint | Khách (không token) | PLAYER | OWNER | ORGANIZER | ADMIN |
| --- | --- | --- | --- | --- | --- |
| 3. Auth — register/login/google | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3. Auth — `GET`/`PUT /auth/me` | ❌ (401) | ✅ | ✅ | ✅ | ✅ |
| 4. Sân — đọc (`GET /pitches`, `/{id}`, `/{id}/matrix`, `/{id}/stats`) | ✅ (PII bị che) | ✅ | ✅ | ✅ | ✅ |
| 4. Sân — ghi (`POST`, `PUT`, `DELETE /{id}`, `add-court`, `operating-hours`, `price`) | ❌ | ❌ | ◐ (chỉ sân mình) | ❌ | ✅ |
| 4. Sân — `my-pitches` | ❌ (401) | ◐ (rỗng) | ◐ (sân mình) | ◐ (rỗng) | ◐ (sân mình) |
| 4. Sân — `clear-all` | ❌ | ❌ | ❌ | ❌ | ✅ |
| 4. Sân — `simulate-bookings` (POST/DELETE) | ❌ | ❌ | ◐ (sân mình) | ❌ | ✅ |
| 5. Đặt sân — `book` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 5. Đặt sân — `book-offline` | ❌ | ❌ | ◐ (sân mình) | ❌ | ✅ |
| 5. Đặt sân — `GET /{id}/bookings`, `bookings/search` | ❌ | ◐ (đơn của mình, PII che) | ◐ (sân mình, đầy đủ) | ◐ | ✅ |
| 5. Đặt sân — `check-in`, `cancel`, `DELETE booking` | ❌ | ❌ | ◐ (đơn thuộc sân mình) | ❌ | ✅ |
| 5. Đặt sân — `cancel-by-customer` | ❌ | ◐ (SĐT phải trùng) | ◐ | ◐ | ◐ |
| 6. Giải đấu — đọc (`GET`, `/{id}`, `bracket`, `scorers`, `scorers/top`, `access`) | ✅ (PII bị che) | ✅ | ✅ | ✅ | ✅ |
| 6. Giải đấu — tạo/sửa/bốc thăm/xếp lịch/kết quả/duyệt đội/trọng tài/lời mời | ❌ | ❌ | ✅ | ✅ | ✅ |
| 6. Giải đấu — `PATCH /{id}/status`, `DELETE /{id}` | ❌ | ❌ | ❌ | ❌ | ✅ |
| 6. Giải đấu — `POST /{id}/register` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 6. Giải đấu — `fill-teams`, `simulate-results`, `simulated-teams` | ❌ | ❌ | ✅ | ✅ | ✅ |
| 7. Báo cáo & email giải | ❌ | ❌ | ❌ | ✅ | ✅ |
| 8. Cộng đồng — đọc (`matchmaking-posts`, `urgent-market`, `leaderboard`, `reviews/{team}`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8. Cộng đồng — ghi (`POST` kèo, `accept`, `reviews`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| 9. CLB — `GET /clubs/{id}` | ❌ | ✅ | ✅ | ✅ | ✅ |
| 9. CLB — tạo, `mine`, và mọi thao tác quản lý | ❌ | ◐ (phải là đại diện CLB) | ◐ | ◐ | ◐ |
| 10. Chat — đọc kênh, gửi tin, reaction, upload | ❌ | ✅ | ✅ | ✅ | ✅ |
| 10. Chat — `pin`/`DELETE` tin nhắn | ❌ | ◐ (chỉ tin của mình) | ◐ | ◐ | ◐ |
| 10. Chat — `admin/messages` (GET/DELETE) | ❌ | ❌ | ❌ | ❌ | ✅ |
| 10. Chat — `GET /chat/files/**` | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11. Chat nhóm — danh sách, tạo nhóm | ❌ | ✅ | ✅ | ✅ | ✅ |
| 11. Chat nhóm — đọc/gửi tin | ❌ | ◐ (phải là thành viên) | ◐ | ◐ | ◐ |
| 11. Chat nhóm — thêm/gỡ thành viên, xóa nhóm | ❌ | ◐ (phải là chủ nhóm) | ◐ | ◐ | ◐ |
| 12. Căn tin — toàn bộ | ❌ | ❌ | ◐ (cụm sân/món của mình) | ❌ | ✅ |
| 12. Thông báo — `mine`, `{id}/read` | ❌ | ◐ (chỉ thông báo của mình) | ◐ | ◐ | ◐ (đọc được của mọi người) |
| 12. Thông báo — `broadcast`, `DELETE /{id}` | ❌ | ❌ | ❌ | ❌ | ✅ |
| 13. Admin — toàn bộ 13 endpoint | ❌ | ❌ | ❌ | ❌ | ✅ |
| 14. `GET /admin/revenue-report` | ❌ | ❌ | ◐ (sân mình) | ❌ | ✅ (toàn bộ) |
| 14. `POST /admin/dynamic-pricing` | ❌ | ❌ | ◐ (cụm sân mình) | ❌ | ✅ |
| 14. `/reports/**` (CSV, email) | ❌ | ❌ | ◐ (sân mình) | ❌ | ✅ (toàn bộ) |
| 14. Health (`/`, `/health`, `/api/v1/health`) | ✅ | ✅ | ✅ | ✅ | ✅ |

Ghi chú suy luận quan trọng:

- `ORGANIZER` **không** có quyền trên cụm sân (nhóm 4), căn tin (nhóm 12), báo cáo chủ sân (nhóm 14) và admin (nhóm 13).
- `OWNER` **có** quyền tạo/sửa giải và mọi thao tác vận hành giải (nhóm 6 dùng chung `hasAnyRole('ORGANIZER','OWNER','ADMIN')`), nhưng **không** đổi được trạng thái giải (`PATCH /status`) và **không** xóa được giải (`DELETE /{id}`).
- `PLAYER` chỉ có quyền ghi ở nhóm 5 (`book`, `cancel-by-customer`), nhóm 6 (`register`), nhóm 8, 9, 10, 11, 12 (thông báo của mình).
- Không có endpoint nào phân biệt "chủ sân của giải" hay "BTC của giải": mọi `ORGANIZER`/`OWNER` đều thao tác được trên **mọi** giải (xem cảnh báo ở mục 6.13).

---

## 16. Ghi chú tích hợp

### 16.1 Cách frontend gọi API

`frontend/src/lib/api.ts`:

- Base URL: `NEXT_PUBLIC_API_BASE_URL` → `NEXT_PUBLIC_API_URL` → `production ? PROD : http://localhost:8080` (`api.ts:9-12`). Hàm `apiUrl(path)` ghép base + path.
- Token lưu trong **`sessionStorage`** với key `Turfzone_token` và (tùy chọn) `Turfzone_token_<ROLE>`; `getAuthToken(role?)`, `setAuthToken(token, role?)`, `removeAuthToken()` (`api.ts:23-55`). Đăng xuất xóa mọi key bắt đầu bằng `Turfzone_token`.
- `apiRequest<T>(endpoint, options)` (`api.ts:168-215`): tự gắn `Content-Type: application/json`, tự gắn `Authorization: Bearer <token>` nếu có token, `credentials: 'include'`, `cache: 'no-store'`.
- Timeout mặc định `15000 ms` qua `fetchWithTimeout` (AbortController); khi hết hạn ném `"Máy chủ phản hồi quá chậm. ..."` (`api.ts:79-131`).
- Đọc lỗi: `data?.message || data?.error || "Lỗi yêu cầu: <status> <statusText>"`, và gắn `err.status` để phân biệt 401/403 với lỗi mạng (`api.ts:202-211`). **Đây là lý do bắt buộc phải giữ đúng một trong hai key `message`/`error`** khi thêm endpoint mới.
- `fetchWithTimeout` **cũng tự gắn token** cho các lời gọi `fetch` trực tiếp (`api.ts:109-120`) — cần thiết vì backend che `captainPhone`/`captainEmail` khi request không có token.
- `ensureLoggedIn(action)` chặn trước ở client để không phải nhận 401 khó hiểu (`api.ts:62-66`).

Khuyến nghị khi thêm endpoint mới: giữ nguyên một trong hai key lỗi, luôn trả `200/201` với body JSON (trừ CSV), và không đổi tên field đã có vì frontend đọc trực tiếp theo tên.

### 16.2 Endpoint chưa có màn hình sử dụng

Cách kiểm tra: quét toàn bộ `frontend/src` cho từng path, **kể cả trường hợp ghép chuỗi** (`'/api/v1/x/' + id + '/y'`). Grep thô theo một chuỗi con rất dễ kết luận sai — chính là cái bẫy đã gặp khi soạn mục này.

Các endpoint **không tìm thấy** tham chiếu nào trong frontend:

| Endpoint | Ghi chú |
| --- | --- |
| `GET /api/v1/community/urgent-market` | Chợ kèo được dựng từ `matchmaking-posts` |
| `DELETE /api/v1/pitches/clear-all` | Thao tác phá hủy, cố ý không gắn UI |
| `POST /api/v1/admin/dynamic-pricing` | Trùng chức năng với `PUT /pitches/{id}/price` đang dùng |
| `POST /api/v1/tournaments/{id}/notify-team/approve` | Chưa có nút gửi email duyệt đội |
| `POST /api/v1/tournaments/{id}/notify-team/reject` | Chưa có nút gửi email từ chối |
| `POST /api/v1/tournaments/{id}/notify-schedule` | Chưa có nút gửi email lịch thi đấu |
| `GET /api/v1/tournaments/{id}/report.csv` | Chưa có nút xuất CSV của giải |
| `DELETE /api/v1/notifications/{id}` | UI chỉ đánh dấu đã đọc, không xóa thông báo |
| `GET /` và `/health` | Chỉ là alias của health check; frontend chỉ gọi `/api/v1/health` (`frontend/src/lib/backendStatus.ts:79`) để bật banner mất kết nối |

> [!NOTE]
> Các endpoint sau **đã** được frontend dùng dù rất dễ bị đánh dấu nhầm là "chưa dùng", vì URL được ghép chuỗi: `/api/v1/admin/audit-logs` (`AdminAuditLogs.tsx`), `/api/v1/admin/maintenance/orphans` (`adminService.ts:243`), `DELETE /api/v1/pitches/simulate-bookings` (`adminService.ts:187`), `/api/v1/chat/upload` (`groupChat.ts:173`), `/api/v1/chat/admin/messages` (`AdminChatModeration.tsx:42`), `/api/v1/tournaments/{id}/scorers` và `/bracket` (`tournamentService.ts:473,603`), `PATCH /api/v1/tournaments/{id}/status` (`adminService.ts:223`), `/api/v1/reports/email-status` và `send-email` (`OwnerReportExport.tsx:91,118`).

### 16.3 Endpoint chỉ dùng cho demo/seed và cảnh báo bảo mật

| Endpoint | Quyền hiện tại | Rủi ro |
| --- | --- | --- |
| `POST /api/v1/pitches/simulate-bookings` | `hasAnyRole('ADMIN','OWNER')` + chủ sân | Ghi hàng trăm đơn vào bảng `bookings` thật, mã `SIM-` |
| `DELETE /api/v1/pitches/simulate-bookings` | `hasAnyRole('ADMIN','OWNER')` + chủ sân | Xóa cứng mọi đơn `SIM-` |
| `POST /api/v1/tournaments/{id}/fill-teams` | `hasAnyRole('ADMIN','ORGANIZER','OWNER')` | Sinh đội ảo vào giải thật, xóa bracket hiện có |
| `DELETE /api/v1/tournaments/{id}/simulated-teams` | `hasAnyRole('ADMIN','ORGANIZER','OWNER')` | Xóa đội ảo **và** toàn bộ kết quả + bàn thắng của giải |
| `POST /api/v1/tournaments/{id}/simulate-results` | `hasAnyRole('ADMIN','ORGANIZER','OWNER')` | Ghi kết quả giả, có thể tự đặt giải thành `COMPLETED` |
| `DELETE /api/v1/pitches/clear-all` | `hasRole('ADMIN')` | Xóa **toàn bộ** cụm sân |

> [!WARNING]
> Nhóm endpoint demo nêu trên **không** có cờ cấu hình hay kiểm tra profile môi trường; chúng hoạt động y như endpoint nghiệp vụ trên production. Ba điểm cần xử lý trước khi bàn giao:
> 1. `fill-teams`, `simulate-results`, `simulated-teams` cho phép **bất kỳ** tài khoản `ORGANIZER`/`OWNER` thao tác trên **bất kỳ** giải nào (không có kiểm tra chủ giải — entity `Tournament` không có `organizerId`).
> 2. `simulate-bookings` (POST) của OWNER được giới hạn đúng theo `ownerId`, nhưng ADMIN có thể sinh dữ liệu giả cho mọi cụm sân mà không có giới hạn số lượng ngoài `pastDays`/`futureDays`/`perDay` (tối đa 60/60/30 → có thể tạo hàng nghìn bản ghi mỗi lần gọi).
> 3. `clear-all` và `maintenance/orphans` xóa cứng, không có xác nhận hai bước ở backend. Nếu bắt buộc giữ lại cho demo, nên bọc bằng `@Profile("!prod")` hoặc chặn theo `ALLOWED_ORIGINS`/IP ở gateway.

### 16.4 Các điểm không nhất quán phát hiện khi đọc mã nguồn

1. **Hai định dạng lỗi**: `"message"` (đa số) và `"error"` (`CommunityController`, `POST /tournaments/{id}/register`), cộng thêm `{"status":"ERROR"}` riêng cho `dynamic-pricing`. Client buộc phải đọc cả hai key.
2. **`AuthService.updateUserProfile`**: khối gán `profileCompleted` bị lồng trong `if (req.getArea() != null)` (`AuthService.java:196-202`) — gửi `profileCompleted: true` mà không kèm `area` thì cờ không được lưu.
3. **`cancel-by-customer`**: tính `cancelOwnerEmail` nhưng gọi `notify("OWNER", ...)` với `targetEmail = null` (`PitchBookingController.java:1325-1338`) → mọi OWNER nhận tên + SĐT khách.
4. **`POST /pitches/{id}/book`**: không gửi email/thông báo (chỉ `book-offline` gửi), và không đối chiếu SĐT khách với tài khoản đang đăng nhập.
5. **`GET /pitches/{id}/matrix`** có tác dụng phụ ghi DB: tự tạo 2 sân con mặc định khi `pitchTypes` rỗng (`PitchBookingController.java:282-286`).
6. **Mã HTTP không thống nhất**: `POST /tournaments` trả `200` (không phải `201`); `POST /community/matchmaking-posts` trả `200`; `GET /tournaments/{id}/scorers` trả `400` khi giải không tồn tại (đáng lẽ `404`); `GET /clubs/{id}` trả `400` khi CLB không tồn tại; `DELETE /tournaments/{id}/referees/{refId}` luôn trả `200` kể cả khi không có gì bị xóa.
7. **`ChatController.list`** (`GET /chat/messages`) không có `@PreAuthorize` nhưng bị `SecurityConfig` buộc đăng nhập — comment trong file mô tả "phòng chat công khai", khách không đọc được.
8. **`deleteGroup`** chỉ xóa 50 tin nhắn mới nhất (`ChatGroupController.java:347-349`) → tin cũ mồ côi.
9. **`GET /chat/admin/messages`**: tham số `limit` tối đa 500 nhưng truy vấn nền chỉ trả 50 bản ghi.
10. **`GET /admin/insights`** tính chi tiêu khách bằng `totalPrice` còn `/admin/overview` và `/admin/revenue-report` dùng `RevenueUtil.settledRevenue` → số liệu lệch nhau giữa các màn hình.
11. **`DELETE /pitches/{id}` và `DELETE /pitches/clear-all`** không xóa đơn đặt sân → đơn mồ côi vẫn được tính vào `totalRevenue` của `/admin/overview`.
12. **`POST /tournaments/{id}/teams/{teamName}/approve`** tra tên đội bằng `@PathVariable` và so sánh `equalsIgnoreCase`, trong khi `notify-team/approve` (nhóm 7) nhận `teamName` qua **query param** và so sánh `equals` phân biệt hoa thường — dễ gây lỗi 400 khó hiểu khi tên đội có khác biệt hoa/thường.
13. **Không có phân quyền theo từng giải**: `Tournament` không có trường chủ sở hữu/BTC, nên mọi `ORGANIZER`/`OWNER` đều sửa được mọi giải (xem mục 6.13).
14. **`GET /api/v1/pitches` công khai trả entity đầy đủ**, bao gồm `bankCode`/`bankAccount`/`accountName` của chủ sân.
15. **Upload chat** lưu vào thư mục tương đối `uploads/chat/...` trong working directory, không phải volume bền vững; `fileUrl` không chứa đường dẫn ngày nên endpoint phục vụ phải quét đệ quy toàn bộ cây thư mục.
16. **`NotificationService.mine`** chỉ lấy 50 bản ghi mới nhất toàn hệ thống rồi mới lọc theo người dùng, sau đó giới hạn 25 — nếu hệ thống phát nhiều thông báo `ALL`, thông báo riêng của một user có thể bị đẩy ra khỏi 50 bản ghi đầu.
17. **Đính kèm file trong chat chưa khép kín vòng**: `POST /chat/upload` trả `fileUrl`/`fileType`/`fileName`/`fileSize`, nhưng `POST /chat/messages` chỉ đọc `content`, `recipientEmail`, `recipientName`, `channel`, `replyToId` (`ChatController.java:268-311`) — **không** đọc các field file, nên `ChatMessage.fileUrl` không bao giờ được ghi. Muốn gửi file phải sửa `send()` để nhận thêm 4 field này.
18. **`GET /chat/users?role=...` luôn trả rỗng nếu thiếu `query`** (`ChatController.java:236-238`): sau khi siết chống liệt kê người dùng, endpoint trả `[]` khi `q` rỗng. Nhưng `BusinessContacts` (kênh liên lạc B2B Chủ sân ↔ Ban tổ chức) chỉ gọi `?role=ORGANIZER` mà không có `query` (`BusinessContacts.tsx:72-74`), nên khối "Liên hệ Ban Tổ Chức" / "Liên hệ Chủ Sân" **luôn hiện trạng thái rỗng** dù tài khoản đối tác tồn tại. Cách sửa đúng: cho phép lọc theo `role` khi không có `query` nhưng chỉ với `OWNER`/`ORGANIZER`/`ADMIN` và giới hạn 20 dòng.
