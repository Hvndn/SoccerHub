@echo off
chcp 65001 > nul
title Turfzone [KICK-ON] - Native Single Runner

echo ========================================================
echo   Turfzone [KICK-ON] - NATIVE HIGH-PERFORMANCE RUNNER
echo   (Backend: 8080 ^| AI: 8000 ^| Web: 3000)
echo ========================================================
echo.

:: 1. Tu dong tim va nap duong dan Maven neu chua co trong PATH
where mvn >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Users\LAPTOP AK\Downloads\Downloads\apache-maven-3.9.9\bin" (
        set "PATH=C:\Users\LAPTOP AK\Downloads\Downloads\apache-maven-3.9.9\bin;%PATH%"
    ) else if exist "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.15\0226a00282e400185496f3b60ec5a3f029cbdc6893912937d4876d57695224e1\bin" (
        set "PATH=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.15\0226a00282e400185496f3b60ec5a3f029cbdc6893912937d4876d57695224e1\bin;%PATH%"
    )
)

:: 2. Giai phong cac cong 3000, 3001, 8080, 8000 tranh xung dot tien trinh cu
echo [*] Dang don dep va giai phong cac cong mang (3000, 3001, 8080, 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: 3. Xoa cache Webpack bi loi (.next) neu ton tai de ngan ngua ChunkLoadError
if exist "frontend\.next\BUILD_ID" (
    echo [*] Phat hien cache Next.js cu, dang xoa frontend\.next de chong ChunkLoadError...
    rmdir /s /q "frontend\.next" >nul 2>&1
)

echo.
echo ========================================================
echo   HE THONG KHOI CHAY 3 DICH VU NATIVE CHUAN:
echo   - Backend Core  : [BACKEND]     - Cyan   - http://localhost:8080
echo   - AI Service    : [AI-SERVICE]  - Yellow - http://localhost:8000
echo   - Turfzone Web  : [WEB-3000]    - Green  - http://localhost:3000
echo.
echo   [!] LUU Y TEST DA VAI TRO (Owner / Player / Admin):
echo       - Mo trinh duyet binh thuong: http://localhost:3000 (Owner / Admin)
echo       - Mo Tab An Danh (Ctrl+Shift+N): http://localhost:3000 (Player)
echo       * KHONG chay 2 Next.js cung thu muc frontend de tranh loi ChunkLoadError!
echo.
echo   [!] Nhan Ctrl+C de dung tat ca dich vu.
echo ========================================================
echo.

npx -y concurrently --names "BACKEND,AI,WEB-3000" --prefix-colors "cyan,yellow,green" --restart-tries 2 "cd backend-core && mvn spring-boot:run" "cd ai-service && python main.py" "cd frontend && npm run dev"
