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

export async function sendCampaign() {
  console.log('Starting campaign...');
  await delay(1000);
  let emailsSent = 0;
  
  for (const contact of db.contacts) {
    if (contact.status === 'Pending') {
      try {
        const personalizedSubject = personalizeContent(db.campaign.subject, contact);
        const finalSubject = createAntiSpamSubject(personalizedSubject, contact.firstName);
        
        const personalizedBody = personalizeContent(db.campaign.body, contact);
        
        // This is where you would integrate with an email sending service like SendGrid, Resend, etc.
        // For this demo, we simulate a successful send.
        console.log(`Simulating email send to ${contact.email}`);
        console.log(`Subject: ${finalSubject}`);
        
        // This simulates the logic that would be inside an email template
        const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_BASE_URL}/api/track/${contact.id}" width="1" height="1" alt="" style="display:none;" />`;
        const emailHtml = `<div>${personalizedBody.replace(/\n/g, '<br>')}</div>${trackingPixel}`;
        console.log('Email HTML includes tracking pixel.');

        contact.status = 'Sent';
        contact.sentTimestamp = new Date().toISOString();
        emailsSent++;
        await delay(100); // Simulate delay between sends
      } catch (e) {
        contact.status = 'Error';
        console.error(`Failed to send to ${contact.email}:`, e);
      }
    }
  }

  revalidatePath('/');
  console.log(`Campaign finished. ${emailsSent} emails sent.`);
  return { success: true, message: `Campaign sent successfully to ${emailsSent} recipients!` };
}
