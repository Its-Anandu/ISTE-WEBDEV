import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function search() {
  const query = `*[
    _id match "unpublishAt*" || 
    _rev match "unpublishAt*" || 
    @ match "unpublishAt*"
  ]`
  const docs = await client.fetch(query)
  console.log(`Found ${docs.length} docs matching "unpublishAt"`)
  for (const doc of docs) {
    console.log(`ID: ${doc._id}, Type: ${doc._type}, Rev: ${doc._rev}`)
  }
}

search().catch(console.error)
