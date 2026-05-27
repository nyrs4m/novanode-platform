import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/lib/supabase/public'

const supabase = createPublicClient()

export const getRestaurantBySlug = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from('restaurants').select('*')
      .eq('slug', slug).eq('is_active', true).single()
    return data
  },
  ['restaurant-by-slug'],
  { revalidate: 60, tags: ['restaurant'] }
)

export const getMenuItems = unstable_cache(
  async (restaurantId: string) => {
    const { data } = await supabase
      .from('menu_items').select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .eq('is_starter', false)
      .order('created_at')
    return data ?? []
  },
  ['menu-items'],
  { revalidate: 30, tags: ['menu'] },
)

export const getCategories = unstable_cache(
  async (restaurantId: string) => {
    const { data } = await supabase
      .from('categories').select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order')
    return data ?? []
  },
  ['categories'],
  { revalidate: 60, tags: ['menu'] }
)

export const getStarters = unstable_cache(
  async (restaurantId: string) => {
    const { data } = await supabase
      .from('menu_items').select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .eq('is_starter', true)
    return data ?? []
  },
  ['starters'],
  { revalidate: 30, tags: ['menu'] }
)

export const getDailySpecial = unstable_cache(
  async (restaurantId: string) => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('daily_specials').select('*')
      .eq('restaurant_id', restaurantId)
      .eq('valid_date', today).limit(1)
    return data?.[0] ?? null
  },
  ['daily-special'],
  { revalidate: 300, tags: ['special'] }
)