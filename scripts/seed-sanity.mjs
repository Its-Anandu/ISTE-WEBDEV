import { createClient } from '@sanity/client';
import 'dotenv/config';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const FALLBACK_EVENTS = [
  { _type: 'event', title: 'Engineering your own Path', dateLabel: 'MAR 2026', eventType: 'IEEE Collab', status: 'completed', order: 1 },
  { _type: 'event', title: 'Unseen Problem', dateLabel: 'MAR 2026', eventType: 'IEEE Collab', status: 'completed', order: 2 },
  { _type: 'event', title: 'Lumera', dateLabel: 'MAR 2026', eventType: 'IEEE Collab', status: 'completed', order: 3 },
  { _type: 'event', title: 'From dropshipping to building AI', dateLabel: 'MAR 2026', eventType: 'IEEE Collab', status: 'completed', order: 4 },
  { _type: 'event', title: 'SKILL MAAYA- 3 Day Learning Bootcamp', dateLabel: 'MAR 2026', eventType: '3 Day Interactive Online Workshop', status: 'upcoming', order: 5 },
  { _type: 'event', title: "Nexora 26'", dateLabel: 'JAN 2026', eventType: "All Kerala Annual ISTE Student's Convention", status: 'upcoming', order: 6 },
  { _type: 'event', title: 'Through My Younger Eyes Poster Challenge', dateLabel: 'NOV 2025', eventType: 'Competition', status: 'completed', order: 7 },
  { _type: 'event', title: 'Rising Tuskers', dateLabel: 'OCT 2025', eventType: 'A Football based Fun event in collab with Kombans Fanatics', status: 'completed', order: 8 },
  { _type: 'event', title: 'ISTE CONNECT', dateLabel: 'OCT 2025', eventType: 'An Interactive session with new ISTE Members', status: 'completed', order: 9 },
];

const FALLBACK_STATS = [
  { _type: 'stat', label: 'Active Members', value: 300, suffix: '+', order: 1 },
  { _type: 'stat', label: 'Events Conducted', value: 50, suffix: '+', order: 2 },
  { _type: 'stat', label: 'Industry Partners', value: 5, suffix: '+', order: 3 },
  { _type: 'stat', label: 'Member Satisfaction', value: 95, suffix: '%', order: 4 },
];

const FALLBACK_TESTIMONIALS = [
  { _type: 'testimonial', quote: '"Performance is key for us, and joining ISTE was the best decision. Highly recommended for exposure."', authorName: 'Emily Watson', authorRole: '3rd Year CSE', avatarSeed: 'Emily', order: 1 },
  { _type: 'testimonial', quote: '"The aesthetics are top-notch. It gives my college experience a premium look without hiring a designer."', authorName: 'David Park', authorRole: 'Indie Hacker', avatarSeed: 'David', order: 2 },
  { _type: 'testimonial', quote: '"Finally, a community that actually considers accessibility and growth as a first-class citizen. A joy to be in."', authorName: 'Jessica Li', authorRole: 'UX Researcher', avatarSeed: 'Jessica', order: 3 },
  { _type: 'testimonial', quote: '"The peer-to-peer learning environment helped me land my first tech internship. Invaluable network."', authorName: 'Arjun M', authorRole: 'Tech Lead', avatarSeed: 'Arjun', order: 4 },
];

