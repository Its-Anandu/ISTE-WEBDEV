import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentReference } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  console.log('[DEBUG RUNTIME SPREADSHEET ID]:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
  console.log('[DEBUG RUNTIME CLIENT EMAIL]:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL);
  try {
    const body = await request.json();
    const { registrationId, utrNumber } = body;

    if (!registrationId || typeof registrationId !== 'string' || !registrationId.trim()) {
      return NextResponse.json(
        { error: 'Registration ID is required.' },
        { status: 400 }
      );
    }

    if (!utrNumber || typeof utrNumber !== 'string' || !utrNumber.trim()) {
      return NextResponse.json(
        { error: 'UPI Transaction ID / UTR Number is required.' },
        { status: 400 }
      );
    }

    const updated = await updatePaymentReference(
      registrationId.trim(),
      utrNumber.trim()
    );

    if (!updated) {
      return NextResponse.json(
        { error: 'Registration record not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment reference submitted. An admin will verify and confirm your registration.',
    });
  } catch (error: any) {
    console.error('[API /api/register/confirm-payment Error]:', error);

    return NextResponse.json(
      { error: 'Failed to update payment reference. Please try again later.' },
      { status: 500 }
    );
  }
}
