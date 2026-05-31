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

function UnauthorizedPage({ restaurant_slug }: { restaurant_slug: string }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="t-heading">Access denied</h1>
        <p className="t-body">
          You are not authorized to view the dashboard for “{restaurant_slug}”.
          Please sign in with a staff account for that restaurant.
        </p>
        <a className="btn-primary" href={`/login?next=/dashboard/${restaurant_slug}`}>
          Sign in with a staff account
        </a>
      </div>
    </div>
  )
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
    .limit(1)
    .maybeSingle()

  if (!staff) return <UnauthorizedPage restaurant_slug={restaurant_slug} />

  const today = new Date().toISOString().split('T')[0]
  const todayStart = `${today}T00:00:00.000Z`
  const tomorrowStartDate = new Date(todayStart)
  tomorrowStartDate.setUTCDate(tomorrowStartDate.getUTCDate() + 1)
  const tomorrowStart = tomorrowStartDate.toISOString()
  const thisMonth = today.slice(0, 7)
  const monthStart = `${thisMonth}-01T00:00:00.000Z`
  const nextMonthStartDate = new Date(monthStart)
  nextMonthStartDate.setUTCMonth(nextMonthStartDate.getUTCMonth() + 1)
  const nextMonthStart = nextMonthStartDate.toISOString()

  const [
    dailyStatsResult,
    monthlyStatsResult,
    topItemsResult,
    peakHoursResult,
    recentOrdersResult,
    todayRevenueOrdersResult,
    activeOrdersCountResult,
    activeTablesCountResult,
    tablesServedTodayResult,
    tablesServedMonthResult,
    signalsCountResult,
  ] = await Promise.all([
    supabase
      .from('restaurant_stats' as never)
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('order_date', today)
      .maybeSingle()
      .then((result) => result as { data: RestaurantStats | null }),
    supabase
      .from('restaurant_stats' as never)
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('order_month', thisMonth)
      .then((result) => result as { data: RestaurantStats[] | null }),
    supabase
      .from('menu_item_stats' as never)
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('order_month', thisMonth)
      .order('total_quantity', { ascending: false })
      .limit(5)
      .then((result) => result as { data: MenuItemStats[] | null }),
    supabase
      .from('peak_hours_stats' as never)
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('order_count', { ascending: false })
      .limit(6)
      .then((result) => result as { data: PeakHourStats[] | null }),
    supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_starter_order', false)
      .order('created_at', { ascending: false })
      .limit(10)
      .then((result) => result as { data: Order[] | null }),
    supabase
      .from('orders')
      .select('total_amount, status')
      .eq('restaurant_id', restaurant.id)
      .eq('is_starter_order', false)
      .eq('status', 'Served')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .in('status', ['Pending', 'Preparing']),
    supabase
      .from('table_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true),
    supabase
      .from('table_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'completed')
      .gte('closed_at', todayStart)
      .lt('closed_at', tomorrowStart),
    supabase
      .from('table_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('status', 'completed')
      .gte('closed_at', monthStart)
      .lt('closed_at', nextMonthStart),
    supabase
      .from('waiter_signals')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurant.id)
      .eq('is_resolved', false),
  ])

  const { data: dailyStats } = dailyStatsResult
  const { data: monthlyStats } = monthlyStatsResult
  const { data: topItems } = topItemsResult
  const { data: peakHours } = peakHoursResult
  const { data: recentOrders } = recentOrdersResult
  const { data: todayRevenueOrders } = todayRevenueOrdersResult
  const { count: activeOrdersCount } = activeOrdersCountResult
  const { count: activeTablesCount } = activeTablesCountResult
  const { count: tablesServedToday } = tablesServedTodayResult
  const { count: tablesServedMonth } = tablesServedMonthResult
  const { count: signalsCount } = signalsCountResult

  const todayRevenue = todayRevenueOrders?.reduce(
    (sum, order) => sum + Number(order.total_amount),
    0,
  ) ?? 0

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
      todayRevenue={todayRevenue}
      tablesServedToday={tablesServedToday ?? 0}
      tablesServedMonth={tablesServedMonth ?? 0}
      signalsCount={signalsCount ?? 0}
    />
  )
}
