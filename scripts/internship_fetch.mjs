/**
 * ISTE MBCET — serverless-safe HTTP helpers.
 * All fetches: bounded timeout, browser-ish UA, redirects followed,
 * AbortController-driven. No third-party deps.
 */

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function httpGet(url, timeoutMs = 8000, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': DEFAULT_UA,
        'Accept': 'text/html,application/json,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        ...headers,
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch a page as text. Throws on transport error or non-2xx (unless opt). */
export async function fetchText(url, tolerant = false, timeoutMs = 8000) {
  const res = await httpGet(url, timeoutMs);
  if (!res.ok && !tolerant) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

/** Fetch JSON (e.g. Greenhouse/Lever APIs). Throws on failure. */
export async function fetchJson(url, timeoutMs = 8000) {
  const res = await httpGet(url, timeoutMs, { Accept: 'application/json' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/** Verify a job/internship application link is alive. Returns {status, verdict}. */
export async function verifyLink(url, timeoutMs = 8000) {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { status: 0, verdict: 'rejected' };
  }
  try {
    const res = await httpGet(url, timeoutMs);
    if (res.ok) return { status: res.status, verdict: 'verified' };
    // 3xx after redirects are normalized to final 2xx above.
    // Exists-but-blocks-bots (403/405/429) are still live listings.
    if ([403, 405, 429].includes(res.status)) {
      return { status: res.status, verdict: 'verified' };
    }
    // 404/410/5xx-other = dead or broken.
    return { status: res.status, verdict: 'rejected' };
  } catch (e) {
    // DNS / timeout / TLS = transient or unreachable -> unverified (not dead).
    return { status: 0, verdict: 'unverified' };
  }
}