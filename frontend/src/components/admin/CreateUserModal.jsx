import React, { useState, useEffect } from "react";
import { X, UserPlus, Shield, Eye, EyeOff } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

export default function CreateUserModal({ isOpen, onClose, onSuccess, defaultRole = "student", fixedRole = false }) {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: defaultRole,
    departmentId: "", // for teacher/student
    batchId: "", // for student
    section: "" // for student
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (isOpen) {
      api.get("/api/v2/system/departments").then(res => setDepartments(res.data.data)).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      username: formData.username,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      info: {}
    };

    if (formData.role === "teacher" || formData.role === "student") {
      if (formData.departmentId) payload.info.departmentId = formData.departmentId;
    }
    if (formData.role === "student") {
      if (formData.batchId) payload.info.batchId = formData.batchId;
      if (formData.section) payload.info.section = formData.section;
    }

    try {
      await api.post("/api/v2/admin/users", payload);
      toast.success("User created successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
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
            <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Create User</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Add a new admin, teacher, or student</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!fixedRole && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="input py-2.5" disabled={fixedRole}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username (ID)</label>
                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="input py-2.5" placeholder="e.g. 21CS001" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="input py-2.5" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="input py-2.5" placeholder="john@example.com" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Temporary Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} className="input py-2.5 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3" /> User will be forced to change this upon first login
              </p>
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
              <button type="submit" disabled={isLoading} className="btn-primary flex-1 py-2.5">
                {isLoading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
