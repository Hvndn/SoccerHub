package com.soccerhub.controller;

import com.soccerhub.model.ChatMessage;
import com.soccerhub.model.User;
import com.soccerhub.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Phòng chat công khai của cộng đồng SoccerHub.
 * - GET  /api/v1/chat/messages  : 50 tin mới nhất (mới nhất đầu tiên)
 * - POST /api/v1/chat/messages   : gửi tin (yêu cầu đăng nhập)
 *
 * Thiết kế tối giản: một phòng chat chung cho mọi người dùng đã đăng nhập.
 * Realtime ở frontend dùng polling 3 giây — đủ cho demo đồ án, không cần WebSocket.
 */
@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;

    @GetMapping("/messages")
    public ResponseEntity<List<ChatMessage>> list() {
        List<ChatMessage> msgs = chatMessageRepository.findTop50ByOrderByCreatedAtDesc();
        // trả về theo thứ tự cũ → mới để frontend render từ trên xuống dưới
        java.util.Collections.reverse(msgs);
        return ResponseEntity.ok(msgs);
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

        ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                .senderName(name)
                .senderEmail(me.getEmail() != null ? me.getEmail().toLowerCase() : "")
                .senderRole(role)
                .content(content)
                .build());

        return ResponseEntity.ok(saved);
    }
}