package com.soccerhub.service;

import com.soccerhub.model.MatchResult;
import com.soccerhub.repository.MatchResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Phong độ đội bóng tính TRỰC TIẾP từ lịch sử thi đấu thật (bảng match_results).
 * Hệ thống không dùng điểm số: mỗi lần đọc là quét lại toàn bộ kết quả của đội.
 *
 * <p>Chuỗi form: tối đa 5 ký tự W/D/L, ký tự đầu = trận GẦN NHẤT.
 * Ví dụ "WWDLW" nghĩa là trận mới nhất thắng, rồi thắng, hòa, thua, thắng.</p>
 */
@Service
@RequiredArgsConstructor
public class TeamFormService {

    private final MatchResultRepository matchResultRepository;

    /** Thành tích + chuỗi phong độ của một đội (theo đúng tên đội, mọi giải đấu). */
    public FormRecord formOf(String teamName) {
        if (teamName == null || teamName.isBlank()) {
            return FormRecord.empty();
        }
        String key = teamName.trim();
        // Không phân biệt hoa/thường: tên đội do người dùng gõ tay ở nhiều màn hình
        List<MatchResult> results =
                matchResultRepository.findByTeamAIgnoreCaseOrTeamBIgnoreCaseOrderByPlayedAtDesc(key, key);
        int won = 0, drawn = 0, lost = 0;
        StringBuilder form = new StringBuilder();
        for (MatchResult r : results) {
            if (r.getScoreA() == null || r.getScoreB() == null) continue;
            boolean isA = key.equalsIgnoreCase(trim(r.getTeamA()));
            int mine = isA ? r.getScoreA() : r.getScoreB();
            int theirs = isA ? r.getScoreB() : r.getScoreA();
            char c;
            if (mine > theirs) {
                won++;
                c = 'W';
            } else if (mine < theirs) {
                lost++;
                c = 'L';
            } else {
                drawn++;
                c = 'D';
            }
            if (form.length() < 5) form.append(c); // desc order => ký tự đầu là mới nhất
        }
        int played = won + drawn + lost;
        int winRate = played == 0 ? 0 : (int) Math.round(100.0 * won / played);
        return new FormRecord(played, won, drawn, lost, winRate, form.toString());
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }

    /** Bản ghi phong độ bất biến của một đội. */
    public record FormRecord(int played, int won, int drawn, int lost, int winRate, String form) {
        public static FormRecord empty() {
            return new FormRecord(0, 0, 0, 0, 0, "");
        }

        /** Chuỗi "T-H-B", ví dụ "3-1-2". */
        public String record() {
            return won + "-" + drawn + "-" + lost;
        }

        public Map<String, Object> toMap() {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("played", played);
            m.put("won", won);
            m.put("drawn", drawn);
            m.put("lost", lost);
            m.put("winRate", winRate);
            m.put("form", form);
            m.put("record", record());
            return m;
        }
    }
}
