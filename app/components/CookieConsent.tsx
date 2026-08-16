'use client';

import { useEffect, useState, useCallback } from 'react';

const COOKIE_CONSENT_KEY = 'iste_cookie_consent';

type ConsentState = 'accepted' | 'declined' | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so the banner appears after page load
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentState;
        if (!saved) {
          setVisible(true);
        } else {
          setConsent(saved);
        }
      } catch {
        setVisible(true);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleConsent = useCallback((choice: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch {}
    setConsent(choice);
    setVisible(false);
  }, []);

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        width: 'min(calc(100vw - 2rem), 640px)',
        background: 'rgba(10, 10, 14, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'cookie-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <style>{`
        @keyframes cookie-slide-up {
          from { opacity: 0; transform: translateX(-50%) translateY(1rem); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }} aria-hidden="true">🍪</span>
        <div>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: 'rgba(255,255,255,0.75)',
          }}>
            We use cookies to enhance your experience, analyse site traffic, and serve personalised content.
            By continuing you agree to our{' '}
            <a
              href="/privacy"
              style={{ color: 'rgba(139, 92, 246, 0.9)', textDecoration: 'underline' }}
            >
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={() => handleConsent('declined')}
          aria-label="Decline cookies"
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-sans, sans-serif)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
        >
          Decline
        </button>
        <button
          onClick={() => handleConsent('accepted')}
          aria-label="Accept cookies"
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'linear-gradient(135deg, #d6603a, #e09e3e)',
            color: '#fff',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-sans, sans-serif)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
