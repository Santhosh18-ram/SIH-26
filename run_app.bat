@echo off
echo ===================================================
echo Starting MPLAD AI Monitor Platform (SIH 2026)
echo ===================================================

start "MPLAD Backend API" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
start "MPLAD Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Services Started!
echo Frontend Portal: http://localhost:5173
echo Backend API Docs: http://localhost:8000/docs
echo ===================================================
