@echo off
echo ========================================================
echo   Starting SignBridge AI Full-Stack Development Servers
echo ========================================================
echo.

:: Start FastAPI backend in a separate background window
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "FastAPI Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && python run.py"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start Next.js frontend in current window
echo Starting Next.js Frontend on http://localhost:3000 ...
npm run dev
