const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug logging
console.log('📦 Nodemailer loaded:', typeof nodemailer);
console.log('📧 Email config:', {
  user: process.env.EMAIL_USER ? '✓ Set' : '✗ Not set',
  pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Not set',
  service: process.env.EMAIL_SERVICE || 'gmail'
});

const createTransporter = () => {
  try {
    // Check if nodemailer is properly loaded
    if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
      throw new Error('Nodemailer not properly loaded');
    }

    // Check if email credentials are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('⚠️ Email credentials not set in environment variables');
      console.log('Please set EMAIL_USER and EMAIL_PASS in your .env file');
      return null;
    }

    // Fix the method name from createTransporter to createTransport
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Only for development
      }
    });

    // Verify the transporter configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter verification failed:', error.message);
      } else {
        console.log('✅ Email transporter is ready to send emails');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Error creating transporter:', error);
    return null;
  }
};

// Create the transporter
const transporter = createTransporter();

// Email sending function
const sendEmail = async (options) => {
  if (!transporter) {
    console.error('❌ Email transporter not configured');
    throw new Error('Email service is not configured. Please check your environment variables.');
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Email templates
const emailTemplates = {
  welcome: (userData) => ({
    subject: 'Welcome to Our Studio!',
    html: `
      <h1>Welcome ${userData.name}!</h1>
      <p>Thank you for joining our studio platform.</p>
      <p>We're excited to have you on board!</p>
    `
  }),
  
  resetPassword: (userData, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>Hi ${userData.name},</p>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  }),
  
  bookingConfirmation: (bookingData) => ({
    subject: 'Booking Confirmation',
    html: `
      <h1>Booking Confirmed!</h1>
      <p>Your booking has been confirmed for:</p>
      <ul>
        <li>Date: ${bookingData.date}</li>
        <li>Time: ${bookingData.time}</li>
        <li>Service: ${bookingData.service}</li>
      </ul>
      <p>Thank you for choosing our studio!</p>
    `
  })
};

module.exports = {
  transporter,
  sendEmail,
  emailTemplates
};
