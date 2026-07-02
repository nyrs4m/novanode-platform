import { notFound, redirect } from "next/navigation";
import RestaurantApp from "./components/RestaurantApp";
import {
  getRestaurantBySlug,
  getMenuItems,
  getCategories,
  getStarters,
  getDailySpecial,
} from "@/lib/cache";

interface PageProps {
  params: Promise<{ restaurant_slug: string }>;
  searchParams: Promise<{ table?: string }>;
}

export default async function RestaurantMenuPage({
  params,
  searchParams,
}: PageProps) {
  const { restaurant_slug } = await params;
  const { table } = await searchParams;
  const tableNumber = table ?? "1";

  const restaurant = await getRestaurantBySlug(restaurant_slug);
  console.log('[page] restaurant:', restaurant?.name, 'is_active:', restaurant?.is_active)
  if (!restaurant) return notFound();
  if (!restaurant.is_active) {
      redirect(`/${restaurant_slug}/suspended`);
  }

  const [categories, menuItems, starters, dailySpecial] = await Promise.all([
    getCategories(restaurant.id),
    getMenuItems(restaurant.id),
    getStarters(restaurant.id),
    getDailySpecial(restaurant.id),
  ]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-theme', '${restaurant.theme ?? 'default'}')`,
        }}
      />
      <RestaurantApp
        restaurant={restaurant}
        categories={categories}
        menuItems={menuItems}
        starters={starters}
        dailySpecial={dailySpecial}
        tableNumber={tableNumber}
      />
    </>
  );
}