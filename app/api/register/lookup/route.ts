import { NextRequest, NextResponse } from 'next/server';
import { lookupSchema } from '@/lib/validation/registration';
import { checkDuplicateRegistration } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate payload with Zod
    const validationResult = lookupSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, eventId } = validationResult.data;

    const check = await checkDuplicateRegistration(eventId, email);

    if (check.isDuplicate) {
      return NextResponse.json({
        found: true,
        registrationId: check.registrationId,
        paymentStatus: check.paymentStatus,
        fullName: check.fullName,
      });
    }

    return NextResponse.json({
      found: false,
      message: 'No existing registration found for this email.',
    });
  } catch (error: any) {
    console.error('[API /api/register/lookup Error]:', error);

    return NextResponse.json(
      { error: 'Failed to look up registration status.' },
      { status: 500 }
    );
  }
}
