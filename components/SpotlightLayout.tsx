'use client'

import { useRef, useEffect, useCallback } from 'react'

interface SpotlightLayoutProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  goldIntensity?: number
}

export default function SpotlightLayout({
  children,
  className = '',
  style,
  goldIntensity = 0.12,
}: SpotlightLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!spotlightRef.current) return
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      spotlightRef.current.style.setProperty('--sx', `${x}%`)
      spotlightRef.current.style.setProperty('--sy', `${y}%`)
      rafRef.current = null
    })
  }, [])

  const handlePointerLeave = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      if (!spotlightRef.current) return
      spotlightRef.current.style.setProperty('--sx', '50%')
      spotlightRef.current.style.setProperty('--sy', '40%')
      rafRef.current = null
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('pointermove', handlePointerMove, { passive: true })
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    if (spotlightRef.current) {
      spotlightRef.current.style.setProperty('--sx', '50%')
      spotlightRef.current.style.setProperty('--sy', '40%')
    }
    return () => {
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [handlePointerMove, handlePointerLeave])

  return (
    <div
      ref={containerRef}
      className={`spotlight-container ${className}`}
      style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative', ...style }}
    >
      {/* Spotlight layer — pointer-events: none so it never blocks clicks */}
      <div
        ref={spotlightRef}
        style={{
          position: 'fixed', inset: 0,
          pointerEvents: 'none', zIndex: 0,
          willChange: 'background',
          background: `radial-gradient(
            ellipse 70vh 70vh at var(--sx, 50%) var(--sy, 40%),
            rgba(217,119,6,${goldIntensity}) 0%,
            rgba(245,158,11,${goldIntensity * 0.35}) 25%,
            color-mix(in srgb, var(--theme-surface) ${goldIntensity * 20}%, transparent) 50%,
            transparent 70%
          )`,
        }}
      />
      {/* Static ambient corners */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 35% 35% at 0% 0%, rgba(217,119,6,0.05) 0%, transparent 100%),
          radial-gradient(ellipse 25% 25% at 100% 100%, rgba(16,185,129,0.04) 0%, transparent 100%)
        `,
      }} />
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}