package com.soccerhub.controller;

import com.soccerhub.dto.CreatePitchRequest;
import com.soccerhub.model.Pitch;
import com.soccerhub.model.User;
import com.soccerhub.service.PitchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/pitches")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PitchBookingController {

    private final PitchService pitchService;

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

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<Map<String, Object>>> getPitchSlots(@PathVariable Long id, @RequestParam(defaultValue = "2026-10-01") String date) {
        Pitch pitch = pitchService.getPitchById(id);
        int basePrice = pitch.getAvgPricePerHour() != null ? pitch.getAvgPricePerHour() : 350000;
        int peakPrice = pitch.getPeakPricePerHour() != null ? pitch.getPeakPricePerHour() : 450000;

        List<Map<String, Object>> slots = Arrays.asList(
            Map.of("id", "slot-1", "time", "17:00 - 18:30", "price", basePrice, "status", "AVAILABLE", "pitchType", "Sân 7A"),
            Map.of("id", "slot-2", "time", "18:30 - 20:00", "price", peakPrice, "status", "BOOKED", "pitchType", "Sân 7A"),
            Map.of("id", "slot-3", "time", "20:00 - 21:30", "price", peakPrice, "status", "AVAILABLE", "pitchType", "Sân 7A"),
            Map.of("id", "slot-4", "time", "17:00 - 18:30", "price", (int)(basePrice * 0.8), "status", "AVAILABLE", "pitchType", "Sân 5B"),
            Map.of("id", "slot-5", "time", "18:30 - 20:00", "price", basePrice, "status", "HOLD", "pitchType", "Sân 5B"),
            Map.of("id", "slot-6", "time", "20:00 - 21:30", "price", basePrice, "status", "AVAILABLE", "pitchType", "Sân 5B")
        );
        return ResponseEntity.ok(slots);
    }

    @PostMapping("/book-slot")
    public ResponseEntity<Map<String, Object>> bookSlot(@RequestBody Map<String, Object> bookingReq) {
        String slotId = (String) bookingReq.get("slotId");
        String customerName = (String) bookingReq.getOrDefault("customerName", "Cầu thủ SoccerHub");
        String bookingCode = "SH-BOOK-" + System.currentTimeMillis() % 100000;
        
        String vietQrUrl = "https://img.vietqr.io/image/970436-1029384756-compact2.png?amount=150000&addInfo=" + bookingCode + "&accountName=SOCCERHUB%20PRO";

        Map<String, Object> response = Map.of(
            "status", "SUCCESS",
            "bookingCode", bookingCode,
            "slotId", slotId,
            "customerName", customerName,
            "depositAmount", 150000,
            "vietQrUrl", vietQrUrl,
            "qrTicketCode", "QR-TICKET-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
            "message", "Khóa ca sân thành công 5 phút để thanh toán cọc VietQR."
        );
        return ResponseEntity.ok(response);
    }
}
