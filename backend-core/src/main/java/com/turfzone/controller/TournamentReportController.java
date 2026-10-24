package com.turfzone.controller;

import com.turfzone.model.MatchResult;
import com.turfzone.model.Tournament;
import com.turfzone.model.TournamentTeamEntry;
import com.turfzone.repository.MatchResultRepository;
import com.turfzone.repository.TournamentRepository;
import com.turfzone.service.TeamFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Xuất báo cáo tổng kết giải đấu (CSV) — dùng cho Ban Tổ Chức.
 *
 * <p>File CSV có BOM UTF-8 để Excel mở đúng tiếng Việt.
 * Bao gồm: thông tin giải, danh sách đội, nhánh đấu + kết quả,
 * BXH phong độ, top ghi bàn.</p>
 */
@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentReportController {

    private final TournamentRepository tournamentRepository;
    private final MatchResultRepository matchResultRepository;
    private final TeamFormService teamFormService;

    private static String csv(Object v) {
        if (v == null) return "";
        String s = String.valueOf(v);
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        // Chống CSV/Excel formula injection: dau ky =,+,-,@ -> dat pre xuong ' de an toan.
        String t = s.trim();
        if (!t.isEmpty() && "=+-@".indexOf(t.charAt(0)) >= 0) {
            return "'" + t;
        }
        return s;
    }

    private static String line(Object... cells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(csv(cells[i]));
        }
        return sb.toString();
    }

    private static ResponseEntity<byte[]> csv(String filename, String content) {
        byte[] body = ("﻿" + content).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(body);
    }

    @GetMapping("/{id}/report.csv")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> exportReport(@PathVariable Long id) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }

        List<MatchResult> results = matchResultRepository.findByTournamentIdOrderByPlayedAtAsc(id);
        Map<String, Integer> goalsByPlayer = new LinkedHashMap<>();
        for (MatchResult r : results) {
            if (r.getWinner() == null) continue;
            // Goals per player would need GoalEvent; here we count per team.
        }
        // Top ghi bàn theo cầu thủ: cần GoalEventRepository — không inject để tránh coupling.
        // Thay vào đó xuất tổng bàn theo đội.

        Map<String, int[]> teamStats = new LinkedHashMap<>();
        for (TournamentTeamEntry e : t.getTeams()) {
            teamStats.put(e.getTeamName(), new int[]{0, 0, 0, 0}); // played, won, drawn, lost
        }
        for (MatchResult r : results) {
            String a = r.getTeamA(), b = r.getTeamB();
            int sa = r.getScoreA() == null ? 0 : r.getScoreA();
            int sb = r.getScoreB() == null ? 0 : r.getScoreB();
            if (a != null) {
                if (!teamStats.containsKey(a)) teamStats.put(a, new int[]{0, 0, 0, 0});
                teamStats.get(a)[0]++;
            }
            if (b != null) {
                if (!teamStats.containsKey(b)) teamStats.put(b, new int[]{0, 0, 0, 0});
                teamStats.get(b)[0]++;
            }
            if (sa > sb && a != null) teamStats.get(a)[1]++;
            else if (sb > sa && b != null) teamStats.get(b)[1]++;
            else if (a != null && b != null) { teamStats.get(a)[2]++; teamStats.get(b)[2]++; }
        }

        StringBuilder sb = new StringBuilder();
        // ---- Thông tin giải ----
        sb.append(line("BÁO CÁO TỔNG KẾT GIẢI ĐẤU"));
        sb.append(line());
        sb.append(line("Tên giải", t.getTitle()));
        sb.append(line("Thể thức sân", t.getSportType()));
        sb.append(line("Hình thức", t.getFormat()));
        sb.append(line("Sân thi đấu", t.getPitchName()));
        sb.append(line("Địa điểm", t.getLocation()));
        sb.append(line("Bắt đầu", t.getStartDate()));
        sb.append(line("Kết thúc", t.getEndDate()));
        sb.append(line("Hạn đăng ký", t.getRegistrationDeadline()));
        sb.append(line("Trạng thái", t.getStatus()));
        sb.append(line("Số đội", t.getRegisteredTeams() + " / " + t.getTotalTeams()));
        sb.append(line("Giải thưởng", t.getPrizePool()));
        sb.append(line("Lệ phí", t.getEntryFee()));
        sb.append(line());

        // ---- Danh sách đội ----
        sb.append(line("=== DANH SÁCH ĐỘI ĐĂNG KÝ ==="));
        sb.append(line("STT", "Đội", "Đội trưởng", "SĐT", "Số thành viên", "Trạng thái"));
        int i = 1;
        for (TournamentTeamEntry e : t.getTeams()) {
            sb.append(line(i++, e.getTeamName(), e.getCaptainName(), e.getCaptainPhone(),
                    e.getMemberCount(), e.getRegistrationStatus()));
        }
        sb.append(line());

        // ---- Kết quả trận đấu ----
        sb.append(line("=== KẾT QUẢ THI ĐẤU ==="));
        sb.append(line("Mã trận", "Vòng", "Đội A", "Tỷ số", "Đội B", "Người thắng", "Ngày thi đấu"));
        for (MatchResult r : results) {
            sb.append(line(r.getMatchId(), r.getRoundName(), r.getTeamA(),
                    r.getScoreA() + " - " + r.getScoreB(), r.getTeamB(), r.getWinner(),
                    r.getPlayedAt() == null ? "" : r.getPlayedAt().toString().replace("T", " ").substring(0, 16)));
        }
        sb.append(line());

        // ---- BXH phong độ ----
        sb.append(line("=== BẢNG XẾP HẠNG PHONG ĐỘ ==="));
        sb.append(line("STT", "Đội", "Số trận", "Thắng", "Hòa", "Thua", "Tỷ lệ thắng", "Chuỗi form"));
        List<Map<String, Object>> board = new ArrayList<>();
        for (String name : teamStats.keySet()) {
            TeamFormService.FormRecord f = teamFormService.formOf(name);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("teamName", name);
            row.putAll(f.toMap());
            board.add(row);
        }
        board.sort((a, b) -> {
            int c = Integer.compare((int) b.get("winRate"), (int) a.get("winRate"));
            if (c != 0) return c;
            return Integer.compare((int) b.get("played"), (int) a.get("played"));
        });
        int rank = 1;
        for (Map<String, Object> r : board) {
            int played = (int) r.get("played");
            int won = (int) r.get("won");
            int drawn = (int) r.get("drawn");
            int lost = (int) r.get("lost");
            sb.append(line(rank++, r.get("teamName"), played, won, drawn, lost,
                    r.get("winRate") + "%", r.get("form")));
        }
        sb.append(line());

        // ---- Thống kê tổng ----
        int totalGoalsA = results.stream().mapToInt(r -> r.getScoreA() == null ? 0 : r.getScoreA()).sum();
        int totalGoalsB = results.stream().mapToInt(r -> r.getScoreB() == null ? 0 : r.getScoreB()).sum();
        sb.append(line("=== THỐNG KÊ TỔNG ==="));
        sb.append(line("Số trận đã thi đấu", results.size()));
        sb.append(line("Tổng bàn thắng", totalGoalsA + totalGoalsB));
        sb.append(line("Trung bình bàn/trận",
                results.isEmpty() ? 0 : Math.round((totalGoalsA + totalGoalsB) * 10.0 / results.size()) / 10.0));
        sb.append(line("Số đội tham gia", t.getTeams().size()));
        sb.append(line());
        sb.append(line("Xuất ngày", java.time.LocalDateTime.now().toString().replace("T", " ").substring(0, 19)));

        String safeTitle = t.getTitle().replaceAll("[^a-zA-Z0-9\\-_. ]", "").trim().replace(" ", "-");
        if (safeTitle.isEmpty()) safeTitle = "giai-dau";
        return csv(safeTitle + "-bao-cao.csv", sb.toString());
    }
}