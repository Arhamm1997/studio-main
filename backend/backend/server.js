const express = require('express');
const { sendEmail } = require('./config/emailConfig');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Test route for sending email
app.get('/send-test-email', async (req, res) => {
  try {
    const emailOptions = {
      to: 'jayden.hivetechsol@gmail.com',  // Replace with the recipient email
      subject: 'Test Email from Localhost',
      text: 'This is a test email sent from your local server.',
      html: '<p>This is a test email sent from your local server.</p>',
    };

    const result = await sendEmail(emailOptions);
    res.json({
      success: true,
      message: 'Test email sent successfully!',
      info: result
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email.',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
const cors = require('cors');

// Allow requests from your frontend
app.use(cors({
  origin: 'http://localhost:9002',  // Frontend URL
  methods: ['GET', 'POST'],        // Allowed methods
  allowedHeaders: ['Content-Type'] // Allowed headers
}));
