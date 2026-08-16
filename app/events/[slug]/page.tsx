import { getClient } from '@/lib/sanity/client'
import { eventBySlugQuery, homePageQuery } from '@/app/queries/homeQueries'
import { notFound } from 'next/navigation'
import { urlForImage } from '@/lib/sanity/image'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import HomeAnimations from '@/app/components/HomeAnimations'
import dynamic from 'next/dynamic'
const EventCountdown = dynamic(() => import('@/app/components/EventCountdown'), { ssr: false })
const GalleryLightbox = dynamic(() => import('@/app/components/GalleryLightbox'), { ssr: false })

import { Metadata } from 'next'

// Revalidate this page every 60 seconds
export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params
  const event = await getClient().fetch(eventBySlugQuery, { slug })

  if (!event) return {}

  const description = event.description?.[0]?.children?.[0]?.text || `Learn more about ${event.title} at ISTE MBCET.`

  return {
    title: event.title,
    description: description,
    openGraph: {
      title: event.title,
      description: description,
      type: 'article',
      images: event.gallery?.[0] ? [urlForImage(event.gallery[0]).width(1200).height(630).url()] : ['/iste.png'],
    },
  }
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const { slug } = await params
  const event = await getClient().fetch(eventBySlugQuery, { slug })
  
  if (!event) {
    notFound()
  }

  // Structured Data (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date,
    description: event.description?.[0]?.children?.[0]?.text || '',
    eventStatus: event.status === 'upcoming' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventPostponed',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'Mar Baselios College of Engineering and Technology',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Nalanchira',
        addressLocality: 'Thiruvananthapuram',
        addressRegion: 'Kerala',
        postalCode: '695015',
        addressCountry: 'IN',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'ISTE MBCET Student\'s Chapter',
      url: 'https://iste-mbcet.vercel.app',
    },
  }

  // Fetch settings for Navbar/Footer
  const sanityData = await getClient().fetch(homePageQuery)
  const settings = sanityData?.settings || {}
  const navCta = settings.navCtaLabel || "Join Now"
  const footerTagline = settings.footerTagline || "Indian Society for Technical Education — Mar Baselios College of Engineering and Technology Student Chapter, Kerala."

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeAnimations heroTypedText="ISTE MBCET EVENTS" />



      {/* Grid Background */}
      <div className="grid-lines" style={{ position: 'fixed', zIndex: -1 }}>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
      </div>

      <nav id="navbar">
        <Link href="/" className="nav-logo">
          ISTE SC <span>MBCET</span>
        </Link>
        <ul className="nav-links">
          <li><Link href="/#about">About</Link></li>
          <li><Link href="/#events">Events</Link></li>
          <li><Link href="/internships" className="nav-link-highlight">Launchpad ✦</Link></li>
        </ul>
        <Link href="/#membership" className="nav-cta">{navCta}</Link>
        <div className="nav-hamburger" id="hamburger">
          <span></span><span></span><span></span>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className="mob-menu" id="mob-menu">
        <div className="mob-menu-inner">
          <button className="mob-close" id="mob-close" aria-label="Close menu">✕</button>
          <nav className="mob-nav">
            <Link href="/#about" className="mob-link">About</Link>
            <Link href="/#events" className="mob-link">Events</Link>
            <Link href="/internships" className="mob-link mob-link--accent">Internship Launchpad ✦</Link>
          </nav>
          <Link href="/#membership" className="mob-cta">{navCta} →</Link>
        </div>
      </div>

      <main style={{ minHeight: '100dvh', paddingTop: '60px' }}>
        <div className="event-hero">
          <Link href="/#events" style={{ display: 'inline-block', marginBottom: '32px', color: 'var(--g400)', textDecoration: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>← BACK TO EVENTS</Link>
          <h1 className="event-hero-title reveal">{event.title}</h1>
          <div className="event-meta reveal d1">
            <span>{event.dateLabel}</span>
            {event.eventType && (
              <>
                <span style={{ color: 'var(--g600)' }}>•</span>
                <span>{event.eventType}</span>
              </>
            )}
            <span style={{ color: 'var(--g600)' }}>•</span>
            <span style={{ color: event.status === 'upcoming' ? '#d6783e' : 'var(--g400)' }}>{event.status === 'upcoming' ? 'UPCOMING' : 'PAST EVENT'}</span>
          </div>
          {event.status === 'upcoming' && event.registrationLink && (
            <div className="reveal d2" style={{ marginTop: '32px' }}>
              <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className="hero-btn-primary" style={{ display: 'inline-flex' }}>
                Register Now
                <span className="hero-btn-arrow">→</span>
              </a>
            </div>
          )}
        </div>

        {event.description && (
          <div className="event-body-content reveal d2">
            <PortableText value={event.description} />
          </div>
        )}

        {/* Countdown Timer — shown for upcoming events with a date */}
        {event.status === 'upcoming' && event.date && (
          <div className="reveal d2">
            <EventCountdown targetDate={event.date} eventTitle={event.title} />
          </div>
        )}

        {/* Interactive Gallery Lightbox */}
        {event.gallery && event.gallery.length > 0 && (
          <div className="reveal d3">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b', marginBottom: '16px' }}>
              Gallery — {event.gallery.length} Photo{event.gallery.length !== 1 ? 's' : ''}
            </div>
            <GalleryLightbox
              images={event.gallery.map((img: any, i: number) => ({
                url: urlForImage(img).width(1200).height(900).url(),
                alt: `${event.title} — photo ${i + 1}`,
              }))}
            />
          </div>
        )}

        {event.status === 'past' && event.fullReport && (
          <div className="event-body-content reveal d4" style={{ marginTop: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '32px', color: 'var(--white)', borderTop: '1px solid var(--border)', paddingTop: '60px' }}>Full Event Report</h2>
            <PortableText value={event.fullReport} />
          </div>
        )}
      </main>

      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-logo"><Image src="/iste.png" alt="ISTE SC MBCET" width={80} height={80} className="footer-logo-img" /></div>
            <div className="footer-tagline">{footerTagline}</div>
            {settings.chapterCode && <div className="footer-chip">Chapter Code: {settings.chapterCode}</div>}
          </div>
          <div>
            <div className="footer-col-title">Navigate</div>
            <ul className="footer-links">
              <li><Link href="/#about">About</Link></li>
              <li><Link href="/#events">Events</Link></li>
              <li><Link href="/internships">Internship Launchpad</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 ISTE MBCET Student's Chapter</div>
        </div>
      </footer>
    </>
  )
}
