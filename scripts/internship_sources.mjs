/**
 * ISTE MBCET — Internship Source Registry (Node / serverless-safe)
 * ===============================================================
 * Only sources reachable via plain HTTP/JSON from a serverless Node
 * function (no Playwright / jobspy / Python). Each entry is autonomous:
 * a failed/blocked source is skipped and reported, never fabricated.
 *
 * Discovery output is ALWAYS filtered to genuine internships (role must
 * contain "intern / trainee / apprentice") and only VERIFIED live-link
 * listings are published to Sanity.
 */

import { fetchText, fetchJson } from './internship_fetch.mjs';

// ─── Scam signals ────────────────────────────────────────────────────────────
export const SCAM_SIGNALS = [
  'registration fee', 'deposit required', 'pay to work', 'processing fee',
  'security deposit', 'pay us', 'unpaid with fee', 'training fee',
  'laptop deposit', 'investment required', 'starter kit cost',
  'onboarding fee', 'guaranteed placement fee', 'buy our course',
  'purchase kit', 'pay registration', 'refundable deposit',
  'multi level marketing', 'mlm', 'network marketing',
  'recruit your friends', 'commission only', 'pyramid',
];

// ─── Kerala geography (for ranking + honest location tagging) ───────────────
export const KERALA_MARKERS = [
  'trivandrum', 'thiruvananthapuram', 'kerala', 'kochi', 'cochin',
  'ernakulam', 'kozhikode', 'calicut', 'technopark', 'infopark',
  'cyberpark', 'kakkanad', 'kazhakoottam', 'palakkad', 'kollam',
  'thrissur', 'ksum',
];

// ─── Domain classification keywords ─────────────────────────────────────────
export const DOMAIN_KEYWORDS = {
  'AI/ML & Data Science': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'data science', 'artificial intelligence', 'llm', 'neural'],
  'Embedded & IoT': ['embedded', 'microcontroller', 'raspberry pi', 'stm32', 'firmware', 'pcb', 'iot', 'sensor', 'fpga', 'verilog', 'rtos', 'hardware'],
  'Web Development': ['react', 'next.js', 'vue', 'angular', 'node', 'express', 'django', 'flask', 'frontend', 'backend', 'full stack', 'javascript', 'typescript', 'graphql', 'web'],
  'Cybersecurity': ['cybersecurity', 'penetration testing', 'ethical hacking', 'network security', 'security', 'malware', 'soc', 'owasp'],
  'Cloud & DevOps': ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'ci/cd', 'devops', 'terraform', 'cloud', 'linux', 'devops'],
  'Mobile Development': ['android', 'ios', 'flutter', 'react native', 'swift', 'kotlin', 'mobile'],
  'VLSI & Semiconductor': ['vlsi', 'rtl', 'verilog', 'vhdl', 'asic', 'fpga', 'semiconductor', 'cadence'],
  'Robotics & Automation': ['robotics', 'ros', 'automation', 'mechatronics', 'drone', 'autonomous', 'servo'],
  'UI/UX Design': ['figma', 'ui/ux', 'user interface', 'user experience', 'design', 'prototype', 'wireframe'],
  'Data Engineering': ['data pipeline', 'spark', 'kafka', 'airflow', 'etl', 'data warehouse', 'bigquery', 'snowflake'],
};

/** Greenhouse Jobboard API (public JSON — many premier firms use this). */
const GREENHOUSE_BOARDS = [
  'coinbase', 'vimeo', 'plaid', 'chainlink', 'chime', 'reddit',
  'architecture', 'indeed', 'dropbox', 'square', 'robinhood', 'wiscience',
];

/**
 * Tier-A: Kerala companies + premier institutions + research labs.
 * `parse.kind` describes how to read the page:
 *   - "greenhouse" -> board slug (parse.slug)
 *   - "role_links" -> plain HTML, pull <a> rows whose text looks like an internship
 */
