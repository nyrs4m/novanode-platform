"use client";
import OrderTracker from "./OrderTracker";
import { playOrderConfirmed } from "@/lib/sounds";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ReceiptModal from "./ReceiptModal";
import { getStoredToken } from "@/lib/session";
import { clearToken } from "@/lib/session";
import {
  getRestaurantChannel,
  releaseRestaurantChannel,
} from "@/lib/realtime-engine";
import { Tables } from "@/types/database.types";
import {
  Phone,
  X,
  Minus,
  Plus,
  ChevronRight,
  Bell,
  Droplets,
  Receipt,
  HandPlatter,
  Languages,
  Zap,
  CheckCircle,
  Loader2,
  DollarSign,
  UtensilsCrossed,
} from "lucide-react";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type DailySpecial = Tables<"daily_specials">;

const UI_TEXT = {
  en: {
    digitalMenu: "DIGITAL MENU",
    addToOrder: "Add",
    reviewOrder: "Review Order",
    placeOrder: "Place Order",
    yourOrder: "Your Order",
    orderSent: "Order Sent!",
    callWaiter: "Waiter",
    napkins: "Napkins",
    water: "Water",
    bill: "Bill",
    total: "Total",
    items: "items",
    item: "item",
    soldOut: "Sold Out",
    sending: "Sending...",
    close: "Close",
    splitBill: "Split Bill",
    perPerson: "per person",
    people: "people",
    confirmPayment: "Confirm Payment",
    thankYou: "Thank you!",
    feedbackPrompt: "How was your experience?",
    submitReview: "Submit Review",
    downloadReceipt: "Download Receipt",
    shareReceipt: "Share Receipt",
    subtotal: "Subtotal",
    serviceFee: "Service Fee",
    allergy: "Allergy or special request?",
    noItems: "No items available",
    loading: "Loading menu...",
    todaySpecial: "Today's Special",
    runningTotal: "Running Total",
    chefsPick: "Chef's Pick",
    inOrder: "in order",
    unavailable: "Unavailable",
    yourBill: "Your Bill",
    orderNumber: "Order #",
    paymentNotice: "Payment is processed at the counter or with your waiter.",
    each: "Each",
    waitingForPayment: "Waiting for payment confirmation from staff...",
    receiptNotice: "Your receipt will appear automatically",
    sendToKitchen: "Send to Kitchen",
    sent: "Sent!",
  },
  fr: {
    digitalMenu: "MENU NUMÉRIQUE",
    addToOrder: "Ajouter",
    reviewOrder: "Voir la Commande",
    placeOrder: "Passer la Commande",
    yourOrder: "Votre Commande",
    orderSent: "Commande Envoyée!",
    callWaiter: "Serveur",
    napkins: "Serviettes",
    water: "Eau",
    bill: "Addition",
    total: "Total",
    items: "articles",
    item: "article",
    soldOut: "Épuisé",
    sending: "Envoi...",
    close: "Fermer",
    splitBill: "Partager",
    perPerson: "par personne",
    people: "personnes",
    confirmPayment: "Confirmer le Paiement",
    thankYou: "Merci!",
    feedbackPrompt: "Comment était votre expérience?",
    submitReview: "Soumettre un Avis",
    downloadReceipt: "Télécharger le Reçu",
    shareReceipt: "Partager le Reçu",
    subtotal: "Sous-total",
    serviceFee: "Frais de Service",
    allergy: "Allergie ou demande spéciale?",
    noItems: "Aucun article disponible",
    loading: "Chargement du menu...",
    todaySpecial: "Spécial du Jour",
    runningTotal: "Total en Cours",
    chefsPick: "Sélection du Chef",
    inOrder: "en commande",
    unavailable: "Indisponible",
    yourBill: "Votre Addition",
    orderNumber: "Commande #",
    paymentNotice:
      "Le paiement est effectué au comptoir ou avec votre serveur.",
    each: "Chacun",
    waitingForPayment: "En attente de confirmation de paiement...",
    receiptNotice: "Votre reçu apparaîtra automatiquement",
    sendToKitchen: "Envoyer en Cuisine",
    sent: "Envoyé!",
  },
};

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
  ui,
}: {
  total: number;
  currency: string;
  ui: (typeof UI_TEXT)["en"];
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
        {ui.splitBill}
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
        <span className="t-caption">
          {ui.each} {ui.perPerson}
        </span>
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
  const [billLocked, setBillLocked] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<Tables<"restaurant_staff">[]>([]);
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>(menuItems);
  const [lang, setLang] = useState<"en" | "fr">(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("nn_lang") as "en" | "fr") ?? "en";
  });
  const [allOrders, setAllOrders] = useState<
    {
      total_amount: number;
      items: unknown;
      is_starter_order: boolean | null;
      status: string | null;
    }[]
  >([]);

  const [promos, setPromos] = useState<
    { title: string; description: string | null }[]
  >([]);
  const [heroIndex, setHeroIndex] = useState(0);

  // ── CRITICAL FIX: supabase client in a ref, never re-created ──
  const supabaseRef = useRef(createClient());
  const realtimeSetupDone = useRef(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = activeCategory
    ? liveMenuItems.filter((i) => i.category_id === activeCategory)
    : liveMenuItems;

  const total = order.reduce((s, ci) => s + ci.item.price * ci.quantity, 0);
  const count = order.reduce((s, ci) => s + ci.quantity, 0);

  // ── Sync initial menuItems to live state ────────────────────────────────
  useEffect(() => {
    setLiveMenuItems(menuItems);
  }, [menuItems]);

  // 3b. Add promo fetch on mount
  useEffect(() => {
    if (!sessionId) return;
    async function fetchPromos() {
      const { data } = await supabaseRef.current
        .from("restaurant_promos")
        .select("title, description")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());
      if (data && data.length > 0) setPromos(data);
    }
    fetchPromos();
  }, [restaurant.id, sessionId]);

  // 3c. Hero cycling — restaurant info + all active promos
  useEffect(() => {
    const totalSlides = 1 + promos.length; // slide 0 = restaurant, slides 1..n = promos
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos]);

  // FIX 1: Get sessionId (the DB UUID) after session is ready
  useEffect(() => {
    if (!sessionToken || !restaurant?.id) return;
    supabaseRef.current
      .from("table_sessions")
      .select("id, bill_status")
      .eq("session_token", sessionToken)
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSessionId(data.id);
          if (data.bill_status !== "none" && data.bill_status)
            setBillLocked(true);
        }
      });
  }, [sessionToken, restaurant?.id]);
  // ── Fetch all non-cancelled session orders ─────────────────────────────
  const fetchSessionOrders = useCallback(async () => {
    const { data } = await supabaseRef.current
      .from("orders")
      .select("total_amount, items, is_starter_order, status")
      .eq("session_token", sessionToken)
      .neq("status", "Cancelled");
    if (data) setAllOrders(data as typeof allOrders);
  }, [sessionToken]);

  const fetchSessionOrdersThrottled = useCallback(() => {
    if (fetchTimerRef.current) return;
    fetchTimerRef.current = setTimeout(async () => {
      fetchTimerRef.current = null;
      await fetchSessionOrders();
    }, 300);
  }, [fetchSessionOrders]);

  useEffect(() => {
    // FIX 2: Update realtime filter to use id instead of session_token
    if (!sessionId || !restaurant?.id || realtimeSetupDone.current) return;
    realtimeSetupDone.current = true;
    const supabase = supabaseRef.current;
    const channel = getRestaurantChannel(restaurant.id, supabase, "customer");

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "table_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as {
            bill_status: string | null;
            is_active: boolean;
            status: string;
            id: string; // Add id to updated type for clarity
          };

          if (updated.bill_status === "presented") {
            setBillLocked(true);
            fetchSessionOrdersThrottled();
            setTimeout(() => setShowBillPopup(true), 400);
          } else if (updated.bill_status === "paid") {
            setBillLocked(true);
            fetchSessionOrdersThrottled();
            setTimeout(() => {
              setShowBillPopup(false);
              setShowReceipt(true);
            }, 400);
          } else if (!updated.is_active || updated.status === "completed") {
            clearToken();
            setTimeout(() => window.location.reload(), 1500);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `session_token=eq.${sessionToken}`,
        },
        () => fetchSessionOrdersThrottled(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `session_token=eq.${sessionToken}`,
        },
        () => fetchSessionOrdersThrottled(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn(
            "[MenuClient] Realtime degraded — polling fallback active",
          );
        }
      });

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      realtimeSetupDone.current = false;
      releaseRestaurantChannel(restaurant.id, supabase, "customer");
    };
  }, [sessionId, sessionToken, restaurant?.id, fetchSessionOrdersThrottled]);

  // Fallback Polling for bill_status
  useEffect(() => {
    if (!sessionId || !restaurant?.id) return;
    const interval = setInterval(async () => {
      const { data } = await supabaseRef.current
        .from("table_sessions")
        .select("bill_status")
        .eq("id", sessionId)
        .maybeSingle();

      if (data?.bill_status === "presented" && !showBillPopup) {
        fetchSessionOrders().then(() =>
          setTimeout(() => setShowBillPopup(true), 400),
        );
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionId, restaurant?.id, showBillPopup, fetchSessionOrdersThrottled]);

  // ── Cart helpers ───────────────────────────────────────────────────────
  function addItem(item: MenuItem) {
    setOrder((prev) => {
      const ex = prev.find((ci) => ci.item.id === item.id);
      if (ex)
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci,
        );
      return [...prev, { item, quantity: 1 }];
    });
  }

  function removeItem(id: string) {
    setOrder((prev) =>
      prev
        .map((ci) =>
          ci.item.id === id ? { ...ci, quantity: ci.quantity - 1 } : ci,
        )
        .filter((ci) => ci.quantity > 0),
    );
  }

  // ── Place Order ────────────────────────────────────────────────────────
  async function placeOrder() {
    if (order.length === 0) return;
    setPlacingOrder(true);

    try {
      const supabase = supabaseRef.current;
      const { data: session } = await supabase
        .from("table_sessions")
        .select("is_active, bill_status")
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (
        session &&
        (!session.is_active ||
          (session.bill_status !== "none" && session.bill_status))
      ) {
        setPlacingOrder(false);
        setShowOrder(false);
        setOrder([]);
        alert(
          session.is_active
            ? "The bill has been presented. No more orders can be placed."
            : "Your table session has ended.",
        );
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
        platform_fee: (Math.round(Math.min(total, 500) * 0.01 * 100) /
          100) as never,
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
    await supabaseRef.current.from("waiter_signals").insert({
      restaurant_id: restaurant.id,
      table_number: tableNumber,
      customer_name: customerName,
      signal_type: type,
    });
    setTimeout(
      () => setSentSignals((prev) => prev.filter((s) => s !== type)),
      5000,
    );
  }

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "en" ? "fr" : "en";
      localStorage.setItem("nn_lang", next);
      return next;
    });
  }

  function t(en: string | null, fr: string | null | undefined): string {
    if (lang === "fr" && fr) return fr;
    return en ?? "";
  }

  const ui = UI_TEXT[lang];
  const signals: { type: Signal; icon: React.ReactNode; label: string }[] = [
    {
      type: "call_waiter",
      icon: <HandPlatter size={22} />,
      label: ui.callWaiter,
    },
    { type: "napkins", icon: <Bell size={22} />, label: ui.napkins },
    { type: "water", icon: <Droplets size={22} />, label: ui.water },
    { type: "bill", icon: <Receipt size={22} />, label: ui.bill },
  ];

  const runningTotal = allOrders.reduce(
    (s, o) => s + Number(o.total_amount),
    0,
  );
  const sessionFee = Math.min(Math.round(runningTotal * 0.01 * 100) / 100, 5);
  const grandTotal = runningTotal + sessionFee;

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
        {/* Hero — cycles restaurant info then each active promo */}
        <div className="relative overflow-hidden" style={{ minHeight: "80px" }}>
          {/* Slide 0 — Restaurant info */}
          <div
            className="transition-all duration-500"
            style={{
              opacity: heroIndex === 0 ? 1 : 0,
              transform:
                heroIndex === 0 ? "translateY(0)" : "translateY(-10px)",
              position: heroIndex === 0 ? "relative" : "absolute",
              width: "100%",
              top: 0,
            }}
          >
            <div style={{ padding: "20px 20px 16px" }}>
              {/* Top row — logo + name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    overflow: "hidden",
                    border: "1.5px solid rgba(217, 119, 6, 0.35)",
                    flexShrink: 0,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  {restaurant.logo_url ? (
                    <img
                      src={restaurant.logo_url}
                      alt={restaurant.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0,0,0,0.3)",
                      }}
                    >
                      <UtensilsCrossed size={26} color="rgba(217,119,6,0.35)" />
                    </div>
                  )}
                </div>

                {/* Name + tagline */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <p
                    style={{
                      color: "rgba(217, 119, 6, 0.8)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      marginBottom: 4,
                    }}
                  >
                    {ui.digitalMenu}
                  </p>
                  <h1
                    style={{
                      color: "#FDFBF7",
                      fontSize: 22,
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {restaurant.name}
                  </h1>
                </div>
              </div>

              {/* Bottom row — description + contact */}
              {((restaurant as any).description ||
                (restaurant as any).contact_number) && (
                <div
                  style={{
                    borderTop: "1px solid rgba(217, 119, 6, 0.1)",
                    paddingTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {(restaurant as any).description && (
                    <p
                      style={{
                        color: "rgba(253, 251, 247, 0.5)",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {(restaurant as any).description}
                    </p>
                  )}
                  {(restaurant as any).contact_number && (
                    <p
                      style={{
                        color: "rgba(217, 119, 6, 0.55)",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Phone /> {(restaurant as any).contact_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Slides 1..n — Promos */}
          {promos.map((promo, i) => (
            <div
              key={i}
              className="transition-all duration-500 p-4"
              style={{
                opacity: heroIndex === i + 1 ? 1 : 0,
                transform:
                  heroIndex === i + 1 ? "translateY(0)" : "translateY(10px)",
                position: heroIndex === i + 1 ? "relative" : "absolute",
                width: "100%",
                top: 0,
              }}
            >
              <div
                className="rounded-xl p-4 border border-amber-500/30"
                style={{ backgroundColor: "rgba(217, 119, 6, 0.15)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-400 text-xs font-bold tracking-widest">
                    PROMO
                  </span>
                  <span className="w-1 h-1 rounded-full bg-amber-400/50" />
                  <span className="text-amber-300/50 text-xs">
                    Limited time
                  </span>
                </div>
                <p className="text-amber-200 font-bold text-base">
                  {promo.title}
                </p>
                {promo.description && (
                  <p className="text-amber-300/70 text-xs mt-1">
                    {promo.description}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Dot indicators */}
          {promos.length > 0 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {[...Array(1 + promos.length)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${heroIndex === i ? "bg-amber-400" : "bg-amber-400/30"}`}
                />
              ))}
            </div>
          )}
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
              {ui.todaySpecial}
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
            background: "var(--gold-faint)", // Do not translate CSS values
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
            <span className="t-caption">{ui.runningTotal}</span>
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
              {" "}
              {/* s.label is already translated */}
              {sent ? <CheckCircle size={22} /> : s.icon}
              {sent ? ui.sent : s.label}
            </button>
          );
        })}
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="pills-wrap scrollbar-hide">
        {[{ id: null, name_en: "All", name_fr: "Tout" }, ...categories].map(
          (cat) => (
            <button
              key={cat.id ?? "all"}
              className={`pill ${activeCategory === (cat.id ?? null) ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id ?? null)}
            >
              {t(cat.name_en, (cat as any).name_fr)}
            </button>
          ),
        )}
      </div>

      {/* ── MENU ITEMS ── */}
      <div className="menu-grid">
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ fontSize: 48, marginBottom: 12 }}>🍽️</p>
            <p className="t-body">{ui.noItems}</p>
          </div>
        ) : (
          filtered.map((item, index) => {
            const inOrder = order.find((ci) => ci.item.id === item.id);
            const unavailable = item.is_available === false;
            const isHero = index === 0 && !activeCategory;

            if (isHero)
              return (
                <div key={item.id} className="hero-card">
                  <img
                    src={item.image_url}
                    alt={t(item.name_en, item.name_fr)}
                  />
                  <div className="hero-overlay" />
                  <span /* Do not translate item.image_url, item.name_en, item.name_fr */
                    className="badge-gold"
                    style={{ position: "absolute", top: 16, left: 16 }}
                  >
                    {ui.chefsPick}
                  </span>
                  <div className="hero-body">
                    <p className="t-eyebrow" style={{ marginBottom: 6 }}>
                      {(() => {
                        const c = categories.find(
                          (c) => c.id === item.category_id,
                        );
                        return t(c?.name_en ?? "Menu", c?.name_fr);
                      })()}
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
                          {t(item.name_en, item.name_fr)}
                        </h3>
                        {(item.description_en || item.description_fr) && (
                          <p className="t-body" style={{ fontSize: 12 }}>
                            {t(item.description_en, item.description_fr)}
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
                          {inOrder.quantity} {ui.inOrder}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (!billLocked) addItem(item);
                          }} /* Do not translate item.id */
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add btn-add-full"
                        onClick={() => {
                          if (!billLocked) addItem(item);
                        }} /* Do not translate item.id */
                      >
                        + {ui.addToOrder}
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
                  <img
                    src={item.image_url}
                    alt={t(item.name_en, item.name_fr)}
                  />
                  {unavailable && (
                    <div className="sold-overlay">
                      <span className="badge-red">{ui.soldOut}</span>
                    </div>
                  )}
                </div>
                <div className="menu-card-body">
                  <div>
                    <p
                      className="t-eyebrow"
                      style={{ fontSize: 9, marginBottom: 4 }}
                    >
                      {(() => {
                        const c = categories.find(
                          (c) => c.id === item.category_id,
                        );
                        return t(c?.name_en ?? "", c?.name_fr);
                      })()}
                    </p>
                    <p className="t-title" style={{ fontSize: 15 }}>
                      {t(item.name_en, item.name_fr)}
                    </p>
                    {(item.description_en || item.description_fr) && (
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
                        {t(item.description_en, item.description_fr)}
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
                      <span className="t-caption">{ui.unavailable}</span>
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
                          onClick={() => {
                            if (!billLocked) addItem(item);
                          }} /* Do not translate item.id */
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn-add" onClick={() => addItem(item)}>
                        {ui.addToOrder} +
                      </button> /* Do not translate item.id */
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
              {count} {count !== 1 ? ui.items : ui.item}
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
            {ui.reviewOrder} <ChevronRight size={16} />
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
                <h2 className="t-heading" style={{ fontSize: 20 }}></h2>
                <p className="t-eyebrow" style={{ marginTop: 4 }}>
                  {customerName} · {count} item{count !== 1 ? "s" : ""}
                </p>
              </div>
              <button className="btn-icon" onClick={() => setShowOrder(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-items">
              {order.map((ci) => (
                <div key={ci.item.id} className="drawer-item">
                  <img
                    src={ci.item.image_url}
                    alt={t(
                      ci.item.name_en,
                      ci.item.name_fr,
                    )} /* Do not translate ci.item.image_url */
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
                      {t(ci.item.name_en, ci.item.name_fr)}
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
                      className="qty-btn" /* Do not translate ci.item.id */
                      onClick={() => removeItem(ci.item.id)}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="qty-num" style={{ fontSize: 13 }}>
                      {ci.quantity}
                    </span>
                    <button
                      className="qty-btn" /* Do not translate ci.item.id */
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
                <span className="t-body">{ui.total}</span>
                <span className="t-price">
                  {restaurant.currency} {total.toFixed(2)}
                </span>
              </div>
              <button
                className="btn-primary"
                onClick={placeOrder}
                disabled={placingOrder || orderSuccess || billLocked}
              >
                {orderSuccess ? (
                  <>
                    <CheckCircle size={18} /> {ui.orderSent}
                  </>
                ) : placingOrder ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> {ui.sending}
                  </>
                ) : (
                  <>
                    {ui.sendToKitchen} <ChevronRight size={18} />
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
                {ui.yourBill}
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
                    <p /* Do not translate o.is_starter_order, i */
                      className="t-eyebrow"
                      style={{ fontSize: 9, marginBottom: 6 }}
                    >
                      {o.is_starter_order
                        ? "⚡ Starter"
                        : `${ui.orderNumber}${i + 1}`}
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
                flexDirection: "column",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="t-body">{ui.subtotal}</span>
                <span className="t-body">
                  {restaurant.currency} {runningTotal.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span /* Do not translate sessionFee */
                  style={{
                    color: "var(--gold-glow)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {ui.serviceFee}
                </span>
                <span
                  style={{
                    color: "var(--gold-glow)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {restaurant.currency} {sessionFee.toFixed(2)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--gold-faint)",
                  border: "1px solid var(--gold-dim)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginTop: 4,
                }}
              >
                <span className="t-title" style={{ fontSize: 16 }}>
                  {ui.total}
                </span>
                <span className="t-price" style={{ fontSize: 26 }}>
                  {restaurant.currency} {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <p
              className="t-caption"
              style={{ textAlign: "center", marginBottom: 24 }}
            >
              {ui.paymentNotice}
            </p>

            {/* Bill splitter */}
            <BillSplitter
              total={grandTotal}
              currency={restaurant.currency ?? "GHS"}
              ui={ui}
            />

            <div
              style={{
                marginTop: 20,
                textAlign: "center",
                padding: "14px",
                background: "var(--cream-06)",
                border: "1px solid var(--cream-15)",
                borderRadius: 14,
              }}
            >
              <p className="t-caption">{ui.waitingForPayment}</p>
              <p className="t-eyebrow" style={{ marginTop: 6, fontSize: 10 }}>
                {ui.receiptNotice}
              </p>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <ReceiptModal
          restaurant={restaurant}
          sessionToken={sessionToken}
          tableNumber={tableNumber}
          customerName={customerName}
          orders={allOrders.map((o) => ({
            items: Array.isArray(o.items)
              ? (o.items as { name: string; quantity: number; price: number }[])
              : [],
            total_amount: Number(o.total_amount),
            is_starter_order: o.is_starter_order,
          }))}
          staff={staffList}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Floating language toggle */}
      <button
        type="button"
        onClick={toggleLang}
        className="fixed bottom-24 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full transition-all active:scale-95 hover:scale-105"
        style={{
          backgroundColor: "#D97706",
          color: "#022c22",
          boxShadow: "0 4px 20px rgba(217, 119, 6, 0.4)",
        }}
        title={lang === "en" ? "Switch to French" : "Switch to English"}
      >
        <Languages size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
