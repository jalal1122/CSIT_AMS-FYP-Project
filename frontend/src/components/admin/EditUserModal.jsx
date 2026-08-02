import React, { useState, useEffect } from "react";
import { X, Edit, Shield, Save } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function EditUserModal({ isOpen, onClose, user, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    departmentId: "", 
    batchId: "", 
    section: "" 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isOpen) {
      api.get("/api/v2/system/departments").then(res => setDepartments(res.data.data)).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "student",
        departmentId: user.info?.departmentId?._id || user.info?.departmentId || "",
        batchId: user.info?.batchId?._id || user.info?.batchId || "",
        section: user.info?.section || ""
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.patch(`/api/v2/admin/users/${user._id}`, formData);
      toast.success("User updated successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Edit User</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Update user details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="input py-2.5">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input py-2.5" placeholder="John Doe" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input py-2.5" placeholder="john@example.com" />
            </div>

            {(formData.role === "student" || formData.role === "teacher") && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Academic Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                    <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="input py-2.5" required>
                      <option value="">Select Department...</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.role === "student" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batch ID</label>
                        <input type="text" name="batchId" required value={formData.batchId} onChange={handleChange} className="input py-2.5" placeholder="Batch ID" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section</label>
                        <input type="text" name="section" required value={formData.section} onChange={handleChange} className="input py-2.5" placeholder="A" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 border-amber-600 shadow-amber-500/20">
                <Save className="w-4 h-4 mr-2 inline" />
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
