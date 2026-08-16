'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import type { InternshipData } from './page'
import { Search, Code2, BrainCircuit, CheckCircle2 } from 'lucide-react'
import { gsap, useGSAP } from '@/app/brain/engines/GSAPCore'

export default function InternshipGrid({ internships }: { internships: InternshipData[] }) {
  const [isHunting, setIsHunting] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'completed'>('idle')
  const [quizScore, setQuizScore] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const quizQuestions = [
    { q: "Which of the following is a React hook?", options: ["useFetch", "useEffect", "useData", "useQuery"], a: 1 },
    { q: "What does API stand for?", options: ["Application Programming Interface", "Advanced Program Integration", "Automated Process Instance", "Applied Protocol Interface"], a: 0 },
    { q: "Which tool is used for containerization?", options: ["Git", "Docker", "Jenkins", "Ansible"], a: 1 }
  ];

  // Simulate "Hunting/Deciphering" on search query changes
  useEffect(() => {
    if (isHunting) {
      const t = setTimeout(() => setIsHunting(false), 800)
      return () => clearTimeout(t)
    }
  }, [searchQuery, isHunting])

  const filtered = useMemo(() => {
    let result = internships;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      result = result.filter(i => 
        (i.role?.toLowerCase() || '').includes(lower) ||
        (i.company?.toLowerCase() || '').includes(lower) ||
        (i.domain?.toLowerCase() || '').includes(lower)
      )
    }
    
    // Apply personalized match scores if quiz completed
    if (quizState === 'completed') {
      result = result.map(i => {
        // Deterministic pseudo-random match score based on user's quiz score and job id
        const hash = String(i._id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const baseScore = 50 + (quizScore * 10); // 50 to 80
        const variation = (hash % 20) - 10; // -10 to +10
        return { ...i, matchScore: Math.min(100, Math.max(0, baseScore + variation)) }
      }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return result;
  }, [internships, searchQuery, quizState, quizScore])

  useGSAP(() => {
    if (!isHunting && filtered.length > 0 && containerRef.current) {
      // Futuristic Staggered Matrix reveal
      gsap.fromTo('.gsap-internship-card',
        { 
          y: 60, 
          opacity: 0, 
          scale: 0.9, 
          rotationX: 15,
          filter: 'blur(10px) brightness(200%)' 
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotationX: 0,
          filter: 'blur(0px) brightness(100%)',
          duration: 1.0,
          stagger: {
            amount: 0.5,
            from: "random"
          },
          ease: 'expo.out',
          clearProps: 'all' // prevents sticking inline styles
        }
      )
    }
  }, [isHunting, filtered])

  return (
    <div className="internship-grid-container" style={{ width: '100%' }}>
      
      {/* Skill Quiz Widget */}
      <div className="quiz-widget" style={{ 
        maxWidth: '600px', margin: '0 auto 32px auto', 
        background: 'rgba(59, 130, 246, 0.05)', 
        border: '1px solid rgba(59, 130, 246, 0.2)', 
        borderRadius: '16px', overflow: 'hidden' 
      }}>
        {quizState === 'idle' && (
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                <BrainCircuit size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--white)' }}>Skill Match Calibration</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--g400)' }}>Take a 1-min quiz to unlock personalized match scores.</p>
              </div>
            </div>
            <button 
              onClick={() => { setQuizState('active'); setQuizScore(0); setCurrentQuestion(0); }}
              style={{ background: '#d6603a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#d6603a'}
              onMouseOut={e => e.currentTarget.style.background = '#d6603a'}
            >
              Start Calibrating
            </button>
          </div>
        )}

        {quizState === 'active' && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--g400)', fontFamily: 'var(--font-mono)' }}>
              <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
              <span>Score: {quizScore}</span>
            </div>
            <h4 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: 'var(--white)' }}>{quizQuestions[currentQuestion].q}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quizQuestions[currentQuestion].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx === quizQuestions[currentQuestion].a) setQuizScore(s => s + 1);
                    if (currentQuestion < quizQuestions.length - 1) {
                      setCurrentQuestion(c => c + 1);
                    } else {
                      setQuizState('completed');
                      setIsHunting(true); // Retrigger animation
                    }
                  }}
                  style={{
                    background: 'rgba(40,34,26,0.03)', border: '1px solid rgba(40,34,26,0.1)',
                    padding: '12px 16px', borderRadius: '8px', color: 'var(--g100)', textAlign: 'left',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(40,34,26,0.08)'; e.currentTarget.style.borderColor = 'rgba(190,76,52,0.5)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(40,34,26,0.03)'; e.currentTarget.style.borderColor = 'rgba(40,34,26,0.1)'; }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {quizState === 'completed' && (
          <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(34, 197, 94, 0.05)' }}>
            <div style={{ color: '#4ade80' }}><CheckCircle2 size={32} /></div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#4ade80' }}>Calibration Complete</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--g300)' }}>Your personalized match scores have been applied to the grid below.</p>
            </div>
          </div>
        )}
      </div>

      {/* Command-K Style Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '40px',
        maxWidth: '600px',
        margin: '0 auto 48px auto'
      }}>
        <div style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b',
          pointerEvents: 'none'
        }}>
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Filter by role, company, or domain..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsHunting(true)
          }}
          style={{
            width: '100%',
            padding: '16px 20px 16px 48px',
            background: 'rgba(40, 34, 26, 0.03)',
            border: '1px solid rgba(40, 34, 26, 0.1)',
            borderRadius: '12px',
            color: '#f8fafc',
            fontSize: '1rem',
            fontFamily: 'var(--font-mono)',
            outline: 'none',
            transition: 'all 0.3s ease',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#d6603a'
            e.target.style.background = 'rgba(40, 34, 26, 0.05)'
            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(40, 34, 26, 0.1)'
            e.target.style.background = 'rgba(40, 34, 26, 0.03)'
            e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
        <div style={{
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '4px'
        }}>
          <kbd style={{ background: 'rgba(40,34,26,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#94a3b8', border: '1px solid rgba(40,34,26,0.1)' }}>⌘</kbd>
          <kbd style={{ background: 'rgba(40,34,26,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', color: '#94a3b8', border: '1px solid rgba(40,34,26,0.1)' }}>K</kbd>
        </div>
      </div>

      {filtered.length === 0 && !isHunting ? (
        <div className="reveal" style={{ padding: '60px 0', textAlign: 'center', color: 'var(--g400)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📭</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--white)', marginBottom: '10px' }}>No matches found</div>
          <div style={{ fontSize: '.9rem' }}>Try adjusting your search filters.</div>
        </div>
      ) : (
        <div className="internship-grid" ref={containerRef}>
          {isHunting ? (
            // Skeletons
            [...Array(Math.min(filtered.length || 4, 8))].map((_, i) => (
              <div key={`skel-${i}`} className="internship-card skeleton-card">
                <div className="intern-card-top">
                  <div className="skel-logo"></div>
                  <div style={{ flex: 1 }}>
                    <div className="skel-line" style={{ width: '60%' }}></div>
                    <div className="skel-line" style={{ width: '40%', marginTop: '8px' }}></div>
                  </div>
                </div>
                <div className="skel-line" style={{ width: '80%', height: '24px', margin: '24px 0' }}></div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div className="skel-tag"></div>
                  <div className="skel-tag"></div>
                </div>
              </div>
            ))
          ) : (
            // Real Cards
            filtered.map((intern, i) => (
              <div key={intern._id} className={`internship-card gsap-internship-card`} style={{ position: 'relative', opacity: 0 }}>
                <div className="intern-card-top">
                  <div className="intern-logo-wrap" style={{ position: 'relative' }}>
                    {intern.logo?.asset ? (
                      <Image
                        src={intern.logo.asset.url || ''}
                        alt={intern.company || 'Company logo'}
                        fill
                        className="object-contain"
                        placeholder={intern.logo?.asset?.metadata?.lqip ? "blur" : "empty"}
                        blurDataURL={intern.logo?.asset?.metadata?.lqip || undefined}
                      />
                    ) : (
                      <div className="intern-logo-placeholder">
                        {(intern.company || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="intern-company">{intern.company || 'Unknown Company'}</div>
                    {intern.domain && <div className="intern-domain">{intern.domain}</div>}
                  </div>
                </div>

                <h3 className="intern-role">{intern.role}</h3>

                {/* Match Score UI container (to be populated later via context/props) */}
                {intern.matchScore && (
                  <div style={{
                    position: 'absolute', top: '-10px', right: '-10px',
                    background: intern.matchScore > 80 ? '#22c55e' : intern.matchScore > 50 ? '#f59e0b' : '#d6603a',
                    color: '#fff', padding: '4px 12px', borderRadius: '12px',
                    fontSize: '0.8rem', fontWeight: 'bold', border: '2px solid var(--black)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10
                  }}>
                    {intern.matchScore}% Match
                  </div>
                )}

                <div className="intern-tags">
                  {intern.type && <span className="intern-tag">{intern.type}</span>}
                  {intern.stipend && <span className="intern-tag">{intern.stipend}</span>}
                  {intern.duration && <span className="intern-tag">{intern.duration}</span>}
                </div>

                {intern.description && (
                  <p className="intern-desc">{intern.description}</p>
                )}

                <div className="intern-footer">
                  {intern.deadlineLabel && (
                    <div className="intern-deadline">
                      <span>⏱</span> Deadline: {intern.deadlineLabel}
                    </div>
                  )}
                  <a
                    href={intern.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="intern-apply-btn"
                    onClick={() => {
                      try {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') || 'demo-jwt-token' : '';
                        fetch('/api/telemetry', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            action: 'click',
                            job_id: intern._id,
                            role: intern.role,
                            domain: intern.domain,
                            company: intern.company
                          }),
                          keepalive: true
                        }).catch(() => {});
                      } catch (e) {}
                    }}
                  >
                    Apply Now →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style jsx>{`
        .skeleton-card {
          position: relative;
          overflow: hidden;
          background: rgba(40,34,26,0.02) !important;
          border-color: rgba(40,34,26,0.05) !important;
        }
        .skeleton-card::after {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(40,34,26,0.04), transparent);
          animation: scan 1.5s infinite linear;
        }
        @keyframes scan {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .skel-logo {
          width: 48px; height: 48px; border-radius: 12px; background: rgba(40,34,26,0.05);
        }
        .skel-line {
          height: 12px; border-radius: 6px; background: rgba(40,34,26,0.05);
        }
        .skel-tag {
          width: 80px; height: 28px; border-radius: 14px; background: rgba(40,34,26,0.05);
        }
      `}</style>
    </div>
  )
}
