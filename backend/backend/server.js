// backend/server.js - Version that loads .env from backend folder
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

// Try to load .env from current directory first, then parent directory
require('dotenv').config({ path: '.env' }); // Load from backend/.env
if (!process.env.SMTP_HOST) {
  require('dotenv').config({ path: '../.env' }); // Try parent directory
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:9002', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Debug: Log environment variables
console.log('🔧 Environment Check:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
console.log('  SMTP_USER:', process.env.SMTP_USER || '❌ Not set');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('  SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ Not set');

// Create email transporter
let transporter = null;

const initializeTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Missing SMTP configuration');
    console.log('\n📝 Please create a .env file in the backend folder with:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=465');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASSWORD=your-app-password');
    console.log('SMTP_FROM_EMAIL=your-email@gmail.com\n');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify the connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP connection failed:', error.message);
        if (error.message.includes('Invalid login')) {
          console.log('💡 Tip: Make sure your app password is correct');
          console.log('   Go to: https://myaccount.google.com/apppasswords');
        }
        transporter = null;
      } else {
        console.log('✅ SMTP server is ready to send emails');
        console.log('📧 Sending from:', process.env.SMTP_FROM_EMAIL);
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create transporter:', error);
    return null;
  }
};

// Initialize on startup
transporter = initializeTransporter();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    emailService: transporter ? 'ready' : 'not configured',
    smtp: {
      host: process.env.SMTP_HOST || 'Not set',
      port: process.env.SMTP_PORT || 'Not set',
      user: process.env.SMTP_USER || 'Not set',
      pass: process.env.SMTP_PASSWORD ? 'Set' : 'Not set'
    }
  });
});

// Send email endpoint
app.post('/send-email', async (req, res) => {
  try {
    if (!transporter) {
      console.error('❌ Email transporter not configured');
      return res.status(500).json({
        success: false,
        message: 'Email service not configured',
        error: 'SMTP settings are missing. Please check your .env file.',
        config: {
          host: process.env.SMTP_HOST || 'Not set',
          port: process.env.SMTP_PORT || 'Not set',
          user: process.env.SMTP_USER || 'Not set',
          pass: process.env.SMTP_PASSWORD ? 'Set' : 'Not set'
        }
      });
    }

    const { to, subject, html, text } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'Please provide to, subject, and html or text'
      });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: html,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : '')
    };

    console.log(`📧 Sending email to: ${to}`);
    console.log(`   Subject: ${subject}`);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    console.log('   Accepted:', info.accepted);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    });
  }
});

// Test email endpoint
app.get('/test-email', async (req, res) => {
  const configStatus = `
SMTP_HOST=${process.env.SMTP_HOST || 'Not set'}
SMTP_PORT=${process.env.SMTP_PORT || 'Not set'}
SMTP_USER=${process.env.SMTP_USER || 'Not set'}
SMTP_PASSWORD=${process.env.SMTP_PASSWORD ? 'Set' : 'Not set'}
SMTP_FROM_EMAIL=${process.env.SMTP_FROM_EMAIL || 'Not set'}
  `;

  if (!transporter) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Service - Not Configured</title>
        <style>
          body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; }
          .error { background: #fee; padding: 20px; border-radius: 5px; border: 1px solid #fcc; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
          .instructions { background: #e7f3ff; padding: 20px; border-radius: 5px; margin: 20px 0; }
          code { background: #f0f0f0; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>❌ Email Service Not Configured</h1>
        <div class="error">
          <p><strong>The email service is not properly configured.</strong></p>
          <p>Current configuration status:</p>
          <pre>${configStatus}</pre>
        </div>
        
        <div class="instructions">
          <h2>📝 How to fix:</h2>
          <ol>
            <li>Create a file named <code>.env</code> in the <code>backend</code> folder</li>
            <li>Add the following content:
              <pre>SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com</pre>
            </li>
            <li>Replace <code>your-email@gmail.com</code> with your Gmail address</li>
            <li>Replace <code>your-app-password</code> with your Gmail App Password</li>
            <li>Restart the server: <code>node server.js</code></li>
          </ol>
          
          <h3>🔑 How to get Gmail App Password:</h3>
          <ol>
            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank">Google App Passwords</a></li>
            <li>Sign in to your Google account</li>
            <li>Create a new app password for "Mail"</li>
            <li>Copy the 16-character password (with spaces)</li>
          </ol>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Test</title>
      <style>
        body { font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto; }
        button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        input { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>📧 Email Service Test</h1>
      
      <div class="info">
        <strong>✅ Email service is configured and ready!</strong>
      </div>
      
      <h3>Send Test Email:</h3>
      <div>
        <label>Recipient Email:</label>
        <input type="email" id="testEmail" value="${process.env.SMTP_USER}" placeholder="Enter email address">
      </div>
      
      <div>
        <label>Subject:</label>
        <input type="text" id="testSubject" value="Test Email from Bagga Bugs">
      </div>
      
      <button onclick="sendTest()">📤 Send Test Email</button>
      
      <div id="result"></div>
      
      <h3>Current Configuration:</h3>
      <pre>${configStatus}</pre>
      
      <script>
        async function sendTest() {
          const resultDiv = document.getElementById('result');
          const email = document.getElementById('testEmail').value;
          const subject = document.getElementById('testSubject').value;
          
          if (!email) {
            resultDiv.innerHTML = '<div class="result error">Please enter an email address</div>';
            return;
          }
          
          resultDiv.innerHTML = '<div class="result info">📤 Sending email...</div>';
          
          try {
            const response = await fetch('/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: email,
                subject: subject,
                html: \`
                  <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0;">✅ Test Email Successful!</h1>
                    </div>
                    <div style="padding: 30px; background: #f8f9fa;">
                      <p style="font-size: 16px; color: #333;">
                        <strong>Congratulations!</strong> Your email configuration is working perfectly.
                      </p>
                      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #667eea; margin-top: 0;">Email Details:</h3>
                        <p><strong>Sent at:</strong> \${new Date().toLocaleString()}</p>
                        <p><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}</p>
                        <p><strong>To:</strong> \${email}</p>
                        <p><strong>Subject:</strong> \${subject}</p>
                      </div>
                      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
                        This email was sent from your Bagga Bugs Email System
                      </p>
                    </div>
                  </div>
                \`
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              resultDiv.innerHTML = \`
                <div class="result success">
                  <strong>✅ Success!</strong><br>
                  Email sent to: \${email}<br>
                  Message ID: \${data.messageId}<br>
                  <br>
                  <strong>Check your inbox!</strong> The email should arrive within a few seconds.
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`
                <div class="result error">
                  <strong>❌ Error:</strong><br>
                  \${data.message}<br>
                  \${data.error || ''}<br>
                  <br>
                  <small>Check the server console for more details.</small>
                </div>
              \`;
            }
          } catch (error) {
            resultDiv.innerHTML = \`
              <div class="result error">
                <strong>❌ Network Error:</strong><br>
                \${error.message}<br>
                <br>
                <small>Make sure the server is running.</small>
              </div>
            \`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 EMAIL BACKEND SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📧 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test Page: http://localhost:${PORT}/test-email`);
  console.log('='.repeat(60) + '\n');
  
  if (!transporter) {
    console.log('⚠️  WARNING: Email service not initialized!');
    console.log('   Please check your .env file in the backend folder');
    console.log('   Required variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
  } else {
    console.log('✅ Email service is ready!');
    console.log('   You can now send emails through the API');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});