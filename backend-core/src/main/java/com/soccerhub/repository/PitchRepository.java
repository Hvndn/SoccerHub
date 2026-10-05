package com.soccerhub.repository;

import com.soccerhub.model.Pitch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PitchRepository extends JpaRepository<Pitch, Long> {
    List<Pitch> findByOwnerId(Long ownerId);
    List<Pitch> findByAreaContainingIgnoreCase(String area);
}
