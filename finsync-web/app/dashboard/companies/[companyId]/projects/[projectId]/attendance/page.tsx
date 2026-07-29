"use client";

import api from "@/lib/api";
import { CheckCircle, Clock, UserX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}
interface AttendanceRecord {
  id?: number;
  employeeId: number;
  status: string;
  employee: Employee;
}

export default function ProjectAttendancePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [attRes, empRes] = await Promise.all([
        api.get(
          `/companies/${companyId}/projects/${projectId}/attendance?date=${date}`,
        ),
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
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchData();
  }, [companyId, projectId, date]);

  const mark = async (employeeId: number, status: string) => {
    try {
      await api.post(
        `/companies/${companyId}/projects/${projectId}/attendance/${employeeId}`,
        { date, status },
      );
      toast.success(`Marked ${status}`);
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  const getRec = (empId: number) => records.find((r) => r.employeeId === empId);
  const icons: Record<string, React.ReactNode> = {
    PRESENT: <CheckCircle className="h-4 w-4 text-green-500" />,
    ABSENT: <UserX className="h-4 w-4 text-red-500" />,
    LATE: <Clock className="h-4 w-4 text-yellow-500" />,
    HALF_DAY: <Clock className="h-4 w-4 text-orange-500" />,
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Project Attendance</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setLoading(true);
          }}
          className="border border-gray-300 rounded-md p-2 text-sm bg-white text-gray-900"
        />
      </div>
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
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
          <tbody>
            {employees.map((emp) => {
              const rec = getRec(emp.id);
              return (
                <tr key={emp.id}>
                  <td className="px-4 py-3 text-sm font-mono">
                    {emp.employeeCode}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {emp.firstName} {emp.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm flex items-center gap-1">
                    {rec ? (
                      <>
                        {icons[rec.status]} {rec.status}
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
                          onClick={() => mark(emp.id, s)}
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
