import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

let instance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (instance) return instance
  instance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return instance
}