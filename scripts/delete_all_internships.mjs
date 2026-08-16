import { createClient } from 'next-sanity';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function clearAllInternships() {
  console.log('Fetching all internships...');
  const internships = await client.fetch('*[_type == "internship"]');
  console.log(`Found ${internships.length} internships to delete.`);

  for (const intern of internships) {
    try {
      await client.delete(intern._id);
      console.log(`Deleted: ${intern.role} at ${intern.company}`);
    } catch (err) {
      console.error(`Failed to delete ${intern._id}:`, err);
    }
  }
  console.log('Cleanup complete!');
}

clearAllInternships().catch(console.error);
