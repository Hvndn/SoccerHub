# Walkthrough — Đợt cập nhật tài liệu

Bản ghi lại **đã làm gì, kiểm chứng ra sao, còn gì chưa xong** trong đợt viết tài liệu cho Turfzone. Mục đích: người sau đọc là biết tài liệu này đáng tin đến đâu, và biết phải cập nhật chỗ nào khi code đổi.

- Thời điểm: 2026-10-25
- Phạm vi: toàn bộ monorepo `SoccerHub` (backend, AI service, frontend, mobile, hạ tầng)
- Đối chiếu mã nguồn: nhánh `main`, commit `11857aa`, cộng các thay đổi chưa commit ở module CLB (`ClubController.java`, `ClubMemberRepository.java`, `ClubRepository.java`)

## 1. Vấn đề của bộ tài liệu trước

| Vấn đề | Bằng chứng |
|---|---|
| README chỉ mô tả 3 dịch vụ, bỏ sót `mobile-app` và các phân hệ đã có trong code | `mobile-app/`, `CanteenController`, `ClubController`, `ChatController`, `NotificationController`, `AdminController` |
| Thông tin cũ sai so với code | Java 21 (thực tế `pom.xml` = 17); database `Turfzone_db` (mặc định thật `soccerhub_db`); "dark mode hỗ trợ đầy đủ" (thực tế `ThemeProvider` chỉ trả `light`, 0 class `dark:`) |
| Không có tài liệu API | 131 mapping trong 16 controller, chưa từng được liệt kê đầy đủ |
| Không có mô tả mô hình dữ liệu | 19 entity + 1 enum, quan hệ đều là khoá ngoại logic |
| Không có mô tả tầng frontend | 61 component, 18 module `lib`, 3 cơ chế đồng bộ tab, 8 file component > 50 KB |
| Tài liệu hạ tầng nằm rải trong README, thiếu bảng biến môi trường và quy trình sự cố | `railway.json`, `render.yaml`, `nixpacks.toml`, `.github/workflows/ci-cd.yml` |

## 2. Tài liệu đã tạo

| File | Dòng | Nội dung |
|---|---|---|
| [README.md](./README.md) | 59 | Mục lục bộ tài liệu, đường đọc theo vai trò, quy ước viết, phạm vi chưa bao phủ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 417 | 4 thành phần, sơ đồ tổng thể, 5 luồng dữ liệu, mô hình bảo mật 3 lớp, 10 quyết định kiến trúc, 8 nhóm nợ kỹ thuật |
| [API.md](./API.md) | 1388 | 131 endpoint (bảng tổng hợp + chi tiết theo 14 nhóm), ma trận phân quyền, 15 điểm không nhất quán |
| [DATABASE.md](./DATABASE.md) | 900 | 18 entity + 1 embeddable, ERD 23 quan hệ, từ điển trường, 11 nhóm quy tắc nghiệp vụ, 11 rủi ro dữ liệu |
| [FRONTEND.md](./FRONTEND.md) | 678 | Route, tầng dữ liệu, auth, 61 component, luồng nghiệp vụ, design system, vi phạm quy ước UI |
| [AI-SERVICE.md](./AI-SERVICE.md) | 448 | 4 endpoint, schema Pydantic, công thức chấm điểm, tích hợp proxy, cold start |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 392 | 33 biến môi trường, Railway/Render/Vercel/Expo/CI, smoke test 10 bước, 19 tình huống sự cố |

Ngoài ra cập nhật [README.md gốc](../README.md): sửa 3 thông tin sai, thêm `mobile-app`, 4 phân hệ còn thiếu, bảng liên kết tài liệu, ghi chú `run.bat` hai cổng.

## 3. Cách xác minh

Không dùng lại con số trong README cũ; mọi con số đều đếm từ code bằng script.

| Kiểm tra | Cách làm | Kết quả |
|---|---|---|
| Độ phủ API | Trích mapping từ 16 controller (kể cả 7 mapping khai báo trần `@GetMapping`/`@PostMapping`), đối chiếu với nội dung `docs/API.md` | **131/131** endpoint có mặt |
| Link nội bộ | Quét toàn bộ link tương đối trong `docs/*.md` và `README.md`, kiểm tra cả anchor | **0** link hỏng |
| Bảng/bố cục markdown | Kiểm tra số cột từng bảng, code fence chẵn, heading không nhảy cấp | **0** lỗi (3 cảnh báo giả do dấu `\|` escape trong ô bảng) |
| Encoding | Đọc byte, tìm dấu hiệu mojibake (chuỗi ký tự Latin bị lặp dấu do giải mã sai bảng mã) | **0** file lỗi (một file từng lỗi, đã ghi lại) |
| Số liệu trong tài liệu | Đếm lại: 16 controller, 131 mapping, 19 entity + 1 enum, 18 repository, 61 component, 18 file `lib`, 6 `page.tsx` | Khớp |
| Công thức AI | Chạy `recommendation.py` / `form_matchmaking.py` với input mẫu | Khớp ví dụ: 92.19 / 78.54; thứ hạng A→B→E, loại C và D |
| Khẳng định nghiệp vụ | Đọc trực tiếp code tại các dòng được trích dẫn (ví dụ `TeamFormService`, `RevenueUtil`, `computeSlotPrice`, `findByIdForUpdate`, `AuthService` dòng 196-202, `PitchBookingController` dòng 1334-1338) | Khớp |
| Phân quyền | Đọc annotation cấp class **và** cấp method (bẫy: `AdminController` đặt `@PreAuthorize` ở cấp class) | Khớp |

