// backend/server.js - Fixed with correct nodemailer API
const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables first
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:9002', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Debug: Log environment variables
console.log('\n🔧 Environment Check:');
console.log('  SMTP_HOST:', process.env.SMTP_HOST || '❌ Not set');
console.log('  SMTP_PORT:', process.env.SMTP_PORT || '❌ Not set');
console.log('  SMTP_USER:', process.env.SMTP_USER || '❌ Not set');
console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('  SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ Not set');

// Email setup variables
let emailService = null;
let serviceStatus = 'Not initialized';
let nodemailer = null;

// Initialize email service with correct nodemailer API
function initEmailService() {
  try {
    console.log('\n📦 Attempting to load nodemailer...');
    
    // Try to require nodemailer with error handling
    try {
      nodemailer = require('nodemailer');
      console.log('✅ Nodemailer loaded successfully');
      console.log('📋 Nodemailer version:', nodemailer.version || 'unknown');
      
      // Debug: Check available methods
      console.log('🔍 Available methods:');
      console.log('  - createTransporter:', typeof nodemailer.createTransporter);
      console.log('  - createTransport:', typeof nodemailer.createTransport);
      
    } catch (requireError) {
      console.error('❌ Failed to load nodemailer:', requireError.message);
      serviceStatus = 'Nodemailer not installed';
      return false;
    }
    
    // Check if nodemailer has the transport creation method (try both APIs)
    const transportMethod = nodemailer.createTransport || nodemailer.createTransporter;
    if (!transportMethod || typeof transportMethod !== 'function') {
      console.error('❌ No valid transport creation method found');
      console.log('Available nodemailer methods:', Object.getOwnPropertyNames(nodemailer));
      serviceStatus = 'Invalid nodemailer installation';
      return false;
    }
    
    // Use the correct method name
    const createTransport = nodemailer.createTransport || nodemailer.createTransporter;
    console.log('✅ Using transport method:', createTransport.name);
    
    // Check if email credentials are set
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      serviceStatus = 'Missing SMTP configuration';
      console.error('❌ Missing SMTP configuration');
      return false;
    }
    
    console.log('🔧 Creating email transporter...');
    
    // Create transporter with detailed config
    const transporterConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    
    console.log('📋 Using config:', {
      host: transporterConfig.host,
      port: transporterConfig.port,
      secure: transporterConfig.secure,
      user: transporterConfig.auth.user,
      passLength: transporterConfig.auth.pass ? transporterConfig.auth.pass.length : 0
    });
    
    // Use the correct method to create transporter
    emailService = createTransport(transporterConfig);
    console.log('✅ Email transporter created successfully');
    
    // Verify connection (async)
    emailService.verify((error, success) => {
      if (error) {
        console.error('❌ SMTP connection failed:', error.message);
        serviceStatus = 'SMTP connection failed: ' + error.message;
        if (error.message.includes('Invalid login')) {
          console.log('💡 Tip: Check your Gmail app password');
          console.log('   1. Go to https://myaccount.google.com/apppasswords');
          console.log('   2. Generate a new app password for "Mail"');
          console.log('   3. Use the 16-character password (include spaces)');
        }
      } else {
        console.log('✅ SMTP server is ready to send emails');
        console.log('📧 Sending from:', process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER);
        serviceStatus = 'loaded';
      }
    });
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    serviceStatus = 'Initialization error: ' + error.message;
    return false;
  }
}

// Try to initialize email service
const emailInitialized = initEmailService();

// API Routes

// 1. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    emailService: serviceStatus,
    nodemailerLoaded: !!nodemailer,
    nodemailerVersion: nodemailer?.version || 'unknown',
    transporterCreated: !!emailService,
    availableMethods: nodemailer ? Object.getOwnPropertyNames(nodemailer).filter(name => typeof nodemailer[name] === 'function') : [],
    smtp: {
      host: process.env.SMTP_HOST || 'Not set',
      port: process.env.SMTP_PORT || 'Not set',
      user: process.env.SMTP_USER || 'Not set',
      pass: process.env.SMTP_PASSWORD ? 'Set' : 'Not set'
    }
  });
});

