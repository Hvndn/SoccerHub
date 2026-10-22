package com.turfzone.util;

import com.turfzone.model.Booking;

/**
 * Cong thuc DOANH THU thong nhat cho toan he thong.
 *
 * <p>Doanh thu = tien coc (da thu online qua VietQR) + tien mat da thu tai quay.
 * Chi tinh don khong bi huy. Truoc day moi endpoint dung cong thuc rieng nen
 * /admin/overview bao loi doanh thu khac voi /admin/revenue-report; them vao
 * check-in lai gan cashDue = 0 nen tien mat thuoc tai quay bi mat sach.</p>
 */
public final class RevenueUtil {

    private RevenueUtil() {
    }

    /** Doanh thu thuoc ve cua 1 don (0 neu don da huy). */
    public static int settledRevenue(Booking b) {
        if (b == null) return 0;
        String status = b.getStatus() == null ? "BOOKED" : b.getStatus();
        if ("CANCELLED".equals(status)) return 0;
        int deposit = b.getDepositPaid() != null ? b.getDepositPaid() : 0;
        int cash = 0;
        if ("PLAYING".equals(status) || "COMPLETED".equals(status)) {
            if (b.getCashCollected() != null) {
                cash = b.getCashCollected();
            } else {
                // Don cu (truoc khi co truong cashCollected): phan con lai = tien da thu.
                cash = b.getCashDue() != null ? b.getCashDue() : 0;
            }
        }
        return deposit + cash;
    }
}
