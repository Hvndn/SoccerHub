package com.soccerhub.controller;

import com.soccerhub.dto.CreatePitchRequest;
import com.soccerhub.model.Booking;
import com.soccerhub.model.Pitch;
import com.soccerhub.model.User;
import com.soccerhub.repository.BookingRepository;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.service.NotificationService;
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
    private final NotificationService notificationService;

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
            int duration = durationMinutes > 0 ? durationMinutes : 120;
            int maxIterations = 50;
            while (current.plusMinutes(duration).compareTo(end) <= 0 && maxIterations-- > 0) {
                LocalTime next = current.plusMinutes(duration);
                if (next.compareTo(current) <= 0) break; // qua nửa đêm thì dừng
                slots.add(current.format(fmt) + " - " + next.format(fmt));
                current = next;
            }
        } catch (Exception e) {
            return List.of("14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00");
        }
        return slots.isEmpty() ? List.of("14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00") : slots;
    }

    /**
     * Kiểm tra hai khoảng thời gian có bị giao nhau (overlap) hay không
     */
    private boolean isTimeOverlapping(String slot1, String slot2) {
        if (slot1 == null || slot2 == null) return false;
        try {
            String[] parts1 = slot1.split("-");
            String[] parts2 = slot2.split("-");
            if (parts1.length < 2 || parts2.length < 2) return slot1.trim().equalsIgnoreCase(slot2.trim());

            String s1 = parts1[0].trim();
            String e1 = parts1[1].trim();
            String s2 = parts2[0].trim();
            String e2 = parts2[1].trim();

            return s1.compareTo(e2) < 0 && s2.compareTo(e1) < 0;
        } catch (Exception e) {
            return slot1.trim().equalsIgnoreCase(slot2.trim());
        }
    }

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || !timeStr.contains(":")) return 0;
        try {
            String[] parts = timeStr.trim().split(":");
            return Integer.parseInt(parts[0].trim()) * 60 + Integer.parseInt(parts[1].trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private String formatMinutesToTime(int totalMinutes) {
        int h = (totalMinutes / 60) % 24;
        int m = totalMinutes % 60;
        return String.format("%02d:%02d", h, m);
    }

    /**
     * API Cập Nhật Giờ Mở Cửa & Đóng Cửa Cụm Sân
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
        List<String> generatedSlots = generateTimeSlots(updated.getOpenTime(), updated.getCloseTime(), 90);

        return ResponseEntity.ok(Map.of(
                "message", "Cập nhật thời gian hoạt động của cụm sân thành công!",
                "openTime", updated.getOpenTime(),
                "closeTime", updated.getCloseTime(),
                "generatedSlots", generatedSlots
        ));
    }

    /**
     * API cập nhật giá thuê sân (giá thường & giá giờ vàng) của một cụm sân.
     */
    @PutMapping("/{id}/price")
    public ResponseEntity<?> updatePitchPrice(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req
    ) {
        Integer avgPrice = req.get("avgPricePerHour") != null
                ? Integer.valueOf(req.get("avgPricePerHour").toString())
                : null;
        Integer peakPrice = req.get("peakPricePerHour") != null
                ? Integer.valueOf(req.get("peakPricePerHour").toString())
                : null;

        try {
            Pitch updated = pitchService.updatePrice(id, avgPrice, peakPrice);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã cập nhật giá sân thành công.",
                    "pitch", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Lỗi cập nhật giá sân: " + e.getMessage()));
        }
    }

    /**
     * API Lấy Ma Trận Ca Sân Thời Gian Thực (Hỗ Trợ Người Dùng Chọn Đá 60p, 90p hoặc 120p)
     */
    @GetMapping("/{id}/matrix")
    public ResponseEntity<?> getPitchMatrix(
            @PathVariable Long id,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer duration
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

        // Thời lượng ca sân (Mặc định 2 tiếng = 120 phút, bao gồm thi đấu và giao/trả ca)
        int defaultDuration = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0)
                ? pitch.getSlotDurationMinutes()
                : 120;
        int slotDuration = (duration != null && duration > 0) ? duration : defaultDuration;
        List<String> standardSlots = generateTimeSlots(pitch.getOpenTime(), pitch.getCloseTime(), slotDuration);

        // Lấy tất cả booking trong ngày để kiểm tra chống trùng giờ linh hoạt
        List<Booking> dayBookings = bookingRepository.findByPitchIdAndBookingDate(id, targetDate);

        List<Map<String, Object>> matrix = new ArrayList<>();

        for (int i = 0; i < courtList.size(); i++) {
            String courtName = courtList.get(i);
            boolean is7 = courtName.toLowerCase().contains("7");
            boolean is5 = courtName.toLowerCase().contains("5");
            boolean is11 = courtName.toLowerCase().contains("11");
            String courtType = is7 ? "Sân 7 Người" : is5 ? "Sân 5 Người" : is11 ? "Sân 11" : "Sân Tiêu Chuẩn";

            int courtBase = is11 ? Math.round(base * 2) : is7 ? base : Math.round(base * 0.75f);
            int courtPeak = is11 ? Math.round(peak * 2) : is7 ? peak : Math.round(peak * 0.75f);

            // Tính giá theo thời lượng linh hoạt
            float hourMultiplier = slotDuration / 60.0f;
            int courtBaseForDuration = Math.round(courtBase * hourMultiplier);
            int courtPeakForDuration = Math.round(courtPeak * hourMultiplier);

            List<Map<String, Object>> slotsData = new ArrayList<>();

            for (int sIdx = 0; sIdx < standardSlots.size(); sIdx++) {
                String timeSlot = standardSlots.get(sIdx);
                boolean isPeakHour = timeSlot.contains("17:") || timeSlot.contains("18:") || timeSlot.contains("19:");
                int slotPrice = isPeakHour ? courtPeakForDuration : courtBaseForDuration;

                // Kiểm tra xem khung giờ này có bị giao với booking nào đã đặt không
                Optional<Booking> optBooking = dayBookings.stream()
                        .filter(b -> b.getCourtName().equalsIgnoreCase(courtName) && isTimeOverlapping(timeSlot, b.getTimeSlot()))
                        .findFirst();

                Map<String, Object> slotObj = new HashMap<>();
                slotObj.put("time", timeSlot);
                slotObj.put("durationMinutes", slotDuration);

                if (optBooking.isPresent()) {
                    Booking b = optBooking.get();
                    boolean isContinuation = slotsData.stream()
                            .anyMatch(s -> s.get("bookingId") != null && s.get("bookingId").equals(b.getId()));

                    slotObj.put("bookingId", b.getId());
                    slotObj.put("bookingTimeSlot", b.getTimeSlot());
                    slotObj.put("isContinuation", isContinuation);
                    slotObj.put("status", b.getStatus().toLowerCase()); // booked, playing, resale
                    slotObj.put("customer", b.getCustomerName());
                    slotObj.put("phone", b.getCustomerPhone());
                    slotObj.put("via", b.getVia());
                    slotObj.put("code", b.getCode());

                    if (isContinuation) {
                        slotObj.put("id", "booking-" + b.getId() + "-cont-" + sIdx);
                        slotObj.put("price", "Đã gộp đơn");
                        slotObj.put("depositPaid", "Đã thu ca trước");
                        slotObj.put("cashDue", "0k");
                        slotObj.put("note", "Ca nối dài của " + b.getCustomerName() + " (" + b.getTimeSlot() + ")");
                    } else {
                        slotObj.put("id", "booking-" + b.getId());
                        slotObj.put("price", (b.getTotalPrice() != null ? (b.getTotalPrice() / 1000) : (slotPrice / 1000)) + "k");
                        slotObj.put("depositPaid", (b.getDepositPaid() != null ? (b.getDepositPaid() / 1000) : 0) + "k");
                        slotObj.put("cashDue", (b.getCashDue() != null ? (b.getCashDue() / 1000) : 0) + "k");
                        slotObj.put("note", "Đơn chính (" + b.getTimeSlot() + ")");
                    }
                } else {
                    // Ca trống thật sự
                    slotObj.put("id", "empty-" + id + "-" + i + "-" + sIdx);
                    slotObj.put("bookingId", null);
                    slotObj.put("bookingTimeSlot", null);
                    slotObj.put("isContinuation", false);
                    slotObj.put("status", "empty");
                    slotObj.put("customer", "Ca Trống");
                    slotObj.put("phone", "—");
                    slotObj.put("price", (slotPrice / 1000) + "k");
                    slotObj.put("depositPaid", "0k");
                    slotObj.put("cashDue", "0k");
                    slotObj.put("via", "Sẵn sàng nhận khách");
                    slotObj.put("code", "—");
                    slotObj.put("note", "Ca trống");
                }
                slotsData.add(slotObj);
            }

            // --- THUẬT TOÁN QUÉT KHE TRỐNG TỰ ĐỘNG (DYNAMIC GAP SLOTS) ---
            List<int[]> busyIntervals = new ArrayList<>();
            for (Booking b : dayBookings) {
                if (b.getCourtName().equalsIgnoreCase(courtName) && b.getTimeSlot() != null && b.getTimeSlot().contains("-")) {
                    String[] parts = b.getTimeSlot().split("-");
                    int bStart = parseTimeToMinutes(parts[0]);
                    int bEnd = parseTimeToMinutes(parts[1]);
                    if (bEnd > bStart) {
                        busyIntervals.add(new int[]{bStart, bEnd});
                    }
                }
            }

            // Sắp xếp các khoảng bận theo thời gian bắt đầu
            busyIntervals.sort(Comparator.comparingInt(a -> a[0]));

            // Hợp nhất các khoảng bận giao nhau (merge intervals)
            List<int[]> mergedBusy = new ArrayList<>();
            for (int[] interval : busyIntervals) {
                if (mergedBusy.isEmpty()) {
                    mergedBusy.add(interval);
                } else {
                    int[] last = mergedBusy.get(mergedBusy.size() - 1);
                    if (interval[0] <= last[1]) {
                        last[1] = Math.max(last[1], interval[1]);
                    } else {
                        mergedBusy.add(interval);
                    }
                }
            }

            int openMin = parseTimeToMinutes(pitch.getOpenTime() != null ? pitch.getOpenTime() : "13:00");
            int closeMin = parseTimeToMinutes(pitch.getCloseTime() != null ? pitch.getCloseTime() : "22:30");

            // Tìm các khoảng trống (gaps) giữa giờ mở cửa và giờ đóng cửa
            List<int[]> freeGaps = new ArrayList<>();
            int currentCursor = openMin;
            for (int[] busy : mergedBusy) {
                if (busy[0] > currentCursor) {
                    freeGaps.add(new int[]{currentCursor, busy[0]});
                }
                currentCursor = Math.max(currentCursor, busy[1]);
            }
            if (currentCursor < closeMin) {
                freeGaps.add(new int[]{currentCursor, closeMin});
            }

            // Với mỗi khoảng trống, nếu có thể vừa 1 ca đá (tối thiểu 60 phút) và chưa có trong slotsData -> chèn ca lọt khe
            for (int[] gap : freeGaps) {
                int gapStart = gap[0];
                int gapEnd = gap[1];
                int gapLen = gapEnd - gapStart;

                if (gapLen >= 60) {
                    int targetDur = (gapLen >= slotDuration) ? slotDuration : (gapLen >= 90 ? 90 : 60);
                    if (targetDur <= 0) targetDur = 60;
                    int testStart = gapStart;
                    int maxGapIterations = 50;

                    while (testStart + targetDur <= gapEnd && maxGapIterations-- > 0) {
                        String gapSlotTime = formatMinutesToTime(testStart) + " - " + formatMinutesToTime(testStart + targetDur);

                        // Kiểm tra xem slot này đã tồn tại trong slotsData chưa
                        boolean alreadyExists = slotsData.stream()
                                .anyMatch(s -> gapSlotTime.equalsIgnoreCase((String) s.get("time")));

                        if (!alreadyExists) {
                            boolean isPeakHour = gapSlotTime.contains("17:") || gapSlotTime.contains("18:") || gapSlotTime.contains("19:");
                            float durMultiplier = targetDur / 60.0f;
                            int gapPrice = Math.round((isPeakHour ? courtPeak : courtBase) * durMultiplier);

                            Map<String, Object> gapSlotObj = new HashMap<>();
                            gapSlotObj.put("id", "gap-" + id + "-" + i + "-" + testStart);
                            gapSlotObj.put("time", gapSlotTime);
                            gapSlotObj.put("durationMinutes", targetDur);
                            gapSlotObj.put("bookingId", null);
                            gapSlotObj.put("bookingTimeSlot", null);
                            gapSlotObj.put("isContinuation", false);
                            gapSlotObj.put("isGapSlot", true);
                            gapSlotObj.put("status", "empty");
                            gapSlotObj.put("customer", "Ca Trống Lọt Khe");
                            gapSlotObj.put("phone", "—");
                            gapSlotObj.put("price", (gapPrice / 1000) + "k");
                            gapSlotObj.put("depositPaid", "0k");
                            gapSlotObj.put("cashDue", "0k");
                            gapSlotObj.put("via", "⚡ Ca Lọt Khe (Tận dụng giờ trống)");
                            gapSlotObj.put("code", "—");
                            gapSlotObj.put("note", "Khe trống " + targetDur + " phút giữa các ca");

                            slotsData.add(gapSlotObj);
                        }

                        testStart += targetDur;
                    }
                }
            }

            // Sắp xếp toàn bộ slotsData theo thứ tự thời gian bắt đầu tăng dần
            slotsData.sort(Comparator.comparingInt(s -> parseTimeToMinutes(((String) s.get("time")).split("-")[0].trim())));

            Map<String, Object> courtObj = new HashMap<>();
            courtObj.put("pitchId", "court-" + id + "-" + i);
            courtObj.put("pitchName", courtName);
            courtObj.put("type", courtType);
            courtObj.put("basePrice", courtBaseForDuration);
            courtObj.put("peakPrice", courtPeakForDuration);
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

        int duration = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0) ? pitch.getSlotDurationMinutes() : 120;
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
     * API Lấy Danh Sách Booking Của Cụm Sân Trong Ngày
     */
    @GetMapping("/{id}/bookings")
    public ResponseEntity<?> getPitchBookings(
            @PathVariable Long id,
            @RequestParam(required = false) String date
    ) {
        String targetDate = (date != null && !date.trim().isEmpty()) 
                ? date.trim() 
                : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<Booking> bookings = bookingRepository.findByPitchIdAndBookingDate(id, targetDate);
        return ResponseEntity.ok(bookings);
    }

    /**
     * API Tạo Đặt Ca Tại Quầy hoặc Đặt Trực Tuyến (Lưu trực tiếp vào MySQL)
     */
    @PostMapping(value = {"/{id}/book-offline", "/{id}/offline-book"})
    public ResponseEntity<?> bookOfflineSlot(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req
    ) {
        String courtName = (String) req.get("courtName");
        String timeSlot = (String) req.get("timeSlot");
        String customerName = (String) req.get("customerName");
        String customerPhone = (String) req.get("customerPhone");
        String bookingDate = (String) req.getOrDefault("bookingDate", LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        Integer totalPrice = req.get("totalPrice") != null 
                ? (int) Math.round(Double.parseDouble(req.get("totalPrice").toString())) 
                : 500000;
        Integer depositPaid = req.get("depositPaid") != null 
                ? (int) Math.round(Double.parseDouble(req.get("depositPaid").toString())) 
                : 250000;
        Integer cashDue = totalPrice - depositPaid;

        if (courtName == null || timeSlot == null || customerName == null || customerPhone == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ thông tin đặt sân."));
        }

        // Kiểm tra xem ca đã có người đặt chưa (Kiểm tra trùng giờ linh hoạt)
        List<Booking> courtBookings = bookingRepository.findByPitchIdAndBookingDate(id, bookingDate);
        boolean isConflict = courtBookings.stream()
                .anyMatch(b -> b.getCourtName().equalsIgnoreCase(courtName) && isTimeOverlapping(timeSlot, b.getTimeSlot()));
        if (isConflict) {
            return ResponseEntity.badRequest().body(Map.of("message", "Khung giờ này đã có đội đặt hoặc bị trùng giờ với một ca thi đấu khác! Vui lòng chọn giờ khác."));
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
        notificationService.notify("OWNER",
                "Đơn đặt sân mới: " + customerName,
                customerName + " (" + customerPhone + ") vừa đặt " + courtName + " ca " + timeSlot + " ngày " + bookingDate + ". Mã: " + code + ".",
                "BOOKING", null);
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
     * API Hủy Ca Đặt (Có Lý Do Hủy và Gửi Thông Báo Tới Người Đặt Sân)
     */
    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<?> cancelBookingWithReason(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, Object> req
    ) {
        String reason = (req != null && req.get("reason") != null && !req.get("reason").toString().trim().isEmpty())
                ? req.get("reason").toString().trim()
                : "Chủ sân thông báo bảo trì hoặc thời tiết không đảm bảo";
        String cancelledBy = (req != null && req.get("cancelledBy") != null)
                ? req.get("cancelledBy").toString().trim()
                : "OWNER";

        return bookingRepository.findById(bookingId).map(b -> {
            b.setStatus("CANCELLED");
            b.setCancelReason(reason);
            b.setCancelledBy(cancelledBy);
            
            // Xóa để giải phóng slot trống cho khách khác
            bookingRepository.delete(b);

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Đã hủy ca đặt thành công và gửi thông báo tới người đặt sân.");
            resp.put("bookingId", bookingId);
            resp.put("code", b.getCode() != null ? b.getCode() : "—");
            resp.put("customerName", b.getCustomerName());
            resp.put("customerPhone", b.getCustomerPhone());
            resp.put("courtName", b.getCourtName());
            resp.put("timeSlot", b.getTimeSlot());
            resp.put("bookingDate", b.getBookingDate());
            resp.put("cancelReason", reason);
            resp.put("cancelledBy", cancelledBy);
            resp.put("refundDeposit", b.getDepositPaid() != null ? b.getDepositPaid() : 0);

            return ResponseEntity.ok((Object) resp);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đơn đặt này.")));
    }

    @DeleteMapping("/bookings/{bookingId}")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String reason
    ) {
        String cancelReason = (reason != null && !reason.trim().isEmpty()) 
                ? reason.trim() 
                : "Chủ sân hủy ca đặt";

        return bookingRepository.findById(bookingId).map(b -> {
            bookingRepository.delete(b);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã hủy ca đặt thành công. Khung giờ đã sẵn sàng cho khách khác.",
                    "bookingId", bookingId,
                    "customerName", b.getCustomerName(),
                    "cancelReason", cancelReason
            ));
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
