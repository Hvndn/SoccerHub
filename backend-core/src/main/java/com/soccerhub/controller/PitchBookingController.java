package com.soccerhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/pitches")
@CrossOrigin(origins = "*")
public class PitchBookingController {

    // Mock Data for Demo & Verification
    private final List<Map<String, Object>> mockPitches = Arrays.asList(
        Map.of(
            "id", "pitch-101",
            "name", "Cụm Sân Bóng Đá Thể Thao ProHub Q7",
            "address", "128 Nguyễn Thị Thập, Quận 7, TP.HCM",
            "latitude", 10.7412,
            "longitude", 106.7123,
            "avgPricePerHour", 350000,
            "rating", 4.9,
            "pitchTypes", List.of("PITCH_5", "PITCH_7", "PITCH_11"),
            "amenities", List.of("Đèn LED cao cấp", "Căn tin & Nước uống", "Bãi xe ô tô", "Phòng thay đồ"),
            "imageUrl", "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80"
        ),
        Map.of(
            "id", "pitch-102",
            "name", "Sân Bóng Cỏ Nhân Tạo Tân Bình Stadium",
            "address", "45 Cộng Hòa, Quận Tân Bình, TP.HCM",
            "latitude", 10.8015,
            "longitude", 106.6542,
            "avgPricePerHour", 300000,
            "rating", 4.7,
            "pitchTypes", List.of("PITCH_5", "PITCH_7"),
            "amenities", List.of("Đèn chiếu sáng", "Cho thuê giày & áo đấu", "Bãi xe máy"),
            "imageUrl", "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80"
        ),
        Map.of(
            "id", "pitch-103",
            "name", "Cụm Sân Bóng Phú Nhuận Arena",
            "address", "18 Hoàn Văn Thụ, Quận Phú Nhuận, TP.HCM",
            "latitude", 10.7988,
            "longitude", 106.6789,
            "avgPricePerHour", 420000,
            "rating", 4.8,
            "pitchTypes", List.of("PITCH_7", "PITCH_11"),
            "amenities", List.of("Đèn LED Fixture", "Trọng tài chuyên nghiệp", "Hệ thống Var Mini", "Bãi xe"),
            "imageUrl", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
        )
    );

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllPitches() {
        return ResponseEntity.ok(mockPitches);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getPitchById(@PathVariable String id) {
        return mockPitches.stream()
            .filter(p -> p.get("id").equals(id))
            .findFirst()
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<List<Map<String, Object>>> getPitchSlots(@PathVariable String id, @RequestParam(defaultValue = "2026-09-15") String date) {
        List<Map<String, Object>> slots = Arrays.asList(
            Map.of("id", "slot-1", "time", "17:00 - 18:30", "price", 300000, "status", "AVAILABLE", "pitchType", "Sân 7A"),
            Map.of("id", "slot-2", "time", "18:30 - 20:00", "price", 450000, "status", "BOOKED", "pitchType", "Sân 7A"),
            Map.of("id", "slot-3", "time", "20:00 - 21:30", "price", 450000, "status", "AVAILABLE", "pitchType", "Sân 7A"),
            Map.of("id", "slot-4", "time", "17:00 - 18:30", "price", 280000, "status", "AVAILABLE", "pitchType", "Sân 5B"),
            Map.of("id", "slot-5", "time", "18:30 - 20:00", "price", 380000, "status", "HOLD", "pitchType", "Sân 5B"),
            Map.of("id", "slot-6", "time", "20:00 - 21:30", "price", 380000, "status", "AVAILABLE", "pitchType", "Sân 5B")
        );
        return ResponseEntity.ok(slots);
    }

    @PostMapping("/book-slot")
    public ResponseEntity<Map<String, Object>> bookSlot(@RequestBody Map<String, Object> bookingReq) {
        String slotId = (String) bookingReq.get("slotId");
        String customerName = (String) bookingReq.getOrDefault("customerName", "Cầu thủ SoccerHub");
        String bookingCode = "SH-BOOK-" + System.currentTimeMillis() % 100000;
        
        // Simulating VietQR Payment Payload
        String vietQrUrl = "https://img.vietqr.io/image/970436-1029384756-compact2.png?amount=150000&addInfo=" + bookingCode + "&accountName=PITCHHUB%20PRO";

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
