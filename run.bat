@echo off
chcp 65001 > nul
title Kick-ON Turfzone - Single Terminal Runner

echo ========================================================
echo   Turfzone [KICK-ON] - SINGLE TERMINAL RUNNER (NO DOCKER)
echo ========================================================
echo.

:: Chay truc tiep tren moi truong Native Windows (Khong dung Docker)

:: Auto detect Maven in PATH or set user fallback path
if exist "C:\Users\LAPTOP AK\Downloads\Downloads\apache-maven-3.9.9\bin" (
    set "PATH=C:\Users\LAPTOP AK\Downloads\Downloads\apache-maven-3.9.9\bin;%PATH%"
) else if exist "%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.15\0226a00282e400185496f3b60ec5a3f029cbdc6893912937d4876d57695224e1\bin" (
    set "PATH=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.15\0226a00282e400185496f3b60ec5a3f029cbdc6893912937d4876d57695224e1\bin;%PATH%"
)


:: Tu dong giai phong cong 3000, 3001, 8080, 8000 neu con tien trinh Windows cu bi treo
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo [INFO] Dang khoi chay he thong 2 ROLE SONG SONG trong 1 CUA SO TERMINAL:
echo   - Backend Core  (Port 8080) : [BACKEND]     - Cyan
echo   - AI Service    (Port 8000) : [AI-SERVICE]  - Yellow
echo   - CHU SAN       (Port 3000) : [CHU-SAN-3000]- Magenta (Admin Dashboard, Matrix, Realtime Alerts)
echo   - CAU THU       (Port 3001) : [CAU-THU-3001]- Green   (Booking, VietQR, Matchmaking)
echo.
echo [!] Nhan Ctrl+C de dung tat ca cac dich vu dong thoi.
echo ========================================================
echo.

npx -y concurrently --names "BACKEND,AI,OWNER-3000,PLAYER-3001" --prefix-colors "cyan,yellow,magenta,green" --restart-tries 2 "cd backend-core && mvn spring-boot:run" "cd ai-service && python main.py" "cd frontend && npx next dev -p 3000" "cd frontend && npx next dev -p 3001"




