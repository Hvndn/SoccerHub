package com.soccerhub.repository;

import com.soccerhub.model.MatchmakingPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchmakingPostRepository extends JpaRepository<MatchmakingPost, Long> {
    List<MatchmakingPost> findByStatusOrderByCreatedAtDesc(String status);
    List<MatchmakingPost> findAllByOrderByCreatedAtDesc();
}
