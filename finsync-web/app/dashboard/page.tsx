"use client";

import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";

export default function DashboardHome() {
  const { user, hasRole } = useAuthStore();
  const { t } = useLangStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {t("overview.title")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasRole([SystemRole.Owner]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("overview.personalFinance")}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {t("overview.personalDesc")}
            </p>
            <a
              href="/dashboard/personal"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t("overview.goPersonal")}
            </a>
          </div>
        )}

        {hasRole([SystemRole.Owner]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("overview.businessOps")}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {t("overview.businessDesc")}
            </p>
            <a
              href="/dashboard/companies"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t("overview.goCompanies")}
            </a>
          </div>
        )}

        {!hasRole([SystemRole.Owner]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">
              {t("overview.yourTasks")}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {t("overview.staffWelcome")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
