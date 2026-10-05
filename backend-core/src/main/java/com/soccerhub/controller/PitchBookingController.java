package com.soccerhub.controller;

import com.soccerhub.dto.CreatePitchRequest;
import com.soccerhub.model.Booking;
import com.soccerhub.model.Pitch;
import com.soccerhub.model.User;
import com.soccerhub.repository.BookingRepository;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.service.PitchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/pitches")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PitchBookingController {

    private final PitchService pitchService;
    private final PitchRepository pitchRepository;
    private final BookingRepository bookingRepository;

    @GetMapping
    public ResponseEntity<List<Pitch>> getAllPitches() {
        return ResponseEntity.ok(pitchService.getAllPitches());
    }

    @GetMapping("/my-pitches")
    public ResponseEntity<?> getMyPitches(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập với tài khoản Chủ Sân."));
        }
        return ResponseEntity.ok(pitchService.getPitchesByOwner(currentUser));
    }

    @PostMapping
    public ResponseEntity<?> createPitch(@AuthenticationPrincipal User currentUser, @RequestBody CreatePitchRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập với tài khoản Chủ Sân để tạo sân mới."));
        }
        try {
            Pitch createdPitch = pitchService.createPitch(request, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPitch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Lỗi tạo cụm sân: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePitch(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        try {
            pitchService.deletePitch(id, currentUser);
            return ResponseEntity.ok(Map.of("message", "Đã xóa cụm sân thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllPitches() {
        pitchService.clearAllPitches();
        return ResponseEntity.ok(Map.of("message", "Đã xóa tất cả dữ liệu sân bóng mẫu thành công."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPitchById(@PathVariable Long id) {
        try {
            Pitch pitch = pitchService.getPitchById(id);
            return ResponseEntity.ok(pitch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Thuật toán sinh danh sách ca sân linh hoạt theo giờ mở cửa, đóng cửa và thời lượng ca (1h, 1.5h, 2h)
     */
    private List<String> generateTimeSlots(String openTime, String closeTime, int durationMinutes) {
        List<String> slots = new ArrayList<>();
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
            String startStr = (openTime != null && !openTime.trim().isEmpty()) ? openTime.trim() : "14:00";
            String endStr = (closeTime != null && !closeTime.trim().isEmpty()) ? closeTime.trim() : "22:30";

            if (!startStr.contains(":")) startStr += ":00";
            if (!endStr.contains(":")) endStr += ":00";

            LocalTime current = LocalTime.parse(startStr, fmt);
            LocalTime end = LocalTime.parse(endStr, fmt);
            int duration = durationMinutes > 0 ? durationMinutes : 90;

            while (current.plusMinutes(duration).compareTo(end) <= 0) {
                LocalTime next = current.plusMinutes(duration);
                slots.add(current.format(fmt) + " - " + next.format(fmt));
                current = next;
            }
        } catch (Exception e) {
            return List.of("16:00 - 17:30", "17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00");
        }
        return slots.isEmpty() ? List.of("16:00 - 17:30", "17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00") : slots;
    }

    /**
     * API Cập Nhật Giờ Hoạt Động & Thời Lượng Ca Sân (60p, 90p, 120p)
     */
    @PutMapping("/{id}/operating-hours")
    public ResponseEntity<?> updateOperatingHours(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req
    ) {
        String openTime = (String) req.get("openTime");
        String closeTime = (String) req.get("closeTime");
        Integer duration = req.get("slotDurationMinutes") != null 
                ? Integer.valueOf(req.get("slotDurationMinutes").toString()) 
                : 90;

        Pitch updated = pitchService.updateOperatingHours(id, openTime, closeTime, duration);
        List<String> generatedSlots = generateTimeSlots(updated.getOpenTime(), updated.getCloseTime(), updated.getSlotDurationMinutes());

        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật thời gian hoạt động & thời lượng ca sân thành công!",
                "openTime", updated.getOpenTime(),
                "closeTime", updated.getCloseTime(),
                "slotDurationMinutes", updated.getSlotDurationMinutes(),
                "generatedSlots", generatedSlots
        ));
    }

    /**
     * API Lấy Ma Trận Ca Sân Thời Gian Thực (Owner Live Grid Matrix) Dữ Liệu Thật 100%
     */
    @GetMapping("/{id}/matrix")
    public ResponseEntity<?> getPitchMatrix(
            @PathVariable Long id,
            @RequestParam(required = false) String date
    ) {
        Pitch pitch = pitchService.getPitchById(id);
        String targetDate = (date != null && !date.trim().isEmpty()) 
                ? date.trim() 
                : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        List<String> courtList = pitch.getPitchTypes();
        if (courtList == null || courtList.isEmpty()) {
            courtList = new ArrayList<>(List.of("Sân 7A Cỏ Nhân Tạo", "Sân 5B Futsal"));
            pitch.setPitchTypes(courtList);
            pitchRepository.save(pitch);
        }

        int base = pitch.getAvgPricePerHour() != null ? pitch.getAvgPricePerHour() : 350000;
        int peak = pitch.getPeakPricePerHour() != null ? pitch.getPeakPricePerHour() : 500000;

        int duration = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0) 
                ? pitch.getSlotDurationMinutes() 
                : 90;
        List<String> standardSlots = generateTimeSlots(pitch.getOpenTime(), pitch.getCloseTime(), duration);

        List<Map<String, Object>> matrix = new ArrayList<>();

        for (int i = 0; i < courtList.size(); i++) {
            String courtName = courtList.get(i);
            boolean is7 = courtName.toLowerCase().contains("7");
            boolean is5 = courtName.toLowerCase().contains("5");
            boolean is11 = courtName.toLowerCase().contains("11");
            String courtType = is7 ? "Sân 7 Người" : is5 ? "Sân 5 Người" : is11 ? "Sân 11" : "Sân Tiêu Chuẩn";

            int courtBase = is11 ? Math.round(base * 2) : is7 ? base : Math.round(base * 0.75f);
            int courtPeak = is11 ? Math.round(peak * 2) : is7 ? peak : Math.round(peak * 0.75f);

            List<Map<String, Object>> slotsData = new ArrayList<>();

            for (int sIdx = 0; sIdx < standardSlots.size(); sIdx++) {
                String timeSlot = standardSlots.get(sIdx);
                // Giờ vàng: khung giờ có bắt đầu từ 17h, 18h, 19h
                boolean isPeakHour = timeSlot.contains("17:") || timeSlot.contains("18:") || timeSlot.contains("19:");
                int slotPrice = isPeakHour ? courtPeak : courtBase;

                // Tìm booking thật trong Database
                Optional<Booking> optBooking = bookingRepository
                        .findByPitchIdAndCourtNameAndBookingDateAndTimeSlot(id, courtName, targetDate, timeSlot);

                Map<String, Object> slotObj = new HashMap<>();
                slotObj.put("time", timeSlot);

                if (optBooking.isPresent()) {
                    Booking b = optBooking.get();
                    slotObj.put("id", "booking-" + b.getId());
                    slotObj.put("bookingId", b.getId());
                    slotObj.put("status", b.getStatus().toLowerCase()); // booked, playing, resale
                    slotObj.put("customer", b.getCustomerName());
                    slotObj.put("phone", b.getCustomerPhone());
                    slotObj.put("price", (b.getTotalPrice() != null ? (b.getTotalPrice() / 1000) : (slotPrice / 1000)) + "k");
                    slotObj.put("depositPaid", (b.getDepositPaid() != null ? (b.getDepositPaid() / 1000) : 0) + "k");
                    slotObj.put("cashDue", (b.getCashDue() != null ? (b.getCashDue() / 1000) : 0) + "k");
                    slotObj.put("via", b.getVia());
                    slotObj.put("code", b.getCode());
                } else {
                    // Ca trống thật sự
                    slotObj.put("id", "empty-" + id + "-" + i + "-" + sIdx);
                    slotObj.put("bookingId", null);
                    slotObj.put("status", "empty");
                    slotObj.put("customer", "Ca Trống");
                    slotObj.put("phone", "—");
                    slotObj.put("price", (slotPrice / 1000) + "k");
                    slotObj.put("depositPaid", "0k");
                    slotObj.put("cashDue", "0k");
                    slotObj.put("via", "Sẵn sàng nhận khách");
                    slotObj.put("code", "—");
                }
                slotsData.add(slotObj);
            }

            Map<String, Object> courtObj = new HashMap<>();
            courtObj.put("pitchId", "court-" + id + "-" + i);
            courtObj.put("pitchName", courtName);
            courtObj.put("type", courtType);
            courtObj.put("basePrice", courtBase);
            courtObj.put("peakPrice", courtPeak);
            courtObj.put("status", "ACTIVE");
            courtObj.put("slots", slotsData);

            matrix.add(courtObj);
        }

        return ResponseEntity.ok(matrix);
    }

    /**
     * API Thống Kê Doanh Thu & Công Suất Thực Tế (Real Live Stats)
     */
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getPitchRealStats(
            @PathVariable Long id,
            @RequestParam(required = false) String date
    ) {
        Pitch pitch = pitchService.getPitchById(id);
        String targetDate = (date != null && !date.trim().isEmpty()) 
                ? date.trim() 
                : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        List<Booking> bookings = bookingRepository.findByPitchIdAndBookingDate(id, targetDate);

        int duration = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0) ? pitch.getSlotDurationMinutes() : 90;
        int slotsPerCourt = generateTimeSlots(pitch.getOpenTime(), pitch.getCloseTime(), duration).size();
        int totalSlots = (pitch.getPitchTypes() != null ? pitch.getPitchTypes().size() : 2) * (slotsPerCourt > 0 ? slotsPerCourt : 4);
        int bookedSlots = bookings.size();

        int totalRevenue = 0;
        int vietQrOnlineCount = 0;
        int offlineCounterCount = 0;

        for (Booking b : bookings) {
            int deposit = b.getDepositPaid() != null ? b.getDepositPaid() : 0;
            int cash = ("PLAYING".equalsIgnoreCase(b.getStatus()) || "COMPLETED".equalsIgnoreCase(b.getStatus())) 
                    ? (b.getCashDue() != null ? b.getCashDue() : 0) 
                    : 0;
            totalRevenue += (deposit + cash);

            if (b.getVia() != null && (b.getVia().contains("VietQR") || b.getVia().contains("Online") || b.getVia().contains("MoMo"))) {
                vietQrOnlineCount++;
            } else {
                offlineCounterCount++;
            }
        }

        int occupancyRate = totalSlots > 0 ? (int) Math.round((bookedSlots * 100.0) / totalSlots) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("pitchId", id);
        stats.put("pitchName", pitch.getName());
        stats.put("date", targetDate);
        stats.put("totalRevenue", totalRevenue);
        stats.put("occupancyRate", occupancyRate);
        stats.put("totalSlots", totalSlots);
        stats.put("bookedSlots", bookedSlots);
        stats.put("onlineBookings", vietQrOnlineCount);
        stats.put("counterBookings", offlineCounterCount);
        stats.put("openTime", pitch.getOpenTime());
        stats.put("closeTime", pitch.getCloseTime());
        stats.put("slotDurationMinutes", pitch.getSlotDurationMinutes());

        return ResponseEntity.ok(stats);
    }

    /**
     * API Tạo Đặt Ca Tại Quầy (Lưu trực tiếp vào MySQL)
     */
    @PostMapping("/{id}/book-offline")
    public ResponseEntity<?> bookOfflineSlot(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req
    ) {
        String courtName = (String) req.get("courtName");
        String timeSlot = (String) req.get("timeSlot");
        String customerName = (String) req.get("customerName");
        String customerPhone = (String) req.get("customerPhone");
        String bookingDate = (String) req.getOrDefault("bookingDate", LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        Integer totalPrice = req.get("totalPrice") != null ? Integer.valueOf(req.get("totalPrice").toString()) : 500000;
        Integer depositPaid = req.get("depositPaid") != null ? Integer.valueOf(req.get("depositPaid").toString()) : 250000;
        Integer cashDue = totalPrice - depositPaid;

        if (courtName == null || timeSlot == null || customerName == null || customerPhone == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ thông tin đặt sân."));
        }

        // Kiểm tra xem ca đã có người đặt chưa
        Optional<Booking> existing = bookingRepository.findByPitchIdAndCourtNameAndBookingDateAndTimeSlot(id, courtName, bookingDate, timeSlot);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Khung giờ này đã có người đặt trước! Vui lòng chọn ca khác."));
        }

        String code = "VS-" + id + "-" + (System.currentTimeMillis() % 10000);

        Booking booking = Booking.builder()
                .pitchId(id)
                .courtName(courtName)
                .courtType((String) req.getOrDefault("courtType", "Sân 7"))
                .bookingDate(bookingDate)
                .timeSlot(timeSlot)
                .customerName(customerName)
                .customerPhone(customerPhone)
                .totalPrice(totalPrice)
                .depositPaid(depositPaid)
                .cashDue(cashDue)
                .status("BOOKED")
                .via((String) req.getOrDefault("via", "Tạo Tại Quầy"))
                .code(code)
                .build();

        Booking saved = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * API Thêm Sân Con Mới Vào Cụm Sân (Lưu trực tiếp vào MySQL)
     */
    @PostMapping("/{id}/add-court")
    public ResponseEntity<?> addCourtToPitch(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req
    ) {
        String courtName = (String) req.get("courtName");
        if (courtName == null || courtName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên sân con không được để trống."));
        }

        Pitch pitch = pitchService.getPitchById(id);
        List<String> types = pitch.getPitchTypes();
        if (types == null) {
            types = new ArrayList<>();
        } else {
            types = new ArrayList<>(types);
        }

        if (types.contains(courtName.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sân con này đã tồn tại trong cụm sân."));
        }

        types.add(courtName.trim());
        pitch.setPitchTypes(types);
        Pitch updated = pitchRepository.save(pitch);

        return ResponseEntity.ok(Map.of(
                "message", "Thêm sân con mới thành công!",
                "pitchTypes", updated.getPitchTypes()
        ));
    }

    /**
     * API Check-in Khách Vào Sân
     */
    @PutMapping("/bookings/{bookingId}/check-in")
    public ResponseEntity<?> checkInBooking(@PathVariable Long bookingId) {
        return bookingRepository.findById(bookingId).map(b -> {
            b.setStatus("PLAYING");
            b.setCashDue(0); // Đã thu đủ tại quầy
            bookingRepository.save(b);
            return ResponseEntity.ok(Map.of("message", "Check-in thành công! Khách đã vào sân.", "booking", b));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đơn đặt này.")));
    }

    /**
     * API Hủy Ca Đặt
     */
    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long bookingId) {
        return bookingRepository.findById(bookingId).map(b -> {
            bookingRepository.delete(b);
            return ResponseEntity.ok(Map.of("message", "Đã hủy ca đặt thành công. Khung giờ đã sẵn sàng cho khách khác."));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đơn đặt này.")));
    }

    /**
     * API Tra Cứu Mã Vé Hoặc Số Điện Thoại
     */
    @GetMapping("/bookings/search")
    public ResponseEntity<?> searchBooking(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập mã vé hoặc số điện thoại."));
        }
        String clean = query.trim();
        Optional<Booking> byCode = bookingRepository.findByCode(clean);
        if (byCode.isPresent()) {
            return ResponseEntity.ok(List.of(byCode.get()));
        }
        List<Booking> byPhone = bookingRepository.findByCustomerPhoneContaining(clean);
        return ResponseEntity.ok(byPhone);
    }
}
