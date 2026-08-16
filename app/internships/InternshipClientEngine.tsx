'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useBrain } from '@/app/brain/BrainProvider'
import TypographyEngine from '@/app/brain/engines/TypographyEngine'
import { gsap, useGSAP } from '@/app/brain/engines/GSAPCore'
import type { InternshipData } from './page'

const AGENTS = [
  { id: 'discovery', name: 'Quantum Discovery Engine', role: 'Scanning Global Subnets for Anomalies' },
  { id: 'authenticity', name: 'Zero-Trust Authenticator', role: 'Cryptographically Verifying Integrity' },
  { id: 'semantic', name: 'Neural Semantic Decoder', role: 'Extracting High-Value Requirements' },
]

interface Props {
  internships?: InternshipData[]
}

export default function InternshipClientEngine({ internships = [] }: Props) {
  const { notifyEngine, internshipState } = useBrain()
  const [activeTab, setActiveTab] = useState('radar')
  const [ticker, setTicker] = useState(0)
  const [liveLogs, setLiveLogs] = useState<string[]>([])
  const [isLive, setIsLive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scanlineRef = useRef<HTMLDivElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)

  // Domain analytics from real internship data
  const domainStats = useMemo(() => {
    if (!internships.length) return []
    const counts: Record<string, number> = {}
    internships.forEach(i => {
      if (i.domain) counts[i.domain] = (counts[i.domain] || 0) + 1
    })
    const max = Math.max(...Object.values(counts), 1)
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([domain, count]) => ({ domain, count, pct: Math.round((count / max) * 100) }))
  }, [internships])

  useEffect(() => {
    notifyEngine('Internship', 'page_viewed')
    const i = setInterval(() => setTicker(t => t + 1), 3000)
    return () => clearInterval(i)
  }, [notifyEngine])

  // Live SSE telemetry connection
  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream')

    es.onopen = () => setIsLive(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.message) {
          setLiveLogs(prev => [data.message, ...prev].slice(0, 30))
          notifyEngine('Internship', 'agent_log', data.message)
        }
      } catch { /* ignore parse errors */ }
    }

    es.onerror = () => {
      setIsLive(false)
    }

    return () => es.close()
  }, [notifyEngine])

  // Auto-scroll feed to newest
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [liveLogs])

  // Canvas Node Network
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = canvas.width = canvas.offsetWidth
    let height = canvas.height = canvas.offsetHeight
    const particles: any[] = []

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1
      })
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      })
    }
    gsap.ticker.add(render)

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
    }
    window.addEventListener('resize', handleResize)
    return () => {
      gsap.ticker.remove(render)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeTab])

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!containerRef.current) return

    gsap.fromTo(containerRef.current,
      { y: 50, opacity: 0, scale: 0.98, rotationX: 10 },
      { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 1.2, ease: 'expo.out' }
    )

    gsap.to(scanlineRef.current, {
      top: '100%',
      duration: 3,
      repeat: -1,
      ease: 'linear',
      opacity: 0.2,
      yoyo: true
    })

    gsap.fromTo('.gsap-tab-content',
      { opacity: 0, y: 20, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', stagger: 0.1 }
    )

    gsap.to('.big-num', {
      scrambleText: { text: '{original}', chars: '01', speed: 0.3 },
      duration: 1.5,
      ease: 'none',
      stagger: 0.2
    })
  }, [activeTab])

  const allLogs = [...liveLogs, ...internshipState.logs].slice(0, 30)

  return (
    <div className="intel-dashboard" ref={containerRef}>
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="bg-canvas"></canvas>
      <div className="scanline" ref={scanlineRef}></div>
      <div className="dashboard-overlay"></div>

      <div className="dash-header relative z-10">
        <div className="dh-left">
          <div className={`dh-status-pulse ${isLive ? 'live' : 'standby'}`}></div>
          <h2>AUTONOMOUS INTELLIGENCE CORE</h2>
          {isLive && (
            <span className="live-badge">LIVE</span>
          )}
        </div>
        <div className="dh-nav">
          <button className={activeTab === 'radar' ? 'active' : ''} onClick={() => setActiveTab('radar')}>LIVE RADAR</button>
          <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>ANALYTICS</button>
          <button className={activeTab === 'agents' ? 'active' : ''} onClick={() => setActiveTab('agents')}>SYSTEM NODES</button>
        </div>
      </div>

      <div className="dash-body relative z-10">
        {activeTab === 'radar' && (
          <div className="radar-view gsap-tab-content">
            <div className="rv-main">
              <TypographyEngine text="Live Data Ingestion Stream" type="fade-stagger" element="h3" delay={0.1} />
              <div className="feed-container futuristic-border">
                {allLogs.length === 0 ? (
                  <div className="feed-waiting glitch-text" data-text="Connecting to telemetry...">Connecting to telemetry...</div>
                ) : (
                  allLogs.map((log, i) => (
                    <div key={i} className={`feed-item ${log.startsWith('[SYS]') ? 'sys-log' : log.includes('ERROR') ? 'err-log' : ''}`} style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                      <span className="fi-msg terminal-text">{log}</span>
                    </div>
                  ))
                )}
                <div ref={feedEndRef} />
              </div>
            </div>
            <div className="rv-sidebar gsap-tab-content">
              <div className="stat-card futuristic-border">
                <div className="corner-accent top-left"></div>
                <div className="corner-accent bottom-right"></div>
                <h4>Data Integrity</h4>
                <div className="big-num text-cyan-300">99.9%</div>
                <div className="sub-num">Cryptographic Confidence</div>
              </div>
              <div className="stat-card futuristic-border">
                <div className="corner-accent top-left"></div>
                <div className="corner-accent bottom-right"></div>
                <h4>Active Opportunities</h4>
                <div className="big-num text-emerald-300">{internshipState.foundCount > 0 ? internshipState.foundCount : internships.length || 0}</div>
                <div className="sub-num">Verified Regional Matches</div>
              </div>
              <div className="stat-card futuristic-border">
                <div className="corner-accent top-left"></div>
                <div className="corner-accent bottom-right"></div>
                <h4>Stream Status</h4>
                <div className={`big-num ${isLive ? 'text-green-400' : 'text-yellow-400'}`} style={{ fontSize: '1.2rem', letterSpacing: '0.08em' }}>
                  {isLive ? '● CONNECTED' : '○ STANDBY'}
                </div>
                <div className="sub-num">Sanity Telemetry Feed</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-view gsap-tab-content">
            <TypographyEngine text="Internship Domain Distribution" type="fade-stagger" element="h3" delay={0.1} />
            {domainStats.length === 0 ? (
              <div className="feed-waiting" style={{ marginTop: 32 }}>No domain data available yet.</div>
            ) : (
              <div className="domain-chart">
                {domainStats.map(({ domain, count, pct }, i) => (
                  <div key={domain} className="domain-row" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="domain-label">{domain}</div>
                    <div className="domain-bar-track">
                      <div
                        className="domain-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: `hsl(${200 + i * 25}, 80%, 60%)`,
                          boxShadow: `0 0 8px hsl(${200 + i * 25}, 80%, 60%, 0.4)`,
                        }}
                      />
                    </div>
                    <div className="domain-count">{count}</div>
                  </div>
                ))}
                <div className="analytics-footer">
                  <span>Total verified internships: <strong style={{ color: '#3b6bb0' }}>{internships.length}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="agent-view gsap-tab-content">
            <TypographyEngine text="Distributed Intelligence Nodes" type="fade-stagger" element="h3" delay={0.1} className="mb-6" />
            <div className="agent-grid">
              {AGENTS.map((agent, i) => (
                <div key={agent.id} className="agent-node futuristic-border">
                  <div className="node-header">
                    <div className={`node-indicator ${ticker % (i + 2) === 0 ? 'active' : ''}`}></div>
                    <h5 className="text-blue-300">{agent.name}</h5>
                  </div>
                  <p className="font-mono text-xs mt-2 text-slate-400">{agent.role}</p>
                  <div className="node-activity mt-4">
                    <div className="text-[10px] text-blue-500 mb-1 font-mono uppercase tracking-widest">Compute Load</div>
                    <div className="progress-bar">
                      <div className="fill shadow-blue-500/50 shadow-lg" style={{ width: `${60 + (Math.sin(ticker + i) * 20)}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .intel-dashboard {
          max-width: 1000px;
          margin: 60px auto;
          background: rgba(10, 15, 26, 0.7);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(24px);
          overflow: hidden;
          color: #1c1915;
          font-family: 'Inter', sans-serif;
          position: relative;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.1), inset 0 0 20px rgba(59, 130, 246, 0.05);
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .bg-canvas {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .scanline {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
          z-index: 5;
          pointer-events: none;
        }

        .dashboard-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10,15,26,0) 0%, rgba(10,15,26,0.8) 100%);
          z-index: 2;
          pointer-events: none;
        }

        .futuristic-border {
          position: relative;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.2);
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
        }

        .corner-accent {
          position: absolute;
          width: 8px; height: 8px;
          border-color: #d6603a;
          border-style: solid;
        }
        .top-left { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .bottom-right { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          background: rgba(10, 15, 26, 0.8);
          flex-wrap: wrap;
          gap: 12px;
        }
        .dh-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dh-status-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d6603a;
          box-shadow: 0 0 10px #d6603a, 0 0 20px #d6603a;
          animation: pulse 2s infinite;
          transition: background 0.4s, box-shadow 0.4s;
        }
        .dh-status-pulse.live {
          background: #2f9e78;
          box-shadow: 0 0 10px #2f9e78, 0 0 20px #2f9e78;
        }
        .dh-status-pulse.standby {
          background: #f59e0b;
          box-shadow: 0 0 10px #f59e0b;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .live-badge {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: rgba(74, 222, 128, 0.15);
          color: #2f9e78;
          border: 1px solid rgba(74, 222, 128, 0.4);
          padding: 2px 8px;
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }

        .dh-left h2 {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #4c6fb0;
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        .dh-nav {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 4px;
          display: flex;
          overflow: hidden;
        }
        .dh-nav button {
          background: transparent;
          border: none;
          color: #6f685c;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .dh-nav button:hover {
          color: #4c6fb0;
          background: rgba(59, 130, 246, 0.1);
        }
        .dh-nav button.active {
          background: rgba(59, 130, 246, 0.2);
          color: #3b6bb0;
          box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.2);
        }

        .dash-body {
          padding: 32px;
          min-height: 380px;
        }
        .radar-view {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }
        .rv-main h3, .agent-view h3, .analytics-view h3 {
          margin-top: 0;
          color: #5b7cbb;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 1rem;
          margin-bottom: 24px;
        }

        .feed-container {
          padding: 20px;
          height: 280px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          scroll-behavior: smooth;
        }
        .feed-container::-webkit-scrollbar { width: 4px; }
        .feed-container::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.3); border-radius: 2px; }

        .feed-waiting {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #6f685c;
          text-align: center;
          padding: 60px 0;
          animation: blink 1.5s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0.3; } }

        .feed-item {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          padding: 6px 10px;
          background: rgba(0,0,0,0.25);
          border-left: 2px solid rgba(59,130,246,0.4);
          display: flex;
          gap: 16px;
          animation: typeIn 0.3s ease forwards;
          opacity: 0;
          color: #575047;
          word-break: break-all;
        }
        .feed-item.sys-log { 
          border-left-color: rgba(74, 222, 128, 0.5);
          color: #2f9e78;
        }
        .feed-item.err-log { 
          border-left-color: rgba(248, 113, 113, 0.5);
          color: #d46b6b;
        }
        @keyframes typeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .terminal-text { word-break: break-all; }

        .stat-card {
          padding: 20px;
          margin-bottom: 16px;
        }
        .stat-card h4, .agent-node h5 {
          margin: 0;
          font-family: var(--font-mono);
          color: #575047;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .big-num {
          font-family: var(--font-mono);
          font-size: 2.2rem;
          font-weight: 300;
          line-height: 1;
          text-shadow: 0 0 20px currentColor;
        }
        .sub-num {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #3a342c;
          margin-top: 8px;
        }

        /* Domain Analytics */
        .analytics-view { width: 100%; }
        .domain-chart {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .domain-row {
          display: grid;
          grid-template-columns: 140px 1fr 40px;
          align-items: center;
          gap: 16px;
          animation: typeIn 0.4s ease forwards;
          opacity: 0;
        }
        .domain-label {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #575047;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .domain-bar-track {
          height: 6px;
          background: rgba(40,34,26,0.05);
          border-radius: 3px;
          overflow: hidden;
        }
        .domain-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .domain-count {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #3b6bb0;
          text-align: right;
        }
        .analytics-footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid rgba(59, 130, 246, 0.1);
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: #3a342c;
        }

        /* Agents */
        .agent-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .agent-node {
          padding: 24px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .agent-node:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
        }
        .node-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .node-indicator {
          width: 8px; height: 8px;
          background: transparent;
          border: 1px solid #d6603a;
          transition: all 0.2s ease;
          border-radius: 50%;
        }
        .node-indicator.active { 
          background: #d6603a; 
          box-shadow: 0 0 10px #d6603a; 
        }

        .progress-bar {
          height: 2px; background: rgba(59, 130, 246, 0.1);
          overflow: hidden;
        }
        .progress-bar .fill {
          height: 100%; background: #d6603a; transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        @media (max-width: 768px) {
          .radar-view, .agent-grid { grid-template-columns: 1fr; }
          .dh-nav { width: 100%; justify-content: center; }
          .dash-header { flex-direction: column; gap: 12px; }
          .domain-row { grid-template-columns: 100px 1fr 32px; }
        }
      `}</style>
    </div>
  )
}
