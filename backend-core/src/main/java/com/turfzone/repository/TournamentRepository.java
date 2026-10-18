package com.turfzone.repository;

import com.turfzone.model.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByStatus(String status);
    List<Tournament> findBySportType(String sportType);
}
