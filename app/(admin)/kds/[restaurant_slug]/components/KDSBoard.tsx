"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database.types";
import {
  ChefHat,
  Bell,
  Droplets,
  Receipt,
  HandPlatter,
  CheckCircle,
  Clock,
  Flame,
  Package,
  Users2,
  DollarSign,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  X,
  AlertTriangle,
  RefreshCw,
  LogOut,
} from "lucide-react";
import {
  playNewOrder,
  playSignalAlert,
  playStarterAlert,
  playBillAlert,
} from "@/lib/sounds";
import TimeAgo from "./TimeAgo";

type Restaurant = Tables<"restaurants">;
type Order = Tables<"orders">;
type Session = Tables<"table_sessions">;
type MenuItem = Tables<"menu_items">;

interface Signal {
  id: string;
  restaurant_id: string | null;
  table_number: string;
  customer_name: string | null;
  signal_type: string;
  is_resolved: boolean | null;
  created_at: string | null;
}

interface KDSBoardProps {
  restaurant: Restaurant;
  initialOrders: Order[];
  initialSessions: Session[];
  initialSignals: Signal[];
  menuItems: MenuItem[];
  todayRevenue: number;
  todayCount: number;
}

type KDSTab = "orders" | "signals" | "stock" | "tables" | "ledger";
const STATUS_FLOW = ["Pending", "Preparing", "Ready", "Served"] as const;
type OrderStatus = (typeof STATUS_FLOW)[number];

interface OrderItemModifier {
  option: string;
  price: number;
}

interface OrderCardItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: OrderItemModifier[];
  specialInstructions?: string;
}

function isOrderCardItem(item: unknown): item is OrderCardItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.quantity === "number" &&
    typeof candidate.price === "number"
  );
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "rgba(245,158,11,0.15)",
  Preparing: "rgba(59,130,246,0.15)",
  Ready: "rgba(16,185,129,0.15)",
  Served: "rgba(253,251,247,0.06)",
};
const STATUS_BORDER: Record<string, string> = {
  Pending: "rgba(245,158,11,0.35)",
  Preparing: "rgba(59,130,246,0.35)",
  Ready: "rgba(16,185,129,0.35)",
  Served: "rgba(253,251,247,0.1)",
};
const STATUS_TEXT: Record<string, string> = {
  Pending: "var(--gold-glow)",
  Preparing: "#60a5fa",
  Ready: "#34d399",
  Served: "var(--cream-35)",
};

function signalIcon(type: string) {
  switch (type) {
    case "call_waiter":
      return <HandPlatter size={18} />;
    case "napkins":
      return <Bell size={18} />;
    case "water":
      return <Droplets size={18} />;
    case "bill":
      return <Receipt size={18} />;
    default:
      return <Bell size={18} />;
  }
}

function signalLabel(type: string) {
  switch (type) {
    case "call_waiter":
      return "Waiter Requested";
    case "napkins":
      return "Napkins Needed";
    case "water":
      return "Water Requested";
    case "bill":
      return "Bill Requested";
    default:
      return type;
  }
}

function TimeEstimatePicker({
  isUpdating,
  onConfirm,
}: {
  isUpdating: boolean;
  onConfirm: (minutes: number) => void;
}) {
  const [custom, setCustom] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const presets = [10, 15, 20, 30, 45];
  const ready = selected !== null || (custom !== "" && parseInt(custom) > 0);

  return (
    <div style={{ flex: 1 }}>
      <p className="t-caption" style={{ marginBottom: 8 }}>
        Set prep time:
      </p>
      <div
        style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}
      >
        {presets.map((m) => (
          <button
            key={m}
            onClick={() => setSelected(m)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              background:
                selected === m
                  ? "linear-gradient(135deg, var(--gold-glow), var(--gold))"
                  : "var(--cream-06)",
              border: selected === m ? "none" : "1px solid var(--cream-15)",
              color: selected === m ? "#1a0e00" : "var(--cream-35)",
              transition: "all 0.15s",
            }}
          >
            {m}m
          </button>
        ))}
        <input
          type="number"
          placeholder="Custom"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setSelected(null);
          }}
          style={{
            width: 72,
            padding: "6px 10px",
            borderRadius: 8,
            background: "var(--cream-06)",
            border: "1px solid var(--cream-15)",
            color: "var(--cream)",
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            outline: "none",
          }}
        />
      </div>
      <button
        onClick={() => {
          const mins = selected ?? parseInt(custom);
          if (!mins || mins < 1) return;
          onConfirm(mins);
        }}
        disabled={isUpdating || !ready}
        style={{
          width: "100%",
          padding: "10px",
          background: "linear-gradient(135deg, var(--gold-glow), var(--gold))",
          border: "none",
          borderBottom: "3px solid #92400e",
          borderRadius: 10,
          cursor: ready ? "pointer" : "not-allowed",
          color: "#1a0e00",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "Inter, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          transition: "all 0.15s",
          opacity: ready ? 1 : 0.5,
        }}
      >
        {isUpdating ? (
          <>
            <RefreshCw size={14} /> Starting...
          </>
        ) : (
          <>Start Preparing</>
        )}
      </button>
    </div>
  );
}
type LedgerRow = {
  id: string;
  total_owed: number;
  completed_sessions: number;
  is_paid: boolean;
  ledger_date: string;
  paid_amount?: number;
  session_fees_collected?: number;
  platform_fees_owed?: number;
  platform_fees_paid?: number;
};

