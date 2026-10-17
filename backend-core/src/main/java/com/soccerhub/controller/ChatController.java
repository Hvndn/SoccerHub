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
 * Phòng chat cộng đồng + tin nhắn trực tiếp (DM) giữa 2 người dùng.
 *
 * Endpoints:
 *   GET  /api/v1/chat/messages              → 50 tin công khai (phòng chat chung)
 *   GET  /api/v1/chat/messages?with={email} → tin nhắn trực tiếp với user đó
 *   POST /api/v1/chat/messages              → gửi tin (public nếu không có recipientEmail, DM nếu có)
 *   GET  /api/v1/chat/conversations         → danh sách người đã nhắn tin cùng
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> list(
            @RequestParam(required = false) String with,
            @AuthenticationPrincipal User me
    ) {
        if (with != null && !with.isBlank() && me != null) {
            // Tin nhắn trực tiếp giữa me và with
            List<ChatMessage> msgs = chatMessageRepository.findDirectMessages(me.getEmail(), with.trim());
            java.util.Collections.reverse(msgs);
            return ResponseEntity.ok(msgs);
        }
        // Phòng chat công khai
        List<ChatMessage> msgs = chatMessageRepository.findTop50ByRecipientEmailIsNullOrderByCreatedAtDesc();
        java.util.Collections.reverse(msgs);
        return ResponseEntity.ok(msgs);
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

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .senderName(name)
                .senderEmail(me.getEmail() != null ? me.getEmail().toLowerCase() : "")
                .senderRole(role)
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .content(content)
                .build());

        return ResponseEntity.ok(saved);
    }
}