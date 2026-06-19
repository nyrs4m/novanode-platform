"use client";

import { useState, useEffect } from "react";

 function TimeAgo({ dateStr }: { dateStr: string | null }) {
  const [display, setDisplay] = useState(() => {
    if (!dateStr) return "just now";
    const ms = Date.now() - new Date(dateStr).getTime();
    if (isNaN(ms) || ms < 0) return "just now";
    const diff = Math.floor(ms / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  });

  useEffect(() => {
    if (!dateStr) return;
    const update = () => {
      const ms = Date.now() - new Date(dateStr).getTime();
      if (isNaN(ms) || ms < 0) { setDisplay("just now"); return; }
      const diff = Math.floor(ms / 60000);
      setDisplay(diff < 1 ? "just now" : diff < 60 ? `${diff}m ago` : `${Math.floor(diff / 60)}h ago`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [dateStr]);

  if (!dateStr) return null;
  return <span>{display}</span>;
}

export default TimeAgo