export const TIER_A_SOURCES = [
  // ── Kerala tech park MNCs (premier) ────────────────────────────────────────
  { company: 'TCS', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://www.tcs.com/careers/india/freshers' },
  { company: 'Infosys', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://www.infosys.com/careers/india/students.html' },
  { company: 'Quest Global', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://careers.quest-global.com/search-results?location=Trivandrum' },
  { company: 'UST', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://www.ust.com/en/careers' },
  { company: 'Tata Elxsi', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://www.tataelxsi.com/careers/search-jobs' },
  { company: 'QBurst', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://www.qburst.com/en-in/careers/india/' },
  { company: 'Experion', region: 'Trivandrum', zone: 'Technopark', kind: 'role_links', url: 'https://experionglobal.com/careers/' },
  { company: 'Fingent', region: 'Kochi', zone: 'Infopark', kind: 'role_links', url: 'https://www.fingent.com/careers/' },
  { company: 'LTIMindtree', region: 'Kochi', zone: 'Infopark', kind: 'role_links', url: 'https://www.ltimindtree.com/careers/' },
  { company: 'EY', region: 'Kochi', zone: 'Infopark', kind: 'role_links', url: 'https://careers.ey.com/ey/search/#q=intern&t=Jobs&l=india' },
  { company: 'Genrobotics', region: 'Trivandrum', zone: 'Startup', kind: 'role_links', url: 'https://genrobotics.org/careers' },
  // ── Premier institutions & research labs ──────────────────────────────────
  { company: 'IIT Palakkad', region: 'Palakkad', zone: 'Research', kind: 'role_links', url: 'https://iitpkd.ac.in/careers' },
  { company: 'NIT Calicut', region: 'Calicut', zone: 'Research', kind: 'role_links', url: 'https://nitc.ac.in/department/placements/internship' },
  { company: 'IIST Trivandrum', region: 'Trivandrum', zone: 'Research', kind: 'role_links', url: 'https://www.iist.ac.in/placements/internships' },
  { company: 'ISRO / VSSC', region: 'Trivandrum', zone: 'Research', kind: 'role_links', url: 'https://www.isro.gov.in/opportunities.html' },
  { company: 'C-DAC Trivandrum', region: 'Trivandrum', zone: 'Research', kind: 'role_links', url: 'https://www.cdac.in/index.aspx?id=jobs' },
  { company: 'KSUMM', region: 'Kerala', zone: 'KSUM', kind: 'role_links', url: 'https://startupmission.kerala.gov.in/jobs' },
];

/**
 * Internshala Kerala search pages — the primary "any company in Kerala" feed.
 * Bot-protected (Cloudflare): may be blocked from serverless Node. We attempt
 * SSR HTML with a browser UA; if blocked we emit NOTHING (never fabricate).
 */
export const INTERNSHALA_KERALA_URLS = [
  'https://internshala.com/internships/computer-science-internship-in-kerala/',
  'https://internshala.com/internships/machine-learning-internship-in-kerala/',
  'https://internshala.com/internships/web-development-internship-in-kerala/',
  'https://internshala.com/internships/data-science-internship-in-kerala/',
  'https://internshala.com/internships/electronics-internship-in-kerala/',
  'https://internshala.com/internships/cybersecurity-internship-in-kerala/',
];

// ─── Source discovery dispatchers ────────────────────────────────────────────
async function discoverGreenhouse(slug, base) {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
  const jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  return jobs.map((j) => ({
    raw: j,
    role: (j.title || '').trim(),
    company: base.company,
    applyLink: j.absolute_url || '',
    description: stripHtml(j.content || ''),
    location: j.location?.name || '',
    source: `Greenhouse · ${base.company}`,
    region: base.region,
    zone: base.zone,
  }));
}

async function discoverRoleLinks(base) {
  const html = await fetchText(base.url);
  const links = extractRoleLinks(html, base.url);
  return links.map((l) => ({
    raw: null,
    role: l.role,
    company: base.company,
    applyLink: l.href,
    description: l.role,
    location: base.region || '',
    source: base.company,
    region: base.region,
    zone: base.zone,
  }));
}

async function discoverInternshala(base) {
  const html = await fetchText(base.url, true);
  const links = extractRoleLinks(html, base.url, 'internshala');
  return links.map((l) => ({
    raw: null,
    role: l.role,
    company: l.company || 'Internshala',
    applyLink: l.href,
    description: l.role,
    location: 'Kerala',
    source: 'Internshala · Kerala',
    region: 'Kerala',
    zone: 'Kerala',
  }));
}

/** Discovery entry point. Returns { found, rejected, blocked } lists. */
export async function discoverAll({ limitInternshala = 12, concurrency = 6 } = {}) {
  const found = [];
  const rejected = [];
  const blocked = [];

  // Simple concurrency pool over a list of async tasks.
  async function pooled(tasks) {
    const q = tasks.slice();
    const workers = Array.from({ length: Math.min(concurrency, q.length) }, async () => {
      while (q.length) {
        const fn = q.shift();
        try {
          const items = await fn();
          if (items && items.length) found.push(...items);
        } catch (e) {
          blocked.push({ source: 'task', reason: e.message });
        }
      }
    });
    await Promise.all(workers);
  }

  // 1. Internshala Kerala (best-effort, heavily bot protected)
  const internshalaTasks = INTERNSHALA_KERALA_URLS.slice(0, limitInternshala).map((url) => async () => {
    try {
      const items = await discoverInternshala({ url });
      if (items.length) return items;
      rejected.push({ source: 'Internshala·Kerala', reason: `empty/blocked: ${url}` });
      return [];
    } catch (e) {
      blocked.push({ source: 'Internshala·Kerala', reason: e.message });
      return [];
    }
  });

  // 2. Tier-A Kerala / premier + research pages
  const tierATasks = TIER_A_SOURCES.map((src) => async () => {
    if (src.kind !== 'role_links') return [];
    return discoverRoleLinks(src);
  });

  // 3. Greenhouse intern-board APIs (premier, reliable JSON)
  const greenhouseTasks = GREENHOUSE_BOARDS.map((slug) => async () =>
    discoverGreenhouse(slug, { company: prettify(slug), region: 'India/Remote', zone: 'Global' })
  );

  await pooled([...internshalaTasks, ...tierATasks, ...greenhouseTasks]);

  return { found, rejected, blocked };
}

// ─── HTML helpers ────────────────────────────────────────────────────────────
function stripHtml(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function prettify(slug) {
  return String(slug).split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Nav / institutional headings that are NOT individual internship postings.
const NAV_ROLE = /^(internships?|view all internships|internships search page)$/i;
const NEWS_ROLE = /(felicitat|celebrat|signs?\s+mo[uv]|concludes|international conference|convocation|inaugurat|\bmou\b|yoga|workshop\s+on|seminar)/i;

/**
 * Best-effort raw-HTML role-link extractor. Looks for anchor rows whose text
 * is short and mentions an internship/trainee term. Returns objects with
 * { role, href } where href is absolute.
 *
 * Guardian rules (to avoid the prior "full-time job / nav link / news" leak):
 *  - Internshala: ONLY real posting pages (`/internship/detail/`), never
 *    category/search/nav links.
 *  - Others: reject nav labels, news/institutional headings, and vague roles.
 */
function extractRoleLinks(html, baseUrl, kind = '') {
  const out = [];
  const baseHost = safeHost(baseUrl);
  const seen = new Set();
  // Match <a ...>TEXT</a> (non-greedy, text may contain nested tags)
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const href = m[1].trim();
    const text = stripHtml(m[2]);
    if (!href || !text) continue;

    let abs = href;
    if (href.startsWith('/')) abs = `${baseHost}${href}`;
    else if (/^https?:\/\//i.test(href)) abs = href;
    else continue;
    if (/mailto:|tel:/.test(abs)) continue;

    // Internshala: only real detail postings.
    if (kind === 'internshala') {
      if (!/intern(shi)?p\/detail\//i.test(abs)) continue;
      if (/internship (in|at) [a-z ]+$/i.test(text)) continue; // generic "Internship in Delhi"
    }

    if (!/intern|trainee|apprentice/i.test(text)) continue;
    const role = text.replace(/\s+/g, ' ').trim();
    if (role.length < 12) continue;                       // too vague
    if (NAV_ROLE.test(role)) continue;                    // nav/category label
    if (kind !== 'internshala' && NEWS_ROLE.test(role)) continue; // news heading

    const key = `${role.trim().toLowerCase()}::${abs.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let company = '';
    if (kind === 'internshala') {
      const cm = /class=["'][^"']*company_name[^"']*["'][^>]*>([^<]+)</i.exec(html.slice(m.index, m.index + 400));
      if (cm) company = stripHtml(cm[1]);
    }
    out.push({ role, href: abs, company });
    if (out.length >= 25) break;
  }
  return out;
}

function safeHost(url) {
  try { return new URL(url).origin; } catch { return 'https://example.com'; }
}

/** Classify a role into a domain string using the keyword map. */
export function classifyDomain(role, description) {
  const hay = `${role} ${description || ''}`.toLowerCase();
  let best = 'Technology';
  let bestHits = 0;
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS)) {
    const hits = kws.filter((k) => hay.includes(k)).length;
    if (hits > bestHits) { bestHits = hits; best = domain; }
  }
  return best;
}

/** True if text mentions a Kerala location (for ranking + labeling). */
export function keralaScore(location, company) {
  const hay = `${location} ${company}`.toLowerCase();
  for (const k of KERALA_MARKERS) if (hay.includes(k)) return 30;
  return 0;
}