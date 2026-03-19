@echo off
echo Stopping any existing servers...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM uvicorn.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting Backend...
start "Reddington - Backend" cmd /k "cd /d E:\Projects_\raymond_reddington\backend && E:\Projects_\venv\Scripts\uvicorn.exe main:app --reload --port 8000"

echo Starting Frontend...
start "Reddington - Frontend" cmd /k "cd /d E:\Projects_\raymond_reddington\frontend && npm run dev"

echo.
echo Done! Two terminal windows opened.
echo Open http://localhost:3000 in your browser.
pause
