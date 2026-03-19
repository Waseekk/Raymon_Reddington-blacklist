@echo off
setlocal enabledelayedexpansion

set PASS=0
set FAIL=0
set WARN=0

:: Use the shared venv
set VENV_PIP=E:\Projects_\venv\Scripts\pip.exe
set VENV_PYTHON=E:\Projects_\venv\Scripts\python.exe

echo.
echo ============================================================
echo   RAYMOND REDDINGTON — Pre-flight Check
echo ============================================================
echo.

:: ─────────────────────────────────────────────
:: HELPER MACROS (labels used via CALL)
:: ─────────────────────────────────────────────
goto :start

:ok
set /a PASS+=1
echo   [PASS] %~1
goto :eof

:fail
set /a FAIL+=1
echo   [FAIL] %~1
goto :eof

:warn
set /a WARN+=1
echo   [WARN] %~1
goto :eof

:start

:: ─────────────────────────────────────────────
:: 1. PYTHON
:: ─────────────────────────────────────────────
echo [1/5] Python environment
echo ─────────────────────────────────────────────

if exist "%VENV_PYTHON%" (
    for /f "tokens=*" %%v in ('"%VENV_PYTHON%" --version 2^>^&1') do set PY_VER=%%v
    call :ok "!PY_VER! (venv at E:\Projects_\venv)"
) else (
    call :fail "Venv not found at E:\Projects_\venv"
)

echo.

:: ─────────────────────────────────────────────
:: 2. BACKEND .ENV + PACKAGES
:: ─────────────────────────────────────────────
echo [2/5] Backend setup
echo ─────────────────────────────────────────────

if exist "backend\.env" (
    call :ok "backend\.env found"

    :: Check required keys
    findstr /i "ANTHROPIC_API_KEY" backend\.env >nul 2>&1
    if errorlevel 1 (call :fail "ANTHROPIC_API_KEY missing from backend\.env") else (call :ok "ANTHROPIC_API_KEY present")

    findstr /i "NEXTAUTH_SECRET" backend\.env >nul 2>&1
    if errorlevel 1 (call :fail "NEXTAUTH_SECRET missing from backend\.env") else (call :ok "NEXTAUTH_SECRET present")
) else (
    call :fail "backend\.env not found — create it with ANTHROPIC_API_KEY and NEXTAUTH_SECRET"
)

:: Check key Python packages
set PKGS=fastapi uvicorn anthropic sqlalchemy python-jose pydantic-settings

for %%p in (%PKGS%) do (
    "%VENV_PIP%" show %%p >nul 2>&1
    if errorlevel 1 (
        call :fail "Python package '%%p' not installed"
    ) else (
        call :ok "%%p installed"
    )
)

:: Optional RAG packages
"%VENV_PIP%" show chromadb >nul 2>&1
if errorlevel 1 (call :warn "chromadb not installed — RAG will return [] (non-fatal)") else (call :ok "chromadb installed")

"%VENV_PIP%" show sentence-transformers >nul 2>&1
if errorlevel 1 (call :warn "sentence-transformers not installed — RAG will return [] (non-fatal)") else (call :ok "sentence-transformers installed")

:: Quick import check
cd backend
"%VENV_PYTHON%" -c "from main import app; print('app OK')" >nul 2>&1
if errorlevel 1 (
    call :fail "backend\main.py failed to import — run: cd backend && E:\Projects_\venv\Scripts\python.exe -c \"from main import app\""
) else (
    call :ok "backend imports OK"
)
cd ..

echo.

:: ─────────────────────────────────────────────
:: 3. NODE / NPM + FRONTEND DEPS
:: ─────────────────────────────────────────────
echo [3/5] Frontend setup
echo ─────────────────────────────────────────────

node --version >nul 2>&1
if errorlevel 1 (
    call :fail "Node.js not found — install Node 18+"
) else (
    for /f "tokens=*" %%v in ('node --version') do call :ok "Node %%v found"
)

npm --version >nul 2>&1
if errorlevel 1 (
    call :fail "npm not found"
) else (
    call :ok "npm found"
)

