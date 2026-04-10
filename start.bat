@echo off
echo Stopping any existing servers on ports 3000 and 8000...

REM Kill process on port 8000 (backend) by PID — does NOT touch VS Code
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill process on port 3000 (frontend) by PID — does NOT touch VS Code
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

timeout /t 1 /nobreak >nul

echo Starting Backend (port 8000)...
start "Reddington - Backend" cmd /k "cd /d E:\Projects_\raymond_reddington\backend && E:\Projects_\venv\Scripts\uvicorn.exe main:app --reload --port 8000"

echo Starting Frontend (port 3000)...
start "Reddington - Frontend" cmd /k "cd /d E:\Projects_\raymond_reddington\frontend && npm run dev"

echo.
echo Done! Two terminal windows opened.
echo Backend docs: http://localhost:8000/docs
echo Frontend:     http://localhost:3000
pause
