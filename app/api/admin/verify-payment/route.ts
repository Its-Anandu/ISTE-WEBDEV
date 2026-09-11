import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { isAdminEmail } from '@/lib/isAdmin';
import { verifyPaymentStatus } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user via Supabase server session
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { registrationId } = body;

    if (!registrationId || typeof registrationId !== 'string' || !registrationId.trim()) {
      return NextResponse.json(
        { error: 'Registration ID is required.' },
        { status: 400 }
      );
    }

    const success = await verifyPaymentStatus(registrationId.trim());

    if (!success) {
      return NextResponse.json(
        { error: 'Registration ID not found in sheet.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment status updated to Confirmed in Google Sheets.',
    });
  } catch (error: any) {
    console.error('[API /api/admin/verify-payment Error]:', error);

    return NextResponse.json(
      { error: 'Failed to verify payment status.' },
      { status: 500 }
    );
  }
}
