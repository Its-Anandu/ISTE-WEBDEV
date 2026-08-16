'use client'

import React, { useState, useEffect } from 'react'

export default function AliveClock() {
  const [time, setTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [mounted])

  if (!mounted) return <div className="alive-clock-placeholder" />

  return (
    <div className="flex items-center gap-4 text-[0.65rem] font-mono tracking-widest text-[#6f685c] uppercase mt-8 pt-6 border-t border-[#594c3c]/15 w-full justify-between">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        System Online
      </div>
      <div className="tracking-[0.2em]">{time}</div>
    </div>
  )
}
