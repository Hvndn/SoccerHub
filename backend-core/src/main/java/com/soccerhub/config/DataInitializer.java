package com.soccerhub.config;

import com.soccerhub.model.MatchResult;
import com.soccerhub.model.MatchmakingPost;
import com.soccerhub.model.Pitch;
import com.soccerhub.model.Tournament;
import com.soccerhub.model.TournamentTeamEntry;
import com.soccerhub.model.User;
import com.soccerhub.model.UserRole;
import com.soccerhub.repository.MatchResultRepository;
import com.soccerhub.repository.MatchmakingPostRepository;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.repository.UserRepository;
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

    private final UserRepository userRepository;
    private final PitchRepository pitchRepository;
    private final TournamentRepository tournamentRepository;
    private final MatchmakingPostRepository matchmakingPostRepository;
    private final MatchResultRepository matchResultRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("[DataInitializer] Kiểm tra và khởi tạo dữ liệu mẫu SoccerHub...");
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
            seedMatchmaking();
        } catch (Exception e) {
            log.warn("[DataInitializer] Bỏ qua seed bài đăng tìm đối do lỗi: {}", e.getMessage());
        }
        log.info("[DataInitializer] Hoàn tất quá trình kiểm tra dữ liệu khởi tạo.");
    }

private void seedUsers() {
        // QUAN TRỌNG: chỉ tạo tài khoản admin mặc định khi hệ thống CHƯA CÓ admin nào.
        // Nếu kiểm tra theo existsByEmail thì khi quản trị xoá acc demo, lần khởi động sau
        // acc đó sẽ tự hồi sinh với mật khẩu admin123 -> lưng backdoor không xoá được.
        if (userRepository.countByRole(UserRole.ADMIN) == 0 && !userRepository.existsByEmail("admin@soccerhub.vn")) {
            User admin = User.builder()
                    .fullName("Quản Trị Hệ Thống")
                    .email("admin@soccerhub.vn")
                    .phone("0900000001")
                    .password(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .area("TP.HCM")
                    .level("Quản trị viên")
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Seeded default ADMIN account: admin@soccerhub.vn / admin123");
        }

        // 0b. Tài khoản demo cho buổi bảo vệ / trình diễn (PLAYER - OWNER - ORGANIZER)
        if (!userRepository.existsByEmail("player@soccerhub.vn")) {
            userRepository.save(User.builder()
                    .fullName("Nguyễn Văn Cầu Thủ")
                    .email("player@soccerhub.vn")
                    .phone("0912345678")
                    .password(passwordEncoder.encode("player123"))
                    .role(UserRole.PLAYER)
                    .area("Quận 7, TP.HCM")
                    .level("Trung bình")
                    .position("Tiền đạo")
                    .enabled(true)
                    .build());
            log.info("Seeded demo PLAYER account: player@soccerhub.vn / player123");
        }

        if (!userRepository.existsByEmail("owner@soccerhub.vn")) {
            userRepository.save(User.builder()
                    .fullName("Trần Thị Chủ Sân")
                    .email("owner@soccerhub.vn")
                    .phone("0987654321")
                    .password(passwordEncoder.encode("owner123"))
                    .role(UserRole.OWNER)
                    .area("Quận 7, TP.HCM")
                    .level("Chủ cụm sân")
                    .enabled(true)
                    .build());
            log.info("Seeded demo OWNER account: owner@soccerhub.vn / owner123");
        }

        if (!userRepository.existsByEmail("organizer@soccerhub.vn")) {
            userRepository.save(User.builder()
                    .fullName("Lê Văn Ban Tổ Chức")
                    .email("organizer@soccerhub.vn")
                    .phone("0909876543")
                    .password(passwordEncoder.encode("organizer123"))
                    .role(UserRole.ORGANIZER)
                    .area("Quận 10, TP.HCM")
                    .level("Trưởng BTC giải")
                    .enabled(true)
                    .build());
            log.info("Seeded demo ORGANIZER account: organizer@soccerhub.vn / organizer123");
        }
    }

    private void seedTournaments() {
        // 1. Khởi tạo giải đấu thật nếu chưa có
        if (tournamentRepository.count() == 0) {
            Tournament t1 = Tournament.builder()
                    .title("SoccerHub Championship Cup 2026 - Cúp Bóng Đá Phủi Mở Rộng")
                    .description("Giải bóng đá sân 7 phủi uy tín nhất khu vực TP.HCM tranh Cúp Vàng, lưu lịch sử thi đấu và chuỗi phong độ.")
                    .sportType("SAN_7")
                    .format("KNOCKOUT")
                    .pitchName("Cụm Sân Nam Sài Gòn, Q.7")
                    .location("Quận 7, TP.HCM")
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
                            TournamentTeamEntry.builder().teamName("FC Saigon Warriors").captainName("Nguyễn Văn Hùng").captainPhone("0909111222").memberCount(14).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(3)).build(),
                            TournamentTeamEntry.builder().teamName("FC Hoàng Nam Q7").captainName("Trần Tuấn Anh").captainPhone("0909333444").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(2)).build(),
                            TournamentTeamEntry.builder().teamName("FC Lộc Phát").captainName("Phạm Đăng Khoa").captainPhone("0908555666").memberCount(13).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(1)).build()
                    )))
                    .build();

            Tournament t2 = Tournament.builder()
                    .title("Cúp Bóng Đá Mini Sân 5 Sinh Viên TP.HCM 2026")
                    .description("Sân chơi giao lưu rèn luyện thể lực và kỹ chiến thuật cho các trường Đại học và Cao đẳng toàn thành phố.")
                    .sportType("SAN_5")
                    .format("KNOCKOUT")
                    .pitchName("Cụm Sân 5A Tân Hưng, Q.7")
                    .location("Quận 7, TP.HCM")
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
                    .title("Super League Sân 11 Doanh Nghiệp TP.HCM")
                    .description("Giải đấu bóng đá sân 11 người mặt cỏ tự nhiên chuẩn quốc gia dành cho các tổ chức và doanh nghiệp lớn.")
                    .sportType("SAN_11")
                    .format("ROUND_ROBIN")
                    .pitchName("Sân Vận Động Thống Nhất / Phú Thọ")
                    .location("Quận 10, TP.HCM")
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
                    .title("Giải Futsal Giao Hữu Doanh Nghiệp TP.HCM 2026")
                    .description("Giải futsal trong nhà dành cho các đội văn phòng và doanh nghiệp, hình thức vòng tròn tính điểm nhanh gọn.")
                    .sportType("FUTSAL")
                    .format("ROUND_ROBIN")
                    .pitchName("Sân Cẩm Lệ Futsal & Sân 5")
                    .location("Quận 1, TP.HCM")
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
                    .title("Giải Phủi Khu Vực Quận 7 - Mùa 2 (Đã Kết Thúc)")
                    .description("Giải phủi khu vực Q.7 đã kết thúc, dùng để minh chứng tính năng lưu kết quả, BXH và chuỗi phong độ tự động.")
                    .sportType("SAN_7")
                    .format("KNOCKOUT")
                    .pitchName("Cụm Sân Bóng Đá Đại Nắng")
                    .location("Quận 7, TP.HCM")
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
                            TournamentTeamEntry.builder().teamName("FC Phù Đổng Q7").captainName("Nguyễn Văn An").captainPhone("0908123456").memberCount(12).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(90)).build(),
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
        final String B = "FC Phù Đổng Q7";
        final String C = "FC Thanh Đa";
        final String D = "FC Bình Thạnh";

        String pitch = "Cụm Sân 11 Ngôi Sao, Q.7";

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
        bracket.put("title", "SoccerHub Grandmaster Series 2026");
        bracket.put("drawnAt", LocalDateTime.now().minusDays(22).toString());
        bracket.put("method", "SEED_BY_REGISTERED_AT");
        bracket.put("teamCount", 4);
        bracket.put("rounds", List.of(round1, round2));

        Tournament cup = Tournament.builder()
                .title("SoccerHub Grandmaster Series 2026")
                .description("Giải đấu bốc tháng đã kết thúc — kèm nhánh đấu và lịch sử thi đấu thật để xem ngay bảng xếp hạng phong độ.")
                .sportType("SAN_7")
                .format("KNOCKOUT")
                .pitchName(pitch)
                .location("Quận 7, TP.HCM")
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

    private void seedPitches() {
        // 1b. Khởi tạo cụm sân thật nếu chưa có (màn Tìm Sân, Lịch Hoạt Động & thống kê lấy từ đây)
        if (pitchRepository.count() == 0) {
            Pitch s1 = Pitch.builder()
                    .name("Cụm Sân Bóng Đá Đại Nắng")
                    .address("154 Nguyễn Lương Bằng, P. Tân Phú, Quận 7")
                    .area("Quận 7, TP.HCM")
                    .phone("0908123456")
                    .ownerName("Sân Đại Nắng")
                    .latitude(10.7290).longitude(106.7210)
                    .avgPricePerHour(280000).peakPricePerHour(360000)
                    .rating(4.8).openTime("14:00").closeTime("23:00")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Áo bib", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80")
                    .description("Cụm 3 sân 5 và 2 sân 7 cỏ nhân tạo có mái che, phù hợp giao lưu và tổ chức giải phủi.")
                    .build();

            Pitch s2 = Pitch.builder()
                    .name("Sân Mini Phú Nhuận Arena")
                    .address("12 Phan Xích Long, P. 2, Quận Phú Nhuận")
                    .area("Q. Phú Nhuận, TP.HCM")
                    .phone("0912345678")
                    .ownerName("Arena Phú Nhuận")
                    .latitude(10.7990).longitude(106.6860)
                    .avgPricePerHour(240000).peakPricePerHour(300000)
                    .rating(4.5).openTime("06:00").closeTime("22:30")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Căn tin")))
                    .imageUrl("https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân 5 người trong nhà, mặt cỏ mới, thích hợp đá tối và dưỡng sinh sau giờ làm.")
                    .build();

            Pitch s3 = Pitch.builder()
                    .name("Cụm Sân Nam Sài Gòn")
                    .address("Khu dân cư Nam Sài Gòn, Huyện Nhà Bè")
                    .area("Huyện Nhà Bè, TP.HCM")
                    .phone("0933888999")
                    .ownerName("Nam Sài Gòn Sport")
                    .latitude(10.6830).longitude(106.7440)
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
                    .latitude(16.0180).longitude(108.2050)
                    .avgPricePerHour(180000).peakPricePerHour(230000)
                    .rating(4.4).openTime("07:00").closeTime("22:30")
                    .pitchTypes(new ArrayList<>(List.of("FUTSAL", "SAN_5")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Áo bib", "Căn tin")))
                    .imageUrl("https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân futsal trong nhà mát mẻ quanh năm, kèm 2 sân 5 ngoài trời cho giao lưu.")
                    .build();

            Pitch s6 = Pitch.builder()
                    .name("Sân 11 Thống Nhất Sport Complex")
                    .address("Số 1 Nguyễn Kim, Q. 10")
                    .area("Quận 10, TP.HCM")
                    .phone("0977888999")
                    .ownerName("Thống Nhất Complex")
                    .latitude(10.7720).longitude(106.6680)
                    .avgPricePerHour(450000).peakPricePerHour(600000)
                    .rating(5.0).openTime("06:00").closeTime("22:00")
                    .pitchTypes(new ArrayList<>(List.of("SAN_11")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Phòng thay đồ", "Khán đài", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân 11 người cỏ tự nhiên chuẩn quốc gia, sân khấu tổ chức các giải doanh nghiệp.")
                    .build();

            Pitch s7 = Pitch.builder()
                    .name("Sân Mỹ Đình Futsal Center")
                    .address("Khu liên hợp Thể thao Mỹ Đình, Nam Từ Liêm")
                    .area("Nam Từ Liêm, Hà Nội")
                    .phone("0988111222")
                    .ownerName("Mỹ Đình Futsal Center")
                    .latitude(21.0200).longitude(105.7650)
                    .avgPricePerHour(300000).peakPricePerHour(400000)
                    .rating(4.7).openTime("06:00").closeTime("23:00")
                    .pitchTypes(new ArrayList<>(List.of("FUTSAL", "SAN_5")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Phòng thay đồ", "Căn tin")))
                    .imageUrl("https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80")
                    .description("Cụm futsal chuẩn Hà Nội, hệ thống đèn LED hiện đại, mở cửa sáng sớm đến khuya.")
                    .build();

            Pitch s8 = Pitch.builder()
                    .name("Sân Bóng Trung Tâm Cần Thơ")
                    .address("200 Đường 3 Tháng 2, Ninh Kiều")
                    .area("Ninh Kiều, Cần Thơ")
                    .phone("0979333444")
                    .ownerName("Cần Thơ Sport Arena")
                    .latitude(10.0340).longitude(105.7880)
                    .avgPricePerHour(220000).peakPricePerHour(280000)
                    .rating(4.5).openTime("05:30").closeTime("22:30")
                    .pitchTypes(new ArrayList<>(List.of("SAN_5", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Nước uống", "Áo bib", "Đèn LED")))
                    .imageUrl("https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân cỏ nhân tạo ngay trung tâm Ninh Kiều, phù hợp đá sớm và giải phong trào miền Tây.")
                    .build();

            Pitch s9 = Pitch.builder()
                    .name("Sân Nha Trang Beachside Futsal")
                    .address("12 Trần Phú, Lộc Thọ")
                    .area("TP. Nha Trang, Khánh Hòa")
                    .phone("0984555666")
                    .ownerName("Beachside Futsal")
                    .latitude(12.2380).longitude(109.1960)
                    .avgPricePerHour(260000).peakPricePerHour(340000)
                    .rating(4.6).openTime("07:00").closeTime("23:00")
                    .pitchTypes(new ArrayList<>(List.of("FUTSAL", "SAN_7")))
                    .amenities(new ArrayList<>(List.of("Giữ xe", "Wifi", "Nước uống", "Phòng thay đồ")))
                    .imageUrl("https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80")
                    .description("Sân futsal ven biển Nha Trang, mát mẻ quanh năm, thường xuyên tổ chức giải tourist-friendly.")
                    .build();

            pitchRepository.saveAll(List.of(s1, s2, s3, s4, s5, s6, s7, s8, s9));
            log.info("Seeded 9 real football pitches successfully.");
        }
    }

    private void seedMatchmaking() {
        // 2. Khởi tạo các bài đăng tìm đối giao lưu bóng đá thật nếu chưa có
        if (matchmakingPostRepository.count() == 0) {
            MatchmakingPost p1 = MatchmakingPost.builder()
                    .teamName("FC Phù Đổng Q7")
                    .captainName("Nguyễn Văn An")
                    .captainPhone("0908 123 456")
                    .reputationScore(98)
                    .pitchName("Cụm Sân Bóng Đá Đại Nắng (Sân 7A)")
                    .address("Số 154 Nguyễn Lương Bằng, Phường Tân Phú, Quận 7")
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
                    .pitchName("Sân Mini Phú Nhuận Arena")
                    .address("Quận Phú Nhuận, TP.HCM")
                    .matchTime("18:30 Ngày mai")
                    .pitchType("SAN_5")
                    .paymentModel("SPLIT_EQUAL")
                    .estimatedFee(50000L)
                    .note("Tìm kèo cọ xát cho đội phong độ tương đương, anh em văn phòng đá dưỡng sinh.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(2))
                    .build();

            MatchmakingPost p3 = MatchmakingPost.builder()
                    .teamName("FC Saigon Warriors")
                    .captainName("Vũ Minh Tuấn")
                    .captainPhone("0933 888 999")
                    .reputationScore(99)
                    .pitchName("Cụm Sân Nam Sài Gòn (Sân 7 FIFA)")
                    .address("Huyện Nhà Bè, TP.HCM")
                    .matchTime("21:00 Tối mai")
                    .pitchType("SAN_7")
                    .paymentModel("LOSER_PAYS")
                    .estimatedFee(60000L)
                    .note("Kèo căng cọ xát chuẩn bị giải Cup, đội thua chịu tiền sân, mời giao lưu các đội phong độ cao.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(5))
                    .build();

            MatchmakingPost p4 = MatchmakingPost.builder()
                    .teamName("FC Quận 2 Brothers")
                    .captainName("Bùi Trọng Nhân")
                    .captainPhone("0901 222 333")
                    .reputationScore(92)
                    .pitchName("Sân Bóng Thảo Điền Mini")
                    .address("Quận 2 (TP. Thủ Đức), TP.HCM")
                    .matchTime("19:00 Thứ Sáu tuần này")
                    .pitchType("SAN_5")
                    .paymentModel("SPLIT_EQUAL")
                    .estimatedFee(40000L)
                    .note("Đội mình 8 người, cần ghép thêm vài anh em để đủ 10 đá 5 người. Vui vẻ, fairplay.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusMinutes(10))
                    .build();

            MatchmakingPost p5 = MatchmakingPost.builder()
                    .teamName("FC Cầu Giấy Phủi")
                    .captainName("Ngô Thành Đạt")
                    .captainPhone("0902 333 444")
                    .reputationScore(96)
                    .pitchName("Sân Mỹ Đình Futsal Center")
                    .address("Nam Từ Liêm, Hà Nội")
                    .matchTime("20:30 Tối nay")
                    .pitchType("FUTSAL")
                    .paymentModel("HOST_COVER")
                    .estimatedFee(0L)
                    .note("Kèo giao lưu futsal thường niên, đội nhà bao sân. Mời anh em Hà Nội ghé chơi.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(1))
                    .build();

            MatchmakingPost p6 = MatchmakingPost.builder()
                    .teamName("FC Ninh Thuận Bình Minh")
                    .captainName("Hoàng Minh Tuấn")
                    .captainPhone("0903 444 555")
                    .reputationScore(94)
                    .pitchName("Sân Thanh Niên Bình Minh")
                    .address("TP. Phan Rang - Tháp Chàm, Ninh Thuận")
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
