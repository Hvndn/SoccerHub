package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
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

    /**
     * Thông tin nhận tiền của cụm sân (chủ sân khai báo).
     *
     * <p>Dùng để sinh QR VietQR cho kèo giao lưu 50/50: đội nhận kèo chuyển
     * tiền sân về đúng STK của cụm sân. Có thể để trống — khi đó hệ thống chỉ hiện
     * số tiền và số hotline để liên hệ trực tiếp.</p>
     */
    private String bankCode;

    private String bankAccount;

    private String accountName;

    private Long ownerId;

    private String ownerName;

    @Builder.Default
    private Double latitude = 16.0544;

    @Builder.Default
    private Double longitude = 108.2022;

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
    private Integer slotDurationMinutes = 120; // Ca 2 tiếng (120 phút - gồm thời gian đá và giao/trả ca)

    /**
     * Bộ môn + tiện ích của cụm sân.
     *
     * <p>{@code @BatchSize} chống N+1: không có nó, mỗi lần {@code findAll()} sẽ bắn 2 query
     * riêng cho từng sân (9 sân = 18 query). Có BatchSize, Hibernate gom hết vào 1 query
     * {@code IN (pitch_ids)} cho mỗi bảng con — trang đặt sân / trang chủ sân tải nhanh hơn.</p>
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @BatchSize(size = 100)
    @CollectionTable(name = "pitch_types", joinColumns = @JoinColumn(name = "pitch_id"))
    @Column(name = "pitch_type")
    @Builder.Default
    private List<String> pitchTypes = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @BatchSize(size = 100)
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
