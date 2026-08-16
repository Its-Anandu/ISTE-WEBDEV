import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function checkAll() {
  const docs = await client.fetch('*')
  console.log(`Checking ${docs.length} documents...`)
  let found = false
  for (const doc of docs) {
    if (doc._id.includes(':') || (doc._rev && doc._rev.includes(':'))) {
      console.log(`BROKEN DOC found! ID: ${doc._id}, Rev: ${doc._rev}`)
      found = true
    }
    // Also check for any field that might be causing this
    for (const key in doc) {
      if (typeof doc[key] === 'string' && doc[key].includes('unpublishAt')) {
        console.log(`Potential field found in doc ${doc._id}: ${key} = ${doc[key]}`)
      }
    }
  }
  if (!found) console.log('No broken IDs or Revs found in current documents.')
}

checkAll().catch(console.error)
