package com.turfzone.repository;

import com.turfzone.model.CanteenItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CanteenItemRepository extends JpaRepository<CanteenItem, Long> {

    /** Danh sách món của một cụm sân (cụm sân của chủ sân đang đăng nhập). */
    List<CanteenItem> findByPitchIdOrderByNameAsc(Long pitchId);

    /** Tất cả món của một chủ sân (dùng cho ADMIN xem toàn hệ thống). */
    List<CanteenItem> findByOwnerIdOrderByNameAsc(Long ownerId);
}
