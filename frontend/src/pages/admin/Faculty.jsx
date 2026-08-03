import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeachers, createTeacher, resetTeacherPassword, offboardTeacher, updateTeacherStatus } from "../../store/slices/facultySlice.js";
import { fetchDepartments } from "../../store/slices/systemSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { Users, Plus, Key, Eye, UserX, Search, UserCheck, Trash2, Edit } from "lucide-react";
import Badge from "../../components/shared/Badge";
import CreateUserModal from "../../components/admin/CreateUserModal.jsx";
import EditUserModal from "../../components/admin/EditUserModal.jsx";
import EmptyState from "../../components/shared/EmptyState";

export default function Faculty() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const dispatch = useDispatch();
  const { teachers, isLoading, error } = useSelector((state) => state.faculty);
  const { departments } = useSelector((state) => state.system);

  useEffect(() => {
    dispatch(fetchTeachers());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const handleAddTeacher = async (data) => {
    try {
      await dispatch(createTeacher(data)).unwrap();
      setIsAddModalOpen(false);
      dispatch(fetchTeachers());
      dispatch(addToast({ title: "Success", message: "Teacher added successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm("Are you sure you want to reset this teacher's password?")) return;
    try {
      await dispatch(resetTeacherPassword(id)).unwrap();
      dispatch(addToast({ title: "Success", message: "Password reset successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleOffboard = async (id) => {
    if (!window.confirm("Are you sure you want to offboard this teacher? This will reassign their classes.")) return;
    try {
      await dispatch(offboardTeacher(id)).unwrap();
      dispatch(fetchTeachers());
      dispatch(addToast({ title: "Success", message: "Teacher offboarded successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await dispatch(updateTeacherStatus({ id, status: newStatus })).unwrap();
      dispatch(fetchTeachers());
      dispatch(addToast({ title: "Success", message: `Teacher marked as ${newStatus}`, type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const filteredTeachers = teachers?.filter(teacher => {
    const searchLower = searchQuery.toLowerCase();
    return (
      teacher.name?.toLowerCase().includes(searchLower) ||
      teacher.username?.toLowerCase().includes(searchLower) ||
      (teacher.info?.departmentId?.name || teacher.department || "").toLowerCase().includes(searchLower)
    );
  }) || [];

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
            <input 
              type="text" 
              placeholder="Search faculty..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : !teachers || teachers.length === 0 ? (
            <EmptyState icon={Users} title="No teachers found" subtitle="Add your first teacher to get started." actionLabel="Add Teacher" onAction={() => setIsAddModalOpen(true)} />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sky-50/50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border border-sky-200 shrink-0">
                        {teacher.name.charAt(0)}
                      </div>
                      {teacher.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{teacher.username}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{teacher.info?.departmentId?.name || teacher.department || "-"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={teacher.accountStatus === "Active" ? "success" : "neutral"}>
                        {teacher.accountStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleStatus(teacher._id, teacher.accountStatus)} className={`p-1.5 rounded-md transition-colors ${teacher.accountStatus === "Active" ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`} title={teacher.accountStatus === "Active" ? "Deactivate" : "Activate"}>
                          {teacher.accountStatus === "Active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setEditingTeacher(teacher)} className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Edit Teacher">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetPassword(teacher._id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password">
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOffboard(teacher._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Offboard Teacher">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTeachers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No teachers found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateUserModal
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => dispatch(fetchTeachers())}
        defaultRole="teacher"
        fixedRole={true}
      />
      
      {editingTeacher && (
        <EditUserModal
          isOpen={!!editingTeacher}
          onClose={() => setEditingTeacher(null)}
          user={editingTeacher}
          onSuccess={() => dispatch(fetchTeachers())}
        />
      )}
    </div>
  );
}
