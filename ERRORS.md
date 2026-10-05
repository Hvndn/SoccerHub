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

---
