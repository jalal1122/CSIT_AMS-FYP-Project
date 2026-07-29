import { useState } from "react";
import { Users, Plus, Key, Eye, UserX, Search } from "lucide-react";
import Badge from "../../components/shared/Badge";

export default function Faculty() {
  const [teachers, setTeachers] = useState([
    { _id: "1", name: "Dr. Ali Khan", username: "T-001", department: "Computer Science", activeAllocations: 3, accountStatus: "Active" },
    { _id: "2", name: "Prof. Sarah Ahmed", username: "T-002", department: "Software Engineering", activeAllocations: 2, accountStatus: "Active" },
    { _id: "3", name: "Engr. Usman", username: "T-003", department: "Information Technology", activeAllocations: 0, accountStatus: "Inactive" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Faculty Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage teacher accounts and access</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search faculty..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <button className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sky-50/50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Employee ID</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Active Classes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-800 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border border-sky-200 shrink-0">
                      {teacher.name.charAt(0)}
                    </div>
                    {teacher.name}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{teacher.username}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{teacher.department}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs text-slate-600 font-medium border border-slate-200">
                      {teacher.activeAllocations} Allocations
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={teacher.accountStatus === "Active" ? "success" : "neutral"}>
                      {teacher.accountStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Offboard Teacher">
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
