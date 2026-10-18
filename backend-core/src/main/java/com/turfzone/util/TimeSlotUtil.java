package com.turfzone.util;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Sinh danh sách khung giờ (ca) của một cụm sân.
 * Tách ra khỏi controller để dùng chung cho ma trận ca sân và báo cáo doanh thu,
 * tránh mỗi nơi tự tính khác nhau.
 */
public final class TimeSlotUtil {

    private TimeSlotUtil() {
    }

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private static final List<String> FALLBACK =
            List.of("14:00 - 16:00", "16:00 - 18:00", "18:00 - 20:00", "20:00 - 22:00");

    public static List<String> generate(String openTime, String closeTime, int durationMinutes) {
        List<String> slots = new ArrayList<>();
        try {
            String startStr = (openTime != null && !openTime.trim().isEmpty()) ? openTime.trim() : "14:00";
            String endStr = (closeTime != null && !closeTime.trim().isEmpty()) ? closeTime.trim() : "22:30";

            if (!startStr.contains(":")) startStr = startStr + ":00";
            if (!endStr.contains(":")) endStr = endStr + ":00";

            LocalTime current = LocalTime.parse(startStr, HHMM);
            LocalTime end = LocalTime.parse(endStr, HHMM);
            int duration = durationMinutes > 0 ? durationMinutes : 120;

            int guard = 50;
            while (current.plusMinutes(duration).compareTo(end) <= 0 && guard-- > 0) {
                LocalTime next = current.plusMinutes(duration);
                if (next.compareTo(current) <= 0) break; // qua nửa đêm thì dừng
                slots.add(current.format(HHMM) + " - " + next.format(HHMM));
                current = next;
            }
        } catch (Exception ignored) {
            return FALLBACK;
        }
        return slots.isEmpty() ? FALLBACK : slots;
    }

    /** Số khung giờ trong một ngày của cụm sân. */
    public static int slotsPerDay(String openTime, String closeTime, int durationMinutes) {
        return generate(openTime, closeTime, durationMinutes).size();
    }
}