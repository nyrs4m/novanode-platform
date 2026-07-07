import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export async function POST(request: Request) {
  const { menu_item_id, restaurant_id, name, is_required, is_multi_select } = await request.json()
  if (!menu_item_id || !restaurant_id || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data, error } = await supabase.from('modifier_groups').insert({ menu_item_id, restaurant_id, name, is_required: is_required ?? false, is_multi_select: is_multi_select ?? false, sort_order: 0 }).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 200 })
}