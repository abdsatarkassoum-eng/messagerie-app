import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { NotificationItem } from '../types';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  requestsCount: number;
  totalBadge: number;
  refreshNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  setRequestsCount: (n: number) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [requestsCount, setRequestsCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch {
      /* silencieux */
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshNotifications();
    else setNotifications([]);
  }, [user, refreshNotifications]);

  // Dès qu'une notification arrive (message, appel manqué...), peu importe la
  // page ouverte, elle est ajoutée ici — donc visible partout instantanément.
  useEffect(() => {
    if (!socket) return;
    const handleNew = (n: NotificationItem) => {
      setNotifications((prev) => [n, ...prev]);
    };
    socket.on('notification:new', handleNew);
    return () => {
      socket.off('notification:new', handleNew);
    };
  }, [socket]);

  const markAllNotificationsRead = useCallback(async () => {
    const hasUnread = notifications.some((n) => !n.read);
    if (!hasUnread) return;
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* silencieux */
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalBadge = unreadCount + requestsCount;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, requestsCount, totalBadge, refreshNotifications, markAllNotificationsRead, setRequestsCount }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications doit être utilisé à l\'intérieur de NotificationsProvider');
  return ctx;
  }
