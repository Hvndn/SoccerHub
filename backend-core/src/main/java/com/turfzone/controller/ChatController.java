package com.turfzone.controller;

import com.turfzone.model.ChatMessage;
import com.turfzone.model.ChatReaction;
import com.turfzone.model.ChatGroupMember;
import com.turfzone.model.User;
import com.turfzone.repository.ChatMessageRepository;
import com.turfzone.repository.ChatReactionRepository;
import com.turfzone.repository.ChatGroupMemberRepository;
import com.turfzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Phòng chat cộng đồng (nhiều kênh) + tin nhắn trực tiếp (DM) giữa 2 người dùng.
 *
 * Endpoints:
 *   GET    /api/v1/chat/channels                      → danh sách kênh + tin ghim + tin mới nhất
 *   GET    /api/v1/chat/messages?channel={slug}      → 50 tin công khai của kênh đó
 *   GET    /api/v1/chat/messages?with={email}        → tin nhắn trực tiếp với user đó
 *   POST   /api/v1/chat/messages                     → gửi tin (kênh / DM / reply)
 *   POST   /api/v1/chat/messages/{id}/pin?value=true → ghim tin nhắn của chính mình
 *   DELETE /api/v1/chat/messages/{id}                → xóa tin nhắn của chính mình
 *   GET    /api/v1/chat/conversations                 → danh sách người đã nhắn tin cùng
 *   GET    /api/v1/chat/users?query=                 → tìm người dùng để nhắn
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatReactionRepository chatReactionRepository;
    private final UserRepository userRepository;
    private final ChatGroupMemberRepository chatGroupMemberRepository;

    /** Slug kênh hợp lệ, mặc định "general". Chống rác / SQL injection. */
    private static final Set<String> VALID_CHANNELS = Set.of(
            "general", "vang-lai", "bu-thieu-nguoi", "doi-30p", "tinh-trang-san",
            "khieu-nai", "ho-dap-luat", "do-dung-cu", "tuyen-cau-thu", "giai-dau"
    );

    private static String normalizeChannel(String raw) {
        if (raw == null) return "general";
        String c = raw.trim().toLowerCase();
        return VALID_CHANNELS.contains(c) ? c : "general";
    }

    /** Metadata kênh tĩnh — tên hiển thị + mô tả. */
    private static final List<Map<String, Object>> CHANNELS = List.of(
            Map.of("slug", "general", "name", "Phòng Chat Chung", "desc", "Kênh chung của cộng đồng Turfzone"),
            Map.of("slug", "vang-lai", "name", "Bắt Kèo Vãng Lai", "desc", "Kèo tự do, không cố định giờ hoặc ca"),
            Map.of("slug", "bu-thieu-nguoi", "name", "Bù Thiếu Người", "desc", "Đội còn thiếu 1–2 người, ghép nhanh trong tối"),
            Map.of("slug", "doi-30p", "name", "Tìm Đối 30 Phút", "desc", "Ghép kèo nhanh sân gần nhà, giới hạn bán kính"),
            Map.of("slug", "tinh-trang-san", "name", "Tình Trạng Sân", "desc", "Hỏi sân nào còn trống, giá và chủ sân phản hồi"),
            Map.of("slug", "khieu-nai", "name", "Khiêu Nại & Góp Ý", "desc", "Phản ánh chất lượng sân, nhân viên, hệ thống"),
            Map.of("slug", "ho-dap-luat", "name", "Hỏi Đáp Luật", "desc", "Luật phạt đều, VAR, fair-play, thủ tục đăng ký"),
            Map.of("slug", "do-dung-cu", "name", "Đồ Dụng Cụ", "desc", "Mua bán hoặc trá phóng bóng, áo, giày"),
            Map.of("slug", "tuyen-cau-thu", "name", "Tuyển Cầu Thủ", "desc", "Đội lớn tuyển người, đăng thông tin"),
            Map.of("slug", "giai-dau", "name", "Chat Giải Đấu", "desc", "Trao đổi trực tiếp với Ban Tổ Chức, đội bóng và cầu thủ trong giải đấu")
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

    /** Xóa tin nhắn của chính mình (trong kênh công khai). */
    @DeleteMapping("/messages/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> delete(@PathVariable Long id, @AuthenticationPrincipal User me) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));
        if (me.getEmail() == null || !me.getEmail().equalsIgnoreCase(msg.getSenderEmail())) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ tác giả mới xóa được tin nhắn."));
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

    /** Tìm kiếm người dùng để nhắn tin (theo tên hoặc email).
     *  Có thể lọc theo vai trò — dùng cho kênh liên lạc B2B: chủ sân tìm ban tổ chức,
     *  ban tổ chức tìm chủ sân (không cần biết trước email của nhau). */
    @GetMapping("/users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @AuthenticationPrincipal User me
    ) {
        String q = (query == null) ? "" : query.trim().toLowerCase();
        String roleFilter = (role == null) ? "" : role.trim().toUpperCase();
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            if (me != null && me.getEmail() != null && me.getEmail().equalsIgnoreCase(u.getEmail())) continue;
            String name = u.getFullName() != null ? u.getFullName() : "";
            String email = u.getEmail() != null ? u.getEmail() : "";
            String userRole = u.getRole() != null ? u.getRole().name() : "PLAYER";
            if (!roleFilter.isEmpty() && !roleFilter.equals(userRole)) continue;
            if (q.isEmpty() || name.toLowerCase().contains(q) || email.toLowerCase().contains(q)) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("name", name.isEmpty() ? email.split("@")[0] : name);
                row.put("email", email);
                row.put("role", userRole);
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
    // MODERATION (ADMIN): xem / xóa tin nhắn trong các kênh công khai
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

    /** Admin xóa tin nhắn bất kỳ (không giới hạn người gửi). */
    @DeleteMapping("/admin/messages/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminDeleteMessage(@PathVariable Long id) {
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));
        }
        chatMessageRepository.delete(msg);
        return ResponseEntity.ok(Map.of("message", "Đã xóa tin nhắn.", "id", id));
    }


    // ============================================================
    // REACTION (Emoji) — Messenger style
    // ============================================================

    /** Thêm/bỏ reaction emoji cho một tin nhắn. */
    @PostMapping("/messages/{id}/react")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> react(
            @PathVariable Long id,
            @RequestParam String emoji,
            @AuthenticationPrincipal User me
    ) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));

        String email = me.getEmail().toLowerCase();
        Optional<ChatReaction> existing = chatReactionRepository.findByMessageIdAndUserEmailAndEmoji(id, email, emoji);
        if (existing.isPresent()) {
            // Bỏ reaction nếu đã có
            chatReactionRepository.delete(existing.get());
            return ResponseEntity.ok(Map.of("reacted", false, "emoji", emoji));
        } else {
            // Thêm reaction mới
            ChatReaction r = ChatReaction.builder()
                    .messageId(id)
                    .userEmail(email)
                    .emoji(emoji)
                    .build();
            chatReactionRepository.save(r);
            return ResponseEntity.ok(Map.of("reacted", true, "emoji", emoji));
        }
    }

    /** Lấy danh sách reaction của một tin nhắn (gộp theo emoji + đếm). */
    @GetMapping("/messages/{id}/reactions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> getReactions(
            @PathVariable Long id,
            @AuthenticationPrincipal User me
    ) {
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(404).body(List.of());

        List<ChatReaction> reactions = chatReactionRepository.findByMessageId(id);
        Map<String, List<ChatReaction>> byEmoji = reactions.stream()
                .collect(Collectors.groupingBy(ChatReaction::getEmoji));

        String currentEmail = (me != null && me.getEmail() != null)
                ? me.getEmail().toLowerCase()
                : "";

        List<Map<String, Object>> result = byEmoji.entrySet().stream().map(e -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("emoji", e.getKey());
            row.put("count", e.getValue().size());
            row.put("users", e.getValue().stream().map(r -> r.getUserEmail()).toList());
            row.put("meReacted", e.getValue().stream().anyMatch(r -> r.getUserEmail().equals(currentEmail)));
            return row;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // ============================================================
    // READ RECEIPT (Đã đọc) — cho DM & Group
    // ============================================================

    /** Đánh dấu tin nhắn DM/Group đã đọc. */
    @PostMapping("/messages/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User me
    ) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        ChatMessage msg = chatMessageRepository.findById(id).orElse(null);
        if (msg == null) return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tin nhắn."));

        // Chỉ người nhận mới được đánh dấu đã đọc
        String email = me.getEmail().toLowerCase();
        if (msg.getRecipientEmail() != null && !msg.getRecipientEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.status(403).body(Map.of("message", "Chỉ người nhận mới đánh dấu đã đọc."));
        }
        if (msg.getGroupId() != null) {
            // Group: cần table riêng để track read per user per group message - bỏ qua hiện tại
        }

        if (msg.getReadAt() == null) {
            msg.setReadAt(LocalDateTime.now());
            chatMessageRepository.save(msg);
        }
        return ResponseEntity.ok(Map.of("read", true, "readAt", msg.getReadAt()));
    }

    // ============================================================
    // FILE UPLOAD (Ảnh/File đính kèm)
    // ============================================================

    /** Upload file đính kèm tin nhắn. Trả về URL để frontend gửi kèm khi send message. */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User me
    ) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("message", "Chưa đăng nhập."));
        if (file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "File rỗng."));

        // Validate file type & size (max 10MB)
        String contentType = file.getContentType();
        if (contentType == null) return ResponseEntity.badRequest().body(Map.of("message", "Không xác định loại file."));
        boolean isImage = contentType.startsWith("image/");
        boolean isDoc = contentType.equals("application/pdf") ||
                contentType.equals("application/msword") ||
                contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        if (!isImage && !isDoc) {
            return ResponseEntity.badRequest().body(Map.of("message", "Chỉ cho phép ảnh (jpg/png/webp) và PDF/DOC."));
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("message", "File quá lớn (tối đa 10MB)."));
        }

        try {
            // Lưu file vào thư mục uploads (production nên dùng S3/Cloudinary)
            String dir = "uploads/chat/" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
            Path uploadDir = Paths.get(dir);
            Files.createDirectories(uploadDir);

            String ext = "";
            String original = file.getOriginalFilename();
            if (original != null && original.contains(".")) {
                ext = original.substring(original.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + ext;
            Path filePath = uploadDir.resolve(filename);
            Files.write(filePath, file.getBytes());

            String fileUrl = "/api/v1/chat/files/" + filename; // serve qua endpoint static
            String fileType = isImage ? "IMAGE" : "DOCUMENT";

            return ResponseEntity.ok(Map.of(
                    "fileUrl", fileUrl,
                    "fileType", fileType,
                    "fileName", original,
                    "fileSize", file.getSize()
            ));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lưu file thất bại: " + e.getMessage()));
        }
    }

    // ============================================================
    // SEARCH MESSAGES (Tìm tin nhắn trong hội thoại/kênh)
    // ============================================================

    /** Tìm tin nhắn theo từ khóa trong DM hoặc kênh. */
    @GetMapping("/messages/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ChatMessage>> searchMessages(
            @RequestParam String query,
            @RequestParam(required = false) String with,
            @RequestParam(required = false) String channel,
            @AuthenticationPrincipal User me
    ) {
        if (me == null) return ResponseEntity.status(401).body(List.of());
        String email = me.getEmail().toLowerCase();
        String q = query.trim().toLowerCase();

        List<ChatMessage> candidates;
        if (with != null && !with.isBlank()) {
            candidates = chatMessageRepository.findDirectMessages(email, with.trim());
        } else {
            String channelSlug = normalizeChannel(channel);
            candidates = "general".equals(channelSlug)
                    ? chatMessageRepository.findTop50General()
                    : chatMessageRepository.findTop50ByChannel(channelSlug);
        }

        List<ChatMessage> result = candidates.stream()
                .filter(m -> m.getContent().toLowerCase().contains(q))
                .limit(50)
                .toList();
        return ResponseEntity.ok(result);
    }

    // ============================================================
    // UNREAD COUNT (Số tin chưa đọc) — cho badge
    // ============================================================

    /** Tổng số tin nhắn chưa đọc (DM + Group) của user hiện tại. */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> unreadCount(@AuthenticationPrincipal User me) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("total", 0));
        String email = me.getEmail().toLowerCase();

        // DM chưa đọc: tin nhắn có recipientEmail = email và readAt = null
        long dmUnread = chatMessageRepository.countByRecipientEmailAndReadAtIsNull(email);

        // Group chưa đọc: tổng số tin nhắn sau mốc lastReadAt của từng nhóm mà user thuộc.
        long groupUnread = 0;
        List<ChatGroupMember> myGroups = chatGroupMemberRepository.findByMemberEmail(email);
        if (myGroups != null) {
            for (ChatGroupMember g : myGroups) {
                if (g.getGroupId() == null || g.getLastReadAt() == null) continue;
                groupUnread += chatMessageRepository.countUnreadInGroup(g.getGroupId(), g.getLastReadAt(), email);
            }
        }

        return ResponseEntity.ok(Map.of(
                "dm", dmUnread,
                "group", groupUnread,
                "total", dmUnread + groupUnread
        ));
    }

// ============================================================
    // STATIC FILE SERVING (File uploads)
    // ============================================================

    /** Phục vụ file upload (ảnh/PDF/DOC). Tìm file theo tên trong toàn bộ thư mục uploads/chat (đệ quy) */
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            // Trước đây fix cứng theo ngày hôm nay -> nếu file upload ngày trước
            // (avatar/file tin nhắn cũ) sẽ 404. Giờ quét đệ quy toàn bộ uploads/chat.
            Path filePath = Files.walk(Paths.get("uploads/chat"))
                    .filter(Files::isRegularFile)
                    .filter(path -> path.getFileName().toString().equals(filename))
                    .findFirst()
                    .orElse(null);

            if (filePath == null) return ResponseEntity.notFound().build();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}