package com.turfzone.config;

import com.turfzone.model.MatchResult;
import com.turfzone.model.MatchmakingPost;
import com.turfzone.model.Pitch;
import com.turfzone.model.Tournament;
import com.turfzone.model.TournamentTeamEntry;
import com.turfzone.model.User;
import com.turfzone.model.UserRole;
import com.turfzone.repository.MatchResultRepository;
import com.turfzone.repository.MatchmakingPostRepository;
import com.turfzone.repository.PitchRepository;
import com.turfzone.repository.TournamentRepository;
import com.turfzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    /** Số cụm sân seed gán cho tài khoản Chủ Sân demo (phần còn lại là sân công cộng). */
    private static final long DEMO_OWNER_PITCH_COUNT = 3L;

    private final UserRepository userRepository;
    private final PitchRepository pitchRepository;
    private final TournamentRepository tournamentRepository;
    private final MatchmakingPostRepository matchmakingPostRepository;
    private final MatchResultRepository matchResultRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("[DataInitializer] Kiểm tra và khởi tạo dữ liệu mẫu Turfzone...");
        try {
            seedUsers();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua seed tài khoản demo/admin do lỗi: {}", e.getMessage());
        }

        try {
            seedTournaments();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua seed giải đấu do lỗi: {}", e.getMessage());
        }

        try {
            seedCompletedTournamentWithResults();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua seed giải đã có kết quả do lỗi: {}", e.getMessage());
        }

        try {
            seedPitches();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua seed cụm sân do lỗi: {}", e.getMessage());
        }

        try {
            assignDemoPitchesToOwner();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua gán cụm sân cho chủ sân demo do lỗi: {}", e.getMessage());
        }

        try {
            seedMatchmaking();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua seed bài đăng tìm đối do lỗi: {}", e.getMessage());
        }
        log.info("[DataInitializer] Hoàn tất quá trình kiểm tra dữ liệu khởi tạo.");
    }

