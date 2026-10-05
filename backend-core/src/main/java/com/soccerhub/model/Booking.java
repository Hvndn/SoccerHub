package com.soccerhub.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long pitchId;

    @Column(nullable = false)
    private String courtName;

    private String courtType;

    @Column(nullable = false)
    private String bookingDate; // YYYY-MM-DD

    @Column(nullable = false)
    private String timeSlot; // VD: "16:00 - 17:30"

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    private Integer totalPrice;

    private Integer depositPaid;

    private Integer cashDue;

    @Builder.Default
    private String status = "BOOKED"; // BOOKED, PLAYING, RESALE, CANCELLED

    @Builder.Default
    private String via = "Tạo Tại Quầy"; // "VietQR Online", "Tạo Tại Quầy", "MoMo"

    @Column(unique = true)
    private String code; // VD: "VS-7829-01"

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
