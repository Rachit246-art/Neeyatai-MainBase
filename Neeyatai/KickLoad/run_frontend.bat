@echo off
cd /d "%~dp0"
echo Starting Neeyatai Frontend...
cmd /c "npm run dev -- --host 0.0.0.0 --port 5173"
pause
