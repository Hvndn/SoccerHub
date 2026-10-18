package com.soccerhub.repository;

import com.soccerhub.model.AdminAuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    /** Nhật ký mới nhất trước (có phân trang). */
    List<AdminAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Lọc theo nhóm thao tác, mới nhất trước. */
    List<AdminAuditLog> findByActionGroupOrderByCreatedAtDesc(String actionGroup, Pageable pageable);
}