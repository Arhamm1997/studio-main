import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const contactId = params.id;

  if (contactId) {
    const contact = db.contacts.find(c => c.id === contactId);

    if (contact) {
      if (!contact.openTimestamp) {
        contact.openTimestamp = new Date().toISOString();
        console.log(`Tracked open for contact ${contactId} at ${contact.openTimestamp}`);
      }
    } else {
        console.log(`Contact with id ${contactId} not found.`);
    }
  }

  // Return a 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
