"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationService } from "../services/notification.service";
import type { Notification } from "../types/notification.types";
import { useRealtimeEvents } from "@/features/Dashboard/hooks/use-realtime-events";
import { useAdminDataChanged } from "@/features/Dashboard/hooks/use-admin-data-changed";

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // tono agudo, tipo "ding"
    gain.gain.setValueAtTime(0.15, ctx.currentTime); // volumen bajo, no invasivo
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch {
    // Si el navegador bloquea el audio (autoplay policy), fallamos en silencio
  }
}

export function useNotifications(userId: number | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch {
      // Silencioso: el socket actualizará el contador cuando llegue otro evento.
    }
  }, [userId]);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await notificationService.getByUser(userId);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleNotification = useCallback(
    (eventName?: string, ...args: unknown[]) => {
      if (eventName !== "ReceiveNotification") return;
      const nueva = args[0] as Notification | undefined;
      if (!nueva || typeof nueva.id !== "number") return;

      setNotifications((prev) => [nueva, ...prev]);
      if (!nueva.isRead) {
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
      }
    },
    [],
  );

  const refreshAfterChange = useCallback(() => {
    void fetchAll().catch(() => fetchUnreadCount());
  }, [fetchAll, fetchUnreadCount]);

  useRealtimeEvents(
    userId,
    ["ReceiveNotification"],
    handleNotification,
    refreshAfterChange,
  );
  useRealtimeEvents(userId, ["NotificationsChanged"], refreshAfterChange);
  useAdminDataChanged(userId, ["Notifications"], refreshAfterChange);

  // Conteo inicial; los cambios posteriores llegan por SignalR.
  useEffect(() => {
    if (!userId) return;
    void fetchUnreadCount();
  }, [userId, fetchUnreadCount]);

  const markAsRead = async (id: number) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await notificationService.markAllAsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchAll,
    markAsRead,
    markAllAsRead,
  };
}
