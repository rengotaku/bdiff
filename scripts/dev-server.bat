@echo off
setlocal

set PORT=14000

echo 🔍 Checking for processes running on port %PORT%...

:: Check if the port is in use (Windows)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT%') do (
    echo 🔥 Killing process %%a on port %PORT%
    taskkill /F /PID %%a >nul 2>&1
)

:: Wait a moment for processes to terminate
timeout /t 1 /nobreak >nul 2>&1

echo ✅ Port %PORT% is now free
echo 🚀 Starting development server on port %PORT%...

npx vite --port %PORT% --host