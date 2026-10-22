package com.turfzone.repository;

import org.springframework.transaction.annotation.Transactional;
import com.turfzone.model.ClubMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubMemberRepository extends JpaRepository<ClubMember, Long> {

    List<ClubMember> findByClubIdOrderByIsRepresentativeDescJoinedAtAsc(Long clubId);

    List<ClubMember> findByMemberEmailOrderByJoinedAtDesc(String memberEmail);

    Optional<ClubMember> findByClubIdAndMemberEmail(Long clubId, String memberEmail);

    boolean existsByClubIdAndMemberEmail(Long clubId, String memberEmail);

    long countByClubId(Long clubId);

    long countByClubIdAndIsRepresentativeTrue(Long clubId);

    @Transactional
    void deleteByClubIdAndMemberEmail(Long clubId, String memberEmail);

    @Transactional
    void deleteByClubId(Long clubId);
}
