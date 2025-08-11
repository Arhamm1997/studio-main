@echo off
REM auto-fix.bat - Save this in backend folder and double-click to run

echo ========================================
echo     EMAIL SETUP AUTO-FIX SCRIPT
echo ========================================
echo.

echo Step 1: Cleaning old installation...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
call npm cache clean --force

echo.
echo Step 2: Installing fresh dependencies...
call npm init -y
call npm install express@4.18.2
call npm install nodemailer@6.9.14
call npm install dotenv@16.3.1
call npm install cors@2.8.5
call npm install body-parser@1.20.2

echo.
echo Step 3: Verifying installation...
node verify-nodemailer.js

echo.
echo Step 4: Testing server...
echo Starting test server on http://localhost:5000/test
echo Press Ctrl+C to stop the server
echo.
node working-email-server.js

pause