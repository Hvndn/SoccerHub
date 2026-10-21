package com.turfzone.repository;

import com.turfzone.model.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    List<MatchResult> findByTournamentIdOrderByPlayedAtAsc(Long tournamentId);

    /** Toàn bộ trận của một đội (cả hai phía A/B), mới nhất trước — nguồn tính phong độ. */
    List<MatchResult> findByTeamAOrTeamBOrderByPlayedAtDesc(String teamA, String teamB);

    /**
     * Giống trên nhưng KHÔNG phân biệt hoa/thường.
     * Tên đội được nhập tay ở nhiều chỗ (đăng ký đội, nhập kết quả, bốc thăm) nên dễ
     * lệch "FC Đại Việt" với "fc đại việt" — nếu so khớp phân biệt case thì phong độ
     * của đội sẽ bị tính thiếu.
     */
    List<MatchResult> findByTeamAIgnoreCaseOrTeamBIgnoreCaseOrderByPlayedAtDesc(String teamA, String teamB);

    /**
     * PHONG ĐỘ NHIỀU ĐỘI TRONG 1 LẦN TRUY VẤN — chống N+1.
     * Trước đây mỗi đội gọi 1 query ({@code formOf}), nên GET /tournaments với 14 giải ×
     * 16 đội = ~224 query DB, mỗi lần tạo giải/đăng ký đội đều phải chờ hàng trăm ms.
     * Bản này lấy tất cả trận của mọi đội trong danh sách bằng 1 query IN, rồi nhóm in-memory.
     */
    List<MatchResult> findByTeamAInIgnoreCaseOrTeamBInIgnoreCaseOrderByPlayedAtDesc(
            Collection<String> teamA, Collection<String> teamB);

    /** Bản ghi mới nhất của một trận — dùng để xóa khi BTC huỷ kết quả. */
    Optional<MatchResult> findFirstByTournamentIdAndMatchIdOrderByPlayedAtDesc(Long tournamentId, String matchId);
}
