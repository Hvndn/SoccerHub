package com.soccerhub.config;

import com.soccerhub.model.MatchmakingPost;
import com.soccerhub.model.Tournament;
import com.soccerhub.model.TournamentTeamEntry;
import com.soccerhub.model.User;
import com.soccerhub.model.UserRole;
import com.soccerhub.repository.MatchmakingPostRepository;
import com.soccerhub.repository.PitchRepository;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PitchRepository pitchRepository;
    private final TournamentRepository tournamentRepository;
    private final MatchmakingPostRepository matchmakingPostRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Checking & seeding real Football Tournaments and Matchmaking data...");

        // 0. Tài khoản Super Admin mặc định (dùng để vào trang /admin)
        if (!userRepository.existsByEmail("admin@soccerhub.vn")) {
            User admin = User.builder()
                    .fullName("Quản Trị Hệ Thống")
                    .email("admin@soccerhub.vn")
                    .phone("0900000001")
                    .password(passwordEncoder.encode("admin123"))
                    .role(UserRole.ADMIN)
                    .area("TP.HCM")
                    .level("Quản trị viên")
                    .eloRating(1500)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Seeded default ADMIN account: admin@soccerhub.vn / admin123");
        }

        // 1. Khởi tạo giải đấu thật nếu chưa có
        if (tournamentRepository.count() == 0) {
            Tournament t1 = Tournament.builder()
                    .title("SoccerHub Championship Cup 2026 - Cúp Bóng Đá Phủi Mở Rộng")
                    .description("Giải bóng đá sân 7 phủi uy tín nhất khu vực TP.HCM tranh Cúp Vàng và tính điểm hệ thống Elo VFF.")
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
                            TournamentTeamEntry.builder().teamName("FC Saigon Warriors").captainName("Nguyễn Văn Hùng").captainPhone("0909111222").memberCount(14).eloRating(1580).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(3)).build(),
                            TournamentTeamEntry.builder().teamName("FC Hoàng Nam Q7").captainName("Trần Tuấn Anh").captainPhone("0909333444").memberCount(12).eloRating(1490).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(2)).build(),
                            TournamentTeamEntry.builder().teamName("FC Lộc Phát").captainName("Phạm Đăng Khoa").captainPhone("0908555666").memberCount(13).eloRating(1520).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(1)).build()
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
                            TournamentTeamEntry.builder().teamName("FC Bách Khoa").captainName("Lê Hoàng Minh").captainPhone("0912111333").memberCount(10).eloRating(1380).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(5)).build(),
                            TournamentTeamEntry.builder().teamName("FC Kinh Tế").captainName("Nguyễn Quốc Bảo").captainPhone("0913222444").memberCount(10).eloRating(1350).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(4)).build()
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
                            TournamentTeamEntry.builder().teamName("FC Tech Titans").captainName("Đặng Ngọc Long").captainPhone("0977888999").memberCount(18).eloRating(1450).registrationStatus("CONFIRMED").registeredAt(LocalDateTime.now().minusDays(1)).build()
                    )))
                    .build();

            tournamentRepository.saveAll(List.of(t1, t2, t3));
            log.info("Seeded 3 real football tournaments successfully.");
        }

        // 2. Khởi tạo các bài đăng tìm đối giao lưu bóng đá thật nếu chưa có
        if (matchmakingPostRepository.count() == 0) {
            MatchmakingPost p1 = MatchmakingPost.builder()
                    .teamName("FC Phù Đổng Q7")
                    .captainName("Nguyễn Văn An")
                    .captainPhone("0908 123 456")
                    .eloRating(1350)
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
                    .eloRating(1210)
                    .reputationScore(95)
                    .pitchName("Sân Mini Phú Nhuận Arena")
                    .address("Quận Phú Nhuận, TP.HCM")
                    .matchTime("18:30 Ngày mai")
                    .pitchType("SAN_5")
                    .paymentModel("SPLIT_EQUAL")
                    .estimatedFee(50000L)
                    .note("Tìm kèo cọ xát nâng trình Elo Serie C, anh em văn phòng đá dưỡng sinh.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(2))
                    .build();

            MatchmakingPost p3 = MatchmakingPost.builder()
                    .teamName("FC Saigon Warriors")
                    .captainName("Vũ Minh Tuấn")
                    .captainPhone("0933 888 999")
                    .eloRating(1520)
                    .reputationScore(99)
                    .pitchName("Cụm Sân Nam Sài Gòn (Sân 7 FIFA)")
                    .address("Huyện Nhà Bè, TP.HCM")
                    .matchTime("21:00 Tối mai")
                    .pitchType("SAN_7")
                    .paymentModel("LOSER_PAYS")
                    .estimatedFee(60000L)
                    .note("Kèo căng cọ xát chuẩn bị giải Cup, đội thua chịu tiền sân, mời giao lưu các đội Elo 1450+.")
                    .status("OPEN")
                    .createdAt(LocalDateTime.now().minusHours(5))
                    .build();

            matchmakingPostRepository.saveAll(List.of(p1, p2, p3));
            log.info("Seeded 3 real football matchmaking posts successfully.");
        }
    }
}