const FALLBACK_EXECOM = [
  { _type: 'execomMember', name: 'Melvin Jacob', initials: 'MJ', role: 'Faculty Advisor', category: 'faculty', order: 1 },
  { _type: 'execomMember', name: 'Dr. Soumya A V', initials: 'S', role: 'Faculty Advisor', category: 'faculty', order: 2 },
  { _type: 'execomMember', name: 'Kiran Biju', initials: 'KB', role: 'Student Mentor', category: 'mentor', order: 3 },
  { _type: 'execomMember', name: 'Krishna Prashanth', initials: 'KP', role: 'Student Mentor', category: 'mentor', order: 4 },
  { _type: 'execomMember', name: 'Aarya Ramesh', initials: 'AR', role: 'Chairperson', category: 'core', order: 5 },
  { _type: 'execomMember', name: 'Snith Shibu', initials: 'SS', role: 'Vice Chairperson', category: 'core', order: 6 },
  { _type: 'execomMember', name: 'Pushkala S S', initials: 'PS', role: 'Secretary', category: 'core', order: 7 },
  { _type: 'execomMember', name: 'Sidharth Sumitra Gireesh', initials: 'SG', role: 'Treasurer', category: 'core', order: 8 },
  
  { _type: 'execomMember', name: 'Jenza Mary Jose', initials: 'EM', role: 'Team Lead', category: 'teamLead', team: 'Event Management Team', subMembers: [{ _type: 'subMember', name: 'Adithyan M S', initials: 'AM' }, { _type: 'subMember', name: 'Dhiya K', initials: 'DK' }, { _type: 'subMember', name: 'Avantika Ajaykumar', initials: 'AA' }, { _type: 'subMember', name: 'Devanandan P Unnithan', initials: 'DU' }, { _type: 'subMember', name: 'Firose Muhammed S', initials: 'FM' }], order: 9 },
  { _type: 'execomMember', name: '[Design Lead]', initials: 'DT', role: 'Team Lead', category: 'teamLead', team: 'Design Team', subMembers: [{ _type: 'subMember', name: 'Devananda S R', initials: 'DS' }, { _type: 'subMember', name: 'Neha Nevin', initials: 'NN' }], order: 10 },
  { _type: 'execomMember', name: 'Neil Philip Koshy', initials: 'ST', role: 'Team Lead', category: 'teamLead', team: 'Sponsorship Team', subMembers: [{ _type: 'subMember', name: 'Abhishek S S', initials: 'AS' }, { _type: 'subMember', name: 'Christopher George', initials: 'CG' }], order: 11 },
  { _type: 'execomMember', name: 'Adhithya Mohan S', initials: 'PR', role: 'Team Lead', category: 'teamLead', team: 'PR and Media Team', subMembers: [{ _type: 'subMember', name: 'Rohin Daniel John', initials: 'RD' }, { _type: 'subMember', name: 'Rogin', initials: 'RG' }, { _type: 'subMember', name: 'Abhishek S', initials: 'AS' }, { _type: 'subMember', name: 'Vishwabala P', initials: 'VP' }], order: 12 },
  { _type: 'execomMember', name: 'Aparna Rajagopal', initials: 'CD', role: 'Team Lead', category: 'teamLead', team: 'Content & Documentation Team', subMembers: [{ _type: 'subMember', name: 'Angelina R Nambiar', initials: 'AN' }, { _type: 'subMember', name: 'Devikrishna A R', initials: 'DA' }, { _type: 'subMember', name: 'Sneha A Oommen', initials: 'SO' }], order: 13 },
  { _type: 'execomMember', name: 'Angel Rose Prince', initials: 'SH', role: 'Team Lead', category: 'teamLead', team: 'SHE Team', subMembers: [{ _type: 'subMember', name: 'Adia Ani', initials: 'AA' }, { _type: 'subMember', name: 'Aishwarya Balakrishnan Menon', initials: 'AB' }, { _type: 'subMember', name: 'Anagha S', initials: 'AS' }], order: 14 },
  
  { _type: 'execomMember', name: 'Govind Warrier', initials: 'GW', role: 'Event Management Team', category: 'junior', order: 15 },
  { _type: 'execomMember', name: 'S. Abarna Prasad', initials: 'AP', role: 'Event Management Team', category: 'junior', order: 16 },
  { _type: 'execomMember', name: 'R. Vishakh', initials: 'RV', role: 'Design Team', category: 'junior', order: 17 },
  { _type: 'execomMember', name: 'Charu B. Eshwar', initials: 'CB', role: 'Design Team', category: 'junior', order: 18 },
  { _type: 'execomMember', name: 'Gopika J.R.', initials: 'GJ', role: 'PR & Media Team', category: 'junior', order: 19 },
  { _type: 'execomMember', name: 'Eshan M.S.', initials: 'EM', role: 'PR & Media Team', category: 'junior', order: 20 },
  { _type: 'execomMember', name: 'R. Hari Krishnan', initials: 'RH', role: 'PR & Media Team', category: 'junior', order: 21 },
  { _type: 'execomMember', name: 'Sona Biju', initials: 'SB', role: 'PR & Media Team', category: 'junior', order: 22 },
  { _type: 'execomMember', name: 'Gourilekshmi Prashanth', initials: 'GP', role: 'PR & Media Team', category: 'junior', order: 23 },
  { _type: 'execomMember', name: 'Ashiya Noufal', initials: 'AN', role: 'SHE Team', category: 'junior', order: 24 },
  { _type: 'execomMember', name: 'Sreya Krishna', initials: 'SK', role: 'SHE Team', category: 'junior', order: 25 },
  { _type: 'execomMember', name: 'Ganga A.B.', initials: 'GA', role: 'Content & Documentation', category: 'junior', order: 26 },
];

