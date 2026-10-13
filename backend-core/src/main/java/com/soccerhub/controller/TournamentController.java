package com.soccerhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soccerhub.model.MatchResult;
import com.soccerhub.model.Tournament;
import com.soccerhub.model.TournamentTeamEntry;
import com.soccerhub.repository.MatchResultRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.service.AiEloClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/v1/tournaments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentRepository tournamentRepository;
    private final MatchResultRepository matchResultRepository;
    private final AiEloClient aiEloClient;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<Tournament>> getTournaments() {
        List<Tournament> tournaments = tournamentRepository.findAll();
        return ResponseEntity.ok(tournaments);
    }

    @PostMapping
    public ResponseEntity<Tournament> createTournament(@RequestBody Tournament tournament) {
        if (tournament.getRegisteredTeams() == null) {
            tournament.setRegisteredTeams(0);
        }
        if (tournament.getStatus() == null) {
            tournament.setStatus("OPEN");
        }
        if (tournament.getCreatedAt() == null) {
            tournament.setCreatedAt(LocalDateTime.now());
        }
        Tournament saved = tournamentRepository.save(tournament);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTournamentById(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Admin: đóng / mở / kết thúc giải đấu. */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setTournamentStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        String status = String.valueOf(body.getOrDefault("status", "")).trim().toUpperCase();
        if (!Set.of("OPEN", "ONGOING", "COMPLETED").contains(status)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trạng thái không hợp lệ: " + status));
        }
        tournament.setStatus(status);
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã cập nhật trạng thái giải đấu thành " + status,
                "id", tournament.getId(),
                "status", tournament.getStatus()
        ));
    }

    /** Admin: xóa giải đấu (kèm toàn bộ đội đã đăng ký). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTournament(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .map(tournament -> {
                    tournamentRepository.delete(tournament);
                    return ResponseEntity.ok(Map.of("message", "Đã xóa giải đấu khỏi hệ thống.", "id", id));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại")));
    }

    // ------------------------------------------------------------------
    // GIẢ LẬP + BỐC THĂM THẬT (BTC / ADMIN)
    // ------------------------------------------------------------------
    private static final List<String> SIM_TEAM_POOL = List.of(
            "FC Sông Hàn", "FC Hải Châu", "FC Cẩm Lệ", "FC Ngũ Hành Sơn",
            "FC Liên Chiểu", "FC Thanh Khê", "FC Sơn Trà", "FC Hòa Vang",
            "FC Điện Bàn", "FC Hội An", "FC Tam Kỳ", "FC Cố Đô Huế",
            "FC Đông Hà", "FC Đồng Hới", "FC Vinh City", "FC Thanh Hóa",
            "FC Hải Phòng", "FC Quảng Ninh", "FC Hà Đông", "FC Tây Hồ",
            "FC Thủ Đức", "FC Bình Thạnh", "FC Phú Nhuận", "FC Tân Bình",
            "FC Bình Tân", "FC Nhà Bè", "FC Cần Giờ", "FC Biên Hòa",
            "FC Vũng Tàu", "FC Cần Thơ", "FC Rạch Giá", "FC Cà Mau");

    private static final List<String> SIM_CAPTAINS = List.of(
            "Trần Hoàng Long", "Nguyễn Văn Hùng", "Lê Minh Trí", "Phạm Quốc Bảo",
            "Hoàng Anh Vũ", "Đặng Tuấn Anh", "Vũ Minh Tuấn", "Đỗ Quang Huy",
            "Bùi Tiến Dũng", "Ngô Đình Nam", "Lý Hoàng Nam", "Phan Văn Đức",
            "Tô Văn Vũ", "Lưu Xuân Trường", "Hồ Tấn Tài", "Dương Thanh Hào",
            "Trịnh Văn Lợi", "Cao Văn Triền", "Nguyễn Hoàng Đức", "Phạm Xuân Mạnh");

    /**
     * Nút "Giả lập đủ đội (Test)": sinh đội ảo cho đủ sức chứa để demo
     * bốc thăm khi số đội đăng ký thật chưa đủ.
     */
    @PostMapping("/{id}/fill-teams")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> fillTeams(@PathVariable Long id) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        int cap = tournament.getTotalTeams() != null ? tournament.getTotalTeams() : 8;
        List<TournamentTeamEntry> teams = tournament.getTeams();
        if (teams == null) {
            teams = new ArrayList<>();
            tournament.setTeams(teams);
        }
        if (teams.size() >= cap) {
            return ResponseEntity.ok(Map.of(
                    "message", "Giải đã đủ " + cap + " đội, không cần giả lập thêm.",
                    "added", 0,
                    "registeredTeams", teams.size()));
        }
        Set<String> existing = new HashSet<>();
        for (TournamentTeamEntry t : teams) {
            if (t.getTeamName() != null) existing.add(t.getTeamName().toLowerCase());
        }
        List<String> pool = new ArrayList<>(SIM_TEAM_POOL);
        Collections.shuffle(pool);
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        int added = 0;
        int autoIdx = 1;
        while (teams.size() < cap) {
            String name = null;
            while (!pool.isEmpty()) {
                String cand = pool.remove(0);
                if (!existing.contains(cand.toLowerCase())) {
                    name = cand;
                    break;
                }
            }
            if (name == null) {
                name = "FC Phủi " + String.format("%02d", autoIdx++);
                if (existing.contains(name.toLowerCase())) continue;
            }
            existing.add(name.toLowerCase());
            teams.add(TournamentTeamEntry.builder()
                    .teamName(name)
                    .captainName(SIM_CAPTAINS.get(rnd.nextInt(SIM_CAPTAINS.size())))
                    .captainPhone("09" + String.format("%08d", rnd.nextInt(100_000_000)))
                    .memberCount(10 + rnd.nextInt(9))
                    .eloRating(1200 + rnd.nextInt(501))
                    .registrationStatus("SIMULATED")
                    .simulated(true)
                    .registeredAt(LocalDateTime.now())
                    .build());
            added++;
        }
        tournament.setRegisteredTeams(teams.size());
        tournament.setBracketJson(null); // danh sách đổi -> cần bốc thăm lại
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã giả lập thêm " + added + " đội Test, giải đủ " + cap + " đội.",
                "added", added,
                "registeredTeams", tournament.getRegisteredTeams()));
    }

    private static String roundName(int teamsInRound) {
        return switch (teamsInRound) {
            case 2 -> "Chung kết";
            case 4 -> "Bán kết";
            case 8 -> "Tứ kết";
            case 16 -> "Vòng 1/16";
            case 32 -> "Vòng 1/32";
            default -> "Vòng loại";
        };
    }

    private static Map<String, Object> teamNode(String name, Integer elo, Integer seed) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("elo", elo != null ? elo : 1200);
        if (seed != null) m.put("seed", seed);
        return m;
    }

    /**
     * Bốc thăm chia cặp thật từ đội đã đăng ký: xếp hạt giống theo Elo
     * (hạt giống cao gặp hạt giống thấp), đội top được miễn khi số đội
     * không chẵn lũy thừa của 2. Kết quả lưu vào bracketJson.
     */
    @PostMapping("/{id}/draw")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> drawBracket(@PathVariable Long id) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        List<TournamentTeamEntry> teams = tournament.getTeams() != null
                ? new ArrayList<>(tournament.getTeams())
                : new ArrayList<>();
        if (teams.size() < 2) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cần ít nhất 2 đội mới bốc thăm được."));
        }
        teams.sort((a, b) -> Integer.compare(
                b.getEloRating() != null ? b.getEloRating() : 1200,
                a.getEloRating() != null ? a.getEloRating() : 1200));

        int n = teams.size();
        int p = 2;
        while (p < n) p *= 2;
        int byes = p - n;

        List<Map<String, Object>> rounds = new ArrayList<>();
        List<String> advancers = new ArrayList<>();
        List<Map<String, Object>> round1 = new ArrayList<>();

        for (int i = 0; i < byes; i++) {
            TournamentTeamEntry t = teams.get(i);
            Map<String, Object> byeTeam = teamNode(t.getTeamName(), t.getEloRating(), i + 1);
            Map<String, Object> match = new LinkedHashMap<>();
            match.put("matchId", "R1-BYE" + (i + 1));
            match.put("bye", byeTeam);
            match.put("status", "BYE");
            match.put("winner", t.getTeamName());
            round1.add(match);
            advancers.add(t.getTeamName());
        }
        List<TournamentTeamEntry> rest = teams.subList(byes, n);
        int pairs = rest.size() / 2;
        for (int i = 0; i < pairs; i++) {
            TournamentTeamEntry a = rest.get(i);
            TournamentTeamEntry b = rest.get(rest.size() - 1 - i);
            String matchId = "R1-M" + (i + 1);
            Map<String, Object> match = new LinkedHashMap<>();
            match.put("matchId", matchId);
            match.put("teamA", teamNode(a.getTeamName(), a.getEloRating(), byes + i + 1));
            match.put("teamB", teamNode(b.getTeamName(), b.getEloRating(), n - i));
            match.put("scoreA", 0);
            match.put("scoreB", 0);
            match.put("status", "SCHEDULED");
            match.put("winner", null);
            round1.add(match);
            advancers.add("Thắng " + matchId);
        }
        // Trường hợp lẻ đội (không thể xảy ra với công thức trên, nhưng phòng thủ)
        if (rest.size() % 2 == 1) {
            TournamentTeamEntry leftover = rest.get(pairs);
            Map<String, Object> match = new LinkedHashMap<>();
            match.put("matchId", "R1-BYE" + (byes + 1));
            match.put("bye", teamNode(leftover.getTeamName(), leftover.getEloRating(), null));
            match.put("status", "BYE");
            match.put("winner", leftover.getTeamName());
            round1.add(match);
            advancers.add(leftover.getTeamName());
        }

        Map<String, Object> r1 = new LinkedHashMap<>();
        r1.put("name", roundName(p));
        r1.put("matches", round1);
        rounds.add(r1);

        int remaining = p / 2;
        int roundIdx = 2;
        List<String> slots = advancers;
        while (remaining >= 2) {
            List<Map<String, Object>> matches = new ArrayList<>();
            List<String> next = new ArrayList<>();
            for (int i = 0; i + 1 < slots.size(); i += 2) {
                String matchId = "R" + roundIdx + "-M" + (i / 2 + 1);
                Map<String, Object> teamA = new LinkedHashMap<>();
                teamA.put("name", slots.get(i));
                teamA.put("tbd", true);
                Map<String, Object> teamB = new LinkedHashMap<>();
                teamB.put("name", slots.get(i + 1));
                teamB.put("tbd", true);
                Map<String, Object> match = new LinkedHashMap<>();
                match.put("matchId", matchId);
                match.put("teamA", teamA);
                match.put("teamB", teamB);
                match.put("scoreA", 0);
                match.put("scoreB", 0);
                match.put("status", "TBD");
                match.put("winner", null);
                matches.add(match);
                next.add("Thắng " + matchId);
            }
            Map<String, Object> round = new LinkedHashMap<>();
            round.put("name", roundName(remaining));
            round.put("matches", matches);
            rounds.add(round);
            slots = next;
            remaining /= 2;
            roundIdx++;
        }

        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("tournamentId", tournament.getId());
        bracket.put("title", tournament.getTitle());
        bracket.put("drawnAt", LocalDateTime.now().toString());
        bracket.put("method", "SEEDED_ELO");
        bracket.put("teamCount", n);
        bracket.put("rounds", rounds);

        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu kết quả bốc thăm."));
        }
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Bốc thăm thành công cho " + n + " đội!",
                "bracket", bracket));
    }

    /**
     * Xóa toàn bộ đội Test đã giả lập (giữ nguyên đội đăng ký thật).
     * Dùng để dọn sau demo. Kèm reset nhánh đấu vì danh sách đã đổi.
     */
    @DeleteMapping("/{id}/simulated-teams")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> clearSimulatedTeams(@PathVariable Long id) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        List<TournamentTeamEntry> teams = tournament.getTeams() != null
                ? tournament.getTeams()
                : new ArrayList<>();
        int before = teams.size();
        teams.removeIf(t -> Boolean.TRUE.equals(t.getSimulated())
                || "SIMULATED".equals(t.getRegistrationStatus()));
        int removed = before - teams.size();
        tournament.setRegisteredTeams(teams.size());
        tournament.setBracketJson(null);
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã xóa " + removed + " đội Test, giữ lại " + teams.size() + " đội thật.",
                "removed", removed,
                "registeredTeams", tournament.getRegisteredTeams()));
    }

    private static Integer parseScore(Object raw) {
        if (raw == null) return null;
        try {
            int v = Integer.parseInt(String.valueOf(raw).trim());
            return v >= 0 ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Nhập kết quả một trận (BTC/ADMIN): lưu MatchResult, cập nhật nhánh đấu
     * (đẩy đội thắng vào vòng sau), gọi AI tính Elo mới cho 2 đội.
     */
    @PostMapping("/{id}/matches")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> saveMatchResult(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        if (tournament.getBracketJson() == null || tournament.getBracketJson().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải chưa bốc thăm nên chưa thể nhập kết quả."));
        }
        String matchId = String.valueOf(body.getOrDefault("matchId", "")).trim();
        Integer scoreA = parseScore(body.get("scoreA"));
        Integer scoreB = parseScore(body.get("scoreB"));
        if (matchId.isEmpty() || scoreA == null || scoreB == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu mã trận hoặc tỷ số không hợp lệ (số nguyên >= 0)."));
        }
        if (scoreA.equals(scoreB)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vòng Knockout cần phân thắng bại, không nhận tỷ số hòa."));
        }

        Map<String, Object> bracket;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(tournament.getBracketJson(), Map.class);
            bracket = parsed;
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Dữ liệu nhánh đấu bị lỗi."));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rounds = (List<Map<String, Object>>) bracket.get("rounds");
        Map<String, Object> target = null;
        String roundName = null;
        outer:
        for (Map<String, Object> round : rounds) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) round.get("matches");
            for (Map<String, Object> m : matches) {
                if (matchId.equals(m.get("matchId"))) {
                    target = m;
                    roundName = String.valueOf(round.get("name"));
                    break outer;
                }
            }
        }
        if (target == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy trận " + matchId + " trong nhánh đấu."));
        }
        if (!"SCHEDULED".equals(target.get("status"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trận này không thể nhập điểm (đã đá / miễn / chờ đội)."));
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> teamA = (Map<String, Object>) target.get("teamA");
        @SuppressWarnings("unchecked")
        Map<String, Object> teamB = (Map<String, Object>) target.get("teamB");
        if (teamA == null || teamB == null
                || Boolean.TRUE.equals(teamA.get("tbd")) || Boolean.TRUE.equals(teamB.get("tbd"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cặp đấu chưa đủ 2 đội thật."));
        }
        String nameA = String.valueOf(teamA.get("name"));
        String nameB = String.valueOf(teamB.get("name"));
        int eloA = teamA.get("elo") instanceof Number numA ? numA.intValue() : 1200;
        int eloB = teamB.get("elo") instanceof Number numB ? numB.intValue() : 1200;
        String winner = scoreA > scoreB ? nameA : nameB;

        // 1. Cập nhật trận trong nhánh
        target.put("scoreA", scoreA);
        target.put("scoreB", scoreB);
        target.put("winner", winner);
        target.put("status", "DONE");

        // 2. Đẩy đội thắng vào vòng sau (ô "Thắng {matchId}")
        String slot = "Thắng " + matchId;
        for (Map<String, Object> round : rounds) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) round.get("matches");
            for (Map<String, Object> m : matches) {
                for (String side : List.of("teamA", "teamB")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> node = (Map<String, Object>) m.get(side);
                    if (node != null && Boolean.TRUE.equals(node.get("tbd"))
                            && slot.equals(node.get("name"))) {
                        node.put("name", winner);
                        node.put("elo", winner.equals(nameA) ? eloA : eloB);
                        node.remove("tbd");
                    }
                }
            }
        }

        // 3. Gọi AI tính Elo mới (fallback local nếu AI offline)
        Map<String, Double> elo = aiEloClient.calculateElo(eloA, eloB, scoreA, scoreB);
        int newEloA = (int) Math.round(elo.get("newA"));
        int newEloB = (int) Math.round(elo.get("newB"));
        for (TournamentTeamEntry t : tournament.getTeams()) {
            if (nameA.equals(t.getTeamName())) t.setEloRating(newEloA);
            if (nameB.equals(t.getTeamName())) t.setEloRating(newEloB);
        }

        // 4. Lưu lịch sử + nhánh đấu
        matchResultRepository.save(MatchResult.builder()
                .tournamentId(tournament.getId())
                .matchId(matchId)
                .roundName(roundName)
                .teamA(nameA)
                .teamB(nameB)
                .scoreA(scoreA)
                .scoreB(scoreB)
                .winner(winner)
                .eloDeltaA(elo.get("deltaA"))
                .eloDeltaB(elo.get("deltaB"))
                .build());
        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu nhánh đấu."));
        }
        tournamentRepository.save(tournament);

        List<Map<String, Object>> eloChanges = List.of(
                Map.of("team", (Object) nameA, "oldElo", (Object) eloA, "newElo", (Object) newEloA, "delta", elo.get("deltaA")),
                Map.of("team", (Object) nameB, "oldElo", (Object) eloB, "newElo", (Object) newEloB, "delta", elo.get("deltaB")));
        return ResponseEntity.ok(Map.of(
                "message", "Đã lưu kết quả " + nameA + " " + scoreA + "-" + scoreB + " " + nameB + "!",
                "winner", winner,
                "aiOnline", elo.get("aiOnline").intValue() == 1,
                "eloChanges", eloChanges,
                "bracket", bracket));
    }

    /** Lấy nhánh đấu đã bốc thăm (public — FE render cây nhánh từ đây). */    @GetMapping("/{id}/bracket")
    public ResponseEntity<?> getBracket(@PathVariable Long id) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        if (tournament.getBracketJson() == null || tournament.getBracketJson().isBlank()) {
            return ResponseEntity.status(404).body(Map.of("message", "Giải chưa bốc thăm chia cặp."));
        }
        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(objectMapper.readValue(tournament.getBracketJson(), Map.class));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Dữ liệu nhánh đấu bị lỗi."));
        }
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<?> registerTeam(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu không tồn tại"));
        }

        if (tournament.getTotalTeams() != null && tournament.getRegisteredTeams() >= tournament.getTotalTeams()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu đã đủ số lượng đội đăng ký"));
        }

        String teamName = (String) req.getOrDefault("teamName", "FC Tân Binh");
        String captainName = (String) req.getOrDefault("captainName", "Cầu Thủ");
        String captainPhone = (String) req.getOrDefault("captainPhone", "");
        String subCaptainPhone = (String) req.getOrDefault("subCaptainPhone", "");
        Integer memberCount = req.get("memberCount") != null ? Integer.parseInt(req.get("memberCount").toString()) : 12;
        Integer eloRating = req.get("eloRating") != null ? Integer.parseInt(req.get("eloRating").toString()) : 1200;

        TournamentTeamEntry entry = TournamentTeamEntry.builder()
                .teamName(teamName)
                .captainName(captainName)
                .captainPhone(captainPhone)
                .subCaptainPhone(subCaptainPhone)
                .memberCount(memberCount)
                .eloRating(eloRating)
                .registrationStatus("CONFIRMED")
                .registeredAt(LocalDateTime.now())
                .build();

        tournament.getTeams().add(entry);
        tournament.setRegisteredTeams(tournament.getTeams().size());
        tournamentRepository.save(tournament);

        return ResponseEntity.ok(Map.of(
                "message", "Đăng ký giải đấu thành công!",
                "tournamentId", tournament.getId(),
                "registeredTeams", tournament.getRegisteredTeams(),
                "team", entry
        ));
    }

    @PostMapping("/generate-bracket")
    public ResponseEntity<Map<String, Object>> generateTournamentBracket(@RequestBody Map<String, Object> req) {
        String title = (String) req.getOrDefault("title", "Giải Đấu Mới");
        String format = (String) req.getOrDefault("format", "KNOCKOUT");
        List<String> teams = (List<String>) req.getOrDefault("teams", List.of(
                "FC Tigers", "FC Dragons", "FC Warriors", "FC Phoenix",
                "FC Lions", "FC Sharks", "FC Eagles", "FC Titans"
        ));

        List<String> shuffled = new ArrayList<>(teams);
        Collections.shuffle(shuffled);

        List<Map<String, Object>> quarterFinals = new ArrayList<>();
        for (int i = 0; i < shuffled.size() - 1; i += 2) {
            quarterFinals.add(Map.of(
                    "matchId", "Q-" + (i / 2 + 1),
                    "teamA", shuffled.get(i),
                    "teamB", shuffled.get(i + 1),
                    "scoreA", 0,
                    "scoreB", 0,
                    "status", "SCHEDULED"
            ));
        }

        List<Map<String, Object>> semiFinals = Arrays.asList(
                Map.of("matchId", "SF-1", "teamA", "Thắng Q1", "teamB", "Thắng Q2", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED"),
                Map.of("matchId", "SF-2", "teamA", "Thắng Q3", "teamB", "Thắng Q4", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED")
        );

        Map<String, Object> finalMatch = Map.of(
                "matchId", "FINAL", "teamA", "Thắng SF1", "teamB", "Thắng SF2", "scoreA", 0, "scoreB", 0, "status", "SCHEDULED"
        );

        Map<String, Object> bracketResult = Map.of(
                "tournamentId", "tourn-" + System.currentTimeMillis() % 1000,
                "title", title,
                "format", format,
                "totalTeams", shuffled.size(),
                "bracketTree", Map.of(
                        "quarterFinals", quarterFinals,
                        "semiFinals", semiFinals,
                        "final", finalMatch
                ),
                "standings", List.of(
                        Map.of("rank", 1, "team", "FC Tigers", "played", 3, "won", 3, "draw", 0, "loss", 0, "goalsDiff", "+7", "points", 9),
                        Map.of("rank", 2, "team", "FC Warriors", "played", 3, "won", 2, "draw", 0, "loss", 1, "goalsDiff", "+3", "points", 6),
                        Map.of("rank", 3, "team", "FC Dragons", "played", 3, "won", 1, "draw", 0, "loss", 2, "goalsDiff", "-2", "points", 3),
                        Map.of("rank", 4, "team", "FC Phoenix", "played", 3, "won", 0, "draw", 0, "loss", 3, "goalsDiff", "-8", "points", 0)
                )
        );

        return ResponseEntity.ok(bracketResult);
    }
}
