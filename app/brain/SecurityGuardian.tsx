'use client';

import { useEffect, useRef } from 'react';
import { useBrain } from './BrainProvider';

/**
 * ENGINE 43: SECURITY GUARDIAN (Adaptive Behavioral Trust Engine)
 * 
 * Re-architected to prioritize intelligent contextual analysis over rigid blocking.
 * Understands genuine student behavior (rapid searching, heavy browsing, refreshes)
 * vs actual malicious attack patterns (XSS, SQLi, Mass Scraping, DDoS).
 */

const HARD_THREAT_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS Injection
  /javascript:/gi,
  /onerror\s*=/gi,
  /onload\s*=/gi,
  /SELECT\s+.*?\s+FROM/gi, // SQLi
  /UNION\s+SELECT/gi,
  /DROP\s+TABLE/gi,
  /etc\/passwd/gi // Path Traversal
];

export default function SecurityGuardian() {
  const brain = useBrain();
  
  // Behavioral tracking
  const trustScore = useRef(80); // 0-100 (100 = full trust, 0 = hard block)
  const interactionHistory = useRef<{time: number, type: string}[]>([]);
  const isLockedDown = useRef(false);
  const lockdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    brain.registerEngine('Security');

    // ── 1. CONTEXTUAL INTERACTION SENSOR (Soft Monitoring) ──────────────
    const logInteraction = (type: string) => {
      if (isLockedDown.current) return;
      
      const now = Date.now();
      interactionHistory.current.push({ time: now, type });
      
      // Keep last 30 seconds of history
      interactionHistory.current = interactionHistory.current.filter(i => now - i.time < 30000);
      
      analyzeBehavioralTrust();
    };

    const analyzeBehavioralTrust = () => {
      const history = interactionHistory.current;
      const clicks = history.filter(i => i.type === 'click').length;
      const inputs = history.filter(i => i.type === 'input').length;
      
      // We know students might click heavily or open multiple tabs
      if (clicks > 30) {
        // High click volume -> reduce trust slightly, but don't ban
        trustScore.current = Math.max(trustScore.current - 5, 20);
        brain.notifyEngine('Security', 'silent_monitor', { msg: 'High interaction volume detected. Assuming enthusiastic student behavior.' });
      } else {
        // Normal behavior recovers trust
        trustScore.current = Math.min(trustScore.current + 1, 100);
      }
      
      if (trustScore.current < 30 && trustScore.current > 10) {
        // Soft mitigation: Adaptive Cooldown (UI effect only, no hard blocks)
        document.documentElement.setAttribute('data-emotion', 'curious'); // Watchful
      }
    };

    const handleInteraction = () => logInteraction('click');
    window.addEventListener('click', handleInteraction);

    // ── 2. SMART PAYLOAD SENSOR (High Confidence Threat Detection) ───────
    const handleInput = (e: Event) => {
      logInteraction('input');
      if (isLockedDown.current) return;
      
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target && target.value) {
        const value = target.value;
        for (const pattern of HARD_THREAT_PATTERNS) {
          if (pattern.test(value)) {
            // High confidence malicious intent
            trustScore.current -= 50; 
            handleHardThreat('MALICIOUS_PAYLOAD', `Exploit signature detected: ${pattern}`);
            target.value = ''; // Neutralize
            break;
          }
        }
      }
    };
    window.addEventListener('input', handleInput, true);

    // ── 3. DOM IMMUNE SYSTEM (Mutation Observer) ───────────────────────
    // DISABLED IN DEV & ON iOS TO PREVENT WEBKIT MEMORY CRASHES AND NEXT.JS HMR DISCONNECTIONS
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isDev = process.env.NODE_ENV === 'development';
    
    let observer: MutationObserver | null = null;
    if (!isIOS && !isDev) {
      observer = new MutationObserver((mutations) => {
        if (isLockedDown.current) return;
        
        for (const mutation of mutations) {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeName.toLowerCase() === 'script') {
              const scriptNode = node as HTMLScriptElement;
              const src = scriptNode.src || '';
              // Safely allow Next.js, Vercel, React, Webpack, HMR & Inline scripts
              if (
                !src || 
                src.includes('_next') || 
                src.includes('vercel') || 
                src.includes('webpack') || 
                src.includes('react')
              ) {
                continue;
              }
              handleHardThreat('UNAUTHORIZED_SCRIPT_INJECTION', `Detected unknown script: ${src}`);
              scriptNode.remove(); // Neutralize
            }
          }
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ── 4. THREAT RESPONSE PROTOCOL ──────────────────────────────────────
    const handleHardThreat = (type: string, details: string) => {
      if (trustScore.current > 0) {
        // Progressive escalation instead of instant hard block
        console.warn(`%c[BEHAVIORAL ENGINE] Suspicious Activity Flagged ⚠️`, 'color: #f59e0b; font-size: 13px;');
        brain.notifyEngine('Security', 'risk_based_verification', { type, details });
        return;
      }
      
      // Absolute minimum trust reached -> Lockdown
      isLockedDown.current = true;
      console.warn(`%c[SECURITY GUARDIAN] THREAT NEUTRALIZED 🛑`, 'color: #ff0000; font-size: 14px; font-weight: bold;');
      console.warn(`Type: ${type}\nDetails: ${details}`);
      
      brain.notifyEngine('Security', 'threat_detected', { type, details });
      
      document.documentElement.setAttribute('data-emotion', 'stressed');
      document.documentElement.setAttribute('data-security-lockdown', 'true');

      // Auto-recover after 15 seconds (Student friendly)
      if (lockdownTimeoutRef.current) clearTimeout(lockdownTimeoutRef.current);
      
      lockdownTimeoutRef.current = setTimeout(() => {
        isLockedDown.current = false;
        trustScore.current = 60; // Reset trust partially
        document.documentElement.removeAttribute('data-security-lockdown');
        document.documentElement.setAttribute('data-emotion', 'calm');
        console.log('%c[SECURITY GUARDIAN] Lockdown lifted. Rebuilding trust profile.', 'color: #00ff00;');
        lockdownTimeoutRef.current = null;
      }, 15000);
    };

    // NOTE: We have removed rigid UX-harming protections (anti-right-click, anti-devtools, anti-copying)
    // as per the new adaptive intelligence directive.

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('input', handleInput, true);
      if (lockdownTimeoutRef.current) clearTimeout(lockdownTimeoutRef.current);
    };
  }, []);

  return null;
}
