# 🚀 Quick Start Guide

Get Neeyatai MainBase running on Windows in 5 minutes!

## Step 1: Clone Repository (1 minute)

```bash
git clone https://github.com/Rachit246-art/Neeyatai-MainBase.git
cd Neeyatai-MainBase
```

## Step 2: Run Setup (2 minutes)

Double-click: **`SETUP_WINDOWS.bat`**

This will:
- ✅ Check Python and Node.js
- ✅ Install all dependencies
- ✅ Create configuration files

## Step 3: Configure (1 minute)

1. Get Gemini API key: https://makersuite.google.com/app/apikey
2. Edit `Neeyatai\backend\.env`
3. Replace `your_gemini_api_key_here` with your actual key

## Step 4: Start Services (1 minute)

**Terminal 1 - Backend:**
Double-click: **`START_BACKEND.bat`**

**Terminal 2 - Frontend:**
Double-click: **`START_FRONTEND.bat`**

## Step 5: Use Application

Open browser: http://localhost:5173

Try generating a test:
```
Generate 10 virtual users on example.com
```

## ✅ That's It!

Your application is now running and ready to use.

## 📝 Notes

- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:5173
- MongoDB and Redis are optional for basic testing
- Without MongoDB/Redis, some features may be limited

## 🔧 Troubleshooting

**Backend won't start?**
- Check Python is installed: `python --version`
- Install dependencies: `pip install -r Neeyatai\backend\requirements.txt`

**Frontend won't start?**
- Check Node.js is installed: `node --version`
- Install dependencies: `cd Neeyatai\KickLoad && npm install`

**Test generation fails?**
- Verify Gemini API key in `.env`
- Check internet connection
- Ensure API key has quota

## 📚 Full Documentation

See [README.md](README.md) for complete documentation.
