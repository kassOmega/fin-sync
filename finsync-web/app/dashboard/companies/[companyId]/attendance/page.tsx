"use client";

import api from "@/lib/api";
import { CheckCircle, Clock, UserX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  remarks: string | null;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export default function AttendancePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [attRes, empRes] = await Promise.all([
        api.get(`/companies/${companyId}/attendance?date=${date}`),
        api.get(`/companies/${companyId}/employees`),
      ]);
      setRecords(attRes.data);
      setEmployees(empRes.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchData();
  }, [companyId, date]);

  const markAttendance = async (employeeId: number, status: string) => {
    try {
      await api.post(`/companies/${companyId}/attendance/${employeeId}`, {
        date,
        status,
      });
      toast.success(`Marked ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to mark");
    }
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case "PRESENT":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ABSENT":
        return <UserX className="h-4 w-4 text-red-500" />;
      case "LATE":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "HALF_DAY":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getRecord = (empId: number) =>
    records.find((r) => r.employeeId === empId);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  if (!companyId) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Daily Attendance</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setLoading(true);
          }}
          className="border rounded-md p-2 text-sm"
        />
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Mark
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((emp) => {
              const rec = getRecord(emp.id);
              return (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {emp.employeeCode}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center gap-1">
                    {rec ? (
                      <>
                        {statusIcon(rec.status)} {rec.status}
                      </>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {["PRESENT", "LATE", "HALF_DAY", "ABSENT"].map((s) => (
                        <button
                          key={s}
                          onClick={() => markAttendance(emp.id, s)}
                          className={`px-2 py-1 text-xs rounded ${rec?.status === s ? "bg-indigo-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
