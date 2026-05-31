"use client";
import OrderTracker from "./OrderTracker";
import { playOrderConfirmed } from "@/lib/sounds";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database.types";
import {
  ShoppingBag,
  X,
  Minus,
  Plus,
  ChevronRight,
  Bell,
  Droplets,
  Receipt,
  HandPlatter,
  Zap,
  CheckCircle,
  Loader2,
  DollarSign,
} from "lucide-react";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type DailySpecial = Tables<"daily_specials">;

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface MenuClientProps {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
  starters: MenuItem[];
  dailySpecial: DailySpecial | null;
  sessionToken: string;
  customerName: string;
  tableNumber: string;
}

type Signal = "call_waiter" | "napkins" | "water" | "bill";

// ── Bill Splitter ──────────────────────────────────────────────────────────
function BillSplitter({
  total,
  currency,
}: {
  total: number;
  currency: string;
}) {
  const [people, setPeople] = useState(2);
  const perPerson = total / people;

  return (
    <div
      style={{
        background: "var(--cream-06)",
        border: "1px solid var(--cream-15)",
        borderRadius: 16,
        padding: "16px",
      }}
    >
      <p
        className="t-eyebrow"
        style={{ marginBottom: 12, textAlign: "center" }}
      >
        Split the Bill
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          marginBottom: 14,
        }}
      >
        <button
          onClick={() => setPeople((p) => Math.max(1, p - 1))}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--gold-faint)",
            border: "1px solid var(--gold-dim)",
            color: "var(--gold-glow)",
            fontSize: 20,
            fontWeight: 900,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              color: "var(--cream)",
              fontWeight: 900,
              fontSize: 28,
              lineHeight: 1,
            }}
          >
            {people}
          </p>
          <p className="t-caption">{people === 1 ? "person" : "people"}</p>
        </div>
        <button
          onClick={() => setPeople((p) => p + 1)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--gold-faint)",
            border: "1px solid var(--gold-dim)",
            color: "var(--gold-glow)",
            fontSize: 20,
            fontWeight: 900,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--gold-faint)",
          border: "1px solid var(--gold-dim)",
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <span className="t-caption">Each person pays</span>
        <span className="t-price" style={{ fontSize: 20 }}>
          {currency} {perPerson.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MenuClient({
  restaurant,
  categories,
  menuItems,
  dailySpecial,
  sessionToken,
  customerName,
  tableNumber,
}: MenuClientProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [order, setOrder] = useState<CartItem[]>([]);
  const [showOrder, setShowOrder] = useState(false);
  const [sentSignals, setSentSignals] = useState<Signal[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showBillPopup, setShowBillPopup] = useState(false);
  const [allOrders, setAllOrders] = useState<
    {
      total_amount: number;
      items: unknown;
      is_starter_order: boolean | null;
      status: string | null;
    }[]
  >([]);

  // ── CRITICAL FIX: supabase client in a ref, never re-created ──
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const filtered = activeCategory
    ? menuItems.filter((i) => i.category_id === activeCategory)
    : menuItems;

  const total = order.reduce((s, ci) => s + ci.item.price * ci.quantity, 0);
  const count = order.reduce((s, ci) => s + ci.quantity, 0);

  // ── Fetch all non-cancelled session orders ─────────────────────────────
  const fetchSessionOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("total_amount, items, is_starter_order, status")
      .eq("session_token", sessionToken)
      .neq("status", "Cancelled");
    if (data) setAllOrders(data as typeof allOrders);
  }, [sessionToken, supabase]);

  useEffect(() => {
    fetchSessionOrders();
  }, [fetchSessionOrders]);

  // ── Realtime: orders + table_sessions ──────────────────────────────────
  //
  // FIX SUMMARY vs old code:
  //  1. Single channel "menu-{sessionToken}" scoped to THIS session only.
  //     Old code used restaurant-level filters which could mix sessions.
  //  2. table_sessions UPDATE filter now uses session_token=eq.{sessionToken}
  //     — the old code used the same filter but the channel name was keyed
  //     on sessionToken correctly; the real bug was createClient() called
  //     at component level, causing channel duplication on re-renders.
  //  3. All polling fallbacks removed — realtime is the single source of truth.
  //     If realtime drops, OrderTracker has its own independent channel as backup.
  //
  useEffect(() => {
    const channel = supabase
      .channel(`menu-session-${sessionToken}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `session_token=eq.${sessionToken}`,
        },
        () => {
          // Refetch on any new order for this session (covers starters too)
          fetchSessionOrders();
        }
      )
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
            bill_status: string | null;
          };

          if (updated.bill_status === "presented") {
            // Refresh order totals then show bill
            fetchSessionOrders().then(() => setShowBillPopup(true));
          }

          if (!updated.is_active) {
            // Table closed by staff — clear token and hard reload
            localStorage.removeItem("nn_session_token");
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionToken, supabase, fetchSessionOrders]);

  // ── Cart helpers ───────────────────────────────────────────────────────
  function addItem(item: MenuItem) {
    setOrder((prev) => {
      const ex = prev.find((ci) => ci.item.id === item.id);
      if (ex)
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      return [...prev, { item, quantity: 1 }];
    });
  }

  function removeItem(id: string) {
    setOrder((prev) =>
      prev
        .map((ci) =>
          ci.item.id === id ? { ...ci, quantity: ci.quantity - 1 } : ci
        )
        .filter((ci) => ci.quantity > 0)
    );
  }

  // ── Place Order ────────────────────────────────────────────────────────
  async function placeOrder() {
    if (order.length === 0) return;
    setPlacingOrder(true);

    try {
      // Verify session is still active before inserting
      const { data: session } = await supabase
        .from("table_sessions")
        .select("is_active")
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (session && !session.is_active) {
        setPlacingOrder(false);
        setShowOrder(false);
        setOrder([]);
        alert("Your table session has ended. Please scan the QR code again.");
        return;
      }

      const { error: orderError } = await supabase.from("orders").insert({
        restaurant_id: restaurant.id,
        table_number: tableNumber,
        customer_name: customerName,
        session_token: sessionToken,
        items: order.map((ci) => ({
          id: ci.item.id,
          name: ci.item.name_en,
          price: ci.item.price,
          quantity: ci.quantity,
        })),
        total_amount: total,
        status: "Pending",
        is_starter_order: false,
      });

      if (orderError) {
        console.error("Order insert error:", orderError);
        alert("Failed to place order. Please try again.");
        setPlacingOrder(false);
        return;
      }

      playOrderConfirmed();
      setOrderSuccess(true);
      setPlacingOrder(false);

      setTimeout(() => {
        setOrderSuccess(false);
        setShowOrder(false);
        setOrder([]);
      }, 2500);
    } catch (err) {
      console.error("Unexpected error placing order:", err);
      setPlacingOrder(false);
      alert("Something went wrong. Please try again.");
    }
  }

  // ── Waiter Signals ─────────────────────────────────────────────────────
  async function sendSignal(type: Signal) {
    if (sentSignals.includes(type)) return;
    setSentSignals((prev) => [...prev, type]);
    await supabase.from("waiter_signals").insert({
      restaurant_id: restaurant.id,
      table_number: tableNumber,
      customer_name: customerName,
      signal_type: type,
    });
    setTimeout(
      () => setSentSignals((prev) => prev.filter((s) => s !== type)),
      5000
    );
  }

  const signals: { type: Signal; icon: React.ReactNode; label: string }[] = [
    { type: "call_waiter", icon: <HandPlatter size={22} />, label: "Waiter" },
    { type: "napkins", icon: <Bell size={22} />, label: "Napkins" },
    { type: "water", icon: <Droplets size={22} />, label: "Water" },
    { type: "bill", icon: <Receipt size={22} />, label: "Bill" },
  ];

  const runningTotal = allOrders.reduce(
    (s, o) => s + Number(o.total_amount),
    0
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="menu-page">
      {/* Ambient glows */}
      <div
        className="ambient-gold"
        style={{
          width: 350,
          height: 350,
          top: -100,
          left: -100,
          position: "fixed",
          zIndex: 0,
        }}
      />
      <div
        className="ambient-emerald"
        style={{
          width: 250,
          height: 250,
          top: 400,
          right: -80,
          position: "fixed",
          zIndex: 0,
        }}
      />

      {/* ── HEADER ── */}
      <header className="menu-header">
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="menu-logo">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.name} />
            ) : (
              <span style={{ fontSize: 22 }}>🍽️</span>
            )}
          </div>
          <div>
            <p className="menu-name">{restaurant.name}</p>
            <p className="menu-sub">Digital Menu</p>
          </div>
        </div>
        <div
          className={`cart-icon ${count > 0 ? "active" : ""}`}
          onClick={() => count > 0 && setShowOrder(true)}
          role="button"
        >
          <ShoppingBag size={20} />
          {count > 0 && <span className="cart-badge">{count}</span>}
        </div>
      </header>

      {/* ── DAILY SPECIAL ── */}
      {dailySpecial && (
        <div className="special-banner">
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              flexShrink: 0,
              background: "var(--gold-faint)",
              border: "1px solid var(--gold-dim)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold-glow)",
            }}
          >
            <Zap size={20} />
          </div>
          <div>
            <p className="t-eyebrow" style={{ marginBottom: 4 }}>
              Today&apos;s Special
            </p>
            <p className="t-title" style={{ fontSize: 15 }}>
              {dailySpecial.title}
            </p>
            {dailySpecial.description && (
              <p className="t-body" style={{ fontSize: 12, marginTop: 3 }}>
                {dailySpecial.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── ORDER TRACKER ── */}
      <OrderTracker
        sessionToken={sessionToken}
        restaurant={restaurant}
        customerName={customerName}
        tableNumber={tableNumber}
      />

      {/* ── RUNNING TOTAL ── */}
      {allOrders.length > 0 && (
        <div
          style={{
            margin: "16px 16px 0",
            background: "var(--gold-faint)",
            border: "1px solid var(--gold-dim)",
            borderRadius: 16,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "var(--shadow-glow)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DollarSign size={16} color="var(--gold-glow)" />
            <span className="t-caption">Running Total</span>
          </div>
          <span className="t-price" style={{ fontSize: 18 }}>
            {restaurant.currency} {runningTotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* ── WAITER SIGNALS ── */}
      <div className="signals-grid">
        {signals.map((s) => {
          const sent = sentSignals.includes(s.type);
          return (
            <button
              key={s.type}
              className={`signal-btn ${sent ? "sent" : ""}`}
              onClick={() => sendSignal(s.type)}
            >
              {sent ? <CheckCircle size={22} /> : s.icon}
              {sent ? "Sent!" : s.label}
            </button>
          );
        })}
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="pills-wrap scrollbar-hide">
        {[{ id: null, name_en: "All" }, ...categories].map((cat) => (
          <button
            key={cat.id ?? "all"}
            className={`pill ${activeCategory === (cat.id ?? null) ? "active" : ""}`}
            onClick={() => setActiveCategory(cat.id ?? null)}
          >
            {cat.name_en}
          </button>
        ))}
      </div>

      {/* ── MENU ITEMS ── */}
      <div className="menu-grid">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🍽️</p>
            <p className="t-body">No items in this category yet.</p>
          </div>
        ) : (
          filtered.map((item, index) => {
            const inOrder = order.find((ci) => ci.item.id === item.id);
            const unavailable = item.is_available === false;
            const isHero = index === 0 && !activeCategory;

            if (isHero)
              return (
                <div key={item.id} className="hero-card">
                  <img src={item.image_url} alt={item.name_en} />
                  <div className="hero-overlay" />
                  <span
                    className="badge-gold"
                    style={{ position: "absolute", top: 16, left: 16 }}
                  >
                    Chef&apos;s Pick
                  </span>
                  <div className="hero-body">
                    <p className="t-eyebrow" style={{ marginBottom: 6 }}>
                      {categories.find((c) => c.id === item.category_id)
                        ?.name_en ?? "Menu"}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3 className="t-heading" style={{ marginBottom: 4 }}>
                          {item.name_en}
                        </h3>
                        {item.description_en && (
                          <p className="t-body" style={{ fontSize: 12 }}>
                            {item.description_en}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p className="t-price">{item.price.toFixed(0)}</p>
                        <p className="t-caption">{restaurant.currency}</p>
                      </div>
                    </div>
                    {inOrder ? (
                      <div className="qty-control" style={{ marginTop: 14 }}>
                        <button
                          className="qty-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          <Minus size={16} />
                        </button>
                        <span
                          className="qty-num"
                          style={{ flex: 1, textAlign: "center" }}
                        >
                          {inOrder.quantity} in order
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => addItem(item)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add btn-add-full"
                        onClick={() => addItem(item)}
                      >
                        + Add to Order
                      </button>
                    )}
                  </div>
                </div>
              );

            return (
              <div
                key={item.id}
                className={`menu-card ${unavailable ? "unavailable" : ""}`}
              >
                <div className="menu-card-img">
                  <img src={item.image_url} alt={item.name_en} />
                  {unavailable && (
                    <div className="sold-overlay">
                      <span className="badge-red">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="menu-card-body">
                  <div>
                    <p
                      className="t-eyebrow"
                      style={{ fontSize: 9, marginBottom: 4 }}
                    >
                      {categories.find((c) => c.id === item.category_id)
                        ?.name_en ?? ""}
                    </p>
                    <p className="t-title" style={{ fontSize: 15 }}>
                      {item.name_en}
                    </p>
                    {item.description_en && (
                      <p
                        className="t-body"
                        style={{
                          fontSize: 11,
                          marginTop: 3,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.description_en}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <p className="t-price-sm">
                      {restaurant.currency} {item.price.toFixed(0)}
                    </p>
                    {unavailable ? (
                      <span className="t-caption">Unavailable</span>
                    ) : inOrder ? (
                      <div
                        className="qty-control"
                        style={{ padding: "4px 10px" }}
                      >
                        <button
                          className="qty-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="qty-num" style={{ fontSize: 13 }}>
                          {inOrder.quantity}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => addItem(item)}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add"
                        onClick={() => addItem(item)}
                      >
                        Add +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── FLOATING ORDER BAR ── */}
      {count > 0 && (
        <div className="order-bar">
          <div>
            <p className="t-caption">
              {count} item{count !== 1 ? "s" : ""}
            </p>
            <p className="t-price">
              {restaurant.currency} {total.toFixed(2)}
            </p>
          </div>
          <button
            className="btn-secondary"
            style={{ width: "auto", gap: 8 }}
            onClick={() => setShowOrder(true)}
          >
            Review Order <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── ORDER DRAWER ── */}
      {showOrder && (
        <div className="drawer-overlay">
          <div className="drawer-scrim" onClick={() => setShowOrder(false)} />
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <h2 className="t-heading" style={{ fontSize: 20 }}>
                  Your Order
                </h2>
                <p className="t-eyebrow" style={{ marginTop: 4 }}>
                  {customerName} · {count} item{count !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                className="btn-icon"
                onClick={() => setShowOrder(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="drawer-items">
              {order.map((ci) => (
                <div key={ci.item.id} className="drawer-item">
                  <img
                    src={ci.item.image_url}
                    alt={ci.item.name_en}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="t-title"
                      style={{
                        fontSize: 14,
                        marginBottom: 3,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ci.item.name_en}
                    </p>
                    <p className="t-price-sm">
                      {restaurant.currency}{" "}
                      {(ci.item.price * ci.quantity).toFixed(2)}
                    </p>
                  </div>
                  <div
                    className="qty-control"
                    style={{ flexShrink: 0, padding: "4px 10px" }}
                  >
                    <button
                      className="qty-btn"
                      onClick={() => removeItem(ci.item.id)}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="qty-num" style={{ fontSize: 13 }}>
                      {ci.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => addItem(ci.item)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-foot">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <span className="t-body">Total</span>
                <span className="t-price">
                  {restaurant.currency} {total.toFixed(2)}
                </span>
              </div>
              <button
                className="btn-primary"
                onClick={placeOrder}
                disabled={placingOrder || orderSuccess}
              >
                {orderSuccess ? (
                  <>
                    <CheckCircle size={18} /> Order Sent to Kitchen!
                  </>
                ) : placingOrder ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    Send to Kitchen <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BILL POPUP ── */}
      {showBillPopup && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(2,20,12,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background:
                "linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)",
              border: "1px solid var(--gold-dim)",
              borderBottom: "none",
              borderRadius: "28px 28px 0 0",
              padding: "28px 24px 40px",
              boxShadow: "0 -8px 60px rgba(2,44,34,0.8)",
              animation: "slideUp 0.4s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                background: "var(--cream-15)",
                margin: "0 auto 24px",
              }}
            />

            {/* Title */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <p className="t-eyebrow" style={{ marginBottom: 8 }}>
                Your Bill
              </p>
              <h2 className="t-heading" style={{ fontSize: 24 }}>
                {restaurant.name}
              </h2>
              <p className="t-caption" style={{ marginTop: 4 }}>
                {customerName} · Table {tableNumber}
              </p>
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            {/* Order breakdown */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {allOrders.map((o, i) => {
                const items = Array.isArray(o.items)
                  ? (o.items as {
                      name: string;
                      quantity: number;
                      price: number;
                    }[])
                  : [];
                return (
                  <div key={i}>
                    <p
                      className="t-eyebrow"
                      style={{ fontSize: 9, marginBottom: 6 }}
                    >
                      {o.is_starter_order ? "⚡ Starter" : `Order #${i + 1}`}
                    </p>
                    {items.map((item, j) => (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "6px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--gold-glow)",
                              fontWeight: 800,
                              fontSize: 12,
                            }}
                          >
                            ×{item.quantity}
                          </span>
                          <span className="t-body" style={{ fontSize: 13 }}>
                            {item.name}
                          </span>
                        </div>
                        <span className="t-body" style={{ fontSize: 13 }}>
                          {restaurant.currency}{" "}
                          {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            {/* Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span className="t-title" style={{ fontSize: 16 }}>
                Total
              </span>
              <span className="t-price" style={{ fontSize: 26 }}>
                {restaurant.currency} {runningTotal.toFixed(2)}
              </span>
            </div>
            <p
              className="t-caption"
              style={{ textAlign: "center", marginBottom: 24 }}
            >
              Payment is processed at the counter or with your waiter.
            </p>

            {/* Bill splitter */}
            <BillSplitter
              total={runningTotal}
              currency={restaurant.currency ?? "GHS"}
            />

            <button
              className="btn-primary"
              style={{ marginTop: 20 }}
              onClick={() => setShowBillPopup(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}