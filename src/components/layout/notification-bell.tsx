"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useNotifications } from "@/features/Notifications/hooks/use-notifications";
import { NotificationDetailModal } from "@/features/Notifications/components/notification-detail-modal";
import type { Notification } from "@/features/Notifications/types/notification.types";

const TYPE_ICONS: Record<string, string> = {
  OrderCreated: "🆕",
  OrderStatusChanged: "🔄",
  OrderReady: "✅",
  DeliveryAssigned: "🛵",
  DeliveryInTransit: "🚚",
  DeliveryCompleted: "📦",
  ShiftEndingSoon: "⏰",
  PaymentConfirmed: "💰",
  Manual: "📢",
  System: "⚙️",
  ReviewReceived: "⭐",
};

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return `Hace ${Math.floor(diffH / 24)} d`;
}

export const NotificationBell = () => {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const { notifications, unreadCount, loading, fetchAll, markAsRead, markAllAsRead } =
    useNotifications(userId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) fetchAll();
  }, [isOpen, fetchAll]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        aria-label="Notificaciones"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EA1D2C] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-[#111827] text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[#EA1D2C] hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-8">Cargando...</p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                No tienes notificaciones.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedNotification(n);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 flex gap-3 hover:bg-gray-50 transition-colors ${
                    !n.isRead ? "bg-red-50/40" : ""
                  }`}
                >
                  <span className="text-lg shrink-0">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#EA1D2C] shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
};