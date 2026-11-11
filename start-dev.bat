@echo off
TITLE SIMPRO RENJA - BAPPERIDA KABUPATEN BANYUMAS
echo =========================================================================
echo    MENYALAKAN SERVER SIMPRO RENJA (BAPPERIDA KABUPATEN BANYUMAS)
echo =========================================================================
echo.
echo 1. Memulai Backend API Server di http://localhost:5000...
start "SIMPRO RENJA - Backend API" cmd /k "cd backend && npm run dev"

echo 2. Memulai Frontend Web Client di http://localhost:5173...
start "SIMPRO RENJA - Frontend Client" cmd /k "cd frontend && npm run dev"

echo.
echo =========================================================================
echo Server sedang berjalan!
echo Buka browser di: http://localhost:5173
echo =========================================================================
echo.
pause

