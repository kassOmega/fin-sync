import api from "@/lib/api";
import toast from "react-hot-toast";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QueuedExpense {
  companyId: number;
  amount: number;
  category: string;
  note?: string;
  date?: string;
}

interface OfflineQueueState {
  queue: QueuedExpense[];
  addToQueue: (expense: QueuedExpense) => void;
  syncQueue: () => Promise<void>;
  isSyncing: boolean;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,

      addToQueue: (expense) => {
        set((state) => ({ queue: [...state.queue, expense] }));
        toast.success("Saved offline. Will sync when online.");
        // Attempt immediate sync if they are actually online
        get().syncQueue();
      },

      syncQueue: async () => {
        const { queue, isSyncing } = get();
        if (isSyncing || queue.length === 0) return;

        if (typeof navigator !== "undefined" && !navigator.onLine) return;

        set({ isSyncing: true });

        try {
          const failedItems: QueuedExpense[] = [];

          for (const expense of queue) {
            try {
              await api.post(
                `/companies/${expense.companyId}/expenses`,
                expense,
              );
            } catch (error) {
              // If it fails, keep it in the queue
              failedItems.push(expense);
            }
          }

          set({ queue: failedItems });
          if (failedItems.length === 0) {
            toast.success("Offline data synced successfully!");
          }
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "finsync-offline-queue", // Local storage key
    },
  ),
);
