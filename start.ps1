# Raymond Reddington — Start Script (PowerShell)

Write-Host "Stopping any existing servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; E:\Projects_\venv\Scripts\uvicorn.exe main:app --reload --port 8000"

Write-Host "Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Done! Two terminal windows opened." -ForegroundColor Green
Write-Host "Open http://localhost:3000 in your browser." -ForegroundColor Green
