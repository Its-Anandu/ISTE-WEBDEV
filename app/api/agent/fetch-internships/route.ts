import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
// @ts-ignore — plain JS runtime script (no sibling type declarations)
import { runSyncInternships } from '../../../scripts/sync_internships.mjs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * ==========================================
 * ELITE INTERNSHIP SYNC AGENT (serverless)
 * ==========================================
 * Runs the Node sync engine in-process: discovery -> strict internship-only
 * filter -> scam check -> live-link verification -> Sanity write (dedupe).
 * Scheduled by vercel.json cron (3x / day). No Python/FastAPI backend needed.
 */

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const started = Date.now();
  try {
    const report = await runSyncInternships({ skipRevalidate: true, log: console.log });

    // New/updated listings become visible instantly on both surfaces.
    revalidatePath('/');
    revalidatePath('/internships');

    return NextResponse.json({
      success: true,
      elapsedMs: Date.now() - started,
      report,
    });
  } catch (error: any) {
    console.error('[Internship Sync] Failed:', error.message || error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}