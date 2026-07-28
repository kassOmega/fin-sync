"use client";

import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import { ClipboardList, Package, Store, Truck, Wrench } from "lucide-react";

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
          <>
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

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Store Requisitions
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Review and approve staff store item requests across all
                companies.
              </p>
              <a
                href="/dashboard/requisitions"
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Manage Requisitions →
              </a>
            </div>
          </>
        )}

        {hasRole([SystemRole.ProjectManager, SystemRole.Foreman]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Assigned Projects
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              View and update progress on construction projects assigned to you.
            </p>
            <a
              href="/dashboard/projects"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View Projects →
            </a>
          </div>
        )}

        {hasRole([SystemRole.OperatorDriver]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Machinery & Vehicles
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              View assigned machinery, log operational hours, and check
              maintenance status.
            </p>
            <a
              href="/dashboard/machinery"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View Machinery →
            </a>
          </div>
        )}

        {hasRole([SystemRole.Storekeeper]) && (
          <>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <Store className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Store Inventory
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Manage stock levels, process restocks, and monitor low-stock
                alerts.
              </p>
              <a
                href="/dashboard/companies"
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Manage Inventory →
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-700">
                  Pending Requisitions
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Issue approved store requests and manage tool returns.
              </p>
              <a
                href="/dashboard/requisitions"
                className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Fulfill Requests →
              </a>
            </div>
          </>
        )}

        {hasRole([SystemRole.Cashier, SystemRole.Sales]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Sales & Transactions
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Access POS sales, financial records, and company transactions.
            </p>
            <a
              href="/dashboard/requisitions"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Go to Requisitions →
            </a>
          </div>
        )}

        {/* Universal access for staff roles WITHOUT their own requisitions card */}
        {!hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-5 w-5 text-teal-500" />
              <h3 className="text-lg font-semibold text-gray-700">
                Store Requisitions
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Request tools or consumables from the company store.
            </p>
            <a
              href="/dashboard/requisitions"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Create Request →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
