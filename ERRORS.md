# ERRORS.md - Error Tracking & Learning

## [2026-10-06 00:25] - Next.js CSS Cache Collision & Admin Tab Routing

- **Type**: Integration / Process
- **Severity**: Medium
- **File**: `frontend/src/app/page.tsx:198`
- **Agent**: Antigravity Orchestrator (Thần)
- **Root Cause**: 
  1. Khi chạy `npm run build` kiểm tra cú pháp trong khi dev server đang chạy đồng thời, thư mục `.next` bị ghi đè các production chunk hashes gây xung đột CSS manifest, khiến trình duyệt hiển thị giao diện HTML thô không có CSS.
  2. Tab "admin" trong `page.tsx` bị gán nhầm sang `ActivitySchedule` thay vì `AdminDashboard`.
- **Error Message**: 
  ```
  Browser renders unstyled raw HTML and shows match ticket schedule instead of stadium owner console.
  ```
- **Fix Applied**: 
  1. Đã dọn dẹp toàn bộ process cũ trên port 3000, xóa triệt để thư mục cache `frontend/.next`, và khởi động lại dev server sạch.
  2. Sửa `page.tsx` để `activeTab === "admin"` render chuẩn xác `AdminDashboard`.
- **Prevention**: Tuyệt đối không chạy đồng thời `npm run build` khi server dev `next dev` đang hoạt động trong cùng thư mục `frontend`.
- **Status**: Fixed

## [2026-10-16 13:18] - Railway Crash Loop: Unhandled Seeding Exception & JVM OOM Killer

- **Type**: Runtime / Integration
- **Severity**: High
- **File**: `backend-core/src/main/java/com/Turfzone/config/DataInitializer.java:35`
- **Agent**: Antigravity Orchestrator (Thần)
- **Root Cause**: 
  1. `DataInitializer.run()` (CommandLineRunner) chạy đồng bộ ngay khi Spring Boot khởi động nhưng không có `try-catch`. Khi kết nối MySQL cloud trên Railway bị trễ hoặc thiếu biến, HikariCP timeout 30s ném ngoại lệ làm sập toàn bộ Spring Boot JVM (exit code 1).
  2. Lệnh start `java -jar target/backend-core-1.0.0.jar` không cấu hình `-Xmx` nên JVM nạp Spring + Hibernate dễ vượt quá hạn mức RAM 512MB trên Railway dẫn đến bị Linux OOM Killer hạ sát (SIGKILL 137).
  3. Railway MySQL plugin thường cấp biến `MYSQL_URL` dạng `mysql://` thay vì `jdbc:mysql://`, thiếu auto-mapping.
  4. Thiếu endpoint Health check công khai trả lời HTTP 200 cho Railway probe.
- **Error Message**: 
  ```
  Process exited with code 1 / Container crashed: out of memory (OOMKilled)
  ```
- **Fix Applied**: 
  1. Bọc toàn bộ các bước seed dữ liệu trong `DataInitializer.java` vào từng khối `try-catch` an toàn, log cảnh báo thay vì làm sập ứng dụng.
  2. Thêm cờ giới hạn bộ nhớ `-Xmx384m -Xms128m -XX:+UseG1GC` vào `nixpacks.toml` và `render.yaml`.
  3. Thêm hàm `configureRailwayMysqlUrl()` trong `TurfzoneApplication.java` tự động phân giải `MYSQL_URL` sang JDBC properties.
  4. Tạo `HealthController.java` (`/`, `/health`, `/api/v1/health`) và mở quyền `permitAll` trong `SecurityConfig.java`.
- **Prevention**: Mọi tác vụ `CommandLineRunner` hoặc background seeder phải luôn bọc `try-catch` độc lập và JVM container phải luôn có trần `-Xmx`.
- **Status**: Fixed

## [2026-10-22] - Khách KHÔNG đặt được sân sau khi siết chống IDOR

