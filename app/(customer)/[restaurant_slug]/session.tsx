'use client'
import SpotlightLayout from '@/components/SpotlightLayout'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateFingerprint } from '@/lib/fingerprint'
import { getStoredToken, storeToken, generateToken } from '@/lib/session'
import { Tables } from '@/types/database.types'
import { Loader2, Users, ChevronRight, Minus, Plus } from 'lucide-react'

type Restaurant = Tables<'restaurants'>
type MenuItem = Tables<'menu_items'>

interface SessionScreenProps {
  restaurant: Restaurant
  tableNumber: string
  starters: MenuItem[]
  onSessionReady: (sessionToken: string, customerName: string) => void
}

type Step = 'welcome' | 'starters'

export default function SessionScreen({
  restaurant,
  tableNumber,
  starters,
  onSessionReady,
}: SessionScreenProps) {
  const [step, setStep] = useState<Step>('welcome')
  const [customerName, setCustomerName] = useState('')
  const [nameError, setNameError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [starterSelections, setStarterSelections] = useState<Record<string, number>>({})
  const [liveStarters, setLiveStarters] = useState(starters)
  const [existingSession, setExistingSession] = useState<string | null>(null)
  const [existingName, setExistingName] = useState('')

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => { checkExistingSession() }, [])

  useEffect(() => {
    const channel = supabase
      .channel(`session-starters-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'menu_items',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Pick<MenuItem, 'id'>
            setLiveStarters((prev) => prev.filter((item) => item.id !== deleted.id))
            setStarterSelections((prev) => {
              const next = { ...prev }
              delete next[deleted.id]
              return next
            })
            return
          }

          const updated = payload.new as MenuItem
          if (!updated.is_starter) {
            setLiveStarters((prev) => prev.filter((item) => item.id !== updated.id))
            setStarterSelections((prev) => {
              const next = { ...prev }
              delete next[updated.id]
              return next
            })
            return
          }

          setLiveStarters((prev) => {
            if (prev.some((item) => item.id === updated.id)) {
              return prev.map((item) => item.id === updated.id ? updated : item)
            }
            return [...prev, updated]
          })

          if (updated.is_available === false) {
            setStarterSelections((prev) => {
              const next = { ...prev }
              delete next[updated.id]
              return next
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurant.id, supabase])

  async function checkExistingSession() {
    setCheckingSession(true)
    const storedToken = getStoredToken()

    if (storedToken) {
      const { data: session } = await supabase
        .from('table_sessions').select('*')
        .eq('session_token', storedToken)
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true).maybeSingle()
      if (session) {
        onSessionReady(session.session_token, session.customer_name)
        return
      }
    }

    const { data: tableSession } = await supabase
      .from('table_sessions').select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('table_number', tableNumber)
      .eq('is_active', true).maybeSingle()

    if (tableSession) {
      setExistingSession(tableSession.session_token)
      setExistingName(tableSession.customer_name)
      storeToken(tableSession.session_token)
    }
    setCheckingSession(false)
  }

  async function handleNameSubmit() {
    if (!customerName.trim()) { setNameError('Please enter your name to continue'); return }
    if (customerName.trim().length < 2) { setNameError('Name must be at least 2 characters'); return }
    setLoading(true); setNameError('')
    try {
      const token = generateToken()
      const fingerprint = generateFingerprint()
      const { error } = await supabase.from('table_sessions').insert({
        restaurant_id: restaurant.id,
        table_number: tableNumber,
        customer_name: customerName.trim(),
        session_token: token,
        browser_fingerprint: fingerprint,
        is_active: true,
      }).select().single()
      if (error) { await checkExistingSession(); return }
      storeToken(token)
      if (liveStarters.length > 0) { setStep('starters') }
      else { onSessionReady(token, customerName.trim()) }
    } catch { setNameError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleStartersSubmit() {
    setLoading(true)
    const token = getStoredToken()!
    const selected = Object.entries(starterSelections)
      .filter(([, qty]) => qty > 0)
      .filter(([id]) => liveStarters.some((s) => s.id === id && s.is_available !== false))
      .map(([id, quantity]) => {
        const item = liveStarters.find((s) => s.id === id)!
        return { id: item.id, name: item.name_en, price: item.price, quantity }
      })
    if (selected.length > 0) {
      const total = selected.reduce((sum, i) => sum + i.price * i.quantity, 0)
      await supabase.from('orders').insert({
        restaurant_id: restaurant.id,
        table_number: tableNumber,
        customer_name: customerName.trim(),
        session_token: token,
        items: selected,
        total_amount: total,
        status: 'Pending',
        is_starter_order: true,
      })
    }
    onSessionReady(token, customerName.trim())
    setLoading(false)
  }

  function adjustStarter(id: string, delta: number) {
    const item = liveStarters.find((s) => s.id === id)
    if (delta > 0 && item?.is_available === false) return

    setStarterSelections((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta)
      return { ...prev, [id]: next }
    })
  }

  // ── CHECKING ──
  if (checkingSession) {
    return (
      <SpotlightLayout>
      <div className="checking-page">
        <div className="spinner" />
        <p className="t-caption">Checking your table...</p>
      </div>
      </SpotlightLayout>
    )
  }

  // ── TABLE OCCUPIED ──
  if (existingSession) {
    return (
      <SpotlightLayout>
      <div className="occupied-page">
        <div className="ambient-gold" style={{ width: 300, height: 300, top: -80, left: -80 }} />
        <div className="occupied-inner">
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'var(--gold-faint)',
            border: '1px solid var(--gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Users size={32} color="var(--gold-glow)" />
          </div>
          <p className="t-eyebrow" style={{ marginBottom: 8 }}>Table {tableNumber}</p>
          <h2 className="t-heading" style={{ marginBottom: 12 }}>Welcome back!</h2>
          <p className="t-body" style={{ marginBottom: 32, textAlign: 'center' }}>
            This table has an active order under{' '}
            <strong style={{ color: 'var(--cream)' }}>{existingName}</strong>.
            You&apos;ll be joined to their session.
          </p>
          <button
            className="btn-primary"
            onClick={() => onSessionReady(existingSession, existingName)}
          >
            View Our Order
            <ChevronRight size={18} />
          </button>
          <p className="t-caption" style={{ textAlign: 'center', marginTop: 20 }}>
            Not your table? Ask a staff member for help.
          </p>
        </div>
      </div>
      </SpotlightLayout>
    )
  }

  // ── WELCOME ──
  if (step === 'welcome') {
    return (
      <SpotlightLayout >
      <div className="session-page">
        <div className="ambient-gold" style={{ width: 400, height: 400, top: -120, left: -120 }} />
        <div className="ambient-emerald" style={{ width: 300, height: 300, bottom: -80, right: -80 }} />

        <div className="session-inner">
          {/* Restaurant Identity */}
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div className="session-logo">
              {restaurant.logo_url
                ? <img src={restaurant.logo_url} alt={restaurant.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32 }}>🍽️</span>
              }
            </div>
            <h1 className="t-display" style={{ marginBottom: 8 }}>{restaurant.name}</h1>
            <p className="t-eyebrow">✦ Table {tableNumber} ✦</p>
          </div>

          {/* Divider */}
          <div className="divider" style={{ marginBottom: 32 }} />

          {/* Name Input */}
          <div style={{ marginBottom: 8 }}>
            <label className="nn-label">Your name</label>
            <input
              type="text"
              placeholder="e.g. Kwame"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); setNameError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
              className={`nn-input ${nameError ? 'error' : ''}`}
            />
            {nameError && <p className="nn-error">{nameError}</p>}
          </div>
          <p className="nn-hint" style={{ marginBottom: 32 }}>
            We use your name to keep your order together and compile your final bill.
          </p>

          <button
            className="btn-primary"
            onClick={handleNameSubmit}
            disabled={loading}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Setting up...</>
              : <>See the Menu <ChevronRight size={18} /></>
            }
          </button>
        </div>
      </div>
      </SpotlightLayout>
    )
  }

  // ── STARTERS ──
  if (step === 'starters') {
    const starterTotal = Object.entries(starterSelections).reduce((sum, [id, qty]) => {
      const item = liveStarters.find((s) => s.id === id)
      return sum + (item ? item.price * qty : 0)
    }, 0)
    const hasSelections = Object.values(starterSelections).some((q) => q > 0)

    return (
      <SpotlightLayout>      <div className="starters-page">
        <div className="starters-head">
          <p className="t-eyebrow" style={{ marginBottom: 8 }}>While you decide</p>
          <h2 className="t-heading" style={{ marginBottom: 8 }}>Something to start?</h2>
          <p className="t-body">Served immediately — separate from your main order.</p>
        </div>

        <div className="starters-list">
          {liveStarters.map((item) => {
            const qty = starterSelections[item.id] ?? 0
            const unavailable = item.is_available === false
            return (
              <div key={item.id} className={`starter-row ${qty > 0 ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}>
                <div className="starter-thumb">
                  <img src={item.image_url} alt={item.name_en} />
                  {unavailable && (
                    <div className="sold-overlay">
                      <span className="badge-red">Sold Out</span>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t-title" style={{ fontSize: 15, marginBottom: 3 }}>{item.name_en}</p>
                  {item.description_en && (
                    <p className="t-body" style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
                      {item.description_en}
                    </p>
                  )}
                  <p className="t-price-sm">{restaurant.currency} {item.price.toFixed(2)}</p>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {unavailable ? (
                    <span className="t-caption">Unavailable</span>
                  ) : qty > 0 ? (
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => adjustStarter(item.id, -1)}>
                        <Minus size={14} />
                      </button>
                      <span className="qty-num">{qty}</span>
                      <button className="qty-btn" onClick={() => adjustStarter(item.id, 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-ghost"
                      style={{ padding: '8px 16px', fontSize: 12 }}
                      onClick={() => adjustStarter(item.id, 1)}
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="starters-foot">
          {hasSelections && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="t-caption">Starters total</span>
              <span className="t-price">{restaurant.currency} {starterTotal.toFixed(2)}</span>
            </div>
          )}
          <button
            className="btn-primary"
            onClick={handleStartersSubmit}
            disabled={loading}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Placing...</>
              : hasSelections
                ? <>Order Starters & See Menu <ChevronRight size={18} /></>
                : <>Skip, See Menu <ChevronRight size={18} /></>
            }
          </button>
        </div>
      </div>
      </SpotlightLayout>
    )
  }

  return null
}
