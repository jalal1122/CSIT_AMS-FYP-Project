import { useState } from "react";
import { Search, Filter, KeyRound, Smartphone, GitPullRequest, Eye } from "lucide-react";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    { _id: "1", name: "Muhammad Ali", rollNo: "2022-001", username: "CSIT-2022-001", section: "A", semester: 3, batch: "BSIT 2026", status: "Active", deviceId: "Bound" },
    { _id: "2", name: "Fatima Khan", rollNo: "2022-002", username: "CSIT-2022-002", section: "A", semester: 3, batch: "BSIT 2026", status: "Active", deviceId: "Unbound" },
    { _id: "3", name: "Omar Sheikh", rollNo: "2022-003", username: "CSIT-2022-003", section: "B", semester: 3, batch: "BSIT 2026", status: "Inactive", deviceId: "Bound" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Student Management</h2>
          <p className="text-text-muted">Manage student records, sections, and security settings</p>
        </div>
      </div>

      <div className="glass p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input 
            type="text" 
            placeholder="Search by name, roll no, or username..." 
            className="w-full bg-surface-light border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-surface-light border border-white/10 rounded-lg text-white flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="glass overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-light border-b border-white/10 text-text-muted text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Student</th>
              <th className="p-4 font-semibold">Roll No</th>
              <th className="p-4 font-semibold">Batch / Section</th>
              <th className="p-4 font-semibold">Device</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.map((student) => (
              <tr key={student._id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{student.name}</div>
                      <div className="text-xs text-text-muted font-mono">{student.username}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-text-muted font-mono text-sm">{student.rollNo}</td>
                <td className="p-4">
                  <div className="text-white text-sm">{student.batch}</div>
                  <div className="text-xs text-text-muted">Sem {student.semester} • Sec {student.section}</div>
                </td>
                <td className="p-4">
                  {student.deviceId === "Bound" ? (
                    <span className="flex items-center gap-1 text-xs text-secondary bg-secondary/10 px-2 py-1 rounded w-fit border border-secondary/20">
                      <Smartphone className="w-3 h-3" /> Bound
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded w-fit border border-white/10">Unbound</span>
                  )}
                </td>
                <td className="p-4">
                  {student.status === "Active" ? (
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block mr-2 shadow-[0_0_8px_#10B981]"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-danger inline-block mr-2 shadow-[0_0_8px_#EF4444]"></span>
                  )}
                  <span className="text-sm text-text-muted">{student.status}</span>
                </td>
                <td className="p-4 text-right space-x-1">
                  <button className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Reset Password">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Unbind Device">
                    <Smartphone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Transfer Section">
                    <GitPullRequest className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
