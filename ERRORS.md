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

---
