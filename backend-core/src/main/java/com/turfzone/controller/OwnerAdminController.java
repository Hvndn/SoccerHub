package com.turfzone.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.turfzone.util.RevenueUtil;
import com.turfzone.model.Booking;
import com.turfzone.model.Pitch;
import com.turfzone.repository.BookingRepository;
import com.turfzone.repository.PitchRepository;
import com.turfzone.util.TimeSlotUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.*;

/**
 * API báo cáo doanh thu & cấu hình giá linh hoạt (Chủ sân / Admin).
 *
 * Trước đây endpoint này trả số liệu cứng ghi trong code — không khớp với CSDL và
 * không kiểm chứng được khi thầy đối chiếu. Nay toàn bộ số liệu được tính từ bảng
 * `bookings` + `pitches` tại thời điểm gọi.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class OwnerAdminController {

    private final BookingRepository bookingRepository;
    private final PitchRepository pitchRepository;

    /** Doanh thu = tiền cọc + tiền mặt còn lại, chỉ tính đơn đã thu (không tính đơn đã hủy). */
    /** Doanh thu = tien coc + tien mat da thu tai quay (dung chung cong thuc he thong). */
    private static int settledRevenue(Booking b) {
        return RevenueUtil.settledRevenue(b);
    }

    private static YearMonth parseMonth(String dateStr) {
        try {
            return YearMonth.parse(String.valueOf(dateStr).substring(0, 7));
        } catch (Exception e) {
            return null;
        }
    }

    /** Tổng số ca sân có thể bán được trong 1 tháng của toàn bộ cụm sân. */
    private long totalCapacityOf(YearMonth month, List<Pitch> pitches) {
        int days = month.lengthOfMonth();
        long total = 0;
        for (Pitch p : pitches) {
            int courts = (p.getPitchTypes() != null && !p.getPitchTypes().isEmpty()) ? p.getPitchTypes().size() : 1;
            int duration = (p.getSlotDurationMinutes() != null && p.getSlotDurationMinutes() > 0)
                    ? p.getSlotDurationMinutes() : 120;
            int slots = TimeSlotUtil.slotsPerDay(p.getOpenTime(), p.getCloseTime(), duration);
            total += (long) courts * slots * days;
        }
        return total;
    }

    @GetMapping("/revenue-report")
    public ResponseEntity<Map<String, Object>> getRevenueReport(@AuthenticationPrincipal com.turfzone.model.User me) {
        // Chỉ lấy cụm sân của chủ sân này (ADMIN thấy tất cả) — trước đây gộp
        // doanh thu TOÀN HỆ THỐNG cho mọi chủ sân.
        boolean isAdmin = me != null && "ADMIN".equals(me.getRole().name());
        List<Pitch> pitches = isAdmin ? pitchRepository.findAll()
                : pitchRepository.findByOwnerId(me != null ? me.getId() : -1L);
        java.util.Set<Long> myPitchIds = pitches.stream().map(Pitch::getId).collect(java.util.stream.Collectors.toSet());
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getPitchId() != null && myPitchIds.contains(b.getPitchId()))
                .collect(java.util.stream.Collectors.toList());

        YearMonth current = YearMonth.now();

        Map<YearMonth, Integer> revenueByMonth = new LinkedHashMap<>();
        Map<YearMonth, Integer> countByMonth = new LinkedHashMap<>();
        List<Map<String, Object>> monthly = new ArrayList<>();

        // 6 tháng gần nhất, tháng cũ nhất đứng đầu để vẽ biểu đồ cột
        for (int i = 5; i >= 0; i--) {
            YearMonth m = current.minusMonths(i);
            revenueByMonth.put(m, 0);
            countByMonth.put(m, 0);
        }

        for (Booking b : bookings) {
            YearMonth m = parseMonth(b.getBookingDate());
            if (m == null || !revenueByMonth.containsKey(m)) continue;
            revenueByMonth.put(m, revenueByMonth.get(m) + settledRevenue(b));
            if (!"CANCELLED".equals(b.getStatus())) {
                countByMonth.put(m, countByMonth.get(m) + 1);
            }
        }

        for (YearMonth m : revenueByMonth.keySet()) {
            long capacity = totalCapacityOf(m, pitches);
            int booked = countByMonth.getOrDefault(m, 0);
            monthly.add(Map.of(
                    "month", MONTH_LABELS[m.getMonthValue() - 1] + (m.getYear() == current.getYear() ? "" : " " + m.getYear()),
                    "revenue", revenueByMonth.get(m),
                    "bookings", booked,
                    "occupancyRate", capacity > 0 ? (int) Math.round(booked * 100.0 / capacity) : 0
            ));
        }

        int thisMonthRevenue = revenueByMonth.getOrDefault(current, 0);
        int thisMonthBookings = countByMonth.getOrDefault(current, 0);
        long thisMonthCapacity = totalCapacityOf(current, pitches);
        int thisMonthOccupancy = thisMonthCapacity > 0
                ? (int) Math.round(thisMonthBookings * 100.0 / thisMonthCapacity) : 0;

        // Tỉ lệ lấp đầy trung bình của 6 tháng gần nhất
        double occupancySum = 0;
        int occupancyCount = 0;
        for (Map<String, Object> row : monthly) {
            occupancySum += ((Number) row.get("occupancyRate")).doubleValue();
            occupancyCount++;
        }
        int avgOccupancy = occupancyCount > 0 ? (int) Math.round(occupancySum / occupancyCount) : 0;

        // Tỉ lệ lấp đầy giờ vàng (17:00 - 21:00) trong tháng này
        int peakBooked = 0;
        for (Booking b : bookings) {
            YearMonth m = parseMonth(b.getBookingDate());
            if (m == null || !m.equals(current) || "CANCELLED".equals(b.getStatus())) continue;
            String slot = b.getTimeSlot() == null ? "" : b.getTimeSlot();
            if (TimeSlotUtil.isPeakStart(slot)) {
                peakBooked++;
            }
        }
        // So ca gio vang thuc te cua thang (truoc day chia tong cong suat cho 3 => sai).
        long peakCapacity = 0;
        for (Pitch p : pitches) {
            int dur = (p.getSlotDurationMinutes() != null && p.getSlotDurationMinutes() > 0)
                    ? p.getSlotDurationMinutes() : 120;
            int peakPerDay = TimeSlotUtil.peakSlotsPerDay(p.getOpenTime(), p.getCloseTime(), dur);
            long daysInMonth = current.lengthOfMonth();
            peakCapacity += (long) peakPerDay * daysInMonth;
        }
        if (peakCapacity <= 0) peakCapacity = Math.max(1, totalCapacityOf(current, pitches) / 3);
        int peakRate = (int) Math.min(100, Math.round(peakBooked * 100.0 / peakCapacity));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("totalRevenueThisMonth", thisMonthRevenue);
        report.put("avgOccupancyRate", avgOccupancy + "%");
        report.put("totalBookings", thisMonthBookings);
        report.put("peakHoursRate", peakRate + "%");
        report.put("monthlyChart", monthly);
        report.put("generatedAt", java.time.LocalDateTime.now().toString());

        return ResponseEntity.ok(report);
    }

    private static final String[] MONTH_LABELS = {
            "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
            "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    };

    /**
     * Cập nhật cấu hình giá linh hoạt (Dynamic Pricing) cho một cụm sân.
     * Trước đây chỉ trả về thông báo chứ không lưu gì — nay ghi giá thật vào CSDL.
     */
    @PostMapping("/dynamic-pricing")
    public ResponseEntity<?> configDynamicPricing(@RequestBody Map<String, Object> config,
            @AuthenticationPrincipal com.turfzone.model.User me) {
        Object pitchIdRaw = config.get("pitchId");
        if (pitchIdRaw == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "Thiếu pitchId — không xác định được cụm sân cần áp dụng giá."
            ));
        }

        long pitchId;
        try {
            pitchId = Long.parseLong(String.valueOf(pitchIdRaw));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "status", "ERROR",
                    "message", "pitchId không hợp lệ."
            ));
        }

        Pitch pitch = pitchRepository.findById(pitchId).orElse(null);
        if (pitch == null) {
            return ResponseEntity.status(404).body(Map.of(
                    "status", "ERROR",
                    "message", "Không tìm thấy cụm sân #" + pitchId + "."
            ));
        }

        // Chỉ chủ sân của cụm sân này (hoặc ADMIN) mới được sửa giá — trước đây
        // bất kỳ chủ sân nào cũng gửi pitchId của người khác để phá giá được.
        if (me == null || (!"ADMIN".equals(me.getRole().name())
                && (pitch.getOwnerId() == null || !pitch.getOwnerId().equals(me.getId())))) {
            return ResponseEntity.status(403).body(Map.of(
                    "status", "ERROR",
                    "message", "Bạn không có quyền sửa giá cụm sân này."
            ));
        }

        Object peakRaw = config.get("peakPricePerHour");
        Object offPeakRaw = config.get("avgPricePerHour");
        Object peakHours = config.get("peakHours");
        // Gia phai la so > 0 va gia gio vang >= gia gio thuong — truoc day nhan gia am
        // (don gia tien am) va tra 500 khi gui chu khong phai so.
        Integer newPeak = null;
        Integer newAvg = null;
        try {
            if (peakRaw != null) {
                double v = Double.parseDouble(String.valueOf(peakRaw).trim());
                if (v <= 0) {
                    return ResponseEntity.badRequest().body(Map.of("status", "ERROR",
                            "message", "Giá giờ vàng phải lớn hơn 0."));
                }
                newPeak = (int) Math.round(v);
            }
            if (offPeakRaw != null) {
                double v = Double.parseDouble(String.valueOf(offPeakRaw).trim());
                if (v <= 0) {
                    return ResponseEntity.badRequest().body(Map.of("status", "ERROR",
                            "message", "Giá giờ thường phải lớn hơn 0."));
                }
                newAvg = (int) Math.round(v);
            }
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR",
                    "message", "Giá phải là số hợp lệ."));
        }
        if (newPeak != null && newAvg != null && newPeak < newAvg) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR",
                    "message", "Giá giờ vàng không được thấp hơn giá giờ thường."));
        }
        if (newPeak != null) pitch.setPeakPricePerHour(newPeak);
        if (newAvg != null) pitch.setAvgPricePerHour(newAvg);
        pitchRepository.save(pitch);

        Map<String, Object> applied = new LinkedHashMap<>();
        applied.put("pitchId", pitchId);
        applied.put("pitchName", pitch.getName());
        applied.put("avgPricePerHour", pitch.getAvgPricePerHour());
        applied.put("peakPricePerHour", pitch.getPeakPricePerHour());
        if (peakHours != null) applied.put("peakHours", peakHours);

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã cập nhật bảng giá linh hoạt cho cụm sân \"" + pitch.getName() + "\".",
                "configApplied", applied
        ));
    }
}