package com.soccerhub.dto;

import com.soccerhub.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private UserRole role;
    private String position;
    private String area;
    private String favoriteSport;
    private String level;
}
