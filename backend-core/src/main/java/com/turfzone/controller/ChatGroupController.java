package com.turfzone.controller;

import com.turfzone.model.*;
import com.turfzone.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Phòng chat nhóm (nhiều người).
 *
 * Mọi endpoint đều kiểm tra user có thực sự là thành viên nhóm trước khi
 * đọc/gửi — nếu không thì trả 403, tránh lộ nội dung riêng của nhóm.
 *
 * Endpoints:
 *   GET    /api/v1/chat-groups                 → các nhóm tôi tham gia (+ số tin chưa đọc)
 *   POST   /api/v1/chat-groups                 → tạo nhóm mới
 *   GET    /api/v1/chat-groups/{id}            → chi tiết nhóm + danh sách thành viên
 *   GET    /api/v1/chat-groups/{id}/messages   → 50 tin mới nhất
 *   POST   /api/v1/chat-groups/{id}/messages   → gửi tin trong nhóm
 *   POST   /api/v1/chat-groups/{id}/members    → thêm thành viên (chỉ chủ nhóm)
 *   DELETE /api/v1/chat-groups/{id}/members/{email} → gỡ thành viên (chỉ chủ nhóm)
 *   DELETE /api/v1/chat-groups/{id}            → xóa nhóm (chỉ chủ nhóm)
 *   POST   /api/v1/chat-groups/{id}/read       → đánh dấu đã đọc
 */
