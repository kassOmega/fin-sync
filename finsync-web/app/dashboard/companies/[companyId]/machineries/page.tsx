"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, Clock, Forklift, Plus, Wrench } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MachineriesPage() {
  const { companyId } = useParams();
  const { hasRole } = useAuthStore();

  const [machines, setMachines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [machineData, setMachineData] = useState({
    name: "",
    category: "Heavy Machinery",
  });

  const fetchMachines = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/machineries`);
      setMachines(res.data);
    } catch (error) {
      toast.error("Failed to load machineries");
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [companyId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${companyId}/machineries`, machineData);
      toast.success("Machinery registered");
      setIsModalOpen(false);
      setMachineData({ name: "", category: "Heavy Machinery" });
      fetchMachines();
    } catch (error) {
      toast.error("Failed to register machinery");
    }
  };

  const handleLogHours = async (id, hours) => {
    try {
      const res = await api.post(
        `/companies/${companyId}/machineries/${id}/log-hours`,
        { hours: parseFloat(hours) },
      );
      if (res.data.maintenanceDue) {
        toast(`Maintenance Due! ${res.data.machine.name} needs servicing.`, {
          icon: "⚠️",
        });
      } else {
        toast.success("Hours logged successfully");
      }
      fetchMachines();
    } catch (error) {
      toast.error("Failed to log hours");
    }
  };

  const handleCompleteMaintenance = async (id) => {
    try {
      await api.post(
        `/companies/${companyId}/machineries/${id}/complete-maintenance`,
      );
      toast.success("Maintenance completed. Status reset.");
      fetchMachines();
    } catch (error) {
      toast.error("Failed to update maintenance status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Machineries & Vehicles
        </h1>
        {hasRole([SystemRole.Owner]) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-1" /> Register Machinery
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((machine) => {
          const hoursSinceMaintenance =
            machine.runningHours - machine.lastMaintenanceHours;
          const maintenanceDue = hoursSinceMaintenance >= 250;

          return (
            <div
              key={machine.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Forklift className="h-8 w-8 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {machine.name}
                    </h3>
                    <p className="text-xs text-gray-500">{machine.category}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    machine.status === "WORKING"
                      ? "bg-green-100 text-green-800"
                      : machine.status === "MAINTENANCE"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {machine.status}
                </span>
              </div>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Total Hours:</span>
                  <span className="font-medium text-gray-900">
                    {machine.runningHours} hrs
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Since Last Service:</span>
                  <span
                    className={`font-medium ${maintenanceDue ? "text-red-600" : "text-gray-900"}`}
                  >
                    {hoursSinceMaintenance} hrs
                  </span>
                </div>

                {maintenanceDue && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-center">
                    <Wrench className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-red-800 font-medium mb-2">
                      Maintenance Required
                    </p>
                    {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
                      <button
                        onClick={() => handleCompleteMaintenance(machine.id)}
                        className="text-xs flex items-center mx-auto text-white bg-red-600 px-3 py-1 rounded-md hover:bg-red-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Mark as
                        Serviced
                      </button>
                    )}
                  </div>
                )}

                {!maintenanceDue &&
                  hasRole([SystemRole.Owner, SystemRole.OperatorDriver]) && (
                    <button
                      onClick={() => {
                        const hours = prompt("Enter hours worked:");
                        if (hours) handleLogHours(machine.id, hours);
                      }}
                      className="mt-4 w-full flex items-center justify-center text-sm text-indigo-600 border border-indigo-200 rounded-md py-2 hover:bg-indigo-50"
                    >
                      <Clock className="h-4 w-4 mr-1" /> Log Working Hours
                    </button>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Machinery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Register New Machinery</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Machinery Name
                </label>
                <input
                  type="text"
                  required
                  value={machineData.name}
                  onChange={(e) =>
                    setMachineData({ ...machineData, name: e.target.value })
                  }
                  placeholder="e.g., CAT 320 Excavator"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={machineData.category}
                  onChange={(e) =>
                    setMachineData({ ...machineData, category: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                >
                  <option>Heavy Machinery</option>
                  <option>Transport Vehicle</option>
                  <option>Power Tool</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
