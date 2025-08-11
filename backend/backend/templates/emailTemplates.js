const emailTemplates = {
  // Contact form template
  contactFormTemplate: (data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { background: #f4f4f4; padding: 20px; margin: 20px 0; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #555; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Name:</span> ${data.name}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${data.email}
            </div>
            ${data.phone ? `<div class="field">
              <span class="label">Phone:</span> ${data.phone}
            </div>` : ''}
            <div class="field">
              <span class="label">Subject:</span> ${data.subject}
            </div>
            <div class="field">
              <span class="label">Message:</span>
              <p>${data.message.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from your website contact form</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Auto-reply template
  autoReplyTemplate: (name) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #fff; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body style="background: #f5f5f5;">
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Us!</h1>
          </div>
          <div class="content">
            <p>Dear ${name},</p>
            <p>We have received your message and appreciate you reaching out to us. Our team will review your inquiry and get back to you within 24-48 hours.</p>
            <p>In the meantime, feel free to explore our website or follow us on social media for updates.</p>
            <p>Best regards,<br>The Studio Main Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Studio Main. All rights reserved.</p>
            <p>This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Newsletter template
  newsletterTemplate: (message, name = 'Subscriber') => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .wrapper { background: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 40px 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
          .unsubscribe { color: #feca57; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>📧 Newsletter Update</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              ${message}
            </div>
            <div class="footer">
              <p>© 2024 Studio Main | <a href="#" class="unsubscribe">Unsubscribe</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Simple template
  simpleTemplate: (subject, message) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border: 1px solid #ddd; }
          h2 { color: #007bff; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>${subject}</h2>
          <div>${message.replace(/\n/g, '<br>')}</div>
        </div>
      </body>
      </html>
    `;
  },

  // Test email template
  testEmailTemplate: () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f0f0f0; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .success { color: #28a745; font-size: 48px; text-align: center; }
          h2 { text-align: center; color: #333; }
          .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .timestamp { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="success">✅</div>
          <h2>Email Configuration Successful!</h2>
          <div class="info">
            <p><strong>🎉 Congratulations!</strong></p>
            <p>Your email service is properly configured and working. You can now send emails from your application.</p>
            <p><strong>Configuration Details:</strong></p>
            <ul>
              <li>SMTP Host: ${process.env.EMAIL_HOST}</li>
              <li>Port: ${process.env.EMAIL_PORT}</li>
              <li>Secure: ${process.env.EMAIL_SECURE}</li>
              <li>Service: ${process.env.EMAIL_SERVICE || 'Custom SMTP'}</li>
            </ul>
          </div>
          <div class="timestamp">
            Test performed at: ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
      </html>
    `;
  }
};

module.exports = emailTemplates;