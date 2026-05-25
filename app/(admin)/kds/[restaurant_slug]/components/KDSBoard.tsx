'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tables } from '@/types/database.types'
import {
  ChefHat, Bell, Droplets, Receipt, HandPlatter,
  CheckCircle, Clock, Flame, Package, Users2,
  DollarSign, ShoppingBag, ToggleLeft, ToggleRight,
  X, AlertTriangle, RefreshCw, LogOut
} from 'lucide-react'

type Restaurant = Tables<'restaurants'>
type Order = Tables<'orders'>
type Session = Tables<'table_sessions'>
type MenuItem = Tables<'menu_items'>

interface Signal {
  id: string
  restaurant_id: string | null
  table_number: string
  customer_name: string | null
  signal_type: string
  is_resolved: boolean | null
  created_at: string | null
}

interface KDSBoardProps {
  restaurant: Restaurant
  initialOrders: Order[]
  initialSessions: Session[]
  initialSignals: Signal[]
  menuItems: MenuItem[]
  todayRevenue: number
  todayCount: number
}

type KDSTab = 'orders' | 'signals' | 'stock' | 'tables'

const STATUS_FLOW = ['Pending', 'Preparing', 'Ready', 'Served'] as const
type OrderStatus = typeof STATUS_FLOW[number]

const STATUS_COLORS: Record<string, string> = {
  Pending:   'rgba(245,158,11,0.15)',
  Preparing: 'rgba(59,130,246,0.15)',
  Ready:     'rgba(16,185,129,0.15)',
  Served:    'rgba(253,251,247,0.06)',
}

const STATUS_BORDER: Record<string, string> = {
  Pending:   'rgba(245,158,11,0.35)',
  Preparing: 'rgba(59,130,246,0.35)',
  Ready:     'rgba(16,185,129,0.35)',
  Served:    'rgba(253,251,247,0.1)',
}

