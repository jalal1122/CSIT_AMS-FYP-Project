import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments, createDepartment, fetchSubjects, createSubject, clearError } from "../../../store/slices/systemSlice.js";
import { Building2, Book, Plus, Trash2, Archive } from "lucide-react";

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
          <h2 className="text-2xl font-bold text-text-primary">Foundation</h2>
          <p className="text-text-muted">Manage Departments, Disciplines, and Subjects</p>
        </div>
        {activeTab === "departments" && (
          <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90">
            <Plus className="w-4 h-4" /> New Department
          </button>
        )}
        {activeTab === "subjects" && (
          <button className="bg-gradient-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90">
            <Plus className="w-4 h-4" /> New Subject
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-white/10 mb-6">
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "departments"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-white"
          }`}
          onClick={() => setActiveTab("departments")}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
          </div>
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "subjects"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-white"
          }`}
          onClick={() => setActiveTab("subjects")}
        >
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            Subjects
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="glass overflow-hidden">
        {isLoading && <div className="p-8 text-center text-text-muted">Loading...</div>}
        
        {!isLoading && activeTab === "departments" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-light border-b border-white/10 text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Disciplines</th>
                <th className="p-4 font-semibold">Batches</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {departments.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-text-muted">No departments found.</td></tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept._id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-mono text-primary font-medium">{dept.code}</td>
                    <td className="p-4 text-white font-medium">{dept.name}</td>
                    <td className="p-4 text-text-muted">0</td>
                    <td className="p-4 text-text-muted">0</td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Delete Department">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {!isLoading && activeTab === "subjects" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-light border-b border-white/10 text-text-muted text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold">Code</th>
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Credits</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subjects.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-text-muted">No subjects found.</td></tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-secondary font-medium">{sub.code}</td>
                    <td className="p-4 text-white font-medium">{sub.name}</td>
                    <td className="p-4 text-text-muted">{sub.creditHours}</td>
                    <td className="p-4">
                      {sub.isArchived ? (
                        <span className="px-2 py-1 bg-surface-light text-text-muted rounded text-xs">Archived</span>
                      ) : (
                        <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs border border-secondary/20">Active</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Archive Subject">
                        <Archive className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
