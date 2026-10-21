package com.turfzone.security;

import lombok.extern.slf4j.Slf4j;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:}")
    private String jwtSecret;

    /**
     * Secret dự phòng cho môi trường phát triển.
     *
     * <p>TUYỆT ĐỐI không dùng secret này khi chạy production: ai đọc được mã nguồn
     * cũng tự ký được token ADMIN. Khi deploy thật phải đặt biến môi trường
     * {@code JWT_SECRET} (tối thiểu 32 ký tự).</p>
     */
    private static final String DEV_FALLBACK_SECRET =
            "TurfzoneSuperSecretKeyForJWTAuthentication2026PitchManagement";

    @Value("${jwt.expiration:86400000}")
    private long jwtExpirationInMs;

    /**
     * Cảnh báo ngay khi ứng dụng khởi động mà chưa có JWT_SECRET — để admin thấy
     * trước khi lên production, không phải đợi có request đăng nhập.
     */
    @jakarta.annotation.PostConstruct
    public void warnIfUsingDefaultSecret() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            log.warn(
                    "==================== CẢNH BÁO BẢO MẬT ====================\n"
                    + "Chưa đặt biến môi trường JWT_SECRET. Ứng dụng đang dùng secret MẶC ĐỊNH có trong mã nguồn —\n"
                    + "bất kỳ ai đọc được repo này đều có thể tự ký token quyền ADMIN và chiếm toàn bộ hệ thống.\n"
                    + "BẮT BUỘC đặt JWT_SECRET (>= 32 ký tự) khi chạy production.\n"
                    + "======================================================");
        }
    }

    private Key getSigningKey() {
        String secret = jwtSecret == null ? "" : jwtSecret.trim();
        if (secret.isEmpty()) {
            secret = DEV_FALLBACK_SECRET;
            log.warn("Chưa đặt biến môi trường JWT_SECRET — đang dùng secret mặc định cho môi trường phát triển. "
                    + "BẮT BUỘC đặt JWT_SECRET (>= 32 ký tự) khi chạy production.");
        }
        byte[] keyBytes = secret.getBytes();
        // Ensure secret key length is sufficient for HMAC SHA256 (32+ bytes)
        if (keyBytes.length < 32) {
            String padded = String.format("%-32s", secret).replace(' ', '0');
            return Keys.hmacShaKeyFor(padded.getBytes());
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getEmailFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
