package com.turfzone.repository;

import com.turfzone.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /** 50 tin nhắn công khai mới nhất của kênh "general" (phòng chat chung), mới nhất đầu tiên. */
    @Query("SELECT m FROM ChatMessage m WHERE m.recipientEmail IS NULL AND m.groupId IS NULL " +
           "AND (m.channel IS NULL OR m.channel = 'general') " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findTop50General();

    /** 50 tin nhắn công khai mới nhất của TẤT CẢ kênh (dùng cho admin kiểm duyệt). */
    @Query("SELECT m FROM ChatMessage m WHERE m.recipientEmail IS NULL AND m.groupId IS NULL " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findTop50AllPublic();

    /** 50 tin nhắn công khai mới nhất của 1 kênh, mới nhất đầu tiên. */
    @Query("SELECT m FROM ChatMessage m WHERE m.recipientEmail IS NULL AND m.groupId IS NULL " +
           "AND m.channel = ?1 " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findTop50ByChannel(String channel);

    /** 50 tin nhắn mới nhất của một phòng chat nhóm, mới nhất đầu tiên. */
    @Query("SELECT m FROM ChatMessage m WHERE m.groupId = ?1 " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findTopMessagesByGroupId(Long groupId);

    /** Số tin nhắn nhóm mới hơn mốc đọc (dùng tính badge chưa đọc). */
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.groupId = ?1 " +
           "AND m.createdAt > ?2 AND m.senderEmail <> ?3")
    long countUnreadInGroup(Long groupId,
                           java.time.LocalDateTime since,
                           String myEmail);

    /** Tin ghim của kênh (tối đa 1). */
    @Query("SELECT m FROM ChatMessage m WHERE m.recipientEmail IS NULL AND m.groupId IS NULL " +
           "AND m.channel = ?1 AND m.pinned = true " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findPinnedByChannel(String channel);

    /** Tin nhắn trực tiếp giữa 2 người (cả 2 chiều), mới nhất đầu tiên. */
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderEmail = ?1 AND m.recipientEmail = ?2) OR " +
           "(m.senderEmail = ?2 AND m.recipientEmail = ?1) " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findDirectMessages(String email1, String email2);

    /** Tất cả tin nhắn trực tiếp của user (để gom danh sách hội thoại), mới nhất đầu tiên. */
    @Query("SELECT m FROM ChatMessage m WHERE m.recipientEmail IS NOT NULL " +
           "AND (m.senderEmail = ?1 OR m.recipientEmail = ?1) " +
           "ORDER BY m.createdAt DESC LIMIT 50")
    List<ChatMessage> findDirectMessagesForUser(String email);

    Optional<ChatMessage> findTopByRecipientEmailIsNullAndChannelAndPinnedTrueOrderByCreatedAtDesc(String channel);

    /** Đếm tin nhắn DM chưa đọc (recipientEmail = email, readAt = null). */
    long countByRecipientEmailAndReadAtIsNull(String recipientEmail);
}