- **Type**: Logic / Regression
- **Severity**: High
- **File**: `backend-core/.../controller/PitchBookingController.java`, `frontend/src/components/PitchDetail.tsx`
- **Root Cause**: Giao diện khách đặt sân gọi `POST /pitches/{id}/book-offline` — **cùng endpoint** với đơn tại quầy của chủ sân. Khi vá lỗ hổng IDOR (thêm `assertOwnsPitch` để chủ sân A không tạo đơn trong cụm sân của chủ sân B), **luồng đặt sân của khách cũng bị chặn** → mọi khách đều nhận 400 "Bạn không phải chủ sân của cụm sân này".
- **Error Message**:
  ```
  POST /api/v1/pitches/1/book-offline -> 400 {"message":"Bạn không phải chủ sân của cụm sân này."}
  ```
- **Fix Applied**:
  1. Tách thành 2 endpoint: `POST /pitches/{id}/book` (khách, chỉ cần đăng nhập) và `POST /pitches/{id}/book-offline` (chủ sân tạo đơn tại quầy, kiểm tra sở hữu).
  2. Cả 2 endpoint dùng chung `computeSlotPrice()` (công thức giá của ma trận) và `computeDeposit()` (mức cọc 50%/100% do server kiểm tra) → giá hiển thị luôn khớp giá thu.
- **Prevention**: Trước khi siết một endpoint, phải **kiểm tra toàn bộ nơi đang gọi nó** (cả FE lẫn mobile) — dùng chung endpoint cho 2 vai trò khác nhau là "bẫy IDOR".
- **Status**: Fixed

## [2026-10-22] - `@GetMapping` dính vào method `private` → endpoint trả 200 body rỗng

- **Type**: Integration
- **Severity**: High
- **File**: `backend-core/.../controller/PitchBookingController.java`, `TournamentController.java`
- **Root Cause**: Khi chèn thêm method `private` (helper) ngay **dưới** annotation `@GetMapping`, Spring đăng ký **method private** làm handler → trả `200` với `Content-Length: 0`. Riêng lần này làm **chết toàn bộ tính năng thống kê doanh thu / công suất của chủ sân** (`/pitches/{id}/stats`).
- **Error Message**:
  ```
  GET /api/v1/pitches/1/stats -> 200, Content-Length: 0
  ```
- **Fix Applied**: Chuyển annotation về đúng method handler; bổ sung script `audit_mappings.js` quét **toàn bộ mapping** trong backend và báo lỗi khi annotation đứng trước một method `private`.
- **Prevention**: Sau mỗi lần sửa controller phải chạy `audit_mappings.js` + smoke test các endpoint chính (script `smoke_endpoints.js` kiểm tra mọi endpoint trả body khác rỗng).
- **Status**: Fixed

## [2026-10-22] - Tiền mặt thu tại quầy biến mất khỏi doanh thu

- **Type**: Logic / Money
- **Severity**: High
- **File**: `backend-core/.../controller/PitchBookingController.java`, `OwnerAdminController.java`, `AdminController.java`, `OwnerReportController.java`, `AdminManageController.java`
- **Root Cause**:
  1. Check-in gán `cashDue = 0` ("đã thu đủ tại quầy") → **xoá mất** thông tin phần tiền khách còn phải trả ở quầy.
  2. Công thức doanh thu chỉ tính tiền mặt khi đơn ở trạng thái `PLAYING`/`COMPLETED`, nhưng **không endpoint nào chuyển đơn sang `COMPLETED`** ⇒ phần tiền mặt thu được không bao giờ vào báo cáo.
  3. `/admin/overview` dùng công thức **khác** các endpoint còn lại (chỉ tính tiền cọc) ⇒ hai con số doanh thu khác nhau trên cùng một dashboard.
- **Error Message**:
  ```
  /admin/overview       -> totalRevenue = 32 635 000
  /admin/revenue-report -> totalRevenueThisMonth = 53 065 000
  ```
