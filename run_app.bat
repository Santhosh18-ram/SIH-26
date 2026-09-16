@echo off
echo ===================================================
echo Starting MPLAD AI Monitor Platform (SIH 2026)
echo ===================================================

start "MPLAD Backend API" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "MPLAD Frontend UI" cmd /k "cd frontend && npm run dev -- --host"

echo.
echo ===================================================
echo Services Started for Mobile and PC!
echo Local PC: http://localhost:5173
echo Mobile Phone: http://10.1.10.0:5173
echo ===================================================
