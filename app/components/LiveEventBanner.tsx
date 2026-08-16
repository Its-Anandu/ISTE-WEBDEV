'use client'
import React, { useEffect } from 'react'
import { useBrain } from '../brain/BrainProvider'
import Link from 'next/link'

export default function LiveEventBanner({ activeEvents }: { activeEvents: any[] }) {
  const brain = useBrain()
  
  useEffect(() => {
    if (activeEvents.length > 0) {
      brain.notifyEngine('Events', 'live_events_detected', { count: activeEvents.length })
    }
  }, [activeEvents.length, brain])

  if (!activeEvents || activeEvents.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 mt-8 md:mt-16 mb-8 md:mb-16 relative z-20">
      <div 
        className="relative overflow-hidden backdrop-blur-2xl bg-[#fffdf9]/[0.75] border border-[#594c3c]/20 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 md:px-12 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 transition-all hover:bg-[#fffdf9]/[0.5]"
        style={{ 
          boxShadow: '0 20px 50px rgba(90,76,56,0.16), inset 0 1px 0 rgba(190,76,52,0.08)'
        }}
      >
        {/* Soft glow behind the text */}
        <div 
          className="absolute -left-20 top-1/2 -translate-y-1/2 w-48 h-48 blur-[100px] pointer-events-none"
          style={{ background: 'rgba(var(--c-main), 0.12)' }}
        />
        
        <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
          {/* Animated Status Dot */}
          <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#594c3c]/5 shrink-0">
            <div 
              className="w-2.5 h-2.5 rounded-full animate-pulse" 
              style={{ 
                background: 'rgb(var(--c-main))',
                boxShadow: '0 0 15px rgb(var(--c-main))'
              }}
            ></div>
          </div>

          <div className="flex-1">
            <h3 
              className="text-[0.6rem] md:text-[0.65rem] font-sans uppercase tracking-[0.2em] font-semibold mb-1 md:mb-3 opacity-70"
              style={{ color: 'rgb(var(--c-main))' }}
            >
              {activeEvents[0].status === 'registration_active' ? 'Registration Live' : 'Coming Soon'}
            </h3>
            <p className="text-[#1c1915] font-serif tracking-wide text-lg md:text-3xl leading-tight">
              {activeEvents[0].title}
            </p>
          </div>
        </div>
        
        <Link 
          href={`/events/${activeEvents[0].slug?.current || ''}`}
          className="relative z-10 w-full md:w-auto px-6 py-3 md:px-10 md:py-4 rounded-full font-sans text-[0.65rem] md:text-xs font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-3 transition-all group"
          style={{
            background: 'rgba(40, 34, 26, 0.06)',
            color: '#1c1915',
            border: '1px solid rgba(40, 34, 26, 0.14)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(var(--c-main), 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(40, 34, 26, 0.06)'
          }}
        >
          {activeEvents[0].status === 'registration_active' ? 'Register Now' : 'View Details'}
          <span className="transition-transform group-hover:translate-x-1 opacity-70">→</span>
        </Link>
      </div>
    </div>
  )
}
