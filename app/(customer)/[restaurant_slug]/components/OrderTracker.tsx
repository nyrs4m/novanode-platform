"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database.types";
import {
  Clock,
  CheckCircle,
  Flame,
  Package,
  X,
  Bell,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import {
  playOrderReady,
  playCountdownBell,
  playWaiterCall,
} from "@/lib/sounds";

type Order = Tables<"orders">;
type Restaurant = Tables<"restaurants">;

interface OrderTrackerProps {
  sessionToken: string;
  restaurant: Restaurant;
  customerName: string;
  tableNumber: string;
}

interface TrackedOrder extends Order {
  estimated_minutes?: number | null;
  preparation_started_at?: string | null;
}

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
  }
> = {
  Pending: {
    label: "Received",
    color: "var(--gold-glow)",
    bg: "rgba(245,158,11,0.12)",
    icon: <Clock size={14} />,
  },
  Preparing: {
    label: "Preparing",
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.12)",
    icon: <Flame size={14} />,
  },
  Ready: {
    label: "Ready!",
    color: "#34d399",
    bg: "rgba(16,185,129,0.12)",
    icon: <CheckCircle size={14} />,
  },
  Served: {
    label: "Served",
    color: "var(--cream-35)",
    bg: "var(--cream-06)",
    icon: <Package size={14} />,
  },
  Cancelled: {
    label: "Cancelled",
    color: "#f87171",
    bg: "rgba(239,68,68,0.08)",
    icon: <X size={14} />,
  },
};

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function OrderTracker({
  sessionToken,
  restaurant,
  customerName,
  tableNumber,
}: OrderTrackerProps) {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const [expiredOrders, setExpiredOrders] = useState<Set<string>>(new Set());
  const [bellPressed, setBellPressed] = useState<Set<string>>(new Set());
  const prevStatusRef = useRef<Record<string, string>>({});
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const runningTotal = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((s, o) => s + Number(o.total_amount), 0);
  useEffect(() => {
    supabaseRef.current = supabase;
  }, [supabase]);
  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("session_token", sessionToken)
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data as TrackedOrder[]);
      data.forEach((o) => {
        prevStatusRef.current[o.id] = o.status ?? "";
      });
    }
  }, [sessionToken, supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`tracker-${sessionToken}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `session_token=eq.${sessionToken}`,
        },
        (payload) => {
          const updated = payload.new as TrackedOrder;

          setOrders((prev) => {
            const exists = prev.find((o) => o.id === updated.id);
            if (exists)
              return prev.map((o) => (o.id === updated.id ? updated : o));
            return [updated, ...prev];
          });

          const prevStatus = prevStatusRef.current[updated.id];
          if (prevStatus !== updated.status) {
            if (updated.status === "Ready") playOrderReady();
            prevStatusRef.current[updated.id] = updated.status ?? "";
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionToken, supabase]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns((prev) => {
        const next = { ...prev };
        orders.forEach((order) => {
          if (
            order.status === "Preparing" &&
            order.estimated_minutes &&
            order.preparation_started_at
          ) {
            const elapsed =
              (Date.now() - new Date(order.preparation_started_at).getTime()) /
              1000;
            const remaining = Math.max(
              0,
              order.estimated_minutes * 60 - elapsed,
            );
            next[order.id] = remaining;

            if (remaining === 0 && !expiredOrders.has(order.id)) {
              setExpiredOrders((p) => new Set([...p, order.id]));
              playCountdownBell();
            }
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, expiredOrders]);

  // Watch for table session closing
  useEffect(() => {
    const channel = supabase
      .channel(`session-watch-${sessionToken}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "table_sessions",
          filter: `session_token=eq.${sessionToken}`,
        },
        (payload) => {
          const updated = payload.new as {
            is_active: boolean;
            bill_status: string;
          };
          if (!updated.is_active) {
            // Table closed — clear token and reload
            localStorage.removeItem("nn_session_token");
            window.location.reload();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionToken, supabase]);

  async function pressDelayBell(orderId: string) {
    if (bellPressed.has(orderId)) return;
    setBellPressed((p) => new Set([...p, orderId]));
    playWaiterCall();

    await supabase.from("waiter_signals").insert({
      restaurant_id: restaurant.id,
      table_number: tableNumber,
      customer_name: customerName,
      signal_type: "call_waiter",
    });

    setTimeout(() => {
      setBellPressed((p) => {
        const next = new Set(p);
        next.delete(orderId);
        return next;
      });
    }, 30000);
  }

  const activeOrders = orders.filter((o) => o.status !== "Served");
  const displayOrders = [...activeOrders].reverse();

  if (activeOrders.length === 0) return null;

  return (
    <div
      style={{
        margin: "16px 16px 0",
        background: "var(--surface)",
        border: "1px solid var(--gold-dim)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
        animation: "fadeUp 0.4s ease",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: expanded ? "1px solid var(--gold-dim)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "var(--gold-faint)",
              border: "1px solid var(--gold-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold-glow)",
            }}
          >
            <Clock size={16} />
          </div>
          <div style={{ textAlign: "left" }}>
            <p className="t-title" style={{ fontSize: 14 }}>
              Your Orders
            </p>
            <p className="t-eyebrow" style={{ fontSize: 9, marginTop: 2 }}>
              {activeOrders.length} active · {restaurant.currency} {orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + Number(o.total_amount), 0).toFixed(2)} total
            </p>
          </div>
        </div>
        <div style={{ color: "var(--cream-35)" }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {displayOrders.map((order, index) => {
            const config =
              statusConfig[order.status ?? "Pending"] ??
              statusConfig["Pending"];
            const countdown = countdowns[order.id];
            const isExpired = expiredOrders.has(order.id);
            const bellUsed = bellPressed.has(order.id);
            const isReady = order.status === "Ready";
            const isCancelled = order.status === "Cancelled";
            const orderItems = Array.isArray(order.items)
              ? (order.items as { name: string; quantity: number }[])
              : [];

            return (
              <div
                key={order.id}
                style={{
                  background: config.bg,
                  border: `1px solid ${config.color}30`,
                  borderRadius: 16,
                  padding: 14,
                  transition: "all 0.3s ease",
                  opacity: isCancelled ? 0.6 : 1,
                }}
              >
                {/* Status Row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <p
                    className="t-eyebrow"
                    style={{ marginBottom: 8, fontSize: 9 }}
                  >
                    {order.is_starter_order
                      ? "⚡ Starter Order"
                      : `Order #${index + 1}`}
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ color: config.color }}>{config.icon}</span>
                    <span
                      style={{
                        color: config.color,
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <span className="t-price-sm" style={{ fontSize: 13 }}>
                    {restaurant.currency}{" "}
                    {Number(order.total_amount).toFixed(2)}
                  </span>
                </div>

                {order.is_starter_order && (
                  <span
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#34d399",
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 50,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    Starter
                  </span>
                )}

                {/* Items */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    marginBottom: isCancelled ? 0 : 10,
                  }}
                >
                  {orderItems.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--cream-06)",
                        borderRadius: 8,
                        padding: "6px 10px",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          background: "var(--gold-faint)",
                          border: "1px solid var(--gold-dim)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 900,
                          color: "var(--gold-glow)",
                          flexShrink: 0,
                        }}
                      >
                        {item.quantity}
                      </span>
                      <span className="t-body" style={{ fontSize: 12 }}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Countdown */}
                {order.status === "Preparing" &&
                  order.estimated_minutes &&
                  countdown !== undefined && (
                    <div style={{ marginBottom: 10 }}>
                      {countdown > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.2)",
                            borderRadius: 10,
                            padding: "8px 12px",
                          }}
                        >
                          <Clock size={14} color="#60a5fa" />
                          <span
                            style={{
                              color: "#60a5fa",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            Ready in {formatCountdown(countdown)}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "rgba(245,158,11,0.08)",
                            border: "1px solid rgba(245,158,11,0.3)",
                            borderRadius: 10,
                            padding: "8px 12px",
                            animation: "pulseGold 1.5s infinite",
                          }}
                        >
                          <AlertCircle size={14} color="var(--gold-glow)" />
                          <span
                            style={{
                              color: "var(--gold-glow)",
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            Taking longer than expected...
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* Ready Banner */}
                {isReady && (
                  <div
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      animation: "pulseGold 2s infinite",
                    }}
                  >
                    <CheckCircle size={16} color="#34d399" />
                    <span
                      style={{
                        color: "#34d399",
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      Your order is ready! 🎉
                    </span>
                  </div>
                )}

                {/* Bell Button */}
                {(isExpired || isReady) && !isCancelled && (
                  <button
                    onClick={() => pressDelayBell(order.id)}
                    disabled={bellUsed}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: bellUsed
                        ? "var(--cream-06)"
                        : "var(--gold-faint)",
                      border: `1px solid ${bellUsed ? "var(--cream-15)" : "var(--gold-dim)"}`,
                      borderBottom: bellUsed
                        ? "1px solid var(--cream-15)"
                        : "3px solid #92400e",
                      borderRadius: 12,
                      cursor: bellUsed ? "not-allowed" : "pointer",
                      color: bellUsed ? "var(--cream-35)" : "var(--gold-glow)",
                      fontSize: 13,
                      fontWeight: 800,
                      fontFamily: "Inter, sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s",
                    }}
                  >
                    <Bell size={15} />
                    {bellUsed
                      ? "Waiter notified!"
                      : isReady
                        ? "Call Waiter to Serve"
                        : "Notify Kitchen"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
