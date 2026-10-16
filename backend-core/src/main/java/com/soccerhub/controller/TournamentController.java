package com.soccerhub.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soccerhub.model.GoalEvent;
import com.soccerhub.model.MatchResult;
import com.soccerhub.model.Tournament;
import com.soccerhub.model.TournamentTeamEntry;
import com.soccerhub.repository.GoalEventRepository;
import com.soccerhub.repository.MatchResultRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.service.TeamFormService;
import com.soccerhub.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentRepository tournamentRepository;
    private final MatchResultRepository matchResultRepository;
    private final GoalEventRepository goalEventRepository;
    private final TeamFormService teamFormService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<Tournament>> getTournaments() {
        List<Tournament> tournaments = tournamentRepository.findAll();
        tournaments.forEach(this::attachForm);
        return ResponseEntity.ok(tournaments);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
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
                .map(t -> {
                    attachForm(t);
                    return ResponseEntity.ok(t);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Gắn phong độ live (tính từ match_results) vào từng đội — field @Transient,
     * không lưu DB. Frontend hiển thị chuỗi 5 trận + thành tích thay cho điểm Elo.
     */
    private void attachForm(Tournament t) {
        if (t.getTeams() == null) return;
        enrichEntries(t.getTeams());
    }

    /** Tính phong độ live cho danh sách đội (dùng khi bốc thăm + response). */
    private void enrichEntries(List<TournamentTeamEntry> entries) {
        for (TournamentTeamEntry e : entries) {
            TeamFormService.FormRecord f = teamFormService.formOf(e.getTeamName());
            e.setForm(f.form());
            e.setRecord(f.record());
            e.setWinRate(f.winRate());
            e.setPlayed(f.played());
            e.setWon(f.won());
            e.setDrawn(f.drawn());
            e.setLost(f.lost());
        }
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

    /** Admin: xóa giải đấu (kèm đội đăng ký, kết quả trận và bàn thắng liên quan). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTournament(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .map(tournament -> {
                    matchResultRepository.deleteAll(matchResultRepository.findByTournamentIdOrderByPlayedAtAsc(id));
                    goalEventRepository.deleteAll(goalEventRepository.findByTournamentId(id));
                    tournamentRepository.delete(tournament);
                    return ResponseEntity.ok(Map.of("message", "Đã xóa giải đấu cùng kết quả và bàn thắng liên quan.", "id", id));
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

    private static final List<String> SIM_FAMILY = List.of(
            "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ",
            "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý",
            "Trịnh", "Cao", "Lưu", "Tô");

    private static final List<String> SIM_MIDDLE = List.of(
            "Văn", "Thị", "Hữu", "Đức", "Minh", "Quang", "Thành", "Công",
            "Xuân", "Đình", "Mạnh", "Tuấn", "Hải", "Bá", "Ngọc", "Gia");

    private static final List<String> SIM_GIVEN = List.of(
            "An", "Anh", "Bảo", "Bình", "Cường", "Dũng", "Giang", "Hải",
            "Hiếu", "Hoàng", "Hùng", "Huy", "Khánh", "Khoa", "Long",
            "Minh", "Nam", "Nhân", "Phong", "Phúc", "Quân", "Tài",
            "Tâm", "Thắng", "Thanh", "Thiện", "Toàn", "Trung", "Tuấn",
            "Tùng", "Việt", "Vinh", "Hưng", "Lộc", "Phát", "Sang",
            "Sơn", "Tân", "Tiến", "Kiệt", "Khang", "Duy", "Hậu", "Lâm");

    /**
     * Sinh đội hình gồm đúng quân số theo thể thức sân (tên Việt ngẫu nhiên,
     * không trùng trong đội). Đội trưởng = thành viên đầu tiên.
     */
    private static List<String> generateRoster(String sportType, ThreadLocalRandom rnd) {
        int size;
        if (sportType != null && (sportType.contains("11"))) size = 16 + rnd.nextInt(5);
        else if (sportType != null && (sportType.contains("FUTSAL") || sportType.contains("5"))) size = 8 + rnd.nextInt(3);
        else size = 12 + rnd.nextInt(3);
        Set<String> used = new HashSet<>();
        List<String> roster = new ArrayList<>();
        int guard = 0;
        while (roster.size() < size && guard++ < size * 50) {
            String name = SIM_FAMILY.get(rnd.nextInt(SIM_FAMILY.size())) + " "
                    + SIM_MIDDLE.get(rnd.nextInt(SIM_MIDDLE.size())) + " "
                    + SIM_GIVEN.get(rnd.nextInt(SIM_GIVEN.size()));
            if (used.add(name)) roster.add(name);
        }
        return roster;
    }

    /**
     * Nút "Giả lập đủ đội (Test)": sinh đội ảo cho đủ sức chứa (8/12/16 đội
     * tùy cấu hình giải) để demo bốc thăm khi số đội đăng ký thật chưa đủ.
     * Mỗi đội có đủ quân số + danh sách thành viên, lưu thật vào CSDL.
     * Body tuỳ chọn {"count": n} để chỉ thêm đúng n đội thay vì lấp đầy.
     */
    @PostMapping("/{id}/fill-teams")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> fillTeams(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
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
        int target = cap;
        if (body != null && body.get("count") != null) {
            try {
                int want = Integer.parseInt(body.get("count").toString());
                if (want > 0) target = Math.min(cap, teams.size() + want);
            } catch (NumberFormatException ignored) {
            }
        }
        if (teams.size() >= target) {
            return ResponseEntity.ok(Map.of(
                    "message", "Giải đã đủ " + target + " đội, không cần giả lập thêm.",
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
        while (teams.size() < target) {
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
            List<String> roster = generateRoster(tournament.getSportType(), rnd);
            teams.add(TournamentTeamEntry.builder()
                    .teamName(name)
                    .captainName(roster.isEmpty() ? "Trần Hoàng Long" : roster.get(0))
                    .captainPhone("09" + String.format("%08d", rnd.nextInt(100_000_000)))
                    .memberCount(roster.size())
                    .memberNames(String.join(",", roster))
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
                "message", "Đã giả lập thêm " + added + " đội Test kèm danh sách thành viên, giải có " + teams.size() + "/" + cap + " đội.",
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

    private static Map<String, Object> teamNode(String name, TournamentTeamEntry entry, Integer seed) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        if (entry != null) {
            m.put("form", entry.getForm());
            m.put("record", entry.getRecord());
            m.put("winRate", entry.getWinRate());
        }
        if (seed != null) m.put("seed", seed);
        return m;
    }

    /**
     * Vòng tròn 1 lượt (circle method): mỗi cặp gặp nhau đúng 1 lần.
     * Số đội lẻ → mỗi vòng 1 đội nghỉ (ghi nhận BYE, không điểm).
     */
    private ResponseEntity<?> drawRoundRobin(Tournament tournament, List<TournamentTeamEntry> teams) {
        int n = teams.size();
        List<TournamentTeamEntry> circle = new ArrayList<>(teams);
        if (n % 2 == 1) circle.add(null); // đội nghỉ mỗi vòng
        boolean hasBye = (n % 2 == 1);
        int roundsCount = hasBye ? n : n - 1;

        List<Map<String, Object>> rounds = new ArrayList<>();
        for (int r = 0; r < roundsCount; r++) {
            List<Map<String, Object>> matches = new ArrayList<>();
            int m = 0;
            for (int i = 0; i < circle.size() / 2; i++) {
                TournamentTeamEntry a = circle.get(i);
                TournamentTeamEntry b = circle.get(circle.size() - 1 - i);
                if (a == null || b == null) {
                    TournamentTeamEntry present = a != null ? a : b;
                    if (present == null) continue;
                    Map<String, Object> match = new LinkedHashMap<>();
                    match.put("matchId", "R" + (r + 1) + "-BYE" + (++m));
                    match.put("bye", teamNode(present.getTeamName(), present, null));
                    match.put("status", "BYE");
                    match.put("winner", present.getTeamName());
                    matches.add(match);
                    continue;
                }
                String matchId = "R" + (r + 1) + "-M" + (++m);
                Map<String, Object> match = new LinkedHashMap<>();
                match.put("matchId", matchId);
                match.put("teamA", teamNode(a.getTeamName(), a, null));
                match.put("teamB", teamNode(b.getTeamName(), b, null));
                match.put("scoreA", 0);
                match.put("scoreB", 0);
                match.put("status", "SCHEDULED");
                match.put("winner", null);
                matches.add(match);
            }
            // Xoay vòng tròn: giữ cố định đội đầu, xoay phần còn lại
            if (circle.size() > 2) {
                TournamentTeamEntry last = circle.remove(circle.size() - 1);
                circle.add(1, last);
            }
            Map<String, Object> round = new LinkedHashMap<>();
            round.put("name", "Vòng " + (r + 1));
            round.put("matches", matches);
            rounds.add(round);
        }

        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("tournamentId", tournament.getId());
        bracket.put("title", tournament.getTitle());
        bracket.put("drawnAt", LocalDateTime.now().toString());
        bracket.put("method", "ROUND_ROBIN");
        bracket.put("teamCount", n);
        bracket.put("rounds", rounds);

        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu lịch vòng tròn."));
        }
        tournamentRepository.save(tournament);
        notificationService.notify("ALL",
                "Đã xếp lịch vòng tròn giải " + tournament.getTitle(),
                "Lịch " + roundsCount + " vòng cho " + n + " đội đã được BTC công bố. Mở tab Nhánh đấu để xem!",
                "TOURNAMENT", "/?tab=tournaments");
        return ResponseEntity.ok(Map.of(
                "message", "Xếp lịch vòng tròn thành công cho " + n + " đội (" + roundsCount + " vòng)!",
                "bracket", bracket));
    }

    /**
     * Bốc thăm thật từ đội đã đăng ký:
     * - KNOCKOUT: xếp hạt giống theo THỨ TỰ ĐĂNG KÝ (đội đóng phí trước xếp trên),
     *   đội top được miễn khi lẻ lũy thừa 2.
     * - ROUND_ROBIN: vòng tròn 1 lượt (circle method), cho phép hòa.
     * Kết quả lưu vào bracketJson. Phong độ mỗi đội lấy live từ lịch sử thi đấu.
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
        // Chỉ đội đã đóng phí (CONFIRMED) và đội Test (SIMULATED) được bốc thăm
        teams.removeIf(t -> "PENDING_PAYMENT".equals(t.getRegistrationStatus()));
        if (teams.size() < 2) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cần ít nhất 2 đội đã đóng lệ phí mới bốc thăm được."));
        }
        // Hạt giống = thứ tự đăng ký (registeredAt tăng dần, null xếp cuối)
        teams.sort(Comparator.comparing(
                TournamentTeamEntry::getRegisteredAt,
                Comparator.nullsLast(Comparator.naturalOrder())));
        // Gắn phong độ live để hiển thị cùng hạt giống trong nhánh đấu
        enrichEntries(teams);

        if ("ROUND_ROBIN".equals(tournament.getFormat())) {
            return drawRoundRobin(tournament, teams);
        }

        int n = teams.size();
        int p = 2;
        while (p < n) p *= 2;
        int byes = p - n;

        List<Map<String, Object>> rounds = new ArrayList<>();
        List<String> advancers = new ArrayList<>();
        List<Map<String, Object>> round1 = new ArrayList<>();

        for (int i = 0; i < byes; i++) {
            TournamentTeamEntry t = teams.get(i);
            Map<String, Object> byeTeam = teamNode(t.getTeamName(), t, i + 1);
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
            match.put("teamA", teamNode(a.getTeamName(), a, byes + i + 1));
            match.put("teamB", teamNode(b.getTeamName(), b, n - i));
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
            match.put("bye", teamNode(leftover.getTeamName(), leftover, null));
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
        bracket.put("method", "SEEDED_REGISTRATION");
        bracket.put("teamCount", n);
        bracket.put("rounds", rounds);

        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu kết quả bốc thăm."));
        }
        tournamentRepository.save(tournament);
        notificationService.notify("ALL",
                "Đã bốc thăm giải " + tournament.getTitle(),
                "Nhánh đấu " + n + " đội đã được BTC bốc thăm. Mở tab Nhánh đấu để xem các cặp đấu!",
                "TOURNAMENT", "/?tab=tournaments");
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

    private static Integer parseScore(Object raw) {        if (raw == null) return null;
        try {
            int v = Integer.parseInt(String.valueOf(raw).trim());
            return v >= 0 ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Nhập kết quả một trận (BTC/ADMIN): lưu MatchResult, cập nhật nhánh đấu
     * (đẩy đội thắng vào vòng sau). Phong độ hai đội tự cập nhật từ lịch sử.
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
        if (scoreA.equals(scoreB) && !"ROUND_ROBIN".equals(tournament.getFormat())) {
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
        // Phong độ TRƯỚC trận: tính từ các kết quả đã lưu (trận này chưa lưu nên chưa tính vào).
        TeamFormService.FormRecord beforeA = teamFormService.formOf(nameA);
        TeamFormService.FormRecord beforeB = teamFormService.formOf(nameB);
        String winner = scoreA.equals(scoreB) ? null : (scoreA > scoreB ? nameA : nameB);

        // 0. Ghi nhận cầu thủ ghi bàn/kiến tạo (optional) + đối chiếu tổng bàn
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> scorers = body.get("scorers") instanceof List
                ? (List<Map<String, Object>>) body.get("scorers")
                : List.of();
        int sumA = 0;
        int sumB = 0;
        List<GoalEvent> goalEvents = new ArrayList<>();
        for (Map<String, Object> s : scorers) {
            String player = String.valueOf(s.getOrDefault("playerName", "")).trim();
            String team = String.valueOf(s.getOrDefault("teamName", "")).trim();
            if (player.isEmpty() || team.isEmpty()) continue;
            int g = parseScore(s.get("goals")) != null ? parseScore(s.get("goals")) : 0;
            int ast = parseScore(s.get("assists")) != null ? parseScore(s.get("assists")) : 0;
            if (g < 0 || ast < 0 || (g == 0 && ast == 0)) continue;
            if (!team.equals(nameA) && !team.equals(nameB)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cầu thủ " + player + " thuộc đội lạ (" + team + "), không có trong trận này."));
            }
            if (team.equals(nameA)) sumA += g;
            else sumB += g;
            goalEvents.add(GoalEvent.builder()
                    .tournamentId(tournament.getId())
                    .matchId(matchId)
                    .playerName(player)
                    .teamName(team)
                    .goals(g)
                    .assists(ast)
                    .build());
        }
        if (!goalEvents.isEmpty() && (sumA != scoreA || sumB != scoreB)) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Tổng bàn cầu thủ (" + nameA + " " + sumA + ", " + nameB + " " + sumB
                            + ") lệch tỷ số đội (" + scoreA + "-" + scoreB + "). Kiểm tra lại."));
        }

        // 1. Cập nhật trận trong nhánh
        target.put("scoreA", scoreA);
        target.put("scoreB", scoreB);
        target.put("winner", winner);
        target.put("status", "DONE");

        // 2. Đẩy đội thắng vào vòng sau (ô "Thắng {matchId}") — không áp dụng trận hòa
        String slot = "Thắng " + matchId;
        if (winner != null) {
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
                        TeamFormService.FormRecord wf = winner.equals(nameA) ? beforeA : beforeB;
                        node.put("form", wf.form());
                        node.put("record", wf.record());
                        node.put("winRate", wf.winRate());
                        node.remove("tbd");
                    }
                }
            }
        }
        }

        // Lưu lịch sử + nhánh đấu + cầu thủ ghi bàn. KHÔNG còn điểm Elo:
        // phong độ luôn được tính live từ các bản ghi này nên không cần cộng dồn.
        matchResultRepository.save(MatchResult.builder()
                .tournamentId(tournament.getId())
                .matchId(matchId)
                .roundName(roundName)
                .teamA(nameA)
                .teamB(nameB)
                .scoreA(scoreA)
                .scoreB(scoreB)
                .winner(winner)
                .build());
        if (!goalEvents.isEmpty()) {
            goalEventRepository.saveAll(goalEvents);
        }
        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu nhánh đấu."));
        }
        tournamentRepository.save(tournament);

        // Phong độ SAU trận (vừa lưu xong nên đã tính trận này vào)
        TeamFormService.FormRecord afterA = teamFormService.formOf(nameA);
        TeamFormService.FormRecord afterB = teamFormService.formOf(nameB);
        List<Map<String, Object>> formChanges = List.of(
                Map.of("team", (Object) nameA, "before", (Object) beforeA.toMap(), "after", (Object) afterA.toMap()),
                Map.of("team", (Object) nameB, "before", (Object) beforeB.toMap(), "after", (Object) afterB.toMap()));
        String resultTitle = winner != null
                ? "Kết quả " + matchId + ": " + winner + " thắng " + scoreA + "-" + scoreB
                : "Kết quả " + matchId + ": hòa " + scoreA + "-" + scoreB;
        notificationService.notify("ALL",
                resultTitle,
                nameA + " " + scoreA + "-" + scoreB + " " + nameB + " (" + tournament.getTitle() + "). Lịch sử thi đấu đã cập nhật!",
                "MATCH", "/?tab=tournaments");
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", "Đã lưu kết quả " + nameA + " " + scoreA + "-" + scoreB + " " + nameB + "!");
        resp.put("winner", winner);
        resp.put("formChanges", formChanges);
        resp.put("bracket", bracket);
        return ResponseEntity.ok(resp);
    }

    /**
     * Huỷ kết quả một trận đã đánh: xoá bản ghi kết quả và cầu thủ ghi bàn,
     * đưa trận về trạng thái SCHEDULED để BTC nhập lại. Phong độ tính live từ
     * các trận còn lại nên tự đúng, không cần hoàn điểm.
     * Chỉ cho phép khi các trận vòng sau chưa có kết quả (để không phá nhánh đấu).
     */
    @DeleteMapping("/{id}/matches/{matchId}")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> undoMatchResult(@PathVariable Long id, @PathVariable String matchId) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        if (tournament.getBracketJson() == null || tournament.getBracketJson().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải chưa bốc thăm nên chưa có kết quả nào."));
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
        int targetRoundIdx = -1;
        outer:
        for (int ri = 0; ri < rounds.size(); ri++) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) rounds.get(ri).get("matches");
            for (Map<String, Object> m : matches) {
                if (matchId.equals(m.get("matchId"))) {
                    target = m;
                    targetRoundIdx = ri;
                    break outer;
                }
            }
        }
        if (target == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy trận " + matchId + " trong nhánh đấu."));
        }
        if (!"DONE".equals(target.get("status"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trận này chưa có kết quả để huỷ."));
        }
        // Chặn huỷ khi vòng sau đã có kết quả — nhánh đấu đã đi tiếp thì không tháo ngược an toàn.
        for (int ri = targetRoundIdx + 1; ri < rounds.size(); ri++) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) rounds.get(ri).get("matches");
            for (Map<String, Object> m : matches) {
                if ("DONE".equals(m.get("status"))) {
                    return ResponseEntity.badRequest().body(Map.of("message",
                            "Không thể huỷ vì trận " + m.get("matchId")
                                    + " ở vòng sau đã có kết quả. Hãy huỷ từ vòng sau trở đi trước."));
                }
            }
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> teamA = (Map<String, Object>) target.get("teamA");
        @SuppressWarnings("unchecked")
        Map<String, Object> teamB = (Map<String, Object>) target.get("teamB");
        String nameA = teamA != null ? String.valueOf(teamA.get("name")) : "?";
        String nameB = teamB != null ? String.valueOf(teamB.get("name")) : "?";
        String oldScore = target.get("scoreA") + "-" + target.get("scoreB");

        // 1. Xoá bản ghi kết quả trận này (nếu có). Phong độ tính live nên tự đúng.
        matchResultRepository
                .findFirstByTournamentIdAndMatchIdOrderByPlayedAtDesc(tournament.getId(), matchId)
                .ifPresent(matchResultRepository::delete);

        // 2. Xoá cầu thủ ghi bàn của trận này.
        int goalsRemoved = goalEventRepository.findByTournamentIdAndMatchId(tournament.getId(), matchId).size();
        goalEventRepository.deleteAll(goalEventRepository.findByTournamentIdAndMatchId(tournament.getId(), matchId));

        // 3. Knockout: trả ô "Thắng {matchId}" ở vòng sau về trạng thái chờ.
        String slot = "Thắng " + matchId;
        for (Map<String, Object> round : rounds) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) round.get("matches");
            for (Map<String, Object> m : matches) {
                for (String side : List.of("teamA", "teamB")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> node = (Map<String, Object>) m.get(side);
                    if (node != null && slot.equals(node.get("name"))) {
                        node.put("name", slot);
                        node.put("tbd", true);
                        node.remove("elo");
                    }
                }
            }
        }

        // 4. Đưa trận về SCHEDULED, giữ nguyên lịch đã xếp (ngày/giờ/sân).
        target.remove("scoreA");
        target.remove("scoreB");
        target.remove("winner");
        target.put("status", "SCHEDULED");

        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu nhánh đấu."));
        }
        tournamentRepository.save(tournament);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", "Đã huỷ kết quả " + nameA + " " + oldScore
                + " " + nameB + ". Trận mở lại để nhập kết quả mới.");
        resp.put("matchId", matchId);
        resp.put("goalEventsRemoved", goalsRemoved);
        resp.put("bracket", bracket);
        return ResponseEntity.ok(resp);
    }

    /**
     * BXH Vua phá lưới của một giải (gộp bàn + kiến tạo theo cầu thủ).
     */
    @GetMapping("/{id}/scorers")
    public ResponseEntity<?> getScorers(@PathVariable Long id) {
        if (!tournamentRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        return ResponseEntity.ok(aggregateScorers(goalEventRepository.findByTournamentId(id)));
    }

    /**
     * Top Vua phá lưới toàn hệ thống (dùng cho widget trang chủ).
     */
    @GetMapping("/scorers/top")
    public ResponseEntity<?> topScorers(@RequestParam(defaultValue = "5") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<Map<String, Object>> all = aggregateScorers(goalEventRepository.findAll());
        return ResponseEntity.ok(all.subList(0, Math.min(safeLimit, all.size())));
    }

    private List<Map<String, Object>> aggregateScorers(List<GoalEvent> events) {
        Map<String, Map<String, Object>> byPlayer = new LinkedHashMap<>();
        for (GoalEvent e : events) {
            String key = e.getPlayerName() + "||" + e.getTeamName();
            Map<String, Object> row = byPlayer.computeIfAbsent(key, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("playerName", e.getPlayerName());
                m.put("teamName", e.getTeamName());
                m.put("goals", 0);
                m.put("assists", 0);
                return m;
            });
            row.put("goals", (Integer) row.get("goals") + (e.getGoals() != null ? e.getGoals() : 0));
            row.put("assists", (Integer) row.get("assists") + (e.getAssists() != null ? e.getAssists() : 0));
        }
        List<Map<String, Object>> list = new ArrayList<>(byPlayer.values());
        list.sort((a, b) -> {
            int c = Integer.compare((Integer) b.get("goals"), (Integer) a.get("goals"));
            if (c != 0) return c;
            return Integer.compare((Integer) b.get("assists"), (Integer) a.get("assists"));
        });
        int rank = 1;
        for (Map<String, Object> row : list) {
            row.put("rank", rank++);
        }
        return list;
    }

    /**
     * Xếp lịch thi đấu tự động cho nhánh đã bốc thăm: mỗi trận có ngày,
     * giờ và sân; các vòng cách nhau số ngày cấu hình. Body optional:
     * { startDate, matchesPerDay (mặc định 2), daysBetweenRounds (mặc định 2),
     *   startHour (mặc định 17), matchMinutes (mặc định 120) }.
     */
    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> generateSchedule(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        if (tournament.getBracketJson() == null || tournament.getBracketJson().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải chưa bốc thăm nên chưa thể xếp lịch."));
        }
        Map<String, Object> req = body != null ? body : Map.of();
        String startStr = String.valueOf(req.getOrDefault("startDate",
                tournament.getStartDate() != null ? tournament.getStartDate() : "")).trim();
        LocalDate day;
        try {
            day = LocalDate.parse(startStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Ngày bắt đầu không hợp lệ (cần yyyy-MM-dd)."));
        }
        int perDay = toPositiveInt(req.get("matchesPerDay"), 2);
        int gapDays = toNonNegativeInt(req.get("daysBetweenRounds"), 2);
        int startHour = toPositiveInt(req.get("startHour"), 17);
        int minutes = toPositiveInt(req.get("matchMinutes"), 120);
        String pitch = tournament.getPitchName() != null && !tournament.getPitchName().isBlank()
                ? tournament.getPitchName() : (tournament.getLocation() != null ? tournament.getLocation() : "Sân BTC");

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
        int scheduled = 0;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("HH:mm");
        for (Map<String, Object> round : rounds) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) round.get("matches");
            int slot = 0;
            for (Map<String, Object> m : matches) {
                if ("BYE".equals(m.get("status"))) continue;
                LocalDate d = day.plusDays(slot / perDay);
                LocalTime from = LocalTime.of(startHour % 24, 0).plusMinutes((long) (slot % perDay) * minutes);
                LocalTime to = from.plusMinutes(minutes);
                m.put("matchDate", d.toString());
                m.put("timeSlot", fmt.format(from) + " - " + fmt.format(to));
                m.put("pitchName", pitch);
                slot++;
                scheduled++;
            }
            day = day.plusDays((int) Math.ceil((double) Math.max(slot, 1) / perDay) + gapDays);
        }

        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu lịch thi đấu."));
        }
        tournamentRepository.save(tournament);
        notificationService.notify("ALL",
                "Đã có lịch thi đấu giải " + tournament.getTitle(),
                "BTC vừa xếp lịch cho " + scheduled + " trận. Mở tab Nhánh đấu để xem giờ và sân!",
                "MATCH", "/?tab=tournaments");
        return ResponseEntity.ok(Map.of(
                "message", "Đã xếp lịch cho " + scheduled + " trận đấu!",
                "scheduled", scheduled,
                "bracket", bracket));
    }

    private static int toPositiveInt(Object raw, int fallback) {        try {
            int v = Integer.parseInt(String.valueOf(raw));
            return v > 0 ? v : fallback;
        } catch (Exception e) {
            return fallback;
        }
    }

    private static int toNonNegativeInt(Object raw, int fallback) {
        try {
            int v = Integer.parseInt(String.valueOf(raw));
            return v >= 0 ? v : fallback;
        } catch (Exception e) {
            return fallback;
        }
    }

    /** Lấy nhánh đấu đã bốc thăm (public — FE render cây nhánh từ đây). */
    @GetMapping("/{id}/bracket")
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

        TournamentTeamEntry entry = TournamentTeamEntry.builder()
                .teamName(teamName)
                .captainName(captainName)
                .captainPhone(captainPhone)
                .subCaptainPhone(subCaptainPhone)
                .memberCount(memberCount)
                .registrationStatus("PENDING_PAYMENT")
                .registeredAt(LocalDateTime.now())
                .build();

        tournament.getTeams().add(entry);
        tournament.setRegisteredTeams(tournament.getTeams().size());
        tournamentRepository.save(tournament);

        notificationService.notify("ORGANIZER",
                "Đội mới đăng ký: " + teamName,
                teamName + " vừa nộp đơn vào giải “" + tournament.getTitle() + "”. Trạng thái: chờ xác nhận lệ phí.",
                "TOURNAMENT", "/?tab=tournaments");
        notificationService.notify("ADMIN",
                "Đội mới đăng ký: " + teamName,
                teamName + " vừa nộp đơn vào giải “" + tournament.getTitle() + "”. Trạng thái: chờ xác nhận lệ phí.",
                "TOURNAMENT", "/admin");

        return ResponseEntity.ok(Map.of(
                "message", "Nộp đơn thành công! Vui lòng thanh toán lệ phí và chờ BTC xác nhận.",
                "tournamentId", tournament.getId(),
                "registeredTeams", tournament.getRegisteredTeams(),
                "paymentStatus", "PENDING_PAYMENT",
                "team", entry
        ));
    }

    /**
     * BTC xác nhận đã thu lệ phí của một đội → CONFIRMED (mới được bốc thăm).
     */
    @PostMapping("/{id}/teams/confirm-payment")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<?> confirmTeamPayment(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        String teamName = String.valueOf(body.getOrDefault("teamName", "")).trim();
        if (teamName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu tên đội."));
        }
        TournamentTeamEntry found = null;
        for (TournamentTeamEntry t : tournament.getTeams()) {
            if (teamName.equalsIgnoreCase(t.getTeamName())) {
                found = t;
                break;
            }
        }
        if (found == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy đội " + teamName + " trong giải."));
        }
        found.setRegistrationStatus("CONFIRMED");
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã xác nhận lệ phí của " + found.getTeamName() + ".",
                "team", found.getTeamName()));
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
