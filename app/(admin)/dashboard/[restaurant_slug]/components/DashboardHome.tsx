"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2,
  ChefHat,
  Package,
  Users2,
  Bell,
  DollarSign,
  ShoppingBag,
  Table2,
  TrendingUp,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Utensils,
  Clock,
  Calendar,
  Star,
  LogOut,
  QrCode,
  UtensilsCrossed,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  Tables,
  RestaurantStats,
  MenuItemStats,
  PeakHourStats,
} from "@/types/database.types";

type Restaurant = Tables<"restaurants">;
type Order = Tables<"orders">;

interface Props {
  restaurant: Restaurant;
  staff: Tables<"restaurant_staff">;
  dailyStats: RestaurantStats | null;
  monthlyStats: RestaurantStats[];
  topItems: MenuItemStats[];
  peakHours: PeakHourStats[];
  recentOrders: Order[];
  activeOrdersCount: number;
  activeTablesCount: number;
  signalsCount: number;
  todayRevenueOverride: number;
}

type Tab = "overview" | "stats" | "menu";

function StatusIcon({ status }: { status: string }) {
  if (status === "Cancelled") return <XCircle size={14} color="#f87171" />;
  return <CheckCircle size={14} color="#34d399" />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === "Completed")
    return <span className="status-done">{status}</span>;
  if (status === "Cancelled")
    return <span className="status-cancel">{status}</span>;
  return <span className="status-pending">{status}</span>;
}

type LedgerRow = {
  total_owed: number;
  completed_sessions: number;
  is_paid: boolean;
  session_fees_collected?: number;
  platform_fees_owed?: number;
  platform_fees_paid?: number;
};

