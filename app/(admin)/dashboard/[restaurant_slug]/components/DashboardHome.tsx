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
  Camera,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import QRGenerator from "./QRGenerator";
import { uploadMenuImage, compressImage } from "@/lib/compress-image";
import type { Tables } from "@/types/database.types";

type Restaurant = Tables<"restaurants">;
type Order = Tables<"orders">;
type TableSession = Tables<"table_sessions">;

type RestaurantStats = {
  gross_revenue?: number | null;
  total_orders?: number | null;
  tables_served?: number | null;
  total_platform_fees?: number | null;
};

type MenuItemStats = {
  item_id?: string | null;
  item_name?: string | null;
  total_quantity?: number | null;
  total_revenue?: number | null;
};

type PeakHourStats = {
  hour_of_day?: number | null;
  order_count?: number | null;
};

interface Props {
  restaurant: Restaurant;
  staff: Tables<"restaurant_staff">;
  dailyStats: RestaurantStats | null;
  monthRevenue: number;
  monthCount: number;
  topItems: MenuItemStats[];
  peakHours: PeakHourStats[];
  recentOrders: Order[];
  activeOrdersCount: number;
  activeTablesCount: number;
  signalsCount: number;
  todayRevenueOverride: number;
}

type Tab =
  | "overview"
  | "stats"
  | "menu"
  | "analytics"
  | "settlements"
  | "profile";

function StatusIcon({ status }: { status: string }) {
  if (status === "Cancelled")
    return <XCircle size={14} color="var(--theme-danger)" />;
  return <CheckCircle size={14} color="var(--theme-success)" />;
}

function StatusLabel({ status }: { status: string }) {
  if (status === "Completed")
    return <span className="status-done">{status}</span>;
  if (status === "Cancelled")
    return <span className="status-cancel">{status}</span>;
  return <span className="status-pending">{status}</span>;
}

type LedgerRow = {
  id?: string;
  ledger_date?: string;
  total_owed: number | null;
  completed_sessions: number | null;
  is_paid: boolean | null;
  session_fees_collected?: number | null;
  platform_fees_owed?: number | null;
  platform_fees_paid?: number | null;
};

type PromoRow = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
};

type StaffRow = {
  id: string;
  display_name: string | null;
  role: string | null;
};

