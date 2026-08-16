import { draftMode } from 'next/headers'
import { getClient } from '@/lib/sanity/client'
import Image from 'next/image'
import Link from 'next/link'
import { urlForImage } from '@/lib/sanity/image'
import { homePageQuery } from '@/app/queries/homeQueries'
import HomeAnimations from '@/app/components/HomeAnimations'
import TeamCard from '@/app/components/TeamCard'
import dynamic from 'next/dynamic'
const MembershipForm = dynamic(() => import('@/app/components/MembershipForm'))
import { PortableText } from '@portabletext/react'
import { faqsQuery } from '@/app/queries/homeQueries'
import AliveClock from '@/app/components/AliveClock'
const NucleusCore = dynamic(() => import('@/app/components/NucleusCore'))
import {
  Zap,
  Trophy,
  Globe,
  FileText,
  GraduationCap,
  Users,
  Lightbulb,
  Rocket,
  Briefcase
} from 'lucide-react'
import ExecomAvatar from '@/app/components/ExecomAvatar'
import ExecomFlipCard from '@/app/components/ExecomFlipCard'


// Fallback data when Sanity has no content yet
const FALLBACK_EVENTS = [
  { _id: '1', dateLabel: 'MAR 2026', title: 'Engineering your own Path', eventType: 'IEEE Collab', link: null },
  { _id: '2', dateLabel: 'MAR 2026', title: 'Unseen Problem', eventType: 'IEEE Collab', link: null },
  { _id: '3', dateLabel: 'MAR 2026', title: 'Lumera', eventType: 'IEEE Collab', link: null },
  { _id: '4', dateLabel: 'MAR 2026', title: 'From dropshipping to building AI', eventType: 'IEEE Collab', link: null },
  { _id: '5', dateLabel: 'MAR 2026', title: 'SKILL MAAYA- 3 Day Learning Bootcamp', eventType: '3 Day Interactive Online Workshop', link: null },
  { _id: '6', dateLabel: 'JAN 2026', title: "Nexora 26'", eventType: "All Kerala Annual ISTE Student's Convention", link: null },
  { _id: '7', dateLabel: 'NOV 2025', title: 'Through My Younger Eyes Poster Challenge', eventType: 'Competition', link: null },
  { _id: '8', dateLabel: 'OCT 2025', title: 'Rising Tuskers', eventType: 'A Football based Fun event in collab with Kombans Fanatics', link: null },
  { _id: '9', dateLabel: 'OCT 2025', title: 'ISTE CONNECT', eventType: 'An Interactive session with new ISTE Members', link: null },

]

const FALLBACK_STATS = [
  { _id: 's1', label: 'Active Members', value: 300, suffix: '+' },
  { _id: 's2', label: 'Events Conducted', value: 50, suffix: '+' },
  { _id: 's3', label: 'Industry Partners', value: 5, suffix: '+' },
  { _id: 's4', label: 'Member Satisfaction', value: 95, suffix: '%' },
]



const DELAY_CLASSES = ['', 'd1', 'd2', 'd3', 'd1', 'd2', 'd3', 'd4', '', 'd1', 'd2', 'd3']

