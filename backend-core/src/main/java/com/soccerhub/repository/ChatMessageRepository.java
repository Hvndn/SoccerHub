package com.soccerhub.repository;

import com.soccerhub.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    /** 50 tin nhắn công khai mới nhất (recipientEmail IS NULL), mới nhất đầu tiên. */
    List<ChatMessage> findTop50ByRecipientEmailIsNullOrderByCreatedAtDesc();

    /** Tin nhắn trực tiếp giữa 2 người (cả 2 chiều), mới nhất đầu tiên. */
    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.senderEmail = ?1 AND m.recipientEmail = ?2) OR " +
           "(m.senderEmail = ?2 AND m.recipientEmail = ?1) " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findDirectMessages(String email1, String email2);

    /** Danh sách email những người đã nhắn tin với user hiện tại (cả gửi và nhận). */
    @Query("SELECT DISTINCT CASE WHEN m.senderEmail = ?1 THEN m.recipientEmail ELSE m.senderEmail END " +
           "FROM ChatMessage m WHERE m.recipientEmail IS NOT NULL " +
           "AND (m.senderEmail = ?1 OR m.recipientEmail = ?1)")
    List<String> findConversationPartners(String email);

    /** Tên hiển thị của partner (lấy từ tin nhắn gần nhất). */
    @Query("SELECT m FROM ChatMessage m WHERE m.recipientEmail IS NOT NULL " +
           "AND (m.senderEmail = ?1 OR m.recipientEmail = ?1) " +
           "ORDER BY m.createdAt DESC")
    List<ChatMessage> findDirectMessagesForUser(String email);
}