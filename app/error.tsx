"use client"

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error Caught:', error)
  }, [error])

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: '#f6f2ea', position: 'relative', overflow: 'hidden' }}>
      {/* Background Ambience */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
        opacity: 0.6, pointerEvents: 'none',
        animation: 'pulse-glow 6s ease-in-out infinite alternate'
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(220, 38, 38, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.03) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
        pointerEvents: 'none',
        opacity: 0.5
      }} />

      <div className="relative z-10 w-full max-w-lg text-center" style={{
        padding: '60px 40px',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(220, 38, 38, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 0 80px rgba(220, 38, 38, 0.15), inset 0 0 30px rgba(220, 38, 38, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}>
        
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: '#1c1915', marginBottom: '16px', letterSpacing: '-0.02em', textShadow: '0 0 30px rgba(220,38,38,0.5)' }}>
          System Malfunction
        </h1>
        
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px', fontWeight: 300 }}>
          The neural link was unexpectedly severed. A critical error occurred while attempting to render this sector of the site.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 rounded-lg bg-black/50 border border-red-500/20 text-left overflow-x-auto">
            <p className="text-red-400 font-mono text-sm">{error.message || 'Unknown Error'}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 28px', borderRadius: '100px',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: 'rgb(220, 38, 38)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Reboot System
          </button>
          
          <Link href="/"
            style={{
              padding: '12px 28px', borderRadius: '100px',
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Return to Hub
          </Link>
        </div>
      </div>
    </div>
  )
}
