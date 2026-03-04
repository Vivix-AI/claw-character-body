import { useState, useEffect, useRef, useCallback } from 'react';
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useWebSocket(sessionId, onMessage) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_BASE}/ws?session=${sessionId}`);
    wsRef.current = ws;
    ws.onopen = () => { setConnected(true); };
    ws.onmessage = (e) => { try { onMessage?.(JSON.parse(e.data)); } catch {} };
    ws.onclose = () => { setConnected(false); reconnectTimer.current = setTimeout(connect, 3000); };
    ws.onerror = () => { ws.close(); };
  }, [sessionId, onMessage]);

  useEffect(() => { connect(); return () => { clearTimeout(reconnectTimer.current); wsRef.current?.close(); }; }, [connect]);

  const send = useCallback((data) => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(data)); }, []);
  return { send, connected };
}
