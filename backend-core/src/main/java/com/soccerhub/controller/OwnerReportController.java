package com.soccerhub.controller;

import com.soccerhub.model.Booking;
import com.soccerhub.model.Pitch;
import com.soccerhub.repository.BookingRepository;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

/**
 * Xuất báo cáo thống kê cho Chủ sân (OWNER) và Quản trị (ADMIN).
 *
 * <p>Định dạng CSV có BOM UTF-8 để Microsoft Excel mở tiếng Việt không bị lỗi font.
 * Mọi truy vấn đều giới hạn theo đúng các cụm sân thuộc sở hữu của người gọi —
 * chủ sân không thể xuất báo cáo của cụm sân người khác.</p>
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class OwnerReportController {

    private final PitchRepository pitchRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    // =========================================================================
    //  CSV helpers
    // =========================================================================

    /** Escape đúng chuẩn CSV: nhốt dấu phẩy / dấu nháy kép / xuống dòng. */
    private static String csv(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v);
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private static String csvLine(Object... cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(csv(cells[i]));
        }
        return sb.toString();
    }

    private static ResponseEntity<byte[]> csvResponse(String filename, String content) {
        byte[] body = ("﻿" + content).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }

    private static String money(int v) {
        return v + "đ";
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(v, max));
    }

    private static int intOf(Object v, int def) {
        if (v == null) return def;
        try {
            return Integer.parseInt(String.valueOf(v).trim());
        } catch (Exception e) {
            return def;
        }
    }

    private static LocalDate parseDate(String s, LocalDate fallback) {
        if (s == null || s.isBlank()) return fallback;
        try {
            return LocalDate.parse(s.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    /** Số ca bán được trong 1 ngày của 1 sân, theo giờ mở/đóng + độ dài ca. */
    private static int slotsPerDay(String open, String close, int durationMinutes) {
        try {
            if (open == null || close == null) return 0;
            int oh = Integer.parseInt(open.split(":")[0]);
            int om = Integer.parseInt(open.split(":")[1]);
            int ch = Integer.parseInt(close.split(":")[0]);
            int cm = Integer.parseInt(close.split(":")[1]);
            int start = oh * 60 + om;
            int end = ch * 60 + cm;
            if (end <= start) return 0;
            return (end - start) / Math.max(30, durationMinutes);
        } catch (Exception e) {
            return 0;
        }
    }

    /** Doanh thu đã thu: cọc + tiền mặt còn lại (đơn PLAYING/COMPLETED). */
    private static int settledRevenue(Booking b) {
        String status = b.getStatus() == null ? "BOOKED" : b.getStatus();
        if ("CANCELLED".equals(status)) return 0;
        int deposit = b.getDepositPaid() != null ? b.getDepositPaid() : 0;
        int cash = ("PLAYING".equals(status) || "COMPLETED".equals(status))
                ? (b.getCashDue() != null ? b.getCashDue() : 0)
                : 0;
        return deposit + cash;
    }

    /** Các cụm sân mà người gọi được phép xem (OWNER: của mình; ADMIN: toàn bộ). */
    private List<Pitch> visiblePitches(com.soccerhub.model.User me) {
        if (me != null && me.getRole() != null && "ADMIN".equals(me.getRole().name())) {
            return pitchRepository.findAll();
        }
        return me != null ? pitchRepository.findByOwnerId(me.getId()) : List.of();
    }

    // =========================================================================
    //  Sinh nội dung CSV (dùng chung cho tải về và gửi email)
    // =========================================================================

    private String buildRevenueCsv(Set<Long> pitchIds, int safeMonths) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine("BÁO CÁO DOANH THU CHỦ SÂN"));
        sb.append(csvLine("Xuất ngày", LocalDate.now().toString()));
        sb.append(csvLine("Số tháng", safeMonths));
        sb.append(csvLine());

        YearMonth cur = YearMonth.now();
        for (int i = safeMonths - 1; i >= 0; i--) {
            YearMonth m = cur.minusMonths(i);
            String prefix = m.toString();
            int revenue = 0, count = 0, cancelled = 0;
            for (Booking b : bookingRepository.findAll()) {
                if (b.getPitchId() == null || !pitchIds.contains(b.getPitchId())) continue;
                String d = b.getBookingDate();
                if (d == null || !d.startsWith(prefix)) continue;
                if ("CANCELLED".equals(b.getStatus())) { cancelled++; continue; }
                revenue += settledRevenue(b);
                count++;
            }
            sb.append(csvLine(m.getMonth().toString(), m.getYear(), count, money(revenue), cancelled));
        }
        sb.append(csvLine());
        sb.append(csvLine("TỔNG CỘNG"));
        return sb.toString();
    }

    private String buildBookingsCsv(Map<Long, String> pitchNames, Set<Long> pitchIds,
                                    LocalDate fromDate, LocalDate toDate) {
        StringBuilder sb = new StringBuilder();
        sb.append(csvLine("BÁO CÁO ĐƠN ĐẶT SÂN"));
        sb.append(csvLine("Từ ngày", fromDate.toString(), "Đến ngày", toDate.toString()));
        sb.append(csvLine());
        sb.append(csvLine("Ngày", "Cụm sân", "Sân", "Khung giờ", "Khách hàng", "SĐT",
                "Tổng tiền", "Đã cọc", "Còn lại", "Trạng thái", "Kênh", "Mã"));

        List<Booking> all = new ArrayList<>();
        for (Booking b : bookingRepository.findAll()) {
            if (b.getPitchId() == null || !pitchIds.contains(b.getPitchId())) continue;
            LocalDate bd = parseDate(b.getBookingDate(), null);
            if (bd == null || bd.isBefore(fromDate) || bd.isAfter(toDate)) continue;
            all.add(b);
        }
        all.sort(Comparator.comparing((Booking b) -> String.valueOf(b.getBookingDate()))
                .thenComparing(b -> String.valueOf(b.getTimeSlot())));

        int sumTotal = 0, sumDeposit = 0, sumCash = 0;
        for (Booking b : all) {
            int total = b.getTotalPrice() != null ? b.getTotalPrice() : 0;
            int dep = b.getDepositPaid() != null ? b.getDepositPaid() : 0;
            int cash = b.getCashDue() != null ? b.getCashDue() : 0;
            sumTotal += total;
            sumDeposit += dep;
            sumCash += cash;
            sb.append(csvLine(b.getBookingDate(),
                    pitchNames.getOrDefault(b.getPitchId(), "—"),
                    b.getCourtName(), b.getTimeSlot(),
                    b.getCustomerName(), b.getCustomerPhone(),
                    money(total), money(dep), money(cash),
                    b.getStatus(), b.getVia(), b.getCode()));
        }
        sb.append(csvLine());
        sb.append(csvLine("TỔNG", "", "", "", "", "",
                money(sumTotal), money(sumDeposit), money(sumCash), "", "", ""));
        return sb.toString();
    }

    private String buildSummaryCsv(List<Pitch> pitches, int safeDays) {
        StringBuilder sb = new StringBuilder();
        LocalDate from = LocalDate.now().minusDays(safeDays - 1L);
        LocalDate to = LocalDate.now();

        sb.append(csvLine("BÁO CÁO TỔNG QUAN CỤM SÂN"));
        sb.append(csvLine("Khoảng thời gian", from + " → " + to));
        sb.append(csvLine());
        sb.append(csvLine("Cụm sân", "Số sân con", "Giờ mở", "Giờ đóng",
                "Giá giờ (đ)", "Giá giờ vàng (đ)", "Tổng đơn", "Tổng doanh thu"));

        int gOrders = 0, gRevenue = 0;
        for (Pitch p : pitches) {
            int orders = 0, revenue = 0;
            for (Booking b : bookingRepository.findAll()) {
                if (!p.getId().equals(b.getPitchId())) continue;
                LocalDate bd = parseDate(b.getBookingDate(), null);
                if (bd == null || bd.isBefore(from) || bd.isAfter(to)) continue;
                if ("CANCELLED".equals(b.getStatus())) continue;
                orders++;
                revenue += settledRevenue(b);
            }
            gOrders += orders;
            gRevenue += revenue;
            int courts = p.getPitchTypes() != null && !p.getPitchTypes().isEmpty()
                    ? p.getPitchTypes().size() : 1;
            sb.append(csvLine(p.getName(), courts, p.getOpenTime(), p.getCloseTime(),
                    p.getAvgPricePerHour(), p.getPeakPricePerHour(), orders, money(revenue)));
        }
        sb.append(csvLine());
        sb.append(csvLine("TỔNG CỘNG", pitches.size(), "", "", "", "", gOrders, money(gRevenue)));

        int totalCapacity = 0;
        for (Pitch p : pitches) {
            int courts = p.getPitchTypes() != null && !p.getPitchTypes().isEmpty()
                    ? p.getPitchTypes().size() : 1;
            int dur = p.getSlotDurationMinutes() != null && p.getSlotDurationMinutes() > 0
                    ? p.getSlotDurationMinutes() : 120;
            totalCapacity += courts * slotsPerDay(p.getOpenTime(), p.getCloseTime(), dur) * safeDays;
        }
        double occupancy = totalCapacity > 0
                ? Math.min(100.0, Math.round(gOrders * 10000.0 / totalCapacity) / 100.0) : 0;
        sb.append(csvLine());
        sb.append(csvLine("Tỷ lệ lấp đầy ước tính (%)", occupancy));
        sb.append(csvLine("Tổng số ca có thể bán", totalCapacity));
        return sb.toString();
    }

    // =========================================================================
    //  1. Doanh thu theo tháng
    // =========================================================================

    @GetMapping("/revenue.csv")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> revenueCsv(
            @RequestParam(defaultValue = "6") int months,
            @AuthenticationPrincipal com.soccerhub.model.User me) {
        int safeMonths = clamp(months, 1, 24);
        Set<Long> pitchIds = new HashSet<>();
        for (Pitch p : visiblePitches(me)) pitchIds.add(p.getId());
        return csvResponse("bao-cao-doanh-thu.csv", buildRevenueCsv(pitchIds, safeMonths));
    }

    // =========================================================================
    //  2. Chi tiết đơn đặt sân
    // =========================================================================

    @GetMapping("/bookings.csv")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> bookingsCsv(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @AuthenticationPrincipal com.soccerhub.model.User me) {
        Set<Long> pitchIds = new HashSet<>();
        Map<Long, String> pitchNames = new HashMap<>();
        for (Pitch p : visiblePitches(me)) {
            pitchIds.add(p.getId());
            pitchNames.put(p.getId(), p.getName());
        }
        LocalDate fromDate = parseDate(from, LocalDate.now().withDayOfMonth(1));
        LocalDate toDate = parseDate(to, LocalDate.now());
        return csvResponse("bao-cao-don-dat-san.csv",
                buildBookingsCsv(pitchNames, pitchIds, fromDate, toDate));
    }

    // =========================================================================
    //  3. Tổng quan cụm sân
    // =========================================================================

    @GetMapping("/summary.csv")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> summaryCsv(
            @RequestParam(defaultValue = "30") int days,
            @AuthenticationPrincipal com.soccerhub.model.User me) {
        int safeDays = clamp(days, 1, 365);
        return csvResponse("bao-cao-tong-quan.csv",
                buildSummaryCsv(visiblePitches(me), safeDays));
    }

    // =========================================================================
    //  4. Gửi báo cáo qua EMAIL (kèm file CSV đính kèm)
    // =========================================================================

    /** Kiểm tra hệ thống email đã bật chưa — frontend dùng để hiện/ẩn nút gửi. */
    @GetMapping("/email-status")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> emailStatus() {
        return ResponseEntity.ok(Map.of(
                "enabled", emailService.isReady(),
                "message", emailService.isReady()
                        ? "Hệ thống đã bật gửi email."
                        : "Hệ thống chưa bật gửi email (thiếu MAIL_ENABLED / MAIL_USERNAME / MAIL_PASSWORD)."));
    }

    @PostMapping("/send-email")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> sendReportByEmail(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal com.soccerhub.model.User me) {

        String toEmail = body.get("toEmail") != null ? String.valueOf(body.get("toEmail")).trim() : "";
        String type = body.get("type") != null ? String.valueOf(body.get("type")).trim().toLowerCase() : "revenue";

        if (!EmailService.isValidEmail(toEmail)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Địa chỉ email nhận báo cáo không hợp lệ."));
        }

        int months = clamp(intOf(body.get("months"), 6), 1, 24);
        int days = clamp(intOf(body.get("days"), 30), 1, 365);
        LocalDate from = parseDate(body.get("from") != null ? String.valueOf(body.get("from")) : null,
                LocalDate.now().withDayOfMonth(1));
        LocalDate to = parseDate(body.get("to") != null ? String.valueOf(body.get("to")) : null,
                LocalDate.now());

        List<Pitch> pitches = visiblePitches(me);
        Set<Long> pitchIds = new HashSet<>();
        Map<Long, String> pitchNames = new HashMap<>();
        for (Pitch p : pitches) {
            pitchIds.add(p.getId());
            pitchNames.put(p.getId(), p.getName());
        }

        final String subject;
        final String filename;
        final String content;

        switch (type) {
            case "bookings" -> {
                subject = "Báo cáo chi tiết đơn đặt sân (" + from + " → " + to + ")";
                filename = "bao-cao-don-dat-san.csv";
                content = buildBookingsCsv(pitchNames, pitchIds, from, to);
            }
            case "summary" -> {
                subject = "Báo cáo tổng quan cụm sân (" + days + " ngày)";
                filename = "bao-cao-tong-quan.csv";
                content = buildSummaryCsv(pitches, days);
            }
            default -> {
                subject = "Báo cáo doanh thu chủ sân (" + months + " tháng)";
                filename = "bao-cao-doanh-thu.csv";
                content = buildRevenueCsv(pitchIds, months);
            }
        }

        boolean sent = emailService.sendReport(toEmail, subject, content, filename);
        if (!sent) {
            String hint = emailService.isReady()
                    ? "Không gửi được email. Kiểm tra lại cấu hình SMTP (MAIL_USERNAME / MAIL_PASSWORD)."
                    : "Hệ thống chưa bật gửi email. Hãy đặt MAIL_ENABLED=true và cấu hình SMTP trong biến môi trường.";
            return ResponseEntity.badRequest().body(Map.of("message", hint));
        }
        return ResponseEntity.ok(Map.of(
                "message", "Đã gửi báo cáo tới " + toEmail + ".",
                "filename", filename,
                "toEmail", toEmail));
    }
}