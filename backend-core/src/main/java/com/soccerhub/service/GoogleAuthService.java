package com.soccerhub.service;

import com.soccerhub.model.User;
import com.soccerhub.model.UserRole;
import com.soccerhub.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Xác thực Google ID token (Sign in with Google).
 *
 * <p>Khách hàng gửi ID token từ Google Identity Services; backend kiểm tra chữ ký
 * với public key của Google, lấy email + tên + ảnh, sau đó tạo/tìm tài khoản
 * SoccerHub và cấp JWT của riêng mình (giữ nguyên cơ chế auth hiện tại).</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private final UserRepository userRepository;

    @Value("${google.client-id:}")
    private String clientId;

    /** Có bật đăng nhập Google không (cần GOOGLE_CLIENT_ID). */
    public boolean isEnabled() {
        return clientId != null && !clientId.isBlank();
    }

    /**
     * Xác minh ID token Google và trả về payload đã kiểm tra.
     * @throws IllegalArgumentException nếu token không hợp lệ
     */
    public GoogleIdToken.Payload verify(String idToken) {
        if (!isEnabled()) {
            throw new IllegalArgumentException("Đăng nhập Google chưa được cấu hình (thiếu GOOGLE_CLIENT_ID).");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Thiếu ID token Google.");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new IllegalArgumentException("ID token Google không hợp lệ hoặc đã hết hạn.");
            }
            GoogleIdToken.Payload payload = token.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new IllegalArgumentException("Email Google chưa được xác minh.");
            }
            return payload;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[GoogleAuth] Lỗi xác minh ID token: {}", e.getMessage());
            throw new IllegalArgumentException("Không xác minh được ID token Google.");
        }
    }

    /**
     * Đăng nhập/đăng ký bằng Google.
     * - Nếu email đã có tài khoản → trả về user đó (role giữ nguyên)
     * - Nếu chưa có → tạo tài khoản mới với role PLAYER, password ngẫu nhiên
     */
    public User findOrCreateUser(GoogleIdToken.Payload payload) {
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Google không trả về email.");
        }
        String emailLower = email.trim().toLowerCase();

        User existing = userRepository.findByEmail(emailLower).orElse(null);
        if (existing != null) {
            if (Boolean.FALSE.equals(existing.getEnabled())) {
                throw new IllegalArgumentException("Tài khoản đã bị quản trị viên khóa.");
            }
            return existing;
        }

        // Tạo mới
        String name = payload.get("name") != null
                ? String.valueOf(payload.get("name")).trim()
                : emailLower;
        String picture = payload.get("picture") != null ? String.valueOf(payload.get("picture")) : null;

        // Password ngẫu nhiên — user đăng nhập Google không dùng password thường
        String randomPass = java.util.UUID.randomUUID().toString() + java.util.UUID.randomUUID();

        User user = User.builder()
                .fullName(name.isEmpty() ? emailLower : name)
                .email(emailLower)
                .password(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(randomPass))
                .phone(null)
                .role(UserRole.PLAYER)
                .position("Cầu Thủ Pro")
                .area(null)
                .favoriteSport("football")
                .level("Nghiệp dư")
                .avatar(picture != null ? picture : name.substring(0, Math.min(2, name.length())).toUpperCase())
                .enabled(true)
                .build();
        userRepository.save(user);
        log.info("[GoogleAuth] Tao tai khoan moi tu Google: {}", emailLower);
        return user;
    }
}