package com.turfzone.repository;

import com.turfzone.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {

    Optional<Club> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Club> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);
}
