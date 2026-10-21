package com.turfzone.controller;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.servlet.http.HttpServletRequest;
import com.turfzone.dto.AuthResponse;
import com.turfzone.dto.LoginRequest;
import com.turfzone.dto.RegisterRequest;
import com.turfzone.dto.UpdateProfileRequest;
import com.turfzone.dto.UserDto;
import com.turfzone.model.User;
import com.turfzone.service.AuthService;
import com.turfzone.service.GoogleAuthService;
import com.turfzone.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final JwtTokenProvider tokenProvider;

    // ---- Chống brute-force đăng nhập ----
    // Đếm số lần đăng nhập SAI theo (email + IP) trong cửa sổ 5 phút.
    // Quá 5 lần -> trả 429 để kẻ xấu không thể dò mật khẩu bằng vũ lực.
    private static final int MAX_LOGIN_FAILS = 5;
    private static final long LOGIN_WINDOW_MS = 5 * 60 * 1000L;
    private final Map<String, int[]> loginFails = new ConcurrentHashMap<>();
    private final Map<String, Long> loginFailAt = new ConcurrentHashMap<>();

    private String loginAttemptKey(LoginRequest request, HttpServletRequest httpReq) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();
        String ip = "";
        if (httpReq != null) {
            String fwd = httpReq.getHeader("X-Forwarded-For");
            ip = (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : httpReq.getRemoteAddr();
        }
        return email + "|" + ip;
    }

    private boolean isLoginBlocked(String key) {
        Long at = loginFailAt.get(key);
        if (at == null) return false;
        if (System.currentTimeMillis() - at > LOGIN_WINDOW_MS) {
            loginFails.remove(key);
            loginFailAt.remove(key);
            return false;
        }
        int[] counter = loginFails.get(key);
        return counter != null && counter[0] >= MAX_LOGIN_FAILS;
    }

    private void recordLoginFail(String key) {
        long now = System.currentTimeMillis();
        Long at = loginFailAt.get(key);
        if (at == null || now - at > LOGIN_WINDOW_MS) {
            loginFailAt.put(key, now);
            loginFails.put(key, new int[] { 1 });
            return;
        }
        loginFails.computeIfAbsent(key, k -> new int[] { 0 })[0]++;
    }

    private void clearLoginFails(String key) {
        loginFails.remove(key);
        loginFailAt.remove(key);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Đã xảy ra lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpReq) {
        String attemptKey = loginAttemptKey(request, httpReq);
        try {
            AuthResponse response = authService.login(request);
            clearLoginFails(attemptKey);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            recordLoginFail(attemptKey);
            if (isLoginBlocked(attemptKey)) {
                // Đã sai quá nhiều lần -> chặn, nhưng vẫn trả cùng một thông báo chung
                // để không tiết lộ thông tin (người dùng thật gõ đúng vẫn vào được ở nhánh try).
                return ResponseEntity.status(429).body(Map.of(
                        "message", "Bạn đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 5 phút."
                ));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Đã xảy ra lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String idToken = body.get("idToken");
            if (idToken == null || idToken.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu ID token Google."));
            }
            com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload payload =
                    googleAuthService.verify(idToken);
            com.turfzone.model.User user = googleAuthService.findOrCreateUser(payload);

            String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());
            com.turfzone.dto.UserDto userDto = authService.mapToDto(user);

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "user", userDto,
                    "message", "Đăng nhập Google thành công! Chào mừng " + user.getFullName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Đã xảy ra lỗi hệ thống: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
        }
        UserDto userDto = authService.mapToDto(currentUser);
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User currentUser, @RequestBody UpdateProfileRequest request) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
        }
        try {
            UserDto updatedUser = authService.updateUserProfile(currentUser, request);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Đã xảy ra lỗi hệ thống: " + e.getMessage()));
        }
    }
}
