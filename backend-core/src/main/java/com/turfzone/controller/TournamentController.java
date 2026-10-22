package com.turfzone.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.turfzone.model.GoalEvent;
import com.turfzone.model.MatchResult;
import com.turfzone.model.Tournament;
import com.turfzone.model.TournamentReferee;
import com.turfzone.model.TournamentTeamEntry;
import com.turfzone.repository.GoalEventRepository;
import com.turfzone.repository.MatchResultRepository;
import com.turfzone.repository.TournamentRefereeRepository;
import com.turfzone.repository.TournamentRepository;
import com.turfzone.service.TeamFormService;
import com.turfzone.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.turfzone.model.User;
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
    private final TournamentRefereeRepository refereeRepository;
    private final TeamFormService teamFormService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    /**
     * Che thong tin ca nhan khi tra giai cho nguoi xem khong phai BTC.
     *
     * <p>GET /tournaments va GET /tournaments/{id} la endpoint CONG KHAI (permitAll) nhung
     * truoc day tra nguyen entity → lộ danh sách email được mời và email/SĐT của từng đội
     * trưởng. Nay:
     * - người có quyền (ORGANIZER/OWNER/ADMIN) thấy đầy đủ;
     * - người khác chỉ thấy email mời CỦA CHÍNH MÌNH (để giao diện biết mình có được
     *   mời hay không) và liên hệ đội trưởng đã che.</p>
     */
    private Map<String, Object> sanitizeTournament(Tournament t, com.turfzone.model.User me) {
        Map<String, Object> map = objectMapper.convertValue(t,
                new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() { });
        boolean privileged = me != null && me.getRole() != null
                && ("ADMIN".equals(me.getRole().name())
                || "ORGANIZER".equals(me.getRole().name())
                || "OWNER".equals(me.getRole().name()));
        if (privileged) return map;

        String myEmail = (me != null && me.getEmail() != null) ? me.getEmail().trim().toLowerCase() : "";
        List<String> mine = new ArrayList<>();
        if (t.getInvitedEmails() != null) {
            for (String e : t.getInvitedEmails()) {
                if (e != null && e.trim().toLowerCase().equals(myEmail)) mine.add(e);
            }
        }
        map.put("invitedEmails", mine);

        Object teamsObj = map.get("teams");
        if (teamsObj instanceof List) {
            String myPhone = (me != null && me.getPhone() != null) ? me.getPhone().trim() : "";
            for (Object o : (List<?>) teamsObj) {
                if (o instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> tm = (Map<String, Object>) o;
                    // Đội trưởng phải thấy SĐT/email CỦA CHÍNH MÌNH (để "Đội của tôi"
                    // nhận ra đội mình làm trưởng) — người khác vẫn được che.
                    boolean isMine = (!myPhone.isEmpty()
                            && myPhone.equalsIgnoreCase(String.valueOf(tm.get("captainPhone"))))
                            || (!myEmail.isEmpty()
                            && myEmail.equalsIgnoreCase(String.valueOf(tm.get("captainEmail"))));
                    if (!isMine) {
                        tm.put("captainEmail", maskEmail(tm.get("captainEmail")));
                        tm.put("captainPhone", maskPhone(tm.get("captainPhone")));
                        tm.put("subCaptainPhone", maskPhone(tm.get("subCaptainPhone")));
                    }
                }
            }
        }
        return map;
    }

    /** Che email: a***@d***.vn */
    private static String maskEmail(Object raw) {
        if (raw == null) return null;
        String s = String.valueOf(raw).trim();
        int at = s.indexOf('@');
        if (at <= 0 || at == s.length() - 1) return "***";
        String name = s.substring(0, at);
        String domain = s.substring(at + 1);
        int dot = domain.indexOf('.');
        String dHead = dot > 0 ? domain.substring(0, dot) : domain;
        String dTail = dot > 0 ? domain.substring(dot) : "";
        String maskedName = name.isEmpty() ? "***" : name.charAt(0) + "***";
        String maskedDomain = dHead.isEmpty() ? "***" : dHead.charAt(0) + "***";
        return maskedName + "@" + maskedDomain + dTail;
    }

    /** Che SĐT: 0912345678 -> 0912****678 */
    private static String maskPhone(Object raw) {
        if (raw == null) return null;
        String s = String.valueOf(raw).trim();
        if (s.length() <= 7) return "*******";
        return s.substring(0, 4) + "****" + s.substring(s.length() - 3);
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTournaments(@AuthenticationPrincipal com.turfzone.model.User me) {
        List<Tournament> tournaments = tournamentRepository.findAll();
        attachForms(tournaments); // 1 lần truy vấn phong độ cho toàn bộ đội, không N+1
        List<Map<String, Object>> out = new ArrayList<>();
        for (Tournament t : tournaments) {
            out.add(sanitizeTournament(t, me));
        }
        return ResponseEntity.ok(out);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
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
        // Quyền tham gia: chỉ nhận PUBLIC / INVITE_ONLY, mặc định PUBLIC.
        String joinMode = tournament.getJoinMode() != null
                ? tournament.getJoinMode().trim().toUpperCase()
                : "PUBLIC";
        if (!Set.of("PUBLIC", "INVITE_ONLY").contains(joinMode)) {
            joinMode = "PUBLIC";
        }
        tournament.setJoinMode(joinMode);
        if (tournament.getInvitedEmails() == null) {
            tournament.setInvitedEmails(new ArrayList<>());
        }
        Tournament saved = tournamentRepository.save(tournament);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTournamentById(@PathVariable Long id, @AuthenticationPrincipal com.turfzone.model.User me) {
        return tournamentRepository.findById(id)
                .map(t -> {
                    attachForm(t);
                    return ResponseEntity.ok(sanitizeTournament(t, me));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Ban tổ chức sửa giải sau khi đã đăng.
     *
     * <p>Trước đây chỉ có POST (tạo) và DELETE (xóa) — BTC tạo giải xong không đổi được
     * tên, thể thức, thưởng, lệ phí, hạn đăng ký hay sân thi đấu. Chỉ nhận các field có mặt
     * trong body (null = giữ nguyên), và cố tình KHÔNG cho sửa các field do hệ thống quản lý:
     * registeredTeams, teams, bracketJson, status, createdAt.</p>
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> updateTournament(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }

        String title = str(body.get("title"));
        if (title != null) {
            if (title.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Tên giải không được để trống."));
            t.setTitle(title);
        }

        if (body.containsKey("description")) t.setDescription(str(body.get("description")));

        String sportType = str(body.get("sportType"));
        if (sportType != null && !sportType.isEmpty()) {
            if (!Set.of("SAN_7", "SAN_5", "SAN_11", "FUTSAL").contains(sportType)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thể thức không hợp lệ: " + sportType));
            }
            // Đã có đội đăng ký thì không đổi môn (bracket + bảng xếp hạng sẽ lệch)
            if (t.getTeams() != null && !t.getTeams().isEmpty()
                    && t.getSportType() != null && !t.getSportType().equals(sportType)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Giải đã có đội đăng ký nên không thể đổi thể thức thi đấu."));
            }
            t.setSportType(sportType);
        }

        String format = str(body.get("format"));
        if (format != null && !format.isEmpty()) {
            if (!Set.of("KNOCKOUT", "ROUND_ROBIN").contains(format)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thể thức giải không hợp lệ: " + format));
            }
            t.setFormat(format);
        }

        if (body.containsKey("pitchName")) t.setPitchName(str(body.get("pitchName")));
        if (body.containsKey("location")) t.setLocation(str(body.get("location")));
        if (body.containsKey("startDate")) t.setStartDate(str(body.get("startDate")));
        if (body.containsKey("endDate")) t.setEndDate(str(body.get("endDate")));
        if (body.containsKey("registrationDeadline")) t.setRegistrationDeadline(str(body.get("registrationDeadline")));
        if (body.containsKey("bannerUrl")) t.setBannerUrl(str(body.get("bannerUrl")));
        if (body.containsKey("bankCode")) t.setBankCode(str(body.get("bankCode")));
        if (body.containsKey("bankAccount")) t.setBankAccount(str(body.get("bankAccount")));
        if (body.containsKey("accountName")) t.setAccountName(str(body.get("accountName")));

        Long totalTeams = longOf(body.get("totalTeams"));
        if (totalTeams != null) {
            int current = t.getRegisteredTeams() != null ? t.getRegisteredTeams()
                    : (t.getTeams() != null ? t.getTeams().size() : 0);
            if (totalTeams < 2) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số đội tối thiểu là 2."));
            }
            if (totalTeams < current) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Đã có " + current + " đội đăng ký, không thể giảm quy mô giải xuống " + totalTeams + " đội."));
            }
            t.setTotalTeams(totalTeams.intValue());
        }

        Long prizePool = longOf(body.get("prizePool"));
        if (prizePool != null) {
            if (prizePool < 0) return ResponseEntity.badRequest().body(Map.of("message", "Tiền thưởng không thể âm."));
            t.setPrizePool(prizePool);
        }

        Long entryFee = longOf(body.get("entryFee"));
        if (entryFee != null) {
            if (entryFee < 0) return ResponseEntity.badRequest().body(Map.of("message", "Lệ phí không thể âm."));
            t.setEntryFee(entryFee);
        }

        Tournament saved = tournamentRepository.save(t);
        attachForm(saved);
        return ResponseEntity.ok(saved);
    }

    /**
     * Thống kê tài chính giải cho Ban tổ chức: tổng lệ phí dự kiến, đã thu (đội đã chuyển khoản),
     * đang chờ, giải thưởng còn phải chi và tỉ lệ lấp đầy.
     */
    @GetMapping("/{id}/finance")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> tournamentFinance(@PathVariable Long id) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }

        long fee = t.getEntryFee() != null ? t.getEntryFee() : 0L;
        List<TournamentTeamEntry> teams = t.getTeams() != null ? t.getTeams() : List.of();

        int confirmed = 0, pending = 0, simulated = 0;
        for (TournamentTeamEntry e : teams) {
            String st = e.getRegistrationStatus();
            if ("CONFIRMED".equals(st)) confirmed++;
            else if ("PENDING_PAYMENT".equals(st)) pending++;
            else if ("SIMULATED".equals(st)) simulated++;
        }
        // Đội do hệ thống sinh ra (nút "Giả lập đội") không phải tiền thật nên không tính vào doanh thu.
        long collected = (long) confirmed * fee;
        long awaiting = (long) pending * fee;
        long prizePool = t.getPrizePool() != null ? t.getPrizePool() : 0L;

        int capacity = t.getTotalTeams() != null ? t.getTotalTeams() : 0;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("tournamentId", t.getId());
        out.put("tournamentTitle", t.getTitle());
        out.put("status", t.getStatus());
        out.put("entryFee", fee);
        out.put("prizePool", prizePool);
        out.put("totalTeams", teams.size());
        out.put("capacity", capacity);
        out.put("confirmedTeams", confirmed);
        out.put("pendingTeams", pending);
        out.put("simulatedTeams", simulated);
        out.put("totalCollected", collected);
        out.put("totalAwaiting", awaiting);
        // Tiền thưởng chỉ bỏ ra sau khi giải kết thúc và có người thắng, nên hiển thị
        // "còn phải chi" cho tới lúc đó.
        out.put("prizeToPay", "COMPLETED".equals(t.getStatus()) ? prizePool : 0L);
        out.put("netAfterPrize", "COMPLETED".equals(t.getStatus()) ? collected - prizePool : collected);
        out.put("fillPercent", capacity > 0 ? Math.min(100, Math.round((teams.size() * 100.0) / capacity)) : 0);
        return ResponseEntity.ok(out);
    }

    /** Đọc chuỗi cắt khoảng trắng, null nếu thiếu. */
    private String str(Object v) {
        if (v == null) return null;
        return String.valueOf(v).trim();
    }

    /** Đọc số nguyên an toàn (form gửi string cũng parse được). */
    private Long longOf(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try {
            return Long.valueOf(String.valueOf(v).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Gắn phong độ live (tính từ match_results) vào từng đội — field @Transient,
     * không lưu DB. Frontend hiển thị chuỗi 5 trận + thành tích.
     */
    private void attachForm(Tournament t) {
        if (t.getTeams() == null) return;
        enrichEntries(t.getTeams());
    }

    /**
     * Gắn phong độ cho DANH SÁCH nhiều giải cùng lúc — 1 lần truy vấn cho tất cả đội.
     *
     * <p>Trước đây {@code getTournaments()} gọi {@code attachForm()} cho từng giải, mà mỗi
     * đội lại 1 query → ~224 query DB cho 14 giải × 16 đội. Bản này gom tên đội của tất cả
     * giải rồi query 1 lần, nên thao tác tạo giải / thêm đội không còn phải chờ lâu.</p>
     */
    private void attachForms(List<Tournament> tournaments) {
        List<String> allNames = new ArrayList<>();
        for (Tournament t : tournaments) {
            if (t.getTeams() == null) continue;
            for (TournamentTeamEntry e : t.getTeams()) {
                if (e.getTeamName() != null) allNames.add(e.getTeamName());
            }
        }
        Map<String, TeamFormService.FormRecord> forms = teamFormService.formsOf(allNames);
        for (Tournament t : tournaments) {
            if (t.getTeams() == null) continue;
            applyForms(t.getTeams(), forms);
        }
    }

    /** Tính phong độ live cho danh sách đội (dùng khi bốc thăm + response) — 1 lần truy vấn. */
    private void enrichEntries(List<TournamentTeamEntry> entries) {
        if (entries == null || entries.isEmpty()) return;
        List<String> names = new ArrayList<>();
        for (TournamentTeamEntry e : entries) {
            if (e.getTeamName() != null) names.add(e.getTeamName());
        }
        applyForms(entries, teamFormService.formsOf(names));
    }

    /** Gán phong độ đã tính sẵn vào từng đội (không query thêm). */
    private void applyForms(List<TournamentTeamEntry> entries,
                            Map<String, TeamFormService.FormRecord> forms) {
        for (TournamentTeamEntry e : entries) {
            // Tra cua theo key lowercase (giong phia ghi trong TeamFormService).
            String formKey = e.getTeamName() == null ? "" : e.getTeamName().trim().toLowerCase();
            TeamFormService.FormRecord f = forms.get(formKey);
            if (f == null) f = TeamFormService.FormRecord.empty();
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
        "FC Điện Bàn", "FC Đà Nẵng", "FC Tam Kỳ", "FC An Hương",
        "FC Mỹ Khê", "FC Đồng Sơn", "FC Bình Thạnh ĐN", "FC Thanh Khê",
        "FC Hải Châu", "FC Quận Hai", "FC Tân Bình ĐN", "FC Bình Tân ĐN",
        "FC Ngũ Hành Sơn", "FC Cẩm Lệ", "FC Sơn Trà", "FC Hòa Cưng",
        "FC Thanh Hưng", "FC Dương Kinh", "FC Nam Sơn Trà", "FC Hòa Vang");

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
     * Sinh đội hình gồm đúng quân số theo thể thức sân, bốc hoàn toàn ngẫu nhiên
     * (cho phép trùng tên — đúng bản chất random).
     * Đội trưởng = thành viên đầu tiên.
     */
    private static List<String> generateRoster(String sportType, ThreadLocalRandom rnd) {
        int size;
        if (sportType != null && (sportType.contains("11"))) size = 16 + rnd.nextInt(5);
        else if (sportType != null && (sportType.contains("FUTSAL") || sportType.contains("5"))) size = 8 + rnd.nextInt(3);
        else size = 12 + rnd.nextInt(3);
        List<String> roster = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            roster.add(SIM_FAMILY.get(rnd.nextInt(SIM_FAMILY.size())) + " "
                    + SIM_MIDDLE.get(rnd.nextInt(SIM_MIDDLE.size())) + " "
                    + SIM_GIVEN.get(rnd.nextInt(SIM_GIVEN.size())));
        }
        return roster;
    }

    /**
     * Nút "Giả lập đủ đội (Test)": sinh đội ảo cho đủ sức chứa (8/12/16 đội
     * tùy cấu hình giải) để demo bốc thăm khi số đội đăng ký thật chưa đủ.
     * Mỗi đội có đủ quân số + danh sách thành viên, lưu thật vào CSDL.
     * Body tuỳ chọn {"count": n} để chỉ thêm đúng n đội thay vì lấp đầy.
     */
    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/{id}/fill-teams")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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
                name = "FC Sân Phủi " + String.format("%02d", autoIdx++);
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
                "message", "Đã giả lập thêm " + added + " đội ngẫu nhiên (giải có " + teams.size() + "/" + cap + " đội). "
                        + "Các đội bạn đã nhập thủ công được giữ nguyên.",
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
    @org.springframework.transaction.annotation.Transactional
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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

    private static Integer parseInt(Object raw) {
        if (raw == null) return 0;
        try { return Math.max(0, Integer.parseInt(String.valueOf(raw).trim())); }
        catch (NumberFormatException e) { return 0; }
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
    @org.springframework.transaction.annotation.Transactional
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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

        // Thống kê chi tiết trận (thẻ, thay người, MVP) — không bắt buộc
        int yca = parseInt(body.get("yellowCardsA"));
        int ycb = parseInt(body.get("yellowCardsB"));
        int rca = parseInt(body.get("redCardsA"));
        int rcb = parseInt(body.get("redCardsB"));
        int suba = parseInt(body.get("substitutionsA"));
        int subb = parseInt(body.get("substitutionsB"));
        String mvp = body.get("mvpPlayer") == null ? null : String.valueOf(body.get("mvpPlayer")).trim();
        if (mvp != null && mvp.isEmpty()) mvp = null;
        String notes = body.get("notes") == null ? null : String.valueOf(body.get("notes")).trim();
        if (notes != null && notes.isEmpty()) notes = null;
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
                        // Danh dau o nay den tu tran nao -> undo tim lai duoc o (truoc day
                        // undo tim theo ten "Thang {matchId}" nhung ten da bi ghi de
                        // bang ten doi thang -> o vong sau giu nguyen doi cu, bang chinh sai).
                        node.put("fromMatchId", matchId);
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

        // Lưu lịch sử + nhánh đấu + cầu thủ ghi bàn. Hệ thống không dùng điểm Elo:
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
                .yellowCardsA(yca)
                .yellowCardsB(ycb)
                .redCardsA(rca)
                .redCardsB(rcb)
                .substitutionsA(suba)
                .substitutionsB(subb)
                .mvpPlayer(mvp)
                .notes(notes)
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
     * Huỷ kết quả một trận đã đánh: xóa bản ghi kết quả và cầu thủ ghi bàn,
     * đưa trận về trạng thái SCHEDULED để BTC nhập lại. Phong độ tính live từ
     * các trận còn lại nên tự đúng, không cần hoàn điểm.
     * Chỉ cho phép khi các trận vòng sau chưa có kết quả (để không phá nhánh đấu).
     */
    @DeleteMapping("/{id}/matches/{matchId}")
    @org.springframework.transaction.annotation.Transactional
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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

        // 1. Xóa bản ghi kết quả trận này (nếu có). Phong độ tính live nên tự đúng.
        matchResultRepository
                .findFirstByTournamentIdAndMatchIdOrderByPlayedAtDesc(tournament.getId(), matchId)
                .ifPresent(matchResultRepository::delete);

        // 2. Xóa cầu thủ ghi bàn của trận này.
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
                    // Tim o theo danh dau fromMatchId (fallback ve ten "Thang ...").
                    if (node != null && (matchId.equals(node.get("fromMatchId"))
                            || slot.equals(node.get("name")))) {
                        node.put("name", slot);
                        node.put("tbd", true);
                        node.remove("fromMatchId");
                        node.remove("form");
                        node.remove("record");
                        node.remove("winRate");
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
     * Nút "Giả lập kết quả (Test)": tự random tỷ số cho mọi trận đang SCHEDULED
     * (đi đúng thứ tự vòng để đội thắng đi tiếp), ghi MatchResult + cầu thủ ghi
     * bàn ngẫu nhiên từ đội hình thật, lưu nhánh đấu. Demo BXH, phong độ, vua phá
     * lưới mà không cần nhập tay. Trận đã DONE giữ nguyên. Vô địch → giải COMPLETED.
     */
    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/{id}/simulate-results")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
    public ResponseEntity<?> simulateResults(@PathVariable Long id) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        if (tournament.getBracketJson() == null || tournament.getBracketJson().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải chưa bốc thăm nên chưa có trận nào để giả lập."));
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
        if (rounds == null || rounds.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nhánh đấu chưa có vòng nào."));
        }
        boolean isLeague = "ROUND_ROBIN".equals(tournament.getFormat());

        // Đội hình thật (nếu đội chưa khai) để ghi bàn ngẫu nhiên cho vua phá lưới
        Map<String, List<String>> rosters = new HashMap<>();
        if (tournament.getTeams() != null) {
            for (TournamentTeamEntry t : tournament.getTeams()) {
                if (t.getTeamName() == null) continue;
                List<String> members = new ArrayList<>();
                if (t.getMemberNames() != null) {
                    for (String m : t.getMemberNames().split(",")) {
                        String n = m.trim();
                        if (!n.isEmpty()) members.add(n);
                    }
                }
                rosters.put(t.getTeamName(), members);
            }
        }

        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        int simulated = 0;
        List<GoalEvent> goalEvents = new ArrayList<>();
        for (Map<String, Object> round : rounds) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> matches = (List<Map<String, Object>>) round.get("matches");
            if (matches == null) continue;
            for (Map<String, Object> m : matches) {
                // Trận chờ (TBD) nhưng đã đủ 2 đội (do vòng trước điền vào) vẫn đá được
                if (!"SCHEDULED".equals(m.get("status")) && !"TBD".equals(m.get("status"))) continue;
                @SuppressWarnings("unchecked")
                Map<String, Object> teamA = (Map<String, Object>) m.get("teamA");
                @SuppressWarnings("unchecked")
                Map<String, Object> teamB = (Map<String, Object>) m.get("teamB");
                if (teamA == null || teamB == null
                        || Boolean.TRUE.equals(teamA.get("tbd")) || Boolean.TRUE.equals(teamB.get("tbd"))) {
                    continue;
                }
                String nameA = String.valueOf(teamA.get("name"));
                String nameB = String.valueOf(teamB.get("name"));
                int scoreA = rnd.nextInt(5);
                int scoreB = rnd.nextInt(5);
                if (!isLeague) {
                    int guard = 0;
                    while (scoreA == scoreB && guard++ < 10) {
                        scoreA = rnd.nextInt(5);
                        scoreB = rnd.nextInt(5);
                    }
                    if (scoreA == scoreB) scoreA++;
                }
                String winner = scoreA > scoreB ? nameA : (scoreB > scoreA ? nameB : null);
                String matchId = String.valueOf(m.get("matchId"));

                m.put("scoreA", scoreA);
                m.put("scoreB", scoreB);
                m.put("winner", winner);
                m.put("status", "DONE");

                // Đẩy đội thắng vào vòng sau (khớp logic nhập tay)
                if (winner != null) {
                    String slot = "Thắng " + matchId;
                    for (Map<String, Object> r2 : rounds) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> ms2 = (List<Map<String, Object>>) r2.get("matches");
                        if (ms2 == null) continue;
                        for (Map<String, Object> mm : ms2) {
                            for (String side : List.of("teamA", "teamB")) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> node = (Map<String, Object>) mm.get(side);
                                if (node != null && Boolean.TRUE.equals(node.get("tbd"))
                                        && slot.equals(node.get("name"))) {
                                    node.put("name", winner);
                                    TeamFormService.FormRecord wf = teamFormService.formOf(winner);
                                    node.put("form", wf.form());
                                    node.put("record", wf.record());
                                    node.put("winRate", wf.winRate());
                                    node.remove("tbd");
                                }
                            }
                        }
                    }
                }

                matchResultRepository.save(MatchResult.builder()
                        .tournamentId(tournament.getId())
                        .matchId(matchId)
                        .roundName(String.valueOf(round.getOrDefault("name", "")))
                        .teamA(nameA)
                        .teamB(nameB)
                        .scoreA(scoreA)
                        .scoreB(scoreB)
                        .winner(winner)
                        .build());

                // Ghi bàn ngẫu nhiên từ đội hình để demo vua phá lưới
                Map<String, Integer> scorersA = randomScorers(nameA, rosters.getOrDefault(nameA, List.of()), scoreA, rnd);
                Map<String, Integer> scorersB = randomScorers(nameB, rosters.getOrDefault(nameB, List.of()), scoreB, rnd);
                for (Map.Entry<String, Integer> e : scorersA.entrySet()) {
                    goalEvents.add(GoalEvent.builder()
                            .tournamentId(tournament.getId()).matchId(matchId)
                            .teamName(nameA).playerName(e.getKey())
                            .goals(e.getValue()).assists(0).build());
                }
                for (Map.Entry<String, Integer> e : scorersB.entrySet()) {
                    goalEvents.add(GoalEvent.builder()
                            .tournamentId(tournament.getId()).matchId(matchId)
                            .teamName(nameB).playerName(e.getKey())
                            .goals(e.getValue()).assists(0).build());
                }
                simulated++;
            }
        }
        if (!goalEvents.isEmpty()) {
            goalEventRepository.saveAll(goalEvents);
        }
        try {
            tournament.setBracketJson(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi lưu nhánh đấu."));
        }

        // Vô địch: trận duy nhất vòng cuối đã xong và có đội thắng
        String champion = null;
        Map<String, Object> lastRound = rounds.get(rounds.size() - 1);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lastMatches = (List<Map<String, Object>>) lastRound.get("matches");
        if (lastMatches != null && lastMatches.size() == 1) {
            Map<String, Object> finalMatch = lastMatches.get(0);
            if ("DONE".equals(finalMatch.get("status")) && finalMatch.get("winner") != null) {
                champion = String.valueOf(finalMatch.get("winner"));
                tournament.setStatus("COMPLETED");
            }
        }
        tournamentRepository.save(tournament);

        if (simulated == 0) {
            return ResponseEntity.ok(Map.of(
                    "message", "Không còn trận nào chờ đá (các trận đã DONE hoặc chưa xếp đội).",
                    "simulated", 0,
                    "bracket", bracket));
        }
        String msg = "Đã giả lập " + simulated + " trận."
                + (champion != null ? " Vô địch: " + champion + "!" : "");
        return ResponseEntity.ok(Map.of(
                "message", msg,
                "simulated", simulated,
                "champion", champion != null ? champion : "",
                "bracket", bracket));
    }

    /** Chia ngẫu nhiên số bàn cho các thành viên (không đội hình thì dùng số áo). */
    private static Map<String, Integer> randomScorers(
            String teamName, List<String> roster, int goals, ThreadLocalRandom rnd) {
        Map<String, Integer> out = new LinkedHashMap<>();
        int[] shirts = {7, 9, 10, 11, 8, 19, 20, 4};
        for (int i = 0; i < goals; i++) {
            String scorer = roster.isEmpty()
                    ? teamName + " số " + shirts[rnd.nextInt(shirts.length)]
                    : roster.get(rnd.nextInt(roster.size()));
            out.put(scorer, out.getOrDefault(scorer, 0) + 1);
        }
        return out;
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
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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

    /**
     * Đội đăng ký giải. Bắt buộc đăng nhập và tự lấy danh tính đội trưởng từ token,
     * không tin tên/SĐT do client gửi lên - tránh việc khách vãng lai đăng ký hộ
     * và đẩy dữ liệu rác vào giải.
     */
    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/{id}/register")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> registerTeam(@PathVariable Long id,
                                          @RequestBody Map<String, Object> req,
                                          @AuthenticationPrincipal User me) {
        if (me == null || me.getEmail() == null || me.getEmail().isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "Vui lòng đăng nhập để đăng ký đội."));
        }
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu không tồn tại"));
        }

        // Sức chứa tính theo DANH SÁCH đội (trường registeredTeams có thể lệch với list do seed).
        int totalTeams = tournament.getTotalTeams() != null ? tournament.getTotalTeams() : 0;
        if (totalTeams > 0 && countConfirmedTeams(tournament) >= totalTeams) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu đã đủ số lượng đội đăng ký"));
        }

        // Chỉ giải đang mở đăng ký mới nhận đội — trước đây đăng ký vào giải đã
        // COMPLETED vẫn được (đội 'ma' lọt vào giải đã bốc thăm/nhập kết quả).
        String st = tournament.getStatus() == null ? "OPEN" : tournament.getStatus().toUpperCase();
        if (!"OPEN".equals(st)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Giải đấu không còn mở đăng ký."));
        }

        // Hạn đăng ký có lưu trong CSDL nhưng trước đây KHÔNG nơi nào đọc tới.
        String deadline = tournament.getRegistrationDeadline();
        if (deadline != null && !deadline.isBlank()) {
            try {
                if (LocalDate.parse(deadline.trim()).isBefore(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Đã qua hạn đăng ký của giải đấu."));
                }
            } catch (Exception ignored) {
                // Ngày không đọc được thì bỏ qua kiểm tra hạn.
            }
        }

        // Giải kín (chỉ mời qua email): tài khoản đăng nhập phải nằm trong danh sách mời.
        if ("INVITE_ONLY".equalsIgnoreCase(tournament.getJoinMode())) {
            String myEmailLower = me.getEmail().trim().toLowerCase();
            boolean invited = false;
            for (String invitedEmail : tournament.getInvitedEmails()) {
                if (invitedEmail != null && invitedEmail.trim().toLowerCase().equals(myEmailLower)) {
                    invited = true;
                    break;
                }
            }
            if (!invited) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Giải đấu này chỉ mời tham gia qua email. Bạn cần được BTC mời trước khi đăng ký đội."));
            }
        }

        String teamName = req.get("teamName") != null ? req.get("teamName").toString().trim() : "";
        if (teamName.length() < 3 || teamName.length() > 60) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên đội phải từ 3 đến 60 ký tự."));
        }

        // Chặn trùng tên đội trong cùng giải
        for (TournamentTeamEntry existing : tournament.getTeams()) {
            if (existing.getTeamName() != null
                    && existing.getTeamName().trim().equalsIgnoreCase(teamName)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tên đội đã tồn tại trong giải này."));
            }
        }

        // Chặn một tài khoản đăng ký nhiều đội trong cùng giải
        String captainPhone = me.getPhone() != null ? me.getPhone().trim() : "";
        String myEmail = me.getEmail().toLowerCase();
        for (TournamentTeamEntry existing : tournament.getTeams()) {
            boolean sameCaptain = existing.getCaptainEmail() != null
                    && existing.getCaptainEmail().toLowerCase().equals(myEmail);
            boolean samePhone = !captainPhone.isEmpty()
                    && captainPhone.equalsIgnoreCase(existing.getCaptainPhone());
            if (sameCaptain || samePhone) {
                return ResponseEntity.badRequest().body(Map.of("error", "Bạn đã đăng ký đội trong giải này rồi."));
            }
        }

        // Danh tính đội trưởng lấy từ tài khoản đang đăng nhập
        String captainName = me.getFullName() != null && !me.getFullName().isBlank()
                ? me.getFullName().trim()
                : myEmail;
        if (captainPhone.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Vui lòng cập nhật số điện thoại trong hồ sơ trước khi đăng ký."));
        }
        String subCaptainPhone = req.get("subCaptainPhone") != null
                ? req.get("subCaptainPhone").toString().trim() : "";
        int memberCount = 12;
        if (req.get("memberCount") != null) {
            try {
                memberCount = Integer.parseInt(req.get("memberCount").toString());
            } catch (NumberFormatException ignored) {
                memberCount = 12;
            }
        }
        memberCount = Math.max(1, Math.min(30, memberCount));
        TournamentTeamEntry entry = TournamentTeamEntry.builder()
                .teamName(teamName)
                .captainName(captainName)
                .captainEmail(myEmail)
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

    /** Đọc cấu hình quyền tham gia + danh sách email mời của 1 giải. */
    /**
     * So doi da XAC NHAN (CONFIRMED/SIMULATED) cua mot giai.
     * <p>Trước đây nơi này dùng teams.size() (đếm cả đội PENDING_PAYMENT) trong khi
     * confirm/approve lại đếm đội đã xác nhận → giao diện hiện "0% đầy" nhưng API lại báo
     * "đã đủ số đội", và BTC vẫn duyệt thêm được đội vượt chỉ tiêu.</p>
     */
    private int countConfirmedTeams(Tournament tournament) {
        if (tournament == null || tournament.getTeams() == null) return 0;
        return (int) tournament.getTeams().stream()
                .filter(t -> t.getRegistrationStatus() != null
                        && ("CONFIRMED".equals(t.getRegistrationStatus()) || "SIMULATED".equals(t.getRegistrationStatus())))
                .count();
    }

    @GetMapping("/{id}/access")
    public ResponseEntity<?> getJoinAccess(@PathVariable Long id, @AuthenticationPrincipal com.turfzone.model.User me) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        boolean isAdmin = me != null && me.getRole() != null && "ADMIN".equals(me.getRole().name());
        boolean isOrganizer = me != null && me.getRole() != null
                && ("ORGANIZER".equals(me.getRole().name()) || "OWNER".equals(me.getRole().name()));
        // Danh sach email moi la PII — chi BTC/Admin/ Chu san moi duoc xem.
        // Nguoi la danh thuong chi thay che do mo (de man hinh dang ky khong loi).
        List<String> invited = (isAdmin || isOrganizer) && tournament.getInvitedEmails() != null
                ? tournament.getInvitedEmails() : List.of();
        return ResponseEntity.ok(Map.of(
                "joinMode", tournament.getJoinMode() != null ? tournament.getJoinMode() : "PUBLIC",
                "invitedEmails", invited));
    }

    /**
     * BTC / chủ sân ĐẶT QUYỀN THAM GIA cho giải + danh sách email được mời.
     *
     * <p>Body: {@code {"joinMode": "PUBLIC"|"INVITE_ONLY", "invitedEmails": ["a@b.vn", ...]}}
     * — truyền {@code invitedEmails} sẽ GHI ĐÈ toàn bộ danh sách mời hiện có.</p>
     */
    @PutMapping("/{id}/access")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
    public ResponseEntity<?> setJoinAccess(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        String mode = String.valueOf(body.getOrDefault("joinMode", "PUBLIC")).trim().toUpperCase();
        if (!Set.of("PUBLIC", "INVITE_ONLY").contains(mode)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Quyền tham gia không hợp lệ (PUBLIC hoặc INVITE_ONLY)."));
        }
        tournament.setJoinMode(mode);
        if (body.containsKey("invitedEmails")) {
            Object raw = body.get("invitedEmails");
            List<String> cleaned = new ArrayList<>();
            if (raw instanceof List<?> list) {
                for (Object o : list) {
                    if (o == null) continue;
                    String email = o.toString().trim().toLowerCase();
                    if (email.isEmpty() || !email.contains("@")) continue;
                    if (!cleaned.contains(email)) cleaned.add(email);
                }
            }
            tournament.setInvitedEmails(cleaned);
        }
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", mode.equals("INVITE_ONLY")
                        ? "Đã chuyển giải sang chế độ chỉ mời qua email."
                        : "Đã mở quyền tham gia cho mọi người.",
                "joinMode", tournament.getJoinMode(),
                "invitedEmails", tournament.getInvitedEmails()));
    }

    /** BTC / chủ sân thêm 1 email vào danh sách mời của giải. */
    @PostMapping("/{id}/invites")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
    public ResponseEntity<?> addInvite(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        String email = body.get("email") != null ? body.get("email").toString().trim().toLowerCase() : "";
        if (email.isEmpty() || !email.contains("@")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không hợp lệ."));
        }
        List<String> emails = new ArrayList<>(
                tournament.getInvitedEmails() != null ? tournament.getInvitedEmails() : List.of());
        if (!emails.contains(email)) {
            emails.add(email);
        }
        tournament.setInvitedEmails(emails);
        // Mời email thì chuyển sang chế độ kín nếu đang công khai
        if (!"INVITE_ONLY".equalsIgnoreCase(tournament.getJoinMode())) {
            tournament.setJoinMode("INVITE_ONLY");
        }
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã mời " + email + " tham gia giải.",
                "joinMode", tournament.getJoinMode(),
                "invitedEmails", tournament.getInvitedEmails()));
    }

    /** BTC / chủ sân xóa 1 email khỏi danh sách mời. */
    @DeleteMapping("/{id}/invites/{email}")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
    public ResponseEntity<?> removeInvite(@PathVariable Long id, @PathVariable String email) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        String target = email.trim().toLowerCase();
        List<String> emails = new ArrayList<>(
                tournament.getInvitedEmails() != null ? tournament.getInvitedEmails() : List.of());
        emails.removeIf(e -> e != null && e.trim().toLowerCase().equals(target));
        tournament.setInvitedEmails(emails);
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã gỡ lời mời của " + target + ".",
                "invitedEmails", tournament.getInvitedEmails()));
    }

    /**
     * BTC / chủ tổ chức THÊM ĐỘI THỦ CÔNG vào giải (không qua form đăng ký của cầu thủ).
     *
     * <p>Khác với {@code POST /{id}/register} (cầu thủ tự đăng ký, bị chặn trùng
     * captainEmail/captainPhone và bắt buộc đã đóng phí), endpoint này dành cho BTC:
     * nhập tay tên đội + đội trưởng + SĐT, đội được đánh dấu CONFIRMED ngay nên
     * sẵn sàng bốc thăm.</p>
     */
    @PostMapping("/{id}/teams/manual")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
    public ResponseEntity<?> addManualTeam(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Tournament tournament = tournamentRepository.findById(id).orElse(null);
        if (tournament == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        }
        String teamName = body.get("teamName") != null ? body.get("teamName").toString().trim() : "";
        if (teamName.length() < 3 || teamName.length() > 60) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên đội phải từ 3 đến 60 ký tự."));
        }
        List<TournamentTeamEntry> teams = tournament.getTeams() != null
                ? new ArrayList<>(tournament.getTeams())
                : new ArrayList<>();
        for (TournamentTeamEntry existing : teams) {
            if (teamName.equalsIgnoreCase(existing.getTeamName())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Tên đội đã tồn tại trong giải này."));
            }
        }
        Integer cap = tournament.getTotalTeams();
        if (cap != null && cap > 0 && teams.size() >= cap) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Giải đã đủ số lượng đội (" + cap + " đội)."));
        }
        String captainName = body.get("captainName") != null
                ? body.get("captainName").toString().trim()
                : "";
        String captainPhone = body.get("captainPhone") != null
                ? body.get("captainPhone").toString().trim()
                : "";
        String memberNames = body.get("memberNames") != null
                ? body.get("memberNames").toString().trim()
                : "";
        int memberCount = 12;
        if (body.get("memberCount") != null) {
            try {
                memberCount = Integer.parseInt(body.get("memberCount").toString());
            } catch (NumberFormatException ignored) {
                memberCount = 12;
            }
        }
        memberCount = Math.max(1, Math.min(30, memberCount));
        // Không có danh sách cầu thủ thì suy ra từ số người để BTC không phải gõ tay
        if (memberNames.isEmpty()) {
            List<String> names = new ArrayList<>();
            for (int i = 1; i <= memberCount; i++) {
                names.add("Cầu thủ " + i);
            }
            memberNames = String.join(",", names);
        }
        TournamentTeamEntry entry = TournamentTeamEntry.builder()
                .teamName(teamName)
                .captainName(captainName.isEmpty() ? "Đội trưởng " + teamName : captainName)
                .captainEmail(null) // đội thêm tay: không gắn tài khoản nào
                .captainPhone(captainPhone)
                .subCaptainPhone(body.get("subCaptainPhone") != null
                        ? body.get("subCaptainPhone").toString().trim() : "")
                .memberCount(memberCount)
                .memberNames(memberNames)
                .registrationStatus("CONFIRMED") // BTC thêm tay -> đã xác nhận, sẵn sàng bốc thăm
                .simulated(false)
                .registeredAt(LocalDateTime.now())
                .build();
        teams.add(entry);
        tournament.setTeams(teams);
        tournament.setRegisteredTeams(teams.size());
        // Đội mới làm danh sách đổi -> cần bốc thăm lại
        tournament.setBracketJson(null);
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã thêm đội \"" + teamName + "\" vào giải.",
                "team", entry,
                "registeredTeams", teams.size()));
    }

    /**
     * BTC xác nhận đã thu lệ phí của một đội → CONFIRMED (mới được bốc thăm).
     */
    @PostMapping("/{id}/teams/confirm-payment")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','OWNER')")
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
        // Khong cho duyet them khi giai da du cho (truoc day co the vuot suc chua -> "9/8 doi")
        int cap = tournament.getTotalTeams() != null ? tournament.getTotalTeams() : 0;
        if (cap > 0) {
            int daVaoGiai = 0;
            for (TournamentTeamEntry t : tournament.getTeams()) {
                if (t == found) continue;
                String st = t.getRegistrationStatus() == null ? "CONFIRMED" : t.getRegistrationStatus().toUpperCase();
                if ("CONFIRMED".equals(st) || "SIMULATED".equals(st) || Boolean.TRUE.equals(t.getSimulated())) daVaoGiai++;
            }
            if (daVaoGiai >= cap) {
                return ResponseEntity.badRequest().body(Map.of(
                        "message", "Giải đã đủ " + cap + " đội. Hãy tăng sức chứa hoặc bỏ bớt đội trước khi duyệt thêm."));
            }
        }
        found.setRegistrationStatus("CONFIRMED");
        tournamentRepository.save(tournament);
        return ResponseEntity.ok(Map.of(
                "message", "Đã xác nhận lệ phí của " + found.getTeamName() + ".",
                "team", found.getTeamName()));
    }
    // Endpoint POST /generate-bracket cũ (trả bracket + bảng xếp hạng giả, không ghi CSDL)
    // đã bị gỡ: luồng thật dùng POST /{id}/draw (bốc thăm theo thứ tự đăng ký) và
    // POST /{id}/simulate-results. Giữ lại sẽ gây hiểu nhầm khi đối chiếu dữ liệu.
    // ============================================================
    // DUYỆT ĐỘI ĐĂNG KÝ (BTC / ADMIN)
    // ============================================================

    /** Danh sách đội chờ duyệt (PENDING_PAYMENT) của một giải. */
    @GetMapping("/{id}/teams/pending")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> pendingTeams(@PathVariable Long id) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        List<Map<String, Object>> out = new ArrayList<>();
        for (TournamentTeamEntry team : t.getTeams()) {
            if (!"PENDING_PAYMENT".equals(team.getRegistrationStatus())) continue;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("teamName", team.getTeamName());
            row.put("captainName", team.getCaptainName());
            row.put("captainPhone", team.getCaptainPhone());
            row.put("captainEmail", team.getCaptainEmail());
            row.put("memberCount", team.getMemberCount());
            row.put("registeredAt", team.getRegisteredAt());
            out.add(row);
        }
        return ResponseEntity.ok(out);
    }

    /** Duyệt đội vào giải (chuyển PENDING_PAYMENT → CONFIRMED). */
    @PostMapping("/{id}/teams/{teamName}/approve")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> approveTeam(@PathVariable Long id, @PathVariable String teamName) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        for (TournamentTeamEntry team : t.getTeams()) {
            if (team.getTeamName() != null && team.getTeamName().equals(teamName)
                    && "PENDING_PAYMENT".equals(team.getRegistrationStatus())) {
                // Không duyệt vượt sức chứa của giải (confirmTeamPayment đã có check này,
                // approveTeam thì không -> giải có thể vượt số đội).
                int cap = t.getTotalTeams() != null ? t.getTotalTeams() : 0;
                long confirmed = t.getTeams().stream()
                        .filter(x -> "CONFIRMED".equals(x.getRegistrationStatus()) || "SIMULATED".equals(x.getRegistrationStatus()))
                        .count();
                if (cap > 0 && confirmed >= cap) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu đã đủ số đội (" + cap + ")."));
                }
                team.setRegistrationStatus("CONFIRMED");
                tournamentRepository.save(t);
                return ResponseEntity.ok(Map.of("message", "Đã duyệt đội " + teamName + " vào giải."));
            }
        }
        return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy đội chờ duyệt: " + teamName));
    }

    /** Từ chối đội (xóa khỏi danh sách đăng ký). */
    @PostMapping("/{id}/teams/{teamName}/reject")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> rejectTeam(@PathVariable Long id, @PathVariable String teamName) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        boolean removed = t.getTeams().removeIf(team ->
                team.getTeamName() != null && team.getTeamName().equals(teamName)
                        && "PENDING_PAYMENT".equals(team.getRegistrationStatus()));
        if (!removed) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy đội chờ duyệt: " + teamName));
        }
        t.setRegisteredTeams(t.getTeams().size());
        tournamentRepository.save(t);
        return ResponseEntity.ok(Map.of("message", "Đã từ chối đội " + teamName + "."));
    }

    // ============================================================
    // TRỌNG TÀI (BTC / ADMIN)
    // ============================================================

    /** Danh sách trọng tài của một giải. */
    @GetMapping("/{id}/referees")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> listReferees(@PathVariable Long id) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        List<Map<String, Object>> out = new ArrayList<>();
        for (TournamentReferee r : refereeRepository.findByTournamentIdOrderByNameAsc(id)) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", r.getId());
            row.put("name", r.getName());
            row.put("email", r.getEmail());
            row.put("phone", r.getPhone());
            row.put("status", r.getStatus());
            row.put("notes", r.getNotes());
            row.put("assignedAt", r.getAssignedAt());
            out.add(row);
        }
        return ResponseEntity.ok(out);
    }

    /** Thêm trọng tài vào giải. */
    @PostMapping("/{id}/referees")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> addReferee(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        String name = req.get("name") != null ? req.get("name").toString().trim() : "";
        if (name.length() < 2 || name.length() > 80) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tên trọng tài phải từ 2 đến 80 ký tự."));
        }
        String email = req.get("email") != null ? req.get("email").toString().trim().toLowerCase() : "";
        String phone = req.get("phone") != null ? req.get("phone").toString().trim() : "";
        String notes = req.get("notes") != null ? req.get("notes").toString().trim() : null;

        if (!email.isEmpty() && refereeRepository.existsByTournamentIdAndEmail(id, email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Trọng tài này đã có trong giải."));
        }
        if (!phone.isEmpty() && refereeRepository.existsByTournamentIdAndPhone(id, phone)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại này đã được dùng."));
        }

        TournamentReferee saved = refereeRepository.save(TournamentReferee.builder()
                .tournamentId(id)
                .name(name)
                .email(email.isEmpty() ? null : email)
                .phone(phone.isEmpty() ? null : phone)
                .notes(notes)
                .build());

        return ResponseEntity.ok(Map.of("message", "Đã thêm trọng tài " + name + ".", "id", saved.getId()));
    }

    /** Xóa trọng tài khỏi giải. */
    @DeleteMapping("/{id}/referees/{refId}")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'OWNER', 'ADMIN')")
    public ResponseEntity<?> removeReferee(@PathVariable Long id, @PathVariable Long refId) {
        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        refereeRepository.deleteByIdAndTournamentId(refId, id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa trọng tài.", "id", refId));
    }
}
