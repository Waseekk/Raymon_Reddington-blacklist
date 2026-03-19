@echo off
echo ============================================
echo  Raymond Reddington — First-Time Setup
echo ============================================
echo.

echo [1/4] Installing Python dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed. Make sure Python/pip is in your PATH.
    pause & exit /b 1
)
echo Done.
echo.

echo [2/4] Installing Node dependencies...
cd /d "%~dp0frontend"
npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Make sure Node.js is installed.
    pause & exit /b 1
)
echo Done.
echo.

echo [3/4] Checking environment files...
if not exist "%~dp0backend\.env" (
    copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    echo Created backend\.env from example — fill in your values!
) else (
    echo backend\.env already exists.
)

if not exist "%~dp0frontend\.env.local" (
    copy "%~dp0frontend\.env.local.example" "%~dp0frontend\.env.local" >nul
    echo Created frontend\.env.local from example — fill in your values!
) else (
    echo frontend\.env.local already exists.
)
echo.

echo [4/4] Setup complete!
echo.
echo Next steps:
echo   1. Edit backend\.env  — add ANTHROPIC_API_KEY, NEXTAUTH_SECRET, etc.
echo   2. Edit frontend\.env.local — add NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, etc.
echo   3. Run start.bat to launch both servers.
echo   4. Open http://localhost:3000
echo.
pause
