# Triển Khai & Vận Hành

Tài liệu vận hành Turfzone: chạy local, biến môi trường, triển khai 4 thành phần (backend Spring Boot, AI FastAPI, frontend Next.js, mobile Expo) và xử lý sự cố. Mọi giá trị dưới đây lấy từ file cấu hình trong repo; chỗ nào là suy luận sẽ ghi rõ **suy luận**.

## Mục lục

1. [Môi trường local](#1-môi-trường-local)
2. [Biến môi trường](#2-biến-môi-trường)
3. [Triển khai từng dịch vụ](#3-triển-khai-từng-dịch-vụ)
4. [Cơ sở dữ liệu production](#4-cơ-sở-dữ-liệu-production)
5. [Kiểm tra sau triển khai](#5-kiểm-tra-sau-triển-khai)
6. [Xử lý sự cố](#6-xử-lý-sự-cố)

---

## 1. Môi trường local

### 1.1 Yêu cầu

| Thành phần | Phiên bản theo cấu hình | Nguồn |
|---|---|---|
| JDK | 17 | `backend-core/pom.xml` (`java.version=17`), `nixpacks.toml`, CI |
| Maven | 3.x | `run.bat` tự thêm PATH cho `apache-maven-3.9.9` (hoặc wrapper `apache-maven-3.9.15` trong `%USERPROFILE%\.m2`) |
| Node.js | 20 (CI) | `.github/workflows/ci-cd.yml` |
| Python | 3.10 (CI) | `ci-cd.yml`; máy local có thể mới hơn (**suy luận** từ `__pycache__/main.cpython-314.pyc`) |
| MySQL | 8.x | `application.yml`, `db_migration_new.sql` dùng cú pháp MySQL |
| Expo | Expo SDK ~52, React Native 0.76.7 | `mobile-app/package.json` |

Không dùng Docker: `run.bat` ghi rõ "SINGLE TERMINAL RUNNER (NO DOCKER)".

### 1.2 Cổng

| Dịch vụ | Cổng | Ghi chú |
|---|---|---|
| Spring Boot backend | `8080` | `${PORT:8080}`; local dùng 8080 |
| AI FastAPI | `8000` | `uvicorn.run(..., port=8000)` |
| Frontend — chủ sân | `3000` | `frontend/package.json` → `dev:owner` |
| Frontend — cầu thủ | `3001` | `dev:player` |
| Expo / Metro | `8081` | Mặc định của Expo (**suy luận**, không cấu hình trong repo) |
| MySQL | `3306` | |

`frontend/next.config.js` đặt `distDir: process.env.PORT ? ".next-" + PORT : ".next"` nên khi chạy 2 cổng, build cache tách thành `.next-3000` và `.next-3001`.

### 1.3 Chạy nhanh bằng `run.bat`

Script thực hiện tuần tự:

1. Ép `chcp 65001` (UTF-8) và thêm Maven vào PATH nếu tìm thấy thư mục cài đặt.
2. `taskkill` tiến trình đang nghe cổng `3000`, `3001`, `8080`, `8000` (giải phóng cổng bị treo).
3. Chạy 4 tiến trình song song bằng `npx -y concurrently`:

```bat
cd backend-core && mvn spring-boot:run               :: BACKEND   - 8080
cd ai-service && python main.py                      :: AI        - 8000
cd frontend && npx next dev -p 3000                  :: OWNER     - 3000
cd frontend && npx next dev -p 3001                  :: PLAYER    - 3001
```

Lưu ý: `run.bat` **không** khởi động MySQL và **không** chạy `npm install`/`pip install` — phải chuẩn bị trước.

### 1.4 Chạy thủ công (thứ tự khuyến nghị)

1. **MySQL**: tạo database và cấu hình user khớp `SPRING_DATASOURCE_*`.

   ```sql
   CREATE DATABASE soccerhub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

   > [!WARNING]
   > Tên database mặc định trong `application.yml` là `soccerhub_db`, nhưng `README.md` hướng dẫn tạo `Turfzone_db` và log trong `TurfzoneApplication` cũng in `Turfzone_db`. Đây là **chỗ lệch tài liệu**: nếu tạo `Turfzone_db` mà không đặt `SPRING_DATASOURCE_URL`, backend vẫn kết nối `soccerhub_db` và sẽ lỗi "Unknown database".

2. **Backend** (cần MySQL sống trước):

   ```bash
   cd backend-core
   mvn spring-boot:run          # cổng 8080, health: /health
   ```

   Có thể dùng `.env`: copy `backend-core/.env.example` → `.env` (Spring Boot không tự đọc `.env`; phải export biến hoặc cấu hình trong IDE — **suy luận** từ việc repo không có thư viện đọc `.env`).

3. **AI service** (độc lập, không cần DB):

   ```bash
   cd ai-service
   pip install -r requirements.txt
   python main.py               # cổng 8000, health: /health
   ```

4. **Frontend** (cần backend sống để có dữ liệu):

   ```bash
   cd frontend
   npm install
   npm run dev                  # 3000 (hoặc npm run dev:player → 3001)
   ```

   Chạy frontend local nhưng dùng backend deploy:

   ```powershell
   $env:NEXT_PUBLIC_API_BASE_URL='https://turfzone-core-production.up.railway.app'; npm run dev
   ```

5. **Mobile** (tuỳ chọn):

   ```bash
   cd mobile-app
   npm install
   npm start                    # hoặc npm run android / npm run ios / npm run web
   ```

6. Kiểm tra: `http://localhost:3000` và `http://localhost:3001` hiển thị trang đăng nhập; AI Swagger ở `http://localhost:8000/docs`.

### 1.5 Tài khoản demo

`DataInitializer` tự seed khi khởi động nếu chưa tồn tại (chỉ seed khi thiếu bản ghi):

| Vai trò | Email | Mật khẩu | Dùng để |
|---|---|---|---|
| ADMIN | `admin@Turfzone.vn` | `admin123` | Khu vực `/admin`: KPI, duyệt chợ kèo, quản lý người dùng |
| PLAYER | `player@Turfzone.vn` | `player123` | Đặt sân, vé của tôi, nhận kèo |
| OWNER | `owner@Turfzone.vn` | `owner123` | Dashboard cụm sân, doanh thu, đơn tại quầy |
| ORGANIZER | `organizer@Turfzone.vn` | `organizer123` | Tạo giải, bốc thăm, nhập tỷ số |

Mobile prefill sẵn `player@Turfzone.vn` / `player123` ở màn đăng nhập (`App.tsx`).

> [!WARNING]
> Đây là mật khẩu công khai trong repo và trong `README.md`. Trên production phải đổi hoặc vô hiệu hoá seed (`DataInitializer` có comment cảnh báo về "backdoor" admin). Xem mục 4.4.

---

## 2. Biến môi trường

Nguồn: `backend-core/.env.example`, `frontend/.env.example`, `mobile-app/.env.example`, `backend-core/src/main/resources/application.yml`, `ai-service/main.py`, `render.yaml`, và các chỗ đọc biến trong code (`System.getenv`, `process.env`).

| Biến | Service | Bắt buộc? | Giá trị mẫu | Ghi chú |
|---|---|---|---|---|
| `JWT_SECRET` | Backend | **Bắt buộc khi production** | `thay_bang_chuoi_ngau_nhien_dai_hoat_32_ky_tu_tren` | Thiếu thì app vẫn chạy nhưng dùng secret mặc định trong mã nguồn và in "CẢNH BÁO BẢO MẬT" mỗi lần khởi động; đổi secret làm mọi token cũ mất hiệu lực |
| `SPRING_DATASOURCE_URL` | Backend | Bắt buộc nếu không dùng biến `MYSQL*` | `jdbc:mysql://localhost:3306/soccerhub_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` | Ưu tiên cao nhất; Railway có thể map từ `MYSQL_URL` |
| `SPRING_DATASOURCE_USERNAME` | Backend | Có | `root` | Fallback `MYSQLUSER`, cuối cùng `root` |
| `SPRING_DATASOURCE_PASSWORD` | Backend | Có | `1234` | Fallback `MYSQLPASSWORD` |
| `SPRING_DATASOURCE_DRIVER_CLASS_NAME` | Backend | Không | `com.mysql.cj.jdbc.Driver` | Chỉ cần khi đổi driver |
| `MYSQLHOST` | Backend | Không | do plugin cấp | Dùng để tự ráp JDBC URL khi thiếu `SPRING_DATASOURCE_URL` |
| `MYSQLPORT` | Backend | Không | `3306` | |
| `MYSQL_DATABASE` / `MYSQLDATABASE` | Backend | Không | `soccerhub_db` | Cả hai tên đều được chấp nhận (`MYSQL_DATABASE` ưu tiên) |
| `MYSQLUSER` | Backend | Không | `root` | |
| `MYSQLPASSWORD` | Backend | Không | — | |
| `PORT` | Backend, AI | Railway/Render tự cấp | `8080` / `8000` | `server.port: ${PORT:8080}`; AI: `--port $PORT` |
| `SERVER_PORT` | Backend | Không | `8080` | Có trong `.env.example`; ánh xạ chuẩn của Spring Boot sang `server.port` (**suy luận** — không thấy khai báo tường minh) |
| `DDL_AUTO` | Backend | Không | `update` (mặc định) | Đặt `none` khi cần app khởi động dù DB chưa sẵn sàng |
| `JPA_SHOW_SQL` | Backend | Không | `false` | Đặt `true` khi debug local |
| `HIBERNATE_DIALECT` | Backend | Không | `org.hibernate.dialect.MySQLDialect` | |
| `ALLOWED_ORIGINS` | Backend, AI | Nên đặt | `https://soccer-hub-wheat.vercel.app,http://localhost:3000,http://localhost:3001` | Backend: `SecurityConfig`; AI: `main.py` (2 default khác nhau, xem ghi chú dưới) |
| `MAIL_ENABLED` | Backend | Không | `false` | Phải `true` thì `EmailService` mới gửi mail; `.env.example` **không** liệt kê biến này |
| `MAIL_HOST` | Backend | Không | `smtp.gmail.com` | |
| `MAIL_PORT` | Backend | Không | `587` | STARTTLS |
| `MAIL_USERNAME` | Backend | Không | Gmail của bạn | Nên dùng "Mật khẩu ứng dụng", không dùng mật khẩu Gmail thường |
| `MAIL_PASSWORD` | Backend | Không | — | |
| `MAIL_FROM` | Backend | Không | `turfzone.dn@gmail.com` | Mặc định theo `MAIL_USERNAME` |
| `MAIL_FROM_NAME` | Backend | Không | `Turfzone` | Chỉ có trong `application.yml` |
| `GOOGLE_CLIENT_ID` | Backend | Không | `xxx.apps.googleusercontent.com` | Trống → đăng nhập Google bị tắt (`GoogleAuthService` ném lỗi cấu hình) |
| `AI_SERVICE_URL` | Backend | Không | `http://localhost:8000` | **Không được đọc ở đâu trong code Java** (xem mục 6.1) |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | **Bắt buộc khi deploy** | `https://turfzone-core-production.up.railway.app` | Nhúng lúc build; đổi phải redeploy |
| `NEXT_PUBLIC_API_URL` | Frontend | Không | — | Fallback thứ hai trong `api.ts` (không có trong `.env.example`) |
| `NEXT_PUBLIC_AI_BASE_URL` | Frontend | Không | `https://Turfzone-ai-service.onrender.com` | Có mặc định production trong code; trống thì AI vẫn chạy |
| `AI_BASE_URL` | Frontend (server) | Không | `http://localhost:8000` | Chỉ route proxy đọc, không lộ ra bundle |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Frontend | Không | cùng giá trị `GOOGLE_CLIENT_ID` | Thiếu thì nút Google báo lỗi cấu hình |
| `ALLOWED_ORIGINS` | AI | Nên đặt | như trên | `render.yaml` đặt sẵn domain Vercel |
| `EXPO_PUBLIC_API_URL` | Mobile | Không | `http://localhost:8080/api/v1` | Trống thì app suy ra IP từ `expo-constants` rồi fallback `localhost`; bản build thật phải đặt URL Railway + hậu tố `/api/v1` |

Ghi chú:

- `ALLOWED_ORIGINS` mặc định **không giống nhau**: backend (`SecurityConfig`) mặc định gồm cả `https://turfzone-wheat.vercel.app` và `https://soccer-hub-wheat.vercel.app`; AI (`main.py`) chỉ có `soccer-hub-wheat`. Nếu domain Vercel thật khác, phải đặt biến ở cả 2 nơi.
- Backend bật `allowCredentials(true)` (dùng cho cookie/Authorization) nên **không** được dùng `*` trong `ALLOWED_ORIGINS` — sẽ bị Spring từ chối.
- `jwt.expiration` cố định `86400000` ms (24 giờ) trong `application.yml`, không có biến môi trường.
- `.env` bị `.gitignore` chặn; chỉ `.env.example` được commit.

---

## 3. Triển khai từng dịch vụ

### 3.1 Backend — Railway (kèm MySQL plugin)

`railway.json`:

| Khoá | Giá trị | Ý nghĩa |
|---|---|---|
| `build.builder` | `NIXPACKS` | Build không dùng Docker |
| `deploy.startCommand` | `if [ -f "backend-core/target/backend-core-1.0.0.jar" ]; then java -Xmx384m -Xms128m -XX:+UseG1GC -jar backend-core/target/backend-core-1.0.0.jar; else java -Xmx384m -Xms128m -XX:+UseG1GC -jar target/backend-core-1.0.0.jar; fi` | Hỗ trợ cả Root Directory = gốc repo lẫn `backend-core` |
| `deploy.healthcheckPath` | `/health` | `HealthController` trả `{"status":"UP",...}` |
| `deploy.healthcheckTimeout` | `300` | Chờ tối đa 300 s |
| `deploy.restartPolicyType` | `ON_FAILURE`, tối đa 5 lần | Tránh crash loop vô hạn |

`nixpacks.toml` (gốc repo): `NIXPACKS_JDK_VERSION=17`, build `cd backend-core && mvn clean package -DskipTests`, start jar trong `backend-core/target`. Bản `backend-core/nixpacks.toml` tương đương nhưng dành cho Root Directory = `backend-core`.

Các bước:

1. Tạo project Railway từ repo, thêm plugin **MySQL**.
2. Đặt Root Directory phù hợp (`/` hoặc `backend-core`) sao cho khớp một trong hai `nixpacks.toml`/`startCommand`.
3. Thêm biến: `JWT_SECRET` (bắt buộc), `ALLOWED_ORIGINS`, `MAIL_*` nếu gửi mail, `GOOGLE_CLIENT_ID` nếu dùng Google. Các biến `MYSQL*` do plugin tự cấp.
4. Deploy, chờ health check `/health` trả 200.
5. Chạy `db_migration_new.sql` (mục 4) rồi kiểm tra lại.

`TurfzoneApplication` in khối "CẤU HÌNH DATASOURCE" khi khởi động (nguồn cấu hình, DB đích, user, độ dài password, PORT) và cảnh báo nếu thiếu cả `SPRING_DATASOURCE_URL` lẫn `MYSQLHOST`.

> [!WARNING]
> Giới hạn RAM container (Railway gói nhỏ) từng gây `OOMKilled` (exit 137). `-Xmx384m` là mức đã chọn để vừa Spring Boot + Hibernate; đừng tăng tuỳ tiện nếu gói không đủ RAM.

### 3.2 AI service — Render

`render.yaml` khai báo 2 service:

| Service | `env` | `rootDir` | Build | Start |
|---|---|---|---|---|
| `Turfzone-ai-service` | `python` | `ai-service` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| `Turfzone-backend-core` | `java` | `backend-core` | `mvn clean package -DskipTests` | `java -Xmx384m -Xms128m -XX:+UseG1GC -jar target/backend-core-1.0.0.jar` |

- AI service: `plan: free`, biến `ALLOWED_ORIGINS` đặt sẵn. Free tier **ngủ khi không có traffic** → request đầu chậm 30–60 s; frontend/proxy đã chờ tới 55 s.
- Backend trên Render: `SPRING_DATASOURCE_URL/_USERNAME/_PASSWORD` để `sync: false` (nhập tay trong dashboard), `ALLOWED_ORIGINS` đặt sẵn.

> [!WARNING]
> Nếu dùng service backend trong `render.yaml` (thay vì Railway), file này **không** khai báo `JWT_SECRET`, `MAIL_*`, `GOOGLE_CLIENT_ID`. Thiếu `JWT_SECRET` ⇒ chạy bằng secret mặc định trong mã nguồn. Đây là lỗ hổng cấu hình, không phải lỗi code.

### 3.3 Frontend — Vercel

`frontend/vercel.json`: `framework: nextjs`, `installCommand: npm install`, `buildCommand: npm run build`, `devCommand: npm run dev`, `version: 2`.

Các bước:

1. Import repo, đặt **Root Directory = `frontend`**.
2. Environment Variables (Production + Preview + Development): `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_AI_BASE_URL` (tuỳ chọn), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (tuỳ chọn).
3. Deploy. Vercel tự build lại khi push (theo tích hợp Git, không qua workflow CI — xem 3.5).
4. Sau khi đổi bất kỳ biến `NEXT_PUBLIC_*`, phải **redeploy** vì giá trị được nhúng vào bundle lúc build.

> [!WARNING]
> Không đặt biến `PORT` trong môi trường build của Vercel: `next.config.js` dùng `PORT` để đổi `distDir` thành `.next-<port>`, Vercel sẽ không tìm thấy output `.next` (**suy luận** từ code cấu hình, chưa kiểm chứng trên Vercel). `output: 'standalone'` cũng đòi hỏi chạy `next start`/server chuẩn — trên Vercel thuần serverless, standalone không được dùng trực tiếp.

### 3.4 Mobile — Expo

- Không có `eas.json`, không có cấu hình build store trong repo ⇒ hiện chỉ chạy qua **Expo Go / dev server**; muốn build APK/IPA phải `eas init` + tạo profile (**suy luận**: repo chưa có bước này).
- `app.json`: `newArchEnabled: true`, `usesCleartextTraffic: true` (Android), `NSAllowsArbitraryLoads: true` (iOS) — cho phép gọi HTTP local; **rủi ro bảo mật** nếu giữ khi phát hành thật.
- Bản build thật: đặt `EXPO_PUBLIC_API_URL=https://<backend>/api/v1` (kèm `/api/v1`).
- Lệnh: `npm install` → `npm start` → quét QR; hoặc `npm run android` / `npm run ios` / `npm run web`.

### 3.5 CI/CD — GitHub Actions

`.github/workflows/ci-cd.yml`:

| Mục | Giá trị |
|---|---|
| Trigger | `push` và `pull_request` vào nhánh `main` |
| `frontend-check` | Node 20, cache theo `frontend/package-lock.json`, `npm ci` + `npm run build` |
| `backend-check` | JDK 17 (temurin), `./mvnw clean package -DskipTests` nếu có `mvnw`, ngược lại `mvn` |
| `ai-service-check` | Python 3.10, cài `requirements.txt`, `python -m py_compile main.py` |

Pipeline này **chỉ kiểm tra build**, không có bước deploy: Railway/Render/Vercel tự deploy theo tích hợp Git (**suy luận** — repo không có workflow deploy nào khác). Không có job test đơn vị, không build mobile.

---

## 4. Cơ sở dữ liệu production

### 4.1 `db_migration_new.sql`

Vị trí: `backend-core/src/main/resources/db_migration_new.sql`. Idempotent (kiểm tra `information_schema` trước khi `ALTER`, dùng `CREATE TABLE IF NOT EXISTS`). Nội dung:

| Mục | Tác dụng |
|---|---|
| 1 | Thêm `users.profile_completed` (`bit(1)`, NULL = tài khoản cũ đã hoàn tất) |
| 2 | Thêm `bookings.cash_collected` + khôi phục tiền mặt cho đơn đã check-in (`total_price - deposit_paid`) |
| 3 | Tạo `pitch_court_base_prices`, `pitch_court_peak_prices` (giá riêng từng sân con, FK tới `pitches`) |
| 4 | Xoá khoảng trắng trong `pitches.bank_account` để VietQR sinh được ảnh |

Chạy khi:

- Thiết lập DB production lần đầu (đặc biệt nếu đặt `DDL_AUTO=none`).
- Sau khi deploy phiên bản có thay đổi schema nhưng **trước** khi cần dữ liệu được khôi phục (tiền mặt, STK).

Cách chạy: mở Query/Data tab của MySQL trên Railway (hoặc `mysql -h ... -u ... -p db < db_migration_new.sql`). Luôn **backup trước** vì câu `UPDATE` sửa dữ liệu thật.

### 4.2 `ddl-auto`

`spring.jpa.hibernate.ddl-auto: ${DDL_AUTO:update}`.

- Mặc định `update`: Hibernate tự thêm bảng/cột khi khởi động. Tiện cho đồ án nhưng **không có rollback**, có thể sinh cột lệch kiểu, không xoá cột cũ, và chạy mỗi lần restart.
- `none`: chỉ dùng khi cần app khởi động dù DB chưa sẵn sàng, hoặc khi schema đã được quản lý bằng SQL.

> [!WARNING]
> `ddl-auto=update` trên production là rủi ro: thay đổi entity có thể tạo cột mới ngoài kiểm soát, không có versioning migration. Với dữ liệu thật, nên chuyển sang `none` + chạy SQL có kiểm soát.

### 4.3 Kết nối & keep-alive

- Hikari: `connection-timeout: 30000`, `maximum-pool-size: 5`, `minimum-idle: 2`, `keepalive-time: 180000` (ping mỗi 3 phút), `connection-test-query: SELECT 1`, `initialization-fail-timeout: -1` (chịu đợi DB bật).
- `DatabaseKeepAliveScheduler`: `@Scheduled(initialDelay = 60000, fixedRate = 240000)` chạy `SELECT 1` mỗi 4 phút để MySQL Railway không ngủ; lỗi chỉ log `warn`, không làm sập app.
- JDBC URL mặc định có `connectTimeout=15000&socketTimeout=60000`, `useSSL=false`, `allowPublicKeyRetrieval=true`, `serverTimezone=UTC`.
- Không dùng `createDatabaseIfNotExist` (user MySQL cloud thường không có quyền `CREATE DATABASE`) — DB phải được tạo trước.

### 4.4 Seed dữ liệu & rủi ro mất dữ liệu

- `DataInitializer` seed 4 tài khoản demo + cụm sân + giải đấu mẫu **ngay khi khởi động** nếu dữ liệu chưa có. Trên production, điều này tạo tài khoản mật khẩu công khai.
- Toàn bộ seed đã được bọc `try-catch` để lỗi DB không làm sập JVM (xem `ERRORS.md` 2026-10-16).
- Ảnh/file chat lưu ở đĩa cục bộ `uploads/chat/...` (`ChatController`), **không** dùng S3/Cloudinary. Trên Railway/Render, filesystem là tạm thời: mất file sau mỗi lần deploy/restart.
- Railway/Render free tier: không có backup tự động trong repo; volume/DB có thể bị ngủ hoặc mất khi hết hạn gói — kiểm tra chính sách trước khi dùng dữ liệu thật (**suy luận**, không kiểm chứng được từ repo).

Backup thủ công (ví dụ):

```bash
mysqldump -h <host> -P <port> -u <user> -p --single-transaction --routines soccerhub_db > backup_$(date +%F).sql
mysql -h <host> -u <user> -p soccerhub_db < backup_2026-10-25.sql
```

Khôi phục phải làm trên DB **trống hoặc đã backup**, và nên tắt app trong lúc restore để tránh ghi đè.

---

## 5. Kiểm tra sau triển khai

### 5.1 Smoke test

| # | Kiểm tra | Lệnh / cách làm | Kỳ vọng |
|---|---|---|---|
| 1 | Backend sống | `curl https://<backend>/health` | 200, `{"status":"UP","service":"Turfzone-backend-core",...}` |
| 2 | Backend alias | `curl https://<backend>/api/v1/health` | 200 |
| 3 | Danh sách sân | `curl https://<backend>/api/v1/pitches` | 200, mảng JSON có dữ liệu |
| 4 | Đăng nhập | `POST /api/v1/auth/login` với `{"email":"player@Turfzone.vn","password":"player123"}` | 200, có `token` + `user` |
| 5 | Đặt sân | `POST /api/v1/pitches/{id}/book` kèm `Authorization: Bearer <token>` | 200/201, có `code`, `totalPrice` |
| 6 | AI sống | `curl https://<ai>/health` | `{"status":"ONLINE"}` |
| 7 | AI gợi ý | `POST https://<ai>/api/v1/ai/recommend-pitches` với 1 cluster | 200, `recommendations` có `compatibility_score` |
| 8 | Proxy AI | `POST https://<vercel>/api/ai/recommend-pitches` | 200 (không phải 502/504) |
| 9 | CORS | Mở frontend, xem Network không có lỗi CORS | 200 |
| 10 | Frontend | Mở trang chủ, đăng nhập, vào tab Đặt sân | Dữ liệu thật, không màn trắng |

Lưu ý: các endpoint `/api/v1/pitches/**`, `/tournaments/**`, `/community/**`, `/auth/**`, `/health` được `permitAll`; phần còn lại cần JWT.

### 5.2 Log cần xem

| Log | Nơi xuất hiện | Ý nghĩa |
|---|---|---|
| `[Turfzone] CẤU HÌNH DATASOURCE` | Backend lúc khởi động | Xác nhận DB đích, user, độ dài password, PORT |
| `[Turfzone] [CANH BAO] Chua co SPRING_DATASOURCE_URL lan MYSQLHOST` | Backend | Đang fallback `localhost` → chắc chắn treo trên cloud |
| `CẢNH BÁO BẢO MẬT ... Chưa đặt biến môi trường JWT_SECRET` | Backend | Secret mặc định đang được dùng |
| `Seeded default ADMIN account` | Backend lần đầu | Đã tạo tài khoản demo |
| `[Keep-Alive] MySQL ping cảnh báo` | Backend mỗi 4 phút | DB mất kết nối/đang ngủ |
| `[AI Proxy] Upstream trả về body không phải JSON` | Vercel function log | AI trả HTML (503/trang bảo trì Render) |
| `[AI Service] /... failed after 3 attempts` | Console trình duyệt | AI chết/timeout, UI đã fallback |

### 5.3 Dấu hiệu cảnh báo bảo mật

| Dấu hiệu | Rủi ro |
|---|---|
| Log còn "CẢNH BÁO BẢO MẬT" | JWT ký bằng secret trong repo → ai đọc mã nguồn cũng tạo được token ADMIN |
| `ALLOWED_ORIGINS` chứa `*` cùng `allowCredentials(true)` | Spring từ chối cấu hình; nếu nới lỏng thì mất kiểm soát origin |
| `NEXT_PUBLIC_AI_BASE_URL` dùng `http://` | Dữ liệu và kết quả AI đi qua kênh không mã hoá |
| Mobile còn `usesCleartextTraffic` / `NSAllowsArbitraryLoads` | Cho phép HTTP bị chặn trên bản phát hành |
| Tài khoản `admin@Turfzone.vn / admin123` còn hiệu lực | Toàn quyền hệ thống cho bất kỳ ai |
| AI service không auth, proxy trả `Access-Control-Allow-Origin: *` | Bị lạm dụng tài nguyên (không lộ dữ liệu vì AI không có DB) |

---

## 6. Xử lý sự cố

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Container backend exit code 1 ngay khi khởi động, log dừng ở seed | `DataInitializer` chạy trước khi MySQL sẵn sàng (đã bọc try-catch, nhưng lỗi kết nối/Hibernate vẫn có thể làm sập) | Xem log `CẤU HÌNH DATASOURCE`; kiểm tra `SPRING_DATASOURCE_URL`/`MYSQL*`; tăng `healthcheckTimeout`; đặt `DDL_AUTO=none` tạm thời để app bind cổng rồi xử lý DB sau |
| `OOMKilled`, exit 137 | JVM vượt RAM container | Giữ `-Xmx384m`; giảm `show-sql`; nâng gói RAM |
| App treo ~30 s rồi "Unable to start web server" | Fallback `localhost:3306` vì thiếu biến DB | Thêm `SPRING_DATASOURCE_URL` hoặc `MYSQLHOST`; không dựa vào default |
| `Unknown database 'soccerhub_db'` | Tạo DB tên `Turfzone_db` theo README nhưng code mặc định `soccerhub_db` | Tạo đúng tên hoặc đặt `SPRING_DATASOURCE_URL` trỏ DB đã có |
| Railway MySQL "Sleeping", request đầu lỗi | Free tier ngủ khi không traffic | Giữ `DatabaseKeepAliveScheduler` + Hikari `keepalive-time`; dùng gói có SLA nếu cần |
| Frontend báo lỗi CORS | Domain Vercel không nằm trong `ALLOWED_ORIGINS` (backend) hoặc `ALLOWED_ORIGINS` (AI) | Cập nhật biến ở **cả** backend và AI, restart/redeploy |
| `401 Unauthorized` khi đặt sân/nhận kèo | Thiếu/sai token, token hết hạn (24 h), hoặc đổi `JWT_SECRET` | Đăng nhập lại; kiểm tra header `Authorization: Bearer ...`; không đổi secret giữa phiên demo |
| AI trả `504` ở lần gọi đầu | Render free cold start | Chờ, thử lại; proxy đã đợi 55 s; cân nhắc warm-up hoặc gói trả phí |
| Giao diện AI "im lặng" rồi tự sắp xếp | AI chết/quá tải, `aiService` trả `null` sau 3 lần thử | Đúng thiết kế fallback; kiểm tra `/health` của AI và log Vercel |
| `404 Endpoint AI không hợp lệ` | Gọi path ngoài whitelist (`/recommend-pitches`, `/matchmaking`) | Chỉ dùng 2 path đó qua proxy |
| Ảnh/ file chat 404 sau deploy | File nằm ở `uploads/chat` trên filesystem tạm | Chuyển sang S3/Cloudinary; chấp nhận mất file sau redeploy |
| QR VietQR không hiện | `bank_account` còn khoảng trắng | Chạy mục 4 của `db_migration_new.sql`; kiểm tra `buildVietQrUrl` |
| Doanh thu 2 màn hình lệch nhau | Từng có 2 công thức tính | Đã gom về `RevenueUtil.settledRevenue()`; nếu tái phát, kiểm tra endpoint dùng đúng helper |
| Endpoint trả `200` nhưng body rỗng | `@GetMapping` gắn nhầm lên method `private` | Kiểm tra mapping, chạy `audit_mappings.js` (theo `ERRORS.md`) |
| Đặt sân bị bán trùng ca | Mất khoá `SELECT ... FOR UPDATE` hoặc bỏ `@Transactional` | Giữ khoá dòng `pitch` trước khi đọc; bắt `DataIntegrityViolationException` trả 400 |
| `POST /pitches/{id}/book-offline` trả 400 cho khách | Dùng nhầm endpoint của chủ sân | Khách dùng `/book`; chủ sân dùng `/book-offline` |
| Trang mất CSS sau khi build | Chạy `npm run build` song song `next dev` (ghi đè `.next`) | Dừng dev server, xoá `.next`, chạy lại; không build khi đang dev |
| Vercel build xong nhưng 404 | Root Directory sai hoặc `distDir` bị đổi bởi `PORT` | Đặt Root Directory = `frontend`; bỏ biến `PORT` khỏi môi trường build |
| Mobile không gọi được backend | `EXPO_PUBLIC_API_URL` thiếu `/api/v1`, dùng `localhost` trên máy thật, hoặc backend chặn CORS | Đặt URL LAN/Railway đầy đủ; kiểm tra `ALLOWED_ORIGINS` nếu gọi từ web |
| Đăng nhập Google báo "chưa được cấu hình" | Thiếu `GOOGLE_CLIENT_ID` (backend) hoặc `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) | Đặt cả 2, thêm origin/redirect trong Google Cloud Console |
| Không nhận được email xác nhận | `MAIL_ENABLED=false` hoặc thiếu `MAIL_USERNAME`/`MAIL_PASSWORD` | Đặt `MAIL_ENABLED=true` + mật khẩu ứng dụng Gmail; xem log `EmailService` |

### 6.1 Ghi chú cấu hình lệch (cần thống nhất)

- `README.md` ghi backend "Java 21" nhưng `pom.xml`, `nixpacks.toml`, CI đều dùng **17**.
- `README.md` hướng dẫn tạo DB `Turfzone_db`; `application.yml` mặc định `soccerhub_db`.
- `frontend/.env.example` dùng `https://Turfzone-backend-core-production.up.railway.app`, còn `frontend/src/lib/api.ts` hardcode fallback `https://turfzone-core-production.up.railway.app`; `aiService.ts` và route proxy dùng `https://Turfzone-ai-service.onrender.com`. Cần xác nhận đâu là URL thật đang chạy để tránh fallback sai.
- `AI_SERVICE_URL` tồn tại trong `application.yml` nhưng không được đọc ở đâu.
- `SERVER_PORT` có trong `.env.example` trong khi code dùng `PORT`.
- `MAIL_ENABLED` cần cho việc gửi mail nhưng không có trong `backend-core/.env.example`; `README.md` chỉ nhắc `MAIL_USERNAME`/`MAIL_PASSWORD`.
- `render.yaml` thiếu `JWT_SECRET` và `MAIL_*` cho service backend.
