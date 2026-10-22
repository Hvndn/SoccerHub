package com.turfzone.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Dịch vụ Canteen / cho thuê vật tư bán tại quầy của một cụm sân.
 *
 * <p>Mỗi món thuộc một cụm sân (pitchId). Chủ sân tự khai tên món, giá bán và
 * tồn kho; hệ thống ghi nhận số lượng đã bán trong ngày để chủ sân nắm tình
 * hình quầy.</p>
 */
@Entity
@Table(name = "canteen_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CanteenItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cụm sân sở hữu món này. */
    @Column(nullable = false)
    private Long pitchId;

    /** Chủ sân sở hữu (dùng để kiểm tra quyền khi ADMIN không thao tác). */
    @Column(nullable = false)
    private Long ownerId;

    /** Tên món: "Nước Điện Giải Revive 500ml", "Thuê Giày Đinh TF (Đôi)"... */
    @Column(nullable = false, length = 160)
    private String name;

    /** Đơn vị bán: "chai", "đôi", "bộ"... */
    @Column(length = 30)
    private String unit;

    /** Giá bán (VNĐ). */
    @Column(nullable = false)
    private Integer price;

    /** Tồn kho hiện tại. */
    @Builder.Default
    private Integer stock = 0;

    /** Số lượng đã bán trong ngày hiện tại. */
    @Builder.Default
    private Integer soldToday = 0;

    /** Ngày mà soldToday đang áp dụng (để reset khi qua ngày mới). */
    private LocalDateTime soldDate;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
