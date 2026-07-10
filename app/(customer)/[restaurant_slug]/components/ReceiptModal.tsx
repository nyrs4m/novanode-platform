"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/types/database.types";
import {
  X,
  Download,
  Share2,
  Star,
  ChevronRight,
  Check,
  Loader2,
  Receipt,
} from "lucide-react";

type Restaurant = Tables<"restaurants">;

interface StaffMember {
  id: string;
  display_name: string | null;
  role: string | null;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  modifiers?: {
    option: string;
    price: number;
  }[];
  modifierTotal?: number;
  specialInstructions?: string;
}

interface ReceiptOrder {
  items: OrderItem[];
  total_amount: number;
  is_starter_order: boolean | null;
}

interface ReceiptModalProps {
  restaurant: Restaurant;
  sessionToken: string;
  tableNumber: string;
  customerName: string;
  orders: ReceiptOrder[];
  staff: StaffMember[];
  onClose: () => void;
}

export default function ReceiptModal({
  restaurant,
  sessionToken,
  tableNumber,
  customerName,
  orders,
  staff,
  onClose,
}: ReceiptModalProps) {
  const [step, setStep] = useState<"receipt" | "feedback">("receipt");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const supabaseRef = useRef(createClient());

  const subtotal = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const rawFee = Math.round(subtotal * 0.01 * 100) / 100;
  const sessionFee = subtotal > 0 ? Math.min(Math.max(rawFee, 1), 15) : 0;
  const grandTotal = subtotal + sessionFee;

  const allItems = orders.flatMap((o) =>
    Array.isArray(o.items) ? (o.items as OrderItem[]) : [],
  );

  function itemModifierTotal(item: OrderItem) {
    return (
      item.modifierTotal ??
      item.modifiers?.reduce((sum, modifier) => sum + modifier.price, 0) ??
      0
    );
  }

  function itemLineTotal(item: OrderItem) {
    return (item.price + itemModifierTotal(item)) * item.quantity;
  }

  async function downloadPDF() {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: "a6", unit: "mm" });
      const w = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(2, 44, 34);
      doc.rect(0, 0, w, 40, "F");
      doc.setTextColor(217, 119, 6);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(restaurant.name, w / 2, 15, { align: "center" });
      doc.setFontSize(8);
      doc.setTextColor(253, 251, 247);
      doc.text("Feast the Gen-Z way", w / 2, 22, { align: "center" });
      doc.setFontSize(9);
      doc.text(`Table ${tableNumber} • ${customerName}`, w / 2, 30, {
        align: "center",
      });
      doc.text(new Date().toLocaleString(), w / 2, 37, { align: "center" });

      // Items
      doc.setTextColor(20, 20, 20);
      let y = 50;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ITEM", 10, y);
      doc.text("QTY", w - 40, y);
      doc.text("TOTAL", w - 20, y, { align: "right" });
      y += 4;
      doc.setDrawColor(217, 119, 6);
      doc.line(10, y, w - 10, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      allItems.forEach((item) => {
        doc.text(item.name.substring(0, 25), 10, y);
        doc.text(String(item.quantity), w - 40, y);
        doc.text(
          `${restaurant.currency} ${itemLineTotal(item).toFixed(2)}`,
          w - 10,
          y,
          { align: "right" },
        );
        y += 6;
        if (item.modifiers?.length) {
          doc.setFontSize(6.5);
          doc.setTextColor(90, 90, 90);
          item.modifiers.forEach((mod) => {
            doc.text(
              `+ ${mod.option}${mod.price > 0 ? ` ${restaurant.currency} ${mod.price.toFixed(2)}` : ""}`.substring(
                0,
                34,
              ),
              13,
              y,
            );
            y += 4;
          });
          doc.setFontSize(8);
          doc.setTextColor(20, 20, 20);
        }
        if (item.specialInstructions) {
          doc.setFontSize(6.5);
          doc.setTextColor(217, 119, 6);
          doc.text(`Note: ${item.specialInstructions}`.substring(0, 36), 13, y);
          y += 4;
          doc.setFontSize(8);
          doc.setTextColor(20, 20, 20);
        }
      });

      y += 4;
      doc.line(10, y, w - 10, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.text("Subtotal", 10, y);
      doc.text(`${restaurant.currency} ${subtotal.toFixed(2)}`, w - 10, y, {
        align: "right",
      });
      y += 6;

      doc.setTextColor(217, 119, 6);
      doc.text("Digital Service Fee", 10, y);
      doc.text(`${restaurant.currency} ${sessionFee.toFixed(2)}`, w - 10, y, {
        align: "right",
      });
      y += 8;

      doc.setDrawColor(2, 44, 34);
      doc.line(10, y, w - 10, y);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(2, 44, 34);
      doc.text("TOTAL", 10, y);
      doc.text(`${restaurant.currency} ${grandTotal.toFixed(2)}`, w - 10, y, {
        align: "right",
      });

      y += 12;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Powered by NovaNode Inc.", w / 2, y, { align: "center" });

      doc.save(`receipt-table${tableNumber}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function shareReceipt() {
    const text = `Receipt from ${restaurant.name}\nTable ${tableNumber}\n\nTotal: ${restaurant.currency} ${grandTotal.toFixed(2)}\n\nPowered by NovaNode`;
    if (navigator.share) {
      await navigator.share({ title: `Receipt - ${restaurant.name}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Receipt copied to clipboard!");
    }
  }

  async function submitFeedback() {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const { error } = await supabaseRef.current
        .from("order_feedback")
        .insert({
          restaurant_id: restaurant.id,
          session_token: sessionToken,
          table_number: tableNumber,
          customer_name: customerName,
          rating,
          review: review.trim() || null,
          staff_id: selectedStaff || null,
        });

      if (error) {
        console.error("[ReceiptModal] Feedback insert failed:", error);
        return;
      }

      setFeedbackDone(true);
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "var(--cream-06)",
    border: "1px solid var(--cream-15)",
    borderRadius: 12,
    color: "var(--cream)",
    fontSize: 14,
    fontFamily: "Inter, sans-serif",
    outline: "none",
    resize: "vertical" as const,
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(2,20,12,0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
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
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 60px rgba(2,44,34,0.9)",
          animation: "slideUp 0.4s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        {/* Handle */}
        <div
          style={{ padding: "16px 24px 0", textAlign: "center", flexShrink: 0 }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "var(--cream-15)",
              margin: "0 auto 16px",
            }}
          />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          {step === "receipt" && (
            <>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: "var(--gold-faint)",
                    border: "1px solid var(--gold-dim)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    color: "var(--gold-glow)",
                  }}
                >
                  <Receipt size={24} />
                </div>
                <h2
                  className="t-heading"
                  style={{ fontSize: 22, marginBottom: 6 }}
                >
                  Your Receipt
                </h2>
                <p className="t-caption">
                  {restaurant.name} · Table {tableNumber} · {customerName}
                </p>
                <p className="t-caption" style={{ marginTop: 4 }}>
                  {new Date().toLocaleString()}
                </p>
              </div>

              <div className="divider" style={{ marginBottom: 16 }} />

              {/* Items */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                {orders.map((order, i) => (
                  <div key={i}>
                    <p
                      className="t-eyebrow"
                      style={{ fontSize: 9, marginBottom: 6 }}
                    >
                      {order.is_starter_order
                        ? "⚡ Starter"
                        : `Order #${i + 1}`}
                    </p>
                    {(Array.isArray(order.items)
                      ? (order.items as OrderItem[])
                      : []
                    ).map((item, j) => (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "5px 0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-start",
                            minWidth: 0,
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
                          <span style={{ minWidth: 0 }}>
                            <span
                              className="t-body"
                              style={{
                                fontSize: 13,
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
                        <span className="t-body" style={{ fontSize: 13 }}>
                          {restaurant.currency}{" "}
                          {itemLineTotal(item).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="divider" style={{ marginBottom: 12 }} />

              {/* Totals */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span className="t-body">Subtotal</span>
                  <span className="t-body">
                    {restaurant.currency} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span
                    style={{
                      color: "var(--gold-glow)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Digital Service Fee
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
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--gold-faint)",
                  border: "1px solid var(--gold-dim)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 20,
                }}
              >
                <span className="t-title" style={{ fontSize: 16 }}>
                  Total
                </span>
                <span className="t-price" style={{ fontSize: 26 }}>
                  {restaurant.currency} {grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--gold-faint)",
                    border: "1px solid var(--gold-dim)",
                    borderBottom: "3px solid #92400e",
                    borderRadius: 14,
                    cursor: "pointer",
                    color: "var(--gold-glow)",
                    fontSize: 13,
                    fontWeight: 800,
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.15s",
                  }}
                >
                  {downloading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  {downloading ? "Generating..." : "Download PDF"}
                </button>
                <button
                  onClick={shareReceipt}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--cream-06)",
                    border: "1px solid var(--cream-15)",
                    borderRadius: 14,
                    cursor: "pointer",
                    color: "var(--cream-35)",
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "Inter, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  <Share2 size={15} /> Share
                </button>
              </div>

              <button
                className="btn-primary"
                onClick={() => setStep("feedback")}
              >
                Rate Your Experience <ChevronRight size={16} />
              </button>
            </>
          )}

          {step === "feedback" && !feedbackDone && (
            <>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p className="t-eyebrow" style={{ marginBottom: 8 }}>
                  Quick Feedback
                </p>
                <h2
                  className="t-heading"
                  style={{ fontSize: 20, marginBottom: 6 }}
                >
                  How was your experience?
                </h2>
                <p className="t-body">
                  Your feedback helps {restaurant.name} improve
                </p>
              </div>

              {/* Stars */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 4,
                      transition: "transform 0.15s",
                    }}
                  >
                    <Star
                      size={36}
                      fill={
                        (hoveredRating || rating) >= star
                          ? "#D97706"
                          : "transparent"
                      }
                      color={
                        (hoveredRating || rating) >= star
                          ? "#D97706"
                          : "var(--cream-35)"
                      }
                      style={{
                        transition: "all 0.15s",
                        transform:
                          (hoveredRating || rating) >= star
                            ? "scale(1.15)"
                            : "scale(1)",
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Review */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    color: "var(--cream-35)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Leave a review (optional)
                </label>
                <textarea
                  style={{ ...inputStyle, height: 90 }}
                  placeholder="What did you love? What could be better?"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                />
              </div>

              {/* Staff selector */}
              {staff.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: "block",
                      color: "var(--cream-35)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Who served you? (optional)
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          setSelectedStaff(selectedStaff === s.id ? null : s.id)
                        }
                        style={{
                          padding: "8px 16px",
                          borderRadius: 50,
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "Inter, sans-serif",
                          cursor: "pointer",
                          border:
                            selectedStaff === s.id
                              ? "none"
                              : "1px solid var(--cream-15)",
                          background:
                            selectedStaff === s.id
                              ? "linear-gradient(135deg, var(--gold-glow), var(--gold))"
                              : "var(--cream-06)",
                          color:
                            selectedStaff === s.id
                              ? "#1a0e00"
                              : "var(--cream-35)",
                          transition: "all 0.2s",
                        }}
                      >
                        {s.display_name ?? `Waiter ${s.id.slice(0, 4)}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn-primary"
                onClick={submitFeedback}
                disabled={submittingFeedback || rating === 0}
              >
                {submittingFeedback ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Submit Feedback
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cream-35)",
                  fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Skip & Close
              </button>
            </>
          )}

          {feedbackDone && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <Check size={28} color="#34d399" />
              </div>
              <h2
                className="t-heading"
                style={{ fontSize: 22, marginBottom: 8 }}
              >
                Thank you! 🎉
              </h2>
              <p className="t-body" style={{ marginBottom: 32 }}>
                Your feedback means a lot to {restaurant.name}
              </p>
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
