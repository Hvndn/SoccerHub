package com.soccerhub.service;

import com.soccerhub.dto.*;
import com.soccerhub.model.User;
import com.soccerhub.model.UserRole;
import com.soccerhub.repository.UserRepository;
import com.soccerhub.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(0|\\+84)[0-9]{8,10}$|^[0-9]{9,11}$");

    public AuthResponse register(RegisterRequest req) {
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Họ và Tên đầy đủ.");
        }

        String rawIdentifier = req.getEmail() != null && !req.getEmail().trim().isEmpty() 
                ? req.getEmail().trim() 
                : (req.getPhone() != null ? req.getPhone().trim() : "");

        if (rawIdentifier.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Email hoặc Số điện thoại.");
        }

        boolean isEmail = EMAIL_PATTERN.matcher(rawIdentifier).matches();
        boolean isPhone = PHONE_PATTERN.matcher(rawIdentifier.replaceAll("\\s+", "")).matches();

        if (!isEmail && !isPhone) {
            throw new IllegalArgumentException("Định dạng không hợp lệ. Vui lòng nhập Email (ví dụ: name@domain.com) hoặc Số điện thoại (ví dụ: 0914578037).");
        }

        String email;
        String phone;

        if (isEmail) {
            email = rawIdentifier.toLowerCase();
            phone = req.getPhone() != null ? req.getPhone().trim() : null;
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email '" + email + "' đã tồn tại trong hệ thống. Vui lòng chuyển sang tab Đăng Nhập.");
            }
        } else {
            phone = rawIdentifier.replaceAll("\\s+", "");
            if (userRepository.existsByPhone(phone)) {
                throw new IllegalArgumentException("Số điện thoại '" + phone + "' đã được đăng ký. Vui lòng chuyển sang tab Đăng Nhập.");
            }
            email = req.getEmail() != null && EMAIL_PATTERN.matcher(req.getEmail().trim()).matches()
                    ? req.getEmail().trim().toLowerCase()
                    : phone + "@phone.soccerhub.vn";
            if (userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Tài khoản với số điện thoại này đã tồn tại trong hệ thống. Vui lòng chuyển sang tab Đăng Nhập.");
            }
        }

        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu quá ngắn. Mật khẩu phải có ít nhất 6 ký tự.");
        }

        UserRole requested = req.getRole() != null ? req.getRole() : UserRole.PLAYER;
        // KHÔNG BAO GIỜ cho phép tự đăng ký role ADMIN — chỉ cấp qua /admin/users/{id}/role.
        // Nếu client gửi role=ADMIN thì hạ xuống PLAYER (coi như client cố ý leo thang).
        UserRole role = (requested == UserRole.ADMIN) ? UserRole.PLAYER : requested;
        String position = req.getPosition() != null ? req.getPosition() : 
                (role == UserRole.PLAYER ? "Cầu Thủ Pro" : role == UserRole.OWNER ? "Chủ Cụm Sân" : "Ban Tổ Chức");

        User user = User.builder()
                .fullName(req.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(phone)
                .role(role)
                .position(position)
                .area(req.getArea() != null ? req.getArea() : null)
                .favoriteSport(req.getFavoriteSport() != null ? req.getFavoriteSport() : "football")
                .level(req.getLevel() != null ? req.getLevel() : "Nghiệp dư")
                .avatar(getInitials(req.getFullName()))
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .message("Đăng ký tài khoản SoccerHub cho '" + user.getFullName() + "' thành công!")
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Email hoặc Số điện thoại.");
        }

        if (req.getPassword() == null || req.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Mật khẩu.");
        }

        String input = req.getEmail().trim();
        String cleanedInput = input.toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(cleanedInput)
                .or(() -> userRepository.findByPhone(input))
                .or(() -> userRepository.findByEmail(input + "@phone.soccerhub.vn"));

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Tài khoản '" + input + "' chưa được đăng ký trong hệ thống. Vui lòng bấm Đăng Ký Mới.");
        }

        User user = userOpt.get();

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new IllegalArgumentException("Tài khoản đã bị quản trị viên khóa. Vui lòng liên hệ BTC để được hỗ trợ.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu không chính xác. Vui lòng kiểm tra và thử lại.");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .message("Đăng nhập thành công! Chào mừng " + user.getFullName())
                .build();
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin người dùng cho email: " + email));
        return mapToDto(user);
    }

    public UserDto updateUserProfile(User currentUser, UpdateProfileRequest req) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để cập nhật hồ sơ.");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại."));

        if (req.getFullName() != null && !req.getFullName().trim().isEmpty()) {
            user.setFullName(req.getFullName().trim());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().trim());
        }
        if (req.getPosition() != null) {
            user.setPosition(req.getPosition().trim());
        }
        if (req.getArea() != null) {
            user.setArea(req.getArea().trim());
        }
        if (req.getFavoriteSport() != null) {
            user.setFavoriteSport(req.getFavoriteSport().trim());
        }
        if (req.getLevel() != null) {
            user.setLevel(req.getLevel().trim());
        }
        if (req.getAvatar() != null && !req.getAvatar().trim().isEmpty()) {
            user.setAvatar(req.getAvatar().trim());
        }
        // Chỉ số hồ sơ cầu thủ (null = không sửa, chuỗi rỗng = xóa để trống)
        if (req.getDominantFoot() != null) user.setDominantFoot(req.getDominantFoot().trim());
        if (req.getJerseyNumber() != null) user.setJerseyNumber(req.getJerseyNumber().trim());
        if (req.getHeight() != null) user.setHeight(req.getHeight().trim());
        if (req.getWeight() != null) user.setWeight(req.getWeight().trim());
        if (req.getPreferredTime() != null) user.setPreferredTime(req.getPreferredTime().trim());
        if (req.getCurrentClub() != null) user.setCurrentClub(req.getCurrentClub().trim());

        userRepository.save(user);
        return mapToDto(user);
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .position(user.getPosition())
                .area(user.getArea())
                .favoriteSport(user.getFavoriteSport())
                .level(user.getLevel())
                .avatar(user.getAvatar() != null ? user.getAvatar() : getInitials(user.getFullName()))
                .dominantFoot(user.getDominantFoot())
                .jerseyNumber(user.getJerseyNumber())
                .height(user.getHeight())
                .weight(user.getWeight())
                .preferredTime(user.getPreferredTime())
                .currentClub(user.getCurrentClub())
                .build();
    }

    private String getInitials(String name) {
        if (name == null || name.isBlank()) return "SH";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
