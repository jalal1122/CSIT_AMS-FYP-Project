import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment, fetchSubjects, createSubject, updateSubject, fetchDisciplines, createDiscipline, updateDiscipline, deleteDiscipline, clearError } from "../../store/slices/systemSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";
import { Building2, Book, Plus, Trash2, Archive, Pencil, GraduationCap } from "lucide-react";
import Badge from "../../components/shared/Badge";
import EmptyState from "../../components/shared/EmptyState";
import NewDepartmentModal from "../../components/admin/NewDepartmentModal.jsx";
import EditDepartmentModal from "../../components/admin/EditDepartmentModal.jsx";
import NewSubjectModal from "../../components/admin/NewSubjectModal.jsx";
import EditSubjectModal from "../../components/admin/EditSubjectModal.jsx";
import NewDisciplineModal from "../../components/admin/NewDisciplineModal.jsx";
import EditDisciplineModal from "../../components/admin/EditDisciplineModal.jsx";

export default function Foundation() {
  const [activeTab, setActiveTab] = useState("departments");
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  
  const [isSubjModalOpen, setIsSubjModalOpen] = useState(false);
  const [editingSubj, setEditingSubj] = useState(null);

  const [isDiscModalOpen, setIsDiscModalOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState(null);

  const dispatch = useDispatch();
  const { departments, subjects, disciplines, isLoading, error } = useSelector((state) => state.system);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchSubjects());
    dispatch(fetchDisciplines());
  }, [dispatch]);

  const handleCreateDepartment = async (data) => {
    try {
      await dispatch(createDepartment(data)).unwrap();
      setIsDeptModalOpen(false);
      dispatch(fetchDepartments());
      dispatch(addToast({ title: "Success", message: "Department created successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleUpdateDepartment = async (id, data) => {
    try {
      await dispatch(updateDepartment({ id, data })).unwrap();
      setEditingDept(null);
      dispatch(fetchDepartments());
      dispatch(addToast({ title: "Success", message: "Department updated successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await dispatch(deleteDepartment(id)).unwrap();
      dispatch(fetchDepartments());
      dispatch(addToast({ title: "Success", message: "Department deleted successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleCreateSubject = async (data) => {
    try {
      await dispatch(createSubject(data)).unwrap();
      setIsSubjModalOpen(false);
      dispatch(fetchSubjects());
      dispatch(addToast({ title: "Success", message: "Subject created successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleUpdateSubject = async (id, data) => {
    try {
      await dispatch(updateSubject({ id, data })).unwrap();
      setEditingSubj(null);
      dispatch(fetchSubjects());
      dispatch(addToast({ title: "Success", message: "Subject updated successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleArchiveSubject = async (sub) => {
    if (!window.confirm(`Are you sure you want to ${sub.isArchived ? 'unarchive' : 'archive'} this subject?`)) return;
    try {
      await dispatch(updateSubject({ id: sub._id, data: { isArchived: !sub.isArchived } })).unwrap();
      dispatch(fetchSubjects());
      dispatch(addToast({ title: "Success", message: `Subject ${sub.isArchived ? 'unarchived' : 'archived'} successfully`, type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleCreateDiscipline = async (data) => {
    try {
      await dispatch(createDiscipline(data)).unwrap();
      setIsDiscModalOpen(false);
      dispatch(fetchDisciplines());
      dispatch(addToast({ title: "Success", message: "Discipline created successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleUpdateDiscipline = async (id, data) => {
    try {
      await dispatch(updateDiscipline({ id, data })).unwrap();
      setEditingDisc(null);
      dispatch(fetchDisciplines());
      dispatch(addToast({ title: "Success", message: "Discipline updated successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  const handleDeleteDiscipline = async (id) => {
    if (!window.confirm("Are you sure you want to delete this discipline?")) return;
    try {
      await dispatch(deleteDiscipline(id)).unwrap();
      dispatch(fetchDisciplines());
      dispatch(addToast({ title: "Success", message: "Discipline deleted successfully", type: "success" }));
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err, type: "error" }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Foundation</h2>
          <p className="text-slate-500 text-sm mt-1">Manage Departments, Disciplines, and Subjects</p>
        </div>
        {activeTab === "departments" && (
          <button onClick={() => setIsDeptModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Department
          </button>
        )}
        {activeTab === "disciplines" && (
          <button onClick={() => setIsDiscModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Discipline
          </button>
        )}
        {activeTab === "subjects" && (
          <button onClick={() => setIsSubjModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Subject
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6">
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "departments"
              ? "border-sky-500 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("departments")}
        >
          <Building2 className="w-4 h-4" />
          Departments
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "disciplines"
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("disciplines")}
        >
          <GraduationCap className="w-4 h-4" />
          Disciplines
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "subjects"
              ? "border-indigo-500 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
          onClick={() => setActiveTab("subjects")}
        >
          <Book className="w-4 h-4" />
          Subjects
        </button>
      </div>

      {/* Content */}
      <div className="card p-0 overflow-hidden">
        {isLoading && <div className="p-12 text-center text-slate-500">Loading...</div>}
        
        {!isLoading && activeTab === "departments" && (
          <div className="overflow-x-auto">
            {departments.length === 0 ? (
              <EmptyState icon={Building2} title="No departments found" subtitle="Get started by creating a new department." actionLabel="New Department" onAction={() => setIsDeptModalOpen(true)} />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sky-50/50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Disciplines</th>
                    <th className="px-6 py-4">Batches</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-sky-600 font-medium bg-sky-50/30">{dept.code}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{dept.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">0</td>
                      <td className="px-6 py-4 text-sm text-slate-500">0</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingDept(dept)} className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Edit Department">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDepartment(dept._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Delete Department">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!isLoading && activeTab === "disciplines" && (
          <div className="overflow-x-auto">
            {(!disciplines || disciplines.length === 0) ? (
              <EmptyState icon={GraduationCap} title="No disciplines found" subtitle="Get started by creating a new discipline." actionLabel="New Discipline" onAction={() => setIsDiscModalOpen(true)} />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50/50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Semesters</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disciplines.map((disc) => (
                    <tr key={disc._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-emerald-600 font-medium bg-emerald-50/30">{disc.code}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{disc.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{disc.departmentId?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{disc.totalSemesters}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingDisc(disc)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-colors" title="Edit Discipline">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteDiscipline(disc._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Delete Discipline">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!isLoading && activeTab === "subjects" && (
          <div className="overflow-x-auto">
            {subjects.length === 0 ? (
              <EmptyState icon={Book} title="No subjects found" subtitle="Get started by creating a new subject." actionLabel="New Subject" onAction={() => setIsSubjModalOpen(true)} />
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-sky-50/50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Credits</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm font-mono text-emerald-600 font-medium bg-emerald-50/30">{sub.code}</td>
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">{sub.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{sub.creditHours}</td>
                      <td className="px-6 py-4">
                        <Badge variant={sub.isArchived ? 'neutral' : 'success'}>
                          {sub.isArchived ? 'Archived' : 'Active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingSubj(sub)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors" title="Edit Subject">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleArchiveSubject(sub)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title={sub.isArchived ? "Unarchive Subject" : "Archive Subject"}>
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <NewDepartmentModal 
        isOpen={isDeptModalOpen} 
        onClose={() => setIsDeptModalOpen(false)} 
        onSubmit={handleCreateDepartment} 
      />

      <EditDepartmentModal
        isOpen={!!editingDept}
        onClose={() => setEditingDept(null)}
        onSubmit={handleUpdateDepartment}
        department={editingDept}
      />

      <NewDisciplineModal
        isOpen={isDiscModalOpen}
        onClose={() => setIsDiscModalOpen(false)}
        onSubmit={handleCreateDiscipline}
        departments={departments}
      />

      <EditDisciplineModal
        isOpen={!!editingDisc}
        onClose={() => setEditingDisc(null)}
        onSubmit={handleUpdateDiscipline}
        discipline={editingDisc}
        departments={departments}
      />

      <NewSubjectModal 
        isOpen={isSubjModalOpen} 
        onClose={() => setIsSubjModalOpen(false)} 
        onSubmit={handleCreateSubject}
        departments={departments}
      />

      <EditSubjectModal
        isOpen={!!editingSubj}
        onClose={() => setEditingSubj(null)}
        onSubmit={handleUpdateSubject}
        subject={editingSubj}
        departments={departments}
      />
    </div>
  );
}
