#!/usr/bin/env bash
echo "========================================================"
echo "  SignBridge AI - FullStack Project Setup (Linux/macOS)  "
echo "========================================================"
echo ""

# 1. Setup Backend
echo "[1/2] Setting up Python virtual environment for FastAPI backend..."
cd backend
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment (.venv)..."
    python3 -m venv .venv
fi
echo "Installing backend Python dependencies..."
source .venv/bin/activate
pip install -r requirements.txt
cd ..

# 2. Setup Frontend
echo ""
echo "[2/2] Installing Next.js frontend npm dependencies..."
npm install

echo ""
echo "========================================================"
echo "  Setup Completed Successfully!                         "
echo "========================================================"
echo ""
echo "To start developing:"
echo "  - Run frontend:  npm run dev"
echo "  - Run backend:   npm run dev:backend"
echo ""
