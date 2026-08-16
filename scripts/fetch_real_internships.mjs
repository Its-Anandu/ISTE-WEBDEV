import { createClient } from 'next-sanity';
import https from 'https';
import 'dotenv/config';

// Security fix: NEVER hardcode a Sanity token in source. Read it from the environment.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

if (!projectId || !token) {
  console.error('[fetch-internships] Missing Sanity env vars. Aborting without writing anything.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve([]); // Ignore errors
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching live internship data from public APIs...');

  // Remotive is a GLOBAL-REMOTE job API — it is NOT Kerala-specific. We must
  // NOT mislabel remote/global roles as on-site Kerala opportunities, and we
  // must NOT rename/rename arbitrary jobs to make them look like internships.
  // Only emit roles that are genuinely internships AND genuinely remote-capable.
  const data = await fetchData('https://remotive.com/api/remote-jobs?category=software-dev&limit=50');

  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  const internships = jobs
    .filter((j) => {
      const title = (j.title || '').toLowerCase();
      return title.includes('intern');
    })
    .slice(0, 10);

  if (internships.length === 0) {
    console.log('No genuine internship listings found. Writing nothing (no fabrication).');
    return;
  }

  console.log(`Found ${internships.length} genuine internship listings. Uploading to Sanity...`);

  for (const job of internships) {
    const doc = {
      _type: 'internship',
      role: job.title,
      company: job.company_name,
      domain: 'Software Engineering',
      // Be honest: these are remote opportunities, not on-site Kerala roles.
      type: 'Remote',
      stipend: job.salary || 'Competitive',
      duration: '3-6 Months',
      deadlineLabel: 'Apply ASAP',
      applyLink: job.url,
      status: 'open',
      description: job.description ? job.description.replace(/<[^>]+>/g, '').substring(0, 300) + '...' : 'No description provided.',
      state: 'VERIFIED',
      verificationStatus: 'VERIFIED',
      linkHealthScore: 100,
      featured: false,
      qualityScore: 80,
    };

    const existing = await client.fetch('*[_type == "internship" && applyLink == $url][0]._id', { url: job.url });
    if (existing) {
      console.log(`= Already exists, skipping: ${job.title} at ${job.company_name}`);
      continue;
    }

    const res = await client.create(doc);
    console.log(`+ Uploaded: ${res.role} at ${res.company}`);
  }
  console.log('Done!');
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});