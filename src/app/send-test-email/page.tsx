'use client';
import { useState } from 'react';

export default function SendTestEmailPage() {
  const [status, setStatus] = useState('');
  const handleSend = async () => {
    setStatus('Sending...');
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'helpdesk@firehousesubmenu.us',
        subject: 'Test Email',
        html: '<b>Hello from Next.js!</b>',
      }),
    });
    setStatus(res.ok ? 'Sent!' : 'Failed!');
  };
  return (
    <div>
      <button onClick={handleSend}>Send Test Email</button>
      <p>{status}</p>
    </div>
  );
}