if exist "frontend\node_modules" (
    call :ok "frontend\node_modules present"
) else (
    call :fail "frontend\node_modules missing — run: cd frontend ^& npm install"
)

:: TypeScript check
if exist "frontend\node_modules\.bin\tsc" (
    cd frontend
    npx tsc --noEmit >nul 2>&1
    if errorlevel 1 (
        call :fail "TypeScript errors found — run: cd frontend ^& npx tsc --noEmit"
    ) else (
        call :ok "TypeScript check passed"
    )
    cd ..
) else (
    call :warn "tsc not available — skipping TypeScript check"
)

echo.

:: ─────────────────────────────────────────────
:: 4. FRONTEND .ENV.LOCAL
:: ─────────────────────────────────────────────
echo [4/5] Frontend environment
echo ─────────────────────────────────────────────

if exist "frontend\.env.local" (
    call :ok "frontend\.env.local found"

    findstr /i "NEXTAUTH_SECRET" frontend\.env.local >nul 2>&1
    if errorlevel 1 (call :fail "NEXTAUTH_SECRET missing from frontend\.env.local") else (call :ok "NEXTAUTH_SECRET present")

    findstr /i "GOOGLE_CLIENT_ID" frontend\.env.local >nul 2>&1
    if errorlevel 1 (call :fail "GOOGLE_CLIENT_ID missing from frontend\.env.local") else (call :ok "GOOGLE_CLIENT_ID present")

    findstr /i "GOOGLE_CLIENT_SECRET" frontend\.env.local >nul 2>&1
    if errorlevel 1 (call :fail "GOOGLE_CLIENT_SECRET missing from frontend\.env.local") else (call :ok "GOOGLE_CLIENT_SECRET present")

    findstr /i "NEXTAUTH_URL" frontend\.env.local >nul 2>&1
    if errorlevel 1 (call :warn "NEXTAUTH_URL missing — defaults to http://localhost:3000") else (call :ok "NEXTAUTH_URL present")

    findstr /i "FACEBOOK_CLIENT_ID" frontend\.env.local >nul 2>&1
    if errorlevel 1 (call :warn "FACEBOOK_CLIENT_ID missing — Facebook login will not work") else (call :ok "FACEBOOK_CLIENT_ID present")
) else (
    call :fail "frontend\.env.local not found — copy frontend\.env.local.example and fill in values"
)

echo.

:: ─────────────────────────────────────────────
:: 5. PORTS FREE?
:: ─────────────────────────────────────────────
echo [5/5] Port availability
echo ─────────────────────────────────────────────

netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    call :ok "Port 8000 free (backend)"
) else (
    call :warn "Port 8000 already in use — backend may conflict"
)

netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    call :ok "Port 3000 free (frontend)"
) else (
    call :warn "Port 3000 already in use — frontend may conflict"
)

echo.

:: ─────────────────────────────────────────────
:: SUMMARY
:: ─────────────────────────────────────────────
echo ============================================================
echo   Results:  %PASS% passed   %WARN% warnings   %FAIL% failed
echo ============================================================

if %FAIL% GTR 0 (
    echo.
    echo   Fix the [FAIL] items above before starting the app.
    echo.
    pause
    exit /b 1
)

echo.
if %WARN% GTR 0 (
    echo   All critical checks passed with %WARN% warning(s^).
) else (
    echo   Everything looks good!
)

echo.
set /p LAUNCH="  Launch backend + frontend now? (Y/N): "
if /i "!LAUNCH!" neq "Y" (
    echo   Run check.bat again whenever you are ready.
    pause
    exit /b 0
)

echo.
echo   Starting backend...
start "Reddington — Backend" cmd /k "cd /d E:\Projects_\raymond_reddington\backend && E:\Projects_\venv\Scripts\uvicorn.exe main:app --reload --port 8000"

echo   Starting frontend...
start "Reddington — Frontend" cmd /k "cd /d E:\Projects_\raymond_reddington\frontend && npm run dev"

echo.
echo   Both servers are starting in separate windows.
echo   Open http://localhost:3000 in your browser.
echo.
pause