Hai lỗi phát hiện và sửa trong quá trình kiểm:

1. `docs/API.md` mục 16.2 (endpoint chưa dùng) ban đầu dựa trên grep chuỗi đơn giản nên liệt kê nhầm các endpoint gọi bằng cách ghép chuỗi (`/admin/audit-logs`, `/chat/admin/messages`, `DELETE /pitches/simulate-bookings`, `/chat/upload`…). Đã viết lại mục này kèm danh sách "dễ đánh dấu nhầm".
2. `docs/FRONTEND.md` từng bị mojibake do ghi lại bằng PowerShell (`Get-Content`/`Set-Content` sai bảng mã). Đã ghi lại toàn bộ bằng UTF-8 và kiểm tra ở mức byte.

## 4. Phát hiện đáng chú ý khi đọc code

Những điểm dưới đây **có trong code**, không phải đề xuất:

- `GET /api/v1/pitches` công khai trả nguyên entity `Pitch`, gồm `bankCode` / `bankAccount` / `accountName` của chủ sân.
- `cancel-by-customer` tính `cancelOwnerEmail` nhưng lại gọi `notify("OWNER", ..., null)` → thông báo đi cho **mọi** chủ sân thay vì chủ sân của cụm sân.
- `AuthService.updateUserProfile`: cờ `profileCompleted` bị lồng trong `if (req.getArea() != null)` → gửi cờ mà không kèm `area` thì không lưu.
- `GET /pitches/{id}/matrix` có tác dụng phụ: tự tạo 2 sân con mặc định khi `pitchTypes` rỗng.
- `fill-teams` / `simulate-results` / `simulated-teams` không kiểm tra chủ giải — mọi ORGANIZER/OWNER thao tác được trên mọi giải (entity `Tournament` không có trường chủ sở hữu).
- Tên file `realtimeService.ts` gây hiểu nhầm: không có WebSocket/SSE; đồng bộ là `CustomEvent` + `BroadcastChannel` + `localStorage` + polling 4–60 giây.
- `ai-service`: `form_points()` là dead code; `HTTPException`, `Dict/Any` import thừa; `requirements.txt` không ghim phiên bản.
- Thư mục upload chat nằm trên filesystem container → mất khi Railway redeploy.
- Không có test tự động ở bất kỳ tầng nào; CI chỉ build/`py_compile`.

## 5. Chưa kiểm chứng được (ghi rõ trong tài liệu)

- Giới hạn `maxDuration = 60` của Vercel chỉ có hiệu lực ở gói Pro — suy luận từ tài liệu Vercel, không thử được trong repo.
- Rủi ro `next.config.js` đổi `distDir` theo `PORT` trên Vercel — suy luận, chưa dựng lại môi trường Vercel.
- Các thông số cold start Render (30–60 giây) là quan sát/ước lượng, không đo tự động.
- Hành vi mobile app chỉ đọc ở mức tổng quan (`mobile-app/App.tsx`), không kiểm thử trên thiết bị.

## 6. Cách giữ tài liệu không lỗi thời

Checklist tối thiểu khi thay đổi code:

| Thay đổi | Phải cập nhật |
|---|---|
| Thêm/sửa/xóa endpoint | `docs/API.md` (bảng tổng hợp, mục chi tiết, ma trận phân quyền) |
| Thêm entity/cột/quan hệ | `docs/DATABASE.md` (ERD + từ điển + quy tắc nếu có) |
| Thêm route/component/service | `docs/FRONTEND.md` (bản đồ route, bảng service, component) |
| Đổi thuật toán AI | `docs/AI-SERVICE.md` (công thức + ví dụ số phải tính lại) |
| Thêm biến môi trường / đổi nền tảng | `docs/DEPLOYMENT.md` (bảng biến) và `docs/ARCHITECTURE.md` mục 8 |
| Đổi cấu trúc dịch vụ, thêm tầng mới | `docs/ARCHITECTURE.md` (sơ đồ + ADR mới) |
| Sửa lỗi lớn đã ghi trong `ERRORS.md` | Ghi chú vào mục 4 nếu là hành vi đáng lưu ý |

Nguyên tắc: **một sự thật chỉ viết ở một nơi**; nơi khác trỏ link. Nếu phát hiện hai tài liệu nói khác nhau, đó là lỗi tài liệu, không phải "quan điểm khác".

## 7. Việc nên làm tiếp (chưa làm trong đợt này)

1. Sinh `openapi.yaml` từ `docs/API.md` hoặc từ code để dùng Swagger UI và sinh client.
2. Thêm test: unit cho `RevenueUtil` / `TimeSlotUtil` / `TeamFormService`, integration cho luồng đặt sân, test cho hai hàm AI.
3. Thay `ddl-auto=update` bằng Flyway/Liquibase, chuyển `db_migration_new.sql` thành migration có phiên bản.
4. Chuyển upload chat sang object storage để không mất file khi redeploy.
5. Tách các component > 50 KB (`AdminDashboard`, `TournamentOrganizerPortal`, `TournamentBracket`) và thay hex màu rải rác bằng token `brand`.
6. Bổ sung phân quyền theo chủ giải cho `Tournament` và chặn endpoint demo trên production.