const SITE_SETTINGS = {
  _type: 'siteSettings',
  _id: 'siteSettings', // explicitly set ID for singletons
  heroHeadline: 'Innovation \\n Through Collaboration',
  heroDescription: 'The official student chapter of the Indian Society for Technical Education at Mar Baselios College of Engineering and Technology — where engineers build the future, faster.',
  heroSubtitle: 'Innovation · Technology · Excellence',
  heroTypedText: "ISTE MBCET STUDENT'S CHAPTER",
  heroPrimaryCtaLabel: 'Become a Member',
  heroSecondaryCtaLabel: 'Explore Events',
  tickerItems: [
    'Indian Society for Technical Education',
    'KE065',
    'Mar Baselios College of Engineering and Technology',
    'Innovate.',
    'Engineer.',
    'Inspire.'
  ],
  aboutTitle: 'Shaping <em>Engineers</em><br />of Tomorrow',
  aboutBody: [
    {
      _type: 'block',
      children: [
        {
          _type: 'span',
          text: 'ISTE — the Indian Society for Technical Education — is India\'s premier national teachers association working to enhance the quality of technical education. The MBCET Student Chapter brings this vision to life at Mar Baselios College of Engineering and Technology, Nalanchira, Thiruvananthapuram.'
        }
      ]
    },
    {
      _type: 'block',
      children: [
        {
          _type: 'span',
          text: 'Founded with a mission to bridge the gap between academic knowledge and industry demands, our chapter equips students with the skills, networks, and opportunities that transcend the classroom — cultivating a generation of technically excellent and professionally ready engineers.'
        }
      ]
    }
  ],
  membershipPerks: [
    'Official ISTE membership card — valid nationally',
    'Priority access to all chapter events and workshops',
    'ISTE journals, research publications & digital resources',
    'Exclusive internship & placement referral network',
    'Certificates of participation for every ISTE event'
  ],
  membershipEnabled: true,
  membershipClosedMessage: 'Membership applications are currently closed. Please check back later.',
  navCtaLabel: 'Join Now',
  footerTagline: 'Indian Society for Technical Education — Mar Baselios College of Engineering and Technology Student Chapter, Kerala.',
  chapterCode: 'KE065',
  chapterLocation: 'MBCET · Kerala',
};

async function seed() {
  console.log('Seeding Sanity dataset...');
  try {
    // 1. Create Site Settings
    console.log('Creating Site Settings...');
    await client.createOrReplace(SITE_SETTINGS);

    // 2. Create Events
    console.log('Creating Events...');
    for (const event of FALLBACK_EVENTS) {
      // Need a slug for events
      const slug = { _type: 'slug', current: event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') };
      await client.create({ ...event, slug });
    }

    // 3. Create Stats
    console.log('Creating Stats...');
    for (const stat of FALLBACK_STATS) {
      await client.create(stat);
    }

    // 4. Create Testimonials
    console.log('Creating Testimonials...');
    for (const testimonial of FALLBACK_TESTIMONIALS) {
      await client.create(testimonial);
    }

    // 5. Create ExeCom
    console.log('Creating ExeCom Members...');
    for (const member of FALLBACK_EXECOM) {
      await client.create(member);
    }

    console.log('Successfully seeded all data to Sanity!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

seed();
