import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchStudents, resetStudentPassword, resetStudentDevice, updateStudentStatus, transferStudent } from "../../store/slices/studentSlice.js";
import { fetchBatches } from "../../store/slices/academicSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { Search, Filter, KeyRound, Smartphone, GitPullRequest, Eye, UserX, UserCheck } from "lucide-react";
import Badge from "../../components/shared/Badge";
import SectionTransferModal from "../../components/admin/SectionTransferModal";
import AddStudentModal from "../../components/admin/AddStudentModal";
import EmptyState from "../../components/shared/EmptyState";

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ batchId: "", section: "", deviceStatus: "", accountStatus: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const itemsPerPage = 10;
  
  const dispatch = useDispatch();
  const { students, isLoading } = useSelector((state) => state.student);
  const { batches } = useSelector((state) => state.academic);

  useEffect(() => {
    dispatch(fetchStudents(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  // Handle pagination reset on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleTransferStudent = (student) => {
    setSelectedStudentForTransfer(student);
    setTransferModalOpen(true);
  };

  const closeTransferModal = (wasSuccessful) => {
    setTransferModalOpen(false);
    setSelectedStudentForTransfer(null);
    if (wasSuccessful === true) {
      dispatch(fetchStudents(filters));
    }
  };

  const closeAddModal = (wasSuccessful) => {
    setAddModalOpen(false);
    setStudentToEdit(null);
    if (wasSuccessful === true) {
      dispatch(fetchStudents(filters));
    }
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setAddModalOpen(true);
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Student Management</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">View, manage, and transfer students</p>
        </div>
        <button onClick={() => setAddModalOpen(true)} className="btn-primary w-full sm:w-auto text-sm justify-center">
          Add Student
        </button>
      </div>

      <div className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-between items-stretch sm:items-center bg-white border-b-0 rounded-b-none shadow-none">
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, roll no, or username..." 
            className="input w-full pl-9 pr-4 py-2 text-xs sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-3.5 ${showFilters ? 'bg-slate-100' : ''}`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-slate-50 p-3 sm:p-4 border-x border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Batch</label>
            <select 
              className="input w-full py-1.5 sm:py-2 text-xs sm:text-sm" 
              value={filters.batchId} 
              onChange={(e) => setFilters({...filters, batchId: e.target.value})}
            >
              <option value="">All Batches</option>
              {batches?.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Section</label>
            <input 
              type="text" 
              placeholder="e.g. A" 
              className="input w-full py-2 uppercase" 
              value={filters.section}
              onChange={(e) => setFilters({...filters, section: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Device Status</label>
            <select 
              className="input w-full py-2" 
              value={filters.deviceStatus} 
              onChange={(e) => setFilters({...filters, deviceStatus: e.target.value})}
            >
              <option value="">All</option>
              <option value="bound">Bound</option>
              <option value="unbound">Unbound</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Account Status</label>
            <select 
              className="input w-full py-2" 
              value={filters.accountStatus} 
              onChange={(e) => setFilters({...filters, accountStatus: e.target.value})}
            >
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}

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
                {(() => {
                  const filteredStudents = students.filter(s => 
                    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.info?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                  
                  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const currentStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

                  return currentStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs border border-emerald-200 shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-800 font-semibold text-xs sm:text-sm truncate">{student.name}</div>
                          <div className="text-[11px] sm:text-xs text-slate-500 font-mono mt-0.5 truncate">{student.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 font-mono text-xs sm:text-sm">{student.info?.rollNo || "-"}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-slate-700 text-xs sm:text-sm font-medium">{student.info?.batchId?.name || "-"}</div>
                      <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Sem {student.info?.semester || student.info?.batchId?.currentSemester || "-"}</span>
                        <span>Sec {student.info?.section || "-"}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {student.deviceBinding?.deviceId ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Bound
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit border border-slate-200">Unbound</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <Badge variant={student.accountStatus === "Active" ? "success" : "neutral"}>
                        {student.accountStatus}
                      </Badge>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleStatus(student._id, student.accountStatus)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors" title={student.accountStatus === "Active" ? "Deactivate" : "Activate"}>
                          {student.accountStatus === "Active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleEditStudent(student)} 
                          className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" 
                          title="Edit Student"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </button>
                        <button onClick={() => handleResetPassword(student._id)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Reset Password">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetDevice(student._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Unbind Device">
                          <Smartphone className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleTransferStudent(student)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                          title="Change Section"
                        >  <GitPullRequest className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && students && students.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-200 bg-slate-50">
            <div className="text-xs sm:text-sm text-slate-500 text-center sm:text-left">
              Showing <span className="font-semibold text-slate-700">{((currentPage - 1) * 10) + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * 10, students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.info?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) || s.username?.toLowerCase().includes(searchTerm.toLowerCase())).length)}</span> of <span className="font-semibold text-slate-700">{students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.info?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) || s.username?.toLowerCase().includes(searchTerm.toLowerCase())).length}</span> results
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex-1 sm:flex-initial px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button 
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(students.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.info?.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) || s.username?.toLowerCase().includes(searchTerm.toLowerCase())).length / 10)}
                className="flex-1 sm:flex-initial px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {transferModalOpen && selectedStudentForTransfer && (
        <SectionTransferModal 
          student={selectedStudentForTransfer} 
          onClose={closeTransferModal} 
        />
      )}

      {addModalOpen && (
        <AddStudentModal 
          student={studentToEdit} 
          onClose={closeAddModal} 
        />
      )}
    </div>
  );
}
