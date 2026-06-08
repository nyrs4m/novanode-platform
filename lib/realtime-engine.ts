// lib/realtime-engine.ts
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'

interface ChannelEntry {
  channel: RealtimeChannel
  refCount: number
}

const channelMap = new Map<string, ChannelEntry>()

export function getRestaurantChannel(
  restaurantId: string,
  supabase: SupabaseClient,
  role: 'customer' | 'kds' = 'customer'
): RealtimeChannel {
  const key = `${role}-${restaurantId}`

  if (channelMap.has(key)) {
    channelMap.get(key)!.refCount++
    return channelMap.get(key)!.channel
  }

  const channel = supabase.channel(key, {
    config: { broadcast: { self: true } },
  })

  channelMap.set(key, { channel, refCount: 1 })
  return channel
}

export function releaseRestaurantChannel(
  restaurantId: string,
  supabase: SupabaseClient,
  role: 'customer' | 'kds' = 'customer'
) {
  const key = `${role}-${restaurantId}`
  const entry = channelMap.get(key)
  if (!entry) return

  entry.refCount--
  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel)
    channelMap.delete(key)
  }
}