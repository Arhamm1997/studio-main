// config/emailConfig.js - FIXED VERSION
require('dotenv').config();
const nodemailer = require('nodemailer');

// Debug: Check if nodemailer is loaded properly
console.log('📦 Nodemailer loaded:', typeof nodemailer.createTransporter);

// Email transporter configuration
const createTransporter = () => {
  try {
    // Check if using SendGrid
    if (process.env.SENDGRID_API_KEY) {
      return nodemailer.createTransporter({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }

    // Default SMTP configuration for Gmail
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // For development only
      }
    });

    return transporter;

  } catch (error) {
    console.error('❌ Error creating transporter:', error);
    return null;
  }
};

// Create transporter
const transporter = createTransporter();

// Verify connection configuration
if (transporter) {
  transporter.verify(function(error, success) {
    if (error) {
      console.error('❌ Email configuration error:', error.message);
      console.log('📌 Check your .env file for correct email settings');
      console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
      console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ Set' : '✗ Not set');
    } else {
      console.log('✅ Email server is ready to send messages');
      console.log('📧 Using email:', process.env.EMAIL_USER);
    }
  });
} else {
  console.error('❌ Failed to create email transporter');
}

module.exports = transporter;