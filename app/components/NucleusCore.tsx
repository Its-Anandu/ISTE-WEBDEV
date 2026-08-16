'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useBrain } from '../brain/BrainProvider'

export default function NucleusCore() {
  const brain = useBrain()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLowPerf, setIsLowPerf] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  // Wire to Performance Engine and OS Detection
  useEffect(() => {
    const t = setTimeout(() => {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent))
    }, 0)
    return () => clearTimeout(t)
    if (brain.perfMetrics.fps > 0 && brain.perfMetrics.fps < 30) {
      setIsLowPerf(true)
    } else {
      setIsLowPerf(false)
    }
  }, [brain.perfMetrics.fps])

  return (
    <div className="nucleus-wrapper" ref={containerRef}>
      <div className="about-code-label" style={{ position: 'absolute', top: 20, left: 24, zIndex: 10 }}>THE NUCLEUS</div>
      
      {isIOS ? (
        // iOS Alternate Section — Beautiful but lightweight 2D
        <div className="ios-nucleus-safe">
          <div className="ios-orb"></div>
          <div className="ios-ring"></div>
        </div>
      ) : (
        // Android / Desktop — Full 3D Experience
        <div className={`nucleus-scene ${isLowPerf ? 'perf-mode' : ''}`}>
          <div className="nucleus-core">
            <div className="n-ring n-ring-1"></div>
            <div className="n-ring n-ring-2"></div>
            <div className="n-ring n-ring-3"></div>
            
            <div className="n-center">
              <div className="n-center-glow"></div>
              <div className="n-center-solid"></div>
            </div>
            
            <div className="n-particles">
              <div className="n-particle p1"></div>
              <div className="n-particle p2"></div>
              <div className="n-particle p3"></div>
            </div>
          </div>
        </div>
      )}

      <div className="about-code-sub" style={{ position: 'absolute', bottom: 20, left: 24, zIndex: 10 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(var(--c-main), 1)', marginRight: 8, boxShadow: '0 0 10px rgba(var(--c-main), 0.8)' }}></span>
        {isIOS ? 'Origin · Lightweight Mode' : 'Origin · ISTE MBCET'}
      </div>

      <style jsx>{`
        .nucleus-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, rgba(20,20,25,0.8), rgba(10,10,12,0.9));
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* 3D Scene Setup */
        .nucleus-scene {
          width: 180px;
          height: 180px;
          perspective: 1000px;
          transform-style: preserve-3d;
        }

        .nucleus-core {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          will-change: transform;
          animation: coreFloat 8s ease-in-out infinite;
        }

        @keyframes coreFloat {
          0%, 100% { transform: translateY(0) rotateX(15deg) rotateY(-10deg); }
          50% { transform: translateY(-10px) rotateX(20deg) rotateY(10deg); }
        }

        /* Rings */
        .n-ring {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          border: 1px solid rgba(var(--c-main), 0.3);
          transform-style: preserve-3d;
          will-change: transform;
        }

        /* GPU Accelerated Hardware Transforms for 0 Lag */
        .n-ring-1 {
          border-width: 2px;
          border-color: rgba(var(--c-main), 0.6);
          border-left-color: transparent;
          border-right-color: transparent;
          animation: spinX 12s linear infinite;
          box-shadow: inset 0 0 20px rgba(var(--c-main), 0.1);
        }

        .n-ring-2 {
          border-width: 1px;
          border-color: rgba(var(--c-alt1), 0.5);
          border-top-color: transparent;
          border-bottom-color: transparent;
          width: 85%; height: 85%;
          margin: 7.5%;
          animation: spinY 8s linear infinite reverse;
        }

        .n-ring-3 {
          border-width: 1px;
          border-color: rgba(var(--c-main), 0.4);
          width: 70%; height: 70%;
          margin: 15%;
          border-style: dashed;
          animation: spinZ 15s linear infinite;
        }

        /* Pause animations if Performance Engine detects lag */
        .perf-mode .nucleus-core,
        .perf-mode .n-ring,
        .perf-mode .n-center-glow,
        .perf-mode .n-particle {
          animation-play-state: paused !important;
        }

        @keyframes spinX { 100% { transform: rotateX(360deg) rotateY(180deg); } }
        @keyframes spinY { 100% { transform: rotateY(360deg) rotateZ(180deg); } }
        @keyframes spinZ { 100% { transform: rotateZ(360deg) rotateX(180deg); } }

        /* The Center Orb */
        .n-center {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 30px; height: 30px;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .n-center-solid {
          position: absolute;
          inset: 0;
          background: rgba(var(--c-main), 1);
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(var(--c-main), 0.8), inset 0 0 10px rgba(255,255,255,0.8);
        }

        .n-center-glow {
          position: absolute;
          top: -15px; left: -15px; right: -15px; bottom: -15px;
          background: radial-gradient(circle, rgba(var(--c-main), 0.4) 0%, transparent 70%);
          border-radius: 50%;
          will-change: transform, opacity;
          animation: pulseGlow 3s ease-in-out infinite;
        }

        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 0.4; }
        }

        /* Orbiting Particles */
        .n-particles {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          will-change: transform;
          animation: spinZ 10s linear infinite;
        }

        .n-particle {
          position: absolute;
          width: 4px; height: 4px;
          background: rgb(var(--c-main));
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(var(--c-main), 0.7);
        }

        .p1 { top: 10%; left: 50%; }
        .p2 { bottom: 20%; right: 10%; }
        .p3 { top: 40%; left: 10%; }

        /* iOS Safe Mode Styles */
        .ios-nucleus-safe {
          position: relative;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ios-orb {
          position: absolute;
          width: 40px;
          height: 40px;
          background: rgba(var(--c-main), 1);
          border-radius: 50%;
          box-shadow: 0 0 30px rgba(var(--c-main), 0.8), inset 0 0 15px rgba(255,255,255,0.8);
          animation: iosPulse 4s ease-in-out infinite alternate;
        }

        .ios-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px dashed rgba(var(--c-main), 0.3);
          animation: iosSpin 20s linear infinite;
        }

        @keyframes iosPulse {
          0% { transform: scale(1); filter: brightness(1); }
          100% { transform: scale(1.1); filter: brightness(1.3); }
        }
        @keyframes iosSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
