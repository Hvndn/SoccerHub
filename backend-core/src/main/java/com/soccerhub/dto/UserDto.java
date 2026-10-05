package com.soccerhub.dto;

import com.soccerhub.model.UserRole;
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
    private Integer eloRating;
    private String area;
    private String favoriteSport;
    private String level;
    private String avatar;
}
