/**
 * lib/realtime-engine.ts
 *
 * Singleton channel registry keyed by restaurant_id.
 *
 * Problem this solves:
 *   Both KDSBoard and MenuClient previously called createClient() at component
 *   level and opened independent channels for the same restaurant_id. On Supabase
 *   free tier (16 server connections, 200 clients) this bleeds the pool dry across
 *   multiple browser tabs / staff terminals.
 *
 * How it works:
 *   - One SupabaseClient instance per browser (enforced by lib/supabase/client.ts singleton).
 *   - One RealtimeChannel per restaurant_id per browser tab, stored in channelMap.
 *   - Components call getRestaurantChannel() to get (or create) that channel.
 *   - Components call releaseRestaurantChannel() in their useEffect cleanup.
 *   - The channel is only actually unsubscribed when refCount drops to 0.
 *
 * Usage:
 *   const channel = getRestaurantChannel(restaurant.id, supabase)
 *   channel.on('postgres_changes', { ... }, handler)
 *   // must call after .on() calls:
 *   channel.subscribe()
 *
 *   return () => releaseRestaurantChannel(restaurant.id, supabase)
 */

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

interface ChannelEntry {
  channel: RealtimeChannel
  refCount: number
}

// Module-level map — survives React re-renders, cleared on full page reload.
const channelMap = new Map<string, ChannelEntry>()

/**
 * Returns the shared RealtimeChannel for this restaurant.
 * Creates it (unsubscribed) on first call; subsequent calls increment refCount.
 *
 * NOTE: The caller is responsible for calling .subscribe() after attaching
 * all .on() listeners. If the channel already exists and is subscribed,
 * new listeners attached via .on() are still picked up — Supabase Realtime
 * supports dynamic listener attachment on a live channel.
 */
export function getRestaurantChannel(
  restaurantId: string,
  supabase?: SupabaseClient
): RealtimeChannel {
  const client = supabase ?? createClient()
  const key = `kds-${restaurantId}`

  const existing = channelMap.get(key)
  if (existing) {
    existing.refCount++
    return existing.channel
  }

  const channel = client.channel(key)
  channelMap.set(key, { channel, refCount: 1 })
  return channel
}

/**
 * Decrements refCount for this restaurant's channel.
 * Unsubscribes and removes the channel only when refCount reaches 0.
 * Safe to call from useEffect cleanup — will no-op if channel doesn't exist.
 */
export function releaseRestaurantChannel(
  restaurantId: string,
  supabase?: SupabaseClient
): void {
  const client = supabase ?? createClient()
  const key = `kds-${restaurantId}`

  const entry = channelMap.get(key)
  if (!entry) return

  entry.refCount--

  if (entry.refCount <= 0) {
    client.removeChannel(entry.channel)
    channelMap.delete(key)
  }
}

/**
 * Force-removes all channels for a restaurant — use in teardown / logout.
 */
export function purgeRestaurantChannels(
  restaurantId: string,
  supabase?: SupabaseClient
): void {
  const client = supabase ?? createClient()
  const key = `kds-${restaurantId}`

  const entry = channelMap.get(key)
  if (!entry) return

  client.removeChannel(entry.channel)
  channelMap.delete(key)
}