export default async function Home() {
  const { isEnabled: preview } = await draftMode()

  let sanityData: any = null
  try {
    sanityData = await getClient(preview).fetch(homePageQuery, {}, { next: { revalidate: 60 } })
  } catch {
    // Sanity unreachable — fall through to hardcoded data
  }

  const events = sanityData?.events?.length ? sanityData.events : FALLBACK_EVENTS
  const rawStats = sanityData?.stats?.length ? sanityData.stats : FALLBACK_STATS
  const stats = rawStats.filter((stat: any, index: number, self: any[]) =>
    index === self.findIndex((t: any) => t.label === stat.label)
  )
  const settings = sanityData?.settings || {}
  const featuredInternships: any[] = sanityData?.featuredInternships || []
  const pillars: any[] = sanityData?.pillars || []
  const benefits: any[] = sanityData?.benefits || []
  const homePage = sanityData?.homePage || { sections: [] }
  const navigationMenu = sanityData?.navigationMenu || {}

  const heroTypedText = settings.heroTypedText || "ISTE MBCET STUDENT'S CHAPTER"
  const heroDescription = settings.heroDescription || "The official student chapter of the Indian Society for Technical Education at Mar Baselios College of Engineering and Technology — where engineers build the future, faster."
  const heroPrimaryCta = settings.heroPrimaryCtaLabel || "Become a Member"
  const heroSecondaryCta = settings.heroSecondaryCtaLabel || "Explore Events"
  const navCta = settings.navCtaLabel || "Join Now"
  const footerTagline = settings.footerTagline || "Indian Society for Technical Education — Mar Baselios College of Engineering and Technology Student Chapter, Kerala."
  const membershipEnabled = settings.membershipEnabled !== false // defaults to true
  const membershipClosedMessage = settings.membershipClosedMessage || "Membership applications are currently closed. Please check back later."

  // Default ticker array if not provided in Sanity
  const tickerItems = settings.tickerItems?.length ? settings.tickerItems : [
    'Indian Society for Technical Education',
    'Mar Baselios College of Engineering and Technology',
    'Innovate.',
    'Engineer.',
    'Inspire.'
  ]

  // Default perks if not provided in Sanity
  const membershipPerks = settings.membershipPerks?.length ? settings.membershipPerks : [
    'Official ISTE membership card — valid nationally',
    'Priority access to all chapter events and workshops',
    'ISTE journals, research publications & digital resources',
    'Exclusive internship & placement referral network',
    'Certificates of participation for every ISTE event'
  ]

  // Build execom lists from Sanity (No fallback data per user request)
  const members = sanityData?.execomMembers || []
  const faculty = members.filter((m: any) => m.category === 'faculty')
  const mentors = members.filter((m: any) => m.category === 'mentor')
  const core = members.filter((m: any) => m.category === 'core')
  
  const teamCategories = [
    { id: 'pr_media', name: 'PR and Media Team' },
    { id: 'design', name: 'Design Team' },
    { id: 'content_doc', name: 'Content and Documentation Team' },
    { id: 'event_management', name: 'Event Management Team' },
    { id: 'she', name: 'SHE Team' },
    { id: 'internship_launchpad', name: 'Internship Launchpad Team' },
  ]

  const teams = teamCategories.map(tc => {
    const head = members.find((m: any) => m.category === tc.id)
    if (!head) return null
    return {
      _id: head._id,
      initials: head.initials,
      name: head.name,
      team: tc.name,
      subMembers: head.subMembers || [],
      photo: head.photo,
    }
  }).filter(Boolean)

  const junior = members.filter((m: any) => m.category === 'junior')

  // Fetch active events from the dedicated schema
  const activeEvents = sanityData?.activeEvents || []
  const getBenefitIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Zap: <Zap size={24} strokeWidth={1.5} />,
      Trophy: <Trophy size={24} strokeWidth={1.5} />,
      Globe: <Globe size={24} strokeWidth={1.5} />,
      FileText: <FileText size={24} strokeWidth={1.5} />,
      GraduationCap: <GraduationCap size={24} strokeWidth={1.5} />,
      Users: <Users size={24} strokeWidth={1.5} />,
      Lightbulb: <Lightbulb size={24} strokeWidth={1.5} />,
      Rocket: <Rocket size={24} strokeWidth={1.5} />,
      Briefcase: <Briefcase size={24} strokeWidth={1.5} />,
    }
    return icons[iconName] || <Zap size={24} strokeWidth={1.5} />
  }



  
  const renderActiveEvents = () => {
    return (
      <section id="active-events" style={{ borderBottom: '1px solid var(--border)', paddingTop: 40, paddingBottom: 60 }}>
        <div className="section-inner">
          <div className="section-tag reveal">{settings.activeEventsTag || 'Live Now'}</div>
          <h2 className="section-title reveal d1" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }} dangerouslySetInnerHTML={{ __html: settings.activeEventsTitle || 'Active <em>Events</em>' }}></h2>
          
          <div className="active-events-container reveal d2" style={{ marginTop: 32 }}>
            {activeEvents.length > 0 ? (
              <div className="events-list">
                {activeEvents.map((ev: any) => (
                  <Link href={ev.link ? ev.link : (ev.slug ? `/events/${ev.slug}` : '#')} key={ev._id} className={`event-row ${ev.isCurrentlyHappening ? 'live-event' : ''}`} style={{ padding: '24px 0' }}>
                    <div className="event-date" style={{ color: ev.isCurrentlyHappening ? '#ef4444' : 'var(--c-main)' }}>
                      {ev.isCurrentlyHappening && <span className="live-heartbeat"></span>}
                      {ev.dateLabel}
                    </div>
                    <div className="event-info-main">
                      <div className="event-title">
                        {ev.title}
                        {ev.isCurrentlyHappening && <span style={{ marginLeft: 12, fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)' }}>HAPPENING NOW</span>}
                      </div>
                      {ev.eventType && <div className="event-type">{ev.eventType}</div>}
                    </div>
                    <div className="event-arrow">→</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-active-events-card" style={{
                position: 'relative',
                padding: '64px 32px',
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.04) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5)',
              }}>
                {/* Breathing Background Glow */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: '150px', height: '150px',
                  background: 'radial-gradient(circle, rgba(var(--c-main), 0.2) 0%, transparent 70%)',
                  borderRadius: '50%', opacity: 0.15, animation: 'pulseOpacity 4s ease-in-out infinite',
                  zIndex: 0, pointerEvents: 'none'
                }}></div>
                
                <div className="no-events-icon" style={{ 
                  position: 'relative', zIndex: 1,
                  fontSize: '2rem', color: 'var(--white)',
                  textShadow: '0 0 20px rgba(var(--c-main), 0.8)',
                  animation: 'float 6s ease-in-out infinite'
                }}>✦</div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ 
                    fontFamily: 'var(--font-serif)', fontSize: '1.75rem', color: 'var(--white)',
                    letterSpacing: '0.02em', marginBottom: '8px'
                  }}>{settings.noActiveEventsTitle || 'The silence before the storm.'}</h3>
                  <p style={{ 
                    color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', maxWidth: '420px', 
                    margin: '0 auto', lineHeight: 1.6, letterSpacing: '0.01em' 
                  }}>
                    {settings.noActiveEventsBody || 'Our team is currently architecting the next generation of technical experiences. The grid is quiet, but something big is coming.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderAbout = () => {
    return (
      <section id="about" style={{ position: 'relative', overflow: 'hidden', padding: '120px 0' }}>
        {/* Cinematic Scrollytelling Background Glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '800px', height: '800px',
          background: 'radial-gradient(circle, rgba(var(--c-main), 0.08) 0%, transparent 60%)',
          zIndex: 0, pointerEvents: 'none'
        }}></div>

        <div className="section-inner about-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <div className="section-tag reveal">{settings.aboutTag || 'About Us'}</div>
            <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.aboutTitle || 'Shaping <em>Engineers</em><br />of Tomorrow' }}></h2>

            <div className="scrollytelling-container" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {settings.aboutBody?.length ? (
                <div className="section-body-wrapper cinematic-text">
                  <PortableText value={settings.aboutBody} />
                </div>
              ) : (
                <>
                  <p className="cinematic-text" style={{ fontSize: '1.25rem', lineHeight: 1.8, color: 'var(--g100)' }}>
                    ISTE — the Indian Society for Technical Education — is India&apos;s premier national teachers association working
                    to enhance the quality of technical education. The MBCET Student Chapter brings this vision to life at
                    Mar Baselios College of Engineering and Technology, Nalanchira, Thiruvananthapuram.
                  </p>
                  <p className="cinematic-text" style={{ fontSize: '1.25rem', lineHeight: 1.8, color: 'var(--g300)' }}>
                    Founded with a mission to bridge the gap between academic knowledge and industry demands, our chapter equips
                    students with the skills, networks, and opportunities that transcend the classroom — cultivating a generation
                    of technically excellent and professionally ready engineers.
                  </p>
                </>
              )}
            </div>
            
            <div className="reveal d3" style={{ marginTop: '40px' }}>
              <Link href="/#membership" className="btn-primary">
                Become a Member
              </Link>
            </div>
          </div>
          <div className="about-visuals reveal d2">
            <NucleusCore />
          </div>
        </div>
      </section>
    )
  }

  const renderWho = () => {
    return (
      <section id="who">
        <div className="section-inner">
          <div className="who-header">
            <div className="section-tag reveal">{settings.whoTag || 'Who Are We'}</div>
            <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.whoTitle || 'Built on Three<br /><em>Core Pillars</em>' }}></h2>
          </div>
          <div className="who-grid">
            {pillars.length > 0 ? (
              pillars.map((pillar: any, i: number) => (
                <div key={pillar._id} className={`who-card reveal ${i > 0 ? `d${i + 1}` : ''}`}>
                  <div className="who-num">{pillar.number}</div>
                  <h3 className="who-card-title">{pillar.title}</h3>
                  <p className="who-card-body">{pillar.body}</p>
                </div>
              ))
            ) : (
              <>
                <div className="who-card reveal">
                  <div className="who-num">01</div>
                  <h3 className="who-card-title">Community of Innovators</h3>
                  <p className="who-card-body">A dynamic collective of engineering students passionate about technology, problem-solving, and creating real-world impact through collaborative projects, events, and challenges.</p>
                </div>
                <div className="who-card reveal d2">
                  <div className="who-num">02</div>
                  <h3 className="who-card-title">Bridge to Industry</h3>
                  <p className="who-card-body">We connect students directly with industry professionals, alumni networks, and research organizations — providing exposure that transforms theoretical knowledge into professional competence.</p>
                </div>
                <div className="who-card reveal d3">
                  <div className="who-num">03</div>
                  <h3 className="who-card-title">Platform for Growth</h3>
                  <p className="who-card-body">From technical workshops and hackathons to leadership programs and national competitions, ISTE MBCET is your launchpad for holistic personal and professional excellence.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderStats = () => {
    return (
      <section id="stats">
        <div className="section-inner">
          <div className="stats-grid">
            {stats.map((stat: any, i: number) => (
              <div key={stat._id} className={`stat-item reveal ${DELAY_CLASSES[i] || ''}`}>
                <div className="stat-number">
                  <span className="countup" data-to={stat.value}>0</span>
                  <span className="stat-plus">{stat.suffix}</span>
                </div>
                <div className="stat-bar"></div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const renderBenefits = () => {
    return (
      <section id="benefits">
        <div className="section-inner">
          <div className="section-tag reveal">{settings.benefitsTag || 'Member Benefits'}</div>
          <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.benefitsTitle || 'Why Join<br /><em>ISTE MBCET?</em>' }}></h2>
          <div className="benefits-grid">
            {benefits.length > 0 ? (
              benefits.map((benefit: any, i: number) => (
                <div key={benefit._id} className={`benefit-card reveal ${i > 0 ? `d${i % 4}` : ''}`}>
                  <div className="benefit-icon-wrapper">
                    {getBenefitIcon(benefit.icon)}
                  </div>
                  <h3 className="benefit-title">{benefit.title}</h3>
                  <p className="benefit-body">{benefit.body}</p>
                </div>
              ))
            ) : (
              <>
                <div className="benefit-card reveal">
                  <div className="benefit-icon-wrapper"><Zap size={24} strokeWidth={1.5} /></div>
                  <h3 className="benefit-title">Technical Workshops</h3>
                  <p className="benefit-body">Hands-on workshops on cutting-edge technologies — AI/ML, Web Development, IoT, Robotics, Embedded Systems — taught by industry experts.</p>
                </div>
                <div className="benefit-card reveal d1">
                  <div className="benefit-icon-wrapper"><Trophy size={24} strokeWidth={1.5} /></div>
                  <h3 className="benefit-title">National Competitions</h3>
                  <p className="benefit-body">Represent MBCET at ISTE national-level contests, project expos, and hackathons. Build a portfolio that stands out to recruiters and graduate schools.</p>
                </div>
                <div className="benefit-card reveal d2">
                  <div className="benefit-icon-wrapper"><Globe size={24} strokeWidth={1.5} /></div>
                  <h3 className="benefit-title">Industry Networking</h3>
                  <p className="benefit-body">Connect with industry leaders, senior alumni, and professionals through exclusive events, guest talks, and company visits curated for our members.</p>
                </div>
                <div className="benefit-card reveal d1">
                  <div className="benefit-icon-wrapper"><FileText size={24} strokeWidth={1.5} /></div>
                  <h3 className="benefit-title">Official ISTE Card</h3>
                  <p className="benefit-body">Receive a nationally recognized ISTE membership card, unlocking access to ISTE resources, academic journals, and nationwide student benefits.</p>
                </div>
                <div className="benefit-card reveal d2">
                  <div className="benefit-icon-wrapper"><GraduationCap size={24} strokeWidth={1.5} /></div>
                  <h3 className="benefit-title">Leadership Development</h3>
                  <p className="benefit-body">Step into committee roles, lead cross-functional teams, and organize large-scale events that build real leadership, communication, and managerial skills.</p>
                </div>
                <div className="benefit-card reveal d3">
                  <div className="benefit-icon-wrapper"><Briefcase size={24} strokeWidth={1.5} /></div>
                  <h3 className="benefit-title">Internships &amp; Placements</h3>
                  <p className="benefit-body">Exclusive access to referrals, internship opportunities, and placement-drive invites shared within our trusted network of members and alumni.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    )
  }

  const renderExecom = () => {
    return (
      <section id="execom">
        <div className="section-inner">
          <div className="section-tag reveal">{settings.execomTag || 'Leadership 2026-27'}</div>
          <h2 className="section-title reveal d1" style={{ position: 'relative', zIndex: 2 }} dangerouslySetInnerHTML={{ __html: settings.execomTitle || 'Executive<br /><em>Committee</em>' }}></h2>
          
          {/* Decorative atmospheric node for the Execom section */}
          <div className="absolute left-1/2 top-32 -translate-x-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(var(--c-alt1), 0.8) 0%, transparent 70%)', zIndex: 0 }} />

          {faculty.length > 0 && (
            <>
              <div className="execom-sub-label reveal">{settings.execomFacultyLabel || 'Faculty Advisors'}</div>
              <div className="execom-core" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: 560 }}>
                {faculty.map((m: any, i: number) => (
                  <ExecomFlipCard key={m._id} member={m} delayClass={i > 0 ? 'd1' : ''} />
                ))}
              </div>
            </>
          )}

          {mentors.length > 0 && (
            <>
              <div className="execom-sub-label reveal">{settings.execomMentorsLabel || 'Student Mentors'}</div>
              <div className="execom-core" style={{ gridTemplateColumns: 'repeat(2,1fr)', maxWidth: 560 }}>
                {mentors.map((m: any, i: number) => (
                  <ExecomFlipCard key={m._id} member={m} delayClass={i > 0 ? 'd1' : ''} />
                ))}
              </div>
            </>
          )}

          {core.length === 0 && teams.length === 0 && junior.length === 0 ? (
            <div style={{
              padding: '100px 40px',
              textAlign: 'center',
              background: 'linear-gradient(180deg, rgba(255, 252, 246, 0.4) 0%, rgba(255, 252, 246, 0.9) 100%)',
              border: '1px solid rgba(var(--c-main), 0.2)',
              borderRadius: '32px',
              boxShadow: '0 0 100px rgba(var(--c-main), 0.1), inset 0 0 40px rgba(var(--c-main), 0.05)',
              margin: '60px auto',
              maxWidth: '800px',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)'
            }}>
              {/* Animated scanning line */}
              <div style={{
                position: 'absolute',
                top: 0, left: '-100%', width: '50%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(var(--c-alt1), 0.1), transparent)',
                transform: 'skewX(-20deg)',
                animation: 'scan-line 4s linear infinite'
              }} />
              {/* Glowing core */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '500px', height: '500px', 
                background: 'radial-gradient(circle, rgba(var(--c-main), 0.15) 0%, transparent 60%)',
                opacity: 0.6, pointerEvents: 'none',
                animation: 'pulse-glow 6s ease-in-out infinite alternate'
              }} />
              {/* Grid overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                pointerEvents: 'none',
                opacity: 0.5
              }} />
              
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '3.5rem', color: '#1c1915', marginBottom: '24px', position: 'relative', zIndex: 1, letterSpacing: '-0.02em', textShadow: '0 0 40px rgba(var(--c-main),0.2)' }}>
                Building the Future
              </h3>
              <p style={{ color: 'rgba(40,34,26,0.7)', maxWidth: '500px', margin: '0 auto', fontSize: '1.2rem', lineHeight: 1.7, position: 'relative', zIndex: 1, fontWeight: 300 }}>
                The next generation of leaders for the Executive Committee is currently being selected. A new era is about to begin.
              </p>
              
              <div className="mt-12 relative z-10 flex justify-center">
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '12px',
                  padding: '12px 28px', borderRadius: '100px',
                  background: 'rgba(var(--c-main), 0.05)',
                  border: '1px solid rgba(var(--c-main), 0.3)',
                  boxShadow: '0 0 30px rgba(var(--c-main), 0.2), inset 0 0 20px rgba(var(--c-main), 0.1)',
                  color: 'rgb(var(--c-alt1))', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase'
                }}>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ animationDuration: '1.5s', backgroundColor: 'rgb(var(--c-main))' }}></span>
                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: 'rgb(var(--c-main))', boxShadow: '0 0 10px rgb(var(--c-main))' }}></span>
                  </span>
                  Selection Ongoing
                </div>
              </div>
            </div>
          ) : (
            <>
              {core.length > 0 && (
                <>
                  <div className="execom-sub-label reveal">{settings.execomCoreLabel || 'Core Officers'}</div>
                  <div className="execom-core bento">
                    {core.map((m: any, i: number) => (
                      <ExecomFlipCard key={m._id} member={m} delayClass={DELAY_CLASSES[i] || ''} bentoClass={i < 2 ? 'bento-wide' : 'bento-wide'} />
                    ))}
                  </div>
                </>
              )}
              {teams.length > 0 && (
                <>
                  <div className="execom-sub-label reveal">{settings.execomTeamLeadsLabel || 'Teams'}</div>
                  <div className="execom-teams">
                    {teams.map((tl: any, i: number) => (
                      <TeamCard
                        key={tl._id}
                        id={tl.initials}
                        name={tl.name}
                        team={tl.team || ''}
                        delay={DELAY_CLASSES[i % 4]}
                        subs={tl.subMembers || []}
                        photo={tl.photo}
                      />
                    ))}
                  </div>
                </>
              )}
              {junior.length > 0 && (
                <>
                  <div className="execom-sub-label reveal">{settings.execomJuniorLabel || 'Junior ExeCom'}</div>
                  <div className="junior-grid">
                    {junior.map((m: any, i: number) => (
                      <div key={m._id} className={`junior-card reveal ${DELAY_CLASSES[i] || ''}`}>
                        <div className="execom-card-content">
                          <ExecomAvatar photo={m.photo} initials={m.initials} name={m.name} size="sm" />
                          <div className="junior-name">{m.name}</div>
                          <div className="junior-role">{m.team || m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    )
  }

  const renderEvents = () => {
    return (
      <section id="events">
        <div className="section-inner">
          <div className="section-tag reveal">{settings.eventsTag || 'Events'}</div>
          <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.eventsTitle || 'Recent &amp;<br /><em>Upcoming</em>' }}></h2>
          <div className="events-list">
            {events.map((ev: any) => (
              <Link href={ev.slug ? `/events/${ev.slug}` : '#'} key={ev._id} className={`event-row reveal ${ev.isCurrentlyHappening ? 'live-event' : ''}`}>
                <div className="event-date" style={{ color: ev.isCurrentlyHappening ? '#ef4444' : 'var(--c-main)' }}>
                  {ev.isCurrentlyHappening && <span className="live-heartbeat"></span>}
                  {ev.dateLabel}
                </div>
                <div className="event-info-main">
                  <div className="event-title">
                    {ev.title}
                    {ev.isCurrentlyHappening && <span style={{ marginLeft: 12, fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)' }}>HAPPENING NOW</span>}
                  </div>
                  {ev.eventType && <div className="event-type">{ev.eventType}</div>}
                </div>
                {ev.galleryTeaser?.length > 0 && (
                  <div className="event-gallery-teaser">
                    {ev.galleryTeaser.map((img: any, i: number) => (
                      <div key={i} className="teaser-thumb" style={{ zIndex: 3 - i, position: 'relative', width: 80, height: 80 }}>
                        <Image 
                          src={urlForImage(img).width(80).height(80).url()} 
                          alt="Gallery teaser" 
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="event-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const renderMembership = () => {
    return (
      <section id="membership" style={{ paddingBottom: 80 }}>
        <div className="section-inner">
          <div className="section-tag reveal">{settings.membershipTag || 'Enroll Now'}</div>
          <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.membershipTitle || 'Grab Your<br /><em>Membership</em>' }}></h2>
          <div className="mem-glass-card reveal d2">
            <div className="mem-grid">
              <div className="mem-left">
                <p className="mem-body">
                  {settings.membershipBody || "Becoming a member of ISTE MBCET Student Chapter is your gateway to technical excellence, peer networking, and real-world professional growth. Fill in your details and we'll get you enrolled within 48 hours."}
                </p>
                <div className="perks">
                  {membershipPerks.map((perk: string, i: number) => (
                    <div key={i} className="perk">
                      <div className="perk-check">✓</div>
                      {perk}
                    </div>
                  ))}
                </div>
              </div>
              <MembershipForm 
                enabled={membershipEnabled} 
                closedMessage={membershipClosedMessage} 
              />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderLaunchpad = () => {
    return (
      <section id="launchpad" style={{ background: 'var(--black)', paddingTop: 80 }}>
        <div className="section-inner">
          <div className="section-tag reveal">{settings.launchpadTag || 'Member Resources'}</div>
          <div className="launchpad-teaser-grid">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.launchpadTitle || 'Internship<br /><em>Launchpad</em>' }}></h2>
              <p className="section-body reveal d2" style={{ marginTop: '24px', marginBottom: '24px' }}>
                {settings.launchpadBody || 'Curated internship opportunities, verified and posted by the ISTE MBCET team — exclusively for our members.'}
              </p>
              
              {settings.launchpadExperimentalLabel !== '' && settings.launchpadExperimentalLabel !== undefined && (
              <div className="reveal d2" style={{
                padding: '8px 14px',
                background: 'rgba(220, 100, 80, 0.15)',
                border: '1px solid rgba(220, 100, 80, 0.3)',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.7rem',
                color: 'var(--white)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(220, 100, 80, 0.1)',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '1rem' }}>🧪</span>
                <span>{settings.launchpadExperimentalLabel || 'Experimental • Under Construction'}</span>
              </div>
              )}

              <Link href="/internships" className="launchpad-cta reveal d3" style={{ marginTop: 'auto' }}>
                Explore All Opportunities →
              </Link>
            </div>
            <div className="launchpad-preview">
              {featuredInternships.length > 0 ? (
                featuredInternships.map((intern: any, i: number) => (
                  <a
                    key={intern._id}
                    href={intern.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`launchpad-preview-card reveal ${['d1', 'd2', 'd3'][i]}`}
                  >
                    <div className="lp-role">{intern.role}</div>
                    <div className="lp-company">{intern.company}</div>
                    <div className="lp-meta">
                      {intern.type && <span>{intern.type}</span>}
                      {intern.stipend && <span>{intern.stipend}</span>}
                    </div>
                    <div className="lp-arrow">→</div>
                  </a>
                ))
              ) : (
                <div className="no-active-events-card reveal d1" style={{
                  position: 'relative',
                  padding: '40px 32px',
                  textAlign: 'center',
                  background: 'linear-gradient(180deg, rgba(16, 14, 38, 0.4) 0%, rgba(10, 10, 26, 0.8) 100%)',
                  border: '1px solid rgba(140, 120, 240, 0.15)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                  minHeight: '260px'
                }}>
                  {/* Glowing Radar Core */}
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '120px', height: '120px',
                    background: 'radial-gradient(circle, rgba(140, 120, 240, 0.15) 0%, transparent 70%)',
                    borderRadius: '50%', opacity: 0.15, animation: 'pulseOpacity 3s ease-in-out infinite',
                    zIndex: 0, pointerEvents: 'none'
                  }}></div>
                  
                  <div style={{ position: 'relative', zIndex: 1, fontSize: '2.5rem', opacity: 0.9, animation: 'float 4s ease-in-out infinite' }}>
                    📡
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--white)', marginBottom: '8px' }}>
                      Hunting for Opportunities
                    </h3>
                    <p style={{ color: 'var(--g400)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
                      Our autonomous engine is currently scanning the web for premium, verified internships. They will appear here in real-time.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  const renderFaq = () => {
    const faqs = sanityData?.faqs || []
    if (faqs.length === 0) return null
    return (
      <section id="faq" key="faq" style={{ padding: '80px 0' }}>
        <div className="section-inner">
          <div className="section-tag reveal">{settings.faqTag || 'Got Questions?'}</div>
          <h2 className="section-title reveal d1" dangerouslySetInnerHTML={{ __html: settings.faqTitle || 'Frequently Asked<br /><em>Questions</em>' }}></h2>
          <div className="faq-list mt-8">
            {faqs.map((faq: any, i: number) => (
              <div key={faq._id} className={`faq-item reveal ${DELAY_CLASSES[i] || ''}`} style={{ marginBottom: 24, padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: 12 }}>{faq.question}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    hero: () => null, // Hero is rendered statically at top
    activeEvents: renderActiveEvents,
    about: renderAbout,
    who: renderWho,
    stats: renderStats,
    benefits: renderBenefits,
    execom: renderExecom,
    events: renderEvents,
    membership: renderMembership,
    launchpad: renderLaunchpad,
    faq: renderFaq,
  }

  const defaultOrder = ['activeEvents', 'about', 'who', 'stats', 'benefits', 'execom', 'events', 'membership', 'launchpad', 'faq']
  let sectionsToRender = []

  if (homePage?.sections?.length > 0) {
    sectionsToRender = homePage.sections
      .filter((s: any) => s.visible !== false)
      .map((s: any) => s.sectionId)
  } else {
    sectionsToRender = defaultOrder
  }

  const navLinks = navigationMenu?.mainLinks || [
    { label: 'About', href: '#about' },
    { label: 'Who We Are', href: '#who' },
    { label: 'Benefits', href: '#benefits' },
    { label: 'ExeCom', href: '#execom' },
    { label: 'Events', href: '#events' },
    { label: 'Launchpad ✦', href: '/internships', isHighlighted: true },
  ]
  const footerCols = navigationMenu?.footerColumns || []
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          :root {
            ${settings.primaryColor ? '--c-main: ' + settings.primaryColor.replace('#', '') + ';' : ''}
            ${settings.accentColor ? '--c-alt1: ' + settings.accentColor.replace('#', '') + ';' : ''}
          }
        `
      }} />
      <HomeAnimations heroTypedText={heroTypedText} />



      <div className="grid-lines" aria-hidden="true">
        <div className="grid-line"></div>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
        <div className="grid-line"></div>
      </div>

      <nav id="navbar" aria-label="Main Navigation" role="navigation">
        <a href="#hero" className="nav-logo" aria-label="ISTE MBCET Home">
          <Image src="/iste.png" alt="ISTE SC MBCET Logo" width={40} height={40} className="logo-img" priority />
          <span>ISTE SC MBCET</span>
        </a>
        <ul className="nav-links" role="menubar">
          {navLinks.map((link: any, i: number) => (
            <li role="none" key={i}>
              {link.isHighlighted ? (
                <Link role="menuitem" href={link.href} className="nav-link-highlight">
                  {link.label} {link.highlightSuffix || ''}
                </Link>
              ) : (
                <a role="menuitem" href={link.href}>{link.label}</a>
              )}
            </li>
          ))}
        </ul>
        <a href={navigationMenu?.ctaHref || "#membership"} className="nav-cta" aria-label="Navigate to Membership Form">{navigationMenu?.ctaLabel || navCta}</a>
        <button className="nav-hamburger" id="hamburger" aria-label="Open mobile menu" aria-expanded="false" aria-controls="mob-menu">
          <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
        </button>
      </nav>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      <div className="mob-menu" id="mob-menu" role="dialog" aria-modal="true" aria-label="Mobile Navigation Menu">
        <div className="mob-menu-inner">
          <button className="mob-close" id="mob-close" aria-label="Close menu">✕</button>
          <nav className="mob-nav" aria-label="Mobile Navigation">
            {navLinks.map((link: any, i: number) => (
              link.isHighlighted ? (
                <Link href={link.href} key={i} className="mob-link mob-link--accent" id={`ml-${i+1}`}>{link.label} {link.highlightSuffix || ''}</Link>
              ) : (
                <a href={link.href} key={i} className="mob-link" id={`ml-${i+1}`}>{link.label}</a>
              )
            ))}
          </nav>
          <a href={navigationMenu?.ctaHref || "#membership"} className="mob-cta" aria-label="Navigate to Membership Form">{navigationMenu?.ctaLabel || navCta} →</a>
          <div className="mob-footer">
            <a href="https://www.instagram.com/iste_mbcet/" aria-label="ISTE MBCET Instagram">Instagram</a>
            <a href="https://www.linkedin.com/company/istescmbcet/" aria-label="ISTE MBCET LinkedIn">LinkedIn</a>
          </div>
        </div>
      </div>

      <section id="hero">
        {/* Aurora Gradient Ribbon */}
        <div className="aurora-ribbon" aria-hidden="true">
          <div className="aurora-inner"></div>
        </div>

        {/* Orbital Lines SVG */}
        <svg className="orbital-lines" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <ellipse className="orbit-ellipse-1" cx="600" cy="320" rx="380" ry="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <ellipse className="orbit-ellipse-2" cx="600" cy="400" rx="500" ry="180" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {/* Orbiting dot 1 */}
          <circle className="orbit-dot-1" r="4" fill="rgba(255,255,255,0.3)" />
          {/* Orbiting dot 2 */}
          <circle className="orbit-dot-2" r="3" fill="rgba(127,140,255,0.5)" />
        </svg>




        {/* Hero Main Content */}
        <div className="hero-content">
          <h1 className="hero-headline" id="hero-headline">
            {/* SEO Fallback: Server-rendered text for crawlers, GSAP clears this on mount */}
            <span id="typed-out">{heroTypedText}</span>
            <span className="type-cursor" id="tcursor"></span>
          </h1>
          <div className="hero-divider" id="hero-div"></div>
          <p className="hero-sub" id="hero-sub">
            {heroDescription}
          </p>

          <div className="hero-ctas">
            <a href="#membership" className="hero-btn-primary">
              {heroPrimaryCta}
              <span className="hero-btn-arrow">→</span>
            </a>
            <a href="#events" className="hero-btn-secondary">
              {heroSecondaryCta} <span>→</span>
            </a>
          </div>
        </div>

        {/* Stats floater */}
        <div className="hero-stat-floater" aria-hidden="true">
          <div className="stat-floater-num">{stats[0]?.value || 300}<span>+</span></div>
          <div className="stat-floater-label">{settings.heroStatsLabel || 'members are already part of the chapter'}</div>
        </div>

        {/* Ever-looping Marquee Strip */}
        <div className="hero-ticker">
          <div className="hero-ticker-track">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="hero-ticker-set">
                {tickerItems.map((item: string, idx: number) => (
                  <span key={idx}>
                    <span className={`ticker-item ${idx % 2 === 0 ? 'ticker-italic' : ''}`}>{item}</span>
                    <span className="ticker-dash">—</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Active Event Section */}
      

      

      

      

      

      

      

      


      {/* ===================== INTERNSHIP LAUNCHPAD TEASER ===================== */}
      

      {/* CMS Driven Sections */}
      {sectionsToRender.map((sectionId: string) => {
        const renderFunc = sectionRenderers[sectionId]
        if (renderFunc) return renderFunc()
        return null
      })}

      <footer>
        <div className="footer-watermark">{settings.footerVersion || 'v11.2'}</div>
        <div className="footer-top">
          <div>
            <div className="footer-logo"><Image src="/iste.png" alt="ISTE SC MBCET" width={80} height={80} className="footer-logo-img" /></div>
            <div className="footer-tagline">
              {footerTagline}
            </div>
            {settings.chapterCode && <div className="footer-chip">Chapter Code: {settings.chapterCode}</div>}
          </div>
          <div>
            <div className="footer-col-title">Navigate</div>
            <ul className="footer-links">
              <li><a href="#about">About</a></li>
              <li><a href="#who">Who We Are</a></li>
              <li><a href="#benefits">Benefits</a></li>
              <li><a href="#execom">ExeCom</a></li>
              <li><a href="#events">Events</a></li>
              <li><Link href="/internships">Internship Launchpad</Link></li>
              <li><a href="#membership">Join Now</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Follow Us</div>
            <ul className="footer-links">
              <li><a href={settings.instagramUrl || 'https://www.instagram.com/iste_mbcet/'}>Instagram</a></li>
              <li><a href={settings.linkedinUrl || 'https://www.linkedin.com/company/istescmbcet/'}>LinkedIn</a></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Contact</div>
            <ul className="footer-links">
              <li><a href={`mailto:${settings.contactEmail || 'istestudentchapter@mbcet.ac.in'}`}>{settings.contactEmail || 'istestudentchapter@mbcet.ac.in'}</a></li>
              <li><a href="https://maps.google.com/?q=Mar+Baselios+College+of+Engineering+and+Technology" target="_blank" rel="noopener noreferrer">{settings.footerAddressLine1 || 'MBCET, Nalanchira'}</a></li>
              <li><a href="https://maps.google.com/?q=Thiruvananthapuram,Kerala" target="_blank" rel="noopener noreferrer">{settings.footerAddressLine2 || 'Thiruvananthapuram'}</a></li>
              <li><a href="https://maps.google.com/?q=Kerala+695015" target="_blank" rel="noopener noreferrer">{settings.footerAddressLine3 || 'Kerala — 695 015'}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">{settings.footerCopyright || '© 2026 ISTE MBCET Student\'s Chapter. All rights reserved.'}</div>
          <div className="footer-socials">
            <a href={settings.instagramUrl || 'https://www.instagram.com/iste_mbcet/'}>Instagram</a>
            <a href={settings.linkedinUrl || 'https://www.linkedin.com/company/istescmbcet/'}>LinkedIn</a>
          </div>
        </div>
        <AliveClock />
      </footer>
    </>
  )
}