private void seedUsers() {
        // QUAN TRỌNG: chỉ tạo tài khoản admin mặc định khi hệ thống CHƯA CÓ admin nào.
        // Nếu kiểm tra theo existsByEmail thì khi quản trị xóa acc demo, lần khởi động sau
        // acc đó sẽ tự hồi sinh với mật khẩu admin123 -> lưng backdoor không xóa được.
        if (userRepository.countByRole(UserRole.ADMIN) == 0 && !userRepository.existsByEmail("admin@Turfzone.vn")) {
            User admin = User.builder()
                    .fullName("Quản Trị Hệ Thống")
                    .email("admin@Turfzone.vn")
                    .phone("0900000001")
                    .password(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .area("Đà Nẵng")
                    .level("Quản trị viên")
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Seeded default ADMIN account: admin@Turfzone.vn / admin123");
        }

        // 0b. Tài khoản demo cho buổi bảo vệ / trình diễn (PLAYER - OWNER - ORGANIZER)
        if (!userRepository.existsByEmail("player@Turfzone.vn")) {
            userRepository.save(User.builder()
                    .fullName("Nguyễn Văn Cầu Thủ")
                    .email("player@Turfzone.vn")
                    .phone("0912345678")
                    .password(passwordEncoder.encode("player123"))
                    .role(UserRole.PLAYER)
                    .area("Quận Hải Châu, Đà Nẵng")
                    .level("Trung bình")
                    .position("Tiền đạo")
                    .enabled(true)
                    .build());
            log.info("Seeded demo PLAYER account: player@Turfzone.vn / player123");
        }

        if (!userRepository.existsByEmail("owner@Turfzone.vn")) {
            userRepository.save(User.builder()
                    .fullName("Trần Thị Chủ Sân")
                    .email("owner@Turfzone.vn")
                    .phone("0987654321")
                    .password(passwordEncoder.encode("owner123"))
                    .role(UserRole.OWNER)
                    .area("Quận Hải Châu, Đà Nẵng")
                    .level("Chủ cụm sân")
                    .enabled(true)
                    .build());
            log.info("Seeded demo OWNER account: owner@Turfzone.vn / owner123");
        }

        if (!userRepository.existsByEmail("organizer@Turfzone.vn")) {
            userRepository.save(User.builder()
                    .fullName("Lê Văn Ban Tổ Chức")
                    .email("organizer@Turfzone.vn")
                    .phone("0909876543")
                    .password(passwordEncoder.encode("organizer123"))
                    .role(UserRole.ORGANIZER)
                    .area("Quận Cẩm Lệ, Đà Nẵng")
                    .level("Trưởng BTC giải")
                    .enabled(true)
                    .build());
            log.info("Seeded demo ORGANIZER account: organizer@Turfzone.vn / organizer123");
        }
    }

    private void seedTournaments() {
        // 1. Khởi tạo giải đấu thật nếu chưa có
        if (tournamentRepository.count() == 0) {
            Tournament t1 = Tournament.builder()
                    .title("Turfzone Championship Cup 2026 - Cúp Bóng Đá Phủi Mở Rộng")
                    .description("Giải bóng đá sân 7 phủi uy tín nhất khu vực Đà Nẵng tranh Cúp Vàng, lưu lịch sử thi đấu và chuỗi phong độ.")
                    .sportType("SAN_7")
                    .format("KNOCKOUT")
                    .pitchName("Cụm Sân Bóng Đá Đại Nắng")
                    .location("Quận Hải Châu, Đà Nẵng")
                    .totalTeams(16)
                    .registeredTeams(14)
                    .prizePool(35000000L)
                    .entryFee(1500000L)
                    .startDate("2026-10-26")
                    .endDate("2026-10-28")
                    .registrationDeadline("2026-10-24")
                    .status("OPEN")
                    .bannerUrl("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80")
                    .teams(new ArrayList<>(List.of(
                            TournamentTeamEntry.builder().teamName("FC Đà Nẵng Warriors").captainName("Nguyễn Văn Hùng").captainPhone("0909111222").memberCount(14).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(3)).build(),
                            TournamentTeamEntry.builder().teamName("FC Hoàng Nam Hải Châu").captainName("Trần Tuấn Anh").captainPhone("0909333444").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(2)).build(),
                            TournamentTeamEntry.builder().teamName("FC Lộc Phát").captainName("Phạm Đăng Khoa").captainPhone("0908555666").memberCount(13).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(1)).build()
                    )))
                    .build();

            Tournament t2 = Tournament.builder()
                    .title("Cúp Bóng Đá Mini Sân 5 Sinh Viên Đà Nẵng 2026")
                    .description("Sân chơi giao lưu rèn luyện thể lực và kỹ chiến thuật cho các trường Đại học và Cao đẳng toàn thành phố.")
                    .sportType("SAN_5")
                    .format("KNOCKOUT")
                    .pitchName("Cụm Sân 5 Hòa Xuân")
                    .location("Quận Hải Châu, Đà Nẵng")
                    .totalTeams(8)
                    .registeredTeams(8)
                    .prizePool(20000000L)
                    .entryFee(800000L)
                    .startDate("2026-11-08")
                    .endDate("2026-11-09")
                    .registrationDeadline("2026-11-05")
                    .status("ONGOING")
                    .bannerUrl("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80")
                    .teams(new ArrayList<>(List.of(
                            TournamentTeamEntry.builder().teamName("FC Bách Khoa").captainName("Lê Hoàng Minh").captainPhone("0912111333").memberCount(10).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(5)).build(),
                            TournamentTeamEntry.builder().teamName("FC Kinh Tế").captainName("Nguyễn Quốc Bảo").captainPhone("0913222444").memberCount(10).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(4)).build()
                    )))
                    .build();

            Tournament t3 = Tournament.builder()
                    .title("Super League Sân 11 Doanh Nghiệp Đà Nẵng")
                    .description("Giải đấu bóng đá sân 11 người mặt cỏ tự nhiên chuẩn quốc gia dành cho các tổ chức và doanh nghiệp lớn.")
                    .sportType("SAN_11")
                    .format("ROUND_ROBIN")
                    .pitchName("Sân Vận Động Hòa Xuân")
                    .location("Quận Cẩm Lệ, Đà Nẵng")
                    .totalTeams(6)
                    .registeredTeams(4)
                    .prizePool(50000000L)
                    .entryFee(3000000L)
                    .startDate("2026-11-15")
                    .endDate("2026-12-20")
                    .registrationDeadline("2026-11-10")
                    .status("OPEN")
                    .bannerUrl("https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80")
                    .teams(new ArrayList<>(List.of(
                            TournamentTeamEntry.builder().teamName("FC Tech Titans").captainName("Đặng Ngọc Long").captainPhone("0977888999").memberCount(18).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(1)).build()
                    )))
                    .build();

            Tournament t4 = Tournament.builder()
                    .title("Giải Futsal Giao Hữu Doanh Nghiệp Đà Nẵng 2026")
                    .description("Giải futsal trong nhà dành cho các đội văn phòng và doanh nghiệp, hình thức vòng tròn tính điểm nhanh gọn.")
                    .sportType("FUTSAL")
                    .format("ROUND_ROBIN")
                    .pitchName("Sân Cẩm Lệ Futsal & Sân 5")
                    .location("Quận Thanh Khê, Đà Nẵng")
                    .totalTeams(8)
                    .registeredTeams(6)
                    .prizePool(12000000L)
                    .entryFee(600000L)
                    .startDate("2026-11-22")
                    .endDate("2026-11-23")
                    .registrationDeadline("2026-11-19")
                    .status("OPEN")
                    .bannerUrl("https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=80")
                    .teams(new ArrayList<>(List.of(
                            TournamentTeamEntry.builder().teamName("FC FPT Software").captainName("Phan Quang Huy").captainPhone("0981222333").memberCount(9).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(2)).build(),
                            TournamentTeamEntry.builder().teamName("FC Viettel Pay").captainName("Đỗ Minh Châu").captainPhone("0982333444").memberCount(9).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(2)).build(),
                            TournamentTeamEntry.builder().teamName("FC Vinamilk").captainName("Lý Gia Hân").captainPhone("0983444555").memberCount(9).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(1)).build()
                    )))
                    .build();

            Tournament t5 = Tournament.builder()
                    .title("Giải Phủi Khu Vực Hải Châu - Mùa 2 (Đã Kết Thúc)")
                    .description("Giải phủi khu vực Hải Châu đã kết thúc, dùng để minh chứng tính năng lưu kết quả, BXH và chuỗi phong độ tự động.")
                    .sportType("SAN_7")
                    .format("KNOCKOUT")
                    .pitchName("Cụm Sân Bóng Đá Đại Nắng")
                    .location("Quận Hải Châu, Đà Nẵng")
                    .totalTeams(8)
                    .registeredTeams(8)
                    .prizePool(8000000L)
                    .entryFee(500000L)
                    .startDate("2026-08-01")
                    .endDate("2026-08-03")
                    .registrationDeadline("2026-07-28")
                    .status("COMPLETED")
                    .bannerUrl("https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80")
                    .teams(new ArrayList<>(List.of(
                            TournamentTeamEntry.builder().teamName("FC Phù Đổng Hải Châu").captainName("Nguyễn Văn An").captainPhone("0908123456").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(90)).build(),
                            TournamentTeamEntry.builder().teamName("FC Đại Nắng").captainName("Võ Thanh Tâm").captainPhone("0908777888").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(88)).build()
                    )))
                    .build();

            tournamentRepository.saveAll(List.of(t1, t2, t3, t4, t5));
            log.info("Seeded 5 real football tournaments successfully.");
        }
    }

    /**
     * Tạo thêm MỘT giải đấu đã kết thúc, có sẵn nhánh đấu + kết quả thi đấu thật.
     *
     * <p>Lý do: các giải seed ở trên đều chưa bốc thăm nên bảng xếp hạng phong độ và
     * màn nhánh đấu mở ra trống trơn, rất bất lợi khi demo. Giải này có sẵn
     * {@code bracketJson} và các dòng trong {@code match_results} — đúng nguồn dữ liệu
     * mà {@code TeamFormService} dùng để tính chuỗi W/D/L — nên phong độ hiển thị
     * đúng ngay khi mở app.</p>
     */
    private void seedCompletedTournamentWithResults() {
        boolean alreadySeeded = tournamentRepository.findAll().stream()
                .anyMatch(t -> t.getTitle() != null
                        && t.getTitle().contains("Grandmaster")
                        && t.getBracketJson() != null
                        && !t.getBracketJson().isBlank());
        if (alreadySeeded) {
            return;
        }

        final String A = "FC Đại Nắng";
        final String B = "FC Phù Đổng Hải Châu";
        final String C = "FC Thanh Đa";
        final String D = "FC Bình Hiên";

        String pitch = "Cụm Sân 11 Ngôi Sao, Hải Châu";

        // ---- Nhánh đấu: bán kết + chung kết, tất cả đã có tỷ số ----
        Map<String, Object> semi1 = new LinkedHashMap<>();
        semi1.put("matchId", "R1-M1");
        semi1.put("teamA", node(A, 1));
        semi1.put("teamB", node(B, 4));
        semi1.put("scoreA", 3);
        semi1.put("scoreB", 2);
        semi1.put("status", "DONE");
        semi1.put("winner", A);
        semi1.put("matchDate", LocalDate.now().minusDays(21).toString());
        semi1.put("timeSlot", "17:00 - 19:00");
        semi1.put("pitchName", pitch);

        Map<String, Object> semi2 = new LinkedHashMap<>();
        semi2.put("matchId", "R1-M2");
        semi2.put("teamA", node(C, 2));
        semi2.put("teamB", node(D, 3));
        semi2.put("scoreA", 1);
        semi2.put("scoreB", 4);
        semi2.put("status", "DONE");
        semi2.put("winner", D);
        semi2.put("matchDate", LocalDate.now().minusDays(21).toString());
        semi2.put("timeSlot", "19:00 - 21:00");
        semi2.put("pitchName", pitch);

        Map<String, Object> finalMatch = new LinkedHashMap<>();
        finalMatch.put("matchId", "R2-M1");
        finalMatch.put("teamA", node(A, 1));
        finalMatch.put("teamB", node(D, 3));
        finalMatch.put("scoreA", 2);
        finalMatch.put("scoreB", 2);
        finalMatch.put("status", "DONE");
        finalMatch.put("winner", A);
        finalMatch.put("matchDate", LocalDate.now().minusDays(14).toString());
        finalMatch.put("timeSlot", "18:00 - 20:00");
        finalMatch.put("pitchName", pitch);

        Map<String, Object> round1 = new LinkedHashMap<>();
        round1.put("name", "Bán kết");
        round1.put("matches", List.of(semi1, semi2));

        Map<String, Object> round2 = new LinkedHashMap<>();
        round2.put("name", "Chung kết");
        round2.put("matches", List.of(finalMatch));

        Map<String, Object> bracket = new LinkedHashMap<>();
        bracket.put("tournamentId", 0); // sẽ ghi đè bằng id thật sau khi lưu
        bracket.put("title", "Turfzone Grandmaster Series 2026");
        bracket.put("drawnAt", LocalDateTime.now().minusDays(22).toString());
        bracket.put("method", "SEED_BY_REGISTERED_AT");
        bracket.put("teamCount", 4);
        bracket.put("rounds", List.of(round1, round2));

        Tournament cup = Tournament.builder()
                .title("Turfzone Grandmaster Series 2026")
                .description("Giải đấu bốc tháng đã kết thúc — kèm nhánh đấu và lịch sử thi đấu thật để xem ngay bảng xếp hạng phong độ.")
                .sportType("SAN_7")
                .format("KNOCKOUT")
                .pitchName(pitch)
                .location("Quận Hải Châu, Đà Nẵng")
                .totalTeams(4)
                .registeredTeams(4)
                .prizePool(12000000L)
                .entryFee(600000L)
                .startDate(LocalDate.now().minusDays(22).toString())
                .endDate(LocalDate.now().minusDays(14).toString())
                .registrationDeadline(LocalDate.now().minusDays(24).toString())
                .status("COMPLETED")
                .bannerUrl("https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80")
                .teams(new ArrayList<>(List.of(
                        TournamentTeamEntry.builder().teamName(A).captainName("Võ Thanh Tâm").captainPhone("0908777888").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(40)).build(),
                        TournamentTeamEntry.builder().teamName(C).captainName("Lê Minh Khoa").captainPhone("0903123456").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(39)).build(),
                        TournamentTeamEntry.builder().teamName(D).captainName("Phạm Gia Bảo").captainPhone("0907654321").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(38)).build(),
                        TournamentTeamEntry.builder().teamName(B).captainName("Đỗ Hoàng Long").captainPhone("0909988776").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(37)).build()
                )))
                .build();

        Tournament saved = tournamentRepository.save(cup);

        bracket.put("tournamentId", saved.getId());
        saved.setBracketJson(bracketJsonOf(bracket));
        tournamentRepository.save(saved);

        // ---- Lịch sử thi đấu thật: nguồn tính phong độ (chuỗi W/D/L) ----
        matchResultRepository.saveAll(List.of(
                result(saved.getId(), "R1-M1", "Bán kết", A, B, 3, 2, A, LocalDateTime.now().minusDays(21).withHour(17)),
                result(saved.getId(), "R1-M2", "Bán kết", C, D, 1, 4, D, LocalDateTime.now().minusDays(21).withHour(19)),
                result(saved.getId(), "R2-M1", "Chung kết", A, D, 2, 2, A, LocalDateTime.now().minusDays(14).withHour(18))
        ));

        log.info("Seeded a COMPLETED tournament with bracket + 3 real match results.");
    }

    /** Node đội trong bracketJson. Phong độ để trống — sẽ được TeamFormService gắn live khi đọc. */
    private static Map<String, Object> node(String teamName, int seed) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", teamName);
        m.put("seed", seed);
        return m;
    }

    private static MatchResult result(Long tournamentId, String matchId, String roundName,
                                      String teamA, String teamB, int scoreA, int scoreB,
                                      String winner, LocalDateTime playedAt) {
        return MatchResult.builder()
                .tournamentId(tournamentId)
                .matchId(matchId)
                .roundName(roundName)
                .teamA(teamA)
                .teamB(teamB)
                .scoreA(scoreA)
                .scoreB(scoreB)
                .winner(winner)
                .playedAt(playedAt)
                .build();
    }

    /** Bọc Map thành chuỗi JSON cho bracketJson. */
    private static String bracketJsonOf(Object value) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Gán một phần cụm sân cho tài khoản Chủ Sân demo.
     *
     * <p>Bắt buộc: {@code PitchService.assertCanManage} chỉ cho phép sửa cụm sân
     * khi {@code ownerId} khớp với chủ sân đang đăng nhập. Các cụm sân seed mặc
     * định có {@code owner_id = NULL}, nên nếu không gán thì tài khoản OWNER demo
     * sẽ không sửa được cụm sân nào — tính năng "Sửa hồ sơ cụm sân" trở nên vô
     * dụng khi trình diễn.</p>
     *
     * <p>Chỉ gán {@value #DEMO_OWNER_PITCH_COUNT} cụm sân đầu, phần còn lại giữ
     * nguyên làm sân công cộng cho Chợ Kèo và Cộng đồng. Method chạy độc lập với
     * {@code seedPitches()} nên áp dụng được cả với database đã có sẵn dữ liệu.</p>
     */
    private void assignDemoPitchesToOwner() {
        User owner = userRepository.findByEmail("owner@Turfzone.vn")
                .filter(u -> u.getRole() == UserRole.OWNER)
                .orElse(null);
        if (owner == null) {
            log.warn("[DataInitializer] Chưa có tài khoản owner@Turfzone.vn nên bỏ qua gán cụm sân.");
            return;
        }

        List<Pitch> unowned = pitchRepository.findAll().stream()
                .filter(p -> p.getOwnerId() == null)
                .limit(DEMO_OWNER_PITCH_COUNT)
                .toList();

        if (unowned.isEmpty()) {
            return;
        }
        for (Pitch p : unowned) {
            p.setOwnerId(owner.getId());
            p.setOwnerName(owner.getFullName() != null ? owner.getFullName() : owner.getEmail());
            pitchRepository.save(p);
        }
        log.info("Assigned {} seed pitches to the demo OWNER account ({}).",
                unowned.size(), owner.getEmail());
    }

    private void seedPitches() {
        // 1b. Khởi tạo cụm sân thật nếu chưa có (màn Tìm Sân, Lịch Hoạt Động & thống kê lấy từ đây)
        if (pitchRepository.count() == 0) {
            Pitch s1 = Pitch.builder()
                    .name("Cụm Sân Bóng Đá Đại Nắng")
                    .address("12 Phan Đăng Lưu, P. Hòa Cường Nam, Quận Hải Châu")
                    .area("Quận Hải Châu, Đà Nẵng")
                    .phone("0908123456")
                    .ownerName("Sân Đại Nắng")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2026")
                    .accountName("SÂN ĐẠI NẮNG")
                    .latitude(16.0350).longitude(108.2180)
                    .avgPricePerHour(280000).peakPricePerHour(360000)
                    .rating(4.8).openTime("14:00").closeTime("23:00")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Áo bib", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80")
                    .description("Cụm 3 sân 5 và 2 sân 7 cỏ nhân tạo có mái che, phù hợp giao lưu và tổ chức giải phủi.")
                    .build();

            Pitch s2 = Pitch.builder()
                    .name("Sân Mini Hải Châu Arena")
                    .address("12 Phan Đăng Lưu, P. 2, Quận Hải Châu")
                    .area("Q. Hải Châu, Đà Nẵng")
                    .phone("0912345678")
                    .ownerName("Arena Hải Châu")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2027")
                    .accountName("ARENA HẢI CHÂU")
                    .latitude(16.0390).longitude(108.2140)
                    .avgPricePerHour(240000).peakPricePerHour(300000)
                    .rating(4.5).openTime("06:00").closeTime("22:30")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Căn tin")))
                    .imageUrl("https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân 5 người trong nhà, mặt cỏ mới, thích hợp đá tối và dưỡng sinh sau giờ làm.")
                    .build();

            Pitch s3 = Pitch.builder()
                    .name("Cụm Sân Đà Nẵng")
                    .address("Khu dân cư Đà Nẵng, Quận Hải Châu")
                    .area("Huyện Ngũ Hành Sơn, Đà Nẵng")
                    .phone("0933888999")
                    .ownerName("Đà Nẵng Sport")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2028")
                    .accountName("ĐÀ NẴNG SPORT")
                    .latitude(16.0120).longitude(108.2280)
                    .avgPricePerHour(320000).peakPricePerHour(420000)
                    .rating(4.9).openTime("15:00").closeTime("23:30")
                    .pitchTypes(new ArrayList<>(List.of("SAN_7", "SAN_11")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Áo bib", "Đèn LED", "Phòng thay đồ")))
                    .imageUrl("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80")
                    .description("Cụm sân 7 FIFA và 1 sân 11 chuẩn thi đấu, có khán đài nhỏ, đăng cai giải phủi.")
                    .build();

            Pitch s4 = Pitch.builder()
                    .name("Sân Bóng Hải Châu Center")
                    .address("88 Nguyễn Văn Linh, Q. Hải Châu")
                    .area("Q. Hải Châu, Đà Nẵng")
                    .phone("0905111222")
                    .ownerName("Hải Châu Center")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2029")
                    .accountName("HẢI CHÂU CENTER")
                    .latitude(16.0540).longitude(108.2020)
                    .avgPricePerHour(200000).peakPricePerHour(260000)
                    .rating(4.6).openTime("06:00").closeTime("22:00")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân trung tâm Đà Nẵng, vị trí đắc địa, khung giờ vàng thường kín nên đặt sớm.")
                    .build();

            Pitch s5 = Pitch.builder()
                    .name("Sân Cẩm Lệ Futsal & Sân 5")
                    .address("Đường Nguyễn Hữu Thọ, Q. Cẩm Lệ")
                    .area("Q. Cẩm Lệ, Đà Nẵng")
                    .phone("0905333444")
                    .ownerName("Cẩm Lệ Futsal")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2030")
                    .accountName("CẨM LỆ FUTSAL")
                    .latitude(16.0180).longitude(108.2050)
                    .avgPricePerHour(180000).peakPricePerHour(230000)
                    .rating(4.4).openTime("07:00").closeTime("22:30")
                    .pitchTypes(new ArrayList<>(List.of("FUTSAL", "SAN_5")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Áo bib", "Căn tin")))
                    .imageUrl("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân futsal trong nhà mát mẻ quanh năm, kèm 2 sân 5 ngoài trời cho giao lưu.")
                    .build();

            Pitch s6 = Pitch.builder()
                    .name("Sân 11 Hải Châu Sport Complex")
                    .address("Số 1 Nguyễn Kim, Quận Hải Châu")
                    .area("Quận Hải Châu, Đà Nẵng")
                    .phone("0977888999")
                    .ownerName("Hải Châu Complex")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2031")
                    .accountName("HẢI CHÂU COMPLEX")
                    .latitude(16.0620).longitude(108.1950)
                    .avgPricePerHour(450000).peakPricePerHour(600000)
                    .rating(5.0).openTime("06:00").closeTime("22:00")
                    .pitchTypes(new ArrayList<>(List.of("SAN_11")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Phòng thay đồ", "Khán đài", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân 11 người cỏ tự nhiên chuẩn quốc gia, sân khấu tổ chức các giải doanh nghiệp.")
                    .build();

            Pitch s7 = Pitch.builder()
                    .name("Sân Futsal Ngũ Hành Sơn")
                    .address("Khu liên hợp Thể thao Ngũ Hành Sơn, Đà Nẵng")
                    .area("Quận Ngũ Hành Sơn, Đà Nẵng")
                    .phone("0988111222")
                    .ownerName("Futsal Ngũ Hành Sơn")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2032")
                    .accountName("FUTSAL NGŨ HÀNH SƠN")
                    .latitude(16.0530).longitude(108.2530)
                    .avgPricePerHour(300000).peakPricePerHour(400000)
                    .rating(4.7).openTime("06:00").closeTime("23:00")
                    .pitchTypes(new ArrayList<>(List.of("FUTSAL", "SAN_5")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Phòng thay đồ", "Căn tin")))
                    .imageUrl("https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80")
                    .description("Cụm futsal chuẩn Đà Nẵng, hệ thống đèn LED hiện đại, mở cửa sáng sớm đến khuya.")
                    .build();

            Pitch s8 = Pitch.builder()
                    .name("Sân Bóng Trung Tâm Hải Châu")
                    .address("200 Đường 3 Tháng 2, Quận Hải Châu")
                    .area("Quận Hải Châu, Đà Nẵng")
                    .phone("0979333444")
                    .ownerName("Hải Châu Sport Arena")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2033")
                    .accountName("HẢI CHÂU SPORT ARENA")
                    .latitude(16.0544).longitude(108.2022)
                    .avgPricePerHour(220000).peakPricePerHour(280000)
                    .rating(4.5).openTime("05:30").closeTime("22:30")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Áo bib", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân cỏ nhân tạo ngay trung tâm Ninh Kiều, phù hợp đá sớm và giải phong trào miền Tây.")
                    .build();

            Pitch s9 = Pitch.builder()
                    .name("Sân Đà Nẵng Beachside Futsal")
                    .address("12 Trần Phú, Quận Sơn Trà")
                    .area("Quận Sơn Trà, Đà Nẵng")
                    .phone("0984555666")
                    .ownerName("Beachside Futsal")
                    .bankCode("970436")
                    .bankAccount("1900 2026 2034")
                    .accountName("BEACHSIDE FUTSAL")
                    .latitude(16.0760).longitude(108.2280)
                    .avgPricePerHour(260000).peakPricePerHour(340000)
                    .rating(4.6).openTime("07:00").closeTime("23:00")
                    .pitchTypes(new ArrayList<>(List.of("FUTSAL", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Phòng thay đồ")))
                    .imageUrl("https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân futsal ven biển Đà Nẵng, mát mẻ quanh năm, thường xuyên tổ chức giải tourist-friendly.")
                    .build();

            pitchRepository.saveAll(List.of(s1, s2, s3, s4, s5, s6, s7, s8, s9));
            log.info("Seeded 9 real football pitches successfully.");
        }
    }

    private void seedMatchmaking() {
        // 2. Khởi tạo các bài đăng tìm đối giao lưu bóng đá thật nếu chưa có
        if (matchmakingPostRepository.count() == 0) {
            MatchmakingPost p1 = MatchmakingPost.builder()
                    .teamName("FC Phù Đổng Hải Châu")
                    .captainName("Nguyễn Văn An")
                    .captainPhone("0908 123 456")
                    .reputationScore(98)
                    .pitchName("Cụm Sân Bóng Đá Đại Nắng (Sân 7A)")
                    .address("Số 12 Phan Đăng Lưu, Phường Hòa Cường Nam, Quận Hải Châu")
                    .matchTime("20:00 Tối nay")
                    .pitchType("SAN_7")
                    .paymentModel("SPLIT_EQUAL")
                    .estimatedFee(45000L)
                    .note("Cần tìm đối đá bắt cọc tiền sân 50/50, fairplay không quạu, có trọng tài bắt.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusMinutes(25))
                    .build();

            MatchmakingPost p2 = MatchmakingPost.builder()
                    .teamName("FC Bách Khoa Nam")
                    .captainName("Trần Tuấn Anh")
                    .captainPhone("0912 345 678")
                    .reputationScore(95)
                    .pitchName("Sân Mini Hải Châu Arena")
                    .address("Quận Hải Châu, Đà Nẵng")
                    .matchTime("18:30 Ngày mai")
                    .pitchType("SAN_5")
                    .paymentModel("SPLIT_EQUAL")
                    .estimatedFee(50000L)
                    .note("Tìm kèo cọ xát cho đội phong độ tương đương, anh em văn phòng đá dưỡng sinh.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(2))
                    .build();

            MatchmakingPost p3 = MatchmakingPost.builder()
                    .teamName("FC Đà Nẵng Warriors")
                    .captainName("Vũ Minh Tuấn")
                    .captainPhone("0933 888 999")
                    .reputationScore(99)
                    .pitchName("Cụm Sân Đà Nẵng (Sân 7 FIFA)")
                    .address("Huyện Ngũ Hành Sơn, Đà Nẵng")
                    .matchTime("21:00 Tối mai")
                    .pitchType("SAN_7")
                    .paymentModel("LOSER_PAYS")
                    .estimatedFee(60000L)
                    .note("Kèo căng cọ xát chuẩn bị giải Cup, đội thua chịu tiền sân, mời giao lưu các đội phong độ cao.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(5))
                    .build();

            MatchmakingPost p4 = MatchmakingPost.builder()
                    .teamName("FC Thanh Khê Brothers")
                    .captainName("Bùi Trọng Nhân")
                    .captainPhone("0901 222 333")
                    .reputationScore(92)
                    .pitchName("Sân Bóng Hải Châu Center")
                    .address("Quận Thanh Khê, Đà Nẵng")
                    .matchTime("19:00 Thứ Sáu tuần này")
                    .pitchType("SAN_5")
                    .paymentModel("SPLIT_EQUAL")
                    .estimatedFee(40000L)
                    .note("Đội mình 8 người, cần ghép thêm vài anh em để đủ 10 đá 5 người. Vui vẻ, fairplay.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusMinutes(10))
                    .build();

            MatchmakingPost p5 = MatchmakingPost.builder()
                    .teamName("FC Đà Nẵng Phủi")
                    .captainName("Ngô Thành Đạt")
                    .captainPhone("0902 333 444")
                    .reputationScore(96)
                    .pitchName("Sân Futsal Ngũ Hành Sơn")
                    .address("Quận Liên Chiểu, Đà Nẵng")
                    .matchTime("20:30 Tối nay")
                    .pitchType("FUTSAL")
                    .paymentModel("HOST_COVER")
                    .estimatedFee(0L)
                    .note("Kèo giao lưu futsal thường niên, đội nhà bao sân. Mời anh em Đà Nẵng ghé chơi.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(1))
                    .build();

            MatchmakingPost p6 = MatchmakingPost.builder()
                    .teamName("FC Hải Châu Bình Minh")
                    .captainName("Hoàng Minh Tuấn")
                    .captainPhone("0903 444 555")
                    .reputationScore(94)
                    .pitchName("Sân Bóng Trung Tâm Hải Châu")
                    .address("Quận Hải Châu, Đà Nẵng")
                    .matchTime("07:00 Sáng Chủ Nhật")
                    .pitchType("SAN_7")
                    .paymentModel("LOSER_PAYS")
                    .estimatedFee(70000L)
                    .note("Đá sáng Chủ Nhật cho mát, đội thua chịu tiền sân trọn gói. Cần đối 1300+.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(3))
                    .build();

            matchmakingPostRepository.saveAll(List.of(p1, p2, p3, p4, p5, p6));
            log.info("Seeded 6 real football matchmaking posts successfully.");
        }
    }
}
