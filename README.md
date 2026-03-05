# Neeyatai MainBase - KickLoad Test Generator

Complete load testing platform with AI-powered JMeter and Gatling test generation.

## 🚀 Features

- **JMeter Test Generation**: AI-powered JMeter test plan generation (9-10 seconds)
- **Gatling Test Generation**: AI-powered Scala test script generation
- **Intelligent Test Analysis**: AI-driven performance analysis
- **Performance Comparison**: Compare multiple test results
- **Jenkins Integration**: Trigger tests via Jenkins
- **API Integration**: RESTful API for automation

## 📋 Prerequisites

### Windows Requirements

1. **Python 3.8+**
   - Download: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Node.js 16+**
   - Download: https://nodejs.org/
   - LTS version recommended

3. **MongoDB**
   - Download: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

4. **Redis**
   - Download: https://github.com/microsoftarchive/redis/releases
   - Or use Redis Cloud: https://redis.com/try-free/

5. **Git**
   - Download: https://git-scm.com/download/win

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/Rachit246-art/Neeyatai-MainBase.git
cd Neeyatai-MainBase
```

### 2. Backend Setup

```bash
cd Neeyatai/backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env with your configuration (see Configuration section)

# Start backend
python app.py
```

Backend will run on: http://localhost:5000

### 3. Frontend Setup

```bash
cd Neeyatai/KickLoad

# Install dependencies
npm install

# Create .env file
copy .env.example .env
# Edit .env with backend URL

# Start frontend
npm run dev
```

Frontend will run on: http://localhost:5173

## ⚙️ Configuration

### Backend (.env)

Create `Neeyatai/backend/.env`:

```env
# Gemini API (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB (Required)
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=neeyatai

# Redis (Required)
REDIS_PASSWORD=your_redis_password

# Flask
FLASK_ENV=development
SECRET_KEY=your_secret_key_here

# CORS
CORS_ORIGIN=http://localhost:5173

# AWS S3 (Optional - for file storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name

# Email (Optional - for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### Frontend (.env)

Create `Neeyatai/KickLoad/.env`:

```env
VITE_APP_API_BASE_URL=http://localhost:5000
```

## 🎯 Getting Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and paste in backend `.env` file

## 🚀 Running the Application

### Option 1: Development Mode (Recommended for Windows)

**Terminal 1 - Backend:**
```bash
cd Neeyatai/backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd Neeyatai/KickLoad
npm run dev
```

### Option 2: Production Mode (Docker)

```bash
cd Neeyatai/backend
docker-compose up -d
```

Note: Docker on Windows requires Docker Desktop

## 📖 Usage

### 1. JMeter Test Generation

1. Navigate to "Test Plan Generation"
2. Enter prompt: `"Generate 10 virtual users on example.com"`
3. Wait 9-10 seconds
4. Download generated JMX file

**Example Prompts:**
- `"Test GET https://api.example.com/users with 50 users"`
- `"Load test mywebsite.com with 100 concurrent users"`
- `"POST to api.site.com/login with 25 users"`

### 2. Gatling Test Generation

1. Navigate to "Gatling Test Generator"
2. Enter prompt: `"Test GET https://api.example.com with 50 users"`
3. Wait 10-15 seconds
4. Download generated Scala file

### 3. Run Tests

1. Navigate to "Run Test"
2. Upload JMX file
3. Configure parameters (users, duration, ramp time)
4. Click "Run Test"
5. View real-time results

## 🔧 Troubleshooting

### Backend won't start

**Issue:** `ModuleNotFoundError`
```bash
pip install -r requirements.txt
```

**Issue:** `MongoDB connection failed`
- Ensure MongoDB is running: `net start MongoDB`
- Or use MongoDB Atlas connection string

**Issue:** `Redis connection failed`
- Ensure Redis is running
- Or use Redis Cloud connection string

### Frontend won't start

**Issue:** `npm install` fails
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue:** `CORS error`
- Check backend `.env` has correct `CORS_ORIGIN`
- Check frontend `.env` has correct `VITE_APP_API_BASE_URL`

### Test generation is slow

**Issue:** Takes more than 30 seconds
- Check internet connection
- Verify Gemini API key is valid
- Check Gemini API quota: https://makersuite.google.com/app/apikey

## 📁 Project Structure

```
Neeyatai-MainBase/
├── Neeyatai/
│   ├── backend/              # Flask backend
│   │   ├── app.py           # Main application
│   │   ├── gemini.py        # Gemini API integration
│   │   ├── generate_test_plan.py  # JMeter generation
│   │   ├── generate_gatling_test.py  # Gatling generation
│   │   ├── requirements.txt # Python dependencies
│   │   └── .env            # Configuration
│   │
│   ├── KickLoad/            # React frontend
│   │   ├── src/
│   │   │   ├── pages/      # Page components
│   │   │   ├── components/ # Reusable components
│   │   │   └── store/      # State management
│   │   ├── package.json    # Node dependencies
│   │   └── .env           # Frontend config
│   │
│   └── documents/          # Documentation & configs
│
└── README.md              # This file
```

## 🔐 Security Notes

- Never commit `.env` files to Git
- Keep API keys secure
- Use environment variables for sensitive data
- Enable HTTPS in production
- Use strong passwords for MongoDB and Redis

## 📊 Performance

- **JMeter Generation**: 9-10 seconds (optimized)
- **Gatling Generation**: 10-15 seconds
- **Test Execution**: Depends on test configuration
- **API Response**: < 100ms average

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📝 License

Proprietary - All rights reserved

## 📧 Support

For issues or questions:
- GitHub Issues: https://github.com/Rachit246-art/Neeyatai-MainBase/issues
- Email: support@neeyatai.com

## 🎉 Acknowledgments

- Google Gemini AI for test generation
- Apache JMeter for load testing
- Gatling for performance testing
- React for frontend framework
- Flask for backend framework

---

**Made with ❤️ by Neeyatai Team**
