-- =====================================================================
-- Turfzone — migration schema cho production (chạy 1 lần, idempotent)
-- Dùng khi deploy lên Railway với DDL_AUTO=none (nếu để update, Hibernate
-- tự tạo — file này vẫn chạy được vì có IF NOT EXISTS).
-- =====================================================================

-- 1) users.profile_completed: đã hoàn tất khởi tạo hồ sơ cầu thủ / chủ sân
--    NULL = tài khoản cũ (không cần khởi tạo), 0 = mới đăng ký, 1 = đã xong
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'profile_completed'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN profile_completed bit(1) DEFAULT NULL',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tài khoản cũ coi như đã hoàn tất (NULL = đã xong)
UPDATE users SET profile_completed = NULL WHERE profile_completed IS NULL AND role IN ('ADMIN','ORGANIZER','OWNER');

-- 2) bookings.cash_collected: tiền mặt đã thu tại quầy (check-in)
--    Trước đây check-in gán cashDue = 0 nên phần tiền còn lại bị mất khỏi doanh thu
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'cash_collected'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE bookings ADD COLUMN cash_collected int DEFAULT NULL',
  'DO 0');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Khôi phục phần tiền mặt của các đơn đã check-in trước khi có cột này
UPDATE bookings
SET cash_collected = total_price - COALESCE(deposit_paid, 0)
WHERE cash_collected IS NULL
  AND cash_due = 0
  AND status IN ('PLAYING', 'COMPLETED')
  AND total_price > COALESCE(deposit_paid, 0);

-- 3) Giá riêng của từng sân con (chủ sân khai trong "Thêm Sân Con")
CREATE TABLE IF NOT EXISTS `pitch_court_base_prices` (
  `pitch_id` bigint NOT NULL,
  `base_price` int DEFAULT NULL,
  `court_name` varchar(255) NOT NULL,
  PRIMARY KEY (`pitch_id`, `court_name`),
  CONSTRAINT `fk_pitch_court_base_prices` FOREIGN KEY (`pitch_id`) REFERENCES `pitches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pitch_court_peak_prices` (
  `pitch_id` bigint NOT NULL,
  `peak_price` int DEFAULT NULL,
  `court_name` varchar(255) NOT NULL,
  PRIMARY KEY (`pitch_id`, `court_name`),
  CONSTRAINT `fk_pitch_court_peak_prices` FOREIGN KEY (`pitch_id`) REFERENCES `pitches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Số tài khoản ngân hàng không được chứa khoảng trắng
--    (VietQR ký tự có khoảng trắng vào URL → ảnh QR không quét được)
UPDATE pitches
SET bank_account = REPLACE(bank_account, ' ', '')
WHERE bank_account LIKE '% %';

-- 5) Chuẩn hoá địa danh về Đà Nẵng + dọn rác bản ghi thử
--    (chi tiết xem file fix_db_danang3.sql)
