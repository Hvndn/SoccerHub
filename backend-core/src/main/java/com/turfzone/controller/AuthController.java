package com.turfzone.controller;

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
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
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
