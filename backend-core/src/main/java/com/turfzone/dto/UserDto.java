package com.turfzone.dto;

import com.turfzone.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole role;
    private String position;
    private String area;
    private String favoriteSport;
    private String level;
    private String avatar;
    private String dominantFoot;
    private String jerseyNumber;
    private String height;
    private String weight;
    private String preferredTime;
    private String currentClub;
    /** Cờ "đại diện CLB" — tài khoản này đại diện cho ít nhất 1 CLB. */
    private Boolean isClubRep;
    /**
     * Chỉ được điền khi người dùng vừa ĐỔI EMAIL.
     * JWT lấy subject = email nên token đang dùng sẽ hết hiệu lực ngay sau khi đổi;
     * backend cấp token mới trong cùng response để client thay thế mà không bị đăng xuất.
     */
    private String token;
}
