package com.turfzone.controller;

import com.turfzone.model.Booking;
import com.turfzone.model.MatchmakingPost;
import com.turfzone.model.User;
import com.turfzone.model.UserRole;
import com.turfzone.repository.*;
import com.turfzone.service.AdminAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * API Quản trị nâng cao (Super Admin):
 *  - Phân trang + tìm kiếm danh sách người dùng (thay vì tải toàn bộ bảng)
 *  - Chi tiết người dùng: hồ sơ + lịch sử đặt sân + kèo đã đăng
 *  - Quản lý đơn đặt sân của admin (huỷ + hoàn cọc khi có khiếu nại)
 *  - Thống kê nâng cao: top cụm sân doanh thu, top khách hàng
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminManageController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PitchRepository pitchRepository;
    private final MatchmakingPostRepository matchmakingPostRepository;
    private final TournamentRepository tournamentRepository;
    private final AdminAuditService auditService;

    private void audit(User me, String group, String action, String target, String detail) {
        if (me == null) return;
        auditService.log(me.getEmail(), me.getFullName(), group, action, target, detail);
    }

    // =========================================================================
    //  1. Danh sách người dùng có phân trang + tìm kiếm + lọc theo vai trò
    // =========================================================================

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> listUsersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role) {

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 200));

        String kw = (q == null ? "" : q.trim().toLowerCase());
        String roleFilter = (role == null ? "" : role.trim().toUpperCase());

        List<User> all = userRepository.findAll();

        List<User> filtered = all.stream()
                .filter(u -> {
                    if (!roleFilter.isEmpty() && u.getRole() != null
                            && !roleFilter.equals(u.getRole().name())) return false;
                    if (kw.isEmpty()) return true;
                    String hay = ((u.getFullName() != null ? u.getFullName() : "") + " "
                            + (u.getEmail() != null ? u.getEmail() : "") + " "
                            + (u.getPhone() != null ? u.getPhone() : "") + " "
                            + (u.getLevel() != null ? u.getLevel() : "") + " "
                            + (u.getArea() != null ? u.getArea() : "")).toLowerCase();
                    return hay.contains(kw);
                })
                .sorted(Comparator.comparing(User::getId).reversed())
                .toList();

        int total = filtered.size();
        int from = Math.min(safePage * safeSize, total);
        int to = Math.min(from + safeSize, total);
        List<User> pageItems = from >= total ? List.of() : filtered.subList(from, to);

        // Thống kê tổng quan để vẽ badge cạnh ô tìm kiếm
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (UserRole r : UserRole.values()) {
            byRole.put(r.name(), all.stream()
                    .filter(u -> u.getRole() == r).count());
        }

        return ResponseEntity.ok(Map.of(
                "content", pageItems,
                "total", total,
                "page", safePage,
                "size", safeSize,
                "totalPages", (int) Math.ceil(total / (double) safeSize),
                "countByRole", byRole));
    }

    // =========================================================================
    //  2. Chi tiết người dùng: hồ sơ + lịch sử đặt sân + kèo đã đăng
    // =========================================================================

    @GetMapping("/users/{id}/detail")
    public ResponseEntity<?> userDetail(@PathVariable Long id) {
        User u = userRepository.findById(id).orElse(null);
        if (u == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy người dùng."));
        }

        // Đơn đặt sân của khách (tra theo SĐT)
        List<Booking> bookings = u.getPhone() != null
                ? bookingRepository.findByCustomerPhoneContaining(u.getPhone())
                : List.of();

        // Kèo giao hữu đã đăng (tra theo tên đội trùng tên hoặc SĐT trưởng)
        List<Map<String, Object>> posts = new ArrayList<>();
        if (u.getPhone() != null) {
            for (MatchmakingPost p : matchmakingPostRepository.findAll()) {
                String phone = p.getCaptainPhone() == null ? "" : p.getCaptainPhone().replaceAll("\\s+", "");
                if (phone.equals(u.getPhone().replaceAll("\\s+", ""))) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("teamName", p.getTeamName());
                    m.put("pitchName", p.getPitchName());
                    m.put("matchTime", p.getMatchTime());
                    m.put("status", p.getStatus());
                    m.put("estimatedFee", p.getEstimatedFee());
                    m.put("createdAt", p.getCreatedAt());
                    m.put("opponentTeamName", p.getOpponentTeamName());
                    posts.add(m);
                }
            }
        }

        long totalSpent = bookings.stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .mapToLong(b -> (b.getDepositPaid() != null ? b.getDepositPaid() : 0)
                        + ("PLAYING".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus())
                        ? (b.getCashDue() != null ? b.getCashDue() : 0) : 0))
                .sum();

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", u.getId());
        info.put("fullName", u.getFullName());
        info.put("email", u.getEmail());
        info.put("phone", u.getPhone());
        info.put("role", u.getRole() != null ? u.getRole().name() : null);
        info.put("position", u.getPosition());
        info.put("area", u.getArea());
        info.put("level", u.getLevel());
        info.put("favoriteSport", u.getFavoriteSport());
        info.put("enabled", u.getEnabled());
        info.put("createdAt", u.getCreatedAt());
        info.put("updatedAt", u.getUpdatedAt());
        info.put("dominantFoot", u.getDominantFoot());
        info.put("jerseyNumber", u.getJerseyNumber());
        info.put("height", u.getHeight());
        info.put("weight", u.getWeight());
        info.put("currentClub", u.getCurrentClub());

        return ResponseEntity.ok(Map.of(
                "user", info,
                "bookingCount", bookings.size(),
                "totalSpent", totalSpent,
                "matchmakingPosts", posts));
    }

    // =========================================================================
    //  3. Admin huỷ đơn + hoàn cọc (khi khách khiếu nại)
    // =========================================================================

    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<?> adminCancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> req,
            @AuthenticationPrincipal User me) {

        Booking b = bookingRepository.findById(id).orElse(null);
        if (b == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy đơn đặt này."));
        }

        String reason = (req != null && req.get("reason") != null
                && !req.get("reason").toString().trim().isEmpty())
                ? req.get("reason").toString().trim()
                : "Quản trị viên huỷ đơn do khiếu nại từ khách";

        // Đánh dấu huỷ (không xoá cứng) để giữ dữ liệu thống kê & đối chiếu.
        b.setStatus("CANCELLED");
        b.setCancelReason(reason);
        b.setCancelledBy("ADMIN");
        bookingRepository.save(b);

        audit(me, "BOOKING", "ADMIN_CANCEL_BOOKING", "id=" + id,
                "Admin huỷ đơn #" + id + " (mã " + (b.getCode() != null ? b.getCode() : "—")
                        + ") — lý do: " + reason);

        return ResponseEntity.ok(Map.of(
                "message", "Đã huỷ đơn #" + id + ". Khoản cọc sẽ được hoàn lại cho khách.",
                "refundAmount", b.getDepositPaid() != null ? b.getDepositPaid() : 0));
    }

    // =========================================================================
    //  4. Thống kê nâng cao: top cụm sân doanh thu + top khách
    // =========================================================================

    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> insights() {
        Map<Long, String> pitchNames = new HashMap<>();
        for (com.turfzone.model.Pitch p : pitchRepository.findAll()) {
            pitchNames.put(p.getId(), p.getName());
        }

        // Top cụm sân theo doanh thu đã thu
        Map<Long, Integer> revenueByPitch = new LinkedHashMap<>();
        for (Booking b : bookingRepository.findAll()) {
            if ("CANCELLED".equals(b.getStatus()) || b.getPitchId() == null) continue;
            int rev = (b.getDepositPaid() != null ? b.getDepositPaid() : 0)
                    + ("PLAYING".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus())
                    ? (b.getCashDue() != null ? b.getCashDue() : 0) : 0);
            revenueByPitch.merge(b.getPitchId(), rev, Integer::sum);
        }

        List<Map<String, Object>> topPitches = revenueByPitch.entrySet().stream()
                .sorted((a, b2) -> b2.getValue() - a.getValue())
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("pitchId", e.getKey());
                    m.put("pitchName", pitchNames.getOrDefault(e.getKey(), "—"));
                    m.put("revenue", e.getValue());
                    return m;
                }).toList();

        // Top khách hàng theo tổng chi (tra theo SĐT)
        Map<String, int[]> spendByPhone = new LinkedHashMap<>();
        Map<String, String> nameByPhone = new HashMap<>();
        for (Booking b : bookingRepository.findAll()) {
            if ("CANCELLED".equals(b.getStatus())) continue;
            String phone = b.getCustomerPhone() == null ? "unknown" : b.getCustomerPhone().trim();
            int amount = (b.getTotalPrice() != null ? b.getTotalPrice() : 0);
            spendByPhone.computeIfAbsent(phone, k -> new int[2])[0] += amount;
            spendByPhone.get(phone)[1] += 1;
            if (b.getCustomerName() != null) nameByPhone.putIfAbsent(phone, b.getCustomerName());
        }

        List<Map<String, Object>> topCustomers = spendByPhone.entrySet().stream()
                .sorted((a, b2) -> b2.getValue()[0] - a.getValue()[0])
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("customerName", nameByPhone.getOrDefault(e.getKey(), e.getKey()));
                    m.put("customerPhone", e.getKey());
                    m.put("totalSpent", e.getValue()[0]);
                    m.put("bookingCount", e.getValue()[1]);
                    return m;
                }).toList();

        return ResponseEntity.ok(Map.of(
                "topPitches", topPitches,
                "topCustomers", topCustomers));
    }
}