export default function DashboardHome({
  restaurant,
  dailyStats,
  monthRevenue,
  monthCount,
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
  const [baseUrl, setBaseUrl] = useState("");
  const [closingWarning, setClosingWarning] = useState<
    "approaching" | "overdue" | null
  >(null);
  const [analyticsData, setAnalyticsData] = useState<{
    daily: { date: string; revenue: number; orders: number }[];
    monthly?: { month: string; revenue: number; orders: number }[];
    feedback: {
      rating: number;
      review: string | null;
      customer_name: string;
      created_at: string;
      staff_name: string | null;
    }[];
  } | null>(null);

  const [showAllRevDays, setShowAllRevDays] = useState(false);
  const [showAllOrdDays, setShowAllOrdDays] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [settlementRows, setSettlementRows] = useState<LedgerRow[]>([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [settlementsError, setSettlementsError] = useState("");
  const [expandedLedgerDate, setExpandedLedgerDate] = useState<string | null>(
    null,
  );
  const [settlementSessions, setSettlementSessions] = useState<
    Record<string, TableSession[]>
  >({});
  const [settlementSessionsLoading, setSettlementSessionsLoading] = useState<
    Record<string, boolean>
  >({});

  // Profile & Settings state
  const [profileForm, setProfileForm] = useState({
    name: restaurant.name ?? "",
    description: restaurant.description ?? "",
    opening_time: restaurant.opening_time ?? "",
    closing_time: restaurant.closing_time ?? "",
    contact_number: restaurant.contact_number ?? "",
    address: restaurant.address ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? "");
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [promoForm, setPromoForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    image_url: "",
  });
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoBannerUploading, setPromoBannerUploading] = useState(false);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffDeleting, setStaffDeleting] = useState<string | null>(null);

  const [selectedTheme, setSelectedTheme] = useState<string>(
    restaurant.theme ?? "default",
  );
  const [themeSaving, setThemeSaving] = useState(false);

  // ── CRITICAL: singleton supabase client in ref ────────────────────────
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    if (todayLedger?.is_paid) setClosingWarning(null);
  }, [todayLedger?.is_paid]);

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
        const hasOutstanding =
          todayLedger && Number(todayLedger?.total_owed ?? 0) > 0;
        setClosingWarning(hasOutstanding ? "overdue" : null);
      } else if (diffMins <= 30) {
        setClosingWarning("approaching");
      } else {
        setClosingWarning(null);
      }
    }

    // Run immediately on mount regardless of closing_time
    checkClosingTime();
    const interval = setInterval(checkClosingTime, 10000);
    return () => clearInterval(interval);
  }, [restaurant.closing_time, todayLedger]);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  useEffect(() => {
    if (tab === "profile") {
      fetchPromos();
      fetchStaff();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "analytics" && !analyticsData && !analyticsLoading) {
      fetchAnalytics();
    }
  }, [tab, analyticsData, analyticsLoading, restaurant.id]);

  useEffect(() => {
    if (tab === "settlements" && settlementRows.length === 0) {
      fetchSettlementHistory();
    }
  }, [tab, settlementRows.length, restaurant.id]);

  useEffect(() => {
    async function refreshTodayRevenue() {
      const today = new Date().toISOString().split("T")[0];
      const todayStart = `${today}T00:00:00.000Z`;
      const tomorrowStartDate = new Date(todayStart);
      tomorrowStartDate.setUTCDate(tomorrowStartDate.getUTCDate() + 1);
      const tomorrowStart = tomorrowStartDate.toISOString();

      try {
        // Fetch completed session tokens for today
        const { data: completedSessions } = await supabaseRef.current
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
          const { data: revenueOrders } = await supabaseRef.current
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
          supabaseRef.current
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .in("status", ["Pending", "Preparing"]),

          supabaseRef.current
            .from("table_sessions")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .eq("is_active", true),

          supabaseRef.current
            .from("waiter_signals")
            .select("*", { count: "exact", head: true })
            .eq("restaurant_id", restaurant.id)
            .eq("is_resolved", false),

          supabaseRef.current
            .from("orders")
            .select("*")
            .eq("restaurant_id", restaurant.id)
            .neq("status", "Cancelled")
            .order("created_at", { ascending: false })
            .limit(10),

          supabaseRef.current
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
      if (ledgerRes.data) {
        setTodayLedger((ledgerRes.data as LedgerRow | null) ?? null);
      }
    }

    // Refresh immediately on mount to catch any changes since SSR
    refreshCounts();

    // Then subscribe and refresh on any relevant change
    const channel = supabaseRef.current
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
      supabaseRef.current.removeChannel(channel);
    };
  }, [restaurant.id]);

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/analytics?restaurant_id=${restaurant.id}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      console.error("Analytics fetch failed:", e);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchSettlementHistory() {
    setSettlementsLoading(true);
    setSettlementsError("");
    try {
      const { data, error } = await supabaseRef.current
        .from("daily_ledger")
        .select(
          "id, ledger_date, completed_sessions, total_owed, is_paid, session_fees_collected, platform_fees_owed, platform_fees_paid",
        )
        .eq("restaurant_id", restaurant.id)
        .order("ledger_date", { ascending: false })
        .limit(30);

      if (error) {
        setSettlementsError("Could not load settlement history.");
        return;
      }

      setSettlementRows((data ?? []) as LedgerRow[]);
    } catch {
      setSettlementsError("Could not load settlement history.");
    } finally {
      setSettlementsLoading(false);
    }
  }

  async function toggleLedgerDate(ledgerDate: string) {
    setExpandedLedgerDate((current) =>
      current === ledgerDate ? null : ledgerDate,
    );

    if (settlementSessions[ledgerDate]) return;

    setSettlementSessionsLoading((current) => ({
      ...current,
      [ledgerDate]: true,
    }));

    const dayStart = `${ledgerDate}T00:00:00.000Z`;
    const nextDay = new Date(dayStart);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    try {
      const { data } = await supabaseRef.current
        .from("table_sessions")
        .select(
          "id, table_number, closed_at, session_total, platform_fee_charged, status",
        )
        .eq("restaurant_id", restaurant.id)
        .eq("status", "completed")
        .gte("closed_at", dayStart)
        .lt("closed_at", nextDay.toISOString())
        .order("closed_at", { ascending: false });

      setSettlementSessions((current) => ({
        ...current,
        [ledgerDate]: (data ?? []) as TableSession[],
      }));
    } finally {
      setSettlementSessionsLoading((current) => ({
        ...current,
        [ledgerDate]: false,
      }));
    }
  }

  // ── Static computed values from server-rendered props ─────────────────
  const mRevenue = monthRevenue;
  const today = new Date().toISOString().split("T")[0];
  const dOrders =
    analyticsData?.daily?.find((d) => d.date === today)?.orders ?? 0;
  const mOrders =
    analyticsData?.daily?.reduce((sum, d) => sum + (d.orders ?? 0), 0) ?? 0;
  const mTables = monthCount;
  const mFees = 0;
  const dRevenue = todayRevenue ?? dailyStats?.gross_revenue ?? 0;
  const dTables = dailyStats?.tables_served ?? 0;
  const formatLedgerDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const formatSessionTime = (value: string | null) =>
    value
      ? new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const maxQty = topItems[0]?.total_quantity ?? 1;
  const maxPeak = peakHours[0]?.order_count ?? 1;

  async function handleLogout() {
    await supabaseRef.current.auth.signOut();
    startTransition(() => {
      router.push("/login");
    });
  }

  async function fetchPromos() {
    const { data } = await supabaseRef.current
      .from("restaurant_promos")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false });
    setPromos((data ?? []) as PromoRow[]);
  }

  async function fetchStaff() {
    const { data } = await supabaseRef.current
      .from("restaurant_staff")
      .select("id, display_name, role")
      .eq("restaurant_id", restaurant.id)
      .eq("role", "waiter");
    setStaffList((data ?? []) as StaffRow[]);
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const { data, error } = await supabaseRef.current
        .from("restaurants")
        .update({
          name: profileForm.name,
          description: profileForm.description,
          opening_time: profileForm.opening_time || null,
          closing_time: profileForm.closing_time || null,
          contact_number: profileForm.contact_number,
          address: profileForm.address,
        })
        .eq("id", restaurant.id)
        .select();
      if (error) {
        console.error("[Profile] Save failed:", error);
        return;
      }

      await fetch("/api/revalidate?tag=restaurant", { method: "POST" });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      console.error("[Profile] Unexpected error:", e);
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveTheme(theme: string) {
    setThemeSaving(true);
    try {
      await supabaseRef.current
        .from("restaurants")
        .update({ theme })
        .eq("id", restaurant.id);
      setSelectedTheme(theme);
      // Revalidate customer page cache
      await fetch("/api/revalidate?tag=restaurant");
    } catch (err) {
      console.error("Theme save failed:", err);
    } finally {
      setThemeSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadMenuImage(
        file,
        restaurant.id,
        supabaseRef.current,
      );
      if (url) {
        await supabaseRef.current
          .from("restaurants")
          .update({ logo_url: url })
          .eq("id", restaurant.id);
        setLogoUrl(url);
        await fetch("/api/revalidate?tag=restaurant", { method: "POST" });
      }
    } catch (e) {
      console.error("Logo upload failed:", e);
    } finally {
      setLogoUploading(false);
    }
  }

  async function savePromo() {
    if (!promoForm.title || !promoForm.start_date || !promoForm.end_date)
      return;
    setPromoSaving(true);
    try {
      await supabaseRef.current.from("restaurant_promos").insert({
        restaurant_id: restaurant.id,
        title: promoForm.title,
        description: promoForm.description,
        start_date: promoForm.start_date,
        end_date: promoForm.end_date,
        image_url: promoForm.image_url || null,
        is_active: true,
      });
      setPromoForm({
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        image_url: "",
      });
      await fetchPromos();
    } finally {
      setPromoSaving(false);
    }
  }

  async function deletePromo(id: string) {
    await supabaseRef.current.from("restaurant_promos").delete().eq("id", id);
    await fetchPromos();
  }

  async function handleBannerUpload(file: File) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return; // pre-compression guard
    setPromoBannerUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 800);
      const safeName = `${restaurant.id}/${Date.now()}.webp`;
      const { error } = await supabaseRef.current.storage
        .from("promo-banners")
        .upload(safeName, compressed, {
          contentType: "image/webp",
          upsert: true,
        });
      if (error) throw error;
      const { data: urlData } = supabaseRef.current.storage
        .from("promo-banners")
        .getPublicUrl(safeName);
      setPromoForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (err) {
      console.error("Banner upload failed:", err);
    } finally {
      setPromoBannerUploading(false);
    }
  }

  async function updateStaffName(id: string, name: string) {
    await supabaseRef.current
      .from("restaurant_staff")
      .update({ display_name: name })
      .eq("id", id);
    await fetchStaff();
  }

  async function addStaff() {
    if (!newStaffName.trim()) return;
    setStaffSaving(true);
    try {
      await supabaseRef.current.from("restaurant_staff").insert({
        restaurant_id: restaurant.id,
        display_name: newStaffName.trim(),
        role: "waiter",
        user_id: null,
      });
      setNewStaffName("");
      await fetchStaff();
    } finally {
      setStaffSaving(false);
    }
  }

  async function deleteStaff(id: string) {
    setStaffDeleting(id);
    try {
      await supabaseRef.current.from("restaurant_staff").delete().eq("id", id);
      await fetchStaff();
    } finally {
      setStaffDeleting(null);
    }
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
      color: "var(--theme-info)",
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
      color: "var(--theme-success)",
    },
  ];

  // Styles for the Menu Manager button in the 'menu' tab
  const menuManagerButtonStyle: React.CSSProperties = {
    width: "100%",
    marginBottom: 24,
    background: "var(--surface)",
    border: "1px solid rgba(253,251,247,0.08)",
    boxShadow: "var(--shadow-card)",
    textAlign: "left",
    padding: "18px 16px",
    borderRadius: 18,
    transition: "all 0.2s ease",
  };

  const menuManagerIconContainerStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "var(--gold-faint)",
    border: "1px solid var(--gold-dim)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--gold-glow)",
    marginBottom: 12,
  };

  const menuManagerTitleStyle: React.CSSProperties = {
    fontSize: 14,
    marginBottom: 4,
  };
  const menuManagerDescStyle: React.CSSProperties = {
    fontSize: 12,
    opacity: 0.7,
  };

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

      {/* Suspension banner */}
      {!restaurant.is_active && (
        <div
          style={{
            background:
              "color-mix(in srgb, var(--theme-danger) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--theme-danger) 30%, transparent)",
            borderRadius: 16,
            padding: "16px 20px",
            margin: "16px 16px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p
              style={{
                color: "var(--theme-danger)",
                fontWeight: 700,
                fontSize: 14,
                marginBottom: 2,
              }}
            >
              Restaurant Suspended
            </p>
            <p
              style={{
                color:
                  "color-mix(in srgb, var(--theme-danger) 60%, transparent)",
                fontSize: 12,
              }}
            >
              This restaurant is currently suspended. Customers cannot access
              the menu until the outstanding balance is settled.
            </p>
          </div>
        </div>
      )}
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
          padding: "12px 20px",
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
            {
              id: "analytics",
              label: "Analytics",
              icon: <BarChart2 size={16} />,
            },
            {
              id: "settlements",
              label: "Settlement History",
              icon: <DollarSign size={16} />,
            },
            {
              id: "profile",
              label: "Profile",
              icon: <Users2 size={16} />,
            },
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
              color: tab === t.id ? "var(--theme-contrast)" : "var(--cream-35)",
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
                    {card.up && (
                      <ArrowUpRight size={16} color="var(--theme-success)" />
                    )}
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
                    border: `1px solid ${action.badgeUrgent ? "var(--gold-dim)" : "var(--cream-06)"}`,
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
                      value: `${restaurant.currency} ${Number(todayLedger?.session_fees_collected ?? 0).toFixed(2)}`,
                    },
                    {
                      label: "NovaNode fee owed",
                      value: `${restaurant.currency} ${Number(todayLedger.total_owed ?? 0).toFixed(2)}`,
                    },
                    {
                      label: "NovaNode fee settled",
                      value: `${restaurant.currency} ${Number(todayLedger?.platform_fees_paid ?? 0).toFixed(2)}`,
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
                          <CheckCircle size={14} color="var(--theme-success)" />
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
                  {peakHours.map((h, i) => {
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
                      <div key={`${hour}-${i}`} className="peak-cell">
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
            <button
              onClick={() => router.push(`/dashboard/${restaurant.slug}/menu`)}
              className="dash-action-card group"
              style={menuManagerButtonStyle}
            >
              <div
                className="dash-action-icon"
                style={menuManagerIconContainerStyle}
              >
                🍽️
              </div>
              <div>
                <div
                  className="dash-action-title"
                  style={menuManagerTitleStyle}
                >
                  Menu Manager
                </div>
                <div className="dash-action-desc" style={menuManagerDescStyle}>
                  Add, edit and manage your full menu
                </div>
              </div>
            </button>

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
              {baseUrl && (
                <QRGenerator restaurant={restaurant} baseUrl={baseUrl} />
              )}
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && (
          <div className="px-3 pt-5 space-y-6 pb-24 max-w-7xl mx-auto">
            {analyticsLoading && (
              <div className="text-center text-amber-300/60 py-12 text-sm font-medium">
                Loading business intelligence data...
              </div>
            )}

            {!analyticsLoading && analyticsData && (
              <div className="space-y-6">
                {/* Visual Chart Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Card */}
                  <div
                    className="rounded-2xl p-6 transition-all border shadow-lg"
                    style={{
                      backgroundColor:
                        "var(--theme-surface, rgba(15, 15, 15, 0.6))",
                      borderColor:
                        "color-mix(in srgb, var(--theme-border, #ffd700) 15%, transparent)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div className="flex flex-col mb-4">
                      <span className="text-[10px] tracking-widest uppercase text-amber-300/40 font-bold mb-1">
                        REVENUE —{" "}
                        {new Date().toLocaleDateString("en-GB", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <h2
                        className="text-3xl md:text-4xl font-black text-amber-500"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        GHS{" "}
                        {analyticsData.daily
                          .reduce((s, d) => s + d.revenue, 0)
                          .toFixed(2)}
                      </h2>
                    </div>

                    {/* Integrated Tap-Friendly Chart */}
                    <div className="relative h-44 mt-6 overflow-x-auto scrollbar-hide">
                      <div className="absolute inset-0 flex items-end gap-1 pb-1">
                        {analyticsData.daily.map((d) => {
                          const maxRev = Math.max(
                            ...analyticsData.daily.map((x) => x.revenue),
                            1,
                          );
                          const heightPct = Math.max(
                            (d.revenue / maxRev) * 100,
                            4,
                          );
                          const dateLabel = new Date(
                            d.date + "T12:00:00",
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                          return (
                            <div
                              key={d.date}
                              className="flex-1 min-w-[28px] h-full flex flex-col justify-end items-center group cursor-pointer transition-all px-0.5 rounded-lg hover:bg-amber-500/5"
                              title={`${dateLabel}: GHS ${d.revenue.toFixed(2)}`}
                            >
                              <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-all bg-black/90 text-[10px] text-amber-400 py-1 px-2 rounded-md font-mono whitespace-nowrap z-20 pointer-events-none border border-amber-900/20">
                                GHS {d.revenue.toFixed(2)}
                              </div>
                              <div
                                className="w-full rounded-t-md transition-all group-hover:bg-amber-400"
                                style={{
                                  height: `${heightPct}%`,
                                  backgroundColor:
                                    d.revenue > 0
                                      ? "var(--gold-glow, #D97706)"
                                      : "rgba(217, 119, 6, 0.1)",
                                }}
                              />
                              <span className="text-[9px] text-amber-300/30 mt-2 font-mono group-hover:text-amber-300/70">
                                {new Date(d.date + "T12:00:00").getDate()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-amber-300/20 mt-2 px-1 border-b border-amber-900/10 pb-4">
                      <span>1st of Month</span>
                      <span>Today</span>
                    </div>

                    {/* Aligned Breakdown Table */}
                    <div className="mt-5 space-y-1">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-amber-300/30 font-bold px-2 pb-2 border-b border-amber-900/10">
                        <span>Day</span>
                        <div className="flex gap-8">
                          <span>Orders</span>
                          <span>Revenue</span>
                        </div>
                      </div>
                      {(showAllRevDays
                        ? analyticsData.daily
                        : analyticsData.daily
                            .filter((d) => d.revenue > 0 || d.orders > 0)
                            .slice(-7)
                      ).map((d) => (
                        <div
                          key={d.date}
                          className="flex justify-between items-center px-2 py-2.5 rounded-lg transition-all hover:bg-amber-500/5 group"
                        >
                          <span className="text-amber-300/60 text-xs font-semibold">
                            {new Date(d.date + "T12:00:00").toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                          <div className="flex gap-8 items-center">
                            <span className="text-emerald-400 text-xs w-12 text-right font-bold">
                              {d.orders}
                            </span>
                            <span
                              className="text-amber-400 text-xs w-24 text-right font-mono font-bold"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              GHS {d.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {analyticsData.daily.every((d) => d.revenue === 0) && (
                        <p className="text-amber-300/20 text-xs text-center py-4 italic">
                          No revenue activity recorded this month
                        </p>
                      )}
                    </div>
                    {analyticsData.daily.filter((d) => d.revenue > 0).length >
                      7 && (
                      <button
                        type="button"
                        onClick={() => setShowAllRevDays((p) => !p)}
                        className="w-full text-center text-amber-400/50 hover:text-amber-400 text-xs py-3 transition-colors mt-2 font-bold tracking-wide"
                      >
                        {showAllRevDays
                          ? "▲ Show less"
                          : `▼ Show all ${analyticsData.daily.filter((d) => d.revenue > 0).length} active days`}
                      </button>
                    )}
                  </div>

                  {/* Orders Card */}
                  <div
                    className="rounded-2xl p-6 transition-all border shadow-lg"
                    style={{
                      backgroundColor:
                        "var(--theme-surface, rgba(15, 15, 15, 0.6))",
                      borderColor:
                        "color-mix(in srgb, var(--theme-border, #ffd700) 15%, transparent)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <div className="flex flex-col mb-4">
                      <span className="text-[10px] tracking-widest uppercase text-emerald-300/40 font-bold mb-1">
                        ORDERS —{" "}
                        {new Date().toLocaleDateString("en-GB", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <h2
                        className="text-3xl md:text-4xl font-black text-emerald-400"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {analyticsData.daily.reduce((s, d) => s + d.orders, 0)}{" "}
                        <span className="text-sm font-semibold text-emerald-300/30 tracking-wider uppercase">
                          total
                        </span>
                      </h2>
                    </div>

                    {/* Integrated Tap-Friendly Chart */}
                    <div className="relative h-44 mt-6 overflow-x-auto scrollbar-hide">
                      <div className="absolute inset-0 flex items-end gap-1 pb-1">
                        {analyticsData.daily.map((d) => {
                          const maxOrd = Math.max(
                            ...analyticsData.daily.map((x) => x.orders),
                            1,
                          );
                          const heightPct = Math.max(
                            (d.orders / maxOrd) * 100,
                            4,
                          );
                          const dateLabel = new Date(
                            d.date + "T12:00:00",
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                          return (
                            <div
                              key={d.date}
                              className="flex-1 min-w-[28px] h-full flex flex-col justify-end items-center group cursor-pointer transition-all px-0.5 rounded-lg hover:bg-emerald-500/5"
                              title={`${dateLabel}: ${d.orders} orders`}
                            >
                              <div className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-all bg-black/90 text-[10px] text-emerald-400 py-1 px-2 rounded-md font-mono whitespace-nowrap z-20 pointer-events-none border border-emerald-950/20">
                                {d.orders} orders
                              </div>
                              <div
                                className="w-full rounded-t-md transition-all group-hover:bg-emerald-400"
                                style={{
                                  height: `${heightPct}%`,
                                  backgroundColor:
                                    d.orders > 0
                                      ? "#10b981"
                                      : "rgba(16, 185, 129, 0.1)",
                                }}
                              />
                              <span className="text-[9px] text-emerald-300/30 mt-2 font-mono group-hover:text-emerald-300/70">
                                {new Date(d.date + "T12:00:00").getDate()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-emerald-300/20 mt-2 px-1 border-b border-emerald-900/10 pb-4">
                      <span>1st of Month</span>
                      <span>Today</span>
                    </div>

                    {/* Aligned Breakdown Table */}
                    <div className="mt-5 space-y-1">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-amber-300/30 font-bold px-2 pb-2 border-b border-amber-900/10">
                        <span>Day</span>
                        <div className="flex gap-8">
                          <span>Orders</span>
                          <span>Revenue</span>
                        </div>
                      </div>
                      {(showAllOrdDays
                        ? analyticsData.daily
                        : analyticsData.daily
                            .filter((d) => d.revenue > 0 || d.orders > 0)
                            .slice(-7)
                      ).map((d) => (
                        <div
                          key={d.date}
                          className="flex justify-between items-center px-2 py-2.5 rounded-lg transition-all hover:bg-emerald-500/5 group"
                        >
                          <span className="text-amber-300/60 text-xs font-semibold">
                            {new Date(d.date + "T12:00:00").toLocaleDateString(
                              "en-GB",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                          <div className="flex gap-8 items-center">
                            <span className="text-emerald-400 text-xs w-12 text-right font-bold">
                              {d.orders}
                            </span>
                            <span
                              className="text-amber-400 text-xs w-24 text-right font-mono font-bold"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              GHS {d.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {analyticsData.daily.every((d) => d.orders === 0) && (
                        <p className="text-amber-300/20 text-xs text-center py-4 italic">
                          No ordering activity recorded this month
                        </p>
                      )}
                    </div>
                    {analyticsData.daily.filter((d) => d.orders > 0).length >
                      7 && (
                      <button
                        type="button"
                        onClick={() => setShowAllOrdDays((p) => !p)}
                        className="w-full text-center text-emerald-400/50 hover:text-emerald-400 text-xs py-3 transition-colors mt-2 font-bold tracking-wide"
                      >
                        {showAllOrdDays
                          ? "▲ Show less"
                          : `▼ Show all ${analyticsData.daily.filter((d) => d.orders > 0).length} active days`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Monthly History Section */}
                {(analyticsData.monthly ?? []).length > 0 && (
                  <div
                    className="rounded-2xl p-6 border shadow-lg"
                    style={{
                      backgroundColor:
                        "var(--theme-surface, rgba(15, 15, 15, 0.6))",
                      borderColor:
                        "color-mix(in srgb, var(--theme-border, #ffd700) 15%, transparent)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    <span className="text-[10px] tracking-widest uppercase text-amber-300/40 font-bold block mb-4">
                      ARCHIVE PERFORMANCE
                    </span>
                    <h3 className="text-amber-200 font-bold text-lg mb-4">
                      Monthly History
                    </h3>
                    <div className="space-y-3">
                      {(analyticsData.monthly ?? []).map((m) => {
                        const [year, month] = m.month.split("-");
                        const label = new Date(
                          parseInt(year),
                          parseInt(month) - 1,
                          1,
                        ).toLocaleDateString("en-GB", {
                          month: "long",
                          year: "numeric",
                        });
                        return (
                          <div
                            key={m.month}
                            className="flex items-center justify-between rounded-xl px-5 py-4 border transition-all hover:bg-amber-500/[0.02]"
                            style={{
                              backgroundColor: "rgba(0,0,0,0.25)",
                              borderColor: "rgba(217, 119, 6, 0.1)",
                            }}
                          >
                            <span className="text-neutral-200 text-sm font-semibold">
                              {label}
                            </span>
                            <div className="flex gap-6 items-center">
                              <span className="text-emerald-400/70 text-xs font-mono font-bold bg-emerald-400/5 px-2 py-1 rounded">
                                {m.orders} orders
                              </span>
                              <span
                                className="text-amber-400 text-base font-black font-mono"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                              >
                                GHS {m.revenue.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customer Feedback section */}
                <div
                  className="rounded-2xl p-6 border shadow-lg"
                  style={{
                    backgroundColor:
                      "var(--theme-surface, rgba(15, 15, 15, 0.6))",
                    borderColor:
                      "color-mix(in srgb, var(--theme-border, #ffd700) 15%, transparent)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] tracking-widest uppercase text-amber-300/40 font-bold mb-1">
                        REVIEWS & FEEDBACK
                      </span>
                      <h3 className="text-amber-200 font-bold text-lg">
                        Recent Customer Reviews
                      </h3>
                    </div>
                    <span className="text-amber-300/70 text-xs bg-amber-300/10 px-3 py-1.5 rounded-xl font-bold border border-amber-950/20">
                      {analyticsData.feedback.length} reviews
                    </span>
                  </div>

                  {analyticsData.feedback.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-amber-300/30 text-sm">
                        No reviews yet
                      </p>
                      <p className="text-amber-300/20 text-xs mt-1.5">
                        Customer feedback will appear here after meals
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {analyticsData.feedback.map((f, i) => (
                        <div
                          key={i}
                          className="flex flex-col justify-between transition-all hover:translate-y-[-2px]"
                          style={{
                            backgroundColor: "rgba(0, 0, 0, 0.25)",
                            border: "1px solid rgba(217, 119, 6, 0.12)",
                            borderRadius: 20,
                            padding: "20px 22px",
                          }}
                        >
                          {/* Header row — author details and stars */}
                          <div className="flex justify-between items-start mb-4 gap-3">
                            <div>
                              <p className="text-neutral-100 font-bold text-base mb-0.5">
                                {f.customer_name}
                              </p>
                              <p className="text-amber-300/40 text-xs font-mono font-bold">
                                {new Date(f.created_at).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                            <div className="flex gap-1 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className="text-sm leading-none transition-colors"
                                  style={{
                                    color:
                                      star <= f.rating
                                        ? "var(--gold-glow, #D97706)"
                                        : "rgba(217, 119, 6, 0.15)",
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Review Content */}
                          {f.review && (
                            <p className="text-neutral-300/80 text-sm leading-relaxed mb-4 italic font-medium">
                              &ldquo;{f.review}&rdquo;
                            </p>
                          )}

                          {/* Served by Waiter attribution */}
                          {f.staff_name && (
                            <div className="mt-auto pt-3 border-t border-amber-900/10 flex items-center gap-1.5">
                              <span className="text-[10px] uppercase tracking-wider text-amber-500/50 font-bold">
                                Served by:
                              </span>
                              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-md">
                                {f.staff_name}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SETTLEMENT HISTORY TAB ── */}
        {tab === "settlements" && (
          <div>
            <div className="dash-section">
              <div className="dash-section-head">
                <DollarSign size={17} color="var(--gold-glow)" />
                <span className="t-title" style={{ fontSize: 15 }}>
                  Settlement History
                </span>
              </div>

              {settlementsLoading && (
                <div className="dash-empty">Loading settlement history...</div>
              )}

              {!settlementsLoading && settlementsError && (
                <div className="dash-empty">{settlementsError}</div>
              )}

              {!settlementsLoading &&
                !settlementsError &&
                settlementRows.length === 0 && (
                  <div className="dash-empty">
                    No settlement history recorded yet
                  </div>
                )}

              {!settlementsLoading &&
                !settlementsError &&
                settlementRows.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {settlementRows.map((ledger) => {
                      const ledgerDate = ledger.ledger_date ?? "";
                      const isExpanded = expandedLedgerDate === ledgerDate;
                      const sessions = settlementSessions[ledgerDate] ?? [];
                      const sessionsLoading =
                        settlementSessionsLoading[ledgerDate] ?? false;

                      return (
                        <div
                          key={ledger.id ?? ledgerDate}
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--cream-06)",
                            borderRadius: 14,
                            overflow: "hidden",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleLedgerDate(ledgerDate)}
                            style={{
                              width: "100%",
                              minHeight: 64,
                              display: "grid",
                              gridTemplateColumns: "1fr auto",
                              gap: 12,
                              alignItems: "center",
                              padding: "14px 16px",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <p
                                className="t-title"
                                style={{ fontSize: 14, marginBottom: 6 }}
                              >
                                {formatLedgerDate(ledgerDate)}
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 8,
                                  alignItems: "center",
                                }}
                              >
                                <span className="t-caption">
                                  {ledger.completed_sessions ?? 0} completed
                                  sessions
                                </span>
                                <span
                                  className={
                                    ledger.is_paid
                                      ? "status-done"
                                      : "status-pending"
                                  }
                                >
                                  {ledger.is_paid ? "Paid" : "Unpaid"}
                                </span>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p
                                className="t-price-sm"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                              >
                                {restaurant.currency}{" "}
                                {Number(ledger.total_owed ?? 0).toFixed(2)}
                              </p>
                              <p className="t-caption" style={{ marginTop: 4 }}>
                                {isExpanded ? "Hide" : "View"} sessions
                              </p>
                            </div>
                          </button>

                          {isExpanded && (
                            <div
                              style={{
                                borderTop: "1px solid var(--cream-06)",
                                padding: "12px 16px 16px",
                              }}
                            >
                              {sessionsLoading ? (
                                <div className="dash-empty">
                                  Loading sessions...
                                </div>
                              ) : sessions.length === 0 ? (
                                <div className="dash-empty">
                                  No completed sessions found for this day
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 10,
                                  }}
                                >
                                  {sessions.map((session) => (
                                    <div
                                      key={session.id}
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr auto",
                                        gap: 12,
                                        alignItems: "center",
                                        padding: "12px 14px",
                                        background: "var(--cream-06)",
                                        border:
                                          "1px solid var(--cream-15)",
                                        borderRadius: 12,
                                      }}
                                    >
                                      <div style={{ minWidth: 0 }}>
                                        <p
                                          className="t-title"
                                          style={{
                                            fontSize: 13,
                                            marginBottom: 4,
                                          }}
                                        >
                                          Table {session.table_number}
                                        </p>
                                        <p className="t-caption">
                                          Closed{" "}
                                          {formatSessionTime(
                                            session.closed_at,
                                          )}
                                        </p>
                                      </div>
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 4,
                                          textAlign: "right",
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        <span className="t-price-sm">
                                          {restaurant.currency}{" "}
                                          {Number(
                                            session.session_total ?? 0,
                                          ).toFixed(2)}
                                        </span>
                                        <span
                                          className="t-caption"
                                          style={{ color: "var(--gold-glow)" }}
                                        >
                                          Fee {restaurant.currency}{" "}
                                          {Number(
                                            session.platform_fee_charged ?? 0,
                                          ).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div className="px-4 pt-5 space-y-6 pb-24">
            {/* Restaurant Info */}
            <div
              className="rounded-2xl overflow-hidden border border-amber-900/20 shadow-xl"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--theme-bg) 60%, transparent)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Header */}
              <div style={{ padding: "20px 20px 0" }}>
                <h3
                  style={{
                    color: "#D97706",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 20,
                  }}
                >
                  Restaurant Info
                </h3>
              </div>

              {/* Logo Upload — centered hero */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  paddingBottom: 24,
                  borderBottom: "1px solid rgba(217,119,6,0.1)",
                }}
              >
                <label style={{ cursor: "pointer", position: "relative" }}>
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(217,119,6,0.4)",
                      backgroundColor: "rgba(0,0,0,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 0 4px rgba(217,119,6,0.08)",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Camera size={28} color="rgba(217,119,6,0.4)" />
                    )}
                  </div>
                  {/* Upload overlay */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "#D97706",
                      border: "2px solid #022c22",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Upload size={13} color="#022c22" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p
                  style={{
                    color: "rgba(217,119,6,0.5)",
                    fontSize: 11,
                    marginTop: 10,
                    letterSpacing: "0.06em",
                  }}
                >
                  {logoUploading ? "Uploading..." : "Tap to change logo"}
                </p>
              </div>

              {/* Fields */}
              <div style={{ padding: "20px 20px 0" }}>
                {/* Restaurant Name */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(253,251,247,0.45)",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Restaurant name
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Starbite Kitchen"
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(217,119,6,0.15)",
                      borderRadius: 14,
                      padding: "13px 16px",
                      color: "#FDFBF7",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(253,251,247,0.45)",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Description / tagline
                  </label>
                  <textarea
                    value={profileForm.description}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="A short description for your customers..."
                    rows={2}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(217,119,6,0.15)",
                      borderRadius: 14,
                      padding: "13px 16px",
                      color: "#FDFBF7",
                      fontSize: 15,
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Contact */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(253,251,247,0.45)",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Contact number
                  </label>
                  <input
                    type="tel"
                    value={profileForm.contact_number}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        contact_number: e.target.value,
                      }))
                    }
                    placeholder="+233 XX XXX XXXX"
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(217,119,6,0.15)",
                      borderRadius: 14,
                      padding: "13px 16px",
                      color: "#FDFBF7",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Address */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(253,251,247,0.45)",
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 6,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="e.g. 12 High Street, Accra"
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(217,119,6,0.15)",
                      borderRadius: 14,
                      padding: "13px 16px",
                      color: "#FDFBF7",
                      fontSize: 15,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Opening & Closing Time — side by side */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(253,251,247,0.45)",
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 6,
                        letterSpacing: "0.04em",
                      }}
                    >
                      Opens
                    </label>
                    <input
                      type="time"
                      value={profileForm.opening_time}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          opening_time: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(0,0,0,0.25)",
                        border: "1px solid rgba(217,119,6,0.15)",
                        borderRadius: 14,
                        padding: "13px 12px",
                        color: "#FDFBF7",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(253,251,247,0.45)",
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 6,
                        letterSpacing: "0.04em",
                      }}
                    >
                      Closes
                    </label>
                    <input
                      type="time"
                      value={profileForm.closing_time}
                      onChange={(e) =>
                        setProfileForm((p) => ({
                          ...p,
                          closing_time: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        backgroundColor: "rgba(0,0,0,0.25)",
                        border: "1px solid rgba(217,119,6,0.15)",
                        borderRadius: 14,
                        padding: "13px 12px",
                        color: "#FDFBF7",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Save button */}
              <div style={{ padding: "0 20px 20px" }}>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="w-full active:scale-95 disabled:opacity-50 transition-all"
                  style={{
                    padding: "15px",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    backgroundColor: "#D97706",
                    color: "#022c22",
                    border: "none",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  {profileSaved
                    ? "✓ Saved!"
                    : profileSaving
                      ? "Saving..."
                      : "Save Profile"}
                </button>
              </div>
            </div>

            {/* Staff Management */}
            <div
              className="rounded-2xl border border-amber-900/20 overflow-hidden"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--theme-bg) 60%, transparent)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ padding: 20 }}>
                <h3
                  style={{
                    color: "#D97706",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  WAITERS
                </h3>
              </div>

              {/* Existing waiters */}
              <div>
                {staffList.length === 0 && (
                  <p
                    className="text-amber-300/30 text-xs text-center"
                    style={{ padding: "0 20px 20px" }}
                  >
                    No waiters added yet
                  </p>
                )}
                {staffList.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(217,119,6,0.08)",
                      minWidth: 0,
                    }}
                  >
                    <input
                      type="text"
                      defaultValue={s.display_name ?? ""}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) =>
                        updateStaffName(s.id, e.target.value)
                      }
                      style={{
                        flex: 1,
                        minWidth: 0,
                        backgroundColor: "transparent",
                        border: "none",
                        padding: 0,
                        color: "#FDFBF7",
                        fontSize: 14,
                        fontWeight: 600,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => deleteStaff(s.id)}
                      disabled={staffDeleting === s.id}
                      className="disabled:opacity-30"
                      style={{
                        color: "rgba(239,68,68,0.6)",
                        background: "none",
                        border: "none",
                        padding: 0,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {staffDeleting === s.id ? "..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new waiter */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: 20,
                  width: "100%",
                  overflow: "hidden",
                }}
              >
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addStaff();
                  }}
                  placeholder="Waiter name e.g. Kofi"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(217,119,6,0.15)",
                    borderRadius: 14,
                    padding: "10px 14px",
                    color: "#FDFBF7",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={addStaff}
                  disabled={staffSaving || !newStaffName.trim()}
                  className="transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: "#D97706",
                    color: "#022c22",
                    border: "none",
                    borderRadius: 20,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {staffSaving ? "..." : "+ Add"}
                </button>
              </div>
            </div>

            {/* Promos */}
            <div
              className="rounded-2xl border border-amber-900/20 overflow-hidden"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--theme-bg) 60%, transparent)",
                backdropFilter: "blur(10px)",
                marginTop: 16,
              }}
            >
              <div style={{ padding: 20 }}>
                <h3
                  style={{
                    color: "#D97706",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  PROMOTIONS
                </h3>
                <p
                  style={{
                    color: "rgba(253,251,247,0.5)",
                    fontSize: 12,
                    marginBottom: 20,
                  }}
                >
                  Active promos cycle with your restaurant info on the customer
                  menu page
                </p>

                {/* Promo form */}
                <div className="space-y-3">
                  {/* Banner upload */}
                  <div>
                    {promoForm.image_url ? (
                      <div
                        className="relative rounded-xl overflow-hidden"
                        style={{ height: 72 }}
                      >
                        <img
                          src={promoForm.image_url}
                          alt="Promo banner preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPromoForm((prev) => ({ ...prev, image_url: "" }))
                          }
                          className="absolute top-2 right-2 text-xs px-3 py-1 rounded-lg font-medium"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.7)",
                            color: "#FDFBF7",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label
                        className="flex flex-col items-center justify-center w-full rounded-xl border border-dashed cursor-pointer transition-colors"
                        style={{
                          height: "72px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(0,0,0,0.2)",
                          borderColor: promoBannerUploading
                            ? "rgba(217,119,6,0.6)"
                            : "rgba(217,119,6,0.25)",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(253,251,247,0.65)",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {promoBannerUploading
                            ? "Uploading..."
                            : "＋ Upload banner image"}
                        </span>
                        <span
                          style={{
                            color: "rgba(253,251,247,0.25)",
                            fontSize: 10,
                            marginTop: 4,
                          }}
                        >
                          JPG, PNG, WEBP · max 5MB
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={promoBannerUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) await handleBannerUpload(file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Title */}
                  <input
                    type="text"
                    value={promoForm.title}
                    onChange={(e) =>
                      setPromoForm((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="Promo title e.g. Happy Hour 50% Off"
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(217,119,6,0.15)",
                      borderRadius: 14,
                      padding: "12px 16px",
                      color: "#FDFBF7",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                  {/* Description */}
                  <textarea
                    value={promoForm.description}
                    onChange={(e) =>
                      setPromoForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Promo details..."
                    rows={2}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      border: "1px solid rgba(217,119,6,0.15)",
                      borderRadius: 14,
                      padding: "12px 16px",
                      color: "#FDFBF7",
                      fontSize: 14,
                      outline: "none",
                      resize: "none",
                      boxSizing: "border-box",
                    }}
                  />

                  {/* Date range */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          color: "rgba(253,251,247,0.45)",
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 6,
                          letterSpacing: "0.04em",
                        }}
                      >
                        Start
                      </label>
                      <input
                        type="datetime-local"
                        value={promoForm.start_date}
                        onChange={(e) =>
                          setPromoForm((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          backgroundColor: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(217,119,6,0.15)",
                          borderRadius: 14,
                          padding: 12,
                          color: "#FDFBF7",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box",
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          color: "rgba(253,251,247,0.45)",
                          fontSize: 11,
                          fontWeight: 600,
                          marginBottom: 6,
                          letterSpacing: "0.04em",
                        }}
                      >
                        End
                      </label>
                      <input
                        type="datetime-local"
                        value={promoForm.end_date}
                        onChange={(e) =>
                          setPromoForm((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                        style={{
                          width: "100%",
                          backgroundColor: "rgba(0,0,0,0.25)",
                          border: "1px solid rgba(217,119,6,0.15)",
                          borderRadius: 14,
                          padding: 12,
                          color: "#FDFBF7",
                          fontSize: 14,
                          outline: "none",
                          boxSizing: "border-box",
                          colorScheme: "dark",
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={savePromo}
                    disabled={
                      promoSaving ||
                      promoBannerUploading ||
                      !promoForm.title ||
                      !promoForm.start_date ||
                      !promoForm.end_date
                    }
                    className="w-full transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: "#D97706",
                      color: "#022c22",
                      border: "none",
                      borderRadius: 14,
                      padding: 15,
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {promoSaving ? "Saving..." : "+ Add Promo"}
                  </button>
                </div>

                {/* Promo list */}
                <div className="space-y-3" style={{ marginTop: 20 }}>
                  {promos.map((p) => {
                    const now = new Date();
                    const isLive =
                      new Date(p.start_date) <= now &&
                      new Date(p.end_date) >= now;
                    const isExpired = new Date(p.end_date) < now;
                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-amber-900/20 flex items-start justify-between gap-3"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.2)",
                          padding: 12,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            className="flex items-center gap-2 mb-1"
                            style={{ flexWrap: "wrap" }}
                          >
                            <span
                              style={{
                                color: "#FDFBF7",
                                fontSize: 14,
                                fontWeight: 700,
                              }}
                            >
                              {p.title}
                            </span>
                            {isLive && (
                              <span
                                style={{
                                  color: "#34d399",
                                  backgroundColor: "rgba(16,185,129,0.14)",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                }}
                              >
                                Live
                              </span>
                            )}
                            {isExpired && (
                              <span
                                style={{
                                  color: "#f87171",
                                  backgroundColor: "rgba(239,68,68,0.14)",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                }}
                              >
                                Expired
                              </span>
                            )}
                          </div>
                          {p.description && (
                            <p
                              style={{
                                color: "rgba(253,251,247,0.45)",
                                fontSize: 12,
                                marginBottom: 4,
                              }}
                            >
                              {p.description}
                            </p>
                          )}
                          <p
                            style={{
                              color: "rgba(217,119,6,0.45)",
                              fontSize: 11,
                            }}
                          >
                            {new Date(p.start_date).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}{" "}
                            →{" "}
                            {new Date(p.end_date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deletePromo(p.id)}
                          className="transition-colors"
                          style={{
                            color: "rgba(239,68,68,0.6)",
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    );
                  })}
                  {promos.length === 0 && (
                    <p
                      className="text-amber-300/30 text-xs text-center"
                      style={{ padding: "4px 0" }}
                    >
                      No promos yet
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Theme Switcher */}
            <div
              className="rounded-2xl overflow-hidden border border-amber-900/20"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--theme-bg) 60%, transparent)",
                backdropFilter: "blur(10px)",
                marginTop: 16,
              }}
            >
              <div style={{ padding: "20px 20px 0" }}>
                <h3
                  style={{
                    color: "#D97706",
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Restaurant Theme
                </h3>
                <p
                  style={{
                    color: "rgba(253,251,247,0.4)",
                    fontSize: 12,
                    marginBottom: 20,
                  }}
                >
                  Choose a theme for your customer menu page, dashboard and KDS.
                </p>
              </div>
              <div
                style={{
                  padding: "0 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  {
                    id: "default",
                    name: "Obsidian & Gold",
                    description: "Classic dark luxury",
                    accent: "#D97706",
                    bg: "#022c22",
                  },
                  {
                    id: "carbon-lime",
                    name: "Carbon & Lime",
                    description: "Underground street food",
                    accent: "#a3e635",
                    bg: "#0a0a0a",
                  },
                  {
                    id: "midnight-coral",
                    name: "Midnight & Coral",
                    description: "Coastal seafood vibes",
                    accent: "#ff6b6b",
                    bg: "#0d1b2a",
                  },
                  {
                    id: "parchment-espresso",
                    name: "Parchment & Espresso",
                    description: "Warm artisan bistro",
                    accent: "#c17f3a",
                    bg: "#1a0f0a",
                  },
                  {
                    id: "ember-crimson",
                    name: "Ember & Crimson",
                    description: "Bold BBQ steakhouse",
                    accent: "#dc2626",
                    bg: "#0f0a0a",
                  },
                  {
                    id: "obsidian-rose",
                    name: "Obsidian & Rose",
                    description: "Feminine dessert luxury",
                    accent: "#f43f5e",
                    bg: "#0d0a0e",
                  },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => saveTheme(theme.id)}
                    disabled={themeSaving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      borderRadius: 14,
                      border:
                        selectedTheme === theme.id
                          ? `2px solid ${theme.accent}`
                          : "1px solid rgba(255,255,255,0.08)",
                      backgroundColor:
                        selectedTheme === theme.id
                          ? `${theme.bg}99`
                          : "rgba(0,0,0,0.2)",
                      cursor: themeSaving ? "wait" : "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    {/* Color preview */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: theme.bg,
                        border: `2px solid ${theme.accent}`,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          backgroundColor: theme.accent,
                        }}
                      />
                    </div>
                    {/* Theme info */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          color: "#FDFBF7",
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 2,
                        }}
                      >
                        {theme.name}
                      </p>
                      <p
                        style={{ color: "rgba(253,251,247,0.4)", fontSize: 11 }}
                      >
                        {theme.description}
                      </p>
                    </div>
                    {/* Active indicator */}
                    {selectedTheme === theme.id && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: theme.accent,
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                ))}
                {themeSaving && (
                  <p
                    style={{
                      color: "rgba(253,251,247,0.3)",
                      fontSize: 11,
                      textAlign: "center",
                    }}
                  >
                    Applying theme...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
