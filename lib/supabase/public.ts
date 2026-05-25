import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Public client — no cookies, safe to use inside unstable_cache
// Only used for public menu data (restaurants, categories, menu_items)
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}