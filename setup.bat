@echo off
echo ========================================================
echo   SignBridge AI - FullStack Project Setup (Windows)
echo ========================================================
echo.

:: 1. Setup Backend
echo [1/2] Setting up Python virtual environment for FastAPI backend...
cd backend
if not exist ".venv" (
    echo Creating virtual environment (.venv)...
    python -m venv .venv
)
echo Installing backend Python dependencies...
call .\.venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

:: 2. Setup Frontend
echo.
echo [2/2] Installing Next.js frontend npm dependencies...
call npm install

echo.
echo ========================================================
echo   Setup Completed Successfully!
echo ========================================================
echo.
echo To start developing:
echo   - Run frontend:  npm run dev
echo   - Run backend:   npm run dev:backend
echo   - Or run both:   start.bat
echo.
pause
