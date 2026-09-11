export interface EventItem {
  _id: string;
  title: string;
  slug: string;
  dateLabel: string;
  eventType: string;
  description: string;
  isCurrentlyHappening: boolean;
  status: string;
  feeINR: number;
}

export const SAMPLE_EVENTS: EventItem[] = [
  {
    _id: 'novatos-2026',
    title: "NOVATOS '26",
    slug: 'novatos',
    dateLabel: 'SEP 2026',
    eventType: 'Flagship Orientation & Innovation Bootcamp',
    description: 'The premier annual flagship orientation, hands-on workshop series, and hackathon challenge for ISTE Student Chapter MBCET.',
    isCurrentlyHappening: true,
    status: 'open',
    feeINR: 100,
  },
  {
    _id: 'nexora-2026',
    title: "NEXORA '26",
    slug: 'nexora-26',
    dateLabel: 'OCT 2026',
    eventType: "All Kerala Annual ISTE Student's Convention",
    description: 'State-level technical symposium, project exhibition, and expert keynotes hosted at MBCET.',
    isCurrentlyHappening: false,
    status: 'upcoming',
    feeINR: 150,
  },
  {
    _id: 'skill-maaya-2026',
    title: 'SKILL MAAYA 3.0',
    slug: 'skill-maaya',
    dateLabel: 'NOV 2026',
    eventType: '3-Day Interactive Hands-on Bootcamp',
    description: 'Intensive hands-on technical workshop covering Full-Stack Web Development, AI Integration, and Cloud Deployments.',
    isCurrentlyHappening: false,
    status: 'upcoming',
    feeINR: 200,
  },
];
