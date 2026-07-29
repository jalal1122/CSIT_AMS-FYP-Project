import { useState } from "react";
import { Users, Plus, Edit2, UserX } from "lucide-react";

export default function Faculty() {
  const [teachers, setTeachers] = useState([
    { _id: "1", name: "Dr. Ali Khan", username: "T-001", department: "Computer Science", activeAllocations: 3, accountStatus: "Active" },
    { _id: "2", name: "Prof. Sarah Ahmed", username: "T-002", department: "Software Engineering", activeAllocations: 2, accountStatus: "Active" },
    { _id: "3", name: "Engr. Usman", username: "T-003", department: "Information Technology", activeAllocations: 0, accountStatus: "Inactive" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Faculty Management</h2>
          <p className="text-text-muted">Manage teacher accounts and access</p>
        </div>
        <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="glass overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-light border-b border-white/10 text-text-muted text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Employee ID</th>
              <th className="p-4 font-semibold">Department</th>
              <th className="p-4 font-semibold">Active Classes</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teachers.map((teacher) => (
              <tr key={teacher._id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-white font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {teacher.name.charAt(0)}
                  </div>
                  {teacher.name}
                </td>
                <td className="p-4 font-mono text-text-muted">{teacher.username}</td>
                <td className="p-4 text-text-muted">{teacher.department}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-surface-light rounded-md text-xs text-white">
                    {teacher.activeAllocations} Allocations
                  </span>
                </td>
                <td className="p-4">
                  {teacher.accountStatus === "Active" ? (
                    <span className="px-2 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-danger/10 text-danger border border-danger/20 rounded-full text-xs">Inactive</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Edit Teacher">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Offboard Teacher">
                    <UserX className="w-4 h-4" />
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
