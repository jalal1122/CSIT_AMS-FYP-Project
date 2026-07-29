import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments, createDepartment, fetchSubjects, createSubject, clearError } from "../../../store/slices/systemSlice.js";
import { Building2, Book, Plus, Trash2, Archive, Pencil } from "lucide-react";
import Badge from "../../components/shared/Badge";
import EmptyState from "../../components/shared/EmptyState";

export default function Foundation() {
  const [activeTab, setActiveTab] = useState("departments");
  const dispatch = useDispatch();
  const { departments, subjects, isLoading, error } = useSelector((state) => state.system);

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchSubjects());
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Foundation</h2>
          <p className="text-slate-500 text-sm mt-1">Manage Departments, Disciplines, and Subjects</p>
        </div>
        {activeTab === "departments" && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Department
          </button>
        )}
        {activeTab === "subjects" && (
          <button className="btn-primary flex items-center gap-2">
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
            activeTab === "subjects"
              ? "border-sky-500 text-sky-600"
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
              <EmptyState icon={Building2} title="No departments found" subtitle="Get started by creating a new department." actionLabel="New Department" />
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
                          <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Edit Department">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Delete Department">
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
              <EmptyState icon={Book} title="No subjects found" subtitle="Get started by creating a new subject." actionLabel="New Subject" />
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
                          <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Edit Subject">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors" title="Archive Subject">
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
    </div>
  );
}
