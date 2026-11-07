import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  AppNotificationItem,
  SupportChatMessage,
  UserProfile,
} from '../types';

interface RealtimeSupportState {
  notifications: AppNotificationItem[];
  unreadNotificationsCount: number;
  unreadCustomerSupportCount: number;
  unreadAdminSupportCount: number;
  liveToast: AppNotificationItem | null;
  lastIncomingMessage: SupportChatMessage | null;
  dismissToast: () => void;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

export function useRealtimeSupport(
  authToken: string,
  user: UserProfile | null
): RealtimeSupportState {
  const [notifications, setNotifications] = useState<AppNotificationItem[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadCustomerSupportCount, setUnreadCustomerSupportCount] = useState(0);
  const [unreadAdminSupportCount, setUnreadAdminSupportCount] = useState(0);
  const [liveToast, setLiveToast] = useState<AppNotificationItem | null>(null);
  const [lastIncomingMessage, setLastIncomingMessage] =
    useState<SupportChatMessage | null>(null);

  const seenToastIdsRef = useRef<Set<string>>(new Set());
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setLiveToast(null);
  }, []);

  const showNewToast = useCallback((item: AppNotificationItem) => {
    if (seenToastIdsRef.current.has(item.id)) return;
    seenToastIdsRef.current.add(item.id);
    setLiveToast(item);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setLiveToast((current) => (current?.id === item.id ? null : current));
      toastTimerRef.current = null;
    }, 8000);
  }, []);

  const applyServerSnapshot = useCallback(
    (data: {
      notifications?: AppNotificationItem[];
      unreadNotificationsCount?: number;
      unreadCustomerSupportCount?: number;
      unreadAdminSupportCount?: number;
    }) => {
      if (Array.isArray(data.notifications)) {
        for (const n of data.notifications) {
          seenToastIdsRef.current.add(n.id);
        }
        setNotifications(data.notifications);
      }
      if (typeof data.unreadNotificationsCount === 'number') {
        setUnreadNotificationsCount(data.unreadNotificationsCount);
      }
      if (typeof data.unreadCustomerSupportCount === 'number') {
        setUnreadCustomerSupportCount(data.unreadCustomerSupportCount);
      }
      if (typeof data.unreadAdminSupportCount === 'number') {
        setUnreadAdminSupportCount(data.unreadAdminSupportCount);
      }
    },
    []
  );

  const refreshNotifications = useCallback(async () => {
    if (!authToken || !user) return;
    try {
      const res = await fetch('/api/notifications', {
        credentials: 'include',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      applyServerSnapshot(data);
    } catch {
      // Ignore transient network errors
    }
  }, [authToken, user, applyServerSnapshot]);

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!authToken || !user) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
      try {
        const res = await fetch('/api/notifications/read', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ notificationId }),
        });
        if (res.ok) {
          const data = await res.json();
          applyServerSnapshot(data);
        }
      } catch {
        // Reconciles on next sync
      }
    },
    [authToken, user, applyServerSnapshot]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!authToken || !user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotificationsCount(0);
    setLiveToast(null);
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        const data = await res.json();
        applyServerSnapshot(data);
      }
    } catch {
      // Reconciles on next sync
    }
  }, [authToken, user, applyServerSnapshot]);

  useEffect(() => {
    if (!authToken || !user) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      setUnreadCustomerSupportCount(0);
      setUnreadAdminSupportCount(0);
      setLiveToast(null);
      setLastIncomingMessage(null);
      seenToastIdsRef.current.clear();
      seenMessageIdsRef.current.clear();
      return;
    }

    let disposed = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let reconnectAttempt = 0;

    void refreshNotifications();

    function connectWebSocket() {
      if (disposed || typeof window === 'undefined') return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/realtime?token=${encodeURIComponent(
        authToken
      )}`;

      try {
        ws = new WebSocket(wsUrl);
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        reconnectAttempt = 0;
        void refreshNotifications();
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const payload = JSON.parse(String(event.data));
          if (!payload || typeof payload.type !== 'string') return;

          if (payload.type === 'init:sync' || payload.type === 'notifications:updated') {
            applyServerSnapshot(payload);
            return;
          }

          if (payload.type === 'support:message_created' && payload.message) {
            const msg = payload.message as SupportChatMessage;
            if (!seenMessageIdsRef.current.has(msg.id)) {
              seenMessageIdsRef.current.add(msg.id);
              setLastIncomingMessage(msg);
            }
            if (typeof payload.unreadCustomerSupportCount === 'number') {
              setUnreadCustomerSupportCount(payload.unreadCustomerSupportCount);
            }
            if (typeof payload.unreadAdminSupportCount === 'number') {
              setUnreadAdminSupportCount(payload.unreadAdminSupportCount);
            }
            return;
          }

          if (payload.type === 'notification:created' && payload.notification) {
            const notif = payload.notification as AppNotificationItem;
            setNotifications((prev) => {
              if (prev.some((existing) => existing.id === notif.id)) {
                return prev;
              }
              return [notif, ...prev].slice(0, 50);
            });
            if (typeof payload.unreadNotificationsCount === 'number') {
              setUnreadNotificationsCount(payload.unreadNotificationsCount);
            } else {
              setUnreadNotificationsCount((prev) => prev + 1);
            }
            if (typeof payload.unreadCustomerSupportCount === 'number') {
              setUnreadCustomerSupportCount(payload.unreadCustomerSupportCount);
            }
            if (typeof payload.unreadAdminSupportCount === 'number') {
              setUnreadAdminSupportCount(payload.unreadAdminSupportCount);
            }
            showNewToast(notif);
          }
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!disposed) {
          scheduleReconnect();
        }
      };

      ws.onerror = () => {
        // onclose handles backoff reconnection cleanly
      };
    }

    function scheduleReconnect() {
      if (disposed || reconnectTimer !== null) return;
      const delayMs = Math.min(10000, 1500 * Math.pow(1.6, reconnectAttempt));
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connectWebSocket();
      }, delayMs);
    }

    connectWebSocket();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshNotifications();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      disposed = true;
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (ws) {
        try {
          ws.close();
        } catch {
          // Ignore
        }
      }
    };
  }, [authToken, user?.id, user?.role, refreshNotifications, applyServerSnapshot, showNewToast]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return {
    notifications,
    unreadNotificationsCount,
    unreadCustomerSupportCount,
    unreadAdminSupportCount,
    liveToast,
    lastIncomingMessage,
    dismissToast,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
