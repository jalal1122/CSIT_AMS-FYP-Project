import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, User, Mail, Lock, CheckCircle } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    bootstrapSecret: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await api.post("/api/v2/auth/bootstrap/admin", formData);
      setSuccess(true);
      toast.success("Initial Admin account created successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Bootstrap failed. Check secret or if admin already exists.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full text-center border border-slate-700 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">System Initialized</h2>
          <p className="text-slate-400 mb-6">Super Admin account has been created successfully.</p>
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-slate-800 p-4 sm:p-8 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-3 sm:mb-4 border border-rose-500/30">
            <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">System Bootstrap</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 text-center">
            Create the initial Super Admin account. This endpoint requires the Bootstrap Secret configured in the environment.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name} 
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                placeholder="Super Admin"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Admin Username</label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="text" 
                name="username" 
                required 
                value={formData.username} 
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email} 
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                placeholder="admin@attendx.edu"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
              <input 
                type="password" 
                name="password" 
                required 
                value={formData.password} 
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Bootstrap Secret
            </label>
            <input 
              type="password" 
              name="bootstrapSecret" 
              required 
              value={formData.bootstrapSecret} 
              onChange={handleChange}
              className="w-full bg-rose-950/20 border border-rose-900 text-white rounded-lg px-4 py-2.5 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
              placeholder="Enter BOOTSTRAP_SECRET from .env"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold py-3 rounded-lg mt-6 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? "Initializing..." : "Initialize System"}
          </button>
        </form>
      </div>
    </div>
  );
}
