package com.soccerhub.repository;

import com.soccerhub.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    /** 50 tin nhắn mới nhất, mới nhất đứng đầu. */
    List<ChatMessage> findTop50ByOrderByCreatedAtDesc();
}