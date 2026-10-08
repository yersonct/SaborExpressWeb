"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { notificationService } from "../services/notification.service";
import type { Notification } from "../types/notification.types";

const POLL_INTERVAL_MS = 20000; // 20 segundos (queda como respaldo)
const HUB_URL = `${process.env.NEXT_PUBLIC_API_URL}/hubs/notifications`;

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch {
      // Silencioso a propósito: un fallo de polling no debe interrumpir al
      // usuario con un toast cada 20 segundos.
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

  // Polling del contador (liviano) cada 20s — respaldo si SignalR falla
  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, fetchUnreadCount]);

  // Conexión en tiempo real por SignalR
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => {
          const raw = localStorage.getItem("sabor-express-session");
          return raw ? (JSON.parse(raw).token ?? "") : "";
        },
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Critical)
      .build();

    connection.on("ReceiveNotification", (nueva: Notification) => {
      setNotifications((prev) => [nueva, ...prev]);
      if (!nueva.isRead) {
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();
      }
    });

    (async () => {
      try {
        // Si el token venció, el interceptor de Axios lo renueva aquí
        // antes de que SignalR intente negociar.
        await notificationService.getUnreadCount(userId);
        if (cancelled) return;
        await connection.start();
      } catch (err: any) {
        // React Strict Mode monta/desmonta el efecto dos veces en desarrollo;
        // abortar a medio negociar es esperado, no un error real.
        if (cancelled || err?.message?.includes("stopped during negotiation"))
          return;
        console.error("Error conectando a SignalR:", err);
      }
    })();

    return () => {
      cancelled = true;
      connection.stop();
    };
  }, [userId]);

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
