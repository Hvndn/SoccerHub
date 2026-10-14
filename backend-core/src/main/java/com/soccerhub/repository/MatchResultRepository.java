package com.soccerhub.repository;

import com.soccerhub.model.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    List<MatchResult> findByTournamentIdOrderByPlayedAtAsc(Long tournamentId);

    /** Bản ghi mới nhất của một trận — dùng để hoàn lại Elo khi BTC huỷ kết quả. */
    Optional<MatchResult> findFirstByTournamentIdAndMatchIdOrderByPlayedAtDesc(Long tournamentId, String matchId);
}
