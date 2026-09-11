import { getClient } from '@/lib/sanity/client'
import { eventBySlugQuery, homePageQuery } from '@/app/queries/homeQueries'
import { notFound } from 'next/navigation'
import { urlForImage } from '@/lib/sanity/image'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import HomeAnimations from '@/app/components/HomeAnimations'
import RegistrationForm from './register/RegistrationForm'
import EventCountdown from '@/app/components/EventCountdown'
import GalleryLightbox from '@/app/components/GalleryLightbox'

import { Metadata } from 'next'

// Revalidate this page every 60 seconds
export const revalidate = 60

const SAMPLE_EVENTS_MAP: Record<string, any> = {
  novatos: {
    _id: 'novatos-2026',
    title: "NOVATOS '26",
    slug: 'novatos',
    dateLabel: '19 SEP 2026',
    eventType: 'Flagship Orientation & Innovation Bootcamp',
    status: 'upcoming',
    isCurrentlyHappening: true,
    description: [
      {
        _type: 'block',
        children: [
          {
            _type: 'span',
            text: "NOVATOS '26 is the premier annual flagship orientation, hands-on technical workshop series, and innovation bootcamp hosted by the ISTE Student Chapter at Mar Baselios College of Engineering and Technology (MBCET). Register below to secure your entry and complete payment verification.",
          },
        ],
      },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  let event = null
  try {
    event = await getClient().fetch(eventBySlugQuery, { slug })
  } catch {
    // Sanity unconfigured fallback
  }

  if (!event) {
    event = SAMPLE_EVENTS_MAP[slug]
  }

  if (!event) return {}

  const description = typeof event.description === 'string'
    ? event.description
    : event.description?.[0]?.children?.[0]?.text || `Learn more about ${event.title} at ISTE MBCET.`

  return {
    title: `${event.title} | ISTE MBCET Events`,
    description: description,
  }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let event = null
  try {
    event = await getClient().fetch(eventBySlugQuery, { slug })
  } catch {
    // Sanity unconfigured fallback
  }

  if (!event) {
    event = SAMPLE_EVENTS_MAP[slug]
  }

  if (!event) {
    notFound()
  }

  // Fetch settings for Navbar/Footer
  let sanityData: any = null
  try {
    sanityData = await getClient().fetch(homePageQuery)
  } catch {
    // Fallback
  }
  const settings = sanityData?.settings || {}
  const navCta = settings.navCtaLabel || "Join Now"
  const footerTagline = settings.footerTagline || "Indian Society for Technical Education — Mar Baselios College of Engineering and Technology Student Chapter, Kerala."

  return (
    <>
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

      <main style={{ minHeight: '100dvh', paddingTop: '60px', paddingBottom: '100px' }}>
        <div className="event-hero">
          <Link href="/#events" style={{ display: 'inline-block', marginBottom: '32px', color: 'var(--g400)', textDecoration: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>← BACK TO EVENTS</Link>
          <h1 className="event-hero-title reveal">{event.title}</h1>
          <div className="event-meta reveal d1">
            <span style={{ fontWeight: 600, color: 'var(--c-alt1)' }}>{event.dateLabel}</span>
            {event.eventType && (
              <>
                <span style={{ color: 'var(--g600)' }}>•</span>
                <span>{event.eventType}</span>
              </>
            )}
            <span style={{ color: 'var(--g600)' }}>•</span>
            <span style={{ color: event.isCurrentlyHappening ? '#ef4444' : event.status === 'upcoming' ? '#d6783e' : 'var(--g400)', fontWeight: 600 }}>
              {event.isCurrentlyHappening ? 'HAPPENING NOW' : event.status === 'upcoming' ? 'UPCOMING' : 'PAST EVENT'}
            </span>
          </div>
        </div>

        {event.description && (
          <div className="event-body-content reveal d2" style={{ maxWidth: '800px', margin: '0 auto 40px auto', padding: '0 24px', lineHeight: 1.8, fontSize: '1.05rem', color: 'var(--white)' }}>
            {Array.isArray(event.description) ? (
              <PortableText value={event.description} />
            ) : (
              <p>{event.description}</p>
            )}
          </div>
        )}

        {/* Embedded Registration Form Section */}
        <div className="reveal d3" style={{ maxWidth: '720px', margin: '40px auto 60px auto', padding: '0 16px' }}>
          <RegistrationForm slug={slug} />
        </div>

        {/* Gallery Lightbox if available */}
        {event.gallery && event.gallery.length > 0 && (
          <div className="reveal d4" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
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
