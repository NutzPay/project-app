'use client';

import { useEffect, useRef, useState } from 'react';

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed' | 'expired';
  usdtAmount?: number;
  brlAmount?: number;
  timestamp: string;
  message?: string;
}

interface UsePaymentWebSocketProps {
  transactionId?: string;
  onPaymentUpdate?: (status: PaymentStatus) => void;
  enabled?: boolean;
}

export function usePaymentWebSocket(params: UsePaymentWebSocketProps = {}) {
  const { transactionId, onPaymentUpdate, enabled = true } = params;
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<PaymentStatus | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!enabled || !transactionId) return;

    try {
      // Use wss:// for production, ws:// for development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws/payments?transactionId=${transactionId}`;
      
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      setConnectionStatus('connecting');
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected for transaction:', transactionId);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Send subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          transactionId: transactionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as PaymentStatus;
          console.log('📨 Payment status update:', data);
          
          setLastMessage(data);
          onPaymentUpdate?.(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Auto-reconnect if not a normal closure and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && enabled) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
  };

  // Connect when transaction ID is available and enabled
  useEffect(() => {
    if (enabled && transactionId) {
      connect();
    }

    return disconnect;
  }, [transactionId, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return disconnect;
  }, []);

  return {
    connectionStatus,
    lastMessage,
    isConnected: connectionStatus === 'connected',
    reconnect: connect,
    disconnect
  };
}