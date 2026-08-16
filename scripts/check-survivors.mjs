import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function check() {
  const assets = await client.fetch('*[_type == "sanity.imageAsset"]')
  console.log(`Image Assets found: ${assets.length}`)
  
  const drafts = await client.fetch('*[_id in path("drafts.**")]')
  console.log(`Drafts found: ${drafts.length}`)
  for (const draft of drafts) {
    console.log(`\n--- Draft ID: ${draft._id} ---`)
    console.log(JSON.stringify(draft, null, 2))
  }
}

check().catch(console.error)