const STATUS_TEXT: Record<string, string> = {
  Pending:   'var(--gold-glow)',
  Preparing: '#60a5fa',
  Ready:     '#34d399',
  Served:    'var(--cream-35)',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function signalIcon(type: string) {
  switch (type) {
    case 'call_waiter': return <HandPlatter size={18} />
    case 'napkins':     return <Bell size={18} />
    case 'water':       return <Droplets size={18} />
    case 'bill':        return <Receipt size={18} />
    default:            return <Bell size={18} />
  }
}

function signalLabel(type: string) {
  switch (type) {
    case 'call_waiter': return 'Waiter Requested'
    case 'napkins':     return 'Napkins Needed'
    case 'water':       return 'Water Requested'
    case 'bill':        return 'Bill Requested'
    default:            return type
  }
}

export default function KDSBoard({
  restaurant,
  initialOrders,
  initialSessions,
  initialSignals,
  menuItems,
  todayRevenue,
  todayCount,
}: KDSBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [signals, setSignals] = useState<Signal[]>(initialSignals)
  const [items, setItems] = useState<MenuItem[]>(menuItems)
  const [activeTab, setActiveTab] = useState<KDSTab>('orders')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [revenue, setRevenue] = useState(todayRevenue)
  const [orderCount, setOrderCount] = useState(todayCount)

const supabaseRef = useRef(createClient())
const supabase = supabaseRef.current

  // ── REALTIME ──
  useEffect(() => {
    const channel = supabase
      .channel(`kds-${restaurant.id}`)

      // New orders
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'orders',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        const newOrder = payload.new as Order
        if (!newOrder.is_starter_order) {
          setOrders((prev) => [...prev, newOrder])
          setOrderCount((c) => c + 1)
          setRevenue((r) => r + Number(newOrder.total_amount))
        }
      })

      // Order updates
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        const updated = payload.new as Order
        setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
      })

      // New signals
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'waiter_signals',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        setSignals((prev) => [...prev, payload.new as Signal])
      })

      // Signal updates
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'waiter_signals',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        const updated = payload.new as Signal
        setSignals((prev) =>
          updated.is_resolved
            ? prev.filter((s) => s.id !== updated.id)
            : prev.map((s) => s.id === updated.id ? updated : s)
        )
      })

      // Session updates
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'table_sessions',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        const updated = payload.new as Session
        setSessions((prev) =>
          updated.is_active
            ? prev.map((s) => s.id === updated.id ? updated : s)
            : prev.filter((s) => s.id !== updated.id)
        )
      })

      // Menu item updates (stock toggle)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'menu_items',
        filter: `restaurant_id=eq.${restaurant.id}`,
      }, (payload) => {
        setItems((prev) => prev.map((i) => i.id === (payload.new as MenuItem).id ? payload.new as MenuItem : i))
      })

      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurant.id])

  // ── ORDER STATUS UPDATE ──
  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingOrder(orderId)
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
    setUpdatingOrder(null)
  }

  // ── RESOLVE SIGNAL ──
  async function resolveSignal(signalId: string) {
    await supabase
      .from('waiter_signals')
      .update({ is_resolved: true })
      .eq('id', signalId)
  }

  // ── TOGGLE STOCK ──
  async function toggleStock(itemId: string, current: boolean) {
    await supabase
      .from('menu_items')
      .update({ is_available: !current })
      .eq('id', itemId)
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, is_available: !current } : i))
  }

  // ── CLOSE TABLE ──
  async function closeTable(sessionId: string) {
    await supabase
      .from('table_sessions')
      .update({ is_active: false })
      .eq('id', sessionId)
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  const pendingOrders   = orders.filter((o) => o.status === 'Pending')
  const preparingOrders = orders.filter((o) => o.status === 'Preparing')
  const readyOrders     = orders.filter((o) => o.status === 'Ready')
  const activeSignals   = signals.filter((s) => !s.is_resolved)

  const tabs: { id: KDSTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'orders',  label: 'Orders',  icon: <ChefHat size={18} />,   badge: pendingOrders.length + preparingOrders.length },
    { id: 'signals', label: 'Signals', icon: <Bell size={18} />,      badge: activeSignals.length },
    { id: 'stock',   label: 'Stock',   icon: <Package size={18} /> },
    { id: 'tables',  label: 'Tables',  icon: <Users2 size={18} />,    badge: sessions.length },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Ambient */}
      <div className="ambient-gold" style={{ position: 'fixed', width: 400, height: 400, top: -100, right: -100, zIndex: 0 }} />

      {/* ── HEADER ── */}
      <header className="dash-header" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold-glow)',
          }}>
            <ChefHat size={20} />
          </div>
          <div>
            <p className="t-title" style={{ fontSize: 15 }}>{restaurant.name}</p>
            <p className="t-eyebrow">Kitchen Display</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingBag size={13} color="var(--cream-35)" />
              <span className="t-caption">{orderCount} orders</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <DollarSign size={13} color="var(--gold-glow)" />
              <span className="t-price-sm">{restaurant.currency} {revenue.toFixed(2)}</span>
            </div>
          </div>
          {activeSignals.length > 0 && (
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gold-glow)',
              animation: 'pulseGold 1.5s infinite',
            }}>
              <Bell size={16} />
            </div>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <div style={{
        padding: '12px 16px',
        display: 'flex', gap: 8,
        borderBottom: '1px solid var(--gold-dim)',
        background: 'rgba(2,44,34,0.6)',
        position: 'sticky', top: 73, zIndex: 40,
        overflowX: 'auto',
      }}
        className="scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 12,
              fontFamily: 'Inter, sans-serif',
              fontSize: 13, fontWeight: 700,
              cursor: 'pointer', flexShrink: 0,
              border: activeTab === tab.id ? 'none' : '1px solid var(--cream-15)',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, var(--gold-glow), var(--gold))'
                : 'var(--cream-06)',
              color: activeTab === tab.id ? '#1a0e00' : 'var(--cream-35)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span style={{
                background: activeTab === tab.id ? '#1a0e00' : 'var(--gold)',
                color: activeTab === tab.id ? 'var(--gold)' : '#1a0e00',
                borderRadius: 50, padding: '1px 7px',
                fontSize: 11, fontWeight: 900,
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '20px 16px', position: 'relative', zIndex: 1 }}>

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            {orders.filter(o => o.status !== 'Served' && o.status !== 'Cancelled').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <ChefHat size={40} color="var(--cream-35)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                <p className="t-body">No active orders right now</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {orders
                  .filter(o => o.status !== 'Served' && o.status !== 'Cancelled')
                  .map((order) => {
                    const items = Array.isArray(order.items) ? order.items : []
                    const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus)
                    const nextStatus = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null
                    const isUpdating = updatingOrder === order.id
                    const isUrgent = order.status === 'Pending' &&
                      (Date.now() - new Date(order.created_at ?? '').getTime()) > 300000

                    return (
                      <div key={order.id} style={{
                        background: STATUS_COLORS[order.status ?? 'Pending'],
                        border: `1px solid ${STATUS_BORDER[order.status ?? 'Pending']}`,
                        borderRadius: 20,
                        padding: 18,
                        boxShadow: 'var(--shadow-card)',
                        transition: 'all 0.3s ease',
                      }}>
                        {/* Order Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 12,
                              background: STATUS_COLORS[order.status ?? 'Pending'],
                              border: `1px solid ${STATUS_BORDER[order.status ?? 'Pending']}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: STATUS_TEXT[order.status ?? 'Pending'],
                            }}>
                              {order.status === 'Pending'   && <Clock size={18} />}
                              {order.status === 'Preparing' && <Flame size={18} />}
                              {order.status === 'Ready'     && <CheckCircle size={18} />}
                              {order.status === 'Served'    && <Package size={18} />}
                            </div>
                            <div>
                              <p className="t-title" style={{ fontSize: 15 }}>
                                {order.customer_name ?? 'Guest'}
                              </p>
                              <p className="t-caption">Table {order.table_number}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p className="t-price-sm">{restaurant.currency} {Number(order.total_amount).toFixed(2)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}>
                              {isUrgent && <AlertTriangle size={11} color="var(--gold-glow)" />}
                              <p className="t-caption">{timeAgo(order.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{ marginBottom: 14 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                            textTransform: 'uppercase',
                            color: STATUS_TEXT[order.status ?? 'Pending'],
                            background: STATUS_COLORS[order.status ?? 'Pending'],
                            border: `1px solid ${STATUS_BORDER[order.status ?? 'Pending']}`,
                            padding: '4px 12px', borderRadius: 50,
                          }}>
                            {order.status}
                          </span>
                        </div>

                        {/* Order Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                          {(items as { name: string; quantity: number; price: number }[]).map((item, i) => (
                            <div key={i} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: 'var(--cream-06)', borderRadius: 10, padding: '8px 12px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{
                                  width: 22, height: 22, borderRadius: 6,
                                  background: 'var(--gold-faint)',
                                  border: '1px solid var(--gold-dim)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 900, color: 'var(--gold-glow)',
                                  flexShrink: 0,
                                }}>
                                  {item.quantity}
                                </span>
                                <span className="t-body" style={{ fontSize: 13 }}>{item.name}</span>
                              </div>
                              <span className="t-caption">
                                {restaurant.currency} {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          {nextStatus && (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              disabled={isUpdating}
                              style={{
                                flex: 1, padding: '11px 16px',
                                background: isUpdating
                                  ? 'var(--cream-06)'
                                  : 'linear-gradient(135deg, var(--gold-glow), var(--gold))',
                                border: 'none',
                                borderBottom: isUpdating ? 'none' : '3px solid #92400e',
                                borderRadius: 12, cursor: isUpdating ? 'not-allowed' : 'pointer',
                                color: isUpdating ? 'var(--cream-35)' : '#1a0e00',
                                fontSize: 13, fontWeight: 800,
                                fontFamily: 'Inter, sans-serif',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                transition: 'all 0.15s',
                              }}
                            >
                              {isUpdating
                                ? <><RefreshCw size={14} /> Updating...</>
                                : <>Mark as {nextStatus}</>
                              }
                            </button>
                          )}
                          <button
                            onClick={() => updateOrderStatus(order.id, 'Cancelled')}
                            style={{
                              padding: '11px 14px', borderRadius: 12,
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.25)',
                              color: '#f87171', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                              fontSize: 12, fontWeight: 700,
                              fontFamily: 'Inter, sans-serif',
                              transition: 'all 0.2s',
                            }}
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        )}

        {/* SIGNALS TAB */}
        {activeTab === 'signals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeSignals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <CheckCircle size={40} color="var(--cream-35)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                <p className="t-body">All clear — no pending signals</p>
              </div>
            ) : activeSignals.map((signal) => (
              <div key={signal.id} style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 18, padding: 16,
                display: 'flex', alignItems: 'center', gap: 14,
                boxShadow: 'var(--shadow-glow)',
                animation: 'pulseGold 3s infinite',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gold-glow)',
                }}>
                  {signalIcon(signal.signal_type)}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="t-title" style={{ fontSize: 14, marginBottom: 3 }}>
                    {signalLabel(signal.signal_type)}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <p className="t-caption">Table {signal.table_number}</p>
                    {signal.customer_name && (
                      <><span className="t-caption">·</span>
                      <p className="t-caption">{signal.customer_name}</p></>
                    )}
                    <span className="t-caption">·</span>
                    <p className="t-caption">{timeAgo(signal.created_at)}</p>
                  </div>
                </div>
                <button
                  onClick={() => resolveSignal(signal.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34d399', cursor: 'pointer',
                    fontSize: 12, fontWeight: 800,
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 6,
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <CheckCircle size={14} /> Done
                </button>
              </div>
            ))}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === 'stock' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p className="t-body" style={{ marginBottom: 8 }}>
              Toggle items on/off instantly. Changes reflect immediately on all customer menus.
            </p>
            {items.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: item.is_available ? 'var(--cream-06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${item.is_available ? 'var(--cream-06)' : 'rgba(239,68,68,0.2)'}`,
                borderRadius: 16, padding: '14px 16px',
                transition: 'all 0.2s',
                opacity: item.is_available ? 1 : 0.6,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="t-title" style={{ fontSize: 14, marginBottom: 2 }}>{item.name_en}</p>
                  <p className="t-caption">{restaurant.currency} {Number(item.price).toFixed(2)}</p>
                </div>
                            <button
                onClick={() => toggleStock(item.id, item.is_available ?? true)}
                    style={{
                    cursor: 'pointer',
                    color: item.is_available ? '#34d399' : '#f87171',
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700,
                    fontFamily: 'Inter, sans-serif',
                    padding: '6px 12px', borderRadius: 8,
                    background: item.is_available ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${item.is_available ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    transition: 'all 0.2s',
                }}
>
  {item.is_available
    ? <><ToggleRight size={16} /> Available</>
    : <><ToggleLeft size={16} /> Unavailable</>
  }
</button>
              </div>
            ))}
          </div>
        )}

        {/* TABLES TAB */}
        {activeTab === 'tables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="t-body" style={{ marginBottom: 8 }}>
              Close a table when the customer has paid and left. This unlocks the table for the next customer.
            </p>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0' }}>
                <Users2 size={40} color="var(--cream-35)" style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                <p className="t-body">No active tables right now</p>
              </div>
            ) : sessions.map((session) => {
              const tableOrders = orders.filter((o) => o.session_token === session.session_token)
              const tableTotal = tableOrders.reduce((s, o) => s + Number(o.total_amount), 0)
              return (
                <div key={session.id} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--gold-dim)',
                  borderRadius: 20, padding: 18,
                  boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gold-glow)',
                      }}>
                        <Users2 size={20} />
                      </div>
                      <div>
                        <p className="t-title" style={{ fontSize: 15 }}>{session.customer_name}</p>
                        <p className="t-eyebrow">Table {session.table_number}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="t-price-sm">{restaurant.currency} {tableTotal.toFixed(2)}</p>
                      <p className="t-caption">{tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  <div className="divider" style={{ marginBottom: 14 }} />

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => closeTable(session.id)}
                      style={{
                        flex: 1, padding: '11px 16px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 12, cursor: 'pointer',
                        color: '#f87171', fontSize: 13, fontWeight: 800,
                        fontFamily: 'Inter, sans-serif',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s',
                      }}
                    >
                      <LogOut size={15} /> Close Table & Clear Bill
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}