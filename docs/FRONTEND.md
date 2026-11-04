# Frontend — Next.js

Tài liệu kiến trúc tầng giao diện Turfzone (đồ án tốt nghiệp). Toàn bộ nội dung dưới đây được đọc trực tiếp từ mã nguồn trong `frontend/`: `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `.env.example`, `vercel.json`, `src/app/**`, `src/lib/**`, `src/context/**`, `src/components/**` và `src/app/globals.css`.

> [!NOTE]
> Phạm vi: chỉ tầng frontend. Backend Spring Boot, AI service FastAPI và mobile app nằm ngoài tài liệu này; endpoint chỉ được nhắc ở mức "frontend gọi cái gì".

## Mục lục

1. [Stack & cấu hình](#1-stack--cấu-hình)
2. [Bản đồ route](#2-bản-đồ-route)
3. [Tầng dữ liệu](#3-tầng-dữ-liệu)
4. [State & auth](#4-state--auth)
5. [Thành phần UI](#5-thành-phần-ui)
6. [Luồng nghiệp vụ tiêu biểu](#6-luồng-nghiệp-vụ-tiêu-biểu)
7. [Design system & quy tắc UI bắt buộc](#7-design-system--quy-tắc-ui-bắt-buộc)
8. [Hiệu năng & chất lượng](#8-hiệu-năng--chất-lượng)
9. [Build & triển khai](#9-build--triển-khai)

---

## 1. Stack & cấu hình

### 1.1 Dependency chính (`frontend/package.json`)

| Gói | Phiên bản khai báo | Vai trò trong code |
| --- | --- | --- |
| `next` | `^14.1.0` | App Router, `next/font`, Route Handler proxy AI |
| `react` / `react-dom` | `^18.2.0` | Toàn bộ UI là function component |
| `framer-motion` | `^11.0.8` | `motion.div` cho animation chuyển tab ở `app/page.tsx` |
| `lucide-react` | `^0.344.0` | Bộ icon duy nhất (không có icon font) |
| `recharts` | `^2.12.7` | `components/OwnerCharts.tsx`, `components/admin/AdminCharts.tsx` |
| `clsx` + `tailwind-merge` | `^2.1.0` / `^2.2.1` | Ghép class có điều kiện |
| `jspdf` | `^2.5.2` | Xuất PDF (biên bản trận, thẻ hội viên) |
| `html-to-image` | `^1.11.11` | Chụp khối DOM thành ảnh |
| `typescript` (dev) | `^5.3.3` | `strict: false` (xem mục 8) |
| `tailwindcss` (dev) | `^3.4.1` | Tailwind 3, `plugins: []` |
| `postcss`, `autoprefixer` (dev) | `^8.4.35`, `^10.4.18` | Pipeline CSS |
| `@types/node`, `@types/react`, `@types/react-dom` (dev) | `^20.11.24`, `^18.2.61`, `^18.2.19` | Typing |

Tên package là `Turfzone-frontend` (viết hoa chữ T), version `1.0.0`, `private: true`.

### 1.2 Script npm

| Script | Lệnh thực tế | Ghi chú |
| --- | --- | --- |
| `dev` | `next dev -p 3000` | Cổng chuẩn của GUI |
| `dev:owner` | `next dev -p 3000` | Trùng hoàn toàn `dev`, không chạy song song được |
| `dev:player` | `next dev -p 3001` | Hai vai trò cùng lúc; `distDir` đổi theo `PORT` nên không đè cache |
| `build` | `next build` | Kế thừa `output: 'standalone'` |
| `start` | `next start` | Chạy bản build |
| `lint` | `next lint` | Không có cấu hình ESLint riêng trong `frontend/` |

### 1.3 Biến môi trường `NEXT_PUBLIC_*` (đọc đúng tên trong code)

| Biến | Đọc ở đâu | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `src/lib/api.ts:10` | Có khi deploy | Thiếu thì rơi về fallback (xem 3.1) |
| `NEXT_PUBLIC_API_URL` | `src/lib/api.ts:11` | Không | Tên dự phòng, **không** có trong `.env.example` |
| `NEXT_PUBLIC_AI_BASE_URL` | `src/lib/aiService.ts:4`, `src/app/api/ai/[...slug]/route.ts:16` | Không | Bỏ trống thì AI tự tắt, trang vẫn chạy |
| `AI_BASE_URL` | `route.ts:16` | Không | Biến server-side, ưu tiên sau `NEXT_PUBLIC_AI_BASE_URL` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `src/components/GoogleLoginButton.tsx:39` | Không | **Không** có trong `.env.example`; thiếu thì nút Google chỉ hiện thông báo cấu hình |
| `NODE_ENV` | `api.ts:12`, `aiService.ts:5`, `route.ts:18` | Tự có | Quyết định fallback prod/localhost |
| `PORT` | `next.config.js:3` | Không | Chỉ đổi `distDir` thành `.next-<PORT>` |

`.env.example` chỉ khai báo hai biến `NEXT_PUBLIC_API_BASE_URL` và `NEXT_PUBLIC_AI_BASE_URL` (kèm comment hướng dẫn dán vào Vercel Project Settings).

> [!WARNING]
> `.env.example:7` ghi host `https://Turfzone-backend-core-production.up.railway.app` nhưng fallback hard-code trong `api.ts:7` là `https://turfzone-core-production.up.railway.app` (khác tiền tố `backend-`). Nếu quên đặt `NEXT_PUBLIC_API_BASE_URL` trên Vercel, frontend sẽ gọi một host khác host trong tài liệu môi trường.

### 1.4 `next.config.js`

- `distDir: process.env.PORT ? '.next-' + PORT : '.next'` — cho phép chạy 3000/3001 song song.
- `output: 'standalone'` — bản build tự chứa `server.js`.
- `reactStrictMode: true`.
- `images.remotePatterns`: chỉ cho `images.unsplash.com` và `img.vietqr.io` (protocol `https`).

> [!NOTE]
> `images.remotePatterns` hiện **không có tác dụng**: không file nào import `next/image` (0 lần trong `src`). Mọi ảnh đi qua `components/SafeImage.tsx`, tức thẻ `<img>` thuần.

### 1.5 Tailwind theme (`tailwind.config.js`)

| Nhóm | Token | Giá trị | Ghi chú |
| --- | --- | --- | --- |
| Màu thương hiệu | `brand` | `#0369a1` | Nút chính / trạng thái đang chọn |
| | `brand-dark` | `#075985` | Hover, focus |
| | `brand-ink` | `#0b4f6c` | Chữ thương hiệu |
| Bảng màu cũ | `pitch-emerald` | `#0b4f6c` | Trùng `brand-ink` |
| | `pitch-darkEmerald` | `#07384d` | Hover |
| | `pitch-lime` | `#84cc16` | Accent highlight |
| | `pitch-navy` / `pitch-slate` | `#0f172a` / `#1e293b` | Nền tối, chữ |
| | `pitch-lightBg` | `#f8fafc` | Nền sáng |
| | `pitch-accentAmber` / `accentRed` | `#f59e0b` / `#ef4444` | Cảnh báo / lỗi |
| Font | `sans` / `display` | `var(--font-sans)` | Be Vietnam Pro, self-host qua `next/font/google` |
| | `mono` | `var(--font-mono)` | JetBrains Mono cho mã đơn, số tiền |
| Cỡ chữ | `2xs` | `0.6875rem` (11px) | **Khai báo nhưng không dùng** (0 lần) |

Be Vietnam Pro nạp weight `400/500/600/700/800/900`, subset `latin` + `vietnamese`, `display: "swap"` (`app/layout.tsx:15-29`).

### 1.6 Quy ước dark mode: đã gỡ bỏ

- `tailwind.config.js` không khai báo `darkMode`; số class `dark:` trong toàn bộ `src` là **0**.
- `components/ThemeProvider.tsx` chỉ còn passthrough; `useTheme()` trả cứng `theme: "light"`.
- `app/layout.tsx:43` đặt `themeColor: "#ffffff"`; `globals.css:23` đặt `color-scheme: light`.
- Dấu vết còn sót: `globals.css:19-24` (comment), `Navbar.tsx:192-196` vẫn render `turfzone-logo-dark.png` với class `hidden`.

Quy ước: giao diện **sáng hoàn toàn**, nền `#f8fafc`, chữ `#0f172a`, không dùng `dark:`.

---

## 2. Bản đồ route

### 2.1 Route có `page.tsx` (6) và Route Handler (1)

| Route | File | Loại | Mô tả | Quyền |
| --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Client (`"use client"`, 716 dòng) | Shell một trang: Navbar + 12 nhánh tab nội bộ + footer + `AuthModal` | Khách và mọi role |
| `/admin` | `src/app/admin/page.tsx` | Client | Console Super Admin, 9 section dạng sidebar | `ADMIN`; role khác thấy khối "Truy cập bị từ chối" |
| `/notifications` | `src/app/notifications/page.tsx` | Client | Trung tâm thông báo dạng luồng trang (không popup) | Đăng nhập |
| `/player-setup` | `src/app/player-setup/page.tsx` | Client (13 dòng) | Bọc `components/PlayerSetup` | PLAYER mới có `profileCompleted === false` |
| `/tournaments/new` | `src/app/tournaments/new/page.tsx` | Client (590 dòng) | Wizard 4 bước tạo giải | ORGANIZER / OWNER (backend chặn thêm) |
| `/tournaments/register` | `src/app/tournaments/register/page.tsx` | Client (503 dòng) | Wizard 4 bước đăng ký đội | PLAYER đã đăng nhập; giải `INVITE_ONLY` cần email được mời |
| `/api/ai/[...slug]` | `src/app/api/ai/[...slug]/route.ts` | Route Handler (Node) | Proxy JSON sang FastAPI, chỉ `POST`/`OPTIONS` | Công khai, CORS `*` |

Toàn bộ `page.tsx` đều là Client Component; **không có RSC nào fetch dữ liệu**.

### 2.2 File đặc biệt của App Router

| File | Loại | Vai trò |
| --- | --- | --- |
| `src/app/layout.tsx` | RSC | `<html lang="vi">`, nạp 2 font, chèn script Google GSI (`accounts.google.com/gsi/client`), bọc `AuthProvider` → `ThemeProvider` → `BootSplash` + `Toaster` |
| `src/app/error.tsx` | Client | Error boundary gốc: hiện `error.digest`, nút "Thử lại" gọi `reset()` và "Về trang chủ" |
| `src/app/not-found.tsx` | RSC | Trang 404, `metadata.title = "Không tìm thấy trang — Turfzone"` |
| `src/app/loading.tsx` | RSC | `LoadingGate minMs={1000}` — vòng xoay tối thiểu 1 giây |
| `src/app/globals.css` | CSS | Token motion, animation, print stylesheet `.esheet-print`, sàn chữ mobile |

Không có `middleware.ts`, không có `global-error.tsx`, không có `error.tsx`/`loading.tsx` riêng cho route con.

### 2.3 Trang "một tab": tab nằm trong component nào

`app/page.tsx` giữ state `activeTab` (mặc định `"booking"`), render có điều kiện và đồng bộ với query `?tab=` khi tải trang (`page.tsx:50-58`). Query `?role=` và `?sim=` **không** được đọc.

| `activeTab` | Component render | Nhãn trên UI | Quyền tối thiểu |
| --- | --- | --- | --- |
| `booking` | `PitchSearch` (khách: `LandingHero` + `LandingFeatures`) | Đặt sân | Khách |
| `matchmaking` | `MatchmakingMarketplace` | Chợ Kèo | Khách |
| `community` | `CommunityHub` (khách kèm `GuestFeatureBanner`) | Cộng Đồng | Khách |
| `tournaments` | `CommunityForm defaultSubTab="tournaments"` | Giải đấu | Khách |
| `organizer` | `CommunityForm defaultSubTab="organizer"` | Điều hành (BTC) | ORGANIZER hoặc OWNER |
| `my-activities` / `schedule` | `ActivitySchedule` | Lịch Trình & Vé Đã Đặt | Đăng nhập |
| `profile` | `PlayerProfileConsole` hoặc `OwnerProfileConsole` | Hồ sơ | Đăng nhập |
| `membership` | `MemberCardPortal` | Thẻ hội viên | Đăng nhập |
| `team-management` | `TeamClubManagement` | Đội bóng / CLB | Đăng nhập |
| `admin` | `AdminDashboard` (chỉ OWNER) | Quản Lý Cụm Sân & Doanh Thu | OWNER |
| `owner-onboarding` | `StadiumOwnerOnboarding` | Khởi tạo cụm sân | OWNER mới |
| `multi-sport` | `MultiSportArena` | Sơ Đồ Ca Sân | OWNER |

Danh sách tab không nằm trong một hằng số duy nhất: `Navbar.tsx` khai báo `mobileNav` (5 mục, khác nhau theo role) còn `page.tsx` khai báo các mảng guard `OWNER_ONLY_TABS`, `OWNER_MANAGE_TABS`, `OWNER_TABS`, `ORGANIZER_TABS`, `AUTH_REQUIRED_TABS`.

### 2.4 Ma trận phân quyền tab (RBAC phía UI)

| Nhóm | Tab | Ai vào được | Nơi khai báo |
| --- | --- | --- | --- |
| Quản lý chủ sân | `admin`, `owner-onboarding`, `multi-sport` | OWNER | `page.tsx:109` |
| Điều hành giải | `organizer` | ORGANIZER, OWNER | `page.tsx:116` |
| Cần đăng nhập | `my-activities`, `profile`, `team-management`, `membership` | Mọi role đã đăng nhập | `page.tsx:118` |
| Công khai | `booking`, `matchmaking`, `community`, `tournaments` | Tất cả | mặc định |

Hai lớp chặn: `handleTabChange()` (chặn thao tác bấm, hiện toast cảnh báo 5,5 giây) và `useEffect` role guard (chặn cả deep-link). Khách bấm tab bị chặn sẽ được mở `AuthModal` kèm `pendingTab`; sau khi đăng nhập thành công, `page.tsx` kiểm tra quyền của role mới rồi chuyển lại đúng tab (`page.tsx:283-319`).

---

## 3. Tầng dữ liệu

### 3.1 `src/lib/api.ts` — lớp nền

- **Base URL** (`api.ts:9-12`): `NEXT_PUBLIC_API_BASE_URL` → `NEXT_PUBLIC_API_URL` → (`NODE_ENV === 'production'` ? `https://turfzone-core-production.up.railway.app` : `http://localhost:8080`).
- **Token**: `sessionStorage`, khoá `Turfzone_token` và `Turfzone_token_<ROLE>`. `setAuthToken` luôn ghi khoá mặc định, ghi thêm khoá role nếu có. `removeAuthToken()` không truyền role sẽ xoá **mọi** khoá bắt đầu bằng `Turfzone_token`.
- **Gắn JWT**: `apiRequest` đọc `getAuthToken()` rồi thêm `Authorization: Bearer <token>`; `fetchWithTimeout` cũng tự gắn nếu caller chưa truyền header `Authorization`.
- **Cookie**: `apiRequest` đặt `credentials: 'include'` và `cache: 'no-store'`; `fetchWithTimeout`/`fetchWithStatus` **không** đặt `credentials` — hành vi cookie không đồng nhất giữa hai đường gọi.
- **Timeout**: `API_TIMEOUT_MS = 15000`; hết hạn thì `AbortController.abort()` và ném `"Máy chủ phản hồi quá chậm..."`.
- **Kiểu lỗi**: `apiRequest` đọc `data.message || data.error || "Lỗi yêu cầu: <status>"`, gắn `err.status = response.status` rồi `throw`. Đây là `Error` mở rộng thuộc tính, không có lớp `ApiError` riêng.
- **Không có xử lý 401 tập trung**: chỉ `authService.getCurrentUserApi` xoá token khi gặp 401/403.
- `fetchWithStatus` gọi `fetchWithTimeout` rồi `markBackendReachable()` / `markBackendUnreachable()` qua `import()` động để tránh vòng phụ thuộc.
- `ensureLoggedIn(action)` chặn sớm ở UI bằng toast thay vì để server trả 401; `apiUrl(path)` ghép base URL cho các chỗ gọi `fetch` trực tiếp.

### 3.2 Các service (9 module gọi endpoint)

| Service | Hàm chính | Endpoint backend tương ứng |
| --- | --- | --- |
| `authService.ts` | `loginApi`, `registerApi`, `getCurrentUserApi`, `updateProfileApi`, `logoutApi` | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/auth/me`, `PUT /api/v1/auth/me`; logout chỉ xoá token local |
| `pitchService.ts` | `getAllPitchesApi`, `getPitchByIdApi`, `getMyPitchesApi`, `createPitchApi`, `updatePitchApi`, `deletePitchApi`, `getPitchMatrixApi`, `getPitchStatsApi`, `getPitchBookingsApi`, `bookOfflineApi`, `addCourtToPitchApi`, `checkInBookingApi`, `cancelBookingApi`, `searchBookingApi` | `GET/POST /api/v1/pitches`, `GET/PUT/DELETE /api/v1/pitches/{id}`, `GET /api/v1/pitches/my-pitches`, `GET /{id}/matrix?date&duration`, `GET /{id}/stats`, `GET /{id}/bookings`, `POST /{id}/book-offline`, `POST /{id}/add-court`, `PUT /api/v1/pitches/bookings/{id}/check-in`, `POST /api/v1/pitches/bookings/{id}/cancel`, `GET /api/v1/pitches/bookings/search?query=` |
| `tournamentService.ts` | `fetchTournaments` (cache + inflight + listener), `refreshTournamentInCache`, `createTournament`, `updateTournament`, `registerTeam`, `drawTournamentBracket`, `saveMatchResult`, `undoMatchResult`, `generateTournamentSchedule`, `fillSimulatedTeams`, `clearSimulatedTeams`, `simulateTournamentResults`, `confirmTeamPayment`, `fetchTournamentFinance`, `fetchTournamentBracket`, `fetchTournamentScorers`, `fetchTopScorers` | `GET/POST /api/v1/tournaments`, `GET/PUT/DELETE /api/v1/tournaments/{id}`, `POST /{id}/register`, `POST /{id}/draw`, `POST/DELETE /{id}/matches[/{matchId}]`, `POST /{id}/schedule`, `POST /{id}/fill-teams`, `DELETE /{id}/simulated-teams`, `POST /{id}/simulate-results`, `POST /{id}/teams/confirm-payment`, `GET /{id}/finance`, `GET /{id}/bracket`, `GET /{id}/scorers`, `GET /api/v1/tournaments/scorers/top?limit=` |
| `organizerService.ts` | `addManualTeam`, `getPendingTeams`, `approveTeam`, `rejectTeam`, `getReferees`, `addReferee`, `removeReferee`, `fetchJoinAccess`, `setJoinAccess`, `addTournamentInvite`, `removeTournamentInvite` | `POST /{id}/teams/manual`, `GET /{id}/teams/pending`, `POST /{id}/teams/{team}/approve`, `POST /{id}/teams/{team}/reject`, `GET/POST /{id}/referees`, `DELETE /{id}/referees/{refId}`, `GET/PUT /{id}/access`, `POST /{id}/invites`, `DELETE /{id}/invites/{email}` |
| `adminService.ts` | `getAdminOverview`, `listAdminUsers`, `listAdminUsersPaged`, `getAdminUserDetail`, `getAdminInsights`, `setAdminUserStatus`, `setAdminUserRole`, `deleteAdminUser`, `listAdminBookings`, `adminCancelBooking`, `simulateBookings`, `clearSimulatedBookings`, `listAdminPitches`, `setTournamentStatus`, `deleteTournament`, `listMatchmakingPosts`, `deleteMatchmakingPost`, `cleanOrphanData`, `listMyNotifications`, `markNotificationRead`, `broadcastNotification`, `getRevenueReport`, `submitTeamReview`, `getTeamReviews` | `GET /api/v1/admin/overview`, `GET /api/v1/admin/users`, `GET /api/v1/admin/users/legacy`, `PATCH /api/v1/admin/users/{id}/status`, `PATCH /api/v1/admin/users/{id}/role`, `GET /api/v1/admin/users/{id}/detail`, `GET /api/v1/admin/insights`, `GET /api/v1/admin/bookings`, `POST /api/v1/admin/bookings/{id}/cancel`, `POST/DELETE /api/v1/pitches/simulate-bookings`, `PATCH /api/v1/tournaments/{id}/status`, `GET /api/v1/community/matchmaking-posts`, `DELETE /api/v1/admin/matchmaking-posts/{id}`, `DELETE /api/v1/admin/maintenance/orphans`, `GET /api/v1/notifications/mine`, `PATCH /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/broadcast`, `GET /api/v1/admin/revenue-report`, `POST /api/v1/community/reviews`, `GET /api/v1/community/reviews/{team}` |
| `clubService.ts` | `fetchMyClubs`, `fetchClub`, `createClub`, `updateClub`, `deleteClub`, `addClubMember`, `removeClubMember`, `setClubRepresentative` | `GET /api/v1/clubs/mine`, `GET/PUT/DELETE /api/v1/clubs/{id}`, `POST /api/v1/clubs`, `POST /api/v1/clubs/{id}/members`, `DELETE /api/v1/clubs/{id}/members/{email}`, `PATCH /api/v1/clubs/{id}/members/{email}/representative` |
| `groupChat.ts` | `listMyGroups`, `listMyConversations`, `createGroup`, `getGroup`, `getGroupMessages`, `sendGroupMessage`, `markGroupRead`, `addGroupMember`, `removeGroupMember`, `deleteGroup`, `reactGroupMessage`, `getGroupMessageReactions`, `markGroupMessageRead`, `uploadChatFile`, `searchChatMessages`, `getUnreadCount` | `GET/POST /api/v1/chat-groups`, `GET/DELETE /api/v1/chat-groups/{id}`, `GET/POST /api/v1/chat-groups/{id}/messages`, `POST /{id}/read`, `POST/DELETE /{id}/members[/{email}]`, `POST /api/v1/chat/messages/{id}/react`, `GET /api/v1/chat/messages/{id}/reactions`, `POST /api/v1/chat/messages/{id}/read`, `POST /api/v1/chat/upload` (multipart, tự gắn Bearer), `GET /api/v1/chat/messages/search`, `GET /api/v1/chat/conversations`, `GET /api/v1/chat/unread-count` |
| `canteenService.ts` | `listCanteenItems`, `createCanteenItem`, `updateCanteenItem`, `sellCanteenItem`, `deleteCanteenItem` | `GET/POST /api/v1/canteen/items`, `PUT/DELETE /api/v1/canteen/items/{id}`, `POST /api/v1/canteen/items/{id}/sell` |
| `aiService.ts` | `recommendPitches`, `matchmakingAi`, `getAiBaseUrl` | Trình duyệt gọi `/api/ai/recommend-pitches` và `/api/ai/matchmaking` (proxy nội bộ), không gọi thẳng FastAPI |

Ngoài 9 service trên, `src/lib` có 9 module hạ tầng: `api.ts`, `backendStatus.ts`, `realtimeService.ts`, `useNotifications.ts`, `pushNotify.ts`, `toast.ts`, `avatar.ts`, `dateUtils.ts`, `pitchLabels.ts` (tổng 18 file `.ts`).

### 3.3 Adapter AI: `src/app/api/ai/[...slug]/route.ts`

| Hạng mục | Giá trị trong code |
| --- | --- |
| Upstream | `NEXT_PUBLIC_AI_BASE_URL` hoặc `AI_BASE_URL`; trống thì prod `https://Turfzone-ai-service.onrender.com`, dev `http://localhost:8000` |
| Đường dẫn đích | `${aiBaseUrl}/api/v1/ai${path}${search}` |
| Whitelist | `ALLOWED_PATHS = {'/recommend-pitches', '/matchmaking'}`; khác → 404 `"Endpoint AI không hợp lệ."` |
| Giới hạn body | `MAX_BODY_BYTES = 256 * 1024`, kiểm tra cả `content-length` và độ dài chuỗi → 413 |
| Timeout | `AbortController` 55 giây cho cold start Render; hết hạn → 504 |
| Lỗi upstream | Body không phải JSON → 502; lỗi khác → 503 |
| Cấu hình route | `export const dynamic = 'force-dynamic'`, `export const maxDuration = 60` |
| CORS | `Access-Control-Allow-Origin: *`, `POST, OPTIONS`, `Max-Age: 86400` |
| Phía client | `aiService.postAi`: tối đa 3 lần thử, backoff `min(1000 * 2^n, 3000)`, ngân sách tổng `TOTAL_BUDGET_MS = 32000`; timeout 60s trên mobile, 15s trên desktop; 4xx thì bỏ retry và trả `null` |

`aiService` trả `null` khi AI offline; mọi nơi gọi đều phải chịu được `null` (ẩn widget, không vỡ trang).

### 3.4 `backendStatus.ts` — health check và banner

- Singleton module-level `{ reachable, checking, lastCheckedAt, message }` + `Set<Listener>`; `subscribeBackendStatus` trả hàm huỷ đăng ký.
- `probeBackend(timeoutMs = 6000)` gọi `GET ${API_BASE_URL}/api/v1/health` với `cache: 'no-store'`.
- `markBackendUnreachable` được gọi từ `fetchWithStatus` khi `fetch` ném lỗi; HTTP 4xx/5xx vẫn tính là "máy chủ sống".
- `components/BackendStatusBanner.tsx` probe ngay khi mount; **chỉ khi đang mất kết nối** mới dò lại mỗi 6 giây (`BackendStatusBanner.tsx:57-63`) và tự biến mất khi máy chủ trả lời. Banner đo chiều cao `header`/`nav` để không bị Navbar fixed đè lên.
- `BackendOfflineDot` (chấm nhỏ trong Toaster) và `BackendRestoredToast` (3 giây) dùng chung store này.

### 3.5 `realtimeService.ts` — cơ chế thật là gì

> [!WARNING]
> Tên file là "realtime" nhưng **không có WebSocket, không có Socket.IO, không có SSE**. Đồng bộ trong code là ba lớp phía trình duyệt cộng với polling HTTP định kỳ.

| Cơ chế | Chi tiết trong code |
| --- | --- |
| Cùng tab | `window.dispatchEvent(new CustomEvent("Turfzone:booking_event", { detail }))` |
| Đa tab | `BroadcastChannel("Turfzone_realtime_channel")`, có kiểm tra `"BroadcastChannel" in window` |
| Fallback | `localStorage.setItem("Turfzone_realtime_last_event", json)` + lắng nghe sự kiện `storage` |
| Loại sự kiện | `BOOKING_CREATED`, `BOOKING_CHECKED_IN`, `BOOKING_CANCELLED`, `OPERATING_HOURS_UPDATED` |
| Âm thanh | `playNotificationChime()` dựng 2 oscillator 880 Hz và 1320 Hz bằng Web Audio (không cần file mp3) |
| Tiện ích | `openDualRoleWindow(role)` mở `/?role=OWNER&tab=admin&sim=true` hoặc `/?role=PLAYER&tab=booking&sim=true` |

Các điểm polling đang chạy thật:

| Nơi | Chu kỳ | Việc được làm |
| --- | --- | --- |
| `AdminDashboard.tsx:504` | 4 giây | `GET /api/v1/pitches/{id}/stats?date=` (heartbeat), phát chuông khi `bookedSlots` tăng |
| `CommunityChat.tsx:162` | 4 giây | Tải lại tin nhắn kênh/DM đang mở |
| `CommunityHub.tsx:201` | 5 giây | Làm mới danh sách kênh và số chưa đọc |
| `GroupChatPanel.tsx:84` / `:109` | 8 giây | Làm mới danh sách nhóm và tin nhắn nhóm |
| `Navbar.tsx:76` | 30 giây | `getUnreadCount()` cho badge chat |
| `useNotifications.ts:160` | 60 giây | `GET /api/v1/notifications/mine` |
| `TournamentLeaderboard.tsx:197` | 5 giây | Chỉ khi `loadError`: gọi lại danh sách giải |
| `BackendStatusBanner.tsx:59` | 6 giây | Chỉ khi backend chết: `probeBackend()` |

### 3.6 Endpoint gọi trực tiếp trong component (không qua service)

| File | Endpoint |
| --- | --- |
| `PitchDetail.tsx:262` | `POST /api/v1/pitches/{pitchId}/book` |
| `ActivitySchedule.tsx:89,122,132` | `POST /api/v1/pitches/bookings/{id}/cancel-by-customer`, `GET /api/v1/community/matchmaking-posts`, `GET /api/v1/pitches/bookings/search?query=` |
| `AdminDashboard.tsx:507` + nhánh cấu hình sân | `GET /api/v1/pitches/{id}/stats?date=`, `PUT /api/v1/pitches/{id}/operating-hours`, `PUT /api/v1/pitches/{id}/price` |
| `CommunityHub.tsx:185` | `GET /api/v1/chat/channels` |
| `CommunityChat.tsx:137,179,196,207,227,238,270,289` | `/api/v1/chat/messages*`, `/api/v1/chat/conversations`, `/api/v1/chat/users?query=` |
| `OwnerReportExport.tsx:50,90,117` | `GET /api/v1/reports/bookings.csv`, `revenue.csv`, `summary.csv`, `POST /api/v1/reports/send-email`, `GET /api/v1/reports/email-status` |
| `admin/AdminAuditLogs.tsx` | `GET /api/v1/admin/audit-logs` |
| `admin/AdminChatModeration.tsx` | `GET /api/v1/chat/admin/messages`, `DELETE /api/v1/chat/admin/messages/{id}` |
| `GoogleLoginButton.tsx:61-68` | `POST /api/v1/auth/google` |

> [!NOTE]
> `GoogleLoginButton.tsx:62` tự ghép URL bằng `process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"` thay vì dùng `API_BASE_URL` của `lib/api.ts`. Trên bản deploy thiếu biến môi trường, nút Google sẽ gọi localhost trong khi phần còn lại của app gọi đúng backend production.

---

## 4. State & auth

### 4.1 `AuthContext` — token ở đâu, cache ở đâu

| Dữ liệu | Nơi lưu | Khoá | Ai ghi |
| --- | --- | --- | --- |
| JWT | `sessionStorage` | `Turfzone_token`, `Turfzone_token_<ROLE>` | `api.setAuthToken` (từ `loginApi`/`registerApi`, `GoogleLoginButton`, `AuthContext.updateProfile`) |
| Hồ sơ người dùng | `localStorage` | `Turfzone_user` | `AuthContext` (`readCachedUser`/`writeCachedUser`) |
| Cờ cần khởi tạo hồ sơ | `localStorage` | `Turfzone_player_setup_` + email | `PlayerSetup.markPlayerSetupPending` |
| Thông báo | `localStorage` | `Turfzone_user_notifications_<email>`, `..._deleted_<email>` | `useNotifications` |

`AuthContext` (`src/context/AuthContext.tsx`, 193 dòng) cung cấp `{ user, isAuthenticated, isLoading, login, register, updateProfile, logout, setUser }`; `isAuthenticated` chỉ là `!!user`, không kiểm tra hạn token.

### 4.2 Luồng đăng nhập / đăng xuất / refresh hồ sơ

1. **Mount**: đọc cache `Turfzone_user` → `setUser(cached)`, `isLoading = false` ngay (giao diện có dữ liệu tức thì), sau đó gọi `GET /api/v1/auth/me` để xác thực lại.
2. **Không có token**: xoá cache, `user = null`.
3. **`/auth/me` lỗi 401/403**: `removeAuthToken()` xoá mọi khoá token, bỏ cache. Lỗi timeout/mất mạng **không** xoá token (tránh đăng xuất oan khi backend restart).
4. **Đăng nhập**: `loginApi` → lưu token vào sessionStorage → `setUser` + ghi cache; `AuthModal` gọi `onLoginSuccess(user)` để `page.tsx` định tuyến theo role.
5. **Đăng xuất**: `authLogout()` → `logoutApi()` (chỉ xoá sessionStorage, **không** gọi endpoint logout backend) → xoá cache → `setUser(null)`; `page.tsx` đưa `activeTab` về `booking`.
6. **Cập nhật hồ sơ**: `updateProfileApi` (`PUT /api/v1/auth/me`). Nếu response có `token` (đổi email làm JWT cũ mất hiệu lực) thì thay token ngay. Nếu API lỗi, context vẫn merge các trường vào state local **trừ `email`** rồi ném lỗi lại cho caller.

Hệ quả của `sessionStorage`: mở tab/cửa sổ mới **không** còn token, phải đăng nhập lại. Đây là lý do `openDualRoleWindow` mở tab mới nhưng phiên vẫn tách riêng.

### 4.3 Google login

`components/GoogleLoginButton.tsx` dùng Google Identity Services (script nạp trong `layout.tsx:58`):

1. `google.accounts.id.initialize({ client_id })` với `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
2. Người dùng chọn tài khoản → Google trả `credential` (ID token JWT).
3. `POST /api/v1/auth/google` với `{ idToken: credential }`.
4. Nhận JWT của Turfzone → `setAuthToken(token, data.user.role)`.
5. Nếu role `PLAYER` và hồ sơ chưa có `position`/`dominantFoot`/`jerseyNumber` thì `markPlayerSetupPending(email)`.
6. `mode === "login"` thì `window.location.reload()` để `AuthContext` đọc token mới.

Thiếu `NEXT_PUBLIC_GOOGLE_CLIENT_ID` thì component render nút "Google"/"Facebook" giả kèm thông báo cấu hình; nút Facebook luôn chỉ hiện thông báo chờ Meta App Review.

### 4.4 Phân quyền theo role ở UI

- `PLAYER` mới (`profileCompleted === false`) bị `router.replace("/player-setup")` trong effect `page.tsx:140-146`, không vào được tab nào khác.
- `OWNER` mới bị giữ ở `owner-onboarding`.
- `PLAYER` không vào được `admin`/`owner-onboarding`/`multi-sport`/`organizer`.
- `ORGANIZER` không vào được khu chủ sân, bị đẩy về `tournaments`.
- `ADMIN` dùng console riêng ở `/admin`; Navbar hiện nút "Quản Trị Hệ Thống" trỏ `href="/admin"`.
- Tab bị chặn không render "trang trắng": mỗi nhánh có khối cảnh báo riêng (403 với chủ sân, 401 với khách) kèm nút đăng nhập/đổi khu vực.

Đây là phân quyền **hiển thị**; quyền thật do backend quyết định (nhiều comment trong code ghi rõ "backend yêu cầu ADMIN/ORGANIZER", "401/403 nếu thiếu token").

### 4.5 Hook và store tuỳ biến

| Hook / store | File | Vai trò |
| --- | --- | --- |
| `useAuth` | `context/AuthContext.tsx:187` | Truy cập context, ném lỗi nếu dùng ngoài provider |
| `useNotifications(user)` | `lib/useNotifications.ts:50` | Ghép cache local + server (poll 60s), `unreadCount`, `markAllRead`, `markSingleRead`, `removeNotification`, `clearAllNotifications`; giữ danh sách ID đã xoá để poll không làm thông báo hiện lại |
| `useChatPushNotification` | `lib/pushNotify.ts:77` | Notification API của trình duyệt; chỉ bắn khi `document.hidden`, chống lặp bằng `shub_chat_last_notified_id` |
| `useTheme` | `components/ThemeProvider.tsx:9` | No-op, luôn `"light"` |
| Toast bus | `lib/toast.ts` | Singleton ngoài React (để `ensureLoggedIn` gọi được), tối đa 3 toast, TTL 3,8s (lỗi 6s) |
| Event bus | `lib/realtimeService.ts` | `subscribeToBookingEvents` như mô tả 3.5 |
| Cache giải đấu | `lib/tournamentService.ts:175-245` | `cache` + `inflight` + `Set<listener>`; `subscribeTournaments` phát lại cache ngay khi đăng ký |

---

## 5. Thành phần UI

Tổng cộng **61 file component** `.tsx` trong `src/components` (48 file ở gốc + 13 file trong `src/components/admin`), khoảng 1,1 MB.

### 5.1 Đặt sân

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `PitchSearch` | Trang đặt sân: tìm/lọc cụm sân, ca trống, widget AI gợi ý, form đăng kèo inline | `PitchSearch.tsx` | 64,6 KB / 1.622 dòng |
| `PitchDetail` | Chi tiết cụm sân: chọn ngày, chọn ca, mức cọc 50%/100%, tạo đơn giữ chỗ, mã QR | `PitchDetail.tsx` | 47,6 KB / 1.165 dòng |
| `MultiSportArena` | Sơ đồ ca sân theo bộ môn, form đặt ca và ghép kèo dạng inline | `MultiSportArena.tsx` | 25,8 KB; tự cuộn tới form inline (`:70-76`) |
| `MemberCardPortal` | Thẻ hội viên, mã QR, điểm/ưu đãi | `MemberCardPortal.tsx` | 14,3 KB; **không** có `"use client"` dù dùng `useState` |
| `ActivitySchedule` | Lịch trình và vé đã đặt: trận của đội, vé sân tra theo SĐT, huỷ vé | `ActivitySchedule.tsx` | 30,4 KB; có khối chi tiết trận (`:700`) |

### 5.2 Giải đấu

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `CommunityForm` | Router con của khu giải đấu: chuyển giữa `matchmaking`/`tournaments`/`organizer` | `CommunityForm.tsx` | 8,5 KB |
| `TournamentLeaderboard` | Danh sách giải, bộ lọc môn, banner giải nổi bật, top Vua phá lưới, tab nhánh đấu | `TournamentLeaderboard.tsx` | 67,1 KB / 1.613 dòng |
| `TournamentOrganizerPortal` | Bảng điều hành BTC: duyệt đội, trọng tài, quyền tham gia, tài chính, sửa giải | `TournamentOrganizerPortal.tsx` | 89,3 KB / > 2.000 dòng — lớn thứ 2 |
| `TournamentBracket` | Cây nhánh đấu, nhập tỷ số, biên bản in, sinh lịch thi đấu | `TournamentBracket.tsx` | 67,1 KB / 1.714 dòng |
| `DrawLotteryOverlay` | Hiệu ứng bốc thăm (bát/bóng, âm thanh Web Audio), hỗ trợ cả `inline` và modal | `DrawLotteryOverlay.tsx` | 13,9 KB / 348 dòng |
| `TournamentProgressChart` | Biểu đồ tiến độ giải theo vòng | `TournamentProgressChart.tsx` | 4,1 KB |
| `WizardStepper` / `WizardPageShell` | Khung wizard 4 bước dùng chung cho 2 route `/tournaments/*` | 2 file | 3,0 KB / 2,6 KB |

### 5.3 Cộng đồng và chat

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `CommunityHub` | Danh sách kênh công khai + DM, tìm/lọc, mở phòng chat, CLB, đội bóng | `CommunityHub.tsx` | 32,9 KB; `GET /api/v1/chat/channels`, poll 5s |
| `CommunityChat` | Khung chat kênh/DM: gửi, trả lời, ghim, xoá, đính kèm, reaction, upload | `CommunityChat.tsx` | 29,0 KB; poll 4s |
| `GroupChatPanel` | Chat nhóm nhiều người: tạo nhóm, thêm/gỡ thành viên, quyền chủ nhóm | `GroupChatPanel.tsx` | 24,9 KB; poll 8s |
| `MatchmakingMarketplace` | Chợ kèo: đăng kèo, nhận kèo, gợi ý đối thủ bằng AI, ví kèo | `MatchmakingMarketplace.tsx` | 56,8 KB; form inline `mm-inline-*` |
| `MatchmakingCard` | Thẻ một bài đăng kèo (phong độ, uy tín, nút nhận kèo) | `MatchmakingCard.tsx` | 7,6 KB |
| `BusinessContacts` | Danh bạ đối tác B2B (chủ sân và BTC), mở DM | `BusinessContacts.tsx` | 6,6 KB |
| `GuestFeatureBanner` | Khối mời đăng nhập cho khách ở tab Cộng đồng | `GuestFeatureBanner.tsx` | 2,7 KB |

### 5.4 CLB và đội bóng

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `TeamClubManagement` | Đội bóng của tôi: đội làm đội trưởng, thành viên, lịch đấu | `TeamClubManagement.tsx` | 10,8 KB |
| `ClubManagement` | Quản lý CLB + thành viên, bổ nhiệm đại diện — toàn bộ form inline | `ClubManagement.tsx` | 20,5 KB |

### 5.5 Admin (`src/components/admin`, 13 file)

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `AdminOverview` | KPI toàn hệ thống + doanh thu theo tháng | `admin/AdminOverview.tsx` | 5,6 KB |
| `AdminUsers` | Danh sách người dùng, phân trang server-side, đổi role/khóa/xoá, chi tiết user | `admin/AdminUsers.tsx` | 17,6 KB |
| `AdminTournaments`, `AdminPitches`, `AdminBookings` | Đóng/mở/xoá giải; danh sách cụm sân; đơn đặt sân và doanh thu, huỷ kèm hoàn cọc | 3 file | 5,9 / 3,2 / 8,3 KB |
| `AdminModeration`, `AdminChatModeration` | Gỡ tin chợ kèo; kiểm duyệt tin nhắn chat | 2 file | 4,9 / 7,9 KB |
| `AdminNotifications`, `AdminAuditLogs` | Gửi thông báo hệ thống; nhật ký thao tác quản trị | 2 file | 5,3 / 6,9 KB |
| `AdminCharts`, `ChartExport` | Biểu đồ recharts + xuất chart thành ảnh | 2 file | 22,7 / 4,1 KB |
| `AdminTable`, `AdminUI` | Bảng generic có phân trang; `ConfirmModal` (hỗ trợ `inline`) + `AdminToast` | 2 file | 5,8 / 4,7 KB |

### 5.6 Chủ sân

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `AdminDashboard` | **Bảng điều hành chủ sân** (không phải admin hệ thống): ma trận ca, doanh thu, đặt tại quầy, canteen, cấu hình sân, cảnh báo đơn realtime | `AdminDashboard.tsx` | 107,1 KB / 2.678 dòng — file lớn nhất dự án |
| `StadiumOwnerOnboarding` | Wizard khởi tạo cụm sân cho OWNER mới | `StadiumOwnerOnboarding.tsx` | 26,9 KB |
| `OwnerProfileConsole` | Hồ sơ chủ sân (sửa inline, upload avatar) | `OwnerProfileConsole.tsx` | 23,1 KB |
| `OwnerCharts` | Biểu đồ doanh thu/occupancy của chủ sân | `OwnerCharts.tsx` | 10,7 KB |
| `OwnerReportExport` | Xuất CSV + gửi email báo cáo | `OwnerReportExport.tsx` | 11,4 KB |

> [!NOTE]
> Tên `AdminDashboard` dễ gây nhầm: nó là console của **OWNER** (`page.tsx:502-508` chỉ render khi `currentUser.role === "OWNER"`). Console của `ADMIN` là `app/admin/page.tsx` + `components/admin/*`.

### 5.7 Component dùng chung

| Component | Vai trò | File | Ghi chú |
| --- | --- | --- | --- |
| `Navbar` | Thanh trên (logo, menu theo role, dropdown nhóm, chuông thông báo, menu user), bottom nav mobile, drawer mobile | `Navbar.tsx` | 50,7 KB / 1.388 dòng |
| `AuthModal` | Hộp thoại đăng nhập/đăng ký (modal toàn màn hình) | `AuthModal.tsx` | 23,2 KB; xem vi phạm ở mục 7 |
| `GoogleLoginButton` | Nút Google GSI + nút Facebook tạm | `GoogleLoginButton.tsx` | 9,8 KB |
| `NotificationsCenter` | Danh sách thông báo inline cho `/notifications` | `NotificationsCenter.tsx` | 9,4 KB |
| `PlayerProfileConsole` | Hồ sơ VĐV: phong độ, thể chất, lịch sử, cài đặt | `PlayerProfileConsole.tsx` | 55,2 KB |
| `PlayerSetup` | Trang khởi tạo hồ sơ cầu thủ + `markPlayerSetupPending`/`clearPlayerSetupPending`/`isPlayerSetupPending` | `PlayerSetup.tsx` | 12,5 KB |
| `SafeImage` | `<img>` có placeholder khi ảnh lỗi | `SafeImage.tsx` | 1,5 KB; `loading="lazy"` |
| `Toaster`, `BootSplash` | Render toast từ `lib/toast.ts`; vòng xoay hiện ngay khi F5 | 2 file | 1,9 / 0,7 KB |
| `LoadingGate`, `PageSpinner` | Chờ tối thiểu `minMs`; spinner nhiều cỡ | 2 file | 1,2 / 2,1 KB |
| `BackendStatusBanner` | Banner mất kết nối + `BackendOfflineDot` + `BackendRestoredToast` | `BackendStatusBanner.tsx` | 6,6 KB |
| `AvatarUploader` | Upload avatar lên `/api/v1/chat/upload` | `AvatarUploader.tsx` | 3,3 KB |
| `NavbarAvatar`, `CountUp`, `Reveal`, `RealtimeClockBar`, `FormDots` | Avatar chữ cái, đếm số, animation xuất hiện, đồng hồ, chuỗi phong độ | 5 file | 0,9–2,0 KB mỗi file |
| `LandingHero`, `LandingFeatures` | Landing cho khách ở tab `booking` | 2 file | 13,9 / 13,6 KB |
| `ThemeProvider` | No-op (dark mode đã gỡ) | `ThemeProvider.tsx` | 11 dòng |

---

## 6. Luồng nghiệp vụ tiêu biểu

### 6.1 Đặt sân và thanh toán giữ chỗ

1. `PitchSearch` gọi `getAllPitchesApi()` → `GET /api/v1/pitches`, dựng danh sách cụm sân và ca trống; widget AI gọi `recommendPitches(clusters, preference)` → `POST /api/ai/recommend-pitches`.
2. Người dùng chọn cụm sân → `PitchSearch` render `PitchDetail` (`PitchSearch.tsx:411`) với prop `pitch`, `user`, `onBack`.
3. `PitchDetail` nạp ma trận ca (`GET /api/v1/pitches/{id}/matrix?date=&duration=`), chọn ngày và ca.
4. `handleStartBooking()` (`PitchDetail.tsx:230`): kiểm tra ca còn trống, đã đăng nhập, hồ sơ có `phone`; chọn mức cọc `50%`/`100%` (state `depositOption`).
5. `POST /api/v1/pitches/{pitchId}/book` với `courtName`, `courtType`, `timeSlot`, `bookingDate`, `customerName`, `customerPhone`, `depositPercent`, `via`. Server tự tính lại giá và tiền cọc.
6. Response có `id` → lưu `bookingConfirmed`, mở khối QR (`showQrModal`) hiển thị mã giữ chỗ `bookingConfirmed.code`, số tiền cọc dự kiến = 50% hoặc 100% `totalPrice`.
7. Phát `broadcastBookingEvent({ type: "BOOKING_CREATED", ... })` → mọi tab/cửa sổ của **cùng trình duyệt** nhận sự kiện; `AdminDashboard` cộng thêm heartbeat 4 giây để nhận đơn từ thiết bị khác.
8. Người dùng bấm "Tôi đã chuyển khoản" → `handleCompletePayment()` đánh dấu `paymentDone`, gọi lại ma trận ca và phát thêm sự kiện `BOOKING_CREATED` kèm `depositPaid`.
9. Đối chiếu tiền thật do chủ sân thực hiện: `checkInBookingApi` (`PUT .../check-in`) hoặc `cancelBookingApi` (`POST .../cancel`) từ `AdminDashboard`; khách tự huỷ qua `POST /api/v1/pitches/bookings/{id}/cancel-by-customer` trong `ActivitySchedule`.

### 6.2 Đăng ký giải và duyệt đội

1. Người chơi vào `/?tab=tournaments` → `CommunityForm` → `TournamentLeaderboard` → nút đăng ký dẫn tới `/tournaments/register?tournamentId=...`.
2. `RegisterTeamWizard` gọi `fetchTournaments()` và lọc `status === "OPEN"` (`register/page.tsx:80`).
3. Nếu giải `joinMode === "INVITE_ONLY"`: so email đang đăng nhập với `invitedEmails`; không khớp thì chặn ở bước 1 (`register/page.tsx:101-108`).
4. Bước 2 nhập tên đội và quân số (5–25). Bước 3 nhập đội trưởng + SĐT (regex `/^0\d{9}$/`).
5. Trước khi nộp, nếu tên/SĐT đội trưởng khác hồ sơ thì gọi `updateProfile` để backend lấy đúng người từ token (`register/page.tsx:145-157`).
6. `registerTeam(id, payload)` → `POST /api/v1/tournaments/{id}/register`; sau đó `refreshTournamentInCache(id)` chỉ tải lại **một** giải thay vì toàn bộ danh sách.
7. Hiện `PaymentSuccess`: `buildVietQrUrl()` dựng ảnh `https://api.vietqr.io/image/{bankCode}-{account}-compact2.png` (số tài khoản bỏ khoảng trắng); nút "Tôi đã chuyển khoản" chỉ đánh dấu phía client.
8. BTC duyệt: `getPendingTeams` → `GET .../teams/pending`; `approveTeam`/`rejectTeam` → `POST .../teams/{team}/approve|reject`; xác nhận lệ phí `confirmTeamPayment` → `POST .../teams/confirm-payment`.
9. Số đội hiển thị theo hai ngưỡng trong `tournamentService`: `confirmedCount` (đã `CONFIRMED`/`SIMULATED`, dùng cho sức chứa) và `drawableCount` (dùng cho điều kiện bốc thăm).

### 6.3 Bốc thăm và nhập tỷ số

1. BTC bấm bốc thăm → `drawTournamentBracket(id)` → `POST /api/v1/tournaments/{id}/draw`.
2. Response có `bracket.rounds[]`; UI hiện hiệu ứng `DrawLotteryOverlay` trong lúc chờ.
3. Sau khi xong, `fetchTournaments(true)` làm mới cache; `TournamentLeaderboard` chuyển sang tab "Nhánh Đấu" và `TournamentBracket` render cây nhánh từ `bracketJson`.
4. Sinh lịch: `generateTournamentSchedule(id, { startDate, matchesPerDay, daysBetweenRounds, startHour, matchMinutes })` → `POST /{id}/schedule`; lịch ghi vào `bracketJson` (`matchDate`, `timeSlot`, `pitchName`).
5. Nhập kết quả: `saveMatchResult(id, { matchId, scoreA, scoreB, scorers, yellowCards*, redCards*, substitutions*, mvpPlayer, notes })` → `POST /{id}/matches`; response trả `formChanges` (phong độ trước/sau của hai đội).
6. Huỷ kết quả: `undoMatchResult` → `DELETE /{id}/matches/{matchId}` (xoá bản ghi và cầu thủ ghi bàn, mở lại trận), sau đó refresh danh sách giải.
7. Bảng xếp hạng/Vua phá lưới: `fetchTournamentScorers` (`GET /{id}/scorers`) và `fetchTopScorers(limit)` (`GET /api/v1/tournaments/scorers/top`).
8. Demo nhanh: `fillSimulatedTeams` (`POST /{id}/fill-teams`), `simulateTournamentResults` (`POST /{id}/simulate-results`), `clearSimulatedTeams` (`DELETE /{id}/simulated-teams`).

### 6.4 Chat cộng đồng và chat nhóm

1. Tab Cộng đồng → `CommunityHub` gọi song song `GET /api/v1/chat/channels` và `GET /api/v1/chat/conversations`, poll làm mới mỗi 5 giây; kênh hệ thống gồm `general` và `giai-dau` (`TOURNAMENT_CHANNEL`).
2. Mở kênh → `CommunityChat` tải `GET /api/v1/chat/messages?channel=<slug>` (hoặc `?with=<email>` cho DM), poll 4 giây.
3. Gửi tin: `POST /api/v1/chat/messages`; ghim: `POST /api/v1/chat/messages/{id}/pin?value=`; xoá: `DELETE /api/v1/chat/messages/{id}`; tìm người: `GET /api/v1/chat/users?query=`.
4. Đính kèm: `uploadChatFile(file)` → `POST /api/v1/chat/upload` (multipart, tự gắn Bearer).
5. Chat nhóm: `GroupChatPanel` + `groupChat.ts` — danh sách `GET /api/v1/chat-groups`, tin nhắn `GET /api/v1/chat-groups/{id}/messages`, gửi `POST` cùng đường dẫn, đánh dấu đọc `POST /{id}/read`, quản lý thành viên `POST/DELETE /{id}/members`, reaction `POST /api/v1/chat/messages/{id}/react`.
6. Thông báo khi ở tab khác: `useChatPushNotification` bắn Notification API (chỉ khi `document.hidden`), tag `shub-chat`, mốc chống lặp ở `shub_chat_last_notified_id`.
7. Badge chưa đọc trên Navbar: `getUnreadCount()` → `GET /api/v1/chat/unread-count`, poll 30 giây.

### 6.5 Xem dashboard chủ sân

1. OWNER đăng nhập → `page.tsx` đặt `activeTab = "admin"` → render `AdminDashboard`.
2. `getMyPitchesApi()` → `GET /api/v1/pitches/my-pitches` (chỉ cụm sân của chính chủ sân), chọn `activePitch`.
3. Với cụm sân đang chọn: `getPitchMatrixApi` (`GET /{id}/matrix`), `getPitchStatsApi` (`GET /{id}/stats`), `getPitchBookingsApi` (`GET /{id}/bookings`).
4. Heartbeat 4 giây gọi `/api/v1/pitches/{id}/stats?date=`; khi `bookedSlots` tăng thì phát chuông và tải lại ma trận.
5. Nhận đơn tại quầy: `bookOfflineApi` (`POST /{id}/book-offline`) với `via` là hình thức thu tiền.
6. Check-in khách: `checkInBookingApi`; huỷ ca: `cancelBookingApi` kèm lý do, sau đó `broadcastBookingEvent` để tab của cầu thủ nhận thông báo huỷ.
7. Cấu hình: `PUT /api/v1/pitches/{id}/operating-hours` (giờ mở cửa, độ dài ca), `PUT /api/v1/pitches/{id}/price`, `POST /{id}/add-court`, canteen qua `canteenService`.
8. Báo cáo: `OwnerCharts` (recharts) + `OwnerReportExport` tải CSV (`/api/v1/reports/bookings.csv`, `revenue.csv`, `summary.csv`) và gửi email báo cáo.

### 6.6 Admin duyệt nội dung

1. ADMIN vào `/admin`; `app/admin/page.tsx` kiểm tra `user.role !== "ADMIN"` và hiện khối từ chối.
2. 9 section: `overview`, `users`, `tournaments`, `pitches`, `bookings`, `moderation`, `chat`, `notifications`, `audit` (`admin/page.tsx:30-42`).
3. Người dùng: `listAdminUsersPaged({ page, size, q, role })` → `GET /api/v1/admin/users?...`; đổi trạng thái `PATCH /admin/users/{id}/status`, đổi role `PATCH .../role`, xoá `DELETE .../{id}`, xem chi tiết `GET .../{id}/detail` (hồ sơ + số đơn + tổng chi + kèo đã đăng).
4. Kiểm duyệt chợ kèo: `listMatchmakingPosts()` → `GET /api/v1/community/matchmaking-posts`; gỡ tin `DELETE /api/v1/admin/matchmaking-posts/{id}`.
5. Kiểm duyệt chat: `GET /api/v1/chat/admin/messages`, xoá `DELETE /api/v1/chat/admin/messages/{id}`.
6. Giải đấu: `setTournamentStatus` (`PATCH /api/v1/tournaments/{id}/status`), `deleteTournament`.
7. Thông báo: `broadcastNotification({ title, message, targetRole, link })` → `POST /api/v1/notifications/broadcast`; người dùng nhận qua `GET /api/v1/notifications/mine`.
8. Nhật ký: `GET /api/v1/admin/audit-logs`. Bảo trì: `DELETE /api/v1/admin/maintenance/orphans`.

---

## 7. Design system & quy tắc UI bắt buộc

Nguồn quy tắc: `GEMINI.md` mục "Quy tắc UI BẮT BUỘC" và "Quy tắc giao diện (UI)".

### 7.1 Token màu

| Token | Hex | Dùng ở đâu |
| --- | --- | --- |
| `brand` | `#0369a1` | Nút chính, trạng thái active, link nhấn |
| `brand-dark` | `#075985` | `hover:` của nút chính |
| `brand-ink` | `#0b4f6c` | Chữ thương hiệu trên nền sáng |
| `pitch-lime` | `#84cc16` | Accent, badge "mới" |
| `pitch-navy` | `#0f172a` | Nền tối trong vài khối, chữ chính |
| `pitch-lightBg` | `#f8fafc` | Nền trang (`body`) |
| `pitch-accentAmber` / `accentRed` | `#f59e0b` / `#ef4444` | Cảnh báo / lỗi |
| `slate-500` | `#64748b` | Chữ phụ, nhãn mô tả |

> [!WARNING]
> Token `brand` và `pitch-*` gần như không được dùng: **0** lần `bg-brand`/`text-brand`/`border-brand`, 2 lần `bg-pitch-*`. Trong khi đó hex `#0369a1` xuất hiện **770** lần và `#0b4f6c` **108** lần trực tiếp trong class (ví dụ `Navbar.tsx:209`, `page.tsx:397`, `AdminDashboard.tsx:901`). Quy ước "dùng class `bg-brand` thay cho ghi hex tay" trong `tailwind.config.js:12` chưa được áp dụng.

### 7.2 Typography

| Hạng mục | Quy định | Thực tế trong code |
| --- | --- | --- |
| Font chính | Be Vietnam Pro, weight 400–900 | `layout.tsx:15-21`, `--font-sans` |
| Font mono | JetBrains Mono, weight 500–800 | `layout.tsx:23-29`, `--font-mono` |
| Heading | weight 800, `letter-spacing: -0.02em`, `text-wrap: balance` | `globals.css:43-52` |
| Body | weight 400 (mobile 450), `line-height: 1.65` | `globals.css:26-36`, `66-70` |
| Cỡ nhỏ nhất | 13px | `text-[13px]` xuất hiện **1.536** lần; `text-sm` (14px) **463** lần |
| `text-xs` / `text-2xs` | Bị cấm | **0** lần trong toàn bộ `src` |

### 7.3 Kiểm tra tuân thủ từng quy tắc

> Bảng dưới phản ánh trạng thái **sau đợt sửa UI ngày 2026-10-25**: nâng sàn chữ lên 13px, bỏ nhãn viết hoa, chuyển hàng chip sang `flex-wrap`, bốc thăm hiển thị inline, Việt hoá các nhãn còn tiếng Anh. Hai việc còn tồn tại có chủ đích: `AuthModal` vẫn là modal đăng nhập (xem 7.4) và chưa thay `truncate` hàng loạt vì rủi ro cắt chữ ở bảng dữ liệu.

| Quy tắc (GEMINI.md) | Kết quả kiểm tra | Vi phạm còn tồn tại |
| --- | --- | --- |
| Chữ tối thiểu 13px, cấm `text-[8..12px]`/`text-xs` | Đạt: 0 lần `text-xs`, 0 lần `text-[8..12px]` trong toàn bộ `src` | Không còn. `FormDots` cỡ `sm` dùng hộp 18px với chữ `text-[13px]`; `globals.css` nâng mọi lớp `text-[10/11/12px]` lên 13px làm lưới an toàn |
| Không viết hoa nhãn nhỏ (bỏ class `uppercase`) | Đạt: **0** class `uppercase`, **0** nhãn gõ cứng toàn chữ hoa | Không còn. Đã sửa nhãn ở `ActivitySchedule`, `AdminDashboard`, `TournamentOrganizerPortal`, `PitchDetail`, `TournamentBracket`, placeholder `tournaments/new` và `AdminDashboard` |
| Không modal/overlay cho form nhập liệu, form phải inline | Phần lớn tuân thủ: **17** khối form inline có id `*-inline*` (ví dụ `AdminDashboard.tsx:1934,2134,2243,2402,2480,2567`, `MatchmakingMarketplace.tsx:1120,1248,1334`, `MultiSportArena.tsx:601,663`, `PitchSearch.tsx:1467`, `TournamentOrganizerPortal.tsx:2000`) | `AuthModal.tsx:275` — form đăng nhập/đăng ký vẫn là modal `fixed inset-0`. Nhiều biến/tên khối vẫn gọi là "Modal" (`showEditInfoModal`, comment "MODAL 0: SỬA HỒ SƠ CỤM SÂN") nhưng đã render inline |
| Hiệu ứng bốc thăm phải inline | Cả hai nơi gọi đều truyền `inline`: `TournamentLeaderboard.tsx:811`, `TournamentBracket.tsx:1700` | Không còn. Nhánh overlay `fixed inset-0` trong `DrawLotteryOverlay.tsx:208` chỉ còn là dự phòng cho caller mới không truyền `inline` |
| Mỗi tab một nội dung, không lặp khối | Đã tách `CommunityHub` (chat) khỏi `CommunityForm` (giải đấu); comment `CommunityForm.tsx` ghi rõ tab `chat` đã bị bỏ khỏi danh sách | Không phát hiện khối trùng lặp rõ ràng trong phạm vi đọc |
| Chip/hàng nút dùng `flex-wrap`, không `overflow-x-auto`; nhãn dài dùng `line-clamp-2` thay `truncate` | `flex-wrap` **111** lần; `overflow-x-auto` còn **13** lần, tất cả là wrapper bảng/cuộn ngang có chủ đích | Không còn hàng chip dùng `overflow-x-auto` (đã chuyển 4 chỗ: `PitchSearch`, `AdminDashboard`, `ActivitySchedule`, `TeamClubManagement`). `truncate` **149** lần so với `line-clamp` **6** lần vẫn là nợ kỹ thuật |
| Nhãn UI tiếng Việt | Đã Việt hoá các nhãn còn lại: "Live Score" → "Đang Diễn Ra", "Realtime" → "Trực Tiếp", "Hotline" → "Đường dây nóng" | Không còn nhãn tiếng Anh ở các màn hình chính. Tên kỹ thuật (`RealtimeBookingEvent`, `realtimeService`) vẫn giữ tiếng Anh theo quy ước code |

### 7.4 Các overlay `fixed inset-0` còn lại (9 chỗ)

| File:line | Nội dung | Đánh giá theo quy tắc |
| --- | --- | --- |
| `AuthModal.tsx:275` | Form đăng nhập/đăng ký | Vi phạm quy tắc 1 (form nhập liệu trong modal) |
| `DrawLotteryOverlay.tsx:208` | Hiệu ứng bốc thăm khi không truyền `inline` | Đã chuyển sang inline ở cả 2 caller; nhánh này chỉ còn để dự phòng |
| `admin/AdminUsers.tsx:382` | Chi tiết người dùng (chỉ đọc) | Không phải form, chấp nhận được |
| `admin/AdminUI.tsx:44` | Hộp xác nhận Yes/No (có nhánh `inline`) | Chấp nhận được |
| `PitchDetail.tsx:1055` | Mã QR giữ chỗ sau khi đặt | Chỉ hiển thị, chấp nhận được |
| `PitchSearch.tsx:1580` | Thẻ hội viên QR | Chỉ hiển thị, chấp nhận được |
| `BootSplash.tsx:21` | Vòng xoay lúc F5 | Không phải form |
| `page.tsx:339` | Lớp phủ loading khi chuyển tab (tối thiểu 1 giây) | Không phải form nhưng che toàn màn hình; nên cân nhắc thu hẹp |
| `Navbar.tsx:885` | Drawer menu mobile | Điều hướng, chấp nhận được |

### 7.5 Quy ước bổ sung đang dùng trong code

- Nền trang `bg-slate-50`, chữ `text-slate-900`, card `bg-white border-slate-200 rounded-2xl` (`rounded-3xl` cho khối lớn).
- Bóng đổ nhẹ: `.glass-panel`, `.stadium-shadow` (`globals.css:89-129`); container `.hub-container` max-width 1720px, padding 1rem → 2rem → 50px.
- Motion token: `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`, `--dur-fast/normal/slow`, `--stagger-step: 70ms` (`globals.css:186-192`); animation `animate-fade-in`, `animate-fade-in-up`, `animate-modal-pop`, `animate-slide-left`, `animate-bell-wiggle`.
- `prefers-reduced-motion` được tôn trọng toàn cục (`globals.css:213-220`) và trong `DrawLotteryOverlay.tsx:130-139` (tắt xáo và tắt âm thanh).
- Font-size input ép 16px trên mobile để iOS không tự zoom (`globals.css:303-308`).

---

## 8. Hiệu năng & chất lượng

### 8.1 File lớn (> 50 KB)

Có **8 file** vượt 50 KB, tất cả trong `src/components`:

| File | Dung lượng | Dòng |
| --- | --- | --- |
| `AdminDashboard.tsx` | 107,1 KB | 2.678 |
| `TournamentOrganizerPortal.tsx` | 89,3 KB | > 2.000 |
| `TournamentBracket.tsx` | 67,1 KB | 1.714 |
| `TournamentLeaderboard.tsx` | 67,1 KB | 1.613 |
| `PitchSearch.tsx` | 64,6 KB | 1.622 |
| `MatchmakingMarketplace.tsx` | 56,8 KB | — |
| `PlayerProfileConsole.tsx` | 55,2 KB | — |
| `Navbar.tsx` | 50,7 KB | 1.388 |

### 8.2 Code splitting và bundle

- **Không có `next/dynamic` hay `React.lazy`** trong toàn bộ `src` (0 lần).
- `app/page.tsx` import tĩnh 20 component; vào trang chủ là tải luôn `AdminDashboard` (107 KB), `TournamentOrganizerPortal` (89 KB), `TournamentBracket`, `TournamentLeaderboard`... dù khách chỉ xem tab Đặt sân.
- `recharts` nằm trong bundle chính do `OwnerCharts`/`AdminCharts` được import tĩnh; `framer-motion` chỉ dùng cho `motion.div` bọc nội dung tab ở `page.tsx:373-379`.
- Suspense boundary ở 3 route (`/admin`, `/tournaments/new`, `/tournaments/register`) chỉ để bọc `useSearchParams`, không tách chunk.

### 8.3 Ảnh

- Toàn bộ ảnh đi qua `components/SafeImage.tsx` → thẻ `<img>` với `loading="lazy"` và fallback khung xám khi lỗi (có `eslint-disable @next/next/no-img-element`).
- Chỉ có **1** thẻ `<img>` thô ngoài `SafeImage`: `tournaments/register/page.tsx:457` (QR VietQR, cũng có `loading="lazy"`).
- Không dùng `next/image` → không có `srcset`, không tối ưu AVIF/WebP, không có `width`/`height` nên có nguy cơ layout shift.
- Nguồn ảnh: Unsplash (ảnh sân mẫu), `img.vietqr.io` (QR), `/turfzone-logo.png` (logo), `/api/v1/chat/files/*` (ảnh chat — `lib/avatar.ts` ghép `API_BASE_URL` cho đường dẫn tương đối).

### 8.4 Error / not-found / loading

- `app/error.tsx` bắt lỗi runtime cho toàn bộ cây route dưới `app/`, hiện `error.digest` và ghi `console.error`.
- `app/not-found.tsx` là 404 chung; không có 404 riêng cho `/tournaments/*`.
- `app/loading.tsx` dùng `LoadingGate minMs={1000}`; `page.tsx` cũng tự giữ spinner chuyển tab tối thiểu 1 giây (`MIN_TAB_LOADING_MS = 1000`).
- Không có `global-error.tsx` (lỗi ở chính `layout.tsx` sẽ ra trang lỗi mặc định của Next). Lỗi mạng được "mềm hoá" bằng `BackendStatusBanner` + toast thay vì màn hình trắng.

### 8.5 Accessibility cơ bản

| Hạng mục | Số liệu / ghi chú |
| --- | --- |
| `aria-label` | 109 lần |
| `role=...` | 34 lần (`dialog`, `alertdialog`, `status`, `alert`, `tablist`, `img`) |
| `htmlFor` gắn với `id` input | 38 lần (chủ yếu trong 2 wizard) |
| Đóng bằng `Escape` | `AuthModal.tsx:109`, `admin/AdminUI.tsx:32` |
| Focus trap | **Không có** — modal không khoá focus, không trả focus về phần tử mở |
| `aria-modal` | Dùng ở `AuthModal.tsx:283`, `DrawLotteryOverlay.tsx:213`, `AdminUI.tsx:52` |
| Giảm chuyển động | `prefers-reduced-motion` toàn cục + trong `DrawLotteryOverlay` |
| Ảnh | `alt` bắt buộc ở `SafeImage`; ảnh trang trí dùng `alt=""` + `aria-hidden` |

### 8.6 Điểm nợ kỹ thuật đáng chú ý

1. **Type safety yếu**: `tsconfig.json` đặt `strict: false`, `target: es5`; 284 chỗ khai báo `: any` trong `src`.
2. **Không có test**: không có thư mục test, không có script `test` trong `package.json`.
3. **Hai nguồn sự thật cho trạng thái đăng nhập**: `AuthContext.user` và `localUser` trong `page.tsx:36`; `currentUser = authUser || localUser`.
4. **Token theo role ghi mà không đọc**: `setAuthToken(token, role)` tạo `Turfzone_token_<ROLE>` nhưng không chỗ nào gọi `getAuthToken(role)`.
5. **Logout không gọi backend**; `?role=` và `?sim=` trong `openDualRoleWindow` không được `page.tsx` đọc.
6. **Import thừa / thiếu `"use client"`**: `app/player-setup/page.tsx:4` import `AuthProvider` nhưng không dùng; `MemberCardPortal.tsx`, `StadiumOwnerOnboarding.tsx`, `TournamentLeaderboard.tsx` dùng hook nhưng thiếu `"use client"` (chạy được vì luôn được import từ file client).
7. **Comment lỗi thời**: nhiều biến `show*Modal`/comment "MODAL" nhưng render inline; `page.tsx:103-118` mô tả guard trùng với mã.
8. **Hex màu rải rác**: 770 lần `#0369a1`, 108 lần `#0b4f6c` thay vì token (xem 7.1).
9. **`console.log` còn 1 chỗ**; nhiều `console.warn`/`console.error` dùng làm logging chính.
10. **`apiRequest` cache `no-store` toàn bộ** → không tận dụng cache HTTP; bù lại có cache tay cho danh sách giải.
11. **`distDir` phụ thuộc `PORT`** → mỗi cổng sinh một thư mục build riêng, cần để ý khi dọn ổ đĩa/CI.

---

## 9. Build & triển khai

### 9.1 Lệnh

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # next build, kế thừa output: 'standalone'
npm run start    # chạy bản build
npm run lint     # next lint
```

`vercel.json` khai báo `framework: "nextjs"`, `buildCommand: "npm run build"`, `devCommand: "npm run dev"`, `installCommand: "npm install"`, `version: 2`. Không có rewrite/proxy nào trong `vercel.json` hay `next.config.js`.

### 9.2 Output và chạy standalone

- `output: 'standalone'` → sau `next build` có `.next-<PORT>/standalone/server.js` (hoặc `.next/standalone` khi không set `PORT`), chạy bằng `node .next/standalone/server.js`.
- `distDir` đổi theo `PORT`: build ở cổng 3000 ghi `.next-3000`, cổng 3001 ghi `.next-3001`. `tsconfig.json` đã include `.next-3000/types/**` và `.next-3001/types/**` để IntelliSense không lỗi khi chạy song song.
- Không có Dockerfile trong `frontend/`; `nixpacks.toml`, `railway.json`, `render.yaml` ở thư mục gốc dự án là cấu hình cho backend/AI.

### 9.3 Biến môi trường trên Vercel

| Biến | Ví dụ trong `.env.example` |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` (bắt buộc) | `https://Turfzone-backend-core-production.up.railway.app` |
| `NEXT_PUBLIC_AI_BASE_URL` (tùy chọn) | `https://Turfzone-ai-service.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (nếu bật Google login) | không có trong `.env.example`, đọc ở `GoogleLoginButton.tsx:39` |

Vì mọi biến đều là `NEXT_PUBLIC_*`, giá trị được **nhúng vào bundle lúc build** — đổi biến bắt buộc redeploy, không thể chỉ restart.

### 9.4 Proxy sang backend/AI và CORS

- Không có proxy cho backend Spring Boot: trình duyệt gọi thẳng `${API_BASE_URL}/api/v1/...`. Vì vậy backend phải cấu hình CORS cho origin của frontend (localhost:3000/3001 khi dev, domain Vercel khi prod); và vì `apiRequest` đặt `credentials: 'include'`, backend cần `Access-Control-Allow-Credentials: true` cùng origin cụ thể (không dùng `*`).
- AI service được proxy qua Route Handler `/api/ai/[...slug]` để tránh CORS trên mobile; route này tự trả `Access-Control-Allow-Origin: *` cho phía gọi nó.
- Route proxy chạy `force-dynamic` và `maxDuration = 60`, phù hợp cold start của Render free tier (timeout upstream 55 giây).
- `fetchWithTimeout` mặc định 15 giây; `aiService` cho mobile 60 giây và tổng ngân sách 32 giây.

### 9.5 Checklist khi deploy

1. Đặt `NEXT_PUBLIC_API_BASE_URL` đúng host backend (đối chiếu lại với `api.ts:7`).
2. `NEXT_PUBLIC_AI_BASE_URL` nếu muốn bật tính năng AI; bỏ trống thì `recommendPitches`/`matchmakingAi` trả `null` và UI ẩn widget.
3. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + thêm domain Vercel vào Authorized JavaScript origins của Google Cloud Console.
4. Kiểm tra `/api/v1/health` từ trình duyệt: nếu banner "Không kết nối được máy chủ Turfzone" hiện ra thì hoặc sai `NEXT_PUBLIC_API_BASE_URL`, hoặc backend chưa bật CORS cho domain mới.
5. Giữ `images.remotePatterns` nếu sau này chuyển sang `next/image`; hiện tại không ảnh hưởng build.

> [!NOTE]
> Vì token nằm trong `sessionStorage`, mỗi tab là một phiên riêng. Khi demo hai vai trò (chủ sân và cầu thủ) trên cùng máy, dùng `npm run dev` (3000) và `npm run dev:player` (3001) để có hai origin khác nhau, tránh ghi đè token của nhau.
