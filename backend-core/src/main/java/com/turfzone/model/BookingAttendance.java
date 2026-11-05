package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_attendances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private String playerName;

    private String playerPhone;

    /** GOING (Chắc chắn đi), MAYBE (50/50 chưa chắc), ABSENT (Báo bận vắng) */
    @Builder.Default
    private String status = "GOING";

    @Builder.Default
    private LocalDateTime votedAt = LocalDateTime.now();
}
