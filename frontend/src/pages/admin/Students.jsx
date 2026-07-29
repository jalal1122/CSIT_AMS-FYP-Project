import { useState } from "react";
import { Search, Filter, KeyRound, Smartphone, GitPullRequest, Eye, MoreVertical } from "lucide-react";
import Badge from "../../components/shared/Badge";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    { _id: "1", name: "Muhammad Ali", rollNo: "2022-001", username: "CSIT-2022-001", section: "A", semester: 3, batch: "BSIT 2026", status: "Active", deviceId: "Bound" },
    { _id: "2", name: "Fatima Khan", rollNo: "2022-002", username: "CSIT-2022-002", section: "A", semester: 3, batch: "BSIT 2026", status: "Active", deviceId: "Unbound" },
    { _id: "3", name: "Omar Sheikh", rollNo: "2022-003", username: "CSIT-2022-003", section: "B", semester: 3, batch: "BSIT 2026", status: "Inactive", deviceId: "Bound" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage student records, sections, and security settings</p>
        </div>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white border-b-0 rounded-b-none shadow-none">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, roll no, or username..." 
            className="input w-full pl-9 pr-4 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="btn-secondary flex items-center justify-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden border-t-0 rounded-t-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 border-y border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Batch / Section</th>
                <th className="px-6 py-4">Device</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs border border-emerald-200 shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-slate-800 font-semibold text-sm">{student.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{student.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">{student.rollNo}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 text-sm font-medium">{student.batch}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Sem {student.semester}</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Sec {student.section}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {student.deviceId === "Bound" ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-200">
                        <Smartphone className="w-3.5 h-3.5" /> Bound
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit border border-slate-200">Unbound</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={student.status === "Active" ? "success" : "neutral"}>
                      {student.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Unbind Device">
                        <Smartphone className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Transfer Section">
                        <GitPullRequest className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
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
