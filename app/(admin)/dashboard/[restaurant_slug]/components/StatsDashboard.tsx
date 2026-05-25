'use client'

import { useState } from 'react'
import {
  BarChart2, DollarSign, ShoppingBag, Users2,
  Utensils, Clock, Calendar, TrendingUp,
  ArrowUpRight, CheckCircle, XCircle, Loader2,
  Star, Table2
} from 'lucide-react'
import type { Tables, RestaurantStats, MenuItemStats, PeakHourStats } from '@/types/database.types'

type Restaurant = Tables<'restaurants'>
type Order = Tables<'orders'>
type Period = 'today' | 'week' | 'month'

interface StatsProps {
  restaurant: Restaurant
  dailyStats: RestaurantStats | null
  monthlyStats: RestaurantStats[]
  topItems: MenuItemStats[]
  peakHours: PeakHourStats[]
  recentOrders: Order[]
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'Completed') return <CheckCircle size={15} className="status-done" />
  if (status === 'Cancelled') return <XCircle size={15} className="status-cancel" />
  return <Loader2 size={15} className="status-pending" />
}

function StatusLabel({ status }: { status: string }) {
  if (status === 'Completed') return <span className="status-done">{status}</span>
  if (status === 'Cancelled') return <span className="status-cancel">{status}</span>
  return <span className="status-pending">{status}</span>
}

export default function StatsDashboard({
  restaurant,
  dailyStats,
  monthlyStats,
  topItems,
  peakHours,
  recentOrders,
}: StatsProps) {
  const [period, setPeriod] = useState<Period>('today')

  const mRevenue = monthlyStats.reduce((s, r) => s + (r.gross_revenue ?? 0), 0)
  const mOrders  = monthlyStats.reduce((s, r) => s + (r.total_orders ?? 0), 0)
  const mTables  = monthlyStats.reduce((s, r) => s + (r.tables_served ?? 0), 0)
  const mFees    = monthlyStats.reduce((s, r) => s + (r.total_platform_fees ?? 0), 0)

  const dRevenue = dailyStats?.gross_revenue ?? 0
  const dOrders  = dailyStats?.total_orders ?? 0
  const dTables  = dailyStats?.tables_served ?? 0

  const statCards = [
    {
      label: "Today's Revenue",
      value: `${restaurant.currency} ${Number(dRevenue).toFixed(2)}`,
      sub: `${restaurant.currency} ${mRevenue.toFixed(2)} this month`,
      icon: <DollarSign size={20} />,
      up: true,
    },
    {
      label: "Today's Orders",
      value: String(dOrders),
      sub: `${mOrders} this month`,
      icon: <ShoppingBag size={20} />,
      up: true,
    },
    {
      label: 'Tables Served',
      value: String(dTables),
      sub: `${mTables} this month`,
      icon: <Table2 size={20} />,
      up: false,
    },
    {
      label: 'Platform Fees',
      value: `${restaurant.currency} ${mFees.toFixed(2)}`,
      sub: '2.5% per order',
      icon: <TrendingUp size={20} />,
      up: false,
    },
  ]

  const maxQty   = topItems[0]?.total_quantity ?? 1
  const maxPeak  = peakHours[0]?.order_count ?? 1

  return (
    <div className="dash-page">

      {/* Ambient */}
      <div className="ambient-gold" style={{ position: 'fixed', width: 400, height: 400, top: -100, left: -100, zIndex: 0 }} />

      {/* HEADER */}
      <header className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold-glow)',
          }}>
            <BarChart2 size={20} />
          </div>
          <div>
            <p className="t-title" style={{ fontSize: 16 }}>{restaurant.name}</p>
            <p className="t-eyebrow">Dashboard</p>
          </div>
        </div>
        <div className="period-tabs">
          {(['today', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              className={`period-tab ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="dash-content" style={{ position: 'relative', zIndex: 1 }}>

        {/* STAT CARDS */}
        <div className="dash-grid-2">
          {statCards.map((card) => (
            <div key={card.label} className="dash-stat-card">
              <div className="dash-stat-glow" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'var(--gold-faint)', border: '1px solid var(--gold-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gold-glow)',
                }}>
                  {card.icon}
                </div>
                {card.up && <ArrowUpRight size={16} color="#34d399" />}
              </div>
              <p className="t-heading" style={{ fontSize: 22, marginBottom: 4 }}>{card.value}</p>
              <p className="t-caption" style={{ marginBottom: 3 }}>{card.label}</p>
              <p className="t-eyebrow" style={{ fontSize: 10, opacity: 0.7 }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* TOP DISHES */}
        <div className="dash-section">
          <div className="dash-section-head">
            <Utensils size={17} color="var(--gold-glow)" />
            <span className="t-title" style={{ fontSize: 15 }}>Top Dishes This Month</span>
          </div>
          {topItems.length === 0 ? (
            <div className="dash-empty">
              <Star size={30} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.25 }} />
              No orders recorded yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topItems.map((item, i) => {
                const qty = item.total_quantity ?? 0
                const pct = (qty / Number(maxQty)) * 100
                return (
                  <div key={item.item_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className={`dash-rank ${i === 0 ? 'gold' : 'muted'}`}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="t-title" style={{ fontSize: 13 }}>{item.item_name}</span>
                        <span className="t-eyebrow" style={{ fontSize: 11 }}>{qty}×</span>
                      </div>
                      <div className="bar-track">
                        <div className={`bar-fill ${i > 0 ? 'dim' : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="t-caption">
                      {restaurant.currency} {Number(item.total_revenue).toFixed(0)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* PEAK HOURS */}
        <div className="dash-section">
          <div className="dash-section-head">
            <Clock size={17} color="var(--gold-glow)" />
            <span className="t-title" style={{ fontSize: 15 }}>Peak Hours</span>
          </div>
          {peakHours.length === 0 ? (
            <div className="dash-empty">No data yet</div>
          ) : (
            <div className="peak-grid">
              {peakHours.map((h) => {
                const hour = Number(h.hour_of_day)
                const label = hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`
                const pct = (Number(h.order_count) / Number(maxPeak)) * 100
                return (
                  <div key={hour} className="peak-cell">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className="t-price-sm" style={{ fontSize: 13 }}>{label}</span>
                      <span className="t-caption">{h.order_count}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RECENT ORDERS */}
        <div className="dash-section">
          <div className="dash-section-head">
            <Calendar size={17} color="var(--gold-glow)" />
            <span className="t-title" style={{ fontSize: 15 }}>Recent Orders</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="dash-empty">No orders yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentOrders.map((order) => (
                <div key={order.id} className="order-row">
                  <div className="order-icon">
                    <StatusIcon status={order.status ?? ''} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="t-title" style={{ fontSize: 13 }}>
                        {order.customer_name ?? 'Guest'}
                      </span>
                      <span className="t-price-sm">
                        {restaurant.currency} {Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <span className="t-caption">Table {order.table_number}</span>
                      <span className="t-caption">·</span>
                      <span className="t-caption">
                        {new Date(order.created_at ?? '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="t-caption">·</span>
                      <StatusLabel status={order.status ?? ''} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}