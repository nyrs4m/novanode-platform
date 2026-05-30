import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuperAdminPanel from './components/SuperAdminPanel'

export default async function NovaNodeAdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/novanode/login')

  // Check if super admin
  const { data: admin } = await supabase
    .from('novanode_admins')
    .select('*')
    .eq('email', user.email!)
    .maybeSingle()

  if (!admin) redirect('/login')

  // Fetch all restaurants
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch today's ledger for all restaurants
  const today = new Date().toISOString().split('T')[0]
  const { data: ledgers } = await supabase
    .from('daily_ledger')
    .select('*')
    .eq('ledger_date', today)

  // Platform stats
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: totalSessions } = await supabase
    .from('table_sessions')
    .select('*', { count: 'exact', head: true })

  return (
    <SuperAdminPanel
      adminEmail={user.email!}
      restaurants={restaurants ?? []}
      ledgers={ledgers ?? []}
      totalOrders={totalOrders ?? 0}
      totalSessions={totalSessions ?? 0}
    />
  )
}