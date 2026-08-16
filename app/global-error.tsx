"use client"

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Error Caught:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#f6f2ea', color: '#1c1915', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{
            maxWidth: '500px', width: '100%', textAlign: 'center',
            padding: '40px', background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '16px',
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#ef4444' }}>Critical Core Failure</h1>
            <p style={{ marginBottom: '32px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              The root layout neural engine failed to initialize. We are attempting to recover the primary systems.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '12px 24px', background: 'rgba(220, 38, 38, 0.1)',
                border: '1px solid rgba(220, 38, 38, 0.5)', color: '#ef4444',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              Force Reboot
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
