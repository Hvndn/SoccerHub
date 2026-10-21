package com.turfzone.repository;

import com.turfzone.model.ChatReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatReactionRepository extends JpaRepository<ChatReaction, Long> {

    /** Tất cả reaction của một tin nhắn. */
    List<ChatReaction> findByMessageId(Long messageId);

    /** Reaction của user đó với emoji đó trên tin đó (để toggle). */
    Optional<ChatReaction> findByMessageIdAndUserEmailAndEmoji(Long messageId, String userEmail, String emoji);

    /** Xóa reaction của user với emoji đó trên tin đó. */
    void deleteByMessageIdAndUserEmailAndEmoji(Long messageId, String userEmail, String emoji);
}