package com.soccerhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SoccerHubApplication {

    public static void main(String[] args) {
        logDatasourceDiagnostics();
        SpringApplication.run(SoccerHubApplication.class, args);
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
        String explicitUrl = getenv("SPRING_DATASOURCE_URL");
        String mysqlHost = getenv("MYSQLHOST");
        String mysqlPort = getenv("MYSQLPORT");
        String mysqlDb = getenv("MYSQLDATABASE");
        String user = firstNonBlank(getenv("SPRING_DATASOURCE_USERNAME"), getenv("MYSQLUSER"));
        String password = firstNonBlank(getenv("SPRING_DATASOURCE_PASSWORD"), getenv("MYSQLPASSWORD"));

        String resolvedHost;
        String resolvedSource;
        if (isSet(explicitUrl)) {
            resolvedHost = explicitUrl;
            resolvedSource = "SPRING_DATASOURCE_URL";
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
