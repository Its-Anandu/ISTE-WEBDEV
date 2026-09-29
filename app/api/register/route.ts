import { NextRequest, NextResponse } from 'next/server';
import { registrationSchema } from '@/lib/validation/registration';
import { appendRegistrationRow, checkDuplicateRegistration, updatePaymentReference } from '@/lib/googleSheets';
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

    // Check if this is a payment proof upload action
    if (body.action === 'payment') {
      const { refId, email, mime, fileName, data } = body;

      if (!data || !mime) {
        return NextResponse.json(
          { error: 'Payment screenshot file is required.' },
          { status: 400 }
        );
      }

      if (!/^image\/(jpeg|jpg|png)$/i.test(mime)) {
        return NextResponse.json(
          { error: 'Only JPG or PNG images are allowed.' },
          { status: 400 }
        );
      }

      const targetId = refId || email;
      if (!targetId) {
        return NextResponse.json(
          { error: 'Reference ID or Email is required.' },
          { status: 400 }
        );
      }

      // If Google Apps Script Web App URL is configured, forward to Apps Script
      const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL;
      if (scriptUrl) {
        try {
          const res = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(body),
          });
          const result = await res.json();
          if (result.status === 'error') {
            return NextResponse.json({ error: result.message || 'Payment update failed.' }, { status: 400 });
          }
        } catch (fetchErr) {
          console.warn('[Apps Script Proxy Error]:', fetchErr);
        }
      }

      // Update in Google Sheets / local storage
      const updated = await updatePaymentReference(targetId, fileName || 'Screenshot Uploaded');

      return NextResponse.json({
        success: true,
        status: 'ok',
        message: 'Registration complete! Payment proof received.',
        updated,
      });
    }

    // Standard Registration flow
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
    const registrationId = payload.registrationId || payload.referenceId || `NV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Append to Google Sheets
    await appendRegistrationRow({
      registrationId,
      eventId: data.eventId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      college: data.college,
      department: data.department,
      yearOfStudy: data.yearOfStudy,
      classGroup: data.classGroup,
      isteId: data.isteId || '',
      paymentStatus: 'Pending',
      paymentRef: registrationId,
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
      reference_id: registrationId,
      qrDataUrl,
      amount: EVENT_FEE_INR,
      message: 'Registration submitted successfully.',
    });
  } catch (error: any) {
    console.error('[API /api/register Error]:', error?.stack || error);

    return NextResponse.json(
      { error: error?.message || 'Failed to submit registration. Please try again later.' },
      { status: 500 }
    );
  }
}
