import { useState } from "react";
import { X, UserPlus } from "lucide-react";

export default function AddTeacherModal({ isOpen, onClose, onSubmit, departments }) {
  const [formData, setFormData] = useState({ name: "", username: "", departmentId: "", phone: "" });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", username: "", departmentId: "", phone: "" });
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
            <UserPlus className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-lg">Add New Teacher</h3>
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Dr. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Employee ID (Username)</label>
            <input 
              type="text" 
              required
              placeholder="e.g. EMP12345"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. 03001234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Department</label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-white"
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
              className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200"
            >
              Add Teacher
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
