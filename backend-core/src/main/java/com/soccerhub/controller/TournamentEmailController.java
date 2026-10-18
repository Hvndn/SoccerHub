package com.soccerhub.controller;

import com.soccerhub.model.Tournament;
import com.soccerhub.model.TournamentTeamEntry;
import com.soccerhub.repository.TournamentRepository;
import com.soccerhub.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

/**
 * Email thông báo tự động cho Ban Tổ Chức giải đấu.
 *
 * <p>Các sự kiện: duyệt đội, từ chối đội, lên lịch trận, nhập kết quả.
 * Gửi email KHÔNG được làm hỏng thao tác chính (lỗi chỉ ghi log).</p>
 */
@RestController
@RequestMapping("/api/v1/tournaments")
@RequiredArgsConstructor
public class TournamentEmailController {

    private final TournamentRepository tournamentRepository;
    private final EmailService emailService;

    /** Gửi email cho đội trưởng khi được duyệt vào giải. */
    @PostMapping("/{id}/notify-team/approve")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> notifyTeamApproved(
            @PathVariable Long id,
            @RequestParam String teamName,
            @AuthenticationPrincipal com.soccerhub.model.User me) {

        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        TournamentTeamEntry team = null;
        for (TournamentTeamEntry e : t.getTeams()) {
            if (e.getTeamName() != null && e.getTeamName().equals(teamName)) { team = e; break; }
        }
        if (team == null) return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy đội."));

        String to = team.getCaptainEmail();
        if (!EmailService.isValidEmail(to)) {
            return ResponseEntity.ok(Map.of("message", "Đội không có email hợp lệ — không gửi được thông báo."));
        }

        String html =
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden\">"
                        + "  <div style=\"background:#0369a1;color:#fff;padding:18px 22px\">"
                        + "    <h2 style=\"margin:0;font-size:18px\">Bạn đã được duyệt vào giải ✅</h2>"
                        + "  </div>"
                        + "  <div style=\"padding:20px 22px;color:#0f172a;font-size:14px;line-height:1.7\">"
                        + "    <p>Xin chào <strong>" + esc(team.getCaptainName()) + "</strong>,</p>"
                        + "    <p>Đội <strong>" + esc(teamName) + "</strong> của bạn đã được duyệt vào giải:</p>"
                        + "    <p style=\"font-weight:700;color:#0369a1\">" + esc(t.getTitle()) + "</p>"
                        + "    <ul style=\"margin:0;padding-left:20px;color:#334155\">"
                        + "      <li>Sân thi đấu: " + esc(t.getPitchName()) + "</li>"
                        + "      <li>Thời gian: " + esc(t.getStartDate()) + " → " + esc(t.getEndDate()) + "</li>"
                        + "      <li>Số đội: " + t.getRegisteredTeams() + " / " + t.getTotalTeams() + "</li>"
                        + "    </ul>"
                        + "    <p style=\"margin:16px 0 0;font-size:12.5px;color:#64748b\">"
                        + "      Vui lòng theo dõi lịch thi đấu trên hệ thống. Chúc đội thi đấu tốt!</p>"
                        + "  </div>"
                        + "</div>";

        boolean sent = sendHtml(to, "Bạn đã được duyệt vào giải " + t.getTitle(), html);
        return ResponseEntity.ok(Map.of(
                "message", sent ? "Đã gửi email thông báo cho đội " + teamName + "."
                        : "Không gửi được email (SMTP chưa bật hoặc lỗi).",
                "sent", sent));
    }

