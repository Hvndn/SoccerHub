package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pitches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pitch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    private String area;

    private String phone;

    private Long ownerId;

    private String ownerName;

    @Builder.Default
    private Double latitude = 10.7412;

    @Builder.Default
    private Double longitude = 106.7123;

    @Column(nullable = false)
    private Integer avgPricePerHour;

    private Integer peakPricePerHour;

    @Builder.Default
    private Double rating = 5.0;

    @Builder.Default
    private String openTime = "14:00";

    @Builder.Default
    private String closeTime = "22:30";

    @Builder.Default
    private Integer slotDurationMinutes = 90; // 60, 90, 120

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pitch_types", joinColumns = @JoinColumn(name = "pitch_id"))
    @Column(name = "pitch_type")
    @Builder.Default
    private List<String> pitchTypes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "pitch_amenities", joinColumns = @JoinColumn(name = "pitch_id"))
    @Column(name = "amenity")
    @Builder.Default
    private List<String> amenities = new ArrayList<>();

    private String imageUrl;

    @Column(length = 2000)
    private String description;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
