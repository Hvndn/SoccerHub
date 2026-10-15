package com.soccerhub.controller;

import com.soccerhub.model.User;
import com.soccerhub.model.UserRole;
import com.soccerhub.repository.BookingRepository;
import com.soccerhub.repository.GoalEventRepository;
import com.soccerhub.repository.MatchResultRepository;
import com.soccerhub.repository.MatchmakingPostRepository;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * API Quản trị hệ thống (Super Admin) — yêu cầu role ADMIN.
 * Tách riêng khỏi OwnerAdminController (dành cho Chủ sân).
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final PitchRepository pitchRepository;
    private final TournamentRepository tournamentRepository;
    private final BookingRepository bookingRepository;
    private final MatchmakingPostRepository matchmakingPostRepository;
    private final MatchResultRepository matchResultRepository;
    private final GoalEventRepository goalEventRepository;

    /** Tổng quan: các con số KPI cho dashboard admin. */
    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview() {
        long totalRevenue = bookingRepository.findAll().stream()
                .filter(b -> !"CANCELLED".equals(b.getStatus()))
                .mapToLong(b -> b.getDepositPaid() != null ? b.getDepositPaid() : 0)
                .sum();
        long openTournaments = tournamentRepository.findAll().stream()
                .filter(t -> "OPEN".equals(t.getStatus()))
                .count();
        return ResponseEntity.ok(Map.of(
                "totalUsers", userRepository.count(),
                "totalPitches", pitchRepository.count(),
                "totalTournaments", tournamentRepository.count(),
                "openTournaments", openTournaments,
                "totalBookings", bookingRepository.count(),
                "totalMatchmakingPosts", matchmakingPostRepository.count(),
                "totalRevenue", totalRevenue
        ));
    }

    /** Danh sách người dùng (KHÔNG bao giờ trả về mật khẩu). */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("fullName", u.getFullName());
            m.put("email", u.getEmail());
            m.put("phone", u.getPhone());
            m.put("role", u.getRole() != null ? u.getRole().name() : null);
            m.put("eloRating", u.getEloRating());
            m.put("area", u.getArea());
            m.put("level", u.getLevel());
            m.put("enabled", u.getEnabled() == null || u.getEnabled());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
            result.add(m);
        }
        result.sort((a, b) -> ((Long) b.get("id")).compareTo((Long) a.get("id")));
        return ResponseEntity.ok(result);
    }

    /** Khóa / mở khóa tài khoản. Không được tự khóa chính mình. */
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> setUserStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User me) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy người dùng."));
        }
        if (me != null && me.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể tự khóa tài khoản của chính mình."));
        }
        Object raw = body.get("enabled");
        boolean enabled = raw instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(raw));
        user.setEnabled(enabled);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", enabled ? "Đã mở khóa tài khoản." : "Đã khóa tài khoản.",
                "id", user.getId(),
                "enabled", user.getEnabled()
        ));
    }

    /** Đổi vai trò. Không được tự đổi role của chính mình (tránh tự lockout). */
    @PatchMapping("/users/{id}/role")
    public ResponseEntity<?> setUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User me) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy người dùng."));
        }
        if (me != null && me.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể tự đổi vai trò của chính mình."));
        }
        String roleName = String.valueOf(body.getOrDefault("role", "")).trim().toUpperCase();
        UserRole role;
        try {
            role = UserRole.valueOf(roleName);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vai trò không hợp lệ: " + roleName));
        }
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật vai trò thành " + role.name(),
                "id", user.getId(),
                "role", role.name()
        ));
    }

    /** Danh sách đơn đặt sân mới nhất (giới hạn, mặc định 100). */
    @GetMapping("/bookings")
    public ResponseEntity<List<?>> listBookings(@RequestParam(defaultValue = "100") int limit) {
        List<?> all = bookingRepository.findAll();
        all.sort((a, b) -> ((com.soccerhub.model.Booking) b).getId()
                .compareTo(((com.soccerhub.model.Booking) a).getId()));
        int safeLimit = Math.max(1, Math.min(limit, 500));
        return ResponseEntity.ok(all.subList(0, Math.min(safeLimit, all.size())));
    }

    /** Gỡ bài đăng chợ kèo vi phạm (kiểm duyệt). */
    @DeleteMapping("/matchmaking-posts/{id}")
    public ResponseEntity<?> deleteMatchmakingPost(@PathVariable Long id) {
        return matchmakingPostRepository.findById(id)
                .map(post -> {
                    matchmakingPostRepository.delete(post);
                    return ResponseEntity.ok(Map.of("message", "Đã gỡ bài đăng khỏi chợ kèo.", "id", id));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy bài đăng.")));
    }

    /**
     * Xóa tài khoản (không tự xóa mình, không xóa admin cuối cùng).
     * Dùng dọn acc test / acc vi phạm.
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User me) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy người dùng."));
        }
        if (me != null && me.getId().equals(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể tự xóa tài khoản của chính mình."));
        }
        if (user.getRole() == UserRole.ADMIN) {
            long adminCount = userRepository.findAll().stream()
                    .filter(x -> x.getRole() == UserRole.ADMIN).count();
            if (adminCount <= 1) {
                return ResponseEntity.badRequest().body(Map.of("message", "Không thể xóa quản trị viên cuối cùng."));
            }
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Đã xóa tài khoản " + user.getEmail() + ".", "id", id));
    }

    /**
     * Dọn kết quả trận + bàn thắng mồ côi (giải đã bị xóa).
     * Chạy sau khi xóa giải ở bản cũ hoặc dọn dữ liệu test.
     */
    @DeleteMapping("/maintenance/orphans")
    public ResponseEntity<?> cleanOrphans() {
        java.util.Set<Long> alive = new java.util.HashSet<>();
        tournamentRepository.findAll().forEach(t -> alive.add(t.getId()));
        List<com.soccerhub.model.MatchResult> orphanMatches = matchResultRepository.findAll()
                .stream().filter(m -> !alive.contains(m.getTournamentId())).toList();
        List<com.soccerhub.model.GoalEvent> orphanGoals = goalEventRepository.findAll()
                .stream().filter(g -> !alive.contains(g.getTournamentId())).toList();
        matchResultRepository.deleteAll(orphanMatches);
        goalEventRepository.deleteAll(orphanGoals);
        return ResponseEntity.ok(Map.of(
                "message", "Đã dọn " + orphanMatches.size() + " kết quả và " + orphanGoals.size() + " bàn thắng mồ côi.",
                "matchResults", orphanMatches.size(),
                "goalEvents", orphanGoals.size()));
    }
}
