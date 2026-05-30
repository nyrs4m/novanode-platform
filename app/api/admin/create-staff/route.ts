import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    // Verify the requester is a super admin
    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: admin } = await serverSupabase
      .from('novanode_admins')
      .select('id')
      .eq('email', user.email!)
      .maybeSingle()

    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { email, password, restaurant_id } = await req.json()
    if (!email || !password || !restaurant_id) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Use service role client to create user
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create auth user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) throw createError

    // Link to restaurant
    const { error: staffError } = await adminClient
      .from('restaurant_staff')
      .insert({
        restaurant_id,
        user_id: newUser.user.id,
        role: 'admin',
        display_name: email.split('@')[0],
      })

    if (staffError) throw staffError

    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch (err) {
    console.error('Create staff error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}