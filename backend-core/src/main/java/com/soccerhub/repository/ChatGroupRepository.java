package com.soccerhub.repository;

import com.soccerhub.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatGroupRepository extends JpaRepository<ChatGroup, Long> {

    /** Các nhóm mà user là thành viên. */
    @Query("SELECT DISTINCT g FROM ChatGroup g, ChatGroupMember m " +
           "WHERE m.groupId = g.id AND m.memberEmail = ?1 " +
           "ORDER BY g.createdAt DESC")
    List<ChatGroup> findGroupsForMember(String email);

    Optional<ChatGroup> findByIdAndOwnerEmail(Long id, String ownerEmail);

    boolean existsByNameIgnoreCase(String name);
}