// 2. Send contact form email
app.post('/api/send-contact', async (req, res) => {
  console.log('\n📧 Send contact request received');
  
  if (!emailService) {
    console.error('❌ Email service not available');
    return res.status(500).json({
      success: false,
      message: 'Email service not configured',
      status: serviceStatus,
      debug: {
        nodemailerLoaded: !!nodemailer,
        transporterCreated: !!emailService
      }
    });
  }
  
  const { name, email, subject, message, htmlContent } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required',
      received: { name: !!name, email: !!email, message: !!message }
    });
  }
  
  try {
    // Create email content
    const emailHtml = htmlContent || `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Message from ${name}</h1>
        </div>
        <div class="content">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject || 'No Subject'}</p>
          <hr>
          <div>${message.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="footer">
          <p>Sent via Bagga Bugs Email System | ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `"${name}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `Contact Form: ${subject || 'Message from ' + name}`,
      html: emailHtml,
      text: message
    };
    
    console.log('📤 Sending email...');
    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo
    });
    
    const info = await emailService.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Accepted:', info.accepted);
    
    res.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      details: {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      }
    });
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

// 3. Test email endpoint
app.post('/api/test-email', async (req, res) => {
  if (!emailService) {
    return res.status(500).json({
      success: false,
      message: 'Email service not available',
      status: serviceStatus
    });
  }
  
  try {
    const testEmail = req.body.email || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"Bagga Bugs Test" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: testEmail,
      subject: '✅ Test Email Success - ' + new Date().toLocaleDateString(),
      html: `
        <div style="font-family: Arial; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #28a745; text-align: center;">🎉 Email Working!</h1>
            <p style="font-size: 16px; color: #333;">
              Congratulations! Your Bagga Bugs email system is working perfectly.
            </p>
            <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #007bff; margin-top: 0;">Test Details:</h3>
              <ul style="color: #555;">
                <li><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</li>
                <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
                <li><strong>From:</strong> ${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}</li>
                <li><strong>To:</strong> ${testEmail}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Nodemailer Version:</strong> ${nodemailer?.version || 'unknown'}</li>
              </ul>
            </div>
            <p style="text-align: center; color: #888; font-size: 14px;">
              You can now send unlimited emails from your application! 🚀
            </p>
          </div>
        </div>
      `,
      text: `Bagga Bugs test email sent successfully at ${new Date().toLocaleString()}`
    };
    
    const info = await emailService.sendMail(mailOptions);
    
    console.log('✅ Test email sent to:', testEmail);
    console.log('📨 Message ID:', info.messageId);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      accepted: info.accepted,
      to: testEmail
    });
    
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: error.code
    });
  }
});

// 4. Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    nodemailer: {
      loaded: !!nodemailer,
      version: nodemailer?.version || 'unknown',
      methods: nodemailer ? Object.getOwnPropertyNames(nodemailer).filter(name => typeof nodemailer[name] === 'function') : [],
      createTransport: !!(nodemailer?.createTransport),
      createTransporter: !!(nodemailer?.createTransporter)
    },
    emailService: {
      created: !!emailService,
      status: serviceStatus
    },
    environment: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      passwordSet: !!process.env.SMTP_PASSWORD,
      fromEmail: process.env.SMTP_FROM_EMAIL
    }
  });
});

