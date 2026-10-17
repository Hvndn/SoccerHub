package com.soccerhub.controller;

import com.soccerhub.model.ChatMessage;
import com.soccerhub.model.User;
import com.soccerhub.repository.ChatMessageRepository;
import com.soccerhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Phòng chat cộng đồng (nhiều kênh) + tin nhắn trực tiếp (DM) giữa 2 người dùng.
 *
 * Endpoints:
 *   GET    /api/v1/chat/channels                      → danh sách kênh + tin ghim + tin mới nhất
 *   GET    /api/v1/chat/messages?channel={slug}      → 50 tin công khai của kênh đó
 *   GET    /api/v1/chat/messages?with={email}        → tin nhắn trực tiếp với user đó
 *   POST   /api/v1/chat/messages                     → gửi tin (kênh / DM / reply)
 *   POST   /api/v1/chat/messages/{id}/pin?value=true → ghim tin nhắn của chính mình
 *   DELETE /api/v1/chat/messages/{id}                → xoá tin nhắn của chính mình
 *   GET    /api/v1/chat/conversations                 → danh sách người đã nhắn tin cùng
 *   GET    /api/v1/chat/users?query=                 → tìm người dùng để nhắn
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    /** Slug kênh hợp lệ, mặc định "general". Chống rác / SQL injection. */
    private static final Set<String> VALID_CHANNELS = Set.of(
            "general", "vang-lai", "bu-thieu-nguoi", "doi-30p", "tinh-trang-san",
            "khieu-nai", "ho-dap-luat", "do-dung-cu", "tuyen-cau-thu"
    );

    private static String normalizeChannel(String raw) {
        if (raw == null) return "general";
        String c = raw.trim().toLowerCase();
        return VALID_CHANNELS.contains(c) ? c : "general";
    }

    /** Metadata kênh tĩnh — tên hiển thị + mô tả. */
    private static final List<Map<String, Object>> CHANNELS = List.of(
            Map.of("slug", "general", "name", "Phòng Chat Chung", "desc", "Kênh chung của cộng đồng SoccerHub"),
            Map.of("slug", "vang-lai", "name", "Bắt Kèo Vãng Lai", "desc", "Kèo tự do, không cố định giờ hoặc ca"),
            Map.of("slug", "bu-thieu-nguoi", "name", "Bù Thiếu Người", "desc", "Đội còn thiếu 1–2 người, ghép nhanh trong tối"),
            Map.of("slug", "doi-30p", "name", "Tìm Đối 30 Phút", "desc", "Ghép kèo nhanh sân gần nhà, giới hạn bán kính"),
            Map.of("slug", "tinh-trang-san", "name", "Tình Trạng Sân", "desc", "Hỏi sân nào còn trống, giá và chủ sân phản hồi"),
            Map.of("slug", "khieu-nai", "name", "Khiêu Nại & Góp Ý", "desc", "Phản ánh chất lượng sân, nhân viên, hệ thống"),
            Map.of("slug", "ho-dap-luat", "name", "Hỏi Đáp Luật", "desc", "Luật phạt đều, VAR, fair-play, thủ tục đăng ký"),
            Map.of("slug", "do-dung-cu", "name", "Đồ Dụng Cụ", "desc", "Mua bán hoặc trá phóng bóng, áo, giày"),
            Map.of("slug", "tuyen-cau-thu", "name", "Tuyển Cầu Thủ", "desc", "Đội lớn tuyển người, đăng thông tin")
    );

    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> list(
            @RequestParam(required = false) String with,
            @RequestParam(required = false) String channel,
            @AuthenticationPrincipal User me
    ) {
        if (with != null && !with.isBlank() && me != null) {
            // Tin nhắn trực tiếp giữa me và with
            List<ChatMessage> msgs = chatMessageRepository.findDirectMessages(me.getEmail(), with.trim());
            java.util.Collections.reverse(msgs);
            return ResponseEntity.ok(msgs);
        }
        // Phòng chat công khai — theo kênh (mặc định "general")
        String channelSlug = normalizeChannel(channel);
        List<ChatMessage> msgs = "general".equals(channelSlug)
                ? chatMessageRepository.findTop50General()
                : chatMessageRepository.findTop50ByChannel(channelSlug);
        java.util.Collections.reverse(msgs);
        return ResponseEntity.ok(msgs);
    }

    /**
     * Danh sách kênh phòng chat công khai + tin ghim + số tin chưa xem.
     * Trả về để frontend dựng hub kênh tĩnh (tên, mô tả, icon).
     */
    @GetMapping("/channels")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> channels(@AuthenticationPrincipal User me) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> meta : CHANNELS) {
            String slug = (String) meta.get("slug");
            String label = (String) meta.get("name");
            String desc = (String) meta.get("desc");

            List<ChatMessage> latest = "general".equals(slug)
                    ? chatMessageRepository.findTop50General()
                    : chatMessageRepository.findTop50ByChannel(slug);
            ChatMessage last = latest.isEmpty() ? null : latest.get(0);

            List<ChatMessage> pinned = chatMessageRepository.findPinnedByChannel(slug);
            Map<String, Object> pinRow = null;
            if (!pinned.isEmpty()) {
                ChatMessage p = pinned.get(0);
                pinRow = new LinkedHashMap<>();
                pinRow.put("id", p.getId());
                pinRow.put("content", p.getContent());
                pinRow.put("senderName", p.getSenderName());
                pinRow.put("createdAt", p.getCreatedAt());
            }

            Map<String, Object> row = new LinkedHashMap<>(meta);
            row.put("lastMessage", last != null ? last.getContent() : "");
            row.put("lastSender", last != null ? last.getSenderName() : "");
            // Email người gửi tin cuối: frontend cần để biết tin đó có phải
            // của chính mình hay không (nếu không sẽ tính nhầm là chưa đọc).
            row.put("lastSenderEmail", last != null ? last.getSenderEmail() : "");
            row.put("lastTime", last != null ? last.getCreatedAt() : null);
            row.put("memberCount", latest.stream().map(ChatMessage::getSenderEmail).distinct().count());
            row.put("pinned", pinRow);
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    /** Ghim / bỏ ghim một tin nhắn trong kênh. Chỉ tác giả tin nhắn được phép. */
    @PostMapping("/messages/{id}/pin")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> pin(
            @PathVariable Long id,
            @RequestParam boolean value,
            @AuthenticationPrincipal User me
    ) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));
        if (me.getEmail() == null || !me.getEmail().equalsIgnoreCase(msg.getSenderEmail())) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ tác giả mới ghim được tin nhắn."));
        }
        String ch = normalizeChannel(msg.getChannel());
        if (value) {
            chatMessageRepository.findPinnedByChannel(ch).forEach(m -> {
                m.setPinned(false);
                chatMessageRepository.save(m);
            });
            msg.setPinned(true);
        } else {
            msg.setPinned(false);
        }
        return ResponseEntity.ok(chatMessageRepository.save(msg));
    }

    /** Xoá tin nhắn của chính mình (trong kênh công khai). */
    @DeleteMapping("/messages/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));
        if (me.getEmail() == null || !me.getEmail().equalsIgnoreCase(msg.getSenderEmail())) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ tác giả mới xoá được tin nhắn."));
        }
        chatMessageRepository.delete(msg);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @GetMapping("/conversations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> conversations(@AuthenticationPrincipal User me) {
        if (me == null || me.getEmail() == null) {
            return ResponseEntity.status(401).body(List.of());
        }
        String email = me.getEmail().toLowerCase();
        List<ChatMessage> all = chatMessageRepository.findDirectMessagesForUser(email);

        // Gom theo partner, lấy tin nhắn mới nhất
        Map<String, ChatMessage> latestByPartner = new LinkedHashMap<>();
        for (ChatMessage m : all) {
            String partner = m.getSenderEmail().equalsIgnoreCase(email)
                    ? m.getRecipientEmail() : m.getSenderEmail();
            if (partner == null) continue;
            if (!latestByPartner.containsKey(partner)) {
                latestByPartner.put(partner, m);
            }
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<String, ChatMessage> e : latestByPartner.entrySet()) {
            ChatMessage m = e.getValue();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("partnerEmail", e.getKey());
            row.put("partnerName", m.getSenderEmail().equalsIgnoreCase(email)
                    ? m.getRecipientName() : m.getSenderName());
            row.put("lastMessage", m.getContent());
            row.put("lastTime", m.getCreatedAt());
            row.put("isMine", m.getSenderEmail().equalsIgnoreCase(email));
            result.add(row);
        }
        return ResponseEntity.ok(result);
    }

    /** Tìm kiếm người dùng để nhắn tin (theo tên hoặc email). */
    @GetMapping("/users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam(required = false) String query,
            @AuthenticationPrincipal User me
    ) {
        String q = (query == null) ? "" : query.trim().toLowerCase();
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            if (me != null && me.getEmail() != null && me.getEmail().equalsIgnoreCase(u.getEmail())) continue;
            String name = u.getFullName() != null ? u.getFullName() : "";
            String email = u.getEmail() != null ? u.getEmail() : "";
            if (q.isEmpty() || name.toLowerCase().contains(q) || email.toLowerCase().contains(q)) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", name.isEmpty() ? email.split("@")[0] : name);
                row.put("email", email);
                row.put("role", u.getRole() != null ? u.getRole().name() : "PLAYER");
                result.add(row);
            }
            if (result.size() >= 20) break;
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/messages")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> send(
            @AuthenticationPrincipal User me,
            @RequestBody Map<String, Object> req
    ) {
        if (me == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        }
        String content = req != null && req.get("content") != null
                ? req.get("content").toString().trim()
                : "";
        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tin nhắn không được rỗng."));
        }
        if (content.length() > 500) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tin nhắn tối đa 500 ký tự."));
        }

        String name = me.getFullName() != null && !me.getFullName().isBlank()
                ? me.getFullName()
                : (me.getEmail() != null ? me.getEmail().split("@")[0] : "Người dùng");
        String role = me.getRole() != null ? me.getRole().name() : "PLAYER";

        String recipientEmail = req.get("recipientEmail") != null
                ? req.get("recipientEmail").toString().trim().toLowerCase() : null;
        String recipientName = req.get("recipientName") != null
                ? req.get("recipientName").toString().trim() : null;

        // Kênh chỉ áp dụng cho tin công khai (DM thì không cần).
        String channel = recipientEmail == null
                ? normalizeChannel(req.get("channel") != null ? req.get("channel").toString() : "general")
                : "general";

        Long replyToId = null;
        if (req.get("replyToId") != null) {
            try {
                replyToId = Long.valueOf(req.get("replyToId").toString());
            } catch (NumberFormatException ignored) {
                replyToId = null;
            }
        }

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .senderName(name)
                .senderEmail(me.getEmail() != null ? me.getEmail().toLowerCase() : "")
                .senderRole(role)
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .channel(channel)
                .replyToId(replyToId)
                .content(content)
                .build());

        return ResponseEntity.ok(saved);
    }
    // ============================================================
    // MODERATION (ADMIN): xem / xoá tin nhắn trong các kênh công khai
    // ============================================================

    /**
     * Danh sách tin nhắn công khai (mọi kênh) cho admin kiểm duyệt.
     * Mặc định lấy 100 tin mới nhất; có thể lọc theo kênh.
     */
    @GetMapping("/admin/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatMessage>> adminListMessages(
            @RequestParam(required = false) String channel,
            @RequestParam(defaultValue = "100") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 500));
        List<ChatMessage> all = channel != null && !channel.isBlank()
                ? chatMessageRepository.findTop50ByChannel(channel.trim().toLowerCase())
                : chatMessageRepository.findTop50AllPublic();
        if (all.size() > safeLimit) {
            all = all.subList(0, safeLimit);
        }
        return ResponseEntity.ok(all);
    }

    /** Admin xoá tin nhắn bất kỳ (không giới hạn người gửi). */
    @DeleteMapping("/admin/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminDeleteMessage(@PathVariable Long id) {
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));
        }
        chatMessageRepository.delete(msg);
        return ResponseEntity.ok(Map.of("message", "Đã xoá tin nhắn.", "id", id));
    }
}
