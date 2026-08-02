import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudents, resetStudentPassword, resetStudentDevice, updateStudentStatus, transferStudent } from "../../store/slices/studentSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { Search, Filter, KeyRound, Smartphone, GitPullRequest, Eye, UserX, UserCheck } from "lucide-react";
import Badge from "../../components/shared/Badge";
import EmptyState from "../../components/shared/EmptyState";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();
  const { students, isLoading } = useSelector((state) => state.student);

  useEffect(() => {
    dispatch(fetchStudents());
  }, [dispatch]);

  const handleResetPassword = async (id) => {
    if (!window.confirm("Are you sure you want to reset this student's password?")) return;
    try {
      await dispatch(resetStudentPassword(id)).unwrap();
      dispatch(addToast({ title: "Success", message: "Password reset successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleResetDevice = async (id) => {
    if (!window.confirm("Are you sure you want to reset this student's device binding?")) return;
    try {
      await dispatch(resetStudentDevice(id)).unwrap();
      dispatch(fetchStudents());
      dispatch(addToast({ title: "Success", message: "Device reset successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    try {
      await dispatch(updateStudentStatus({ id, status: newStatus })).unwrap();
      dispatch(fetchStudents());
      dispatch(addToast({ title: "Success", message: `Student marked as ${newStatus}`, type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleTransferStudent = async (student) => {
    const newSection = window.prompt(`Transfer ${student.name} from Section ${student.info?.section} to which section? (e.g., A, B, C)`);
    if (!newSection || newSection.trim() === "") return;
    
    if (newSection.trim() === student.info?.section) {
      dispatch(addToast({ title: "Warning", message: "Student is already in this section", type: "warning" }));
      return;
    }

    try {
      await dispatch(transferStudent({ id: student._id, newSection: newSection.trim() })).unwrap();
      dispatch(fetchStudents());
      dispatch(addToast({ title: "Success", message: `Student transferred to section ${newSection.trim()}`, type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

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
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading...</div>
          ) : !students || students.length === 0 ? (
            <EmptyState icon={Smartphone} title="No students found" subtitle="No students have been added yet." />
          ) : (
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
                {students
                  .filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.info?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) || s.username?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((student) => (
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
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{student.info?.rollNo || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 text-sm font-medium">{student.info?.batchId?.name || "-"}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Sem {student.info?.currentSemester || "-"}</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Sec {student.info?.section || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.info?.deviceId ? (
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-200">
                          <Smartphone className="w-3.5 h-3.5" /> Bound
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit border border-slate-200">Unbound</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={student.accountStatus === "Active" ? "success" : "neutral"}>
                        {student.accountStatus}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleStatus(student._id, student.accountStatus)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors" title={student.accountStatus === "Active" ? "Deactivate" : "Activate"}>
                          {student.accountStatus === "Active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleResetPassword(student._id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetDevice(student._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Unbind Device">
                          <Smartphone className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleTransferStudent(student)} className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Transfer Section">
                          <GitPullRequest className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
