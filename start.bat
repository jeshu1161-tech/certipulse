@echo off
echo ===================================================
echo     Starting CertiPulse Application Services
echo ===================================================
echo.
echo Starting Backend API Server (Port 5000)...
start "CertiPulse Backend" cmd /k "cd /d %~dp0server && node src/server.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend Web App (Port 5173)...
start "CertiPulse Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ===================================================
echo   CertiPulse is launching!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000/api/health
echo ===================================================
pause
