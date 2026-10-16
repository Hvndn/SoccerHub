package com.soccerhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SoccerHubApplication {

    public static void main(String[] args) {
        configureRailwayMysqlUrl();
        logDatasourceDiagnostics();
        SpringApplication.run(SoccerHubApplication.class, args);
    }

    /**
     * Tự động nhận diện biến MYSQL_URL hoặc DATABASE_URL do Railway / Render cung cấp
     * (thường có format mysql://user:pass@host:port/dbname) và chuyển đổi sang chuẩn
     * spring.datasource.* của Spring Boot để không bị lỗi kết nối hoặc thiếu JDBC scheme.
     */
    private static void configureRailwayMysqlUrl() {
        if (isSet(getenv("SPRING_DATASOURCE_URL"))) {
            return; // Đã có cấu hình URL trực tiếp
        }
        String rawUrl = firstNonBlank(getenv("MYSQL_URL"), getenv("MYSQLURL"), getenv("DATABASE_URL"));
        if (isSet(rawUrl) && rawUrl.startsWith("mysql://")) {
            try {
                java.net.URI uri = new java.net.URI(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                String path = uri.getPath();
                String database = (path != null && path.length() > 1) ? path.substring(1) : "soccerhub_db";

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
                System.out.println("[SoccerHub] [Railway] Tự động chuyển đổi MYSQL_URL (" + host + ":" + port + "/" + database + ") sang Spring JDBC!");
            } catch (Exception e) {
                System.err.println("[SoccerHub] [Railway] Cảnh báo lỗi phân giải MYSQL_URL: " + e.getMessage());
            }
        }
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
            resolvedHost = mysqlHost + ":" + firstNonBlank(mysqlPort, "3306") + "/" + firstNonBlank(mysqlDb, "soccerhub_db");
            resolvedSource = "MYSQL* (Railway/plugin)";
        } else {
            resolvedHost = "localhost:3306/soccerhub_db";
            resolvedSource = "FALLBACK (chưa cấu hình gì)";
        }

        System.out.println("========== [SoccerHub] CẤU HÌNH DATASOURCE ==========");
        System.out.println("[SoccerHub] Nguồn cấu hình : " + resolvedSource);
        System.out.println("[SoccerHub] DB đích        : " + resolvedHost);
        System.out.println("[SoccerHub] User           : " + firstNonBlank(user, "(trống -> root)"));
        System.out.println("[SoccerHub] Password       : " + (isSet(password) ? "(đã đặt, " + password.length() + " ký tự)" : "(TRỐNG)"));
        System.out.println("[SoccerHub] PORT           : " + firstNonBlank(getenv("PORT"), "8080"));

        if (!isSet(explicitUrl) && !isSet(mysqlHost)) {
            System.out.println("[SoccerHub] [CANH BAO] Chua co SPRING_DATASOURCE_URL lan MYSQLHOST.");
            System.out.println("[SoccerHub] [CANH BAO] Backend se thu ket noi localhost:3306 va TREO neu khong co MySQL.");
            System.out.println("[SoccerHub] [CANH BAO] Hay them bien moi truong DB tren Railway/Render (xem backend-core/.env.example).");
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
