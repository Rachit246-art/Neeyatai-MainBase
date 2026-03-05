@echo off
cd /d "%~dp0"
echo Starting Celery Worker...
echo.
echo Note: Keep this window open while using the test generation feature
echo.
celery -A tasks.celery worker --loglevel=info -P solo --pool=solo
pause
