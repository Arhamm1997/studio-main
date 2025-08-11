import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/services/emailService';

export async function POST(req: NextRequest) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendEmail(to, subject, html);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}