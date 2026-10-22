package com.turfzone.model;

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
    /**
     * Tien mat da thu tai quay (khi check-in).
     * <p>Truoc day check-in gan cashDue = 0 nen PHAI TIEN con lai bi xoa khoi
     * doanh thu — chu san chi thay dung mot nua so tien thuoc ve.</p>
     */
    private Integer cashCollected;

    @Builder.Default
    private String status = "BOOKED"; // BOOKED, PLAYING, RESALE, CANCELLED

    @Builder.Default
    private String via = "Tạo Tại Quầy"; // "Đặt qua Website", "Tạo Tại Quầy" (giá trị cũ: "VietQR Online", "MoMo")

    @Column(unique = true)
    private String code; // VD: "VS-7829-01"

    private String cancelReason;

    private String cancelledBy; // "OWNER" hoặc "CUSTOMER"

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
