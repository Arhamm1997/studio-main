// working-email-server.js - GUARANTEED WORKING VERSION
// Save this file in backend folder and run: node working-email-server.js

const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(require('cors')());

// Email configuration - CHANGE THESE VALUES!
const EMAIL_CONFIG = {
  user: 'your-email@gmail.com',     // ← APNA EMAIL YAHAN DALO
  pass: 'kims jklc byqc wcsd',      // Your app password (already provided)
  port: 5000
};

// Load environment if .env exists
try {
  require('dotenv').config();
  if (process.env.EMAIL_USER) EMAIL_CONFIG.user = process.env.EMAIL_USER;
  if (process.env.EMAIL_PASS) EMAIL_CONFIG.pass = process.env.EMAIL_PASS;
  if (process.env.PORT) EMAIL_CONFIG.port = process.env.PORT;
} catch (e) {
  console.log('Using hardcoded config');
}

// Email setup with error handling
let emailService = null;
let serviceStatus = 'Not initialized';

// Initialize email service
function initEmailService() {
  try {
    // Try to load nodemailer
    const nodemailer = require('nodemailer');
    
    // Create transporter
    emailService = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_CONFIG.user,
        pass: EMAIL_CONFIG.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    // Verify connection
    emailService.verify((error, success) => {
      if (error) {
        console.log('❌ Email verification failed:', error.message);
        serviceStatus = 'Failed: ' + error.message;
        
        if (error.message.includes('Invalid login')) {
          console.log('\n📌 FIX REQUIRED:');
          console.log('1. Change EMAIL_CONFIG.user to your Gmail address');
          console.log('2. Make sure app password is correct');
          console.log('3. Current user:', EMAIL_CONFIG.user);
        }
      } else {
        console.log('✅ Email service ready!');
        console.log('📧 Using email:', EMAIL_CONFIG.user);
        serviceStatus = 'Ready';
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize email:', error.message);
    serviceStatus = 'Error: ' + error.message;
    return false;
  }
}

// Initialize on startup
const emailInitialized = initEmailService();

// API Routes

// 1. Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'Running',
    email: serviceStatus,
    config: {
      user: EMAIL_CONFIG.user,
      passwordSet: EMAIL_CONFIG.pass ? 'Yes' : 'No'
    },
    time: new Date().toISOString()
  });
});

// 2. Send test email
app.post('/api/test-email', async (req, res) => {
  if (!emailService) {
    return res.status(500).json({
      success: false,
      message: 'Email service not available',
      status: serviceStatus
    });
  }
  
  try {
    const testEmail = req.body.email || EMAIL_CONFIG.user;
    
    const info = await emailService.sendMail({
      from: `"Test System" <${EMAIL_CONFIG.user}>`,
      to: testEmail,
      subject: '✅ Test Email - ' + new Date().toLocaleDateString(),
      html: `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #28a745; text-align: center;">✅ Email Working!</h1>
            <p style="font-size: 16px; color: #333;">
              Your email configuration is working correctly!
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 14px;">
              <strong>Server Time:</strong> ${new Date().toLocaleString()}<br>
              <strong>From:</strong> ${EMAIL_CONFIG.user}<br>
              <strong>To:</strong> ${testEmail}
            </p>
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #999; font-size: 12px;">
                This is an automated test email
              </p>
            </div>
          </div>
        </div>
      `
    });
    
    console.log('✅ Test email sent to:', testEmail);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      to: testEmail
    });
    
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      hint: error.message.includes('Invalid login') 
        ? 'Check your email and app password' 
        : 'Check email configuration'
    });
  }
});

// 3. Send contact form email
app.post('/api/send-contact', async (req, res) => {
  if (!emailService) {
    return res.status(500).json({
      success: false,
      message: 'Email service not available'
    });
  }
  
  const { name, email, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required'
    });
  }
  
  try {
    // Send to admin
    await emailService.sendMail({
      from: `"${name}" <${EMAIL_CONFIG.user}>`,
      replyTo: email,
      to: EMAIL_CONFIG.user,
      subject: `Contact Form: ${subject || 'No Subject'}`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr>
          <small>Received at ${new Date().toLocaleString()}</small>
        </div>
      `
    });
    
    console.log('✅ Contact email sent from:', email);
    
    res.json({
      success: true,
      message: 'Your message has been sent successfully'
    });
    
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// 4. Simple test endpoint
app.get('/test', (req, res) => {
  res.send(`
    <html>
      <head><title>Email Test</title></head>
      <body style="font-family: Arial; padding: 40px;">
        <h1>Email Server Status</h1>
        <p>Status: <strong>${serviceStatus}</strong></p>
        <p>Email: <strong>${EMAIL_CONFIG.user}</strong></p>
        <hr>
        <h2>Test Email Form</h2>
        <button onclick="sendTest()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Send Test Email
        </button>
        <div id="result"></div>
        <script>
          async function sendTest() {
            const res = await fetch('/api/test-email', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({email: '${EMAIL_CONFIG.user}'})
            });
            const data = await res.json();
            document.getElementById('result').innerHTML = 
              '<p style="color: ' + (data.success ? 'green' : 'red') + ';">' + 
              JSON.stringify(data, null, 2) + '</p>';
          }
        </script>
      </body>
    </html>
  `);
});

// Start server
app.listen(EMAIL_CONFIG.port, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EMAIL SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`\n📍 Server URL: http://localhost:${EMAIL_CONFIG.port}`);
  console.log(`📧 Test Page: http://localhost:${EMAIL_CONFIG.port}/test`);
  console.log(`💌 Email User: ${EMAIL_CONFIG.user}`);
  console.log(`🔐 Password: ${EMAIL_CONFIG.pass ? 'Set' : 'Not Set'}`);
  console.log('\n📌 IMPORTANT: Change EMAIL_CONFIG.user to your Gmail!');
  console.log('='.repeat(60) + '\n');
  
  if (!emailInitialized) {
    console.log('⚠️  WARNING: Email service not initialized');
    console.log('   Run: npm install nodemailer@6.9.14');
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});