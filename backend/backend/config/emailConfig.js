const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('\n📦 === EMAIL CONFIG LOADING ===');

// Debug environment variables
console.log('🔍 Environment Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '❌ NOT SET');

const createTransporter = () => {
  try {
    console.log('\n🚀 Creating email transporter...');

    // Check if nodemailer is available
    if (!nodemailer) {
      throw new Error('Nodemailer not available');
    }

    // Check if email credentials are set
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP credentials not set. Please check SMTP_USER and SMTP_PASSWORD in .env file');
    }

    const transporterConfig = {
      service: 'gmail',
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
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

    console.log('📋 Transporter config:', {
      service: transporterConfig.service,
      host: transporterConfig.host,
      port: transporterConfig.port,
      secure: transporterConfig.secure,
      user: transporterConfig.auth.user,
      passLength: transporterConfig.auth.pass ? transporterConfig.auth.pass.length : 0
    });

    const transporter = nodemailer.createTransporter(transporterConfig);

    console.log('✅ Transporter created successfully');

    // Verify the transporter
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter verification failed:');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        if (error.command) console.error('   Command:', error.command);
      } else {
        console.log('✅ Email transporter verified and ready to send emails');
      }
    });

    return transporter;

  } catch (error) {
    console.error('❌ Error creating transporter:', error.message);
    console.error('Full error:', error);
    return null;
  }
};

// Create the transporter
const transporter = createTransporter();

// Enhanced email sending function
const sendEmail = async (options) => {
  console.log('\n📧 === SENDING EMAIL ===');
  console.log('📝 Options received:', {
    to: options.to,
    subject: options.subject,
    hasHtml: !!options.html,
    hasText: !!options.text,
    replyTo: options.replyTo
  });

  if (!transporter) {
    const error = new Error('Email transporter not configured. Please check your SMTP settings.');
    console.error('❌', error.message);
    throw error;
  }

  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_EMAIL || 'Bagga Bugs'}" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      replyTo: options.replyTo || process.env.SMTP_USER
    };

    // Add content
    if (options.html) {
      mailOptions.html = options.html;
    }
    if (options.text) {
      mailOptions.text = options.text;
    }

    console.log('📋 Final mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text
    });

    console.log('📤 Attempting to send email...');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📬 Response:', info.response);

    return info;

  } catch (error) {
    console.error('\n❌ === EMAIL SENDING ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    console.error('================================\n');
    throw error;
  }
};

// Test function
const testEmailConnection = async () => {
  try {
    if (!transporter) {
      throw new Error('Transporter not available');
    }
    await transporter.verify();
    console.log('🧪 Email connection test: ✅ PASSED');
    return true;
  } catch (error) {
    console.error('🧪 Email connection test: ❌ FAILED');
    console.error('   Error:', error.message);
    return false;
  }
};

// Email templates
const emailTemplates = {
  welcome: (userData) => ({
    subject: 'Welcome to Bagga Bugs!',
    html: `
      <h1>Welcome ${userData.name}!</h1>
      <p>Thank you for joining our email campaign platform.</p>
      <p>We're excited to have you on board!</p>
    `
  }),
  
  campaign: (userData, content) => ({
    subject: content.subject,
    html: content.body
  })
};

console.log(`📊 Email service status: ${transporter ? '✅ READY' : '❌ NOT READY'}`);
console.log('='.repeat(40) + '\n');

module.exports = {
  transporter,
  sendEmail,
  emailTemplates,
  testEmailConnection
};