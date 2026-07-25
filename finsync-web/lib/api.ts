import { useAuthStore } from "@/store/authStore";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes("/auth/") ||
      error.config?.url?.includes("/users/me");

    // Only auto-logout on 401 if it wasn't an auth/verification request itself
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isAuthEndpoint
    ) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
