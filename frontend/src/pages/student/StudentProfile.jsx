import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, User, Smartphone, ShieldCheck, Key, AlertTriangle, Save, Loader2, BookOpen, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePassword, updateProfile } from "../../store/slices/authSlice";
import TwoFactorSettings from "../../components/shared/TwoFactorSettings";
import { addToast } from "../../store/slices/toastSlice";

export default function StudentProfile() {
  const { user, isLoading } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || ""
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if(newPassword !== confirmPassword) {
      dispatch(addToast({ title: "Error", message: "Passwords do not match", type: "error" }));
      return;
    }
    
    try {
      await dispatch(updatePassword({currentPassword, newPassword})).unwrap();
      dispatch(addToast({ title: "Success", message: "Password changed successfully.", type: "success" }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err || "Failed to change password.", type: "error" }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(editForm)).unwrap();
      dispatch(addToast({ title: "Success", message: "Profile updated successfully.", type: "success" }));
      setIsEditing(false);
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err || "Failed to update profile.", type: "error" }));
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center gap-4">
        <Link to={`/${user?.role || 'student'}/dashboard`} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg bg-white border border-slate-200 shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Profile</h1>
      </div>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 w-full">
        
        {/* Personal Info */}
        <div className="card p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" /> Personal Info
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Name</p>
              <p className="font-bold text-slate-700">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Email</p>
              <p className="font-bold text-slate-700">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Roll Number</p>
              <p className="font-bold text-slate-700">{user?.info?.rollNo || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Section</p>
              <p className="font-bold text-slate-700">Section {user?.info?.section || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Security & Device */}
        <div className="card p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Security & Device
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Device Binding</h4>
                  <p className="text-xs font-medium text-slate-500 mt-1">This device is securely bound to your account.</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">Bound</span>
            </div>

            <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Need to change your device?</h4>
                <p className="text-xs font-medium text-amber-700/80 mt-1">
                  You cannot unbind your device yourself. Please visit the admin office to request a device reset if you bought a new phone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <TwoFactorSettings />

        {/* Change Password */}
        <div className="card p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-sky-500" /> Change Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
              <input 
                type="password" 
                required
                className="input py-2.5"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <input 
                type="password" 
                required
                className="input py-2.5"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <input 
                type="password" 
                required
                className="input py-2.5"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="mt-6 btn-secondary py-2.5 shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
