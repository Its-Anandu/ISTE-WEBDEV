import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service for ISTE MBCET — rules governing use of the website and membership platform.',
  robots: { index: true, follow: true },
};

export default function TermsPage() {
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
      <article style={{ maxWidth: '720px', margin: '0 auto', lineHeight: '1.8' }}>
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
            Terms of Service
          </h1>
          <p style={{ color: 'rgba(58,52,44,0.55)', fontSize: '0.875rem' }}>
            Last updated: {updated}
          </p>
        </header>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the ISTE MBCET website (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service. These Terms apply to all visitors, members, and others who access or use the Service.
          </p>
        </Section>

        <Section title="2. Who We Are">
          <p>
            ISTE MBCET is the student chapter of the Indian Society for Technical Education at Mar Baselios College of Engineering and Technology, Trivandrum, Kerala, India. The Service is operated for educational and community purposes.
          </p>
        </Section>

        <Section title="3. Use of the Service">
          <p>You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of others. You must not:</p>
          <ul>
            <li>Provide false or misleading information during registration.</li>
            <li>Attempt to gain unauthorised access to any part of the Service.</li>
            <li>Use the Service to distribute spam, malware, or any harmful content.</li>
            <li>Reverse-engineer, scrape, or copy any part of the Service without written permission.</li>
            <li>Impersonate any ISTE MBCET officer, administrator, or other member.</li>
          </ul>
        </Section>

        <Section title="4. Accounts & Membership">
          <p>
            To access certain features (event registration, dashboard, AI tools), you must create an account using Google OAuth. You are responsible for maintaining the security of your account. Membership is subject to approval by the ISTE MBCET executive committee. We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>
            All content on the Service — including logos, designs, text, graphics, and code — is the property of ISTE MBCET or its content providers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written consent.
          </p>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            Our Service integrates third-party tools including Google (OAuth), Sanity (CMS), Supabase (database), Vercel (hosting), Resend (email), and Sentry (error tracking). Use of these services is subject to their respective terms and privacy policies. We are not responsible for the practices of these third parties.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>
            The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. ISTE MBCET does not guarantee that the Service will be uninterrupted, error-free, or completely secure.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, ISTE MBCET, its officers, and members shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
          </p>
        </Section>

        <Section title="9. Events & Registrations">
          <p>
            Event registrations are subject to availability. ISTE MBCET reserves the right to cancel or modify events. We will endeavour to provide adequate notice of any changes. Attendance at events is at your own risk.
          </p>
        </Section>

        <Section title="10. Privacy">
          <p>
            Your use of the Service is also governed by our{' '}
            <a href="/privacy" style={{ color: '#c66a3c' }}>
              Privacy Policy
            </a>
            , which is incorporated into these Terms by reference.
          </p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of significant changes by updating the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Trivandrum, Kerala.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            If you have questions about these Terms, contact us at{' '}
            <a href="mailto:iste@mbcet.ac.in" style={{ color: '#c66a3c' }}>
              iste@mbcet.ac.in
            </a>.
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
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1c1915', marginBottom: '0.75rem' }}>
        {title}
      </h2>
      <div style={{ color: 'rgba(58,52,44,0.75)', fontSize: '0.9375rem' }}>{children}</div>
    </section>
  );
}