export default function DashboardHome({
  restaurant,
  dailyStats,
  monthlyStats,
  topItems,
  peakHours,
  todayRevenueOverride,
  recentOrders: initialRecentOrders,
  activeOrdersCount: initialActiveOrders,
  activeTablesCount: initialActiveTables,
  signalsCount: initialSignals,
}: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Live counts — seeded from server render, kept fresh via realtime ──
  const [activeOrdersCount, setActiveOrdersCount] =
    useState(initialActiveOrders);
  const [activeTablesCount, setActiveTablesCount] =
    useState(initialActiveTables);
  const [signalsCount, setSignalsCount] = useState(initialSignals);
  const [recentOrders, setRecentOrders] =
    useState<Order[]>(initialRecentOrders);
  const [todayLedger, setTodayLedger] = useState<LedgerRow | null>(null);
  const [todayRevenue, setTodayRevenue] = useState(todayRevenueOverride);

  // ── CRITICAL: singleton supabase client in ref ────────────────────────
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    async function refreshTodayRevenue() {
      const today = new Date().toISOString().split("T")[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const tomorrowStartDate = new Date(todayStart);
      tomorrowStartDate.setUTCDate(tomorrowStartDate.getUTCDate() + 1);
      const tomorrowStart = tomorrowStartDate.toISOString();

      try {
        // Fetch completed session tokens for today
        const { data: completedSessions } = await supabase
          .from("table_sessions")
          .select("session_token")
          .eq("restaurant_id", restaurant.id)
          .eq("status", "completed")
          .gte("closed_at", todayStart)
          .lt("closed_at", tomorrowStart);

        const completedSessionTokens =
          completedSessions?.map((s) => s.session_token) ?? [];

        // Fetch orders from completed sessions
        if (completedSessionTokens.length > 0) {
          const { data: revenueOrders } = await supabase
            .from("orders")
            .select("total_amount")
            .eq("restaurant_id", restaurant.id)
            .in("session_token", completedSessionTokens)
            .neq("status", "Cancelled");

          const revenue = (revenueOrders ?? []).reduce(
            (sum, o) => sum + Number(o.total_amount),
            0,
          );
          setTodayRevenue(revenue);
        } else {
          setTodayRevenue(0);
        }
      } catch {
        // Silently fail if revenue fetch has issues
      }
    }

    async function refreshCounts() {
      // Run revenue refresh in parallel without blocking other counts
      refreshTodayRevenue().catch(() => {});

      const [ordersRes, tablesRes, signalsRes, recentRes, ledgerRes] =
        await Promise.all([
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .in("status", ["Pending", "Preparing"]),

          supabase
            .from("table_sessions")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .eq("is_active", true),

          supabase
            .from("waiter_signals")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .eq("is_resolved", false),

          supabase
            .from("orders")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .neq("status", "Cancelled")
            .order("created_at", { ascending: false })
            .limit(10),

          supabase
            .from("daily_ledger")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .eq("ledger_date", new Date().toISOString().split("T")[0])
            .maybeSingle(),
        ]);

      if (ordersRes.count !== null) setActiveOrdersCount(ordersRes.count);
      if (tablesRes.count !== null) setActiveTablesCount(tablesRes.count);
      if (signalsRes.count !== null) setSignalsCount(signalsRes.count);
      if (recentRes.data) setRecentOrders(recentRes.data as Order[]);
      if (ledgerRes.data) setTodayLedger(ledgerRes.data as typeof todayLedger);
    }

    // Refresh immediately on mount to catch any changes since SSR
    refreshCounts();

    // Then subscribe and refresh on any relevant change
    const channel = supabase
      .channel(`dashboard-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => refreshCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => refreshCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "table_sessions",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => refreshCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "table_sessions",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => refreshCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_signals",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => refreshCounts(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "waiter_signals",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => refreshCounts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant.id, supabase]);

  // ── Static computed values from server-rendered props ─────────────────
  const mRevenue = monthlyStats.reduce((s, r) => s + (r.gross_revenue ?? 0), 0);
  const mOrders = monthlyStats.reduce((s, r) => s + (r.total_orders ?? 0), 0);
  const mTables = monthlyStats.reduce((s, r) => s + (r.tables_served ?? 0), 0);
  const mFees = monthlyStats.reduce(
    (s, r) =>
      s +
      ((r as RestaurantStats & { platform_fees?: number }).platform_fees ?? 0),
    0,
  );
  const dRevenue = todayRevenue ?? dailyStats?.gross_revenue ?? 0;
  const dOrders = dailyStats?.total_orders ?? 0;
  const dTables = dailyStats?.tables_served ?? 0;

  const maxQty = topItems[0]?.total_quantity ?? 1;
  const maxPeak = peakHours[0]?.order_count ?? 1;

  async function handleLogout() {
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/login");
    });
  }

  // Quick actions use live counts from state (not initial props)
  const quickActions = [
    {
      label: "Kitchen Display",
      desc: "View & manage live orders",
      icon: <ChefHat size={24} />,
      badge: activeOrdersCount,
      badgeUrgent: activeOrdersCount > 0,
      onClick: () =>
        startTransition(() => {
          router.push(`/kds/${restaurant.slug}`);
        }),
      color: "var(--gold-glow)",
    },
    {
      label: "Active Tables",
      desc: "Manage seated customers",
      icon: <Users2 size={24} />,
      badge: activeTablesCount,
      badgeUrgent: false,
      onClick: () =>
        startTransition(() => {
          router.push(`/kds/${restaurant.slug}`);
        }),
      color: "#60a5fa",
    },
    {
      label: "Signals",
      desc: "Pending waiter requests",
      icon: <Bell size={24} />,
      badge: signalsCount,
      badgeUrgent: signalsCount > 0,
      onClick: () =>
        startTransition(() => {
          router.push(`/kds/${restaurant.slug}`);
        }),
      color: signalsCount > 0 ? "var(--gold-glow)" : "var(--cream-35)",
    },
    {
      label: "Menu & Stock",
      desc: "Toggle item availability",
      icon: <Package size={24} />,
      badge: 0,
      badgeUrgent: false,
      onClick: () =>
        startTransition(() => {
          router.push(`/kds/${restaurant.slug}`);
        }),
      color: "#34d399",
    },
  ];

  return (
    <div className="dash-page">
      <div
        className="ambient-gold"
        style={{
          position: "fixed",
          width: 400,
          height: 400,
          top: -100,
          right: -100,
          zIndex: 0,
        }}
      />
      <div
        className="ambient-emerald"
        style={{
          position: "fixed",
          width: 300,
          height: 300,
          bottom: -80,
          left: -80,
          zIndex: 0,
        }}
      />

      {/* HEADER */}
      <header className="dash-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--gold-faint)",
              border: "1px solid var(--gold-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold-glow)",
            }}
          >
            <UtensilsCrossed size={20} />
          </div>
          <div>
            <p className="t-title" style={{ fontSize: 16 }}>
              {restaurant.name}
            </p>
            <p className="t-eyebrow">Restaurant Dashboard</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-icon" onClick={handleLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--gold-dim)",
          background: "rgba(2,44,34,0.6)",
          position: "sticky",
          top: 73,
          zIndex: 40,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {(
          [
            {
              id: "overview",
              label: "Overview",
              icon: <BarChart2 size={16} />,
            },
            {
              id: "stats",
              label: "Statistics",
              icon: <TrendingUp size={16} />,
            },
            { id: "menu", label: "Menu Items", icon: <Utensils size={16} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 12,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              border: tab === t.id ? "none" : "1px solid var(--cream-15)",
              background:
                tab === t.id
                  ? "linear-gradient(135deg, var(--gold-glow), var(--gold))"
                  : "var(--cream-06)",
              color: tab === t.id ? "#1a0e00" : "var(--cream-35)",
              transition: "all 0.2s",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="dash-content" style={{ position: "relative", zIndex: 1 }}>
        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div>
            {/* Today's Quick Stats */}
            <div className="dash-grid-2" style={{ marginBottom: 24 }}>
              {[
                {
                  label: "Today's Revenue",
                  value: `${restaurant.currency} ${Number(dRevenue).toFixed(2)}`,
                  sub: `${restaurant.currency} ${mRevenue.toFixed(2)} this month`,
                  icon: <DollarSign size={20} />,
                  up: true,
                },
                {
                  label: "Today's Orders",
                  value: String(dOrders),
                  sub: `${mOrders} this month`,
                  icon: <ShoppingBag size={20} />,
                  up: true,
                },
                {
                  label: "Tables Served",
                  value: String(dTables),
                  sub: `${mTables} this month`,
                  icon: <Table2 size={20} />,
                  up: false,
                },
                {
                  label: "NovaNode Fee Today",
                  value: `${restaurant.currency} ${(todayLedger?.total_owed ?? 0).toFixed(2)}`,
                  sub: `${todayLedger?.completed_sessions ?? 0} sessions · ${todayLedger?.is_paid ? "✓ Paid" : "Unpaid"}`,
                  icon: <TrendingUp size={20} />,
                  up: false,
                },
              ].map((card) => (
                <div key={card.label} className="dash-stat-card">
                  <div className="dash-stat-glow" />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        background: "var(--gold-faint)",
                        border: "1px solid var(--gold-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--gold-glow)",
                      }}
                    >
                      {card.icon}
                    </div>
                    {card.up && <ArrowUpRight size={16} color="#34d399" />}
                  </div>
                  <p
                    className="t-heading"
                    style={{ fontSize: 20, marginBottom: 4 }}
                  >
                    {card.value}
                  </p>
                  <p className="t-caption" style={{ marginBottom: 3 }}>
                    {card.label}
                  </p>
                  <p
                    className="t-eyebrow"
                    style={{ fontSize: 10, opacity: 0.7 }}
                  >
                    {card.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Actions — badges reflect live state */}
            <p className="t-eyebrow" style={{ marginBottom: 14 }}>
              Quick Actions
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,1fr)",
                gap: 12,
                marginBottom: 28,
              }}
            >
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${action.badgeUrgent ? "var(--gold-dim)" : "rgba(253,251,247,0.08)"}`,
                    borderRadius: 18,
                    padding: "18px 16px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    boxShadow: action.badgeUrgent
                      ? "var(--shadow-glow)"
                      : "var(--shadow-card)",
                    position: "relative",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "var(--gold-faint)",
                      border: "1px solid var(--gold-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: action.color,
                      marginBottom: 12,
                    }}
                  >
                    {action.icon}
                  </div>
                  <p
                    className="t-title"
                    style={{ fontSize: 14, marginBottom: 4 }}
                  >
                    {action.label}
                  </p>
                  <p className="t-caption">{action.desc}</p>
                  {action.badge > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        background: action.badgeUrgent
                          ? "linear-gradient(135deg, var(--gold-glow), var(--gold))"
                          : "var(--cream-06)",
                        color: action.badgeUrgent
                          ? "#1a0e00"
                          : "var(--cream-35)",
                        borderRadius: 50,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {action.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Ledger breakdown */}
            {todayLedger && (
              <div className="dash-section" style={{ marginBottom: 24 }}>
                <div className="dash-section-head">
                  <DollarSign size={17} color="var(--gold-glow)" />
                  <span className="t-title" style={{ fontSize: 15 }}>
                    Today's Ledger
                  </span>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {[
                    {
                      label: "Session fees collected",
                      value: `${restaurant.currency} ${Number((todayLedger as LedgerRow).session_fees_collected ?? 0).toFixed(2)}`,
                    },
                    {
                      label: "NovaNode fee owed",
                      value: `${restaurant.currency} ${Number(todayLedger.total_owed ?? 0).toFixed(2)}`,
                    },
                    {
                      label: "NovaNode fee settled",
                      value: `${restaurant.currency} ${Number((todayLedger as LedgerRow).platform_fees_paid ?? 0).toFixed(2)}`,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--cream-06)",
                        borderRadius: 12,
                      }}
                    >
                      <span className="t-body" style={{ fontSize: 13 }}>
                        {row.label}
                      </span>
                      <span className="t-price-sm">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders — live-updated list */}
            <div className="dash-section">
              <div className="dash-section-head">
                <Calendar size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  Recent Orders
                </span>
              </div>
              {recentOrders.length === 0 ? (
                <div className="dash-empty">No orders yet today</div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {(() => {
                    // Group by session_token, sum all orders including starters
                    const sessionMap = new Map<
                      string,
                      {
                        customer_name: string;
                        table_number: string;
                        total: number;
                        latest_time: string;
                        status: string;
                        totalOrders: number;
                        cancelledOrders: number;
                      }
                    >();

                    recentOrders.forEach((o) => {
                      const key = o.session_token ?? o.id;
                      const existing = sessionMap.get(key);
                      if (existing) {
                        existing.total += Number(o.total_amount);
                        if (o.created_at && o.created_at > existing.latest_time)
                          existing.latest_time = o.created_at;
                        existing.totalOrders += 1;
                        if (o.status === "Cancelled")
                          existing.cancelledOrders += 1;
                        else existing.status = o.status ?? "";
                        existing.totalOrders += 1;
                        if (o.status === "Cancelled")
                          existing.cancelledOrders += 1;
                        else existing.status = o.status ?? "";
                      } else {
                        sessionMap.set(key, {
                          customer_name: o.customer_name ?? "Guest",
                          table_number: o.table_number,
                          total: Number(o.total_amount),
                          latest_time: o.created_at ?? "",
                          status: o.status ?? "",
                          totalOrders: 1,
                          cancelledOrders: o.status === "Cancelled" ? 1 : 0,
                        });
                      }
                    });
                    return Array.from(sessionMap.entries()).map(([key, s]) => (
                      <div key={key} className="order-row">
                        <div className="order-icon">
                          <CheckCircle size={14} color="#34d399" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span className="t-title" style={{ fontSize: 13 }}>
                              {s.customer_name}
                            </span>
                            <span className="t-price-sm">
                              {restaurant.currency} {s.total.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                              marginTop: 4,
                            }}
                          >
                            <span className="t-caption">
                              Table {s.table_number}
                            </span>
                            <span className="t-caption">·</span>
                            <span className="t-caption">
                              {new Date(s.latest_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="t-caption">·</span>
                            <StatusLabel
                              status={
                                s.totalOrders === s.cancelledOrders
                                  ? "Cancelled"
                                  : s.status
                              }
                            />{" "}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div>
            {/* Top Dishes */}
            <div className="dash-section">
              <div className="dash-section-head">
                <Utensils size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  Top Dishes This Month
                </span>
              </div>
              {topItems.length === 0 ? (
                <div className="dash-empty">
                  <Star
                    size={28}
                    style={{
                      margin: "0 auto 10px",
                      display: "block",
                      opacity: 0.25,
                    }}
                  />
                  No orders recorded yet
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {topItems.map((item, i) => {
                    const qty = item.total_quantity ?? 0;
                    const pct = (qty / Number(maxQty)) * 100;
                    return (
                      <div
                        key={`${item.item_id}-${i}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          className={`dash-rank ${i === 0 ? "gold" : "muted"}`}
                        >
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span className="t-title" style={{ fontSize: 13 }}>
                              {item.item_name}
                            </span>
                            <span
                              className="t-eyebrow"
                              style={{ fontSize: 11 }}
                            >
                              {qty}×
                            </span>
                          </div>
                          <div className="bar-track">
                            <div
                              className={`bar-fill ${i > 0 ? "dim" : ""}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="t-caption">
                          {restaurant.currency}{" "}
                          {Number(item.total_revenue).toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Peak Hours */}
            <div className="dash-section">
              <div className="dash-section-head">
                <Clock size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  Peak Hours
                </span>
              </div>
              {peakHours.length === 0 ? (
                <div className="dash-empty">No data yet</div>
              ) : (
                <div className="peak-grid">
                  {peakHours.map((h) => {
                    const hour = Number(h.hour_of_day);
                    const label =
                      hour === 0
                        ? "12am"
                        : hour < 12
                          ? `${hour}am`
                          : hour === 12
                            ? "12pm"
                            : `${hour - 12}pm`;
                    const pct = (Number(h.order_count) / Number(maxPeak)) * 100;
                    return (
                      <div key={hour} className="peak-cell">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <span className="t-price-sm" style={{ fontSize: 13 }}>
                            {label}
                          </span>
                          <span className="t-caption">{h.order_count}</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monthly Summary */}
            <div className="dash-section">
              <div className="dash-section-head">
                <TrendingUp size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  Monthly Summary
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {[
                  {
                    label: "Total Revenue",
                    value: `${restaurant.currency} ${mRevenue.toFixed(2)}`,
                  },
                  { label: "Total Orders", value: String(mOrders) },
                  { label: "Tables Served", value: String(mTables) },
                  {
                    label: "Platform Fees",
                    value: `${restaurant.currency} ${mFees.toFixed(2)}`,
                  },
                  {
                    label: "Net Revenue",
                    value: `${restaurant.currency} ${(mRevenue - mFees).toFixed(2)}`,
                  },
                  {
                    label: "Avg Order Value",
                    value:
                      mOrders > 0
                        ? `${restaurant.currency} ${(mRevenue / mOrders).toFixed(2)}`
                        : "N/A",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--cream-06)",
                      borderRadius: 12,
                    }}
                  >
                    <span className="t-body" style={{ fontSize: 13 }}>
                      {row.label}
                    </span>
                    <span className="t-price-sm">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MENU TAB ── */}
        {tab === "menu" && (
          <div>
            <div className="dash-section">
              <div className="dash-section-head">
                <Utensils size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  Menu Management
                </span>
              </div>
              <p className="t-body" style={{ marginBottom: 20 }}>
                Full menu editing coming in the next update. For now manage
                stock availability from the Kitchen Display.
              </p>
              <button
                className="btn-primary"
                onClick={() => router.push(`/kds/${restaurant.slug}`)}
              >
                <ChefHat size={18} /> Go to Kitchen Display
              </button>
            </div>

            {/* QR Codes */}
            <div className="dash-section">
              <div className="dash-section-head">
                <QrCode size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  QR Codes
                </span>
              </div>
              <p className="t-body" style={{ marginBottom: 16 }}>
                Generate QR codes for each table. Customers scan to access your
                digital menu instantly.
              </p>
              <p className="t-caption" style={{ marginBottom: 20 }}>
                Your menu URL:{" "}
                <strong style={{ color: "var(--gold-glow)" }}>
                  {typeof window !== "undefined" ? window.location.origin : ""}/
                  {restaurant.slug}?table=
                </strong>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((tableNum) => (
                  <div
                    key={tableNum}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--surface-2)",
                      border: "1px solid var(--cream-06)",
                      borderRadius: 12,
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <QrCode size={16} color="var(--gold-glow)" />
                      <span className="t-title" style={{ fontSize: 14 }}>
                        Table {tableNum}
                      </span>
                    </div>
                    <button
                      className="btn-ghost"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                      onClick={() => {
                        const url = `${window.location.origin}/${restaurant.slug}?table=${tableNum}`;
                        navigator.clipboard.writeText(url);
                      }}
                    >
                      Copy Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
