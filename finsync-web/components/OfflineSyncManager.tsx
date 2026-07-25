"use client";

import { useOfflineQueueStore } from "@/store/offlineQueueStore";
import { useEffect } from "react";

export default function OfflineSyncManager() {
  const syncQueue = useOfflineQueueStore((state) => state.syncQueue);

  useEffect(() => {
    // Sync on app load
    syncQueue();

    // Sync when the connection comes back online
    window.addEventListener("online", syncQueue);

    return () => {
      window.removeEventListener("online", syncQueue);
    };
  }, [syncQueue]);

  return null;
}
