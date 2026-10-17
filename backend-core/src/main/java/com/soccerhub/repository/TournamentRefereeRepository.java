package com.soccerhub.repository;

import com.soccerhub.model.TournamentReferee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TournamentRefereeRepository extends JpaRepository<TournamentReferee, Long> {

    /** Danh sách trọng tài của một giải đấu. */
    List<TournamentReferee> findByTournamentIdOrderByNameAsc(Long tournamentId);

    boolean existsByTournamentIdAndEmail(Long tournamentId, String email);

    boolean existsByTournamentIdAndPhone(Long tournamentId, String phone);

    @Transactional
    void deleteByIdAndTournamentId(Long id, Long tournamentId);
}