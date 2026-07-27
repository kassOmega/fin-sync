"use client";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { t } = useLangStore();
  const [email, setEmail] = useState("john@finsync.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data.user, res.data.accessToken);
      toast.success(t("login.welcomeBack"));
      router.push("/dashboard");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t("login.title")}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t("login.subtitle")}
          </p>
        </div>
        <form method="POST" className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm  gap-2">
            <div>
              <label htmlFor="email" className="sr-only">
                {t("login.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t("login.email")}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                {t("login.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t("login.password")}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? t("login.loading") : t("login.submit")}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t("login.noAccount")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
