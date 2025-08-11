// test-email.js - Place this in backend folder root
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Check if credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ ERROR: Email credentials not found in .env file');
    console.log('Please check your .env file has EMAIL_USER and EMAIL_PASS');
    return;
  }

  console.log('📧 Email User:', process.env.EMAIL_USER);
  console.log('🔑 Password:', process.env.EMAIL_PASS ? 'Set ✅' : 'Not Set ❌');
  console.log('📬 SMTP Host:', process.env.EMAIL_HOST);
  console.log('🔌 Port:', process.env.EMAIL_PORT);
  console.log('\n------------------------\n');

  // Create transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Verify connection
    console.log('🔄 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful!\n');

    // Send test email
    console.log('📤 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test Email" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: '✅ Test Email - Configuration Working!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0f0f0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #28a745; text-align: center;">🎉 Email Working!</h1>
            <p style="font-size: 16px; color: #333;">Your email configuration is working perfectly!</p>
            <div style="background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #007bff;">Configuration Details:</h3>
              <ul style="color: #555;">
                <li>Email Service: Gmail</li>
                <li>SMTP Host: ${process.env.EMAIL_HOST}</li>
                <li>Port: ${process.env.EMAIL_PORT}</li>
                <li>Test Time: ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            <p style="text-align: center; color: #888; font-size: 14px;">
              You can now send emails from your application! 🚀
            </p>
          </div>
        </div>
      `
    });

    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Check your inbox:', process.env.EMAIL_USER);
    console.log('\n🎉 Everything is working! You can now use email in your app.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    // Specific error handling
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Fix: Check your app password in .env file');
      console.log('   Make sure you\'re using App Password, not regular password');
    } else if (error.message.includes('ECONNECTION')) {
      console.log('\n💡 Fix: Check your internet connection and firewall settings');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 Fix: Port might be blocked. Try port 465 with secure: true');
    }
    
    console.log('\n📝 Troubleshooting Steps:');
    console.log('1. Verify EMAIL_USER is your complete Gmail address');
    console.log('2. Verify EMAIL_PASS is the 16-character app password (with spaces)');
    console.log('3. Make sure 2-factor authentication is enabled on Gmail');
    console.log('4. Try generating a new app password if current one doesn\'t work');
  }
}

// Run the test
testEmail();