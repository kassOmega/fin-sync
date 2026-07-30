"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { Check, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation: string;
  employmentType: string;
  role?: string;
  user?: { id: number; name: string };
}

interface EmployeeSelectorProps {
  companyId: number;
  roleFilter?: SystemRole | SystemRole[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  multiple?: boolean;
}

export default function EmployeeSelector({
  companyId,
  roleFilter,
  selectedIds,
  onChange,
  multiple = true,
}: EmployeeSelectorProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    api
      .get(`/companies/${companyId}/employees`)
      .then((res) => {
        let list: Employee[] = res.data || [];
        if (roleFilter) {
          const roles = Array.isArray(roleFilter) ? roleFilter : [roleFilter];
          list = list.filter(
            (e) => e.role && roles.includes(e.role as SystemRole),
          );
        }
        setEmployees(list);
      })
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, [companyId, roleFilter]);

  const filtered = search
    ? employees.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          e.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
          e.designation?.toLowerCase().includes(search.toLowerCase()),
      )
    : employees;

  const toggle = (id: number) => {
    if (multiple) {
      onChange(
        selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id],
      );
    } else {
      onChange(selectedIds.includes(id) ? [] : [id]);
    }
  };

  const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));

  return (
    <div className="space-y-3">
      {/* Selected badges */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedEmployees.map((e) => (
            <span
              key={e.id}
              className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
            >
              {e.firstName} {e.lastName}
              <button
                onClick={() => toggle(e.id)}
                className="ml-1 hover:text-indigo-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
        />
      </div>

      {/* List */}
      <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto bg-white">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No employees found
          </div>
        ) : (
          filtered.map((e) => {
            const isSelected = selectedIds.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                  isSelected ? "bg-indigo-50" : ""
                }`}
              >
                <div className="text-left">
                  <span className="font-medium text-gray-900">
                    {e.firstName} {e.lastName}
                  </span>
                  <span className="text-gray-500 ml-2">
                    {e.employeeCode} · {e.designation || e.employmentType || ""}
                  </span>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
