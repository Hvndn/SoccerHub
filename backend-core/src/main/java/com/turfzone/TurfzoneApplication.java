package com.turfzone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TurfzoneApplication {

    public static void main(String[] args) {
        configureRailwayMysqlUrl();
        verifyOrFallbackDatabase();
        logDatasourceDiagnostics();
        SpringApplication.run(TurfzoneApplication.class, args);
    }

    /**
     * Tự động nhận diện biến MYSQL_URL hoặc DATABASE_URL do Railway / Render cung cấp
     * (thường có format mysql://user:pass@host:port/dbname) và chuyển đổi sang chuẩn
     * spring.datasource.* của Spring Boot để không bị lỗi kết nối hoặc thiếu JDBC scheme.
     */
    private static void configureRailwayMysqlUrl() {
        String springDsUrl = getenv("SPRING_DATASOURCE_URL");
        if (isSet(springDsUrl)) {
            if (springDsUrl.startsWith("mysql://")) {
                convertAndSetMysqlUrl(springDsUrl);
            }
            return;
        }
        String rawUrl = firstNonBlank(getenv("MYSQL_URL"), getenv("MYSQLURL"), getenv("DATABASE_URL"));
        if (isSet(rawUrl) && rawUrl.startsWith("mysql://")) {
            convertAndSetMysqlUrl(rawUrl);
        }
    }

    private static void convertAndSetMysqlUrl(String rawUrl) {
        try {
            java.net.URI uri = new java.net.URI(rawUrl);
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 3306;
            String path = uri.getPath();
            String database = (path != null && path.length() > 1) ? path.substring(1) : "railway";

            String userInfo = uri.getUserInfo();
            String user = null;
            String pass = null;
            if (userInfo != null && userInfo.contains(":")) {
                String[] parts = userInfo.split(":", 2);
                user = parts[0];
                pass = parts[1];
            } else if (userInfo != null) {
                user = userInfo;
            }

            String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + database + "?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&connectTimeout=15000&socketTimeout=60000";
            System.setProperty("spring.datasource.url", jdbcUrl);
            if (user != null) System.setProperty("spring.datasource.username", user);
            if (pass != null) System.setProperty("spring.datasource.password", pass);
            System.out.println("[Turfzone] [Railway] Tự động chuyển đổi MYSQL_URL (" + host + ":" + port + "/" + database + ") sang Spring JDBC!");
        } catch (Exception e) {
            System.err.println("[Turfzone] [Railway] Cảnh báo lỗi phân giải MYSQL_URL: " + e.getMessage());
        }
    }

    /**
     * KIỂM TRA TÍNH SẴN SÀNG CỦA DATABASE TRƯỚC KHI SPRING BOOT KHỞI TẠO:
     * Nếu MySQL trên cloud (Railway) đang ngủ (Sleeping) hoặc không thể kết nối trong 5 giây,
     * tự động chuyển sang H2 in-memory DB ("jdbc:h2:mem:Turfzone_db;DB_CLOSE_DELAY=-1;MODE=MySQL")
     * để backend-core KHÔNG BAO GIỜ BỊ CRASH, luôn mở cổng $PORT cho Railway Healthcheck thành công!
     */
    private static void verifyOrFallbackDatabase() {
        String dbUrl = System.getProperty("spring.datasource.url", getenv("SPRING_DATASOURCE_URL"));
        String host = getenv("MYSQLHOST");
        String portStr = firstNonBlank(getenv("MYSQLPORT"), "3306");

        String targetHost = "localhost";
        int targetPort = 3306;

        if (isSet(dbUrl) && dbUrl.startsWith("jdbc:mysql://")) {
            try {
                String clean = dbUrl.replace("jdbc:mysql://", "");
                int slashIdx = clean.indexOf('/');
                if (slashIdx > 0) clean = clean.substring(0, slashIdx);
                int qIdx = clean.indexOf('?');
                if (qIdx > 0) clean = clean.substring(0, qIdx);
                if (clean.contains(":")) {
                    String[] parts = clean.split(":");
                    targetHost = parts[0];
                    targetPort = Integer.parseInt(parts[1]);
                } else {
                    targetHost = clean;
                }
            } catch (Exception ignored) {}
        } else if (isSet(host)) {
            targetHost = host;
            try { targetPort = Integer.parseInt(portStr); } catch (Exception ignored) {}
        } else {
            // Không có cấu hình DB nào trên production
            if (isSet(getenv("PORT")) || isSet(getenv("RAILWAY_ENVIRONMENT"))) {
                enableH2Fallback("Chưa có cấu hình biến môi trường kết nối MySQL trên Railway.");
                return;
            }
        }

        // Thử kết nối TCP tới MySQL với cơ chế retry (đợi MySQL cloud thức dậy nếu đang Sleeping)
        boolean isConnected = false;
        int maxAttempts = 5;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try (java.net.Socket socket = new java.net.Socket()) {
                System.out.println("[Turfzone] Đang kiểm tra kết nối tới MySQL (" + targetHost + ":" + targetPort + ") - Lần thử " + attempt + "/" + maxAttempts + "...");
                socket.connect(new java.net.InetSocketAddress(targetHost, targetPort), 6000);
                isConnected = true;
                System.out.println("[Turfzone] ✅ Kết nối MySQL THÀNH CÔNG! Sử dụng MySQL cloud lưu trữ lâu dài.");
                break;
            } catch (Exception e) {
                System.out.println("[Turfzone] ⚠️ Lần " + attempt + " chưa kết nối được (" + e.getMessage() + "), đợi 3 giây...");
                try { Thread.sleep(3000); } catch (InterruptedException ignored) {}
            }
        }

        if (!isConnected) {
            System.err.println("[Turfzone] ⚠️ CẢNH BÁO: Không thể kết nối tới MySQL sau 5 lần thử.");
            // Chỉ fallback H2 khi thật sự không có host hoặc URL được cấu hình
            if (!isSet(host) && !isSet(dbUrl)) {
                enableH2Fallback("Không có thông tin MySQL đích.");
            } else {
                System.out.println("[Turfzone] Giữ nguyên cấu hình MySQL để HikariCP tự động thử lại (tránh dùng H2 làm mất dữ liệu).");
            }
        }
    }

    private static void enableH2Fallback(String reason) {
        System.out.println("==================================================================");
        System.out.println("[Turfzone] [CHẾ ĐỘ AN TOÀN - AUTO FALLBACK H2]");
        System.out.println("[Turfzone] Lý do: " + reason);
        System.out.println("[Turfzone] Tự động chuyển DataSource sang H2 Database (MySQL compatibility mode)");
        System.out.println("[Turfzone] Giúp Web Server khởi động 100% thành công, mở cổng $PORT và không bị Crash Loop!");
        System.out.println("==================================================================");
        System.setProperty("spring.datasource.url", "jdbc:h2:mem:Turfzone_db;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE");
        System.setProperty("spring.datasource.driver-class-name", "org.h2.Driver");
        System.setProperty("spring.datasource.username", "sa");
        System.setProperty("spring.datasource.password", "");
        System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.H2Dialect");
    }

    /**
     * In ra log ngay lúc khởi động để biết backend đang trỏ tới MySQL nào.
     * Mục đích: khi service crash vì DB, nhìn log là biết ngay nguyên nhân
     * (thường là thiếu MYSQLHOST / SPRING_DATASOURCE_URL nên bị fallback về
     * localhost -> treo rồi "Unable to start web server").
     *
     * Không in mật khẩu — chỉ in độ dài để xác nhận có hay không.
     */
    private static void logDatasourceDiagnostics() {
        String explicitUrl = System.getProperty("spring.datasource.url", getenv("SPRING_DATASOURCE_URL"));
        String mysqlHost = getenv("MYSQLHOST");
        String mysqlPort = getenv("MYSQLPORT");
        String mysqlDb = getenv("MYSQLDATABASE");
        String user = firstNonBlank(System.getProperty("spring.datasource.username"), getenv("SPRING_DATASOURCE_USERNAME"), getenv("MYSQLUSER"));
        String password = firstNonBlank(System.getProperty("spring.datasource.password"), getenv("SPRING_DATASOURCE_PASSWORD"), getenv("MYSQLPASSWORD"));

        String resolvedHost;
        String resolvedSource;
        if (isSet(explicitUrl)) {
            resolvedHost = explicitUrl;
            resolvedSource = System.getProperty("spring.datasource.url") != null ? "MYSQL_URL (Railway auto-convert)" : "SPRING_DATASOURCE_URL";
        } else if (isSet(mysqlHost)) {
            resolvedHost = mysqlHost + ":" + firstNonBlank(mysqlPort, "3306") + "/" + firstNonBlank(mysqlDb, "Turfzone_db");
            resolvedSource = "MYSQL* (Railway/plugin)";
        } else {
            resolvedHost = "localhost:3306/Turfzone_db";
            resolvedSource = "FALLBACK (chưa cấu hình gì)";
        }

        System.out.println("========== [Turfzone] CẤU HÌNH DATASOURCE ==========");
        System.out.println("[Turfzone] Nguồn cấu hình : " + resolvedSource);
        System.out.println("[Turfzone] DB đích        : " + resolvedHost);
        System.out.println("[Turfzone] User           : " + firstNonBlank(user, "(trống -> root)"));
        System.out.println("[Turfzone] Password       : " + (isSet(password) ? "(đã đặt, " + password.length() + " ký tự)" : "(TRỐNG)"));
        System.out.println("[Turfzone] PORT           : " + firstNonBlank(getenv("PORT"), "8080"));

        if (!isSet(explicitUrl) && !isSet(mysqlHost)) {
            System.out.println("[Turfzone] [CANH BAO] Chua co SPRING_DATASOURCE_URL lan MYSQLHOST.");
            System.out.println("[Turfzone] [CANH BAO] Backend se thu ket noi localhost:3306 va TREO neu khong co MySQL.");
            System.out.println("[Turfzone] [CANH BAO] Hay them bien moi truong DB tren Railway/Render (xem backend-core/.env.example).");
        }
        System.out.println("======================================================");
    }

    private static String getenv(String key) {
        String value = System.getenv(key);
        return value == null ? "" : value.trim();
    }

    private static boolean isSet(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v.trim();
        }
        return "";
    }
}
