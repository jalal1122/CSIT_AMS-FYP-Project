import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, User, Key, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePassword, updateProfile } from "../../store/slices/authSlice";
import TwoFactorSettings from "../../components/shared/TwoFactorSettings";
import { addToast } from "../../store/slices/toastSlice";

export default function AdminProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    fatherName: user?.info?.fatherName || ""
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={`/admin/dashboard`} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg bg-white border border-slate-200 shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Profile</h1>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-secondary py-2 px-4 shadow-sm">
            Edit Profile
          </button>
        )}
      </div>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 w-full">
        
        {/* Personal Info */}
        <div className="card p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" /> Personal Info
          </h3>
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                  <input type="text" className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input type="email" className="input" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Father's Name</label>
                  <input type="text" className="input" value={editForm.fatherName} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="btn-outline py-2">Cancel</button>
                <button type="submit" className="btn-primary py-2 px-6 flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          ) : (
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
                <p className="text-sm font-semibold text-slate-400 mb-1">Father's Name</p>
                <p className="font-bold text-slate-700">{user?.info?.fatherName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400 mb-1">Username</p>
                <p className="font-bold text-slate-700">{user?.username}</p>
              </div>
            </div>
          )}
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
