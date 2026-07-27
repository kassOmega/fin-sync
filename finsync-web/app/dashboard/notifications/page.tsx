"use client";

import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { Bell, CheckCircle } from "lucide-react";
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

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Bell className="h-6 w-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-800">
          {t("notifications.title")}
        </h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("notifications.empty")}
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex items-start justify-between ${notif.isRead ? "bg-white" : "bg-indigo-50"}`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${notif.isRead ? "bg-gray-300" : "bg-indigo-600"}`}
                ></div>
                <div>
                  <p className="font-medium text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="flex items-center text-xs text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded-md"
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
