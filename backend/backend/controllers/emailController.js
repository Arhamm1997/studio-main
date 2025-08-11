const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

// Send contact form email
const sendContactEmail = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, subject, message, phone } = req.body;

    const result = await emailService.sendContactEmail({
      name,
      email,
      subject,
      message,
      phone
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Email controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Send bulk emails to multiple contacts
const sendBulkEmails = async (req, res) => {
  try {
    const { recipients, subject, message, template } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients provided'
      });
    }

    const results = await emailService.sendBulkEmails({
      recipients,
      subject,
      message,
      template
    });

    res.status(200).json({
      success: true,
      message: 'Bulk emails sent',
      results
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk emails',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Test email functionality
const testEmail = async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    const result = await emailService.sendTestEmail(testEmail || process.env.EMAIL_USER);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      info: result
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message,
      details: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? '✓ Set' : '✗ Not set',
        pass: process.env.EMAIL_PASS ? '✓ Set' : '✗ Not set'
      }
    });
  }
};

module.exports = {
  sendContactEmail,
  sendBulkEmails,
  testEmail
};