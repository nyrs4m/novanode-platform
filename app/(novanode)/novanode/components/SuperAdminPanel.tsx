'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/database.types'
import {
  Shield, Building2, DollarSign, Users2,
  ShoppingBag, ToggleLeft, ToggleRight,
  AlertTriangle, CheckCircle, LogOut,
  TrendingUp, Settings, Plus, ChevronRight,
  Loader2, X
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type Restaurant = Tables<'restaurants'>
type DailyLedger = Tables<'daily_ledger'>

interface SuperAdminPanelProps {
  adminEmail: string
  restaurants: Restaurant[]
  ledgers: DailyLedger[]
  totalOrders: number
  totalSessions: number
}

type Tab = 'overview' | 'restaurants' | 'ledger' | 'onboard'

export default function SuperAdminPanel({
  adminEmail,
  restaurants,
  ledgers,
  totalOrders,
  totalSessions,
}: SuperAdminPanelProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [restaurantList, setRestaurantList] = useState(restaurants)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [showOnboard, setShowOnboard] = useState(false)
  const [onboardForm, setOnboardForm] = useState({
    name: '', slug: '', currency: 'GHS',
    session_fee: '1.00', closing_time: '22:00',
    staff_email: '', staff_password: '',
  })
  const [onboarding, setOnboarding] = useState(false)
  const [feeForm, setFeeForm] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  const totalOwedToday = ledgers
    .filter(l => !l.is_paid)
    .reduce((s, l) => s + Number(l.total_owed ?? 0), 0)

  const overdueRestaurants = restaurantList.filter(r => r.payment_overdue)

  async function toggleSuspend(restaurant: Restaurant) {
    setUpdatingId(restaurant.id)
    const newActive = !restaurant.is_active
    const { error } = await supabase
      .from('restaurants')
      .update({
        is_active: newActive,
        suspended_at: newActive ? null : new Date().toISOString(),
        suspension_reason: newActive ? null : 'Suspended by NovaNode admin',
      })
      .eq('id', restaurant.id)

    if (!error) {
      setRestaurantList(prev => prev.map(r =>
        r.id === restaurant.id ? { ...r, is_active: newActive } : r
      ))
    }
    setUpdatingId(null)
  }

  async function updateSessionFee(restaurantId: string) {
    const fee = parseFloat(feeForm[restaurantId])
    if (isNaN(fee) || fee < 0) { alert('Invalid fee'); return }
    setUpdatingId(restaurantId)
    const { error } = await supabase
      .from('restaurants')
      .update({ session_fee: fee })
      .eq('id', restaurantId)
    if (!error) {
      setRestaurantList(prev => prev.map(r =>
        r.id === restaurantId ? { ...r, session_fee: fee } : r
      ))
      setFeeForm(prev => { const n = { ...prev }; delete n[restaurantId]; return n })
    }
    setUpdatingId(null)
  }

  async function clearOverdue(restaurantId: string) {
    await supabase.from('restaurants')
      .update({ payment_overdue: false })
      .eq('id', restaurantId)
    setRestaurantList(prev => prev.map(r =>
      r.id === restaurantId ? { ...r, payment_overdue: false } : r
    ))
  }

  async function onboardRestaurant() {
    if (!onboardForm.name || !onboardForm.slug || !onboardForm.staff_email || !onboardForm.staff_password) {
      alert('All fields are required'); return
    }
    setOnboarding(true)
    try {
      // 1. Create restaurant
      const { data: newRestaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: onboardForm.name,
          slug: onboardForm.slug.toLowerCase().replace(/\s+/g, '-'),
          currency: onboardForm.currency,
          session_fee: parseFloat(onboardForm.session_fee),
          is_active: true,
        })
        .select().single()

      if (restError) throw restError

      // 2. Create staff account via admin
      const res = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: onboardForm.staff_email,
          password: onboardForm.staff_password,
          restaurant_id: newRestaurant.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to create staff account')

      setRestaurantList(prev => [newRestaurant, ...prev])
      setOnboardForm({ name: '', slug: '', currency: 'GHS', session_fee: '1.00', closing_time: '22:00', staff_email: '', staff_password: '' })
      setTab('restaurants')
      alert(`${newRestaurant.name} onboarded successfully!`)
    } catch (err) {
      console.error(err)
      alert('Onboarding failed. Check console for details.')
    } finally {
      setOnboarding(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/novanode/login')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'var(--cream-06)',
    border: '1px solid var(--cream-15)',
    borderRadius: 12, color: 'var(--cream)',
    fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', color: 'var(--cream-35)',
    fontSize: 11, fontWeight: 700,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, sans-serif' }}>

      {/* HEADER */}
      <header className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-glow)' }}>
            <Shield size={20} />
          </div>
          <div>
            <p className="t-title" style={{ fontSize: 15 }}>NovaNode Inc.</p>
            <p className="t-eyebrow">Super Admin · {adminEmail}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {overdueRestaurants.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '6px 12px' }}>
              <AlertTriangle size={14} color="#f87171" />
              <span style={{ color: '#f87171', fontSize: 12, fontWeight: 700 }}>{overdueRestaurants.length} overdue</span>
            </div>
          )}
          <button className="btn-icon" onClick={handleLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, borderBottom: '1px solid var(--gold-dim)', background: 'rgba(2,44,34,0.6)', overflowX: 'auto' }} className="scrollbar-hide">
        {([
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={15} /> },
          { id: 'restaurants', label: 'Restaurants', icon: <Building2 size={15} /> },
          { id: 'ledger', label: 'Ledger', icon: <DollarSign size={15} /> },
          { id: 'onboard', label: 'Onboard', icon: <Plus size={15} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 12, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, border: tab === t.id ? 'none' : '1px solid var(--cream-15)', background: tab === t.id ? 'linear-gradient(135deg, var(--gold-glow), var(--gold))' : 'var(--cream-06)', color: tab === t.id ? '#1a0e00' : 'var(--cream-35)', transition: 'all 0.2s' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Active Restaurants', value: String(restaurantList.filter(r => r.is_active).length), icon: <Building2 size={20} />, sub: `${restaurantList.length} total` },
                { label: "Today's Platform Revenue", value: `GHS ${totalOwedToday.toFixed(2)}`, icon: <DollarSign size={20} />, sub: 'from completed sessions' },
                { label: 'Total Orders', value: String(totalOrders), icon: <ShoppingBag size={20} />, sub: 'all time' },
                { label: 'Total Sessions', value: String(totalSessions), icon: <Users2 size={20} />, sub: 'all time' },
              ].map(card => (
                <div key={card.label} className="dash-stat-card">
                  <div className="dash-stat-glow" />
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold-glow)', marginBottom: 12 }}>
                    {card.icon}
                  </div>
                  <p className="t-heading" style={{ fontSize: 22, marginBottom: 4 }}>{card.value}</p>
                  <p className="t-caption" style={{ marginBottom: 2 }}>{card.label}</p>
                  <p className="t-eyebrow" style={{ fontSize: 10, opacity: 0.7 }}>{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Overdue alerts */}
            {overdueRestaurants.length > 0 && (
              <div className="dash-section">
                <div className="dash-section-head">
                  <AlertTriangle size={17} color="#f87171" />
                  <span className="t-title" style={{ fontSize: 15, color: '#f87171' }}>Payment Overdue</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {overdueRestaurants.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 16px' }}>
                      <div>
                        <p className="t-title" style={{ fontSize: 14 }}>{r.name}</p>
                        <p className="t-caption">/{r.slug}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => clearOverdue(r.id)} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                          Mark Resolved
                        </button>
                        <button onClick={() => toggleSuspend(r)} disabled={updatingId === r.id} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                          Suspend
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESTAURANTS */}
        {tab === 'restaurants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {restaurantList.map(r => {
              const ledger = ledgers.find(l => l.restaurant_id === r.id)
              return (
                <div key={r.id} style={{ background: 'var(--surface)', border: `1px solid ${r.is_active ? 'var(--gold-dim)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 20, padding: 18, boxShadow: 'var(--shadow-card)', opacity: r.is_active ? 1 : 0.7 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p className="t-title" style={{ fontSize: 16 }}>{r.name}</p>
                        {!r.is_active && <span style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 50 }}>SUSPENDED</span>}
                        {r.payment_overdue && <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--gold-dim)', color: 'var(--gold-glow)', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 50 }}>OVERDUE</span>}
                      </div>
                      <p className="t-caption">/{r.slug} · {r.currency}</p>
                      {ledger && (
                        <p className="t-caption" style={{ marginTop: 3 }}>
                          Today: {ledger.completed_sessions} sessions · {r.currency} {Number(ledger.total_owed).toFixed(2)} owed
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleSuspend(r)}
                      disabled={updatingId === r.id}
                      style={{ padding: '8px 16px', borderRadius: 10, background: r.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: `1px solid ${r.is_active ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.3)'}`, color: r.is_active ? '#f87171' : '#34d399', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                    >
                      {updatingId === r.id ? <Loader2 size={13} className="animate-spin" /> : r.is_active ? <><ToggleRight size={14} /> Active</> : <><ToggleLeft size={14} /> Suspended</>}
                    </button>
                  </div>

                  <div className="divider" style={{ marginBottom: 14 }} />

                  {/* Session fee editor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p className="t-caption" style={{ marginBottom: 6 }}>Session Fee ({r.currency})</p>
                      <input
                        type="number"
                        step="0.50"
                        style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
                        value={feeForm[r.id] ?? String(r.session_fee ?? 1.00)}
                        onChange={e => setFeeForm(prev => ({ ...prev, [r.id]: e.target.value }))}
                      />
                    </div>
                    {feeForm[r.id] !== undefined && (
                      <button
                        onClick={() => updateSessionFee(r.id)}
                        disabled={updatingId === r.id}
                        style={{ marginTop: 22, padding: '9px 16px', background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)', borderBottom: '3px solid #92400e', borderRadius: 10, cursor: 'pointer', color: 'var(--gold-glow)', fontSize: 12, fontWeight: 800, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                      >
                        <CheckCircle size={13} /> Save Fee
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* LEDGER */}
        {tab === 'ledger' && (
          <div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-dim)', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p className="t-eyebrow" style={{ marginBottom: 4 }}>Today's Platform Revenue</p>
                  <p className="t-price" style={{ fontSize: 32 }}>GHS {totalOwedToday.toFixed(2)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="t-caption">{new Date().toLocaleDateString()}</p>
                  <p className="t-caption" style={{ marginTop: 3 }}>{ledgers.filter(l => !l.is_paid).length} unpaid</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {restaurantList.map(r => {
                const ledger = ledgers.find(l => l.restaurant_id === r.id)
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', border: '1px solid var(--cream-06)', borderRadius: 14, padding: '14px 16px' }}>
                    <div>
                      <p className="t-title" style={{ fontSize: 14 }}>{r.name}</p>
                      <p className="t-caption">
                        {ledger ? `${ledger.completed_sessions} sessions` : 'No activity today'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="t-price-sm">
                        {r.currency} {ledger ? Number(ledger.total_owed).toFixed(2) : '0.00'}
                      </p>
                      {ledger && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: ledger.is_paid ? '#34d399' : 'var(--gold-glow)' }}>
                          {ledger.is_paid ? '✓ PAID' : 'UNPAID'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ONBOARD */}
        {tab === 'onboard' && (
          <div style={{ maxWidth: 600 }}>
            <div className="dash-section">
              <div className="dash-section-head">
                <Plus size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>Onboard New Restaurant</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Restaurant Name *</label>
                  <input style={inputStyle} placeholder="e.g. Starbite Kitchen"
                    value={onboardForm.name} onChange={e => setOnboardForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
                </div>
                <div>
                  <label style={labelStyle}>URL Slug *</label>
                  <input style={inputStyle} placeholder="e.g. starbite-kitchen"
                    value={onboardForm.slug} onChange={e => setOnboardForm(f => ({ ...f, slug: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={onboardForm.currency}
                    onChange={e => setOnboardForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="GHS">GHS — Ghana Cedi</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Session Fee</label>
                  <input style={inputStyle} type="number" step="0.50" placeholder="1.00"
                    value={onboardForm.session_fee} onChange={e => setOnboardForm(f => ({ ...f, session_fee: e.target.value }))} />
                </div>
              </div>

              <div className="divider" style={{ margin: '16px 0' }} />
              <p className="t-eyebrow" style={{ marginBottom: 14 }}>Admin Staff Account</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={labelStyle}>Staff Email *</label>
                  <input style={inputStyle} type="email" placeholder="admin@restaurant.com"
                    value={onboardForm.staff_email} onChange={e => setOnboardForm(f => ({ ...f, staff_email: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Staff Password *</label>
                  <input style={inputStyle} type="password" placeholder="Min 8 characters"
                    value={onboardForm.staff_password} onChange={e => setOnboardForm(f => ({ ...f, staff_password: e.target.value }))} />
                </div>
              </div>

              <button className="btn-primary" onClick={onboardRestaurant} disabled={onboarding}>
                {onboarding ? <><Loader2 size={16} className="animate-spin" /> Onboarding...</> : <><Plus size={16} /> Onboard Restaurant</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}