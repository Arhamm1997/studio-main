const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { body } = require('express-validator');

// Validation middleware
const validateContactForm = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('phone').optional().isMobilePhone()
];

// Routes
router.post('/send-contact', validateContactForm, emailController.sendContactEmail);
router.post('/send-bulk', emailController.sendBulkEmails);
router.post('/test', emailController.testEmail);

// Health check for email service
router.get('/status', (req, res) => {
  res.json({
    status: 'active',
    service: process.env.EMAIL_SERVICE || 'SMTP',
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

module.exports = router;