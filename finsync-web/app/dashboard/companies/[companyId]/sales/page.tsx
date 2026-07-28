"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Loader2, ShoppingCart, UserPlus, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreCategory {
  id: number;
  name: string;
  _count: { items: number };
}

interface StoreItem {
  id: number;
  name: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
  categoryId: number;
  category?: StoreCategory;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
}

interface SaleItem {
  id: number;
  quantity: number;
  unitPrice: number;
  total: number;
  storeItem: StoreItem;
}

interface Sale {
  id: number;
  totalAmount: number;
  discount: number;
  note: string | null;
  date: string;
  customer: Customer | null;
  user: { id: number; name: string };
  items: SaleItem[];
}

export default function SalesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { hasRole } = useAuthStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState("0");
  const [saleNote, setSaleNote] = useState("");
  const [saleItems, setSaleItems] = useState<
    {
      itemId?: number;
      name?: string;
      categoryId?: number;
      buyingPrice?: number;
      quantity: number;
      unitPrice: number;
      isNew?: boolean;
      categoryFilter?: number;
    }[]
  >([]);

  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = async () => {
    try {
      const [salesRes, custRes, catRes] = await Promise.all([
        api.get(`/companies/${companyId}/sales`),
        api.get(`/companies/${companyId}/sales/customers/list`),
        api.get(`/companies/${companyId}/store-items/categories`),
      ]);
      setSales(salesRes.data);
      setCustomers(custRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  const fetchStoreItems = async (categoryId?: number) => {
    try {
      const urlParams = new URLSearchParams();
      if (categoryId) urlParams.append("categoryId", String(categoryId));
      const qs = urlParams.toString();
      const res = await api.get(
        `/companies/${companyId}/store-items${qs ? `?${qs}` : ""}`,
      );
      setStoreItems(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      await Promise.all([fetchData(), fetchStoreItems()]);
      setPageLoading(false);
    };
    load();
  }, [companyId]);

  const addSaleLine = () => {
    setSaleItems([
      ...saleItems,
      { itemId: undefined, quantity: 1, unitPrice: 0, isNew: false },
    ]);
  };

  const updateSaleLine = (
    index: number,
    field: string,
    value: number | string,
  ) => {
    const updated = [...saleItems];
    (updated[index] as Record<string, string | number | undefined>)[field] =
      value;
    if (field === "categoryFilter" && typeof value === "number") {
      fetchStoreItems(value || undefined);
    }
    if (field === "itemId" && typeof value === "number" && value > 0) {
      const item = storeItems.find((i) => i.id === value);
      if (item) updated[index].unitPrice = item.sellingPrice;
      updated[index].isNew = false;
    }
    setSaleItems(updated);
  };

  const removeSaleLine = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const toggleNewItem = (index: number) => {
    const updated = [...saleItems];
    updated[index].isNew = !updated[index].isNew;
    if (updated[index].isNew) {
      updated[index].itemId = undefined;
      updated[index].name = "";
      updated[index].categoryId = undefined;
    }
    setSaleItems(updated);
  };

  const totalAmount = saleItems.reduce(
    (sum, si) => sum + si.quantity * si.unitPrice,
    0,
  );
  const finalAmount = totalAmount - parseFloat(discount || "0");

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    for (const item of saleItems) {
      if (item.isNew && (!item.name || !item.categoryId)) {
        toast.error("New items need a name and category");
        return;
      }
    }
    setLoading(true);
    try {
      await api.post(`/companies/${companyId}/sales`, {
        customerId: selectedCustomer ? parseInt(selectedCustomer) : null,
        amount: finalAmount,
        discount: parseFloat(discount),
        note: saleNote,
        items: saleItems.map((si) =>
          si.isNew
            ? {
                name: si.name,
                categoryId: si.categoryId,
                buyingPrice: si.buyingPrice || 0,
                quantity: si.quantity,
                unitPrice: si.unitPrice,
              }
            : {
                itemId: si.itemId,
                quantity: si.quantity,
                unitPrice: si.unitPrice,
              },
        ),
      });
      toast.success("Sale recorded!");
      setIsSaleOpen(false);
      setSaleItems([]);
      setSelectedCustomer("");
      setDiscount("0");
      setSaleNote("");
      fetchData();
      fetchStoreItems();
    } catch {
      toast.error("Failed to record sale");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/companies/${companyId}/sales/customers`, {
        name: custName,
        phone: custPhone,
        email: custEmail,
      });
      setCustomers([...customers, res.data]);
      setSelectedCustomer(String(res.data.id));
      toast.success("Customer added");
      setIsCustomerOpen(false);
      setCustName("");
      setCustPhone("");
      setCustEmail("");
    } catch {
      toast.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(
        `/companies/${companyId}/store-items/categories`,
        { name: newCategoryName.trim() },
      );
      setCategories([...categories, res.data]);
      toast.success("Category added");
      setIsCategoryOpen(false);
      setNewCategoryName("");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
        <div className="flex items-center space-x-3">
          {hasRole([SystemRole.Owner, SystemRole.Sales]) && (
            <>
              <button
                onClick={() => setIsCategoryOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                + Category
              </button>
              <button
                onClick={() => setIsCustomerOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <UserPlus className="h-5 w-5 mr-1" /> Add Customer
              </button>
              <button
                onClick={() => setIsSaleOpen(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <ShoppingCart className="h-5 w-5 mr-1" /> New Sale
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No sales recorded yet.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {sale.customer?.name || "Walk-in"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.items?.length || 0} item(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${sale.totalAmount.toLocaleString()}
                    {sale.discount > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        (-${sale.discount})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.user?.name}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" /> Customers ({customers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{c.name}</p>
              {c.phone && <p className="text-xs text-gray-500">{c.phone}</p>}
              {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Categories ({categories.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
            >
              {cat.name} ({cat._count.items})
            </span>
          ))}
        </div>
      </div>

      {isSaleOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">New Sale</h2>
            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Customer
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Discount ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={addSaleLine}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Item
                  </button>
                </div>
                {saleItems.map((si, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-md p-3 mb-2"
                  >
                    <div className="flex items-center mb-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={si.isNew || false}
                          onChange={() => toggleNewItem(index)}
                          className="mr-2"
                        />
                        Create new item
                      </label>
                      <button
                        type="button"
                        onClick={() => removeSaleLine(index)}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {si.isNew ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Item Name
                          </label>
                          <input
                            type="text"
                            placeholder="Item name"
                            value={si.name || ""}
                            onChange={(e) =>
                              updateSaleLine(index, "name", e.target.value)
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Category
                          </label>
                          <select
                            value={si.categoryId || ""}
                            onChange={(e) =>
                              updateSaleLine(
                                index,
                                "categoryId",
                                parseInt(e.target.value),
                              )
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          >
                            <option value="">Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Cost Price
                          </label>
                          <input
                            type="number"
                            placeholder="Buying price"
                            value={si.buyingPrice || ""}
                            onChange={(e) =>
                              updateSaleLine(
                                index,
                                "buyingPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Selling Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Selling price"
                            value={si.unitPrice}
                            onChange={(e) =>
                              updateSaleLine(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Filter by Category
                            </label>
                            <select
                              value={si.categoryFilter || ""}
                              onChange={(e) =>
                                updateSaleLine(
                                  index,
                                  "categoryFilter",
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : "",
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                            >
                              <option value="">All Categories</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Select Item
                            </label>
                            <select
                              value={si.itemId || 0}
                              onChange={(e) =>
                                updateSaleLine(
                                  index,
                                  "itemId",
                                  parseInt(e.target.value),
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                            >
                              <option value={0}>Select item</option>
                              {storeItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (${item.sellingPrice}) — Stock:{" "}
                                  {item.quantity}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={si.quantity}
                              onChange={(e) =>
                                updateSaleLine(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                              placeholder="Qty"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Unit Price
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={si.unitPrice}
                              onChange={(e) =>
                                updateSaleLine(
                                  index,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                              placeholder="Price"
                            />
                          </div>
                          <span className="text-sm text-gray-500 self-end pb-1">
                            = ${(si.quantity * si.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <input
                  type="text"
                  value={saleNote}
                  onChange={(e) => setSaleNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-right space-y-1">
                <p className="text-sm text-gray-600">
                  Subtotal: ${totalAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Discount: -${discount || "0"}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  Total: ${finalAmount.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaleOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {loading ? "Saving..." : "Record Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCustomerOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Add Customer</h2>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {loading ? "Adding..." : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Add Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  placeholder="e.g., Electronics, Food..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
