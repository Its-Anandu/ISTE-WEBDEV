/**
 * ISTE MBCET — Internship Sync Engine (serverless-safe Node)
 * =========================================================
 * Discovery -> strict internship-only filter -> scam check -> live-link
 * verification -> Sanity write (dedupe) -> optional revalidate.
 *
 * Safety rules:
 *  - NEVER fabricate a listing. Every item comes from real source HTML/JSON.
 *  - ONLY genuine internships (role contains intern/trainee/apprentice).
 *  - Only LIVE verified links are published as state=VERIFIED.
 *  - Unverifiable-transient links are skipped this run (retried next cron).
 */

import { createClient } from 'next-sanity';
import 'dotenv/config';
import pLimit from 'p-limit';
import { fetchText, fetchJson, verifyLink } from './internship_fetch.mjs';
import { discoverAll, classifyDomain, keralaScore, SCAM_SIGNALS } from './internship_sources.mjs';

const LIMIT = pLimit(6);

function client() {
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });
}

function isInternship(role) {
  return /\bintern(ship)?\b|\btrainee\b|\bapprentice\b/i.test(role || '');
}

function hasScamSignal(text) {
  const hay = (text || '').toLowerCase();
  return SCAM_SIGNALS.some((s) => hay.includes(s));
}

function pickType(role, location) {
  const r = `${role} ${location}`.toLowerCase();
  if (r.includes('remote') || r.includes('work from home') || r.includes('wfh')) return 'Remote';
  if (r.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function pickDuration(role, description) {
  const hay = `${role} ${description || ''}`.toLowerCase();
  const m = hay.match(/(\d+)\s*(-\s*(\d+)\s*)?(months?|weeks?)/);
  if (m) return `${m[1]}${m[2] ? `-${m[3]}` : ''} ${m[4]}`;
  return '2-6 Months';
}

async function existingByUrl(sanity, applyLink) {
  const ids = await sanity.fetch('*[_type == "internship" && applyLink == $url]._id', { url: applyLink });
  return ids && ids.length ? ids[0] : null;
}

export async function runSyncInternships({ skipRevalidate = false, log = console.log } = {}) {
  const sanity = client();
  const report = { discovered: 0, internships: 0, verified: 0, newDocs: 0, republished: 0, rejected: [], skipped: [] };

  log(`[sync] Discovering internships from all reachable sources...`);
  const { found, blocked } = await discoverAll();
  blocked.forEach((b) => log(`[sync][blocked] ${b.source}: ${b.reason}`));
  report.discovered = found.length;

  // 1) Strict internship-only + scam gate
  const candidates = [];
  for (const item of found) {
    if (!isInternship(item.role)) {
      report.rejected.push({ role: item.role, reason: 'not-marked-internship' });
      continue;
    }
    if (hasScamSignal(`${item.role} ${item.description}`)) {
      report.rejected.push({ role: item.role, reason: 'scam-signal' });
      continue;
    }
    candidates.push(item);
  }
  report.internships = candidates.length;
  log(`[sync] ${report.discovered} discovered -> ${report.internships} genuine internships.`);

  if (candidates.length === 0) {
    log('[sync] Nothing new to publish this run.');
    return report;
  }

  // 2) Verify every application link (dedupe by pruning later)
  const dedupKeys = new Set();
  const verified = [];
  const tasks = candidates.map((item) =>
    LIMIT(() => verifyLink(item.applyLink).then((v) => ({ item, v })))
  );
  const results = await Promise.all(tasks);
  for (const { item, v } of results) {
    if (v.verdict === 'rejected') {
      report.rejected.push({ role: item.role, reason: `link-${v.status}` });
      continue;
    }
    if (v.verdict === 'unverified') {
      report.skipped.push({ role: item.role, reason: 'transient-unverifiable' });
      continue;
    }
    const key = item.applyLink.toLowerCase();
    if (dedupKeys.has(key)) continue;
    dedupKeys.add(key);
    verified.push({ ...item, linkHealthScore: 100 });
  }
  report.verified = verified.length;
  log(`[sync] ${verified.length} verified live internship links.`);

  // 3) Enrich + write to Sanity (dedupe on applyLink)
  const kerala = verified.filter((i) => keralaScore(i.location, i.company) >= 20);
  const sorted = [
    ...kerala, // Kerala first for the home launchpad teaser
    ...verified.filter((i) => keralaScore(i.location, i.company) < 20),
  ];

  for (const item of sorted) {
    const existingId = await existingByUrl(sanity, item.applyLink);
    if (existingId) {
      await sanity.patch(existingId).set({
        status: 'open',
        state: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        linkHealthScore: item.linkHealthScore,
        lastVerifiedAt: new Date().toISOString(),
        verificationFailures: 0,
      }).commit();
      report.republished++;
      continue;
    }
    await sanity.create({
      _type: 'internship',
      company: item.company,
      role: item.role,
      type: pickType(item.role, item.location),
      domain: classifyDomain(item.role, item.description),
      stipend: 'As per listing',
      duration: pickDuration(item.role, item.description),
      deadlineLabel: 'Apply ASAP',
      applyLink: item.applyLink,
      description: item.description ? item.description.slice(0, 400) : item.role,
      status: 'open',
      featured: item.zone === 'Research' || item.zone === 'Startup' || keralaScore(item.location, item.company) >= 20,
      state: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      linkHealthScore: item.linkHealthScore,
      verificationFailures: 0,
      qualityScore: 90,
      confidenceScore: 90,
      source: item.source,
      location: item.location || item.region || '',
    });
    report.newDocs++;
    log(`[sync] + published: ${item.role} · ${item.company}`);
  }

  log(`[sync] Complete. new=${report.newDocs} republished=${report.republished} rejected=${report.rejected.length} skipped=${report.skipped.length}`);

  if (!skipRevalidate) {
    try {
      const base = process.env.SITE_URL || 'http://localhost:3000';
      const secret = process.env.MY_SECRET_TOKEN;
      if (secret) {
        await fetch(`${base}/api/revalidate?secret=${encodeURIComponent(secret)}`, { method: 'POST' });
        log('[sync] Revalidation triggered (webhook endpoint).');
      }
    } catch (e) {
      log(`[sync][warn] revalidation failed: ${e.message}`);
    }
  }

  return report;
}

const isDirectRun =
  process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/sync_internships.mjs');

if (isDirectRun) {
  runSyncInternships({ skipRevalidate: true })
    .then((r) => {
      if (r.rejected.length) {
        console.log('\n[rejected]');
        r.rejected.slice(0, 40).forEach((x) => console.log(`  - ${x.role || '(no role)'} :: ${x.reason}`));
      }
      console.log('\nDone.');
    })
    .catch((e) => {
      console.error('[sync][fatal]', e);
      process.exit(1);
    });
}