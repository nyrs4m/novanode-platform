import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

// One shared channel per restaurant_id
// All KDS terminals subscribe to the same broadcast

const channels = new Map<string, RealtimeChannel>();

export function getRestaurantChannel(
  restaurantId: string,
  supabase: SupabaseClient,
) {
  if (channels.has(restaurantId)) return channels.get(restaurantId)!;

  const channel = supabase.channel(`restaurant:${restaurantId}`, {
    config: { broadcast: { self: true } },
  });

  channels.set(restaurantId, channel);
  return channel;
}
