package com.soccerhub.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
public class OwnerAdminController {

    @GetMapping("/revenue-report")
    public ResponseEntity<Map<String, Object>> getRevenueReport() {
        List<Map<String, Object>> monthly = Arrays.asList(
            Map.of("month", "Tháng 4", "revenue", 45000000, "occupancyRate", 72),
            Map.of("month", "Tháng 5", "revenue", 52000000, "occupancyRate", 78),
            Map.of("month", "Tháng 6", "revenue", 61000000, "occupancyRate", 85),
            Map.of("month", "Tháng 7", "revenue", 58000000, "occupancyRate", 81),
            Map.of("month", "Tháng 8", "revenue", 69000000, "occupancyRate", 91),
            Map.of("month", "Tháng 9 (Dự kiến)", "revenue", 75000000, "occupancyRate", 94)
        );

        Map<String, Object> report = Map.of(
            "totalRevenueThisMonth", 69000000,
            "avgOccupancyRate", "88%",
            "totalBookings", 234,
            "peakHoursRate", "96%",
            "monthlyChart", monthly
        );

        return ResponseEntity.ok(report);
    }

    @PostMapping("/dynamic-pricing")
    public ResponseEntity<Map<String, Object>> configDynamicPricing(@RequestBody Map<String, Object> config) {
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Cập nhật bảng giá linh hoạt Dynamic Pricing thành công!",
            "configApplied", config
        ));
    }
}
