"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Copy, Check, Printer, Plus, Minus, QrCode } from "lucide-react";
import { Tables } from "@/types/database.types";
import { createClient } from "@/lib/supabase/client";

type Restaurant = Tables<"restaurants">;

interface QRGeneratorProps {
  restaurant: Restaurant;
  baseUrl: string;
}

interface TableQR {
  tableNumber: number;
  url: string;
}

export default function QRGenerator({ restaurant, baseUrl }: QRGeneratorProps) {
  const [tableCount, setTableCount] = useState(5)
  const [copiedTable, setCopiedTable] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [savingAll, setSavingAll] = useState(false)
  const supabaseRef = useRef(createClient());

  const tables: TableQR[] = Array.from({ length: tableCount }, (_, i) => ({
    tableNumber: i + 1,
    url: `${baseUrl}/${restaurant.slug}?table=${i + 1}`,
  }));

  async function copyUrl(table: TableQR) {
    await navigator.clipboard.writeText(table.url);
    setCopiedTable(table.tableNumber);
    setTimeout(() => setCopiedTable(null), 2000);
  }

  function downloadQR(table: TableQR) {
    setDownloading(table.tableNumber);
    const canvas = document.getElementById(
      `qr-${table.tableNumber}`
    ) as HTMLCanvasElement;
    if (!canvas) { setDownloading(null); return; }

    // Create a styled download with restaurant name + table number
    const downloadCanvas = document.createElement("canvas");
    const padding = 40;
    const qrSize = 240;
    downloadCanvas.width = qrSize + padding * 2;
    downloadCanvas.height = qrSize + padding * 2 + 80;

    const ctx = downloadCanvas.getContext("2d")!;
    
    // Background
    ctx.fillStyle = "#022c22";
    ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Gold border
    ctx.strokeStyle = "#D97706";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, downloadCanvas.width - 16, downloadCanvas.height - 16);

    // Restaurant name
    ctx.fillStyle = "#D97706";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(restaurant.name, downloadCanvas.width / 2, 30);

    // QR code
    ctx.drawImage(canvas, padding, 50, qrSize, qrSize);

    // Table number
    ctx.fillStyle = "#FDFBF7";
    ctx.font = "bold 20px Inter, sans-serif";
    ctx.fillText(`Table ${table.tableNumber}`, downloadCanvas.width / 2, qrSize + 50 + 20);

    // Tagline
    ctx.fillStyle = "rgba(253,251,247,0.4)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("Scan to order - Feast the Gen-Z way", downloadCanvas.width / 2, qrSize + 50 + 42);

    const link = document.createElement("a");
    link.download = `${restaurant.slug}-table-${table.tableNumber}-qr.png`;
    link.href = downloadCanvas.toDataURL("image/png");
    link.click();
    setDownloading(null);
  }

  function downloadAll() {
    tables.forEach((t, i) => {
      setTimeout(() => downloadQR(t), i * 300);
    });
  }

  async function saveQRsToDatabase() {
    setSavingAll(true);
    try {
      const records = tables.map(t => ({
        restaurant_id: restaurant.id,
        table_number: String(t.tableNumber),
        qr_url: t.url,
      }));

      // Upsert — update if exists, insert if not
      const { error } = await supabaseRef.current
        .from("qr_codes")
        .upsert(records, { onConflict: "restaurant_id,table_number" });

      if (error) throw error;
      alert(`${tableCount} QR codes saved successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to save QR codes.");
    } finally {
      setSavingAll(false);
    }
  }

  function printAll() {
    window.print();
  }

  return (
    <div>
      {/* Controls */}
      <div className="card-3d qr-panel">
        <p className="t-eyebrow qr-panel-title">Configuration</p>

        <div className="qr-row">
          <div>
            <p className="t-title qr-row-label">Number of Tables</p>
            <p className="t-caption">One QR code will be generated per table</p>
          </div>
          <div className="qr-counter">
            <button
              type="button"
              aria-label="Decrease table count"
              title="Decrease table count"
              className="qty-btn qr-counter-button"
              onClick={() => setTableCount((t) => Math.max(1, t - 1))}
            >
              <Minus size={16} />
            </button>
            <span className="qty-num qr-counter-value">{tableCount}</span>
            <button
              type="button"
              aria-label="Increase table count"
              title="Increase table count"
              className="qty-btn qr-counter-button"
              onClick={() => setTableCount((t) => Math.min(50, t + 1))}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="qr-url-box">
          <p className="t-caption qr-url-label">Menu URL format</p>
          <p className="qr-url-text">{baseUrl}/{restaurant.slug}?table=N</p>
        </div>

        <div className="qr-actions">
          <button className="btn-primary" onClick={saveQRsToDatabase} disabled={savingAll}>
            <QrCode size={15} />
            {savingAll ? "Saving..." : "Save to Database"}
          </button>
          <button type="button" className="btn-secondary" onClick={downloadAll}>
            <Download size={15} /> Download All
          </button>
          <button
            type="button"
            className="btn-ghost"
            aria-label="Print all QR codes"
            title="Print all QR codes"
            onClick={printAll}
          >
            <Printer size={15} />
          </button>
        </div>
      </div>

      {/* QR Grid */}
      <div className="qr-grid print-grid">
        {tables.map((table) => (
          <div key={table.tableNumber} className="qr-card print-card">
            {/* Eyebrow */}
            <p className="t-eyebrow qr-card-restaurant">{restaurant.name}</p>

            {/* QR Code */}
            <div className="qr-code-wrap">
              <QRCodeCanvas
                id={`qr-${table.tableNumber}`}
                value={table.url}
                size={160}
                bgColor="#ffffff"
                fgColor="#022c22"
                level="H"
              />
            </div>

            {/* Table number */}
            <div className="qr-table-label">
              <p className="qr-table-title">
                Table {table.tableNumber}
              </p>
              <p className="t-caption qr-table-subtitle">
                Feast the Gen-Z way
              </p>
            </div>

            {/* Action buttons */}
            <div className="qr-card-actions">
              <button
                type="button"
                className={`btn-secondary qr-copy-btn ${copiedTable === table.tableNumber ? "copied" : ""}`}
                onClick={() => copyUrl(table)}
              >
                {copiedTable === table.tableNumber ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
              </button>
              <button
                type="button"
                className="btn-secondary qr-download-btn"
                disabled={downloading === table.tableNumber}
                onClick={() => downloadQR(table)}
              >
                <Download size={12} /> {downloading === table.tableNumber ? "..." : "Download"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
