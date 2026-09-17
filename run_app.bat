@echo off
echo ===================================================
echo Starting MPLAD AI Monitor Platform (SIH 2026)
echo ===================================================

start "MPLAD Backend API" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "MPLAD Frontend UI" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host"
timeout /t 2 /nobreak >nul

start http://localhost:5173

echo.
echo ===================================================
echo Services Started!
echo Browser opened at: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