- **Fix Applied**:
  1. Thêm cột `bookings.cash_collected`; check-in lưu số tiền đã thu thay vì xoá.
  2. Tạo `util/RevenueUtil.settledRevenue()` — **một** công thức duy nhất — và dùng ở cả 5 nơi.
  3. SQL `db_migration_new.sql` khôi phục lại phần tiền mặt của các đơn đã check-in trước đó.
- **Prevention**: Mọi công thức tính tiền phải nằm trong **một** helper dùng chung; không được xoá số liệu gốc (giữ `cash_due` + thêm cột đánh dấu đã thu).
- **Status**: Fixed

## [2026-10-22] - Bán trùng ca khi 2 khách đặt đồng thời

- **Type**: Concurrency / Money
- **Severity**: High
- **File**: `backend-core/.../controller/PitchBookingController.java`, `repository/PitchRepository.java`
- **Root Cause**: Kiểm tra trùng ca là mẫu **đọc-rồi-ghi** (read-then-write) không khoá, không có ràng buộc UNIQUE ⇒ 2 request đến cùng lúc (double-click, 2 tab) đều đọc được danh sách đơn rỗng rồi cùng `insert` → **1 ca bán cho 2 khách**.
- **Error Message**:
  ```
  6 request SONG SONG đặt cùng 1 ca -> 5 đơn được tạo (201)
  ```
- **Fix Applied**:
  1. Bọc endpoint đặt sân trong `@Transactional` + khoá dòng sân bằng `SELECT ... FOR UPDATE` (`PitchRepository.findByIdForUpdate`).
  2. **Khoá phải gọi TRƯỚC** khi nạp pitch — nếu nạp trước thì JPA trả về entity đã cache và **không** chạy `FOR UPDATE`.
  3. Bắt `DataIntegrityViolationException` → trả 400 thay vì lỗi 500.
  4. Mã đơn sinh bằng UUID (trước dùng `millis % 10000` ⇒ chỉ 10.000 giá trị + cột UNIQUE).
- **Prevention**: Mọi luồng "kiểm tra rồi ghi" vào bảng dữ liệu phải có khoá ( pessimistic/optimistic ) hoặc ràng buộc UNIQUE; luôn test bằng N request song song.
- **Status**: Fixed

## [2026-10-22] - QR VietQR không quét được (số tài khoản có khoảng trắng)

- **Type**: Data / Integration
- **Severity**: Medium
- **File**: `backend-core/.../config/DataInitializer.java`, `frontend/src/lib/tournamentService.ts`
- **Root Cause**: Số tài khoản ngân hàng được seed dạng `"1900 2026 2029"` (có khoảng trắng) → URL VietQR trở thành `.../970436-1900 2026 2029-compact2.png` ⇒ **ảnh QR không tạo được** (URL sai) ⇒ khách không quét nộp cọc được.
- **Fix Applied**: Lọc khoảng trắng khi dựng URL (`buildVietQrUrl`) + sửa dữ liệu seed + SQL cập nhật `bank_account` đã có khoảng trắng.
- **Prevention**: Mọi dữ liệu đưa vào URL phải được `encode`/lọc ký tự lạ trước.
- **Status**: Fixed

## [2026-10-27 22:25] - Next.js Hydration Failed on Deep-Link Tabs (?tab=organizer)

- **Type**: Runtime / Frontend
- **Severity**: High
- **File**: `frontend/src/app/page.tsx:35`
- **Agent**: Antigravity Orchestrator (Thần)
- **Root Cause**: `activeTab` trong `Home()` khởi tạo bằng lazy callback đọc `window.location.search` (`typeof window !== "undefined"`). Khi truy cập trực tiếp bằng URL chứa query param (như `?tab=organizer`), máy chủ SSR render giao diện tab mặc định `"booking"`, nhưng client khi hydrate lại khởi tạo `activeTab = "organizer"`. React so sánh cây DOM giữa SSR và Client thấy lệch hoàn toàn cấu trúc thẻ, ném lỗi Fatal Hydration Error.
- **Error Message**: 
  ```
  Unhandled Runtime Error
  Error: Hydration failed because the initial UI does not match what was rendered on the server.
  See more info here: https://nextjs.org/docs/messages/react-hydration-error
  ```
