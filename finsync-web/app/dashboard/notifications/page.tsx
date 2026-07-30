"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { Bell, CheckCheck, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Notification {
  id: number | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t } = useLangStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch {
      toast.error(t("notifications.loadFailed"));
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number | string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      toast.error(t("notifications.updateFailed"));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      toast.success(t("notifications.allRead"));
    } catch {
      toast.error(t("notifications.updateFailed"));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-indigo-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("notifications.title")}
          </h1>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-500">
              ({unreadCount} {t("notifications.unread")})
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
          >
            <CheckCheck className="h-4 w-4 mr-1" />{" "}
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            {t("notifications.empty")}
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex items-start justify-between transition-colors ${notif.isRead ? "bg-white" : "bg-indigo-50/50"}`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${notif.isRead ? "bg-gray-300" : "bg-indigo-600"}`}
                ></div>
                <div>
                  <p
                    className={`text-sm ${notif.isRead ? "font-normal text-gray-700" : "font-semibold text-gray-900"}`}
                  >
                    {notif.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="flex-shrink-0 flex items-center text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md ml-2"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />{" "}
                  {t("notifications.markRead")}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
