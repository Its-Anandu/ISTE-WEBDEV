'use client'
import React, { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useBrain } from '../brain/BrainProvider'
import gsap from 'gsap'

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const brain = useBrain()
  const notifyEngine = brain.notifyEngine
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const isTouch = typeof window !== 'undefined' && (window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) {
      if (dotRef.current) dotRef.current.style.display = 'none';
      if (ringRef.current) ringRef.current.style.display = 'none';
      return;
    }

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let isHovering = false
    let idleTimer: NodeJS.Timeout
    let isIdle = false
    
    let magneticEl: HTMLElement | null = null

    // High-performance GSAP setters (skips React state and normal CSS parsing overhead)
    const setRingX = gsap.quickSetter(ring, "x", "px")
    const setRingY = gsap.quickSetter(ring, "y", "px")
    const setRingRotation = gsap.quickSetter(ring, "rotation", "deg")
    const setRingScaleX = gsap.quickSetter(ring, "scaleX")
    const setRingScaleY = gsap.quickSetter(ring, "scaleY")
    const setDotX = gsap.quickSetter(dot, "x", "px")
    const setDotY = gsap.quickSetter(dot, "y", "px")

    // Force initial zero transforms
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, transformOrigin: "center center" })

    // Idle Breathing Animation
    const breathingAnim = gsap.to(ring, {
      scaleX: 1.15,
      scaleY: 1.15,
      opacity: 0.6,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      paused: true
    })

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      
      // Instant Dot (xPercent -50 handles centering)
      setDotX(mouseX)
      setDotY(mouseY)

      // Handle Idle state recovery
      if (isIdle) {
        isIdle = false
        breathingAnim.pause(0)
        gsap.to(ring, { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.3, overwrite: "auto" })
      }
      
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (!isHovering) {
          isIdle = true
          breathingAnim.play()
        }
      }, 2000)

      // Magnetic Pull Logic (Moves the actual button toward the cursor)
      if (magneticEl) {
        const rect = magneticEl.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const distanceX = mouseX - centerX
        const distanceY = mouseY - centerY
        
        // 0.3 multiplier dictates the strength of the magnetic pull
        gsap.to(magneticEl, {
          x: distanceX * 0.3,
          y: distanceY * 0.3,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto"
        })
      }
    }

    const onMouseEnter = (e: Event) => {
      isHovering = true
      isIdle = false
      breathingAnim.pause(0)
      clearTimeout(idleTimer)
      
      const el = e.currentTarget as HTMLElement
      magneticEl = el
      
      // Expand and fill the ring
      gsap.to(dot, { opacity: 0, duration: 0.2, overwrite: "auto" })
      gsap.to(ring, { 
        width: 52, 
        height: 52, 
        backgroundColor: 'rgba(255, 255, 255, 1)', 
        border: '0px solid rgba(255, 255, 255, 0)',
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        duration: 0.4,
        ease: "back.out(1.5)",
        overwrite: "auto"
      })

      notifyEngine('Cursor', 'snap')

      if (el.tagName === 'A') {
        const href = el.getAttribute('href')
        if (href && href.startsWith('/')) {
          notifyEngine('Prefetch', 'predictive_route', { url: href })
          router.prefetch(href)
        }
      }
    }

    const onMouseLeave = (e: Event) => {
      isHovering = false
      const el = e.currentTarget as HTMLElement
      if (magneticEl === el) {
        // Snap back magnetic element like a rubber band
        gsap.to(magneticEl, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" })
        magneticEl = null
      }
      
      // Shrink ring back to normal
      gsap.to(dot, { opacity: 1, duration: 0.2, overwrite: "auto" })
      gsap.to(ring, { 
        width: 36, 
        height: 36, 
        backgroundColor: 'rgba(255, 255, 255, 0)', 
        border: '1px solid rgba(255, 255, 255, 0.5)',
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto"
      })
    }

    let interactables: NodeListOf<Element> | null = null

    // Attach to highly interactive elements after hydration frame
    requestAnimationFrame(() => {
      interactables = document.querySelectorAll('a, button, input, textarea, .execom-card, .junior-card, .team-card, .event-row, .benefit-card, .assistant-dock-btn, .internship-card, .intern-apply-btn, .launchpad-preview-card, .nav-logo')

      interactables.forEach(el => {
        const currentPos = window.getComputedStyle(el).position
        if (currentPos === 'static' && !el.classList.contains('nav-logo')) {
          (el as HTMLElement).style.position = 'relative'
        }
        el.addEventListener('mouseenter', onMouseEnter)
        el.addEventListener('mouseleave', onMouseLeave)
      })
    })


    const loop = () => {
      // Fluid physics lerp for the outer ring tracking the mouse
      const dx = mouseX - ringX
      const dy = mouseY - ringY
      
      ringX += dx * 0.15
      ringY += dy * 0.15
      
      setRingX(ringX)
      setRingY(ringY)

      // Velocity Stretching (only when not hovering over a magnetic element)
      if (!isHovering && !isIdle) {
        const velocity = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        
        // Dynamic velocity scaling (stretch limit cap at 0.6 extra)
        const scaleX = 1 + Math.min(velocity * 0.003, 0.6)
        const scaleY = 1 - Math.min(velocity * 0.002, 0.35)
        
        setRingRotation(angle)
        setRingScaleX(scaleX)
        setRingScaleY(scaleY)
      }

    }
    
    gsap.ticker.add(loop)
    window.addEventListener('mousemove', onMouseMove)

    // Hide native cursor site-wide
    const style = document.createElement('style')
    style.innerHTML = `* { cursor: none !important; }`
    document.head.appendChild(style)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      gsap.ticker.remove(loop)
      clearTimeout(idleTimer)
      breathingAnim.kill()
      
      if (interactables) {
        interactables.forEach(el => {
          el.removeEventListener('mouseenter', onMouseEnter)
          el.removeEventListener('mouseleave', onMouseLeave)
          gsap.killTweensOf(el)
        })
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [pathname, router, notifyEngine])

  return (
    <>
      <div 
        ref={dotRef}
        style={{
          position: 'fixed', top: 0, left: 0, width: '6px', height: '6px',
          background: 'white', borderRadius: '50%', pointerEvents: 'none',
          zIndex: 10001,
        }}
      />
      <div 
        ref={ringRef} 
        style={{
          position: 'fixed', top: 0, left: 0, width: '36px', height: '36px',
          border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '50%', pointerEvents: 'none',
          zIndex: 10000,
          boxSizing: 'border-box'
        }}
      />
    </>
  )
}
