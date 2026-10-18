package com.turfzone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
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
}
