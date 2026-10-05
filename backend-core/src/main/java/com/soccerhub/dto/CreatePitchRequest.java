package com.soccerhub.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePitchRequest {
    private String name;
    private String address;
    private String area;
    private String phone;
    private Double latitude;
    private Double longitude;
    private Integer avgPricePerHour;
    private Integer peakPricePerHour;
    private List<String> pitchTypes;
    private List<String> amenities;
    private String imageUrl;
    private String description;
}