// 5. Test page
app.get('/test-email', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bagga Bugs Email Test</title>
      <style>
        body { font-family: Arial; padding: 20px; max-width: 800px; margin: 0 auto; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        button { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 5px; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        .result { margin-top: 20px; padding: 15px; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .debug { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin: 10px 0; }
        pre { font-size: 12px; white-space: pre-wrap; word-wrap: break-word; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📧 Bagga Bugs Email Service Test</h1>
        
        <div class="info">
          <strong>Status:</strong> ${serviceStatus}<br>
          <strong>Nodemailer:</strong> ${nodemailer ? 'Loaded v' + (nodemailer.version || 'unknown') : 'Not loaded'}<br>
          <strong>Transporter:</strong> ${emailService ? 'Created ✅' : 'Not created ❌'}
        </div>
        
        ${emailService ? `
          <h3>Send Test Email:</h3>
          <div>
            <label>Recipient Email:</label>
            <input type="email" id="testEmail" value="${process.env.SMTP_USER}" placeholder="Enter email address">
          </div>
          
          <button onclick="sendTest()" id="sendBtn">📤 Send Test Email</button>
          <button onclick="checkHealth()" id="healthBtn">🏥 Check Health</button>
          <button onclick="checkDebug()" id="debugBtn">🔍 Debug Info</button>
        ` : `
          <div class="error">
            <h3>❌ Email Service Not Ready</h3>
            <p>Status: ${serviceStatus}</p>
            <button onclick="checkDebug()" id="debugBtn">🔍 Debug Info</button>
          </div>
        `}
        
        <div id="result"></div>
      </div>
      
      <script>
        async function sendTest() {
          const resultDiv = document.getElementById('result');
          const email = document.getElementById('testEmail').value;
          const sendBtn = document.getElementById('sendBtn');
          
          if (!email) {
            resultDiv.innerHTML = '<div class="result error">Please enter an email address</div>';
            return;
          }
          
          sendBtn.disabled = true;
          sendBtn.textContent = '📤 Sending...';
          resultDiv.innerHTML = '<div class="result info">📤 Sending test email...</div>';
          
          try {
            const response = await fetch('/api/test-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();
            
            if (data.success) {
              resultDiv.innerHTML = \`
                <div class="result success">
                  <strong>✅ Success!</strong><br>
                  Email sent to: \${email}<br>
                  Message ID: \${data.messageId}<br>
                  Accepted: \${data.accepted}<br>
                  <br>
                  <strong>Check your inbox!</strong>
                </div>
              \`;
            } else {
              resultDiv.innerHTML = \`
                <div class="result error">
                  <strong>❌ Error:</strong><br>
                  \${data.message}
                </div>
              \`;
            }
          } catch (error) {
            resultDiv.innerHTML = \`
              <div class="result error">
                <strong>❌ Network Error:</strong><br>
                \${error.message}
              </div>
            \`;
          } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = '📤 Send Test Email';
          }
        }
        
        async function checkHealth() {
          const resultDiv = document.getElementById('result');
          try {
            const response = await fetch('/api/health');
            const data = await response.json();
            resultDiv.innerHTML = \`
              <div class="debug">
                <h4>🏥 Health Check Results:</h4>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
              </div>
            \`;
          } catch (error) {
            resultDiv.innerHTML = \`<div class="result error">Health check failed: \${error.message}</div>\`;
          }
        }
        
        async function checkDebug() {
          const resultDiv = document.getElementById('result');
          try {
            const response = await fetch('/api/debug');
            const data = await response.json();
            resultDiv.innerHTML = \`
              <div class="debug">
                <h4>🔍 Debug Information:</h4>
                <pre>\${JSON.stringify(data, null, 2)}</pre>
              </div>
            \`;
          } catch (error) {
            resultDiv.innerHTML = \`<div class="result error">Debug check failed: \${error.message}</div>\`;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// 6. Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bagga Bugs Email Backend',
    status: 'running',
    emailService: serviceStatus,
    nodemailerVersion: nodemailer?.version || 'unknown',
    transporterCreated: !!emailService,
    endpoints: {
      health: '/api/health',
      debug: '/api/debug',
      testEmail: '/api/test-email',
      sendContact: '/api/send-contact',
      testPage: '/test-email'
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BAGGA BUGS EMAIL BACKEND STARTED');
  console.log('='.repeat(60));
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📧 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test Page: http://localhost:${PORT}/test-email`);
  console.log(`🔍 Debug Info: http://localhost:${PORT}/api/debug`);
  console.log('='.repeat(60));
  
  if (!emailInitialized || serviceStatus !== 'loaded') {
    console.log('\n⚠️  WARNING: Email service not properly initialized!');
    console.log('   Status:', serviceStatus);
    console.log('   Nodemailer version:', nodemailer?.version || 'unknown');
    console.log('   Available methods:', nodemailer ? Object.getOwnPropertyNames(nodemailer).filter(name => typeof nodemailer[name] === 'function') : []);
  } else {
    console.log('\n✅ Email service is ready!');
    console.log('   Nodemailer version:', nodemailer?.version || 'unknown');
    console.log('   Test it at: http://localhost:' + PORT + '/test-email');
  }
  console.log('\n');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error.message);
});