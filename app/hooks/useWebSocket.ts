"use client";

import { useEffect, useRef, useState } from "react";

interface UseWebSocketResult<T> {
  items: T[];
  newCount: number;
  connected: boolean;
  resetCount: () => void;
}

export function useWebSocket<T extends { id: number }>(
  url: string,
  max = 200
): UseWebSocketResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) return;

    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
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
        } catch {}
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [url, max]);

  const resetCount = () => setNewCount(0);

  return { items, newCount, connected, resetCount };
}