export default function KDSBoard({
  restaurant,
  initialOrders,
  initialSessions,
  initialSignals,
  menuItems,
  todayRevenue,
  todayCount,
}: KDSBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [signals, setSignals] = useState<Signal[]>(initialSignals);
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [revenue, setRevenue] = useState(todayRevenue);
  const [orderCount, setOrderCount] = useState(todayCount);
  const [ledger, setLedger] = useState<LedgerRow | null>(null);
  const [payingLedger, setPayingLedger] = useState(false);
  const [closingTable, setClosingTable] = useState<string | null>(null);
  const [unpaidLedgers, setUnpaidLedgers] = useState<
    {
      ledger_date: string;
      total_owed: number | null;
    }[]
  >([]);

  const [activeTab, setActiveTab] = useState<KDSTab>("orders");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [closingWarning, setClosingWarning] = useState<
    "approaching" | "overdue" | null
  >(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentSuccess(true);
      setClosingWarning(null);
      setActiveTab("ledger");
      window.history.replaceState({}, "", window.location.pathname);
      fetchLedger();
    }
  }, []);

  useEffect(() => {
    if (!restaurant.closing_time) return;

    function checkClosingTime() {
      const now = new Date();
      const [hours, minutes] = restaurant.closing_time!.split(":").map(Number);
      const closing = new Date();
      closing.setHours(hours, minutes, 0, 0);

      const diffMs = closing.getTime() - now.getTime();
      const diffMins = diffMs / 60000;

      if (diffMins <= 0) {
        // Only show overdue if there's an unpaid balance
        const hasOutstanding =
          (ledger && Number(ledger.total_owed ?? 0) > 0) ||
          unpaidLedgers.length > 0;
        if (hasOutstanding) {
          setClosingWarning("overdue");
          supabaseRef.current
            .from("restaurants")
            .update({ payment_overdue: true })
            .eq("id", restaurant.id)
            .then(() => {});
        } else {
          setClosingWarning(null);
        }
      } else if (diffMins <= 30) {
        setClosingWarning("approaching");
      } else {
        setClosingWarning(null);
      }
    }

    checkClosingTime();
    const interval = setInterval(checkClosingTime, 60000);
    return () => clearInterval(interval);
  }, [restaurant.closing_time, restaurant.id, ledger, unpaidLedgers]);

  // ── CRITICAL: supabase client in a ref — one instance for this component ──
  const supabaseRef = useRef(createClient());

  // ── Order status updates ───────────────────────────────────────────────
  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdatingOrder(orderId);
    const { error } = await supabaseRef.current
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      // Optimistic update — don't wait for realtime
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    }
    setUpdatingOrder(null);
  }

  async function updateOrderStatusWithTime(orderId: string, minutes: number) {
    setUpdatingOrder(orderId);
    const { error } = await supabaseRef.current
      .from("orders")
      .update({
        status: "Preparing",
        estimated_minutes: minutes,
        preparation_started_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "Preparing",
                estimated_minutes: minutes,
                preparation_started_at: new Date().toISOString(),
              }
            : o,
        ),
      );
    }
    setUpdatingOrder(null);
  }

  async function resolveSignal(signalId: string) {
    await supabaseRef.current
      .from("waiter_signals")
      .update({ is_resolved: true })
      .eq("id", signalId);
  }

  async function toggleStock(itemId: string, current: boolean) {
    await supabaseRef.current
      .from("menu_items")
      .update({ is_available: !current })
      .eq("id", itemId);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, is_available: !current } : i)),
    );
  }

  async function fetchLedger() {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseRef.current
      .from("daily_ledger")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("ledger_date", today)
      .maybeSingle();
    if (data) setLedger(data as LedgerRow);

    // Fetch unpaid previous days
    const { data: unpaid } = await supabaseRef.current
      .from("daily_ledger")
      .select("ledger_date, total_owed")
      .eq("restaurant_id", restaurant.id)
      .eq("is_paid", false)
      .lt("ledger_date", today)
      .gt("total_owed", 0)
      .order("ledger_date", { ascending: false });
    setUnpaidLedgers(
      (unpaid ?? []).map((l) => ({
        ...l,
        total_owed: l.total_owed ?? 0,
      })),
    );
  }

  async function closeTable(sessionId: string) {
    if (closingTable === sessionId) return;
    setClosingTable(sessionId);

    const session = sessions.find((s) => s.id === sessionId);
    if (!session) {
      setClosingTable(null);
      return;
    }

    const sessionOrders = orders.filter(
      (o) =>
        o.session_token === session.session_token && o.status !== "Cancelled",
    );
    const orderData = [...sessionOrders];
    const foodTotal = orderData.reduce((s, o) => s + Number(o.total_amount), 0);
    const rawFee = Math.round(foodTotal * 0.01 * 100) / 100;
    const dynamicFee = foodTotal > 0 ? Math.min(Math.max(rawFee, 1), 15) : 0;

    await supabaseRef.current
      .from("table_sessions")
      .update({
        is_active: false,
        status: "completed",
        closed_at: new Date().toISOString(),
        session_total: foodTotal as never,
        platform_fee_charged: dynamicFee as never,
      })
      .eq("id", sessionId);
    if (foodTotal >= 0) {
      // 1. Session fee ledger (what restaurant collects from customer)
      await supabaseRef.current.rpc("increment_daily_ledger", {
        p_restaurant_id: restaurant.id,
        p_session_fee: dynamicFee,
        p_platform_fee: dynamicFee,
      } as any);
      // Update revenue and order count instantly
      setRevenue((prev) => prev + foodTotal);
      setOrderCount((prev) => prev + orderData.length);

      await fetchLedger();
    }
    // Burn old table token and generate new one after close
    try {
      await fetch("/api/admin/rotate-table-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          table_number: session.table_number,
        }),
      });
    } catch {
      // Non-critical — don't block table close if token rotation fails
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setClosingTable(null);
  }

  // ── Realtime channel ───────────────────────────────────────────────────
  useEffect(() => {
    // Fetch today's ledger
    if (paymentSuccess) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    fetchLedger();
    const channel = supabaseRef.current
      .channel(`kds-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => {
            // Guard: prevent duplicates if realtime fires twice
            if (prev.find((o) => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
          });
          setOrderCount((c) => c + 1);
          if (newOrder.is_starter_order) playStarterAlert();
          else playNewOrder();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          const previous = payload.old as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o)),
          );

          if (updated.status === "Served" && previous.status !== "Served") {
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "table_sessions",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const newSession = payload.new as Session;
          setSessions((prev) => {
            if (prev.find((s) => s.id === newSession.id)) return prev;
            return [...prev, newSession];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_signals",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const sig = payload.new as Signal;
          setSignals((prev) => {
            if (prev.find((s) => s.id === sig.id)) return prev;
            return [...prev, sig];
          });
          if (sig.signal_type === "bill") playBillAlert();
          else playSignalAlert();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "waiter_signals",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const updated = payload.new as Signal;
          setSignals((prev) =>
            updated.is_resolved
              ? prev.filter((s) => s.id !== updated.id)
              : prev.map((s) => (s.id === updated.id ? updated : s)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "table_sessions",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          const updated = payload.new as Session;
          setSessions((prev) =>
            updated.is_active
              ? prev.map((s) => (s.id === updated.id ? updated : s))
              : prev.filter((s) => s.id !== updated.id),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "menu_items",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((i) =>
              i.id === (payload.new as MenuItem).id
                ? (payload.new as MenuItem)
                : i,
            ),
          );
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "[KDS] Realtime channel error — will retry on next event",
          );
        }
      });
    // ── CRITICAL: clean up channel on unmount ──
    return () => {
      supabaseRef.current.removeChannel(channel);
    };
  }, [restaurant.id]);

  // ── Derived state ──────────────────────────────────────────────────────
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const preparingOrders = orders.filter((o) => o.status === "Preparing");
  const activeSignals = signals.filter((s) => !s.is_resolved);
  const activeOrders = orders.filter(
    (o) => o.status !== "Served" && o.status !== "Cancelled",
  );

  const tabs: {
    id: KDSTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "orders",
      label: "Orders",
      icon: <ChefHat size={18} />,
      badge: pendingOrders.length + preparingOrders.length,
    },
    { id: "ledger", label: "Ledger", icon: <DollarSign size={18} /> },
    {
      id: "signals",
      label: "Signals",
      icon: <Bell size={18} />,
      badge: activeSignals.length,
    },
    { id: "stock", label: "Stock", icon: <Package size={18} /> },
    {
      id: "tables",
      label: "Tables",
      icon: <Users2 size={18} />,
      badge: sessions.length,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
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

      {/* Suspension overlay */}
      {!restaurant.is_active && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(2,20,12,0.97)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter, sans-serif",
            padding: 24,
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 420 }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
            <h1
              style={{
                color: "#FDFBF7",
                fontWeight: 900,
                fontSize: 24,
                marginBottom: 8,
              }}
            >
              {restaurant.name}
            </h1>
            <p
              style={{
                color: "rgba(253,251,247,0.5)",
                fontSize: 13,
                lineHeight: 1.6,
                marginBottom: 24,
              }}
            >
              This restaurant has been suspended. Settle all outstanding balance
              to restore service.
            </p>
            {unpaidLedgers.length > 0 && (
              <>
                <p
                  style={{
                    color: "#fca5a5",
                    fontSize: 28,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  {restaurant.currency}{" "}
                  {unpaidLedgers
                    .reduce((s, l) => s + Number(l.total_owed ?? 0), 0)
                    .toFixed(2)}
                </p>
                <p
                  style={{
                    color: "rgba(252,165,165,0.4)",
                    fontSize: 12,
                    marginBottom: 24,
                  }}
                >
                  Outstanding from {unpaidLedgers.length} previous{" "}
                  {unpaidLedgers.length === 1 ? "day" : "days"}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const totalOutstanding = unpaidLedgers.reduce(
                      (s, l) => s + Number(l.total_owed),
                      0,
                    );
                    const amountKobo = Math.round(totalOutstanding * 100);
                    try {
                      const res = await fetch("/api/paystack/initialize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          restaurant_id: restaurant.id,
                          ledger_date: unpaidLedgers[0].ledger_date,
                          amount_kobo: amountKobo,
                          email: "settlement@novanode.app",
                          settle_all_unpaid: true,
                        }),
                      });
                      const data = await res.json();
                      if (data.authorization_url) {
                        window.location.href = data.authorization_url;
                      }
                    } catch (e) {
                      console.error("Settlement init failed:", e);
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    backgroundColor: "rgba(239,68,68,0.15)",
                    color: "#fca5a5",
                    border: "1px solid rgba(239,68,68,0.35)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  Settle Outstanding — {restaurant.currency}{" "}
                  {unpaidLedgers
                    .reduce((s, l) => s + Number(l.total_owed), 0)
                    .toFixed(2)}
                </button>
              </>
            )}
            {unpaidLedgers.length === 0 && (
              <p style={{ color: "rgba(253,251,247,0.3)", fontSize: 12 }}>
                Contact NovaNode support to restore access.
              </p>
            )}
          </div>
        </div>
      )}
      {/* HEADER */}
      <header
        className="dash-header"
        style={{ position: "sticky", top: 0, zIndex: 50 }}
      >
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
            <ChefHat size={20} />
          </div>
          <div>
            <p className="t-title" style={{ fontSize: 15 }}>
              {restaurant.name}
            </p>
            <p className="t-eyebrow">Kitchen Display</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={13} color="var(--cream-35)" />
              <span className="t-caption">{orderCount} orders today</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 2,
              }}
            >
              <DollarSign size={13} color="var(--gold-glow)" />
              <span className="t-price-sm">
                {restaurant.currency} {revenue.toFixed(2)}
              </span>
            </div>
          </div>
          {activeSignals.length > 0 && (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(245,158,11,0.15)",
                border: "1px solid rgba(245,158,11,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold-glow)",
                animation: "pulseGold 1.5s infinite",
              }}
            >
              <Bell size={16} />
            </div>
          )}
        </div>
      </header>

      {closingWarning === "approaching" && (
        <div className="mx-4 mt-3 px-5 py-4 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-base font-semibold flex items-center gap-3 shadow-lg shadow-amber-900/20">
          <span className="text-xl">⏰</span>
          <span>
            Closing time approaching — settle today&apos;s ledger before
            closing.
          </span>
        </div>
      )}

      {closingWarning === "overdue" && (
        <div className="mx-4 mt-3 px-5 py-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 text-base font-semibold flex items-center gap-3 shadow-lg shadow-red-900/20">
          <span className="text-xl">🔴</span>
          <span>
            Past closing time — ledger payment is overdue. Settle now to avoid
            suspension.
          </span>
        </div>
      )}

      {/* TABS */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--gold-dim)",
          background: "color-mix(in srgb, var(--theme-bg) 60%, transparent)",
          position: "sticky",
          top: 73,
          zIndex: 40,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 12,
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              border:
                activeTab === tab.id ? "none" : "1px solid var(--cream-15)",
              background:
                activeTab === tab.id
                  ? "linear-gradient(135deg, var(--gold-glow), var(--gold))"
                  : "var(--cream-06)",
              color: activeTab === tab.id ? "#1a0e00" : "var(--cream-35)",
              transition: "all 0.2s",
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                style={{
                  background: activeTab === tab.id ? "#1a0e00" : "var(--gold)",
                  color: activeTab === tab.id ? "var(--gold)" : "#1a0e00",
                  borderRadius: 50,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: "20px 16px", position: "relative", zIndex: 1 }}>
        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            {activeOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <ChefHat
                  size={40}
                  color="var(--cream-35)"
                  style={{
                    margin: "0 auto 16px",
                    display: "block",
                    opacity: 0.3,
                  }}
                />
                <p className="t-body">No active orders right now</p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {activeOrders.map((order) => {
                  const orderItems: OrderCardItem[] = Array.isArray(order.items)
                    ? order.items.reduce<OrderCardItem[]>(
                        (items, item) =>
                          isOrderCardItem(item) ? [...items, item] : items,
                        [],
                      )
                    : [];
                  const currentIdx = STATUS_FLOW.indexOf(
                    order.status as OrderStatus,
                  );
                  const nextStatus =
                    currentIdx < STATUS_FLOW.length - 1
                      ? STATUS_FLOW[currentIdx + 1]
                      : null;
                  const isUpdating = updatingOrder === order.id;
                  const orderAge =
                    new Date().getTime() -
                    new Date(order.created_at ?? "").getTime();
                  const isUrgent =
                    order.status === "Pending" && orderAge > 300000;
                  const isStarter = order.is_starter_order;

                  return (
                    <div
                      key={order.id}
                      style={{
                        background: STATUS_COLORS[order.status ?? "Pending"],
                        border: `1px solid ${STATUS_BORDER[order.status ?? "Pending"]}`,
                        borderRadius: 20,
                        padding: 18,
                        boxShadow: "var(--shadow-card)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Order header */}
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
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 12,
                              background:
                                STATUS_COLORS[order.status ?? "Pending"],
                              border: `1px solid ${STATUS_BORDER[order.status ?? "Pending"]}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: STATUS_TEXT[order.status ?? "Pending"],
                            }}
                          >
                            {order.status === "Pending" && <Clock size={20} />}
                            {order.status === "Preparing" && (
                              <Flame size={20} />
                            )}
                            {order.status === "Ready" && (
                              <CheckCircle size={20} />
                            )}
                            {order.status === "Served" && <Package size={20} />}
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <p
                                style={{
                                  color: "var(--cream)",
                                  fontWeight: 900,
                                  fontSize: 18,
                                  letterSpacing: "-0.3px",
                                }}
                              >
                                Table {order.table_number}
                              </p>
                              {isStarter && (
                                <span
                                  style={{
                                    background: "rgba(16,185,129,0.15)",
                                    border: "1px solid rgba(16,185,129,0.3)",
                                    color: "#34d399",
                                    fontSize: 9,
                                    fontWeight: 800,
                                    padding: "2px 8px",
                                    borderRadius: 50,
                                    letterSpacing: 1,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  Starter
                                </span>
                              )}
                              {isUrgent && (
                                <AlertTriangle
                                  size={14}
                                  color="var(--gold-glow)"
                                />
                              )}
                            </div>
                            <p className="t-caption" style={{ marginTop: 2 }}>
                              {order.customer_name ?? "Guest"} ·{" "}
                              <TimeAgo dateStr={order.created_at} />
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p className="t-price-sm">
                            {restaurant.currency}{" "}
                            {Number(order.total_amount).toFixed(2)}
                          </p>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: 1.5,
                              textTransform: "uppercase",
                              color: STATUS_TEXT[order.status ?? "Pending"],
                              background:
                                STATUS_COLORS[order.status ?? "Pending"],
                              border: `1px solid ${STATUS_BORDER[order.status ?? "Pending"]}`,
                              padding: "3px 10px",
                              borderRadius: 50,
                              display: "inline-block",
                              marginTop: 6,
                            }}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Order items */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          marginBottom: 14,
                        }}
                      >
                        {orderItems.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "var(--cream-06)",
                              borderRadius: 10,
                              padding: "8px 12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 8,
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  background: "var(--gold-faint)",
                                  border: "1px solid var(--gold-dim)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 12,
                                  fontWeight: 900,
                                  color: "var(--gold-glow)",
                                  flexShrink: 0,
                                }}
                              >
                                {item.quantity}
                              </span>
                              <span style={{ minWidth: 0 }}>
                                <span
                                  className="t-body"
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    display: "block",
                                  }}
                                >
                                  {item.name}
                                </span>
                                {item.modifiers?.map((mod, modIndex) => (
                                  <span
                                    key={modIndex}
                                    style={{
                                      fontSize: 11,
                                      color: "var(--theme-text-dim)",
                                      display: "block",
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    {mod.option}
                                    {mod.price > 0
                                      ? ` +${restaurant.currency} ${mod.price.toFixed(2)}`
                                      : ""}
                                  </span>
                                ))}
                                {item.specialInstructions && (
                                  <span
                                    style={{
                                      fontSize: 11,
                                      color: "var(--theme-accent)",
                                      display: "block",
                                      lineHeight: 1.35,
                                    }}
                                  >
                                    Note: {item.specialInstructions}
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="t-caption">
                              {restaurant.currency}{" "}
                              {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", gap: 8 }}>
                        {nextStatus && nextStatus === "Preparing" ? (
                          <TimeEstimatePicker
                            isUpdating={isUpdating}
                            onConfirm={(minutes) =>
                              updateOrderStatusWithTime(order.id, minutes)
                            }
                          />
                        ) : nextStatus ? (
                          <button
                            onClick={() =>
                              updateOrderStatus(order.id, nextStatus)
                            }
                            disabled={isUpdating}
                            style={{
                              flex: 1,
                              padding: "11px 16px",
                              background: isUpdating
                                ? "var(--cream-06)"
                                : "linear-gradient(135deg, var(--gold-glow), var(--gold))",
                              border: "none",
                              borderBottom: isUpdating
                                ? "none"
                                : "3px solid #92400e",
                              borderRadius: 12,
                              cursor: isUpdating ? "not-allowed" : "pointer",
                              color: isUpdating ? "var(--cream-35)" : "#1a0e00",
                              fontSize: 13,
                              fontWeight: 800,
                              fontFamily: "Inter, sans-serif",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              transition: "all 0.15s",
                            }}
                          >
                            {isUpdating ? (
                              <>
                                <RefreshCw size={14} /> Updating...
                              </>
                            ) : (
                              <>Mark as {nextStatus}</>
                            )}
                          </button>
                        ) : null}
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "Cancelled")
                          }
                          style={{
                            padding: "11px 14px",
                            borderRadius: 12,
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            color: "#f87171",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "Inter, sans-serif",
                            transition: "all 0.2s",
                          }}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SIGNALS TAB */}
        {activeTab === "signals" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeSignals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <CheckCircle
                  size={40}
                  color="var(--cream-35)"
                  style={{
                    margin: "0 auto 16px",
                    display: "block",
                    opacity: 0.3,
                  }}
                />
                <p className="t-body">All clear — no pending signals</p>
              </div>
            ) : (
              activeSignals.map((signal) => (
                <div
                  key={signal.id}
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 18,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "var(--shadow-glow)",
                    animation: "pulseGold 3s infinite",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      flexShrink: 0,
                      background: "var(--gold-faint)",
                      border: "1px solid var(--gold-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--gold-glow)",
                    }}
                  >
                    {signalIcon(signal.signal_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      className="t-title"
                      style={{ fontSize: 14, marginBottom: 3 }}
                    >
                      {signalLabel(signal.signal_type)}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--cream)",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        Table {signal.table_number}
                      </p>
                      {signal.customer_name && (
                        <>
                          <span className="t-caption">·</span>
                          <p className="t-caption">{signal.customer_name}</p>
                        </>
                      )}
                      <span className="t-caption">·</span>
                      <p className="t-caption">
                        <TimeAgo dateStr={signal.created_at} />
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => resolveSignal(signal.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 10,
                      background: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#34d399",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "Inter, sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                      transition: "all 0.2s",
                    }}
                  >
                    <CheckCircle size={14} /> Done
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === "stock" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="t-body" style={{ marginBottom: 8 }}>
              Toggle items instantly. Changes reflect on all customer menus
              immediately.
            </p>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  background: item.is_available
                    ? "var(--cream-06)"
                    : "rgba(239,68,68,0.06)",
                  border: `1px solid ${item.is_available ? "var(--cream-06)" : "rgba(239,68,68,0.2)"}`,
                  borderRadius: 16,
                  padding: "14px 16px",
                  transition: "all 0.2s",
                  opacity: item.is_available ? 1 : 0.6,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    className="t-title"
                    style={{ fontSize: 14, marginBottom: 2 }}
                  >
                    {item.name_en}
                  </p>
                  <p className="t-caption">
                    {restaurant.currency} {Number(item.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    toggleStock(item.id, item.is_available ?? true)
                  }
                  style={{
                    cursor: "pointer",
                    color: item.is_available ? "#34d399" : "#f87171",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "Inter, sans-serif",
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: item.is_available
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(239,68,68,0.08)",
                    border: `1px solid ${item.is_available ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    transition: "all 0.2s",
                  }}
                >
                  {item.is_available ? (
                    <>
                      <ToggleRight size={16} /> Available
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={16} /> Unavailable
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TABLES TAB */}
        {activeTab === "tables" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="t-body" style={{ marginBottom: 8 }}>
              Close a table when the customer has paid and left.
            </p>
            {sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Users2
                  size={40}
                  color="var(--cream-35)"
                  style={{
                    margin: "0 auto 16px",
                    display: "block",
                    opacity: 0.3,
                  }}
                />
                <p className="t-body">No active tables right now</p>
              </div>
            ) : (
              sessions.map((session) => {
                const tableOrders = orders.filter(
                  (o) =>
                    o.session_token === session.session_token &&
                    o.status !== "Cancelled",
                );
                const tableTotal = tableOrders.reduce(
                  (s, o) => s + Number(o.total_amount),
                  0,
                );
                return (
                  <div
                    key={session.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--gold-dim)",
                      borderRadius: 20,
                      padding: 18,
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
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
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
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
                            color: "var(--gold-glow)",
                          }}
                        >
                          <Users2 size={20} />
                        </div>
                        <div>
                          <p
                            style={{
                              color: "var(--cream)",
                              fontWeight: 900,
                              fontSize: 18,
                            }}
                          >
                            Table {session.table_number}
                          </p>
                          <p className="t-caption">{session.customer_name}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="t-price-sm">
                          {restaurant.currency} {tableTotal.toFixed(2)}
                        </p>
                        <p className="t-caption">
                          {tableOrders.length} order
                          {tableOrders.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {/* Bill settlement flow */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {session.bill_status === "none" ||
                      !session.bill_status ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={async () => {
                              const unservedForTable = orders.filter(
                                (o) =>
                                  o.session_token === session.session_token &&
                                  o.status !== "Cancelled" &&
                                  o.status !== "Served",
                              );
                              if (unservedForTable.length > 0) {
                                alert(
                                  `${unservedForTable.length} order${unservedForTable.length > 1 ? "s are" : " is"} not served yet. Mark all orders as Served or Cancelled before presenting the bill.`,
                                );
                                return;
                              }
                              await supabaseRef.current
                                .from("table_sessions")
                                .update({ bill_status: "presented" })
                                .eq("id", session.id);
                              setSessions((prev) =>
                                prev.map((s) =>
                                  s.id === session.id
                                    ? { ...s, bill_status: "presented" }
                                    : s,
                                ),
                              );
                            }}
                            style={{
                              flex: 1,
                              padding: "11px 16px",
                              background: "var(--gold-faint)",
                              border: "1px solid var(--gold-dim)",
                              borderBottom: "3px solid #92400e",
                              borderRadius: 12,
                              cursor: "pointer",
                              color: "var(--gold-glow)",
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
                            <Receipt size={15} /> Present Bill
                          </button>
                        </div>
                      ) : session.bill_status === "presented" ? (
                        <div>
                          <p
                            className="t-caption"
                            style={{
                              marginBottom: 8,
                              textAlign: "center",
                            }}
                          >
                            Bill presented — waiting for payment
                          </p>
                          <button
                            onClick={async () => {
                              await supabaseRef.current
                                .from("table_sessions")
                                .update({ bill_status: "paid" })
                                .eq("id", session.id);
                              setSessions((prev) =>
                                prev.map((s) =>
                                  s.id === session.id
                                    ? { ...s, bill_status: "paid" }
                                    : s,
                                ),
                              );
                            }}
                            style={{
                              width: "100%",
                              padding: "11px 16px",
                              background: "rgba(16,185,129,0.1)",
                              border: "1px solid rgba(16,185,129,0.3)",
                              borderRadius: 12,
                              cursor: "pointer",
                              color: "#34d399",
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
                            <CheckCircle size={15} /> Confirm Payment Received
                          </button>
                        </div>
                      ) : session.bill_status === "paid" ? (
                        <div>
                          <div
                            style={{
                              background: "rgba(16,185,129,0.08)",
                              border: "1px solid rgba(16,185,129,0.2)",
                              borderRadius: 10,
                              padding: "10px 14px",
                              marginBottom: 10,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <CheckCircle size={14} color="#34d399" />
                            <span
                              style={{
                                color: "#34d399",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              Payment confirmed — safe to close
                            </span>
                          </div>
                          <button
                            onClick={() => closeTable(session.id)}
                            disabled={closingTable === session.id}
                            style={{
                              width: "100%",
                              padding: "11px 16px",
                              background:
                                closingTable === session.id
                                  ? "var(--cream-06)"
                                  : "rgba(239,68,68,0.1)",
                              border:
                                closingTable === session.id
                                  ? "none"
                                  : "1px solid rgba(239,68,68,0.3)",
                              borderRadius: 12,
                              cursor:
                                closingTable === session.id
                                  ? "not-allowed"
                                  : "pointer",
                              color:
                                closingTable === session.id
                                  ? "var(--cream-35)"
                                  : "#f87171",
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
                            {closingTable === session.id ? (
                              <>
                                <RefreshCw size={15} className="animate-spin" />{" "}
                                Closing...
                              </>
                            ) : (
                              <>
                                <LogOut size={15} /> Close Table
                              </>
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* LEDGER TAB */}
        {activeTab === "ledger" && (
          <div>
            {paymentSuccess && (
              <div
                style={{
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle size={18} color="#34d399" />
                <span
                  style={{ color: "#34d399", fontWeight: 700, fontSize: 14 }}
                >
                  Payment successful! NovaNode fee settled.
                </span>
              </div>
            )}

            {/* Unpaid amount */}
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--gold-dim)",
                borderRadius: 20,
                padding: 20,
                marginBottom: 12,
                boxShadow: "var(--shadow-card)",
              }}
            >
              <p className="t-eyebrow" style={{ marginBottom: 6 }}>
                Today&apos;s Ledger
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span className="t-caption">Session fees collected</span>
                <span className="t-body">
                  {restaurant.currency}{" "}
                  {Number(ledger?.session_fees_collected ?? 0).toFixed(2)}
                </span>
              </div>

              <div className="divider" style={{ margin: "12px 0" }} />

              <p className="t-eyebrow" style={{ marginBottom: 6 }}>
                Outstanding NovaNode Fee
              </p>
              <p className="t-price" style={{ fontSize: 32, marginBottom: 4 }}>
                {restaurant.currency}{" "}
                {Number(ledger?.total_owed ?? 0).toFixed(2)}
              </p>
              <p className="t-caption">
                {ledger?.completed_sessions ?? 0} closed sessions · 1% per
                session (max {restaurant.currency} 15.00)
              </p>

              {Number(ledger?.platform_fees_paid ?? 0) > 0 && (
                <div
                  style={{
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    margin: "12px 0 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="t-caption">Total settled today</span>
                  <span
                    style={{ color: "#34d399", fontWeight: 800, fontSize: 14 }}
                  >
                    {restaurant.currency}{" "}
                    {Number(ledger?.platform_fees_paid ?? 0).toFixed(2)} ✓
                  </span>
                </div>
              )}

              <div className="divider" style={{ margin: "16px 0" }} />

              {!ledger || ledger.total_owed === 0 ? (
                <p
                  className="t-body"
                  style={{ textAlign: "center", opacity: 0.5 }}
                >
                  No sessions completed today yet.
                </p>
              ) : ledger.is_paid ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "12px",
                    background: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 12,
                  }}
                >
                  <CheckCircle size={16} color="#34d399" />
                  <span
                    style={{ color: "#34d399", fontWeight: 700, fontSize: 14 }}
                  >
                    All fees paid for today ✓
                  </span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    setPayingLedger(true);
                    try {
                      const res = await fetch("/api/paystack/initialize", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          restaurant_id: restaurant.id,
                          ledger_date: ledger.ledger_date,
                          amount_kobo: Math.round(
                            Number(ledger.total_owed) * 100,
                          ),
                          email:
                            (restaurant as Restaurant & { email?: string })
                              .email ?? "pay@novanode.com",
                        }),
                      });
                      const data = await res.json();
                      if (data.authorization_url) {
                        window.location.href = data.authorization_url;
                      } else {
                        alert("Payment initialization failed. Try again.");
                        setPayingLedger(false);
                      }
                    } catch {
                      alert("Network error. Try again.");
                      setPayingLedger(false);
                    }
                  }}
                  disabled={payingLedger}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: payingLedger
                      ? "var(--cream-06)"
                      : "linear-gradient(135deg, var(--gold-glow), var(--gold))",
                    border: "none",
                    borderBottom: payingLedger ? "none" : "3px solid #92400e",
                    borderRadius: 14,
                    cursor: payingLedger ? "not-allowed" : "pointer",
                    color: payingLedger ? "var(--cream-35)" : "#1a0e00",
                    fontSize: 15,
                    fontWeight: 900,
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  {payingLedger ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />{" "}
                      Redirecting to Paystack...
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} /> Pay {restaurant.currency}{" "}
                      {Number(ledger.total_owed).toFixed(2)} Now
                    </>
                  )}
                </button>
              )}
            </div>

            {unpaidLedgers.length > 0 && (
              <div
                style={{
                  background: "color-mix(in srgb, var(--theme-bg) 95%, transparent)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 20,
                  marginBottom: 12,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "20px 20px 16px",
                    borderBottom: "1px solid rgba(239, 68, 68, 0.15)",
                  }}
                >
                  <p
                    style={{
                      color: "rgba(252, 165, 165, 0.7)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}
                  >
                    OUTSTANDING BALANCE
                  </p>
                  <p
                    style={{
                      color: "#fca5a5",
                      fontSize: 30,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      marginBottom: 4,
                    }}
                  >
                    GHS{" "}
                    {unpaidLedgers
                      .reduce((s, l) => s + Number(l.total_owed), 0)
                      .toFixed(2)}
                  </p>
                  <p
                    style={{ color: "rgba(252, 165, 165, 0.4)", fontSize: 12 }}
                  >
                    Unpaid from {unpaidLedgers.length} previous{" "}
                    {unpaidLedgers.length === 1 ? "day" : "days"}
                  </p>
                </div>

                {/* Day breakdown */}
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {unpaidLedgers.map((l) => (
                    <div
                      key={l.ledger_date}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(253, 230, 138, 0.6)",
                          fontSize: 13,
                        }}
                      >
                        {new Date(
                          l.ledger_date + "T12:00:00",
                        ).toLocaleDateString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span
                        style={{
                          color: "#fde68a",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        GHS {Number(l.total_owed).toFixed(2)}{" "}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Settle button */}
                <div style={{ padding: "0 20px 20px" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const totalOutstanding = unpaidLedgers.reduce(
                        (s, l) => s + Number(l.total_owed),
                        0,
                      );
                      const amountKobo = Math.round(totalOutstanding * 100);
                      try {
                        const res = await fetch("/api/paystack/initialize", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            restaurant_id: restaurant.id,
                            ledger_date: unpaidLedgers[0].ledger_date,
                            amount_kobo: amountKobo,
                            email: "settlement@novanode.app",
                            settle_all_unpaid: true,
                            unpaid_dates: unpaidLedgers.map(
                              (l) => l.ledger_date,
                            ),
                          }),
                        });
                        const data = await res.json();
                        if (data.authorization_url) {
                          window.location.href = data.authorization_url;
                        }
                      } catch (e) {
                        console.error("Settlement init failed:", e);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "14px 20px",
                      borderRadius: 14,
                      fontWeight: 700,
                      fontSize: 14,
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      color: "#fca5a5",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      cursor: "pointer",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Settle Outstanding — GHS{" "}
                    {unpaidLedgers
                      .reduce((s, l) => s + Number(l.total_owed), 0)
                      .toFixed(2)}
                  </button>
                </div>
              </div>
            )}

            {/* Paid history */}
            {ledger && Number(ledger.paid_amount ?? 0) > 0 && (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 20,
                  padding: 20,
                  marginTop: 12,
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <p className="t-eyebrow" style={{ marginBottom: 6 }}>
                  Settled Today
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p
                      className="t-price"
                      style={{ fontSize: 24, color: "#34d399" }}
                    >
                      {restaurant.currency}{" "}
                      {Number(ledger.paid_amount).toFixed(2)}
                    </p>
                    <p className="t-caption">Paid via Paystack ✓</p>
                  </div>
                  <CheckCircle size={32} color="#34d399" />
                </div>
              </div>
            )}

            <p
              className="t-caption"
              style={{ textAlign: "center", opacity: 0.5, marginTop: 16 }}
            >
              Payments processed via Paystack. Ledger resets daily at midnight.
            </p>
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <Link
                href={`/dashboard/${restaurant.slug}?tab=settlements`}
                className="t-caption"
                style={{
                  color: "var(--gold-glow)",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View full settlement history
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Powered by NovaNode Inc. */}
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "var(--cream-35)",
          marginTop: 16,
          paddingBottom: 24,
          opacity: 0.7,
        }}
      >
        Powered by NovaNode Inc.
      </div>
    </div>
  );
}