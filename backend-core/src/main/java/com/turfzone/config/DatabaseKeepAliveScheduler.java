package com.turfzone.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Service giữ nhịp sống (Keep-Alive Heartbeat) cho MySQL trên Railway.
 * Chạy ngầm định kỳ cứ mỗi 4 phút (240.000 ms) để gửi 1 câu truy vấn nhẹ (SELECT 1).
 * Mục đích: Tạo traffic định kỳ tới MySQL để Railway không đưa container MySQL vào giấc ngủ (Sleeping).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseKeepAliveScheduler {

    private final DataSource dataSource;

    // Chạy mỗi 4 phút (240 giây), bắt đầu 1 phút sau khi server khởi động
    @Scheduled(initialDelay = 60000, fixedRate = 240000)
    public void keepDatabaseAlive() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {
            if (rs.next()) {
                log.debug("[Keep-Alive] MySQL heartbeat ping thành công (giữ MySQL luôn thức).");
            }
        } catch (Exception e) {
            log.warn("[Keep-Alive] MySQL ping cảnh báo: {}", e.getMessage());
        }
    }
}
