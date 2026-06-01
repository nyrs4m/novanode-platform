import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DashboardHome from './components/DashboardHome'
import type {
  RestaurantStats,
  MenuItemStats,
  PeakHourStats
} from '@/types/database.types'
import type { Tables } from '@/types/database.types'

type Order = Tables<'orders'>

interface PageProps {
  params: Promise<{ restaurant_slug: string }>
}

export default async function DashboardPage({ params }: PageProps) {
  const { restaurant_slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/dashboard/${restaurant_slug}`)

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', restaurant_slug)
    .single()

  if (!restaurant) return notFound()

  const { data: staff } = await supabase
    .from('restaurant_staff')
    .select('*')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id)
    .single()

  if (!staff) return notFound()

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = today.slice(0, 7)

  // ── Stats views ────────────────────────────────────────────────────────
  const { data: dailyStats } = await supabase
    .from('restaurant_stats' as never)
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('order_date', today)
    .maybeSingle() as { data: RestaurantStats | null }

  const { data: monthlyStats } = await supabase
    .from('restaurant_stats' as never)
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('order_month', thisMonth) as { data: RestaurantStats[] | null }

  const { data: topItems } = await supabase
    .from('menu_item_stats' as never)
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('order_month', thisMonth)
    .order('total_quantity', { ascending: false })
    .limit(5) as { data: MenuItemStats[] | null }

  const { data: peakHours } = await supabase
    .from('peak_hours_stats' as never)
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('order_count', { ascending: false })
    .limit(6) as { data: PeakHourStats[] | null }

  // ── Recent orders (last 10, non-starter) ──────────────────────────────
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_starter_order', false)
    .order('created_at', { ascending: false })
    .limit(10) as { data: Order[] | null }

  // ── Live counts ────────────────────────────────────────────────────────
  //
  // IMPORTANT: These must match the KDS page.tsx queries exactly so the
  // dashboard and KDS show the same numbers on first render.
  //
  // KDS fetches: orders WHERE status NOT IN (Completed, Cancelled) AND created_at >= today
  // Dashboard active orders: Pending + Preparing (no date filter — matches all active)
  // We align to: Pending + Preparing, no date filter (active means not done yet)
  //
  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)
    .in('status', ['Pending', 'Preparing'])

  const { count: activeTablesCount } = await supabase
    .from('table_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)

  const { count: signalsCount } = await supabase
    .from('waiter_signals')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', restaurant.id)
    .eq('is_resolved', false)

  return (
    <DashboardHome
      restaurant={restaurant}
      staff={staff}
      dailyStats={dailyStats ?? null}
      monthlyStats={monthlyStats ?? []}
      topItems={topItems ?? []}
      peakHours={peakHours ?? []}
      recentOrders={recentOrders ?? []}
      activeOrdersCount={activeOrdersCount ?? 0}
      activeTablesCount={activeTablesCount ?? 0}
      signalsCount={signalsCount ?? 0}
    />
  )
}