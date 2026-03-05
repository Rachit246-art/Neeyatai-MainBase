@echo off
cd /d "%~dp0"
echo Starting Neeyatai Backend...
py -m flask run --host=0.0.0.0 --port=5000
pause
