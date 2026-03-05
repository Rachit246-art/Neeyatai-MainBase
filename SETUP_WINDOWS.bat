@echo off
cls
echo ========================================
echo   Neeyatai MainBase - Windows Setup
echo ========================================
echo.

REM Check Python
echo [1/5] Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found!
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
echo ✅ Python found

REM Check Node.js
echo.
echo [2/5] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js found

REM Install Backend Dependencies
echo.
echo [3/5] Installing backend dependencies...
cd Neeyatai\backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Install Frontend Dependencies
echo.
echo [4/5] Installing frontend dependencies...
cd ..\KickLoad
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

REM Create .env files if they don't exist
echo.
echo [5/5] Checking configuration files...
cd ..\backend
if not exist .env (
    echo Creating backend .env file...
    (
        echo # Gemini API
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo.
        echo # MongoDB
        echo MONGO_URI=mongodb://localhost:27017/
        echo MONGO_DB_NAME=neeyatai
        echo.
        echo # Redis
        echo REDIS_PASSWORD=your_redis_password
        echo.
        echo # Flask
        echo FLASK_ENV=development
        echo SECRET_KEY=your_secret_key_here
        echo.
        echo # CORS
        echo CORS_ORIGIN=http://localhost:5173
    ) > .env
    echo ✅ Created backend .env file
    echo ⚠️  Please edit Neeyatai\backend\.env with your API keys
) else (
    echo ✅ Backend .env file exists
)

cd ..\KickLoad
if not exist .env (
    echo Creating frontend .env file...
    echo VITE_APP_API_BASE_URL=http://localhost:5000 > .env
    echo ✅ Created frontend .env file
) else (
    echo ✅ Frontend .env file exists
)

cd ..\..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit Neeyatai\backend\.env with your Gemini API key
echo 2. Ensure MongoDB and Redis are running
echo 3. Run START_BACKEND.bat to start backend
echo 4. Run START_FRONTEND.bat to start frontend
echo.
echo Get Gemini API key: https://makersuite.google.com/app/apikey
echo.
pause
