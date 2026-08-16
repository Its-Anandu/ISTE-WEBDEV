import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the Privacy Policy for ISTE MBCET — how we collect, use, and protect your personal data.',
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const updated = 'June 18, 2026';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f6f2ea',
        color: '#3a342c',
        fontFamily: 'var(--font-sans, sans-serif)',
        padding: '7rem 1.5rem 5rem',
      }}
    >
      <article
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          lineHeight: '1.8',
        }}
      >
        <header style={{ marginBottom: '3rem' }}>
          <p style={{ color: '#c66a3c', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Legal
          </p>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              margin: '0 0 1rem',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #1c1915 40%, #6f685c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Privacy Policy
          </h1>
          <p style={{ color: 'rgba(58,52,44,0.55)', fontSize: '0.875rem' }}>
            Last updated: {updated}
          </p>
        </header>

        <Section title="1. Who We Are">
          <p>
            ISTE MBCET (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is the official student chapter of the Indian Society for Technical Education at Mar Baselios College of Engineering and Technology, Trivandrum, Kerala, India. Our website is available at{' '}
            <a href="https://iste-mbcet.vercel.app" style={{ color: '#c66a3c' }}>
              https://iste-mbcet.vercel.app
            </a>.
          </p>
        </Section>

        <Section title="2. What Data We Collect">
          <ul>
            <li><strong>Account Data:</strong> Name, email address, department, year of study, and phone number when you register or log in via Google OAuth.</li>
            <li><strong>Event Registration:</strong> Records of events you have registered for.</li>
            <li><strong>Usage Data:</strong> Anonymised page-view analytics, performance metrics, and error reports collected through Vercel Analytics and Sentry.</li>
            <li><strong>Session Data:</strong> Secure session tokens stored in your browser to keep you signed in.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul>
            <li>To authenticate your account and provide access to member-only features.</li>
            <li>To process event registrations and send relevant notifications.</li>
            <li>To review membership applications and assign appropriate roles.</li>
            <li>To improve site performance, debug errors, and enhance user experience.</li>
            <li>To send transactional emails (e.g., membership confirmation, event reminders).</li>
          </ul>
        </Section>

        <Section title="4. Legal Basis for Processing (GDPR)">
          <p>
            Where applicable, we process your data under the following legal bases:
          </p>
          <ul>
            <li><strong>Consent</strong> — when you register an account or accept cookie usage.</li>
            <li><strong>Legitimate Interests</strong> — to operate, secure, and improve the website.</li>
            <li><strong>Contractual Necessity</strong> — to fulfil membership and event registration obligations.</li>
          </ul>
        </Section>

        <Section title="5. Cookies">
          <p>
            We use strictly necessary cookies for authentication sessions. If you accept optional cookies, we also use analytics cookies to understand how visitors interact with our site. You can change your preference at any time via the cookie banner.
          </p>
        </Section>

        <Section title="6. Data Sharing">
          <p>
            We do <strong>not</strong> sell your personal data. We share data only with:
          </p>
          <ul>
            <li><strong>Supabase / PostgreSQL</strong> — our database provider for secure data storage.</li>
            <li><strong>Sanity.io</strong> — our content management system for editorial content.</li>
            <li><strong>Vercel</strong> — our hosting provider, including anonymised analytics.</li>
            <li><strong>Sentry</strong> — error tracking (no PII is included in error reports).</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
            <li><strong>Google</strong> — OAuth sign-in provider.</li>
          </ul>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain your personal data for as long as your account is active. If you request deletion, we will remove your data within 30 days, except where we are required to retain it by law.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your account and data.</li>
            <li>Object to or restrict certain processing.</li>
            <li>Data portability (receive your data in a structured format).</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at{' '}
            <a href="mailto:iste@mbcet.ac.in" style={{ color: '#c66a3c' }}>
              iste@mbcet.ac.in
            </a>.
          </p>
        </Section>

        <Section title="9. Security">
          <p>
            We implement industry-standard security measures including HTTPS encryption, secure HTTP headers (Content-Security-Policy, HSTS, X-Frame-Options), OAuth 2.0 authentication, and role-based access controls to protect your data.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy from time to time. We will notify you of significant changes by updating the &quot;Last updated&quot; date above and, where appropriate, by email.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            For questions or concerns about this Privacy Policy, contact us at:{' '}
            <a href="mailto:iste@mbcet.ac.in" style={{ color: '#c66a3c' }}>
              iste@mbcet.ac.in
            </a>
          </p>
          <address style={{ fontStyle: 'normal', marginTop: '0.5rem', color: 'rgba(58,52,44,0.6)' }}>
            ISTE Student Chapter<br />
            Mar Baselios College of Engineering and Technology<br />
            Nalanchira, Trivandrum — 695015<br />
            Kerala, India
          </address>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          color: '#1c1915',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </h2>
      <div style={{ color: 'rgba(58,52,44,0.75)', fontSize: '0.9375rem' }}>{children}</div>
    </section>
  );
}
