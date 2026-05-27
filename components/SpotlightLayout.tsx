'use client'

import { useRef, useEffect, useCallback } from 'react'

interface SpotlightLayoutProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  goldIntensity?: number  // 0-1, default 0.12
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
  const lastPos = useRef({ x: 50, y: 50 })

  const handlePointerMove = useCallback((e: PointerEvent) => {
    // Cancel any pending frame to avoid queuing
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!spotlightRef.current) return

      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100

      // Write directly to CSS custom properties — no React state, no re-render
      spotlightRef.current.style.setProperty('--sx', `${x}%`)
      spotlightRef.current.style.setProperty('--sy', `${y}%`)

      lastPos.current = { x, y }
      rafRef.current = null
    })
  }, [])

  const handlePointerLeave = useCallback(() => {
    // Smoothly fade spotlight to center when cursor leaves
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }
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

    // Use passive listener for maximum scroll performance
    container.addEventListener('pointermove', handlePointerMove, { passive: true })
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true })

    // Set initial position
    if (spotlightRef.current) {
      spotlightRef.current.style.setProperty('--sx', '50%')
      spotlightRef.current.style.setProperty('--sy', '40%')
    }

    return () => {
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [handlePointerMove, handlePointerLeave])

  return (
    <div
      ref={containerRef}
      className={`spotlight-container ${className}`}
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        ...style,
      }}
    >
      {/* Spotlight layer — purely aesthetic, never intercepts events */}
      <div
        ref={spotlightRef}
        className="spotlight-layer"
        style={{
          background: `radial-gradient(
            ellipse 80vh 80vh at var(--sx, 50%) var(--sy, 40%),
            rgba(217, 119, 6, ${goldIntensity}) 0%,
            rgba(245, 158, 11, ${goldIntensity * 0.4}) 20%,
            rgba(6, 78, 59, ${goldIntensity * 0.3}) 45%,
            transparent 70%
          )`,
        }}
      />

      {/* Ambient corner glows — static, no JS needed */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 40% 40% at 0% 0%, rgba(217,119,6,0.04) 0%, transparent 100%),
          radial-gradient(ellipse 30% 30% at 100% 100%, rgba(16,185,129,0.04) 0%, transparent 100%)
        `,
      }} />

      {/* Content — sits above spotlight */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}