    /** Gửi email cho đội khi bị từ chối. */
    @PostMapping("/{id}/notify-team/reject")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> notifyTeamRejected(
            @PathVariable Long id,
            @RequestParam String teamName,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal com.soccerhub.model.User me) {

        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));

        String r = (reason == null || reason.isBlank()) ? "Giải đã đủ số lượng đội đăng ký." : reason.trim();
        // Tìm email đội trưởng từ DB
        String to = null;
        for (TournamentTeamEntry e : t.getTeams()) {
            if (e.getTeamName() != null && e.getTeamName().equals(teamName)) { to = e.getCaptainEmail(); break; }
        }
        // Nếu không tìm được trong giải (đã xoá) thì bỏ qua
        if (!EmailService.isValidEmail(to)) {
            return ResponseEntity.ok(Map.of("message", "Đội không có email hợp lệ — không gửi được thông báo."));
        }

        String html =
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden\">"
                        + "  <div style=\"background:#dc2626;color:#fff;padding:18px 22px\">"
                        + "    <h2 style=\"margin:0;font-size:18px\">Thông báo kết quả đăng ký giải</h2>"
                        + "  </div>"
                        + "  <div style=\"padding:20px 22px;color:#0f172a;font-size:14px;line-height:1.7\">"
                        + "    <p>Xin chào,</p>"
                        + "    <p>Rất tiếc, đội <strong>" + esc(teamName) + "</strong> không được duyệt tham gia giải "
                        + "<strong>" + esc(t.getTitle()) + "</strong>.</p>"
                        + "    <p style=\"padding:12px 14px;background:#fef2f2;border-left:3px solid #dc2626;border-radius:8px;"
                        + "font-size:12.5px;color:#334155\"><strong>Lý do:</strong> " + esc(r) + "</p>"
                        + "    <p style=\"margin:16px 0 0;font-size:12.5px;color:#64748b\">"
                        + "      Bạn có thể đăng ký giải đấu khác trên SoccerHub. Chúc đội thi đấu tốt!</p>"
                        + "  </div>"
                        + "</div>";

        boolean sent = sendHtml(to, "Thông báo kết quả đăng ký giải " + t.getTitle(), html);
        return ResponseEntity.ok(Map.of("message", sent ? "Đã gửi email thông báo cho đội." : "Không gửi được email.",
                "sent", sent));
    }

    /** Gửi email cho TẤT CẢ đội trong giải khi lịch thi đấu mới được công bố. */
    @PostMapping("/{id}/notify-schedule")
    @PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
    public ResponseEntity<?> notifySchedule(
            @PathVariable Long id,
            @AuthenticationPrincipal com.soccerhub.model.User me) {

        Tournament t = tournamentRepository.findById(id).orElse(null);
        if (t == null) return ResponseEntity.badRequest().body(Map.of("message", "Giải đấu không tồn tại"));
        if (t.getBracketJson() == null || t.getBracketJson().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Giải chưa bốc thăm, chưa có lịch thi đấu."));
        }

        int sent = 0, skipped = 0;
        Map<String, String> emails = new LinkedHashMap<>();
        for (TournamentTeamEntry e : t.getTeams()) {
            if (e.getCaptainEmail() != null && EmailService.isValidEmail(e.getCaptainEmail())) {
                emails.putIfAbsent(e.getCaptainEmail(), e.getCaptainName());
            }
        }

        String html =
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden\">"
                        + "  <div style=\"background:#0369a1;color:#fff;padding:18px 22px\">"
                        + "    <h2 style=\"margin:0;font-size:18px\">Lịch thi đấu giải " + esc(t.getTitle()) + "</h2>"
                        + "  </div>"
                        + "  <div style=\"padding:20px 22px;color:#0f172a;font-size:14px;line-height:1.7\">"
                        + "    <p>Ban Tổ Chức đã công bố lịch thi đấu. Vui lòng đăng nhập vào SoccerHub để xem chi tiết nhánh đấu, ngày/giờ/sân của từng trận.</p>"
                        + "    <ul style=\"margin:0;padding-left:20px;color:#334155\">"
                        + "      <li>Giải: <strong>" + esc(t.getTitle()) + "</strong></li>"
                        + "      <li>Sân: " + esc(t.getPitchName()) + "</li>"
                        + "      <li>Thời gian: " + esc(t.getStartDate()) + " → " + esc(t.getEndDate()) + "</li>"
                        + "      <li>Số đội: " + t.getRegisteredTeams() + " / " + t.getTotalTeams() + "</li>"
                        + "    </ul>"
                        + "    <p style=\"margin:16px 0 0;font-size:12.5px;color:#64748b\">Chúc đội thi đấu tốt và Fairplay!</p>"
                        + "  </div>"
                        + "</div>";

        for (Map.Entry<String, String> en : emails.entrySet()) {
            if (emailService.sendHtmlDirect(en.getKey(), "Lịch thi đấu giải " + t.getTitle(), html)) sent++;
            else skipped++;
        }

        return ResponseEntity.ok(Map.of(
                "message", "Đã gửi email lịch thi đấu tới " + emails.size() + " đội.",
                "sent", sent,
                "skipped", skipped));
    }

    /** Gửi email HTML chung. Trả true nếu thành công. */
    private boolean sendHtml(String to, String subject, String html) {
        if (!EmailService.isValidEmail(to)) return false;
        // Dùng reflection-free: gọi EmailService qua bean injected? Service là @Service singleton.
        // Ở đây dùng static helper — nhưng EmailService cần mailSender. Vì vậy inject vào controller.
        return emailService.sendHtmlDirect(to, subject, html);
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}