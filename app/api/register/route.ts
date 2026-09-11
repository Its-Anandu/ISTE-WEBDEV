import { NextRequest, NextResponse } from 'next/server';
import { registrationSchema } from '@/lib/validation/registration';
import { appendRegistrationRow, checkDuplicateRegistration } from '@/lib/googleSheets';
import { generateUpiQrDataUrl } from '@/lib/generateUpiQr';

// Placeholder constant for event registration fee (INR).
const EVENT_FEE_INR = 100;

// Simple in-memory rate limiter: max 5 requests per IP per 60 seconds.
// NOTE: Resets on server restart and is per-instance (flagged limitation).
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  console.log('[DEBUG RUNTIME SPREADSHEET ID]:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
  console.log('[DEBUG RUNTIME CLIENT EMAIL]:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  try {
    // Extract IP address for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Map `slug` to `eventId` if `eventId` wasn't explicitly passed
    const payload = {
      ...body,
      eventId: body.eventId || body.slug,
    };

    // Server-side Zod validation
    const validationResult = registrationSchema.safeParse(payload);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Validation failed';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = validationResult.data;

    // Check for duplicate registration for this event
    const duplicateCheck = await checkDuplicateRegistration(data.eventId, data.email);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: "You've already registered for this event.",
          isDuplicate: true,
          existingRegistrationId: duplicateCheck.registrationId,
          paymentStatus: duplicateCheck.paymentStatus,
        },
        { status: 409 }
      );
    }

    // Generate unique registration ID
    const registrationId = crypto.randomUUID();

    // Append to Google Sheets
    await appendRegistrationRow({
      registrationId,
      eventId: data.eventId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      college: data.college,
      yearOfStudy: data.yearOfStudy,
      isteId: data.isteId || '',
      paymentStatus: 'Pending',
      paymentRef: '',
    });

    // Generate UPI Payment QR code Data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await generateUpiQrDataUrl({
        amount: EVENT_FEE_INR,
        transactionRef: registrationId,
        note: `ISTE Reg ${registrationId.slice(0, 8)}`,
      });
    } catch (qrErr) {
      console.error('[QR Generation Error]:', qrErr);
    }

    return NextResponse.json({
      success: true,
      registrationId,
      qrDataUrl,
      amount: EVENT_FEE_INR,
      message: 'Registration submitted successfully.',
    });
  } catch (error: any) {
    console.error('[API /api/register Error]:', error);

    return NextResponse.json(
      { error: error?.message || 'Failed to submit registration. Please try again later.' },
      { status: 500 }
    );
  }
}
