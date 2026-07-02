import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Verify superadmin
  const { data: admin } = await serviceClient
    .from('novanode_admins')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, slug, currency, closing_time } = await req.json()
  if (!name || !slug) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: newRestaurant, error: restError } = await serviceClient
    .from('restaurants')
    .insert({
      name,
      slug: slug.toLowerCase().replace(/\s+/g, '-'),
      currency: currency ?? 'GHS',
      closing_time: closing_time ?? '22:00',
      is_active: true,
    })
    .select()
    .maybeSingle()

  if (restError) return NextResponse.json({ error: restError.message }, { status: 500 })
  if (!newRestaurant) return NextResponse.json({ error: 'Restaurant not created' }, { status: 500 })

  return NextResponse.json({ success: true, restaurant: newRestaurant })
}