import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import MenuManager from './components/MenuManager'

interface PageProps {
  params: Promise<{ restaurant_slug: string }>
}

export default async function MenuPage({ params }: PageProps) {
  const { restaurant_slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/dashboard/${restaurant_slug}/menu`)

  const { data: restaurant } = await supabase
    .from('restaurants').select('*')
    .eq('slug', restaurant_slug).single()
  if (!restaurant) return notFound()

  const { data: staff } = await supabase
    .from('restaurant_staff').select('*')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurant.id)
    .limit(1).single()
  if (!staff) return notFound()

  const { data: categories } = await supabase
    .from('categories').select('*')
    .eq('restaurant_id', restaurant.id)
    .order('sort_order')

  const { data: menuItems } = await supabase
    .from('menu_items').select('*')
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  return (
    <MenuManager
      restaurant={restaurant}
      initialCategories={categories ?? []}
      initialItems={menuItems ?? []}
    />
  )
}