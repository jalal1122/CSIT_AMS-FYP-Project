import { useState } from "react";
import { X, GraduationCap } from "lucide-react";

export default function NewDisciplineModal({ isOpen, onClose, onSubmit, departments }) {
  const [formData, setFormData] = useState({ name: "", code: "", totalSemesters: 8, departmentId: "" });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", code: "", totalSemesters: 8, departmentId: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-lg">New Discipline</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Discipline Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Computer Science and Information Technology"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Discipline Code</label>
              <input 
                type="text" 
                required
                placeholder="e.g. BSCS"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Total Semesters</label>
              <input 
                type="number" 
                required
                min="1"
                max="12"
                value={formData.totalSemesters}
                onChange={(e) => setFormData({ ...formData, totalSemesters: parseInt(e.target.value) || 8 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors bg-white"
            >
              <option value="">Select a department...</option>
              {departments?.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
            >
              Create Discipline
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
