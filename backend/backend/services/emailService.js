const transporter = require('../config/emailConfig');
const emailTemplates = require('../templates/emailTemplates');

class EmailService {
  // Send contact form email
  async sendContactEmail(data) {
    const { name, email, subject, message, phone } = data;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Your email to receive contact forms
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: emailTemplates.contactFormTemplate({
        name,
        email,
        subject,
        message,
        phone
      })
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Contact email sent:', info.messageId);
      
      // Send auto-reply to sender
      await this.sendAutoReply(email, name);
      
      return info;
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw error;
    }
  }

  // Send auto-reply email
  async sendAutoReply(email, name) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting us',
      html: emailTemplates.autoReplyTemplate(name)
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Auto-reply sent to:', email);
    } catch (error) {
      console.error('❌ Auto-reply error:', error);
      // Don't throw error for auto-reply failure
    }
  }

  // Send bulk emails
  async sendBulkEmails(data) {
    const { recipients, subject, message, template } = data;
    const results = {
      successful: [],
      failed: []
    };

    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
          to: recipient.email || recipient,
          subject: subject,
          html: template === 'newsletter' 
            ? emailTemplates.newsletterTemplate(message, recipient.name)
            : emailTemplates.simpleTemplate(subject, message)
        };

        const info = await transporter.sendMail(mailOptions);
        results.successful.push({
          email: recipient.email || recipient,
          messageId: info.messageId
        });

      } catch (error) {
        results.failed.push({
          email: recipient.email || recipient,
          error: error.message
        });
      }
    }

    return results;
  }

  // Send test email
  async sendTestEmail(testEmail) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '🧪 Test Email - Studio Main',
      html: emailTemplates.testEmailTemplate()
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  }
}

module.exports = new EmailService();