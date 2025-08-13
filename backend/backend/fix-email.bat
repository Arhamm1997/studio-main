@echo off
echo ========================================
echo   BAGGA BUGS EMAIL FIX SCRIPT
echo ========================================
echo.

REM Stop any running servers
echo Step 1: Stopping any running servers...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Cleaning up old installations...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Step 3: Installing fresh dependencies...
call npm cache clean --force
call npm install express@latest cors@latest body-parser@latest dotenv@latest nodemailer@latest

echo Step 4: Verifying nodemailer installation...
echo const nodemailer = require('nodemailer'); > test-nodemailer.js
echo console.log('Nodemailer version:', nodemailer.version); >> test-nodemailer.js
echo console.log('createTransporter available:', typeof nodemailer.createTransporter); >> test-nodemailer.js
node test-nodemailer.js
del test-nodemailer.js

echo Step 5: Checking .env file...
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
echo Step 6: Starting server with fixed configuration...
echo 📍 Server URL: http://localhost:5000
echo 🧪 Test page: http://localhost:5000/test-email
echo.
echo If you see "Email service is ready!" the fix worked!
echo Press Ctrl+C to stop the server
echo.

node server.js

pause