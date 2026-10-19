package com.turfzone.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;

/**
 * Bọc DataSource của HikariCP bằng một lớp chờ có kiên nhẫn.
 *
 * <p><b>Vấn đề:</b> MySQL trên Railway hay rơi vào trạng thái "sleeping" hoặc khởi
 * động chậm hơn vài chục giây. Trong khoảng đó, Hibernate cần một {@code Connection}
 * để chạy {@code ddl-auto: update} + khởi tạo EntityManagerFactory; nếu lấy
 * connection thất bại thì context khởi động dở dang, Spring Boot đóng app và
 * Railway lập tức restart → vòng lặp crash (502) vô hạn, dù database hoàn toàn
 * ổn và chỉ cần thêm vài chục giây.</p>
 *
 * <p><b>Cách sửa:</b> thay vì ném lỗi ngay, {@code getConnection()} sẽ thử lại
 * liên tục trong tối đa {@code MAX_WAIT_MINUTES} phút rồi mới bỏ cuộc. App vẫn
 * khởi động được ngay khi database sẵn sàng, không cần can thiệp thủ công.</p>
 *
 * <p>Retry chỉ áp dụng cho tới lúc kết nối thành công lần đầu (giai đoạn khởi động).
 * Sau đó mọi lỗi kết nối đều trả về ngay cho request, để API báo lỗi nhanh thay
 * vì treo từng request tối đa 10 phút khi database hạ gục giữa chừng.</p>
 *
 * <p>Đăng ký dưới dạng {@link BeanPostProcessor} để lớp bọc được áp dụng trước khi
 * Hibernate tạo EntityManagerFactory (BeanPostProcessor luôn được khởi tạo trước
 * các singleton thông thường).</p>
 */
@Component
@Slf4j
public class DataSourceStartupRetry implements BeanPostProcessor {

    /** Tổng thời gian chờ tối đa cho database (phút). */
    private static final long MAX_WAIT_MINUTES = 10L;
    /** Nghỉ giữa 2 lần thử (mili-giây). */
    private static final long RETRY_INTERVAL_MS = 5_000L;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (!(bean instanceof DataSource)) {
            return bean;
        }
        log.info("[DataSource] Bọc bean '{}' bằng lớp chờ tối đa {} phút — app sẽ khởi động thay vì crash nếu MySQL chưa sẵn sàng.",
                beanName, MAX_WAIT_MINUTES);
        return new RetryingDataSource((DataSource) bean);
    }

    /**
     * DataSource chuyển tiếp mọi lời gọi, riêng {@code getConnection()} thì thử lại
     * khi gặp SQLException (lỗi tạm thời: DB đang khởi động / mạng chập chờn).
     */
    static class RetryingDataSource implements DataSource {

        private final DataSource delegate;
        /** Đã từng kết nối được DB chưa — hết giai đoạn chờ khởi động là fail-fast. */
        private volatile boolean everConnected = false;
        private volatile boolean warned = false;

        RetryingDataSource(DataSource delegate) {
            this.delegate = delegate;
        }

        private Connection retry(SqlCall call) throws SQLException {
            // Đã kết nối được rồi thì không retry: DB hạ gục giữa chừng sẽ báo lỗi
            // nhanh cho từng request thay vì treo tối đa 10 phút.
            if (everConnected) {
                return call.get();
            }

            long deadline = System.currentTimeMillis() + MAX_WAIT_MINUTES * 60_000L;
            SQLException last = null;
            int attempt = 0;

            while (System.currentTimeMillis() < deadline) {
                attempt++;
                try {
                    Connection c = call.get();
                    everConnected = true;
                    if (attempt > 1) {
                        log.info("[DataSource] Kết nối database thành công sau {} lần thử — app khởi động xong.", attempt);
                    }
                    return c;
                } catch (SQLException e) {
                    last = e;
                    if (!warned) {
                        warned = true;
                        log.warn("[DataSource] Chưa kết nối được database ({}). Sẽ thử lại mỗi {} giây, tối đa {} phút — app chưa bị crash.",
                                e.getMessage(), RETRY_INTERVAL_MS / 1000, MAX_WAIT_MINUTES);
                    }
                    try {
                        Thread.sleep(RETRY_INTERVAL_MS);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw e;
                    }
                }
            }
            log.error("[DataSource] Hết thời gian chờ ({} phút), database vẫn không phản hồi. Lỗi cuối: {}",
                    MAX_WAIT_MINUTES, last != null ? last.getMessage() : "không rõ");
            throw last != null ? last : new SQLException("Không kết nối được database sau "
                    + MAX_WAIT_MINUTES + " phút chờ.");
        }

        @Override
        public Connection getConnection() throws SQLException {
            return retry(delegate::getConnection);
        }

        @Override
        public Connection getConnection(String username, String password) throws SQLException {
            return retry(() -> delegate.getConnection(username, password));
        }

        @Override
        public PrintWriter getLogWriter() throws SQLException {
            return delegate.getLogWriter();
        }

        @Override
        public void setLogWriter(PrintWriter out) throws SQLException {
            delegate.setLogWriter(out);
        }

        @Override
        public void setLoginTimeout(int seconds) throws SQLException {
            delegate.setLoginTimeout(seconds);
        }

        @Override
        public int getLoginTimeout() throws SQLException {
            return delegate.getLoginTimeout();
        }

        @Override
        public Logger getParentLogger() throws SQLFeatureNotSupportedException {
            return delegate.getParentLogger();
        }

        @Override
        public <T> T unwrap(Class<T> iface) throws SQLException {
            return delegate.unwrap(iface);
        }

        @Override
        public boolean isWrapperFor(Class<?> iface) throws SQLException {
            return delegate.isWrapperFor(iface);
        }
    }

    /** Callback cho phép trả về hoặc ném SQLException mà không cần khai báo throws. */
    @FunctionalInterface
    private interface SqlCall {
        Connection get() throws SQLException;
    }
}