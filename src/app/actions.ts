'use server';

import { db } from '@/lib/db';
import type { Campaign, Contact } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Data Fetching Actions ---

export async function getCampaign(): Promise<Campaign> {
  await delay(200);
  return db.campaign;
}

export async function getContacts(): Promise<Contact[]> {
  await delay(200);
  return db.contacts;
}

export async function getAnalytics() {
  await delay(200);
  const contacts = db.contacts;
  const total = contacts.length;
  const sent = contacts.filter(c => c.status === 'Sent').length;
  const pending = contacts.filter(c => c.status === 'Pending').length;
  const errors = contacts.filter(c => c.status === 'Error').length;
  const opened = contacts.filter(c => c.openTimestamp !== null).length;
  const openRate = sent > 0 ? parseFloat(((opened / sent) * 100).toFixed(2)) : 0;
  const sentRate = total > 0 ? parseFloat(((sent / total) * 100).toFixed(2)) : 0;

  return { total, sent, pending, errors, opened, openRate, sentRate };
}

// --- Data Mutation Actions ---

export async function updateCampaign(data: Campaign) {
  await delay(500);
  db.campaign = { ...db.campaign, ...data };
  revalidatePath('/');
  return { success: true, message: "Campaign updated successfully!" };
}

export async function addContact(contactData: Omit<Contact, 'id' | 'status' | 'sentTimestamp' | 'openTimestamp'>) {
  await delay(500);
  const newId = (Math.max(0, ...db.contacts.map(c => parseInt(c.id))) + 1).toString();
  const newContact: Contact = {
    ...contactData,
    id: newId,
    status: 'Pending',
    sentTimestamp: null,
    openTimestamp: null,
  };
  db.contacts.push(newContact);
  revalidatePath('/');
  return { success: true, message: "Contact added!" };
}

export async function addContacts(contactsData: Omit<Contact, 'id' | 'status' | 'sentTimestamp' | 'openTimestamp'>[]) {
    await delay(500);
    let maxId = Math.max(0, ...db.contacts.map(c => parseInt(c.id)));
    for (const contactData of contactsData) {
        maxId++;
        const newContact: Contact = {
            ...contactData,
            id: maxId.toString(),
            status: 'Pending',
            sentTimestamp: null,
            openTimestamp: null,
        };
        db.contacts.push(newContact);
    }
    revalidatePath('/');
    return { success: true, message: `${contactsData.length} contacts added!` };
}

export async function deleteContacts(ids: string[]) {
    await delay(500);
    db.contacts = db.contacts.filter(c => !ids.includes(c.id));
    revalidatePath('/');
    return { success: true, message: "Selected contacts deleted." };
}

function capitalize(s: string) {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export async function cleanContacts(ids: string[]) {
    await delay(500);
    let updatedCount = 0;
    db.contacts.forEach(contact => {
        if (ids.includes(contact.id)) {
            contact.email = contact.email.trim().toLowerCase();
            contact.firstName = capitalize(contact.firstName.trim());
            contact.lastName = capitalize(contact.lastName.trim());
            updatedCount++;
        }
    });
    revalidatePath('/');
    return { success: true, message: `Cleaned ${updatedCount} contacts.` };
}

function createAntiSpamSubject(subject: string, firstName: string) {
  let antiSpam = subject;
  const spamWords: { [key: string]: string } = {
    'FREE': 'Complimentary', 'URGENT': 'Important', 'ACT NOW': 'Take Action',
    'LIMITED TIME': 'Special Offer', 'CLICK HERE': 'Learn More', 'BUY NOW': 'Get Started',
    'MONEY': 'Value', 'CASH': 'Savings', 'WIN': 'Receive', 'WINNER': 'Selected',
    'DEAL': 'Offer', 'SALE': 'Special Price'
  };
  for (let spam in spamWords) {
    antiSpam = antiSpam.replace(new RegExp(spam, 'gi'), spamWords[spam]);
  }
  if (antiSpam === antiSpam.toUpperCase() && antiSpam.length > 5) {
    antiSpam = antiSpam.charAt(0).toUpperCase() + antiSpam.slice(1).toLowerCase();
  }
  return antiSpam.replace(/!{2,}/g, '!').replace(/\?{2,}/g, '?');
}

function personalizeContent(content: string, contact: Omit<Contact, 'id'>) {
  return content
    .replace(/\{\{firstName\}\}/g, contact.firstName)
    .replace(/\{\{lastName\}\}/g, contact.lastName)
    .replace(/\{\{fullName\}\}/g, `${contact.firstName} ${contact.lastName}`.trim())
    .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
}

// Enhanced function to send email via backend
async function sendEmailViaBackend(contact: Contact, subject: string, htmlContent: string) {
  console.log(`🚀 Sending email to: ${contact.email}`);
  
  try {
    const response = await fetch('http://localhost:5000/api/send-contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${contact.firstName} ${contact.lastName}`.trim(),
        email: contact.email,
        subject: subject,
        message: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        htmlContent: htmlContent // Send full HTML
      }),
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`❌ Backend error:`, errorData);
      throw new Error(`Backend error: ${errorData.message || `HTTP ${response.status}`}`);
    }

    const result = await response.json();
    console.log(`✅ Email sent successfully:`, result);
    return result.success;

  } catch (error) {
    console.error('❌ Network or parsing error:', error);
    throw error;
  }
}

