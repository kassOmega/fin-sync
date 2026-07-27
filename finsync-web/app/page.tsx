"use client";

import { useLangStore } from "@/store/langStore";

export default function Home() {
  const { t } = useLangStore();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">{t("landing.title")}</h1>
      <p className="mt-4 text-gray-400">{t("landing.subtitle")}</p>
      <a
        href="/login"
        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
      >
        {t("landing.goLogin")}
      </a>
    </div>
  );
}