- **Fix Applied**: 
  1. Khởi tạo `activeTab` đồng nhất là `"booking"` (`useState<string>("booking")`) cả trên SSR và Client.
  2. Việc đọc query param `?tab=...` và `sessionStorage` được thực thi an toàn trong `useEffect` ngay sau khi React hoàn tất hydrate (trong khi `BootSplash` đang giữ màn che tối thiểu 1s nên chuyển tab cực kỳ mượt mà, không giật hình).
  3. Bổ sung `suppressHydrationWarning` cho thẻ hiển thị thời gian in biên bản trong `TournamentBracket.tsx`.
- **Prevention**: Tuyệt đối không đọc `window`, `localStorage`, hoặc `sessionStorage` trong hàm khởi tạo `useState(...)` của các component SSR/Next.js. Luôn khởi tạo giá trị tĩnh an toàn và cập nhật qua `useEffect` sau mount.
- **Status**: Fixed 

## [2026-10-28 07:10] - Luồng ĐẶT SÂN ONLINE CÓ CỌ (PENDING_PAYMENT -> CONFIRM -> CHECK-IN) BỊ KẸT + CHƯA LOC DON DA HUY KHI DAT LAI

- **Type**: Logic / Flow / Regression
- **Severity**: High
- **File**: `backend-core/.../controller/PitchBookingController.java`, `frontend/src/components/PitchDetail.tsx`, `frontend/src/components/AdminDashboard.tsx`, `frontend/src/components/ActivitySchedule.tsx`
- **Root Cause**:
  1. Sau khi sửa đổi trạng thái đặt online `BOOKED -> PENDING_PAYMENT` + thêm `PUT /bookings/{id}/confirm-payment`, backend đã có nhưng **frontend chưa gọi** endpoint confirm → khách đặt sân online mã giữ chỗ nhưng **chủ sân không xác nhận được cọc**, luồng không thể sang `BOOKED` → check-in không chạy.
  2. Backend `/book` và `/book-offline` kiểm tra trùng giờ nhưng **thiếu lọc `CANCELLED`** → đơn đã hủy vẫn chiếm khung giờ, khách/chủ sân không đặt lại được ca đã hủy (matrix/stats đã lọc, nên inconsistent).
  3. `PUT /bookings/{id}/confirm-payment` chỉ `@PreAuthorize("isAuthenticated()")` và **thiếu `assertOwnsBooking`** → bất kỳ user đăng nhập cũng xác nhận được/chiếm slot của đơn khác.
  4. FE chưa hiểu status `pending_payment`: khách vẫn chọn được ca pending; owner thiếu nút xác nhận cọc.
- **Fix Applied**:
  1. Backend: lọc `CANCELLED` ở cả 2 endpoint chống trùng (`/book`, `/book-offline`).
  2. Backend: `confirm-payment` → `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")` + `assertOwnsBooking`; chuyển `PENDING_PAYMENT -> BOOKED` (idempotent với `BOOKED`).
  3. Backend: `check-in` chỉ cho phép khi status là `BOOKED` (sau khi xác nhận cọc).
  4. FE: `PitchDetail` chặn chọn ca `pending_payment`; `AdminDashboard` thêm nút "Xác Nhận Đã Thu Cọc & Giữ Ca" cho pending, thêm filter `PENDING`.
  5. FE: `ActivitySchedule` cho phép khách tự hủy vé ở trạng thái `PENDING_PAYMENT`.
- **Prevention**: Khi đổi trạng thái đơn đặt (PENDING/BOOKED/PLAYING/COMPLETED/CANCELLED) phải đồng bộ backend (controller/service) + frontend (component) + các nơi hiển thị/badge trong cùng một change set.
- **Status**: Fixed 

---

---
