"use client";

import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function DashboardHome() {
  const { user, hasRole } = useAuthStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hasRole([SystemRole.Owner]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">
              Personal Finance
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Track your daily budgets, expenses, and savings goals.
            </p>
            <a
              href="/dashboard/personal"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go to Personal Finance &rarr;
            </a>
          </div>
        )}

        {hasRole([SystemRole.Owner]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">
              Business Operations
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Manage companies, staff, incomes, and expenses.
            </p>
            <a
              href="/dashboard/companies"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Manage Companies &rarr;
            </a>
          </div>
        )}

        {!hasRole([SystemRole.Owner]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Your Tasks</h3>
            <p className="mt-2 text-sm text-gray-500">
              Welcome staff member! Use the menu to navigate your assigned
              tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
