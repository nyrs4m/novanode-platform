"use client";
import OrderTracker from "./OrderTracker";
import { playOrderConfirmed } from "@/lib/sounds";
import { useState, useEffect, useRef, useCallback } from "react";
import { createBrowserClient as createClient } from "@supabase/ssr";
import ReceiptModal from "./ReceiptModal";
import { getStoredToken } from "@/lib/session";
import { clearToken } from "@/lib/session";
import {
  getRestaurantChannel,
  releaseRestaurantChannel,
} from "@/lib/realtime-engine";
import { Database, Json, Tables } from "@/types/database.types";
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
  ShoppingBag,
  Pencil,
} from "lucide-react";

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type MenuItem = Tables<"menu_items">;
type DailySpecial = Tables<"daily_specials">;

type ModifierGroupRow = {
  id: string;
  menu_item_id: string;
  name: string;
  is_required?: boolean | null;
  required?: boolean | null;
  min_select?: number | null;
  max_select?: number | null;
  max_selections?: number | null;
  selection_type?: string | null;
  sort_order?: number | null;
  is_multi_select?: boolean | null;
};

type ModifierOptionRow = {
  id: string;
  group_id?: string | null;
  modifier_group_id?: string | null;
  name: string;
  price: number;
  is_available?: boolean | null;
  sort_order?: number | null;
};

type ModifierDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      modifier_groups: {
        Row: ModifierGroupRow;
        Insert: ModifierGroupRow;
        Update: Partial<ModifierGroupRow>;
        Relationships: [];
      };
      modifier_options: {
        Row: ModifierOptionRow;
        Insert: ModifierOptionRow;
        Update: Partial<ModifierOptionRow>;
        Relationships: [];
      };
    };
  };
};

type ModifierOption = ModifierOptionRow & {
  groupId: string;
};

type ModifierGroup = ModifierGroupRow & {
  required: boolean;
  maxSelect: number;
  minSelect: number;
  options: ModifierOption[];
};

interface CartModifier {
  [key: string]: Json;
  group: string;
  option: string;
  price: number;
}

interface StaffMember {
  id: string;
  display_name: string | null;
  role: string | null;
}

interface SessionOrder {
  id: string;
  session_token: string | null;
  total_amount: number;
  items: unknown;
  is_starter_order: boolean | null;
  status: string | null;
  estimated_ready_at: string | null;
}

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
  modifiers?: CartModifier[];
  modifierTotal?: number;
  specialInstructions?: string;
}

interface OrderItemSnapshot {
  [key: string]: Json | undefined;
  id?: string;
  menu_item_id?: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: CartModifier[];
  modifierTotal?: number;
  specialInstructions?: string;
}

