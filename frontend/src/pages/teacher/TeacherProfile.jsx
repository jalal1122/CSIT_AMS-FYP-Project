import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, User, Key, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { updatePassword, updateProfile } from "../../store/slices/authSlice";
import TwoFactorSettings from "../../components/shared/TwoFactorSettings";
import { addToast } from "../../store/slices/toastSlice";

export default function TeacherProfile() {
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
    fatherName: user?.info?.fatherName || "",
    designation: user?.info?.designation || ""
  });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || "",
        email: user.email || "",
        fatherName: user.info?.fatherName || "",
        designation: user.info?.designation || ""
      });
    }
  }, [user]);

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
    <div className="flex flex-col flex-1">
      <main className="max-w-3xl mx-auto p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-6 w-full">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to={`/teacher/dashboard`} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg bg-white border border-slate-200 shadow-sm shrink-0">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight truncate">My Profile</h1>
          </div>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-secondary py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm shadow-sm shrink-0">
              Edit Profile
            </button>
          )}
        </div>
        
        {/* Personal Info */}
        <div className="card p-3.5 sm:p-6 md:p-8 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-sky-500" /> Personal Info
          </h3>
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Name</label>
                  <input type="text" className="input text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" className="input text-sm" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Father's Name</label>
                  <input type="text" className="input text-sm" value={editForm.fatherName} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Designation</label>
                  <input type="text" className="input text-sm" value={editForm.designation} onChange={e => setEditForm({...editForm, designation: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
                <button type="button" onClick={() => setIsEditing(false)} className="w-full sm:w-auto btn-outline py-2 text-sm">Cancel</button>
                <button type="submit" className="w-full sm:w-auto btn-primary py-2 px-6 flex items-center justify-center gap-2 text-sm">
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-0.5">Name</p>
                <p className="font-bold text-slate-700 text-sm sm:text-base break-words">{user?.name}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-0.5">Email</p>
                <p className="font-bold text-slate-700 text-sm sm:text-base break-words">{user?.email}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-0.5">Father's Name</p>
                <p className="font-bold text-slate-700 text-sm sm:text-base break-words">{user?.info?.fatherName || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-0.5">Designation</p>
                <p className="font-bold text-slate-700 text-sm sm:text-base break-words">{user?.info?.designation || "N/A"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-0.5">Employee ID</p>
                <p className="font-bold text-slate-700 text-sm sm:text-base break-words">{user?.username}</p>
              </div>
            </div>
          )}
        </div>

        {/* Two-Factor Authentication */}
        <TwoFactorSettings />

        {/* Change Password */}
        <div className="card p-3.5 sm:p-6 md:p-8 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-sky-500" /> Change Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Current Password</label>
              <input 
                type="password" 
                required
                className="input py-2 sm:py-2.5 text-sm"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">New Password</label>
              <input 
                type="password" 
                required
                className="input py-2 sm:py-2.5 text-sm"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input 
                type="password" 
                required
                className="input py-2 sm:py-2.5 text-sm"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full sm:w-auto mt-4 sm:mt-6 btn-secondary py-2 sm:py-2.5 px-5 text-sm shadow-sm"
            >
              Update Password
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
