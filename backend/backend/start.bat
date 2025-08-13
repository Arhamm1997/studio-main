@echo off
echo ========================================
echo   BAGGA BUGS BACKEND QUICK START
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found!
    echo Please run this script from the backend/backend folder
    pause
    exit /b 1
)

echo Step 1: Installing dependencies...
call npm install express cors body-parser dotenv nodemailer

echo.
echo Step 2: Checking .env file...
if not exist ".env" (
    echo Creating .env file...
    echo SMTP_HOST=smtp.gmail.com> .env
    echo SMTP_PORT=465>> .env
    echo SMTP_USER=arhamawan125@gmail.com>> .env
    echo SMTP_PASSWORD=skor dkfl xefr blho>> .env
    echo SMTP_FROM_EMAIL=arhamawan125@gmail.com>> .env
    echo PORT=5000>> .env
    echo ✅ .env file created
) else (
    echo ✅ .env file exists
)

echo.
echo Step 3: Starting backend server...
echo 📍 Server will start on: http://localhost:5000
echo 🧪 Test page: http://localhost:5000/test-email
echo 📧 Health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js