@RestController
@RequestMapping("/api/v1/chat-groups")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ChatGroupController {

    private static final int MAX_MEMBERS = 30;
    private static final int MAX_NAME = 60;

    private final ChatGroupRepository groupRepository;
    private final ChatGroupMemberRepository memberRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;

    // ---------------------------------------------------------------
    // Helper
    // ---------------------------------------------------------------

    private String emailOf(User me) {
        return me != null && me.getEmail() != null ? me.getEmail().toLowerCase() : "";
    }

    private ChatGroup loadGroupOrNull(Long id) {
        return groupRepository.findById(id).orElse(null);
    }

    /** Nhóm có tồn tại và user là thành viên không? */
    private boolean isMember(Long groupId, String email) {
        return memberRepository.existsByGroupIdAndMemberEmail(groupId, email);
    }

    /**
     * Kiểm tra quyền truy cập nhóm. Trả ResponseEntity lỗi nếu không hợp lệ,
     * trả null nếu OK. Kiểm tra "nhóm có tồn tại" TRƯỚC để không trả nhầm 403
     * cho nhóm không tồn tại.
     */
    private ResponseEntity<?> requireMember(Long groupId, String email) {
        if (loadGroupOrNull(groupId) == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Nhóm không tồn tại."));
        }
        if (!isMember(groupId, email)) {
            return ResponseEntity.status(403).body(Map.of("message", "Bạn không phải thành viên của nhóm này."));
        }
        return null;
    }

    private Map<String, Object> toSummary(ChatGroup g, String email) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", g.getId());
        row.put("name", g.getName());
        row.put("description", g.getDescription());
        row.put("ownerEmail", g.getOwnerEmail());
        row.put("ownerName", g.getOwnerName());
        row.put("isOwner", email.equalsIgnoreCase(g.getOwnerEmail()));
        row.put("memberCount", memberRepository.countByGroupId(g.getId()));
        row.put("createdAt", g.getCreatedAt());

        ChatGroupMember me = memberRepository.findByGroupIdAndMemberEmail(g.getId(), email).orElse(null);
        LocalDateTime since = me != null ? me.getLastReadAt() : LocalDateTime.now();
        row.put("unread", messageRepository.countUnreadInGroup(g.getId(), since, email));

        // Tin mới nhất để hiển thị preview
        List<ChatMessage> latest = messageRepository.findTopMessagesByGroupId(g.getId());
        if (!latest.isEmpty()) {
            ChatMessage last = latest.get(0);
            row.put("lastMessage", last.getContent());
            row.put("lastSender", last.getSenderName());
            row.put("lastTime", last.getCreatedAt());
        } else {
            row.put("lastMessage", "");
            row.put("lastSender", "");
            row.put("lastTime", null);
        }
        return row;
    }

    // ---------------------------------------------------------------
    // Danh sách & tạo nhóm
    // ---------------------------------------------------------------

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal User me) {
        String email = emailOf(me);
        if (email.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));

        List<Map<String, Object>> out = new ArrayList<>();
        for (ChatGroup g : groupRepository.findGroupsForMember(email)) {
            out.add(toSummary(g, email));
        }
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req, @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        if (email.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));

        String name = req.get("name") != null ? req.get("name").toString().trim() : "";
        if (name.length() < 3 || name.length() > MAX_NAME) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên nhóm phải từ 3 đến " + MAX_NAME + " ký tự."));
        }
        String desc = req.get("description") != null ? req.get("description").toString().trim() : null;
        if (desc != null && desc.length() > 200) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mô tả tối đa 200 ký tự."));
        }

        // Tên nhóm phải khác nhau để người dùng không bị nhầm phòng chat
        for (ChatGroup g : groupRepository.findAll()) {
            if (g.getName() != null && g.getName().trim().equalsIgnoreCase(name)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Đã có nhóm trùng tên \"" + name + "\". Hãy chọn tên khác."));
            }
        }

        ChatGroup group = groupRepository.save(ChatGroup.builder()
                .name(name)
                .description(desc)
                .ownerEmail(email)
                .ownerName(me.getFullName() != null ? me.getFullName() : email)
                .build());

        // Người tạo tự động là thành viên
        memberRepository.save(ChatGroupMember.builder()
                .groupId(group.getId())
                .memberEmail(email)
                .memberName(me.getFullName())
                .isOwner(true)
                .lastReadAt(LocalDateTime.now())
                .build());

        // Thêm các thành viên ban đầu (nếu có)
        if (req.get("memberEmails") instanceof Collection<?> raw) {
            int added = 0;
            for (Object o : raw) {
                if (added >= MAX_MEMBERS - 1) break;
                String mEmail = o != null ? o.toString().trim().toLowerCase() : "";
                if (mEmail.isEmpty() || mEmail.equals(email)) continue;
                if (isMember(group.getId(), mEmail)) continue;
                if (memberRepository.countByGroupId(group.getId()) >= MAX_MEMBERS) break;
                memberRepository.save(ChatGroupMember.builder()
                        .groupId(group.getId())
                        .memberEmail(mEmail)
                        .memberName(displayNameOf(mEmail))
                        .isOwner(false)
                        .build());
                added++;
            }
        }

        return ResponseEntity.ok(toSummary(group, email));
    }

    private String displayNameOf(String email) {
        return userRepository.findAll().stream()
                .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(email))
                .map(u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : email)
                .findFirst()
                .orElse(email);
    }

    // ---------------------------------------------------------------
    // Chi tiết nhóm
    // ---------------------------------------------------------------

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        if (email.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));

        ResponseEntity<?> forbidden = requireMember(id, email);
        if (forbidden != null) return forbidden;
        ChatGroup g = loadGroupOrNull(id);

        Map<String, Object> out = toSummary(g, email);
        List<Map<String, Object>> members = new ArrayList<>();
        for (ChatGroupMember m : memberRepository.findByGroupId(id)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("email", m.getMemberEmail());
            row.put("name", m.getMemberName() != null ? m.getMemberName() : m.getMemberEmail());
            row.put("isOwner", Boolean.TRUE.equals(m.getIsOwner()));
            row.put("joinedAt", m.getJoinedAt());
            members.add(row);
        }
        out.put("members", members);
        return ResponseEntity.ok(out);
    }

    // ---------------------------------------------------------------
    // Tin nhắn trong nhóm
    // ---------------------------------------------------------------

    @GetMapping("/{id}/messages")
    public ResponseEntity<?> messages(@PathVariable Long id, @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        if (email.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ResponseEntity<?> forbidden = requireMember(id, email);
        if (forbidden != null) return forbidden;
        List<ChatMessage> msgs = messageRepository.findTopMessagesByGroupId(id);
        Collections.reverse(msgs);
        return ResponseEntity.ok(msgs);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<?> send(@PathVariable Long id,
                                  @RequestBody Map<String, Object> req,
                                  @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        if (email.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ResponseEntity<?> forbidden = requireMember(id, email);
        if (forbidden != null) return forbidden;

        String content = req.get("content") != null ? req.get("content").toString().trim() : "";
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tin nhắn không được rỗng."));
        }
        if (content.length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tin nhắn tối đa 500 ký tự."));
        }

        Long replyToId = null;
        if (req.get("replyToId") != null) {
            try { replyToId = Long.valueOf(req.get("replyToId").toString()); } catch (NumberFormatException ignored) { }
        }

        ChatMessage saved = messageRepository.save(ChatMessage.builder()
                .senderName(me.getFullName() != null && !me.getFullName().isBlank() ? me.getFullName() : email)
                .senderEmail(email)
                .senderRole(me.getRole() != null ? me.getRole().name() : "PLAYER")
                .groupId(id)
                .replyToId(replyToId)
                .content(content)
                .build());

        // Người gửi tự coi là đã đọc
        memberRepository.markRead(id, email, LocalDateTime.now());

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        if (email.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ResponseEntity<?> forbidden = requireMember(id, email);
        if (forbidden != null) return forbidden;
        memberRepository.markRead(id, email, LocalDateTime.now());
        return ResponseEntity.ok(Map.of("message", "Đã đánh dấu đã đọc.", "id", id));
    }

    // ---------------------------------------------------------------
    // Quản lý thành viên (chỉ chủ nhóm)
    // ---------------------------------------------------------------

    private ResponseEntity<?> requireOwner(Long id, String email) {
        ChatGroup g = loadGroupOrNull(id);
        if (g == null) return ResponseEntity.status(404).body(Map.of("message", "Nhóm không tồn tại."));
        if (!email.equalsIgnoreCase(g.getOwnerEmail())) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ chủ nhóm mới được thay đổi thành viên."));
        }
        return null;
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMember(@PathVariable Long id,
                                       @RequestBody Map<String, Object> req,
                                       @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        ResponseEntity<?> forbidden = requireOwner(id, email);
        if (forbidden != null) return forbidden;

        String target = req.get("email") != null ? req.get("email").toString().trim().toLowerCase() : "";
        if (target.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu email thành viên."));
        if (target.equals(email)) return ResponseEntity.badRequest().body(Map.of("message", "Bạn đã là chủ nhóm."));
        if (isMember(id, target)) return ResponseEntity.badRequest().body(Map.of("message", "Người này đã là thành viên."));
        if (memberRepository.countByGroupId(id) >= MAX_MEMBERS) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nhóm đã đủ " + MAX_MEMBERS + " thành viên."));
        }
        boolean userExists = userRepository.findAll().stream()
                .anyMatch(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(target));
        if (!userExists) return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy tài khoản này."));

        memberRepository.save(ChatGroupMember.builder()
                .groupId(id)
                .memberEmail(target)
                .memberName(displayNameOf(target))
                .isOwner(false)
                .build());

        return ResponseEntity.ok(Map.of("message", "Đã thêm thành viên.", "email", target));
    }

    @DeleteMapping("/{id}/members/{targetEmail}")
    public ResponseEntity<?> removeMember(@PathVariable Long id,
                                          @PathVariable String targetEmail,
                                          @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        ResponseEntity<?> forbidden = requireOwner(id, email);
        if (forbidden != null) return forbidden;

        String target = targetEmail.trim().toLowerCase();
        if (target.equals(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chủ nhóm không thể tự gỡ mình."));
        }
        if (!isMember(id, target)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Người này không phải thành viên."));
        }
        memberRepository.deleteByGroupIdAndMemberEmail(id, target);
        return ResponseEntity.ok(Map.of("message", "Đã gỡ thành viên.", "email", target));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id, @AuthenticationPrincipal User me) {
        String email = emailOf(me);
        ResponseEntity<?> forbidden = requireOwner(id, email);
        if (forbidden != null) return forbidden;

        memberRepository.deleteAll(memberRepository.findByGroupId(id));
        messageRepository.deleteAll(messageRepository.findTopMessagesByGroupId(id));
        groupRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa nhóm.", "id", id));
    }
}