interface MenuClientProps {
  restaurant: Restaurant;
  categories: Category[];
  menuItems: MenuItem[];
  starters: MenuItem[];
  dailySpecial: DailySpecial | null;
  sessionToken: string;
  accessToken: string | null;
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
  accessToken,
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
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [liveMenuItems, setLiveMenuItems] = useState<MenuItem[]>(menuItems);
  const [modifierSheetItem, setModifierSheetItem] = useState<MenuItem | null>(
    null,
  );
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifierSelections, setModifierSelections] = useState<
    Record<string, string[]>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [modifierLoading, setModifierLoading] = useState(false);
  const [modifierError, setModifierError] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [lang, setLang] = useState<"en" | "fr">(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("nn_lang") as "en" | "fr") ?? "en";
  });
  const [allOrders, setAllOrders] = useState<SessionOrder[]>([]);
  const [editingNoteItemKey, setEditingNoteItemKey] = useState<string | null>(null);

  const [promos, setPromos] = useState<
    { title: string; description: string | null; image_url: string | null }[]
  >([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navVisibleRef = useRef(true);
  const rafRef = useRef<number | null>(null);
  const [pillsExpanded, setPillsExpanded] = useState(false);
  const isMountedRef = useRef(true);
  const modifierCacheRef = useRef<Record<string, ModifierGroup[]>>({});

  // Track mount state to prevent updates on unmounted component
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Use refs to track values inside event listeners without re-binding
  const pillsExpandedRef = useRef(pillsExpanded);
  useEffect(() => {
    pillsExpandedRef.current = pillsExpanded;
  }, [pillsExpanded]);

  // ── CRITICAL FIX: supabase client in a ref, never re-created ──
  const supabaseRef = useRef(
    createClient<ModifierDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {},
        },
      },
    ),
  );
  const realtimeSetupDone = useRef(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = activeCategory
    ? liveMenuItems.filter((i) => i.category_id === activeCategory)
    : liveMenuItems;

  const total = order.reduce(
    (s, ci) => s + (ci.item.price + (ci.modifierTotal ?? 0)) * ci.quantity,
    0,
  );
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
        .select("title, description, image_url")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());
      if (data && data.length > 0) setPromos(data);
    }
    fetchPromos();
  }, [restaurant.id, sessionId]);

  // 3d. Fetch waiters for feedback form
  useEffect(() => {
    if (!sessionId) return;
    async function fetchStaff() {
      const { data } = await supabaseRef.current
        .from("restaurant_staff")
        .select("id, display_name, role")
        .eq("restaurant_id", restaurant.id)
        .eq("role", "waiter");
      if (data && data.length > 0) setStaffList(data as StaffMember[]);
    }
    fetchStaff();
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
        if (data && isMountedRef.current) {
          setSessionId(data.id);
          if (data.bill_status !== "none" && data.bill_status)
            setBillLocked(true);
        }
      });
  }, [sessionToken, restaurant?.id]);

  // ── Fetch all non-cancelled session orders ─────────────────────────────
  const fetchSessionOrders = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabaseRef.current
      .from("orders")
      .select("*")
      .eq("session_token", sessionToken)
      .neq("status", "Cancelled");
    if (data && isMountedRef.current) {
      setAllOrders(
        ((data as unknown as SessionOrder[]) ?? []).filter(
          (order) => order.session_token === sessionToken,
        ),
      );
    }
  }, [sessionId, sessionToken]);

  const fetchSessionOrdersThrottled = useCallback(() => {
    if (fetchTimerRef.current) return;
    fetchTimerRef.current = setTimeout(async () => {
      fetchTimerRef.current = null;
      await fetchSessionOrders();
    }, 300);
  }, [fetchSessionOrders]);

  useEffect(() => {
    let cancelled = false;

    fetchSessionOrders().then(async () => {
      if (!sessionId || cancelled) return;
      const { data } = await supabaseRef.current
        .from("table_sessions")
        .select("bill_status")
        .eq("id", sessionId)
        .maybeSingle();

      if (cancelled || !isMountedRef.current) return;
      if (data?.bill_status === "presented") {
        setBillLocked(true);
        setShowBillPopup(true);
      } else if (data?.bill_status === "paid") {
        setBillLocked(true);
        setShowBillPopup(false);
        setShowReceipt(true);
      }
    });

    const timer = setTimeout(() => fetchSessionOrders(), 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fetchSessionOrders, sessionId]);

  // ── Session Table Realtime Channel ──────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    // FIX 2: Update realtime filter to use id instead of session_token
    if (!restaurant?.id || realtimeSetupDone.current) return;
    const supabase = supabaseRef.current;
    let channel: ReturnType<typeof getRestaurantChannel> | null = null;
    let cancelled = false;

    const setup = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      realtimeSetupDone.current = true;
      channel = getRestaurantChannel(restaurant.id, supabase, "customer");

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
              setTimeout(() => {
                if (isMountedRef.current) setShowBillPopup(true);
              }, 400);
            } else if (updated.bill_status === "paid") {
              setBillLocked(true);
              fetchSessionOrdersThrottled();
              setTimeout(() => {
                if (isMountedRef.current) {
                  setShowBillPopup(false);
                  setShowReceipt(true);
                }
              }, 400);
            } else if (!updated.is_active || updated.status === "completed") {
              clearToken();
              setTimeout(() => {
                if (isMountedRef.current) window.location.reload();
              }, 1500);
            }
          },
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(
              "[MenuClient] Realtime degraded — polling fallback active",
            );
          }
        });
    };

    setup();

    return () => {
      cancelled = true;
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      realtimeSetupDone.current = false;
      if (channel) releaseRestaurantChannel(restaurant.id, supabase, "customer");
    };
  }, [sessionId, sessionToken, restaurant?.id, fetchSessionOrdersThrottled]);

  // ── Realtime Subscription to synchronise Orders array directly ────────
  useEffect(() => {
    const client = supabaseRef.current;
    let channel: ReturnType<typeof client.channel> | null = null;
    let cancelled = false;

    const setup = async () => {
      if (!sessionId || !accessToken || cancelled) return;

      client.realtime.setAuth(accessToken!);
      if (cancelled) return;

      channel = client
        .channel(`orders-${sessionId}`)
        .on(
        "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `session_token=eq.${sessionToken}`,
          },
          (payload) => {
            const inserted = payload.new as SessionOrder;
            if (inserted.session_token !== sessionToken) return;
            if (inserted.status !== "Cancelled") {
              setAllOrders((prev) => {
                const exists = prev.some((o) => o.id === inserted.id);
                if (exists) return prev;
                return [...prev, inserted];
              });
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `session_token=eq.${sessionToken}`,
          },
          (payload) => {
            const updated = payload.new as SessionOrder;
            if (updated.session_token !== sessionToken) return;
            if (updated.status === "Cancelled") {
              setAllOrders((prev) => prev.filter((o) => o.id !== updated.id));
            } else {
              setAllOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "orders",
            filter: `session_token=eq.${sessionToken}`,
          },
          (payload) => {
            const oldPayload = payload.old as { id: string; session_token?: string | null };
            if (oldPayload.session_token && oldPayload.session_token !== sessionToken) return;
            setAllOrders((prev) => prev.filter((o) => o.id !== oldPayload.id));
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[MenuClient] Realtime connected");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.log("[MenuClient] Realtime degraded — polling fallback active");
          }
        });
    };

    setup();

    return () => {
      cancelled = true;
      if (channel) client.removeChannel(channel);
    };
  }, [sessionId, sessionToken, accessToken]);

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
        fetchSessionOrders().then(() => {
          setTimeout(() => {
            if (isMountedRef.current) setShowBillPopup(true);
          }, 400);
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionId, restaurant?.id, showBillPopup, fetchSessionOrders]);

  // Knife nav — hide on scroll down, show on scroll up (Throttled with requestAnimationFrame)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;

          if (currentY < 50) {
            if (!navVisibleRef.current) {
              navVisibleRef.current = true;
              setNavVisible(true);
            }
            if (pillsExpandedRef.current) {
              setPillsExpanded(false);
            }
          } else if (currentY > lastScrollY.current + 8) {
            if (navVisibleRef.current) {
              navVisibleRef.current = false;
              setNavVisible(false);
            }
            if (pillsExpandedRef.current) {
              setPillsExpanded(false);
            }
          } else if (currentY < lastScrollY.current - 8) {
            if (!navVisibleRef.current) {
              navVisibleRef.current = true;
              setNavVisible(true);
            }
          }
          lastScrollY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Cart helpers ───────────────────────────────────────────────────────
  function modifierSignature(modifiers: CartModifier[] = []) {
    return modifiers
      .map((modifier) => `${modifier.group}:${modifier.option}:${modifier.price}`)
      .sort()
      .join("|");
  }

  function isSameCartLine(
    cartItem: CartItem,
    item: MenuItem,
    modifiers: CartModifier[] = [],
    instructions = "",
  ) {
    return (
      cartItem.item.id === item.id &&
      modifierSignature(cartItem.modifiers) === modifierSignature(modifiers) &&
      (cartItem.specialInstructions ?? "") === instructions.trim()
    );
  }

  function addConfiguredItem(
    item: MenuItem,
    modifiers: CartModifier[] = [],
    modifierTotal = 0,
    instructions = "",
  ) {
    const specialInstructionsValue = instructions.trim();
    setOrder((prev) => {
      const ex = prev.find((ci) =>
        isSameCartLine(ci, item, modifiers, specialInstructionsValue),
      );
      if (ex)
        return prev.map((ci) =>
          isSameCartLine(ci, item, modifiers, specialInstructionsValue)
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci,
        );
      return [
        ...prev,
        {
          item,
          quantity: 1,
          modifiers,
          modifierTotal,
          specialInstructions: specialInstructionsValue || undefined,
        },
      ];
    });
  }

  function normalizeModifierGroups(
    groups: ModifierGroupRow[],
    options: ModifierOptionRow[],
  ): ModifierGroup[] {
    return groups
      .map((group) => {
        const groupOptions = options
          .map((option) => ({
            ...option,
            groupId: option.group_id ?? option.modifier_group_id ?? "",
          }))
          .filter(
            (option) =>
              option.groupId === group.id && option.is_available !== false,
          )
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const minSelect = group.min_select ?? 0;
        const maxSelect =
          group.max_select ??
          group.max_selections ??
          (group.selection_type === "multi" ? groupOptions.length : 1);

        return {
          ...group,
          options: groupOptions,
          required: group.is_required ?? group.required ?? minSelect > 0,
          minSelect,
          maxSelect: Math.max(1, maxSelect),
        };
      })
      .filter((group) => group.options.length > 0)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  async function fetchModifierGroups(item: MenuItem) {
    const cached = modifierCacheRef.current[item.id];
    if (cached) return cached;

    const supabase = supabaseRef.current;
    const { data: groups, error: groupsError } = await supabase
      .from("modifier_groups")
      .select("*")
      .eq("menu_item_id", item.id)
      .order("sort_order", { ascending: true });

    if (groupsError) throw groupsError;
    if (!groups || groups.length === 0) {
      modifierCacheRef.current[item.id] = [];
      return [];
    }

    const groupIds = groups.map((group) => group.id);
    let { data: options, error: optionsError } = await supabase
      .from("modifier_options")
      .select("*")
      .in("group_id", groupIds)
      .order("sort_order", { ascending: true });

    if (optionsError) {
      const fallback = await supabase
        .from("modifier_options")
        .select("*")
        .in("modifier_group_id", groupIds)
        .order("sort_order", { ascending: true });
      options = fallback.data;
      optionsError = fallback.error;
    }

    if (optionsError) throw optionsError;

    const normalized = normalizeModifierGroups(groups, options ?? []);
    modifierCacheRef.current[item.id] = normalized;
    return normalized;
  }

  async function addItem(item: MenuItem) {
    if (billLocked) return;

    setModifierError("");
    setModifierSheetItem(null);
    setModifierGroups([]);
    setModifierSelections({});
    setSpecialInstructions("");
    setModifierLoading(true);

    try {
      const groups = await fetchModifierGroups(item);
      if (groups.length === 0) {
        addConfiguredItem(item);
        closeModifierSheet();
        setModifierLoading(false);
        return;
      }

      setModifierSheetItem(item);
      setModifierGroups(groups);
      setModifierSelections({});
      setSpecialInstructions("");
      setModifierLoading(false);
    } catch (err) {
      console.error("Modifier fetch error:", err);
      setModifierError("Could not load options. Please try again.");
      setModifierSheetItem(null);
      setModifierGroups([]);
      setModifierSelections({});
      setSpecialInstructions("");
      setModifierLoading(false);
    }
  }

  const toggleModifierOption = (group: ModifierGroup, optionId: string) => {
    setModifierSelections(prev => {
      const existing = prev[group.id] ?? []
      
      if (group.is_multi_select) {
        // Multi-select: toggle independently — add if not present, remove if already selected
        const alreadySelected = existing.includes(optionId)
        return {
          ...prev,
          [group.id]: alreadySelected
            ? existing.filter((id: string) => id !== optionId)
            : [...existing, optionId]
        }
      } else {
        // Single-select: always replace with just this one option
        return {
          ...prev,
          [group.id]: [optionId]
        }
      }
    })
  }

  function selectedCartModifiers() {
    return modifierGroups.flatMap((group) => {
      const selectedIds = modifierSelections[group.id] ?? [];
      return group.options
        .filter((option) => selectedIds.includes(option.id))
        .map((option) => ({
          group: group.name,
          option: option.name,
          price: Number(option.price),
        }));
    });
  }

  function modifierSelectionComplete() {
    return modifierGroups.every((group) => {
      if (!group.required) return true;
      const selectedCount = modifierSelections[group.id]?.length ?? 0;
      return selectedCount >= Math.max(1, group.minSelect);
    });
  }

  function closeModifierSheet() {
    setModifierSheetItem(null);
    setModifierGroups([]);
    setModifierSelections({});
    setSpecialInstructions("");
    setModifierError("");
    setModifierLoading(false);
  }

  function confirmModifierSelection() {
    if (!modifierSheetItem || !modifierSelectionComplete()) return;

    const modifiers = selectedCartModifiers();
    const modifierTotal = modifiers.reduce((sum, option) => sum + option.price, 0);
    addConfiguredItem(
      modifierSheetItem,
      modifiers,
      modifierTotal,
      specialInstructions,
    );
    closeModifierSheet();
  }

  const updateCartItemNote = (itemKey: string, note: string) => {
    setOrder((prev) =>
      prev.map((ci) => {
        const currentKey = `${ci.item.id}-${modifierSignature(ci.modifiers)}-${ci.specialInstructions ?? ""}`;
        return currentKey === itemKey
          ? { ...ci, specialInstructions: note.trim() || undefined }
          : ci;
      })
    );
  };

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
          modifiers: ci.modifiers ?? [],
          modifierTotal: ci.modifierTotal ?? 0,
          specialInstructions: ci.specialInstructions,
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
        if (isMountedRef.current) {
          setOrderSuccess(false);
          setShowOrder(false);
          setOrder([]);
        }
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
      () => {
        if (isMountedRef.current) {
          setSentSignals((prev) => prev.filter((s) => s !== type));
        }
      },
      5000,
    );
  }

  // ── Language Toggle ────────────────────────────────────────────────────
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
  const currentSheetModifiers = selectedCartModifiers();
  const currentModifierTotal = currentSheetModifiers.reduce(
    (sum, modifier) => sum + modifier.price,
    0,
  );
  const currentSheetTotal = (modifierSheetItem?.price ?? 0) + currentModifierTotal;
  const canAddConfiguredItem =
    !modifierLoading && modifierGroups.length > 0 && modifierSelectionComplete();
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
  const rawFee = Math.round(runningTotal * 0.01 * 100) / 100;
  const sessionFee = runningTotal > 0 ? Math.min(Math.max(rawFee, 1), 15) : 0;
  const grandTotal = runningTotal + sessionFee;

  function removeItem(
    id: string,
    modifiers?: CartModifier[],
    instructions?: string,
  ) {
    setOrder((prev) =>
      prev
        .map((ci) =>
          ci.item.id === id &&
          (!modifiers ||
            modifierSignature(ci.modifiers) === modifierSignature(modifiers)) &&
          (instructions === undefined ||
            (ci.specialInstructions ?? "") === instructions)
            ? { ...ci, quantity: ci.quantity - 1 }
            : ci,
        )
        .filter((ci) => ci.quantity > 0),
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="menu-page"
      data-theme={restaurant.theme ?? "default"}
      style={{
        background: "var(--theme-bg)",
        willChange: "scroll-position",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ── MOTION BACKGROUNDS ── */}
      {/* Default + Carbon Lime — orb 1 */}
      <div
        className="ambient-gold motion-orb-1"
        style={{
          width: 500,
          height: 500,
          top: -120,
          left: -120,
          position: "fixed",
          zIndex: 0,
          background: "var(--theme-orb-1)",
          borderRadius: "50%",
          filter: "blur(60px)",
        }}
      />
      {/* Default + Carbon Lime — orb 2 */}
      <div
        className="ambient-emerald motion-orb-2"
        style={{
          width: 400,
          height: 400,
          top: 350,
          right: -100,
          position: "fixed",
          zIndex: 0,
          background: "var(--theme-orb-2, var(--theme-accent-glow))",
          borderRadius: "50%",
          filter: "blur(50px)",
        }}
      />

      {/* Carbon & Lime — scan line */}
      {restaurant.theme === "carbon-lime" && (
        <div
          className="motion-scan"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, var(--theme-accent), transparent)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Midnight & Coral — ocean wave + bioluminescent pulse */}
      {restaurant.theme === "midnight-coral" && (
        <>
          <div
            className="motion-wave motion-orb-1"
            style={{
              position: "fixed",
              width: 600,
              height: 300,
              bottom: -100,
              left: -100,
              background:
                "radial-gradient(ellipse, rgba(255,107,107,0.2) 0%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <div
            className="motion-coral-pulse"
            style={{
              position: "fixed",
              width: 500,
              height: 500,
              top: -150,
              right: -150,
              background:
                "radial-gradient(circle, rgba(255,107,107,0.18) 0%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <div
            className="motion-wave"
            style={{
              position: "fixed",
              width: 400,
              height: 200,
              top: "40%",
              right: -80,
              background:
                "radial-gradient(ellipse, rgba(255,107,107,0.1) 0%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
              animationDelay: "4s",
            }}
          />
        </>
      )}

      {/* Void & Violet — deep space nebula */}
      {restaurant.theme === "void-violet" && (
        <>
          <div
            className="motion-nebula"
            style={{
              position: "fixed",
              width: 600,
              height: 600,
              top: -200,
              left: -200,
              background:
                "radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(167,139,250,0.1) 50%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <div
            className="motion-nebula"
            style={{
              position: "fixed",
              width: 500,
              height: 500,
              bottom: -150,
              right: -150,
              background:
                "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
              animationDelay: "8s",
            }}
          />
          <div className="motion-star" style={{ top: "15%", left: "20%" }} />
          <div
            className="motion-star"
            style={{ top: "30%", left: "70%", animationDelay: "0.5s" }}
          />
          <div
            className="motion-star"
            style={{ top: "55%", left: "40%", animationDelay: "1.2s" }}
          />
          <div
            className="motion-star"
            style={{ top: "70%", left: "80%", animationDelay: "2.1s" }}
          />
          <div
            className="motion-star"
            style={{ top: "85%", left: "15%", animationDelay: "2.8s" }}
          />
        </>
      )}

      {/* Ember & Crimson — fire heat + rising embers */}
      {restaurant.theme === "ember-crimson" && (
        <>
          <div
            className="motion-fire-glow"
            style={{
              position: "fixed",
              width: 500,
              height: 500,
              bottom: -200,
              left: "50%",
              transform: "translateX(-50%)",
              background:
                "radial-gradient(circle, rgba(220,38,38,0.3) 0%, rgba(239,68,68,0.1) 50%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
            }}
          />
          <div
            className="motion-fire-glow"
            style={{
              position: "fixed",
              width: 400,
              height: 400,
              top: -100,
              right: -100,
              background:
                "radial-gradient(circle, rgba(220,38,38,0.2) 0%, transparent 70%)",
              borderRadius: "50%",
              zIndex: 0,
              animationDelay: "2.5s",
            }}
          />
          <div className="motion-heat" style={{ left: "10%", bottom: 0 }} />
          <div
            className="motion-heat"
            style={{ left: "30%", bottom: 0, animationDelay: "1s" }}
          />
          <div
            className="motion-heat"
            style={{ left: "60%", bottom: 0, animationDelay: "2s" }}
          />
          <div
            className="motion-heat"
            style={{ left: "85%", bottom: 0, animationDelay: "3s" }}
          />
        </>
      )}

      {/* Obsidian & Rose — petal drift + aurora shimmer */}
      {restaurant.theme === "obsidian-rose" && (
        <>
          <div
            className="motion-aurora"
            style={{
              position: "fixed",
              width: "120%",
              height: 300,
              top: -100,
              left: "-10%",
              background:
                "linear-gradient(180deg, rgba(244,63,94,0.15) 0%, rgba(251,207,232,0.08) 50%, transparent 100%)",
              zIndex: 0,
            }}
          />
          <div
            className="motion-aurora"
            style={{
              position: "fixed",
              width: "120%",
              height: 250,
              bottom: -80,
              left: "-10%",
              background:
                "linear-gradient(0deg, rgba(244,63,94,0.12) 0%, transparent 100%)",
              zIndex: 0,
              animationDelay: "5s",
            }}
          />
          <div className="motion-petal" style={{ left: "10%", bottom: -10 }} />
          <div
            className="motion-petal"
            style={{ left: "35%", bottom: -10, animationDelay: "3s" }}
          />
          <div className="motion-petal" style={{ left: "60%", bottom: -10, animationDelay: "7s" }} />
          <div
            className="motion-petal"
            style={{ left: "85%", bottom: -10, animationDelay: "11s" }}
          />
        </>
      )}

      {/* ── HEADER ── */}
      <header className="menu-header">
        {/* Hero — cycles restaurant info then each active promo */}
        <div className="relative " style={{ minHeight: "220px" }}>
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
                    border: "1.5px solid var(--gold-dim)",
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
                      <UtensilsCrossed size={26} color="var(--gold-dim)" />
                    </div>
                  )}
                </div>

                {/* Name + tagline */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <p
                    style={{
                      color: "var(--gold-glow)",
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
                    borderTop: "1px solid var(--gold-dim)",
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
                        color: "var(--gold-dim)",
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
              className="transition-all duration-500"
              style={{
                opacity: heroIndex === i + 1 ? 1 : 0,
                transform:
                  heroIndex === i + 1 ? "translateY(0)" : "translateY(10px)",
                position: heroIndex === i + 1 ? "relative" : "absolute",
                width: "100%",
                top: 0,
                padding: "0 16px 8px",
              }}
            >
              <div
                className="relative rounded-xl overflow-hidden w-full"
                style={{
                  height: "200px",
                  minHeight: "200px",
                  display: "block",
                }}
              >
                {/* Full-width banner fills entire card */}
                {promo.image_url ? (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  /* No banner — solid fallback background */
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: "var(--gold-dim)",
                      border: "1px solid var(--gold-dim)",
                      borderRadius: "1rem",
                    }}
                  />
                )}

                {/* Dark gradient at bottom for text legibility */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 50%, transparent 100%)",
                    borderRadius: "1rem",
                  }}
                />

                {/* Text pinned to bottom */}
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold tracking-widest"
                      style={{ color: "var(--gold-glow)" }}
                    >
                      PROMO
                    </span>
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: "var(--gold-dim)" }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "var(--cream-35)" }}
                    >
                      Limited time
                    </span>
                  </div>
                  <p className="text-white font-bold text-base leading-snug">
                    {promo.title}
                  </p>
                  {promo.description && (
                    <p className="text-white/40 text-xs mt-1 leading-relaxed">
                      {promo.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Dot indicators */}
          {promos.length > 0 && (
            <div
              className="flex justify-center gap-1.5 mt-2"
              style={{ paddingBottom: "12px" }}
            >
              {[...Array(1 + promos.length)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor:
                      heroIndex === i ? "var(--gold-glow)" : "var(--gold-dim)",
                  }}
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
            <span className="t-caption">{ui.runningTotal}</span>
          </div>
          <span className="t-price" style={{ fontSize: 18 }}>
            {restaurant.currency} {runningTotal.toFixed(2)}
          </span>
        </div>
      )}

      {/* ── KNIFE NAV ── */}
      <div
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: navVisible
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(120px)",
          zIndex: 200,
          display: "flex",
          alignItems: "center",
          width: "calc(100% - 24px)",
          maxWidth: 420,
          height: 68,
          borderRadius: 999,
          background: "var(--theme-nav-bg, rgba(2,44,34,0.95))",
          border: "1px solid var(--theme-nav-border, rgba(217,119,6,0.25))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 -1px 0 rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
          overflow: "hidden",
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Blade — signal buttons */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-around",
            padding: "0 4px 0 16px",
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Blade shine */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.1) 70%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          {signals.map((s) => {
            const sent = sentSignals.includes(s.type);
            return (
              <button
                key={s.type}
                type="button"
                onClick={() => sendSignal(s.type)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 16,
                  transition: "all 0.2s ease",
                  minWidth: 52,
                  minHeight: 52,
                  backgroundColor: sent
                    ? "var(--theme-accent-glow, rgba(217,119,6,0.15))"
                    : "transparent",
                }}
              >
                <span
                  style={{
                    color: sent
                      ? "var(--theme-accent, #D97706)"
                      : "rgba(255,255,255,0.6)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: sent ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {sent ? <CheckCircle size={20} /> : s.icon}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: sent
                      ? "var(--theme-accent, #D97706)"
                      : "rgba(255,255,255,0.35)",
                    transition: "color 0.2s ease",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  {sent ? ui.sent : s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Handle divider */}
        <div
          style={{
            width: 1,
            height: 40,
            backgroundColor: "var(--theme-border, rgba(217,119,6,0.2))",
            flexShrink: 0,
          }}
        />

        {/* Handle — order count badge */}
        <div
          style={{
            width: 80,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            position: "relative",
            cursor: count > 0 ? "pointer" : "default",
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.25) 100%)",
            borderRadius: "0 999px 999px 0",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
          }}
          onClick={() => count > 0 && setShowOrder(true)}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background:
                count > 0
                  ? "var(--theme-accent, #D97706)"
                  : "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow:
                count > 0
                  ? "0 4px 20px var(--theme-accent-glow, rgba(217,119,6,0.4))"
                  : "none",
            }}
          >
            {count > 0 ? (
              <span
                style={{
                  color: "#022c22",
                  fontWeight: 900,
                  fontSize: count > 9 ? 13 : 16,
                  lineHeight: 1,
                }}
              >
                {count}
              </span>
            ) : (
              <ShoppingBag size={20} color="rgba(255,255,255,0.3)" />
            )}
          </div>
          {count > 0 && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "var(--theme-accent, #D97706)",
                animation: "pulseGold 1.5s infinite",
              }}
            />
          )}
        </div>
      </div>

      {/* ── CATEGORY PILLS — animated expand/collapse ── */}
      <div
        style={{
          padding: "6px 16px 0",
          position: "relative",
          minHeight: 36,
        }}
        onClick={() => !pillsExpanded && setPillsExpanded(true)}
      >
        {!pillsExpanded ? (
          /* Collapsed — show active pill + hint */
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            {/* Active category pill */}
            <button
              type="button"
              className="pill active"
              style={{ pointerEvents: "none" }}
            >
              {t(
                [
                  { id: null, name_en: "All", name_fr: "Tout" },
                  ...categories,
                ].find((c) => (c.id ?? null) === activeCategory)?.name_en ??
                  "All",
                (
                  [
                    { id: null, name_en: "All", name_fr: "Tout" },
                    ...categories,
                  ].find((c) => (c.id ?? null) === activeCategory) as any
                )?.name_fr,
              )}
            </button>
            {/* Hint dots */}
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              {[...Array(Math.min(3, categories.length))].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: "var(--cream-15)",
                    transform: `scale(${1 - i * 0.2})`,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: 10,
                color: "var(--cream-35)",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {categories.length} categories
            </span>
          </div>
        ) : (
          /* Expanded — all pills in animated wrap */
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              animation: "fadeUp 0.25s ease",
            }}
          >
            {[{ id: null, name_en: "All", name_fr: "Tout" }, ...categories].map(
              (cat, index) => (
                <button
                  key={cat.id ?? "all"}
                  type="button"
                  className={`pill ${activeCategory === (cat.id ?? null) ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCategory(cat.id ?? null);
                    setPillsExpanded(false);
                  }}
                  style={{
                    animation: `fadeUp 0.2s ease ${index * 0.04}s both`,
                  }}
                >
                  {t(cat.name_en, (cat as any).name_fr)}
                </button>
              ),
            )}
          </div>
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
            const inOrderCount = order
              .filter((ci) => ci.item.id === item.id)
              .reduce((sum, ci) => sum + ci.quantity, 0);
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
                  <span
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
                    {inOrderCount > 0 ? (
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
                          {inOrderCount} {ui.inOrder}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (!billLocked) addItem(item);
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn-add btn-add-full"
                        onClick={() => {
                          if (!billLocked) addItem(item);
                        }}
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
                    ) : inOrderCount > 0 ? (
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
                          {inOrderCount}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => {
                            if (!billLocked) addItem(item);
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn-add" onClick={() => addItem(item)}>
                        {ui.addToOrder} +
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Knife nav spacer — prevents content hiding behind fixed nav */}
      <div style={{ height: 100 }} />

      {/* ── FLOATING ORDER BAR ── */}
      {count > 0 && (
        <div className="order-bar" style={{ bottom: navVisible ? 96 : 16 }}>
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

      {/* ── MODIFIER SHEET ── */}
      {modifierSheetItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 180,
            background: "color-mix(in srgb, var(--theme-bg) 72%, transparent)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: prefersReducedMotion ? "none" : "fadeIn 0.2s ease",
          }}
        >
          <button
            type="button"
            aria-label={ui.close}
            onClick={closeModifierSheet}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t(modifierSheetItem.name_en, modifierSheetItem.name_fr)}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 520,
              maxHeight: "88vh",
              background: "var(--theme-surface)",
              border: "1px solid var(--gold-dim)",
              borderBottom: "none",
              borderRadius: "28px 28px 0 0",
              boxShadow: "0 -8px 60px rgba(0,0,0,0.42)",
              overflow: "hidden",
              animation: prefersReducedMotion
                ? "none"
                : "slideUp 0.32s cubic-bezier(.34,1.56,.64,1)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 999,
                background: "var(--cream-20)",
                margin: "12px auto",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: "0 18px 18px",
              }}
            >
              <img
                src={modifierSheetItem.image_url}
                alt={t(modifierSheetItem.name_en, modifierSheetItem.name_fr)}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 18,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="t-eyebrow" style={{ marginBottom: 5 }}>
                  Customize
                </p>
                <h2
                  className="t-heading"
                  style={{
                    fontSize: 20,
                    lineHeight: 1.15,
                    marginBottom: 6,
                  }}
                >
                  {t(modifierSheetItem.name_en, modifierSheetItem.name_fr)}
                </h2>
                <p className="t-price-sm">
                  {restaurant.currency} {modifierSheetItem.price.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={closeModifierSheet}
                aria-label={ui.close}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                maxHeight: "calc(88vh - 244px)",
                overflowY: "auto",
                padding: "0 18px 18px",
              }}
            >
              {modifierLoading ? (
                <div
                  style={{
                    minHeight: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    color: "var(--cream-75)",
                  }}
                >
                  <Loader2 size={18} className="animate-spin" />
                  <span className="t-body">Loading options...</span>
                </div>
              ) : modifierError ? (
                <div
                  style={{
                    padding: 16,
                    background:
                      "color-mix(in srgb, var(--theme-danger) 12%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--theme-danger) 32%, transparent)",
                    borderRadius: 16,
                  }}
                >
                  <p className="nn-error" style={{ marginBottom: 12 }}>
                    {modifierError}
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => addItem(modifierSheetItem)}
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {modifierGroups.map((group) => {
                    const selected = modifierSelections[group.id] ?? [];

                    return (
                      <section key={group.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 10,
                          }}
                        >
                          <div>
                            <h3 className="t-title" style={{ fontSize: 15 }}>
                              {group.name}
                            </h3>
                            <p className="t-caption" style={{ marginTop: 2 }}>
                              {group.required ? "Required" : "Optional"}
                              {group.maxSelect > 1
                                ? ` · Choose up to ${group.maxSelect}`
                                : ""}
                            </p>
                          </div>
                          {group.required && selected.length === 0 && (
                            <span
                              className="t-caption"
                              style={{ color: "var(--theme-accent)" }}
                            >
                              Pick one
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {group.options.map((option) => {
                            const checked = selected.includes(option.id);
                            return (
                              <label
                                key={option.id}
                                style={{
                                  minHeight: 44,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  padding: "10px 12px",
                                  background: checked
                                    ? "color-mix(in srgb, var(--theme-accent) 12%, transparent)"
                                    : "color-mix(in srgb, var(--theme-bg) 40%, transparent)",
                                  border: checked
                                    ? "1px solid var(--theme-accent)"
                                    : "1px solid var(--cream-15)",
                                  borderRadius: 14,
                                  cursor: "pointer",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    minWidth: 0,
                                  }}
                                >
                                  <input
                                    type={group.is_multi_select === true ? "checkbox" : "radio"}
                                    name={`modifier-${group.id}`}
                                    checked={checked}
                                    onChange={() =>
                                      toggleModifierOption(group, option.id)
                                    }
                                    style={{
                                      width: 20,
                                      height: 20,
                                      accentColor: "var(--theme-accent)",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span className="t-body">{option.name}</span>
                                </span>
                                {Number(option.price) > 0 && (
                                  <span
                                    className="t-price-sm"
                                    style={{
                                      fontSize: 13,
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    +{restaurant.currency}{" "}
                                    {Number(option.price).toFixed(2)}
                                  </span>
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              style={{
                position: "sticky",
                bottom: 0,
                zIndex: 10,
                padding: "14px 18px calc(24px + env(safe-area-inset-bottom))",
                borderTop: "1px solid var(--cream-15)",
                background: "var(--theme-surface)",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 12,
                }}
              >
                <span
                  className="t-body"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  Any special requests? (optional)
                </span>
                <input
                  type="text"
                  maxLength={150}
                  placeholder={'e.g. "No onions", "Extra spicy"'}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 44,
                    background: "var(--theme-surface)",
                    border: "1px solid var(--cream-15)",
                    borderRadius: 12,
                    color: "var(--cream)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    padding: "10px 12px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span className="t-body">Modifiers</span>
                <span className="t-price-sm">
                  {restaurant.currency} {currentModifierTotal.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmModifierSelection}
                disabled={!canAddConfiguredItem}
                style={{
                  minHeight: 52,
                  opacity: canAddConfiguredItem ? 1 : 0.55,
                  cursor: canAddConfiguredItem ? "pointer" : "not-allowed",
                }}
              >
                Add to cart — {restaurant.currency}{" "}
                {currentSheetTotal.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DRAWER ── */}
      {showOrder && (() => {
        const hasAnyExpired = order.some((ci) => {
          const liveOrder = allOrders.find(o => 
            Array.isArray(o.items) && o.items.some((item: any) => 
              item.menu_item_id === ci.item.id || item.id === ci.item.id
            )
          );
          const status = liveOrder?.status ?? null;
          const estimatedReadyAt = liveOrder?.estimated_ready_at ?? null;
          return (
            estimatedReadyAt &&
            status === "Preparing" &&
            Date.now() > new Date(estimatedReadyAt).getTime()
          );
        });

        return (
          <div className="drawer-overlay">
            <div className="drawer-scrim" onClick={() => setShowOrder(false)} />
            <div
              className="drawer"
              style={
                hasAnyExpired
                  ? {
                      border: "2px solid var(--theme-accent)",
                      boxShadow: "0 0 15px var(--theme-accent-glow, rgba(217,119,6,0.4))",
                      animation: "pulseGold 2s infinite",
                    }
                  : {}
              }
            >
              <div className="drawer-head">
                <div>
                  <h2 className="t-heading" style={{ fontSize: 20 }}>{ui.yourOrder}</h2>
                  <p className="t-eyebrow" style={{ marginTop: 4 }}>
                    {customerName} · {count} item{count !== 1 ? "s" : ""}
                  </p>
                </div>
                <button className="btn-icon" onClick={() => setShowOrder(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-items">
                {order.map((ci) => {
                  const liveOrder = allOrders.find(o => 
                    Array.isArray(o.items) && o.items.some((item: any) => 
                      item.menu_item_id === ci.item.id || item.id === ci.item.id
                    )
                  );
                  const status = liveOrder?.status ?? null;
                  const estimatedReadyAt = liveOrder?.estimated_ready_at ?? null;
                  const isExpired =
                    estimatedReadyAt &&
                    status === "Preparing" &&
                    Date.now() > new Date(estimatedReadyAt).getTime();

                  const itemKey = `${ci.item.id}-${modifierSignature(ci.modifiers)}-${ci.specialInstructions ?? ""}`;

                  return (
                    <div
                      key={itemKey}
                      className="drawer-item"
                    >
                      <img
                        src={ci.item.image_url}
                        alt={t(ci.item.name_en, ci.item.name_fr)}
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
                          {(
                            (ci.item.price + (ci.modifierTotal ?? 0)) *
                            ci.quantity
                          ).toFixed(2)}
                        </p>
                        {ci.modifiers && ci.modifiers.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                              marginTop: 5,
                            }}
                          >
                            {ci.modifiers.map((modifier, index) => (
                              <span
                                key={`${modifier.group}-${modifier.option}-${index}`}
                                className="t-caption"
                                style={{
                                  fontSize: 11,
                                  lineHeight: 1.35,
                                  color: "var(--cream-55)",
                                }}
                              >
                                {modifier.group}: {modifier.option}
                                {modifier.price > 0
                                  ? ` +${restaurant.currency} ${modifier.price.toFixed(2)}`
                                  : ""}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Note button */}
                        {ci.specialInstructions ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--theme-accent)', fontStyle: 'italic', flex: 1 }}>
                              "{ci.specialInstructions}"
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingNoteItemKey(itemKey)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--cream-35)', cursor: 'pointer', padding: 2, minHeight: 28, minWidth: 28 }}
                            >
                              <Pencil size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingNoteItemKey(itemKey)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--cream-35)', cursor: 'pointer', fontSize: 11, padding: '2px 0', textAlign: 'left', minHeight: 28 }}
                          >
                            + Add note
                          </button>
                        )}

                        {/* Inline note input */}
                        {editingNoteItemKey === itemKey && (
                          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                            <input
                              type="text"
                              maxLength={150}
                              placeholder='e.g. "No onions, extra spicy"'
                              defaultValue={ci.specialInstructions ?? ''}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateCartItemNote(itemKey, (e.target as HTMLInputElement).value);
                                  setEditingNoteItemKey(null);
                                }
                              }}
                              autoFocus
                              style={{ flex: 1, background: 'var(--theme-surface)', border: '1px solid var(--cream-15)', borderRadius: 8, color: 'var(--cream)', padding: '6px 10px', fontSize: 12, minHeight: 36, outline: 'none' }}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                updateCartItemNote(itemKey, input.value);
                                setEditingNoteItemKey(null);
                              }}
                              style={{ background: 'var(--theme-accent)', color: '#022c22', border: 'none', borderRadius: 8, padding: '0 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 36 }}
                            >
                              Save
                            </button>
                          </div>
                        )}

                        {/* Status label */}
                        {status && status !== "Pending" && (
                          <div style={{ marginTop: 6 }}>
                            {status === "Preparing" && (
                              <span
                                style={{
                                  color: "var(--theme-accent)",
                                  background:
                                    "color-mix(in srgb, var(--theme-accent) 15%, transparent)",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  display: "inline-block",
                                  width: "fit-content",
                                }}
                              >
                                Preparing
                              </span>
                            )}
                            {status === "Served" && (
                              <span
                                style={{
                                  color: "var(--theme-success)",
                                  background:
                                    "color-mix(in srgb, var(--theme-success) 15%, transparent)",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  display: "inline-block",
                                  width: "fit-content",
                                }}
                              >
                                Served
                              </span>
                            )}
                            {status === "Cancelled" && (
                              <span
                                style={{
                                  color: "var(--theme-danger)",
                                  background:
                                    "color-mix(in srgb, var(--theme-danger) 15%, transparent)",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  display: "inline-block",
                                  width: "fit-content",
                                }}
                              >
                                Cancelled
                              </span>
                            )}
                          </div>
                        )}

                        {/* Expired Call Waiter Trigger */}
                        {isExpired && (
                          <button
                            type="button"
                            onClick={() => sendSignal("call_waiter")}
                            style={{
                              marginTop: 8,
                              padding: "4px 10px",
                              background: "var(--theme-accent)",
                              color: "#022c22",
                              border: "none",
                              borderRadius: 8,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              width: "fit-content",
                            }}
                          >
                            <Bell size={12} /> Call Waiter
                          </button>
                        )}
                      </div>
                      <div
                        className="qty-control"
                        style={{ flexShrink: 0, padding: "4px 10px" }}
                      >
                        <button
                          className="qty-btn"
                          onClick={() =>
                            removeItem(
                              ci.item.id,
                              ci.modifiers,
                              ci.specialInstructions ?? "",
                            )
                          }
                        >
                          <Minus size={13} />
                        </button>
                        <span className="qty-num" style={{ fontSize: 13 }}>
                          {ci.quantity}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() =>
                            addConfiguredItem(
                              ci.item,
                              ci.modifiers ?? [],
                              ci.modifierTotal ?? 0,
                              ci.specialInstructions ?? "",
                            )
                          }
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
        );
      })()}

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
                  ? (o.items as OrderItemSnapshot[])
                  : [];
                return (
                  <div key={i}>
                    <p
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
                            flexDirection: "column",
                            gap: 8,
                            alignItems: "flex-start",
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
                          {item.modifiers && item.modifiers.length > 0 && (
                            <div style={{ paddingLeft: 24 }}>
                              {item.modifiers.map((modifier, index) => (
                                <p
                                  key={`${modifier.group}-${modifier.option}-${index}`}
                                  className="t-caption"
                                  style={{ fontSize: 11, lineHeight: 1.35 }}
                                >
                                  {modifier.group}: {modifier.option}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="t-body" style={{ fontSize: 13 }}>
                          {restaurant.currency}{" "}
                          {(
                            (item.price + (item.modifierTotal ?? 0)) *
                            item.quantity
                          ).toFixed(2)}
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
                <span
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
              ? (o.items as OrderItemSnapshot[])
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
          backgroundColor: "var(--gold)",
          color: "var(--bg)",
          boxShadow: "0 4px 20px var(--gold-dim)",
        }}
        title={lang === "en" ? "Switch to French" : "Switch to English"}
      >
        <Languages size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
