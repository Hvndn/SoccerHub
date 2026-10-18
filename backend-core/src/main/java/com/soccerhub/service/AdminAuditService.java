package com.soccerhub.service;

import com.soccerhub.model.AdminAuditLog;
import com.soccerhub.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Ghi và đọc Nhật ký Quản trị.
 *
 * <p>Nguyên tắc quan trọng: ghi log KHÔNG được làm hỏng thao tác chính. Nếu ghi log
 * lỗi (bảng chưa tồn tại, DB lỗi...) thì chỉ ghi log cảnh báo rồi bỏ qua, thao tác
 * của admin vẫn phải thành công.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditService {

    private final AdminAuditLogRepository repository;

    /** Ghi nhật ký. Không bao giờ ném exception ra ngoài. */
    public void log(String adminEmail, String adminName, String group, String action,
                    String target, String detail) {
        try {
            repository.save(AdminAuditLog.builder()
                    .adminEmail(adminEmail != null ? adminEmail : "khong-ro-email")
                    .adminName(adminName)
                    .actionGroup(group)
                    .action(action)
                    .target(target != null && target.length() > 160 ? target.substring(0, 160) : target)
                    .detail(detail != null && detail.length() > 400 ? detail.substring(0, 400) : detail)
                    .build());
        } catch (Exception e) {
            log.warn("[AuditLog] Khong ghi duoc nhat ky '{}' cho {}: {}", action, adminEmail, e.getMessage());
        }
    }

    /** Lấy nhật ký mới nhất, tối đa {@code limit} bản ghi. */
    public List<AdminAuditLog> recent(String group, int limit) {
        int safe = Math.max(1, Math.min(limit, 300));
        PageRequest page = PageRequest.of(0, safe);
        try {
            return (group == null || group.isBlank())
                    ? repository.findAllByOrderByCreatedAtDesc(page)
                    : repository.findByActionGroupOrderByCreatedAtDesc(group.trim().toUpperCase(), page);
        } catch (Exception e) {
            log.warn("[AuditLog] Khong doc duoc nhat ky: {}", e.getMessage());
            return List.of();
        }
    }
}