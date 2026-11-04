package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_waitlists")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingWaitlist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pitchId;

    private String pitchName;

    private String courtName;

    private String bookingDate; // YYYY-MM-DD

    private String timeSlot; // VD: 18:00 - 19:30

    private String customerName;

    private String customerPhone;

    private String customerEmail;

    /** WAITING, NOTIFIED, BOOKED, EXPIRED, CANCELLED */
    @Builder.Default
    private String status = "WAITING";

    private LocalDateTime notifiedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

