import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export async function POST(request: Request) {
  const { group_id, restaurant_id, name, price } = await request.json()
  if (!group_id || !restaurant_id || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase.from('modifier_options').insert({ group_id, restaurant_id, name, price: price ?? 0, sort_order: 0 }).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 200 })
}