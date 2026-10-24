package com.turfzone.repository;

import com.turfzone.model.ChatGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupMemberRepository extends JpaRepository<ChatGroupMember, Long> {

    List<ChatGroupMember> findByGroupId(Long groupId);

    List<ChatGroupMember> findByMemberEmail(String memberEmail);

    Optional<ChatGroupMember> findByGroupIdAndMemberEmail(Long groupId, String memberEmail);

    boolean existsByGroupIdAndMemberEmail(Long groupId, String memberEmail);

    long countByGroupId(Long groupId);

    @Transactional
    void deleteByGroupIdAndMemberEmail(Long groupId, String memberEmail);

    /** Đánh dấu đã đọc tới thời điểm này. Cần @Modifying + @Transactional vì đây là câu UPDATE. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("UPDATE ChatGroupMember m SET m.lastReadAt = :ts " +
           "WHERE m.groupId = :groupId AND m.memberEmail = :email")
    int markRead(@Param("groupId") Long groupId,
                 @Param("email") String email,
                 @Param("ts") LocalDateTime ts);
}