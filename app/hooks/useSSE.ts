"use client";

import { useEffect, useRef, useState } from "react";

interface UseSSEResult<T> {
  items: T[];          // All items received so far (most recent first)
  newCount: number;    // Items received since last reset
  connected: boolean;
  resetCount: () => void;
}

/**
 * Connect to an SSE endpoint and accumulate incoming JSON arrays.
 * Each SSE message must be: data: <JSON array>\n\n
 *
 * @param url  Full URL of the SSE endpoint (empty string = disabled)
 * @param max  Maximum items to keep in state (default 200)
 */
export function useSSE<T extends { id: number }>(
  url: string,
  max = 200
): UseSSEResult<T> {
  const [items, setItems]       = useState<T[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!url) return;

    let es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const incoming: T[] = JSON.parse(event.data);
        if (!Array.isArray(incoming) || incoming.length === 0) return;

        setItems((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const fresh = incoming.filter((t) => !existingIds.has(t.id));
          if (fresh.length === 0) return prev;
          return [...fresh, ...prev].slice(0, max);
        });

        setNewCount((c) => c + incoming.length);
      } catch {
        // ignore parse errors / keepalive comments
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Auto-reconnect after 5 s
      const timer = setTimeout(() => {
        es = new EventSource(url);
        esRef.current = es;
      }, 5000);
      return () => clearTimeout(timer);
    };

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [url, max]);

  const resetCount = () => setNewCount(0);

  return { items, newCount, connected, resetCount };
}
