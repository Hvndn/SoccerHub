package com.turfzone.controller;

import com.turfzone.model.Club;
import com.turfzone.model.ClubMember;
import com.turfzone.model.User;
import com.turfzone.repository.ClubMemberRepository;
import com.turfzone.repository.ClubRepository;
import com.turfzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * CLB bóng đá — người dùng đại diện CLB quản lý CLB và thành viên.
 *
 * <p>Phân quyền: giữ nguyên role của tài khoản (PLAYER/OWNER/...), chỉ gắn thêm cờ
 * {@code isClubRep} trong hồ sơ. Người tạo CLB là đại diện; đại diện có thể thêm/gỡ
 * thành viên và bổ nhiệm thành viên khác làm đại diện.</p>
 */
@RestController
@RequestMapping("/api/v1/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final UserRepository userRepository;

    // ---------------- Helpers ----------------

    /** Chuẩn hoá email về chữ thường để so khớp không phân biệt hoa thường. */
    private static String norm(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    /** Tạo slug từ tên CLB, bỏ dấu tiếng Việt. */
    private static String slugify(String name) {
        String s = Normalizer.normalize(name == null ? "" : name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("^-+|-+$", "")
                .toLowerCase();
        return s.isEmpty() ? "clb" : s;
    }

    /** Sinh slug duy nhất (thêm hậu tố -2, -3... nếu trùng). */
    private String uniqueSlug(String base) {
        String slug = base;
        int i = 2;
        while (clubRepository.existsBySlug(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }

    /** Số thành viên tối đa (0 = không giới hạn). Parse an toàn, giá trị rác -> 0. */
    private static int parseMaxMembers(Object raw) {
        if (raw == null) return 0;
        try {
            int v = Integer.parseInt(raw.toString().trim());
            return v < 0 ? 0 : Math.min(v, 500);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** Tài khoản đang đăng nhập (bắt buộc). */
    private User require(User me) {
        if (me == null || me.getEmail() == null || me.getEmail().isBlank()) {
            throw new IllegalStateException("Vui lòng đăng nhập.");
        }
        return me;
    }

    /** CLB có tồn tại không. */
    private Club findClub(Long id) {
        return clubRepository.findById(id).orElse(null);
    }

    /** Người đang đăng nhập có phải đại diện của CLB không. */
    private boolean isRepresentative(Long clubId, String email) {
        return clubMemberRepository.findByClubIdAndMemberEmail(clubId, email)
                .map(m -> Boolean.TRUE.equals(m.getIsRepresentative()))
                .orElse(false);
    }

    /** Gán lại cờ isClubRep của tài khoản (true nếu còn đại diện ít nhất 1 CLB). */
    private void refreshClubRepFlag(String email) {
        String e = norm(email);
        userRepository.findByEmail(e).ifPresent(u -> {
            boolean rep = clubMemberRepository.findByMemberEmailOrderByJoinedAtDesc(e).stream()
                    .anyMatch(m -> Boolean.TRUE.equals(m.getIsRepresentative()));
            if (Boolean.TRUE.equals(u.getIsClubRep()) != rep) {
                u.setIsClubRep(rep);
                userRepository.save(u);
            }
        });
    }

    /** DTO trả về cho client. */
    private Map<String, Object> toDto(Club club, String viewerEmail) {
        List<ClubMember> members = clubMemberRepository.findByClubIdOrderByIsRepresentativeDescJoinedAtAsc(club.getId());
        boolean rep = isRepresentative(club.getId(), viewerEmail);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", club.getId());
        m.put("name", club.getName());
        m.put("slug", club.getSlug());
        m.put("description", club.getDescription());
        m.put("area", club.getArea());
        m.put("phone", club.getPhone());
        m.put("logoUrl", club.getLogoUrl());
        m.put("ownerEmail", club.getOwnerEmail());
        m.put("ownerName", club.getOwnerName());
        m.put("maxMembers", club.getMaxMembers());
        m.put("createdAt", club.getCreatedAt());
        m.put("memberCount", members.size());
        m.put("memberList", members.stream().map(x -> {
            Map<String, Object> mm = new LinkedHashMap<>();
            mm.put("email", x.getMemberEmail());
            mm.put("name", x.getMemberName());
            mm.put("phone", x.getMemberPhone());
            mm.put("isRepresentative", Boolean.TRUE.equals(x.getIsRepresentative()));
            mm.put("joinedAt", x.getJoinedAt());
            return mm;
        }).toList());
        // Chỉ đại diện mới thấy danh sách đầy đủ; thành viên thường chỉ thấy tên CLB.
        m.put("canManage", rep);
        return m;
    }

    // ---------------- API ----------------

    /** Danh sách CLB mà tôi là đại diện. */
    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> myClubs(@AuthenticationPrincipal User me) {
        User u = require(me);
        String email = norm(u.getEmail());
        List<Club> owned = clubRepository.findByOwnerEmailOrderByCreatedAtDesc(email);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Club c : owned) {
            if (isRepresentative(c.getId(), email)) {
                out.add(toDto(c, email));
            }
        }
        // CLB mà tôi là thành viên (không phải đại diện) — chỉ thông tin tối thiểu.
        List<Map<String, Object>> memberOf = clubMemberRepository.findByMemberEmailOrderByJoinedAtDesc(email).stream()
                .filter(m -> !Boolean.TRUE.equals(m.getIsRepresentative()))
                .map(m -> {
                    Map<String, Object> mm = new LinkedHashMap<>();
                    clubRepository.findById(m.getClubId()).ifPresent(c -> {
                        mm.put("id", c.getId());
                        mm.put("name", c.getName());
                        mm.put("slug", c.getSlug());
                        mm.put("logoUrl", c.getLogoUrl());
                        mm.put("area", c.getArea());
                        mm.put("memberCount", clubMemberRepository.countByClubId(c.getId()));
                        mm.put("canManage", false);
                    });
                    return mm;
                })
                .filter(m -> !m.isEmpty())
                .toList();
        out.addAll(memberOf);
        return ResponseEntity.ok(out);
    }

    /** Tạo CLB — người tạo tự động là đại diện. */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createClub(@RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal User me) {
        User u = require(me);
        String name = body.get("name") != null ? body.get("name").toString().trim() : "";
        if (name.length() < 3 || name.length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên CLB phải từ 3 đến 100 ký tự."));
        }
        Club club = Club.builder()
                .name(name)
                .slug(uniqueSlug(slugify(name)))
                .description(body.get("description") != null ? body.get("description").toString().trim() : null)
                .area(body.get("area") != null ? body.get("area").toString().trim() : u.getArea())
                .phone(body.get("phone") != null ? body.get("phone").toString().trim() : u.getPhone())
                .logoUrl(body.get("logoUrl") != null ? body.get("logoUrl").toString().trim() : null)
                .ownerEmail(norm(u.getEmail()))
                .ownerName(u.getFullName())
                .maxMembers(parseMaxMembers(body.get("maxMembers")))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        Club saved = clubRepository.save(club);
        clubMemberRepository.save(ClubMember.builder()
                .clubId(saved.getId())
                .memberEmail(norm(u.getEmail()))
                .memberName(u.getFullName())
                .memberPhone(u.getPhone())
                .isRepresentative(true)
                .isActive(true)
                .joinedAt(LocalDateTime.now())
                .build());
        refreshClubRepFlag(u.getEmail());
        return ResponseEntity.ok(Map.of(
                "message", "Đã tạo CLB \"" + saved.getName() + "\". Bạn là đại diện CLB.",
                "club", toDto(saved, norm(u.getEmail()))));
    }

    /** Chi tiết 1 CLB. */
    @GetMapping("/{id}")
    public ResponseEntity<?> getClub(@PathVariable Long id, @AuthenticationPrincipal User me) {
        Club club = findClub(id);
        if (club == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy CLB"));
        }
        String email = me != null ? norm(me.getEmail()) : "";
        return ResponseEntity.ok(toDto(club, email));
    }

    /** Sửa thông tin CLB — chỉ đại diện. */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateClub(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal User me) {
        User u = require(me);
        Club club = findClub(id);
        if (club == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy CLB"));
        }
        if (!isRepresentative(id, norm(u.getEmail()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ đại diện CLB mới sửa được thông tin CLB."));
        }
        if (body.get("name") != null) {
            String name = body.get("name").toString().trim();
            if (name.length() < 3 || name.length() > 100) {
                return ResponseEntity.badRequest().body(Map.of("message", "Tên CLB phải từ 3 đến 100 ký tự."));
            }
            club.setName(name);
        }
        if (body.get("description") != null) club.setDescription(body.get("description").toString().trim());
        if (body.get("area") != null) club.setArea(body.get("area").toString().trim());
        if (body.get("phone") != null) club.setPhone(body.get("phone").toString().trim());
        if (body.get("logoUrl") != null) club.setLogoUrl(body.get("logoUrl").toString().trim());
        if (body.get("maxMembers") != null) {
            club.setMaxMembers(parseMaxMembers(body.get("maxMembers")));
        }
        club.setUpdatedAt(LocalDateTime.now());
        Club saved = clubRepository.save(club);
        return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật thông tin CLB.",
                "club", toDto(saved, norm(u.getEmail()))));
    }

    /** Xóa CLB — chỉ đại diện. */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteClub(@PathVariable Long id, @AuthenticationPrincipal User me) {
        User u = require(me);
        Club club = findClub(id);
        if (club == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy CLB"));
        }
        if (!isRepresentative(id, norm(u.getEmail()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ đại diện CLB mới xóa được CLB."));
        }
        clubMemberRepository.deleteByClubId(id);
        clubRepository.deleteById(id);
        refreshClubRepFlag(u.getEmail());
        return ResponseEntity.ok(Map.of("message", "Đã xóa CLB \"" + club.getName() + "\"."));
    }

    /** Thêm thành viên bằng email — chỉ đại diện. */
    @PostMapping("/{id}/members")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> addMember(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                      @AuthenticationPrincipal User me) {
        User u = require(me);
        Club club = findClub(id);
        if (club == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy CLB"));
        }
        if (!isRepresentative(id, norm(u.getEmail()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ đại diện CLB mới thêm được thành viên."));
        }
        String email = norm(body.get("email") != null ? body.get("email").toString() : "");
        if (email.isEmpty() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không hợp lệ."));
        }
        if (clubMemberRepository.existsByClubIdAndMemberEmail(id, email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Người này đã là thành viên của CLB."));
        }
        if (club.getMaxMembers() != null && club.getMaxMembers() > 0
                && clubMemberRepository.countByClubId(id) >= club.getMaxMembers()) {
            return ResponseEntity.badRequest().body(Map.of("message", "CLB đã đủ số thành viên tối đa."));
        }
        // Lấy tên/điện thoại từ hồ sơ nếu tài khoản tồn tại
        String name = body.get("name") != null ? body.get("name").toString().trim() : null;
        String phone = body.get("phone") != null ? body.get("phone").toString().trim() : null;
        Optional<User> target = userRepository.findByEmail(email);
        if (target.isPresent()) {
            if (name == null || name.isBlank()) name = target.get().getFullName();
            if (phone == null || phone.isBlank()) phone = target.get().getPhone();
        }
        clubMemberRepository.save(ClubMember.builder()
                .clubId(id)
                .memberEmail(email)
                .memberName(name)
                .memberPhone(phone)
                .isRepresentative(false)
                .isActive(true)
                .joinedAt(LocalDateTime.now())
                .build());
        return ResponseEntity.ok(Map.of(
                "message", "Đã thêm " + email + " vào CLB.",
                "club", toDto(club, norm(u.getEmail()))));
    }

    /** Gỡ thành viên — chỉ đại diện (không gỡ được chính mình). */
    @DeleteMapping("/{id}/members/{email}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> removeMember(@PathVariable Long id, @PathVariable String email,
                                         @AuthenticationPrincipal User me) {
        User u = require(me);
        Club club = findClub(id);
        if (club == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy CLB"));
        }
        if (!isRepresentative(id, norm(u.getEmail()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ đại diện CLB mới gỡ được thành viên."));
        }
        String target = norm(email);
        if (target.equals(norm(u.getEmail()))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Bạn không thể tự gỡ mình khỏi CLB."));
        }
        clubMemberRepository.deleteByClubIdAndMemberEmail(id, target);
        refreshClubRepFlag(target);
        return ResponseEntity.ok(Map.of(
                "message", "Đã gỡ " + target + " khỏi CLB.",
                "club", toDto(club, norm(u.getEmail()))));
    }

    /** Bổ nhiệm / thu hồi vai trò đại diện — chỉ đại diện. */
    @PatchMapping("/{id}/members/{email}/representative")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> setRepresentative(@PathVariable Long id, @PathVariable String email,
                                             @RequestBody Map<String, Object> body,
                                             @AuthenticationPrincipal User me) {
        User u = require(me);
        Club club = findClub(id);
        if (club == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy CLB"));
        }
        if (!isRepresentative(id, norm(u.getEmail()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ đại diện CLB mới đổi được vai trò."));
        }
        String target = norm(email);
        Optional<ClubMember> found = clubMemberRepository.findByClubIdAndMemberEmail(id, target);
        if (found.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Người này không phải thành viên của CLB."));
        }
        boolean makeRep = body.get("isRepresentative") != null
                && Boolean.parseBoolean(body.get("isRepresentative").toString());
        if (makeRep && clubMemberRepository.countByClubIdAndIsRepresentativeTrue(id) >= 3) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mỗi CLB tối đa 3 đại diện."));
        }
        found.get().setIsRepresentative(makeRep);
        clubMemberRepository.save(found.get());
        refreshClubRepFlag(target);
        return ResponseEntity.ok(Map.of(
                "message", makeRep
                        ? "Đã bổ nhiệm " + target + " làm đại diện CLB."
                        : "Đã thu hồi vai trò đại diện của " + target + ".",
                "club", toDto(club, norm(u.getEmail()))));
    }
}
