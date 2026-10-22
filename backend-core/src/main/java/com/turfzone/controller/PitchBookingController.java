package com.turfzone.controller;

import com.turfzone.dto.CreatePitchRequest;
import com.turfzone.model.Booking;
import com.turfzone.model.Pitch;
import com.turfzone.model.User;
import com.turfzone.repository.BookingRepository;
import com.turfzone.repository.PitchRepository;
import com.turfzone.service.NotificationService;
import com.turfzone.service.EmailService;
import com.turfzone.service.PitchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/pitches")
@RequiredArgsConstructor
public class PitchBookingController {

    private final PitchService pitchService;
    private final PitchRepository pitchRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;
    private final com.turfzone.service.EmailService emailService;
    private final com.turfzone.repository.UserRepository userRepository;

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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> createPitch(@AuthenticationPrincipal User currentUser, @RequestBody CreatePitchRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập với tài khoản Chủ Sân để tạo sân mới."));
        }
        try {
            Pitch createdPitch = pitchService.createPitch(request, currentUser);
            // Đã có cụm sân -> chủ sân hoàn tất bước khởi tạo (hết bị ép vào onboarding).
            if (currentUser.getProfileCompleted() == null || !currentUser.getProfileCompleted()) {
                currentUser.setProfileCompleted(true);
                userRepository.save(currentUser);
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPitch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Lỗi tạo cụm sân: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> deletePitch(@AuthenticationPrincipal User currentUser, @PathVariable Long id) {
        try {
            pitchService.deletePitch(id, currentUser);
            return ResponseEntity.ok(Map.of("message", "Đã xóa cụm sân thành công."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/clear-all")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updateOperatingHours(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String openTime = (String) req.get("openTime");
        String closeTime = (String) req.get("closeTime");
        Integer duration = req.get("slotDurationMinutes") != null
                ? Integer.valueOf(req.get("slotDurationMinutes").toString())
                : 90;

        try {
            Pitch updated = pitchService.updateOperatingHours(id, openTime, closeTime, duration, me);
            // Sinh ca theo ĐÚNG slotDurationMinutes vừa lưu (trước đây hardcode 90)
            int slotMin = updated.getSlotDurationMinutes() != null && updated.getSlotDurationMinutes() > 0
                    ? updated.getSlotDurationMinutes() : 90;
            List<String> generatedSlots = generateTimeSlots(updated.getOpenTime(), updated.getCloseTime(), slotMin);

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật thời gian hoạt động của cụm sân thành công!",
                    "openTime", updated.getOpenTime(),
                    "closeTime", updated.getCloseTime(),
                    "slotDurationMinutes", slotMin,
                    "generatedSlots", generatedSlots
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Lỗi cập nhật giờ hoạt động: " + e.getMessage()));
        }
    }

    /**
     * API Cập Nhật Hồ Sơ Cụm Sân (tên, địa chỉ, SĐT, bộ môn, tiện ích, ảnh, mô tả).
     *
     * <p>Trước đây chủ sân tạo xong không sửa được gì: chỉ có API đổi giá
     * (PUT /{id}/price) và giờ mở cửa (PUT /{id}/operating-hours).</p>
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updatePitchInfo(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        try {
            Pitch updated = pitchService.updatePitchInfo(id, req, me);
            return ResponseEntity.ok(Map.of(
                    "message", "Đã cập nhật hồ sơ cụm sân.",
                    "pitch", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Lỗi cập nhật hồ sơ cụm sân: " + e.getMessage()));
        }
    }

    /**
     * API cập nhật giá thuê sân (giá thường & giá giờ vàng) của một cụm sân.
     */
    @PutMapping("/{id}/price")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> updatePitchPrice(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        Integer avgPrice = req.get("avgPricePerHour") != null
                ? Integer.valueOf(req.get("avgPricePerHour").toString())
                : null;
        Integer peakPrice = req.get("peakPricePerHour") != null
                ? Integer.valueOf(req.get("peakPricePerHour").toString())
                : null;

        try {
            Pitch updated = pitchService.updatePrice(id, avgPrice, peakPrice, me);
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
            @RequestParam(required = false) Integer duration,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        Pitch pitch = pitchService.getPitchById(id);
        // Chỉ chủ sân của cụm sân này (hoặc ADMIN) mới xem được SĐT đầy đủ của khách.
        boolean fullAccess = me != null && ("ADMIN".equals(me.getRole().name())
                || (pitch.getOwnerId() != null && pitch.getOwnerId().equals(me.getId())));
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

        // Lấy tất cả booking trong ngày để kiểm tra chống trùng giờ linh hoạt.
        // Đơn đã hủy (CANCELLED) vẫn giữ trong CSDL để khách xem lịch sử,
        // nhưng KHÔNG được coi là đã chiếm khung giờ.
        List<Booking> dayBookings = bookingRepository.findByPitchIdAndBookingDate(id, targetDate).stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        List<Map<String, Object>> matrix = new ArrayList<>();

        for (int i = 0; i < courtList.size(); i++) {
            String courtName = courtList.get(i);
            boolean is7 = courtName.toLowerCase().contains("7");
            boolean is5 = courtName.toLowerCase().contains("5");
            boolean is11 = courtName.toLowerCase().contains("11");
            String courtType = is7 ? "Sân 7 Người" : is5 ? "Sân 5 Người" : is11 ? "Sân 11" : "Sân Tiêu Chuẩn";

            // Gia rieng cua chu san (neu co) thi dung gia do; khong co thi suy ra nhu cu.
            Integer ownBase = pitch.getCourtBasePrices() != null ? pitch.getCourtBasePrices().get(courtName) : null;
            Integer ownPeak = pitch.getCourtPeakPrices() != null ? pitch.getCourtPeakPrices().get(courtName) : null;
            int courtBase = ownBase != null ? ownBase
                    : (is11 ? Math.round(base * 2) : is7 ? base : Math.round(base * 0.75f));
            int courtPeak = ownPeak != null ? ownPeak
                    : (is11 ? Math.round(peak * 2) : is7 ? peak : Math.round(peak * 0.75f));

            // Tính giá theo thời lượng linh hoạt
            float hourMultiplier = slotDuration / 60.0f;
            int courtBaseForDuration = Math.round(courtBase * hourMultiplier);
            int courtPeakForDuration = Math.round(courtPeak * hourMultiplier);

            List<Map<String, Object>> slotsData = new ArrayList<>();

            for (int sIdx = 0; sIdx < standardSlots.size(); sIdx++) {
                String timeSlot = standardSlots.get(sIdx);
                boolean isPeakHour = isPeakStart(timeSlot);
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
                    slotObj.put("phone", fullAccess ? b.getCustomerPhone() : maskPhone(b.getCustomerPhone()));
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
                        slotObj.put("priceValue", b.getTotalPrice() != null ? b.getTotalPrice() : slotPrice);
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
                    // Gia so chinh xac (khong lam tron ve "k") de FE bao gia khop thu phi.
                    slotObj.put("priceValue", slotPrice);
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
                            boolean isPeakHour = isPeakStart(gapSlotTime);
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
    /**
     * Tính giá một ca sân theo ĐÚNG công thức dùng ở ma trận:
     * giá giờ × hệ số loại sân con (Sân 11 ×2, Sân 7 ×1, Sân 5 ×0.75) × thời lượng ca.
     * Dùng chung để bảo đảm giá hiển thị và giá thực thu luôn khớp.
     */
    /** Đọc giá số từ request (bỏ qua giá trị rỗng / không hợp lệ). */
    private Integer readPrice(Object raw) {
        if (raw == null) return null;
        try {
            int v = (int) Math.round(Double.parseDouble(raw.toString().trim()));
            return v > 0 ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private int computeSlotPrice(Pitch pitch, String courtName, String timeSlot) {
        boolean isPeak = isPeakStart(timeSlot);
        int baseHour = (pitch.getAvgPricePerHour() != null)
                ? pitch.getAvgPricePerHour() : 350000;
        int peakHour = (pitch.getPeakPricePerHour() != null)
                ? pitch.getPeakPricePerHour() : 500000;
        String cn = courtName != null ? courtName.toLowerCase() : "";
        Integer ownBase = pitch.getCourtBasePrices() != null ? pitch.getCourtBasePrices().get(courtName) : null;
        Integer ownPeak = pitch.getCourtPeakPrices() != null ? pitch.getCourtPeakPrices().get(courtName) : null;
        int courtBase = ownBase != null ? ownBase
                : (cn.contains("11") ? Math.round(baseHour * 2f)
                : cn.contains("7") ? baseHour : Math.round(baseHour * 0.75f));
        int courtPeak = ownPeak != null ? ownPeak
                : (cn.contains("11") ? Math.round(peakHour * 2f)
                : cn.contains("7") ? peakHour : Math.round(peakHour * 0.75f));
        int hourPrice = isPeak ? courtPeak : courtBase;
        int durationMin = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0)
                ? pitch.getSlotDurationMinutes() : 120;
        return Math.round(hourPrice * (durationMin / 60.0f));
    }

    /**
     * Mức cọc do khách chọn (50% hoặc 100%) — server tự kiểm tra, không tin client.
     */
    private int computeDeposit(int totalPrice, Object depositPercentRaw) {
        int pct = 50;
        if (depositPercentRaw != null) {
            try {
                pct = Integer.parseInt(depositPercentRaw.toString().trim());
            } catch (NumberFormatException ignored) {
                pct = 50;
            }
        }
        if (pct != 100) pct = 50;
        return Math.min(Math.round(totalPrice * (pct / 100.0f)), totalPrice);
    }

    public ResponseEntity<?> getPitchRealStats(
            @PathVariable Long id,
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        Pitch pitch = pitchService.getPitchById(id);
        String targetDate = (date != null && !date.trim().isEmpty()) 
                ? date.trim() 
                : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        // Đơn CANCELLED không chiếm ca và không tính doanh thu
        List<Booking> allDayBookings = bookingRepository.findByPitchIdAndBookingDate(id, targetDate);
        List<Booking> bookings = allDayBookings.stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        int duration = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0) ? pitch.getSlotDurationMinutes() : 120;
        int slotsPerCourt = generateTimeSlots(pitch.getOpenTime(), pitch.getCloseTime(), duration).size();
        int totalSlots = (pitch.getPitchTypes() != null ? pitch.getPitchTypes().size() : 2) * (slotsPerCourt > 0 ? slotsPerCourt : 4);
        int bookedSlots = bookings.size();

        int totalRevenue = 0;
        int onlineCount = 0;
        int offlineCounterCount = 0;

        for (Booking b : bookings) {
            int deposit = b.getDepositPaid() != null ? b.getDepositPaid() : 0;
            int cash = ("PLAYING".equalsIgnoreCase(b.getStatus()) || "COMPLETED".equalsIgnoreCase(b.getStatus())) 
                    ? (b.getCashDue() != null ? b.getCashDue() : 0) 
                    : 0;
            totalRevenue += (deposit + cash);

            // Ca đặt qua website ("Đặt qua Website") hoặc giá trị cũ (VietQR/Online/MoMo) — còn lại là tại quầy
            String via = b.getVia() != null ? b.getVia() : "";
            if (via.contains("Website") || via.contains("VietQR") || via.contains("Online") || via.contains("MoMo")) {
                onlineCount++;
            } else {
                offlineCounterCount++;
            }
        }

        int occupancyRate = totalSlots > 0 ? (int) Math.round((bookedSlots * 100.0) / totalSlots) : 0;

        Map<String, Object> stats = new HashMap<>();
        stats.put("pitchId", id);
        stats.put("pitchName", pitch.getName());
        stats.put("date", targetDate);
        // Doanh thu là dữ liệu nhạy cảm — chỉ chủ sân của cụm sân này (hoặc ADMIN) mới thấy.
        boolean isAdmin = me != null && "ADMIN".equals(me.getRole().name());
        boolean isOwner = me != null && pitch.getOwnerId() != null && pitch.getOwnerId().equals(me.getId());
        if (isAdmin || isOwner) {
            stats.put("totalRevenue", totalRevenue);
        }
        stats.put("occupancyRate", occupancyRate);
        stats.put("totalSlots", totalSlots);
        stats.put("bookedSlots", bookedSlots);
        stats.put("onlineBookings", onlineCount);
        stats.put("counterBookings", offlineCounterCount);
        stats.put("cancelledBookings", allDayBookings.size() - bookings.size());
        stats.put("openTime", pitch.getOpenTime());
        stats.put("closeTime", pitch.getCloseTime());
        stats.put("slotDurationMinutes", pitch.getSlotDurationMinutes());

        // Nhu cau theo khung gio trong ngay (dung cho bieu do "gio nao hot nhat" cua chu san).
        // Gom don theo gio bat dau cua ca, bo qua don da huy.
        Map<Integer, Integer> byHour = new java.util.TreeMap<>();
        for (Booking b : bookings) {
            Integer h = parseStartHour(b.getTimeSlot());
            if (h == null) continue;
            byHour.merge(h, 1, Integer::sum);
        }
        List<Map<String, Object>> hourlyBookings = new ArrayList<>();
        for (Map.Entry<Integer, Integer> e : byHour.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("hour", e.getKey());
            row.put("count", e.getValue());
            hourlyBookings.add(row);
        }
        stats.put("hourlyBookings", hourlyBookings);

        return ResponseEntity.ok(stats);
    }

    /**
     * Lay gio bat dau cua ca tu chuoi khoang gio trong CSDL.
     * VD: "17:00 - 19:00" -> 17 ; "16:00" -> 16 ; khong hieu -> null.
     */
    /**
     * Ca giờ vàng (cao điểm): xét theo GIỜ BẮT ĐẦU của ca.
     *
     * <p>Trước đây dùng {@code contains("17:")} nên ca "16:00 - 18:00" cũng bị tính
     * giá vàng (vì chuỗi có "18:"). Nay chỉ ca bắt đầu 17h/18h/19h mới là giờ vàng —
     * khớp với tiêu chí hiển thị ở giao diện.</p>
     */
    private static boolean isPeakStart(String timeSlot) {
        if (timeSlot == null) return false;
        String head = timeSlot.trim().split("-")[0].trim();
        try {
            int hour = Integer.parseInt(head.split(":")[0].trim());
            return hour >= 17 && hour <= 19;
        } catch (Exception e) {
            return false;
        }
    }

    private static Integer parseStartHour(String timeSlot) {
        if (timeSlot == null || timeSlot.trim().isEmpty()) return null;
        String head = timeSlot.trim().split("-")[0].trim();
        int colon = head.indexOf(':');
        if (colon <= 0) return null;
        try {
            int h = Integer.parseInt(head.substring(0, colon).trim());
            if (h < 0 || h > 23) return null;
            return h;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * API Lấy Danh Sách Booking Của Cụm Sân Trong Ngày
     */
/**
 * Che số điện thoại khi trả về cho người KHÔNG phải chủ sân.
 * VD: "0912345678" -> "0912****678" (giữ 4 số đầu + 3 số cuối).
 */
    private static String maskPhone(String phone) {
        if (phone == null || phone.isBlank()) return phone;
        String s = phone.trim();
        if (s.length() <= 7) return "*******";
        return s.substring(0, 4) + "****" + s.substring(s.length() - 3);
    }

    /** Bản sao đơn đặt đã che số điện thoại (không trả entity gốc ra ngoài). */
    private static Map<String, Object> maskedBooking(Booking b) {
        Map<String, Object> m = new java.util.LinkedHashMap<>();
        m.put("id", b.getId());
        m.put("pitchId", b.getPitchId());
        m.put("courtName", b.getCourtName());
        m.put("courtType", b.getCourtType());
        m.put("bookingDate", b.getBookingDate());
        m.put("timeSlot", b.getTimeSlot());
        m.put("customerName", b.getCustomerName());
        m.put("customerPhone", maskPhone(b.getCustomerPhone()));
        m.put("totalPrice", b.getTotalPrice());
        m.put("depositPaid", b.getDepositPaid());
        m.put("cashDue", b.getCashDue());
        m.put("status", b.getStatus());
        m.put("via", b.getVia());
        m.put("code", b.getCode());
        m.put("createdAt", b.getCreatedAt());
        return m;
    }

    /**
     * Danh sách đơn đặt của một cụm sân trong ngày.
     *
     * <p>Yêu cầu đăng nhập: trước đây endpoint công khai trả về TÊN + SỐ ĐIỆN THOẠI
     * của mọi khách, ai cũng gọi được.</p>
     */
    @GetMapping("/{id}/bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getPitchBookings(
            @PathVariable Long id,
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String targetDate = (date != null && !date.trim().isEmpty())
                ? date.trim()
                : LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<Booking> bookings = bookingRepository.findByPitchIdAndBookingDate(id, targetDate);

        boolean privileged = me != null && me.getRole() != null
                && ("OWNER".equals(me.getRole().name()) || "ADMIN".equals(me.getRole().name()));
        Pitch pitch = pitchRepository.findById(id).orElse(null);
        boolean isOwnerOfPitch = pitch != null && pitch.getOwnerId() != null && me != null
                && pitch.getOwnerId().equals(me.getId());

        // Chủ sân của chính cụm sân này hoặc ADMIN được xem đầy đủ; người khác xem số đã che.
        boolean fullAccess = privileged && (isOwnerOfPitch
                || (me != null && me.getRole() != null && "ADMIN".equals(me.getRole().name())));

        List<Map<String, Object>> out = bookings.stream()
                .map(b -> fullAccess ? bookingToMap(b) : maskedBooking(b))
                .toList();
        return ResponseEntity.ok(out);
    }

    private static Map<String, Object> bookingToMap(Booking b) {
        Map<String, Object> m = maskedBooking(b);
        m.put("customerPhone", b.getCustomerPhone());
        m.put("cancelReason", b.getCancelReason());
        m.put("cancelledBy", b.getCancelledBy());
        return m;
    }

    /**
     * API Tạo Đặt Ca Tại Quầy hoặc Đặt Trực Tuyến (Lưu trực tiếp vào MySQL)
     */
    /**
     * API Đặt Sân Trực Tuyến của KHÁCH (khác với book-offline là chủ sân tạo đơn tại quầy).
     *
     * <p>QUAN TRỌNG: endpoint này KHÔNG yêu cầu là chủ sân — trước đây giao diện khách cũng
     * gọi /book-offline nên sau khi siết chống IDOR cho chủ sân, KHÁCH HÀNG KHÔNG ĐẶT ĐƯỢC SÂN.
     * Giá và mức cọc luôn do server tính lại, client không thể khai giá rẻ hơn thực tế.</p>
     */
    @PostMapping("/{id}/book")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> bookSlotOnline(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String courtName = (String) req.get("courtName");
        String timeSlot = (String) req.get("timeSlot");
        String customerName = (String) req.get("customerName");
        String customerPhone = (String) req.get("customerPhone");
        String bookingDate = (String) req.getOrDefault("bookingDate",
                LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));

        if (courtName == null || timeSlot == null || customerName == null || customerPhone == null
                || courtName.isBlank() || timeSlot.isBlank()
                || customerName.isBlank() || customerPhone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ thông tin đặt sân."));
        }

        Pitch pitch = pitchService.getPitchById(id);

        // Gia + muc coc luon do server tinh lai.
        int totalPrice = computeSlotPrice(pitch, courtName, timeSlot);
        int depositPaid = computeDeposit(totalPrice, req.get("depositPercent"));
        int cashDue = totalPrice - depositPaid;

        // Chong trung gio: don da huy thi ca trong lai.
        List<Booking> courtBookings = bookingRepository.findByPitchIdAndBookingDate(id, bookingDate).stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        boolean isConflict = courtBookings.stream()
                .anyMatch(b -> b.getCourtName().equalsIgnoreCase(courtName) && isTimeOverlapping(timeSlot, b.getTimeSlot()));
        if (isConflict) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Khung giờ này đã có đội đặt hoặc bị trùng giờ với một ca thi đấu khác! Vui lòng chọn giờ khác."));
        }

        String code = "VS-" + id + "-" + (System.currentTimeMillis() % 10000);
        String via = (String) req.getOrDefault("via", "Đặt qua Website");

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
                .via(via)
                .code(code)
                .build();
        Booking saved = bookingRepository.save(booking);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping(value = {"/{id}/book-offline", "/{id}/offline-book"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> bookOfflineSlot(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String courtName = (String) req.get("courtName");
        String timeSlot = (String) req.get("timeSlot");
        String customerName = (String) req.get("customerName");
        String customerPhone = (String) req.get("customerPhone");
        String bookingDate = (String) req.getOrDefault("bookingDate", LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        
        // Chỉ chủ sân của cụm sân này mới được tạo đơn tại quầy — trước đây mọi tài
        // khoản đăng nhập đều đặt được vào cụm sân của người khác (IDOR ghi).
        Pitch ownerPitch = pitchService.getPitchById(id);
        try {
            assertOwnsPitch(ownerPitch, me);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        // GIÁ LUÔN TÍNH Ở SERVER — không nhận totalPrice/depositPaid từ client
        // (client có thể tự khai giá 1đ làm sai số liệu doanh thu của chủ sân).
        // Dung CHUNG cong thuc voi ma tran (gia hien thi = gia thu phi) + ho tro
        // gia rieng cua chu san cho tung san con.
        Integer totalPrice = computeSlotPrice(ownerPitch, courtName, timeSlot);
        // Cọc tối đa 50% giá ca (đúng chính sách hiển thị ở giao diện).
        // Muc coc: 50% (mac dinh) hoac 100% — server kiem tra, khong tin client.
        Integer depositPaid = computeDeposit(totalPrice, req.get("depositPercent"));
        Integer cashDue = totalPrice - depositPaid;

        if (courtName == null || timeSlot == null || customerName == null || customerPhone == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ thông tin đặt sân."));
        }

        // Kiểm tra xem ca đã có người đặt chưa (Kiểm tra trùng giờ linh hoạt).
        // Đơn đã hủy thì ca đã trống trở lại nên không tính trùng.
        List<Booking> courtBookings = bookingRepository.findByPitchIdAndBookingDate(id, bookingDate).stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .collect(java.util.stream.Collectors.toList());
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
        // Gửi cho CHÍNH chủ sân của cụm sân này. Trước đây targetRole="OWNER" khiến
        // mọi chủ sân trong hệ thống đều thấy SĐT + tên khách của cụm sân khác.
        String ownerEmail = ownerPitch.getOwnerId() != null
                ? userRepository.findById(ownerPitch.getOwnerId()).map(u -> u.getEmail()).orElse(null)
                : null;
        if (ownerEmail != null) {
            notificationService.notify("OWNER", ownerEmail,
                    "Đơn đặt sân mới: " + customerName,
                    customerName + " vừa đặt " + courtName + " ca " + timeSlot + " ngày " + bookingDate + ". Mã: " + code + ".",
                    "BOOKING", null);
        }

        // Gửi email xác nhận cho KHÁCH + báo cho CHỦ SÂN (nếu đã bật SMTP).
        // Lỗi email KHÔNG làm hỏng việc tạo đơn — đơn đã lưu ở trên.
        sendBookingEmails(saved);

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Gửi email cho khách đặt sân và cho chủ sân của cụm sân.
     * Toàn bộ lỗi đều bị nuốt bên trong EmailService.
     */
    private void sendBookingEmails(Booking b) {
        Pitch pitch = b.getPitchId() != null
                ? pitchRepository.findById(b.getPitchId()).orElse(null) : null;

        // 1) Khách: dùng SĐT nếu là email hợp lệ, không thì thử tìm user theo SĐT.
// (khai báo final ở dưới để dùng được trong lambda của Thread)

        // 2) Chủ sân: tìm theo ownerId -> email trong bảng users.
        String ownerMailTmp = null;
        if (pitch != null && pitch.getOwnerId() != null) {
            ownerMailTmp = userRepository.findById(pitch.getOwnerId())
                    .map(u -> u.getEmail())
                    .orElse(null);
        }
        final String ownerMail = ownerMailTmp;
        final String customerMail = resolveCustomerEmail(b.getCustomerPhone());

        // Chạy nền để không làm chậm phản hồi cho người đặt.
        Thread t = new Thread(() -> {
            if (customerMail != null) emailService.sendBookingConfirmationToCustomer(b, pitch, customerMail);
            if (ownerMail != null) emailService.sendNewBookingToOwner(b, pitch, ownerMail);
        }, "Turfzone-mail-booking-" + b.getId());
        t.setDaemon(true);
        t.start();
    }

    /**
     * Tìm email của khách: nếu SĐT để dạng email thì dùng luôn,
     * ngược lại tra bảng users theo số điện thoại.
     */
    private String resolveCustomerEmail(String phoneOrEmail) {
        if (phoneOrEmail == null || phoneOrEmail.isBlank()) return null;
        String s = phoneOrEmail.trim();
        if (EmailService.isValidEmail(s)) return s;
        String digits = s.replaceAll("\\s+", "");
        return userRepository.findByPhone(digits)
                .map(com.turfzone.model.User::getEmail)
                .filter(EmailService::isValidEmail)
                .orElse(null);
    }

    /**
     * Chống IDOR: người gọi phải là chủ sân của đơn đặt đó, hoặc ADMIN.
     * Trước đây chỉ kiểm tra role OWNER/ADMIN nên bất kỳ chủ sân nào cũng check-in /
     * huỷ / xóa được đơn của cụm sân khác — thậm chí đặt cashDue = 0 (mất tiền thật).
     */
    /** Định dạng số tiền kiểu Việt Nam: 175000 -> "175.000đ". */
    private String formatVnd(Number amount) {
        if (amount == null) return "0đ";
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,##0",
                new java.text.DecimalFormatSymbols(new java.util.Locale("vi", "VN")));
        return df.format(amount) + "đ";
    }

    private void assertOwnsBooking(Booking b, com.turfzone.model.User me) {
        if (me == null) {
            throw new IllegalArgumentException("Cần đăng nhập để quản lý đơn đặt sân.");
        }
        boolean isAdmin = me.getRole() != null && "ADMIN".equals(me.getRole().name());
        if (isAdmin) return;

        Pitch pitch = b.getPitchId() != null
                ? pitchRepository.findById(b.getPitchId()).orElse(null)
                : null;
        if (pitch == null || pitch.getOwnerId() == null) {
            throw new IllegalArgumentException("Không xác định được chủ sân của đơn này, chỉ Quản Trị viên được phép thao tác.");
        }
        if (!pitch.getOwnerId().equals(me.getId())) {
            throw new IllegalArgumentException("Bạn không phải chủ sân của đơn đặt này.");
        }
    }

    /** Chặn OWNER sửa cụm sân không thuộc sở hữu của họ. */
    private void assertOwnsPitch(Pitch pitch, com.turfzone.model.User me) {
        if (me == null) {
            throw new IllegalArgumentException("Cần đăng nhập để quản lý cụm sân.");
        }
        boolean isAdmin = me.getRole() != null && "ADMIN".equals(me.getRole().name());
        if (isAdmin) return;
        if (pitch.getOwnerId() == null) {
            throw new IllegalArgumentException("Cụm sân này chưa có chủ sở hữu, chỉ Quản Trị viên được phép cập nhật.");
        }
        if (!pitch.getOwnerId().equals(me.getId())) {
            throw new IllegalArgumentException("Bạn không phải chủ sân của cụm sân này.");
        }
    }

    /**
     * API Thêm Sân Con Mới Vào Cụm Sân (Lưu trực tiếp vào MySQL)
     */
    @PostMapping("/{id}/add-court")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> addCourtToPitch(
            @PathVariable Long id,
            @RequestBody Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String courtName = (String) req.get("courtName");
        if (courtName == null || courtName.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên sân con không được để trống."));
        }

        Pitch pitch;
        try {
            pitch = pitchService.getPitchById(id);
            assertOwnsPitch(pitch, me);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

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

        // Luu gia rieng cua san con (chu san nhap) — truoc day 2 o gia bi bo qua hoan toan.
        Integer courtBasePrice = readPrice(req.get("basePrice"));
        Integer courtPeakPrice = readPrice(req.get("peakPrice"));
        if (courtBasePrice != null) {
            Map<String, Integer> baseMap = new HashMap<>(pitch.getCourtBasePrices());
            baseMap.put(courtName.trim(), courtBasePrice);
            pitch.setCourtBasePrices(baseMap);
        }
        if (courtPeakPrice != null) {
            Map<String, Integer> peakMap = new HashMap<>(pitch.getCourtPeakPrices());
            peakMap.put(courtName.trim(), courtPeakPrice);
            pitch.setCourtPeakPrices(peakMap);
        }
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> checkInBooking(
            @PathVariable Long bookingId,
            @AuthenticationPrincipal com.turfzone.model.User me) {
        return bookingRepository.findById(bookingId).map(b -> {
            try {
                assertOwnsBooking(b, me);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
            // Đơn đã hủy không được check-in lại (làm sai dấu vết huỷ + cộng sai doanh thu).
            if ("CANCELLED".equalsIgnoreCase(b.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Đơn này đã hủy, không thể check-in."));
            }
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
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> cancelBookingWithReason(
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, Object> req,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String reason = (req != null && req.get("reason") != null && !req.get("reason").toString().trim().isEmpty())
                ? req.get("reason").toString().trim()
                : "Chủ sân thông báo bảo trì hoặc thời tiết không đảm bảo";
        // Server quyết định ai hủy — không tin giá trị từ client (trước đây client tự khai "ADMIN").
        String cancelledBy = (me != null && "ADMIN".equals(me.getRole().name())) ? "ADMIN" : "OWNER";

        return bookingRepository.findById(bookingId).map(b -> {
            // Chống IDOR: chỉ chủ sân của đơn này (hoặc ADMIN) mới được huỷ.
            try {
                assertOwnsBooking(b, me);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
            b.setStatus("CANCELLED");
            b.setCancelReason(reason);
            b.setCancelledBy(cancelledBy);

            // Giữ lại đơn ở trạng thái CANCELLED thay vì xóa hẳn:
            // - Khách còn xem được lịch sử đặt/hủy của mình.
            // - Chủ sân còn đối chiếu được tiền cọc đã hoàn.
            // Các API ma trận ca / thống kê / báo cáo đều đã lọc bỏ đơn CANCELLED
            // nên ca vẫn trống cho người khác đặt.
            bookingRepository.save(b);

            // Gửi thông báo cho khách đặt sân (kèm email nếu tra được tài khoản).
            String customerMail = resolveCustomerEmail(b.getCustomerPhone());
            boolean notified = customerMail != null;
            if (notified) {
                notificationService.notify("PLAYER", customerMail,
                        "Ca đặt " + (b.getCode() != null ? b.getCode() : "") + " đã bị hủy",
                        "Cụm sân đã hủy ca " + b.getTimeSlot() + " ngày " + b.getBookingDate()
                                + ". Lý do: " + reason
                                + (b.getDepositPaid() != null && b.getDepositPaid() > 0
                                        ? ". Tiền cọc " + formatVnd(b.getDepositPaid()) + " đã được hoàn lại."
                                        : "."),
                        "BOOKING", null);
            }

            int refund = b.getDepositPaid() != null ? b.getDepositPaid() : 0;

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Đã hủy ca đặt"
                    + (notified ? " và đã gửi thông báo cho khách."
                            : " (khách chưa có tài khoản để nhận thông báo)."));
            resp.put("bookingId", bookingId);
            resp.put("code", b.getCode() != null ? b.getCode() : "—");
            resp.put("customerName", b.getCustomerName());
            resp.put("customerPhone", b.getCustomerPhone());
            resp.put("courtName", b.getCourtName());
            resp.put("timeSlot", b.getTimeSlot());
            resp.put("bookingDate", b.getBookingDate());
            resp.put("cancelReason", reason);
            resp.put("cancelledBy", cancelledBy);
            resp.put("refundDeposit", refund);
            resp.put("notified", notified);

            return ResponseEntity.ok((Object) resp);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy đơn đặt này.")));
    }

    /**
     * API Người Đặt Tự Hủy Vé Của Mình.
     * - Chỉ chủ vé được hủy (đối chiếu SĐT trong tài khoản với SĐT trên đơn)
     * - Chỉ hủy được khi ca CHƯA BẮT ĐẦU (đã đá / đang đá thì không đổi)
     * - Giữ lại đơn ở trạng thái CANCELLED để khách còn xem được lịch sử,
     *   các API ma trận/thống kê đã loại đơn CANCELLED nên ca trống lại cho người khác đặt.
     */
    @PostMapping("/bookings/{bookingId}/cancel-by-customer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> cancelBookingByCustomer(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long bookingId,
            @RequestBody(required = false) Map<String, Object> req
    ) {
        String reason = (req != null && req.get("reason") != null && !req.get("reason").toString().trim().isEmpty())
                ? req.get("reason").toString().trim()
                : "Người đặt tự hủy";

        return bookingRepository.findById(bookingId).map(b -> {
            String ownerPhone = currentUser != null && currentUser.getPhone() != null
                    ? currentUser.getPhone().replaceAll("\\s", "")
                    : "";
            String bookingPhone = b.getCustomerPhone() != null ? b.getCustomerPhone().replaceAll("\\s", "") : "";

            if (ownerPhone.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Tài khoản của bạn chưa có số điện thoại nên không tự hủy được. Vui lòng liên hệ chủ sân."));
            }
            if (!ownerPhone.equals(bookingPhone)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Bạn chỉ có thể hủy vé đặt bằng chính số điện thoại của mình."));
            }
            if ("CANCELLED".equals(b.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vé này đã được hủy trước đó."));
            }
            if ("PLAYING".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Ca đã bắt đầu hoặc đã diễn ra nên không thể tự hủy. Vui lòng trao đổi với chủ sân."));
            }
            try {
                if (LocalDate.parse(b.getBookingDate()).isBefore(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "message", "Ca đã qua không thể tự hủy trực tuyến. Vui lòng liên hệ chủ sân."));
                }
            } catch (Exception parseErr) {
                // Ngày lưu không đúng định dạng thì cho qua, không chặn người dùng
            }

            b.setStatus("CANCELLED");
            b.setCancelReason(reason);
            b.setCancelledBy("CUSTOMER");
            bookingRepository.save(b);

            notificationService.notify("OWNER",
                    "Khách hủy ca: " + b.getCustomerName(),
                    b.getCustomerName() + " (" + b.getCustomerPhone() + ") vừa hủy " + b.getCourtName()
                            + " ca " + b.getTimeSlot() + " ngày " + b.getBookingDate() + ". Lý do: " + reason + ".",
                    "BOOKING", null);

            Map<String, Object> resp = new HashMap<>();
            resp.put("message", "Đã hủy vé thành công. Khung giờ đã mở lại cho khách khác đặt.");
            resp.put("bookingId", bookingId);
            resp.put("code", b.getCode() != null ? b.getCode() : "—");
            resp.put("refundDeposit", b.getDepositPaid() != null ? b.getDepositPaid() : 0);
            return ResponseEntity.ok((Object) resp);
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy vé đặt này.")));
    }

@DeleteMapping("/bookings/{bookingId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal com.turfzone.model.User me
    ) {
        String cancelReason = (reason != null && !reason.trim().isEmpty())
                ? reason.trim()
                : "Chủ sân hủy ca đặt";

        return bookingRepository.findById(bookingId).map(b -> {
            // Chống IDOR: chỉ chủ sân của đơn này (hoặc ADMIN) mới được xóa.
            try {
                assertOwnsBooking(b, me);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            }
            // Giữ đơn ở trạng thái CANCELLED (không xóa hẳn) để khách còn xem lịch sử
            // và chủ sân đối chiếu được tiền cọc đã hoàn.
            b.setStatus("CANCELLED");
            b.setCancelReason(cancelReason);
            b.setCancelledBy("OWNER");
            bookingRepository.save(b);

            String customerMail = resolveCustomerEmail(b.getCustomerPhone());
            if (customerMail != null) {
                notificationService.notify("PLAYER", customerMail,
                        "Ca đặt " + (b.getCode() != null ? b.getCode() : "") + " đã bị hủy",
                        "Cụm sân đã hủy ca " + b.getTimeSlot() + " ngày " + b.getBookingDate()
                                + ". Lý do: " + cancelReason
                                + (b.getDepositPaid() != null && b.getDepositPaid() > 0
                                        ? ". Tiền cọc " + formatVnd(b.getDepositPaid()) + " đã được hoàn lại."
                                        : "."),
                        "BOOKING", null);
            }
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
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> searchBooking(@RequestParam String query,
            @AuthenticationPrincipal com.turfzone.model.User me) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập mã vé hoặc số điện thoại."));
        }
        String clean = query.trim();
        // Chỉ trả đơn thuộc cụm sân của chủ sân này (ADMIN thấy tất cả).
        // Trả entity thô sẽ lộ SĐT + tiền của khách cho bất kỳ ai gọi endpoint.
        // Chỉ trả đơn mà người gọi có quyền xem:
        //  - ADMIN: tất cả.
        //  - Chủ sân: đơn trong cụm sân của họ.
        //  - Cầu thủ: đơn có SĐT khớp chính mình.
        // Trước đây endpoint công khai nên ai cũng dò được SĐT + tiền của khách.
        String myPhone = me != null && me.getPhone() != null
                ? me.getPhone().replaceAll("\\s+", "") : "";
        boolean isAdmin = me != null && "ADMIN".equals(me.getRole().name());
        java.util.function.Predicate<Booking> mine = b -> {
            if (isAdmin) return true;
            if (!myPhone.isEmpty() && b.getCustomerPhone() != null
                    && myPhone.equals(b.getCustomerPhone().replaceAll("\\s+", ""))) return true;
            if (b.getPitchId() == null || me == null) return false;
            Pitch p = pitchRepository.findById(b.getPitchId()).orElse(null);
            return p != null && p.getOwnerId() != null && p.getOwnerId().equals(me.getId());
        };
        Optional<Booking> byCode = bookingRepository.findByCode(clean);
        if (byCode.isPresent() && mine.test(byCode.get())) {
            return ResponseEntity.ok(List.of(byCode.get()));
        }
        List<Booking> byPhone = bookingRepository.findByCustomerPhoneContaining(clean).stream()
                .filter(mine)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(byPhone);
    }

    // =========================================================================
    //  KHU VỰC GIẢ LẬP DỮ LIỆU (DEMO) — chỉ ADMIN / OWNER
    //  Mã đơn sinh ra luôn bắt đầu bằng "SIM-" để tiện dọn dẹp, không lẫn
    //  với đơn thật của khách.
    // =========================================================================

    private static final String SIM_PREFIX = "SIM-";

    private static final String[] SIM_FAMILY = {
            "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi",
            "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Phan", "Võ", "Đinh"
    };
    private static final String[] SIM_GIVEN = {
            "Văn Hùng", "Thị Mai", "Quốc Bảo", "Thu Trang", "Minh Tuấn", "Ngọc Ánh",
            "Đức Thành", "Thanh Hà", "Gia Huy", "Phương Linh", "Trọng Nghĩa", "Bích Ngọc",
            "Xuân Sơn", "Hải Đăng", "Khánh Vy", "Tuấn Kiệt", "Mỹ Duyên", "Anh Khoa",
            "Yến Nhi", "Đình Trọng", "Kim Ngân", "Quang Huy", "Thùy Dung", "Hữu Phước"
    };
    private static final String[] SIM_TEAMS = {
            "FC Đại Nắng United", "FC Hoàng Ngọc Hải Châu", "FC Lộc Thủy", "Đội bóng Hải Châu",
            "Team Đà Nẵng", "Đà Nẵng United", "Đà Nẵng City FC", "Đà Nẵng Đông Á",
            "Đại Việt Youth", "Hải Châu Football", "Thanh Khê FC", "Quận 8 Đà Nẵng"
    };

    /**
     * Sinh đơn đặt sân giả lập để demo dashboard chủ sân có doanh thu, tỉ lệ lấp đầy.
     * - Quá khứ: chủ yếu COMPLETED (đã thu tiền mặt) → doanh thu về đúng thực tế
     * - Hôm nay: trộn PLAYING / COMPLETED / BOOKED
     * - Tương lai: chủ yếu BOOKED (đã cọc) → lịch sân đầy đặn
     */
    @PostMapping("/simulate-bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> simulateBookings(
            @RequestParam(required = false) Long pitchId,
            @RequestParam(required = false, defaultValue = "14") int pastDays,
            @RequestParam(required = false, defaultValue = "7") int futureDays,
            @RequestParam(required = false, defaultValue = "5") int perDay
    ) {
        int past = Math.max(0, Math.min(60, pastDays));
        int future = Math.max(0, Math.min(60, futureDays));
        int per = Math.max(1, Math.min(30, perDay));

        List<Pitch> pitches = (pitchId != null)
                ? List.of(pitchService.getPitchById(pitchId))
                : pitchRepository.findAll();

        if (pitches.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Hệ thống chưa có cụm sân nào để sinh đơn."));
        }

        Random rnd = new Random();
        LocalDate today = LocalDate.now();
        List<Booking> created = new ArrayList<>();

        for (Pitch pitch : pitches) {
            List<String> courts = (pitch.getPitchTypes() != null && !pitch.getPitchTypes().isEmpty())
                    ? pitch.getPitchTypes()
                    : new ArrayList<>(List.of("Sân 1", "Sân 2"));

            int duration = (pitch.getSlotDurationMinutes() != null && pitch.getSlotDurationMinutes() > 0)
                    ? pitch.getSlotDurationMinutes() : 120;
            List<String> slots = generateTimeSlots(pitch.getOpenTime(), pitch.getCloseTime(), duration);
            if (slots.isEmpty()) {
                continue;
            }

            int basePrice = (pitch.getAvgPricePerHour() != null && pitch.getAvgPricePerHour() > 0)
                    ? pitch.getAvgPricePerHour() : 180000;

            for (int offset = -past; offset <= future; offset++) {
                LocalDate day = today.plusDays(offset);
                String dateStr = day.format(DateTimeFormatter.ISO_LOCAL_DATE);

                // Ca đã khai trong ngày này (để không trùng sân/giờ)
                List<Booking> sameDay = new ArrayList<>(bookingRepository.findByPitchIdAndBookingDate(pitch.getId(), dateStr));

                int wanted = per + rnd.nextInt(Math.max(1, per / 2 + 1)); // biến thiên nhẹ cho tự nhiên
                for (int i = 0; i < wanted; i++) {
                    String court = courts.get(rnd.nextInt(courts.size()));
                    String slot = slots.get(rnd.nextInt(slots.size()));

                    boolean conflict = sameDay.stream()
                            .anyMatch(b -> b.getCourtName().equalsIgnoreCase(court) && isTimeOverlapping(slot, b.getTimeSlot()));
                    if (conflict) {
                        continue;
                    }

                    // Ca chiều tối (sau 17:00) đắt hơn — phản ánh thực tế giờ vàng
                    boolean peak = slot.startsWith("17") || slot.startsWith("18")
                            || slot.startsWith("19") || slot.startsWith("20");
                    int hourPrice = peak && pitch.getPeakPricePerHour() != null && pitch.getPeakPricePerHour() > 0
                            ? pitch.getPeakPricePerHour() : basePrice;
                    int total = hourPrice * (duration / 60 > 0 ? duration / 60 : 2);
                    int deposit = (int) Math.round(total * 0.5 / 1000.0) * 1000;
                    int cash = total - deposit;

                    String status;
                    if (day.isBefore(today)) {
                        int roll = rnd.nextInt(100);
                        status = roll < 82 ? "COMPLETED" : (roll < 92 ? "BOOKED" : "CANCELLED");
                    } else if (day.isEqual(today)) {
                        int roll = rnd.nextInt(100);
                        status = roll < 30 ? "COMPLETED" : (roll < 55 ? "PLAYING" : (roll < 95 ? "BOOKED" : "CANCELLED"));
                    } else {
                        status = rnd.nextInt(100) < 82 ? "BOOKED" : "CANCELLED";
                    }

                    boolean settled = "COMPLETED".equals(status) || "PLAYING".equals(status);

                    Booking booking = Booking.builder()
                            .pitchId(pitch.getId())
                            .courtName(court)
                            .courtType(court)
                            .bookingDate(dateStr)
                            .timeSlot(slot)
                            .customerName(SIM_FAMILY[rnd.nextInt(SIM_FAMILY.length)] + " "
                                    + SIM_GIVEN[rnd.nextInt(SIM_GIVEN.length)])
                            .customerPhone("09" + String.format("%08d", rnd.nextInt(100000000)))
                            .totalPrice(total)
                            .depositPaid(deposit)
                            .cashDue(cash)
                            .status(status)
                            .via(simulateVia(rnd))
                            .code(generateSimCode(pitch.getId()))
                            .build();

                    if ("CANCELLED".equals(status)) {
                        booking.setCancelledBy(rnd.nextBoolean() ? "CUSTOMER" : "OWNER");
                        booking.setCancelReason("Khách đổi lịch / hủy tự do");
                    }

                    Booking saved = bookingRepository.save(booking);
                    sameDay.add(saved);
                    created.add(saved);
                }
            }
        }

        long revenue = created.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()) || "PLAYING".equals(b.getStatus()))
                .mapToLong(b -> (b.getDepositPaid() == null ? 0 : b.getDepositPaid())
                        + (b.getCashDue() == null ? 0 : b.getCashDue()))
                .sum();

        Map<String, Object> result = new HashMap<>();
        result.put("created", created.size());
        result.put("pitches", pitches.size());
        result.put("pastDays", past);
        result.put("futureDays", future);
        result.put("perDay", per);
        result.put("settledRevenue", revenue);
        result.put("message", "Đã tạo " + created.size() + " đơn giả lập (mã bắt đầu bằng \"SIM-\").");
        return ResponseEntity.ok(result);
    }

    /** Xóa toàn bộ đơn giả lập (mã bắt đầu bằng "SIM-") — đơn thật của khách giữ nguyên. */
    @DeleteMapping("/simulate-bookings")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<?> clearSimulatedBookings() {
        List<Booking> sims = bookingRepository.findByCodeStartingWith(SIM_PREFIX);
        bookingRepository.deleteAll(sims);
        return ResponseEntity.ok(Map.of(
                "deleted", sims.size(),
                "message", "Đã xóa " + sims.size() + " đơn giả lập."));
    }

    private String simulateVia(Random rnd) {
        int roll = rnd.nextInt(100);
        if (roll < 50) return "Đặt qua Website";
        if (roll < 85) return "Tạo Tại Quầy";
        return "VietQR";
    }

    /** Mã đơn giả lập: SIM-{pitchId}-{5 chữ số}.
     *  Dùng bộ đếm tăng dần thay vì tra CSDL mỗi lần — sinh ~1500 đơn mà mỗi đơn
     *  một lượt query findByCode sẽ chậm và vô nghĩa. Số ngẫu nhiên 5 chữ số đảm bảo
     *  không trùng với dữ liệu cũ. */
    private String generateSimCode(Long pitchId) {
        simCodeSeq.incrementAndGet();
        return SIM_PREFIX + pitchId + "-" + String.format("%05d", simCodeSeq.get() % 100000);
    }

    /** Bộ đếm mã dùng chung — AtomicInteger để an toàn khi 2 request chạy song song
     *  (nếu không, hai lệnh sinh cùng mã sẽ đụng ràng buộc unique của cột `code`). */
    private final java.util.concurrent.atomic.AtomicInteger simCodeSeq =
            new java.util.concurrent.atomic.AtomicInteger(
                    new java.util.Random().nextInt(1000, 99999));
}
