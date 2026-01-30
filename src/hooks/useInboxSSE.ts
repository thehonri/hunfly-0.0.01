/**
 * Hook para receber eventos SSE (Server-Sent Events) do inbox
 * Conecta ao endpoint /api/inbox/events e recebe atualizações em tempo real
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface InboxEvent {
  type: 'message.new' | 'message.update' | 'thread.update';
  data: {
    threadId: string;
    messageId?: string;
    fromJid?: string;
    body?: string;
    timestamp?: string;
    isFromMe?: boolean;
    [key: string]: any;
  };
}

interface UseInboxSSEOptions {
  tenantId: string;
  accountId: string;
  enabled?: boolean;
}

export function useInboxSSE({ tenantId, accountId, enabled = true }: UseInboxSSEOptions) {
  const [lastEvent, setLastEvent] = useState<InboxEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled || !tenantId || !accountId) {
      return;
    }

    const connect = async () => {
      try {
        // Obter token do Supabase
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Not authenticated');
          return;
        }

        // NOTA: EventSource não suporta headers custom
        // Passamos o token via query param (backend precisa aceitar)
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const url = new URL(`${apiUrl}/api/inbox/events`);
        url.searchParams.set('tenantId', tenantId);
        url.searchParams.set('accountId', accountId);
        url.searchParams.set('token', session.access_token);

        console.log('[useInboxSSE] Connecting to:', url.pathname);

        eventSourceRef.current = new EventSource(url.toString());

        eventSourceRef.current.onopen = () => {
          console.log('[useInboxSSE] Connected');
          setIsConnected(true);
          setError(null);
        };

        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as InboxEvent;
            console.log('[useInboxSSE] Event received:', data.type);
            setLastEvent(data);
          } catch (err) {
            console.error('[useInboxSSE] Failed to parse event:', err);
          }
        };

        eventSourceRef.current.onerror = (err) => {
          console.error('[useInboxSSE] Connection error:', err);
          setIsConnected(false);
          setError('Connection lost');

          // EventSource reconecta automaticamente, mas com delay
          // Podemos fechar e reconectar manualmente para controle
          eventSourceRef.current?.close();

          // Reconectar após 3 segundos
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[useInboxSSE] Attempting to reconnect...');
            connect();
          }, 3000);
        };
      } catch (err) {
        console.error('[useInboxSSE] Setup error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    connect();

    // Cleanup
    return () => {
      console.log('[useInboxSSE] Disconnecting');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [tenantId, accountId, enabled]);

  return {
    lastEvent,
    isConnected,
    error,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
    },
  };
}
