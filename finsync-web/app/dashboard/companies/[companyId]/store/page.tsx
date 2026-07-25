"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, Plus, TruckIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function StorePage() {
  const { companyId } = useParams();
  const { user, hasRole } = useAuthStore();

  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemData, setItemData] = useState({
    name: "",
    category: "CONSUMABLE",
    quantity: 0,
    lowStockThreshold: 5,
  });

  const fetchStoreData = async () => {
    try {
      const itemsRes = await api.get(`/companies/${companyId}/store-items`);
      setItems(itemsRes.data);

      // Fetch pending requests (Mock endpoint, you may need to add this to backend)
      // For now, we'll assume requests are fetched here.
      // const reqRes = await api.get(`/companies/${companyId}/store-items/requests`);
      // setRequests(reqRes.data);
    } catch (error) {
      toast.error("Failed to load store data");
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [companyId]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${companyId}/store-items`, itemData);
      toast.success("Item added to inventory");
      setIsItemModalOpen(false);
      fetchStoreData();
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleApprove = async (reqId) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${reqId}/approve`,
      );
      toast.success("Request approved");
      fetchStoreData();
    } catch (error) {
      toast.error("Failed to approve request");
    }
  };

  const handleIssue = async (reqId) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${reqId}/issue`,
      );
      toast.success("Item issued successfully");
      fetchStoreData();
    } catch (error) {
      toast.error("Failed to issue item");
    }
  };

  return (
    <div className="space-y-8">
      {/* Inventory Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Store Inventory</h1>
          {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-1" /> Add Item
            </button>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.quantity <= item.lowStockThreshold ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Requests Workflow Section */}
      {hasRole([
        SystemRole.Owner,
        SystemRole.Storekeeper,
        SystemRole.ProjectManager,
        SystemRole.OperatorDriver,
      ]) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Item Requests</h2>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex justify-between items-center border-b pb-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {req.item?.name}{" "}
                        <span className="text-gray-500">
                          ({req.quantity} units)
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested by {req.user?.name} - Status:{" "}
                        <span className="font-semibold">{req.status}</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {req.status === "PENDING" &&
                        hasRole([SystemRole.Owner]) && (
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </button>
                        )}
                      {req.status === "APPROVED" &&
                        hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
                          <button
                            onClick={() => handleIssue(req.id)}
                            className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-sm"
                          >
                            <TruckIcon className="h-4 w-4 mr-1" /> Issue
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add Store Item</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={itemData.name}
                  onChange={(e) =>
                    setItemData({ ...itemData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={itemData.category}
                  onChange={(e) =>
                    setItemData({ ...itemData, category: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                >
                  <option value="CONSUMABLE">Consumable (One-time use)</option>
                  <option value="TOOL">Tool (Restorable)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={itemData.quantity}
                    onChange={(e) =>
                      setItemData({
                        ...itemData,
                        quantity: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    required
                    value={itemData.lowStockThreshold}
                    onChange={(e) =>
                      setItemData({
                        ...itemData,
                        lowStockThreshold: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
