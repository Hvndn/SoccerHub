package com.turfzone.repository;

import com.turfzone.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByOrderByIdDesc();

    /** Kiem tra trung nhan thong bao cho 1 email + type + noi dung (dung cho diu nhip reminder). */
    boolean existsByTargetEmailAndTypeAndMessageContaining(String targetEmail, String type, String content);
}
