@echo off
echo ========================================
echo   GitHire AI - Startup Script
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "GitHire Server" cmd /k "cd /d %~dp0server && npm.cmd run dev"

echo Waiting for server to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Client...
start "GitHire Client" cmd /k "cd /d %~dp0client && npm.cmd run dev"

echo.
echo ========================================
echo   Both services are starting up!
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Health:   http://localhost:5000/health
echo ========================================
echo.
echo Close this window to stop both services.
pause
