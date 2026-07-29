import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, User, Smartphone, ShieldCheck, Key, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
// import { updatePassword } from "../../store/slices/authSlice";

export default function StudentProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = (e) => {
    e.preventDefault();
    if(newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    // dispatch(updatePassword({currentPassword, newPassword}));
    alert("Password change request submitted.");
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-light border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link to="/student/dashboard" className="text-text-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">My Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Personal Info */}
        <div className="glass p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl">
              {(user?.name || "Student").charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name || "Student Name"}</h2>
              <p className="text-text-muted">{user?.email || "No email provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-text-muted mb-1">Username / ID</p>
              <p className="font-medium text-white">{user?.username || "CSIT-2022-001"}</p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Batch</p>
              <p className="font-medium text-white">BS Information Technology 2026</p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Semester</p>
              <p className="font-medium text-white">Semester 3</p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Section</p>
              <p className="font-medium text-white">Section A</p>
            </div>
          </div>
        </div>

        {/* Security & Device */}
        <div className="glass p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Security & Device
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface-light border border-white/5 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-full text-secondary">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Device Binding</h4>
                  <p className="text-xs text-text-muted mt-1">This device is securely bound to your account.</p>
                </div>
              </div>
              <span className="text-sm font-medium text-secondary">Bound</span>
            </div>

            <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-danger">Need to change your device?</h4>
                <p className="text-xs text-danger/80 mt-1">
                  You cannot unbind your device yourself. Please visit the admin office to request a device reset if you bought a new phone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> Change Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Current Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">New Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Confirm New Password</label>
              <input 
                type="password" 
                required
                className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="mt-4 bg-surface-light border border-white/10 hover:bg-white/10 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
