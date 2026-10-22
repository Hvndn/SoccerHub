package com.turfzone.repository;

import com.turfzone.model.Pitch;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PitchRepository extends JpaRepository<Pitch, Long> {
    List<Pitch> findByOwnerId(Long ownerId);
    List<Pitch> findByAreaContainingIgnoreCase(String area);

    /**
     * Khoá dòng sân (SELECT ... FOR UPDATE) để 2 request đặt cùng lúc được xếp hàng.
     * <p>Không có khoá, 2 request cùng ca đều đọc được danh sách đơn rỗng rồi cùng insert
     * → bán trùng 1 ca cho 2 khách.</p>
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pitch p where p.id = :id")
    java.util.Optional<Pitch> findByIdForUpdate(@Param("id") Long id);
}
