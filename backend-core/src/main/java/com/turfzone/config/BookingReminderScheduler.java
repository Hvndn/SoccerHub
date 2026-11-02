package com.turfzone.config;

import com.turfzone.model.Booking;
import com.turfzone.model.User;
import com.turfzone.repository.BookingRepository;
import com.turfzone.repository.NotificationRepository;
import com.turfzone.repository.UserRepository;
import com.turfzone.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Scheduler nhac nhat gio dat san truoc gio dat (Feature: NGUYEN NIEM THONG BAO).
 * <p>
 * Moi 5 phut, quet cac booking co trang thai BOOKED, tinh thoi gian bat dau cua ca
 * (parse tu timeSlot "HH:mm - HH:mm" + bookingDate "YYYY-MM-DD") va gui thong bao
 * nhac nhat (type=BOOKING_REMINDER) cho toan boi danh sach dat san that hon hoac
 * trong cua 24h toi gio dat.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingReminderScheduler {

    private static final String REMINDER_TYPE = "BOOKING_REMINDER";
    private static final int REMINDER_WINDOW_HOURS = 24;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 */5 * * * *")
    public void sendBookingReminders() {
        LocalDateTime now = LocalDateTime.now();
        log.info("[BookingReminder] Scheduler fired, now={}", now);
        List<Booking> upcoming = bookingRepository.findByStatus("BOOKED");
        if (upcoming == null || upcoming.isEmpty()) {
            return;
        }
        for (Booking b : upcoming) {
            LocalDateTime start = resolveStartTime(b);
            if (start == null) {
                continue;
            }
            // Chi nhac nhat khi gio dat o trong tuong lai, nho hon 24h.
            if (start.isBefore(now) || start.isAfter(now.plusHours(REMINDER_WINDOW_HOURS))) {
                continue;
            }
            List<User> users = userRepository.findUsersByPhone(b.getCustomerPhone());
            User u = null;
            if (users != null && !users.isEmpty()) {
                u = users.stream()
                        .filter(x -> x.getRole() != null && "PLAYER".equals(x.getRole().name()))
                        .findFirst()
                        .orElse(users.get(0));
            }
            if (u == null || u.getEmail() == null) {
                continue; // Khong tim thay tai khoan user -> bo qua.
            }
            boolean alreadySent = notificationRepository.existsByTargetEmailAndTypeAndMessageContaining(
                    u.getEmail(), REMINDER_TYPE, b.getCode());
            if (alreadySent) {
                continue; // Da gui roi -> khong gui nua.
            }
            notificationService.notify("PLAYER", u.getEmail(),
                    "⏰ Nhắc nhật giờ đá",
                    "Ban co lich dat san " + b.getCourtName() + " vao " + b.getBookingDate()
                            + " (" + b.getTimeSlot() + "). Vui long den dung gio de giu cho.",
                    REMINDER_TYPE, "/pitches/" + b.getPitchId());

            log.info("[BookingReminder] Da gui nhac nhat gio dat san cho email={} (bookingId={}, start={})",
                    u.getEmail(), b.getId(), start);
        }
    }

    /** Parse thoi gian bat dau cua ca tu timeSlot "HH:mm - HH:mm" + bookingDate "YYYY-MM-DD". */
    private LocalDateTime resolveStartTime(Booking b) {
        if (b == null || b.getTimeSlot() == null || b.getBookingDate() == null) {
            return null;
        }
        try {
            String startStr = b.getTimeSlot().split("-")[0].trim();
            LocalDate d = LocalDate.parse(b.getBookingDate());
            return d.atTime(LocalTime.parse(startStr));
        } catch (Exception e) {
            log.warn("[BookingReminder] Khong the parse timeSlot={} cua bookingId={}", b.getTimeSlot(), b.getId());
            return null;
        }
    }
}