export async function sendCampaign() {
  console.log('🚀 Starting real email campaign...');
  await delay(1000);
  
  let emailsSent = 0;
  let emailsFailed = 0;
  const errors: string[] = [];
  
  const pendingContacts = db.contacts.filter(contact => contact.status === 'Pending');
  
  if (pendingContacts.length === 0) {
    return { success: false, message: "No pending contacts to send to!" };
  }

  console.log(`📧 Found ${pendingContacts.length} contacts to email`);
  
  // Test backend connection first
  try {
    const healthCheck = await fetch('http://localhost:5000/api/health');
    if (!healthCheck.ok) {
      throw new Error('Backend server not responding');
    }
    const health = await healthCheck.json();
    console.log('🏥 Backend health check:', health);
    
    if (health.emailService !== 'loaded') {
      throw new Error('Email service not properly loaded on backend');
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return { 
      success: false, 
      message: "Cannot connect to email backend. Please make sure the backend server is running on port 5000.",
      error: error.message
    };
  }
  
  for (const contact of pendingContacts) {
    try {
      console.log(`\n📤 Processing: ${contact.email}`);
      
      const personalizedSubject = personalizeContent(db.campaign.subject, contact);
      const finalSubject = createAntiSpamSubject(personalizedSubject, contact.firstName);
      const personalizedBody = personalizeContent(db.campaign.body, contact);
      
      // Create tracking pixel
      const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/track/${contact.id}" width="1" height="1" alt="" style="display:none;" />`;
      
      // Create proper HTML email
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${finalSubject}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .content { 
              background: #fff; 
              padding: 30px; 
              border: 1px solid #ddd; 
              border-top: none; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px; 
              color: #666; 
              border-radius: 0 0 10px 10px; 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Message from ${db.campaign.senderName}</h1>
          </div>
          <div class="content">
            ${personalizedBody.replace(/\n/g, '<br>')}
          </div>
          <div class="footer">
            <p>Sent by ${db.campaign.senderName} | ${new Date().toLocaleDateString()}</p>
            <p>This email was sent to ${contact.email}</p>
          </div>
          ${trackingPixel}
        </body>
        </html>
      `;

      // Send email via backend
      await sendEmailViaBackend(contact, finalSubject, emailHtml);
      
      // Update contact status to sent
      contact.status = 'Sent';
      contact.sentTimestamp = new Date().toISOString();
      emailsSent++;
      
      console.log(`✅ Email sent successfully to: ${contact.email}`);
      
      // Add delay between emails to avoid overwhelming the server
      await delay(500);
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${contact.email}:`, error);
      contact.status = 'Error';
      emailsFailed++;
      errors.push(`${contact.email}: ${error.message}`);
    }
  }

  revalidatePath('/');
  
  const resultMessage = emailsFailed > 0 
    ? `Campaign completed! ${emailsSent} emails sent successfully, ${emailsFailed} failed.`
    : `Campaign sent successfully to ${emailsSent} recipients! 🎉`;
    
  console.log(`📊 Campaign finished: ${emailsSent} sent, ${emailsFailed} failed`);
  
  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach(error => console.log(`   - ${error}`));
  }
  
  return { 
    success: emailsSent > 0, 
    message: resultMessage,
    stats: {
      sent: emailsSent,
      failed: emailsFailed,
      total: pendingContacts.length
    },
    errors: errors
  };
}