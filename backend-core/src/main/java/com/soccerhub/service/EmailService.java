package com.soccerhub.service;

import com.soccerhub.model.Booking;
import com.soccerhub.model.Pitch;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Gửi email hệ thống.
 *
 * <p>Nguyên tắc quan trọng: <b>gửi email KHÔNG được làm hỏng thao tác chính</b>.
 * Nếu SMTP chưa cấu hình hoặc gửi lỗi, chỉ ghi log cảnh báo — đơn đặt sân vẫn được
 * tạo bình thường, người dùng không bị mất dữ liệu vì lỗi email.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.enabled:false}")
    private boolean enabled;

    @Value("${mail.from:no-reply@soccerhub.vn}")
    private String from;

    @Value("${mail.from-name:SoccerHub}")
    private String fromName;

    /** Email có hợp lệ để gửi không (chặn rỗng / sai định dạng cơ bản). */
    public static boolean isValidEmail(String email) {
        return email != null && email.trim().matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Có thể gửi email không (đã bật + có cấu hình SMTP). */
    public boolean isReady() {
        return enabled && mailSender != null;
    }

    private static String money(Integer v) {
        int x = v == null ? 0 : v;
        return String.format("%,d", x) + "đ";
    }

    /** Bọc nội dung HTML an toàn (escape ký tự động từ dữ liệu người dùng). */
    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    // =====================================================================
    //  1. Xác nhận đặt sân -> gửi về Gmail của KHÁCH
    // =====================================================================

    /**
     * Gửi email xác nhận cho khách đặt sân.
     *
     * @return true nếu gửi thành công; false nếu không gửi được (không ném exception)
     */
    public boolean sendBookingConfirmationToCustomer(Booking b, Pitch pitch, String toEmail) {
        if (!isReady() || !isValidEmail(toEmail)) {
            if (enabled) log.warn("[Email] Dia chi khong hop le: {}", toEmail);
            return false;
        }
        String pitchName = pitch != null ? pitch.getName() : "Cụm sân";
        String pitchAddr = pitch != null && pitch.getAddress() != null ? pitch.getAddress() : "";
        String when = esc(b.getBookingDate()) + " — " + esc(b.getTimeSlot());
        String code = b.getCode() != null ? b.getCode() : "—";
        int total = b.getTotalPrice() != null ? b.getTotalPrice() : 0;
        int deposit = b.getDepositPaid() != null ? b.getDepositPaid() : 0;
        int cash = b.getCashDue() != null ? b.getCashDue() : 0;

        String html =
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:620px;margin:0 auto;"
                        + "border:1px solid #e2e8f0;border-radius:16px;overflow:hidden\">"
                        + "  <div style=\"background:#0369a1;color:#fff;padding:20px 24px\">"
                        + "    <h2 style=\"margin:0;font-size:19px\">Đặt sân thành công ✅</h2>"
                        + "    <p style=\"margin:6px 0 0;font-size:13px;opacity:.9\">Cảm ơn bạn đã đặt sân tại SoccerHub</p>"
                        + "  </div>"
                        + "  <div style=\"padding:22px 24px;color:#0f172a;font-size:14px;line-height:1.7\">"
                        + "    <p style=\"margin:0 0 14px\">Chào <strong>" + esc(b.getCustomerName()) + "</strong>,</p>"
                        + "    <p style=\"margin:0 0 16px\">Lịch của bạn đã được giữ thành công. Vui lòng đến sân đúng giờ và mang theo mã đơn để check-in.</p>"
                        + "    <table style=\"width:100%;border-collapse:collapse;font-size:13.5px\">"
                        + "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Cụm sân</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700\">" + esc(pitchName) + "</td></tr>"
                        + (pitchAddr.isEmpty() ? "" :
                        "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Địa chỉ</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right\">" + esc(pitchAddr) + "</td></tr>")
                        + "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Sân</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700\">" + esc(b.getCourtName()) + "</td></tr>"
                        + "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Thời gian</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700\">" + when + "</td></tr>"
                        + "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Mã đơn</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-family:Consolas,monospace;font-weight:700;color:#0369a1\">" + esc(code) + "</td></tr>"
                        + "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Tổng tiền</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right\">" + money(total) + "</td></tr>"
                        + "      <tr><td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;color:#64748b\">Đã cọc</td>"
                        + "          <td style=\"padding:8px 0;border-bottom:1px solid #f1f5f9;text-align:right;color:#059669\">" + money(deposit) + "</td></tr>"
                        + "      <tr><td style=\"padding:8px 0;color:#64748b\">Còn lại tại quầy</td>"
                        + "          <td style=\"padding:8px 0;text-align:right;font-weight:700;color:#ea580c\">" + money(cash) + "</td></tr>"
                        + "    </table>"
                        + "    <p style=\"margin:18px 0 0;padding:12px 14px;background:#f0f9ff;border-left:3px solid #0369a1;"
                        + "border-radius:8px;font-size:12.5px;color:#334155\">"
                        + "      Hủy miễn phí trước <strong>2 giờ</strong> trước giờ thi đấu. Vui lòng thông báo cho chủ sân nếu có thay đổi."
                        + "    </p>"
                        + "    <p style=\"margin:20px 0 0;font-size:12px;color:#94a3b8;text-align:center\">"
                        + "      Email tự động từ SoccerHub — vui lòng không trả lời trực tiếp.</p>"
                        + "  </div>"
                        + "</div>";

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, StandardCharsets.UTF_8.name());
            h.setFrom(from, fromName);
            h.setTo(toEmail);
            h.setSubject("✅ Xác nhận đặt sân " + (b.getCourtName() != null ? b.getCourtName() : "") + " ngày " + b.getBookingDate() + " — Mã " + code);
            h.setText(html, true);
            mailSender.send(msg);
            log.info("[Email] Da gui xac nhan dat san cho {}", toEmail);
            return true;
        } catch (MailException | MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("[Email] Khong gui duoc xac nhan toi {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // =====================================================================
    //  2. Báo cho CHỦ SÂN khi có đơn mới
    // =====================================================================

    public boolean sendNewBookingToOwner(Booking b, Pitch pitch, String toEmail) {
        if (!isReady() || !isValidEmail(toEmail)) return false;
        String pitchName = pitch != null ? pitch.getName() : "Cụm sân";
        String code = b.getCode() != null ? b.getCode() : "—";
        int deposit = b.getDepositPaid() != null ? b.getDepositPaid() : 0;

        String html =
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;"
                        + "border:1px solid #e2e8f0;border-radius:16px;overflow:hidden\">"
                        + "  <div style=\"background:#065f46;color:#fff;padding:18px 22px\">"
                        + "    <h2 style=\"margin:0;font-size:18px\">Có đơn đặt sân mới</h2>"
                        + "  </div>"
                        + "  <div style=\"padding:20px 22px;color:#0f172a;font-size:14px;line-height:1.7\">"
                        + "    <p style=\"margin:0 0 12px\"><strong>" + esc(b.getCustomerName()) + "</strong> vừa đặt ca tại "
                        + esc(pitchName) + ".</p>"
                        + "    <ul style=\"margin:0;padding-left:20px;color:#334155\">"
                        + "      <li>Sân: <strong>" + esc(b.getCourtName()) + "</strong></li>"
                        + "      <li>Thời gian: <strong>" + esc(b.getBookingDate()) + " — " + esc(b.getTimeSlot()) + "</strong></li>"
                        + "      <li>Tiền cọc: <strong>" + money(deposit) + "</strong></li>"
                        + "      <li>SĐT khách: <strong>" + esc(b.getCustomerPhone()) + "</strong></li>"
                        + "      <li>Mã đơn: <strong style=\"font-family:Consolas,monospace;color:#0369a1\">" + esc(code) + "</strong></li>"
                        + "    </ul>"
                        + "  </div>"
                        + "</div>";

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, StandardCharsets.UTF_8.name());
            h.setFrom(from, fromName);
            h.setTo(toEmail);
            h.setSubject("🔔 Đơn đặt sân mới tại " + pitchName);
            h.setText(html, true);
            mailSender.send(msg);
            return true;
        } catch (MailException | MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("[Email] Khong gui duoc thong bao den chu san {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // =====================================================================
    //  3. Gửi BÁO CÁO (file CSV đính kèm) cho chủ sân
    // =====================================================================

    /**
     * Gửi báo cáo kèm file CSV đính kèm.
     *
     * @param toEmail địa chỉ nhận
     * @param subject  tiêu đề
     * @param csvBody  nội dung CSV
     * @param filename tên file đính kèm
     * @return true nếu gửi thành công
     */
    public boolean sendReport(String toEmail, String subject, String csvBody, String filename) {
        if (!isReady() || !isValidEmail(toEmail)) {
            if (enabled) log.warn("[Email] Khong gui duoc bao cao: dia chi khong hop le '{}'", toEmail);
            return false;
        }
        String html =
                "<div style=\"font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto\">"
                        + "<div style=\"background:#0369a1;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0\">"
                        + "<h2 style=\"margin:0;font-size:18px\">" + esc(subject) + "</h2></div>"
                        + "<div style=\"border:1px solid #e2e8f0;border-top:0;padding:20px 22px;border-radius:0 0 14px 14px;"
                        + "color:#0f172a;font-size:14px;line-height:1.7\">"
                        + "<p style=\"margin:0 0 12px\">Báo cáo được đính kèm trong email này dưới dạng file CSV.</p>"
                        + "<p style=\"margin:0;padding:12px 14px;background:#f0f9ff;border-left:3px solid #0369a1;border-radius:8px;"
                        + "font-size:12.5px;color:#334155\">Mở file bằng Microsoft Excel hoặc Google Sheets để xem bảng tính.</p>"
                        + "<p style=\"margin:16px 0 0;font-size:12px;color:#94a3b8\">Tự động gửi từ hệ thống SoccerHub.</p>"
                        + "</div></div>";

        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true, StandardCharsets.UTF_8.name());
            h.setFrom(from, fromName);
            h.setTo(toEmail);
            h.setSubject(subject);
            h.setText(html, true);

            // Đính kèm CSV kèm BOM để Excel hiển thị tiếng Việt đúng dấu
            byte[] bytes = ("﻿" + (csvBody == null ? "" : csvBody)).getBytes(StandardCharsets.UTF_8);
            h.addAttachment(filename == null ? "bao-cao.csv" : filename,
                    new ByteArrayResource(bytes), "text/csv");

            mailSender.send(msg);
            log.info("[Email] Da gui bao cao '{}' toi {}", filename, toEmail);
            return true;
        } catch (MailException | MessagingException | java.io.UnsupportedEncodingException e) {
            log.warn("[Email] Khong gui duoc bao cao toi {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
