package com.soccerhub.repository;

import com.soccerhub.model.GoalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalEventRepository extends JpaRepository<GoalEvent, Long> {
    List<GoalEvent> findByTournamentId(Long tournamentId);
    List<GoalEvent> findByTournamentIdAndMatchId(Long tournamentId, String matchId);
}
