import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, User, Smartphone, ShieldCheck, Key, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePassword } from "../../store/slices/authSlice";
import TwoFactorSettings from "../../components/shared/TwoFactorSettings";
import { addToast } from "../../store/slices/toastSlice";

export default function StudentProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/student/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">My Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Personal Info */}
        <div className="card p-8 shadow-sm">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
            <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-3xl border-2 border-sky-200 shadow-sm">
              {(user?.name || "Student").charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{user?.name || "Student Name"}</h2>
              <p className="text-slate-500 font-medium mt-1">{user?.email || "No email provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Username / ID</p>
              <p className="font-bold text-slate-700">{user?.username || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Department</p>
              <p className="font-bold text-slate-700">{user?.info?.departmentId?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 mb-1">Batch / Semester</p>
              <p className="font-bold text-slate-700">{user?.info?.batchId?.name || "N/A"}</p>
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
