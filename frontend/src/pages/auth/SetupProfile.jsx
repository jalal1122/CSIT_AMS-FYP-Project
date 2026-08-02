import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setupProfile, clearError } from "../../store/slices/authSlice.js";
import { addToast } from "../../store/slices/toastSlice.js";

export default function SetupProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordStrength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score; // 0-4
  };

  const strength = passwordStrength(password);
  const strengthColors = ["bg-slate-300", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  const handleSetup = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      dispatch(addToast({ title: "Error", message: "Passwords do not match", type: "error" }));
      return;
    }

    dispatch(clearError());
    const result = await dispatch(setupProfile({ newPassword: password }));
    
    if (setupProfile.fulfilled.match(result)) {
      const routes = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
      };
      navigate(routes[result.payload.user.role] || "/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="card w-full max-w-md p-10 relative z-10 shadow-xl shadow-sky-100/50 border border-slate-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Set Up Profile</h2>
          <p className="text-slate-500 font-medium">Welcome {user?.name}, please create a new password to secure your account.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-semibold text-center shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              className="input py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex gap-1.5 flex-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded-full ${strength >= level ? strengthColors[strength] : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
                <span className={`text-xs font-bold w-16 text-right ${strength >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="input py-3"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || strength < 2 || password !== confirm}
            className="w-full btn-success py-3.5 text-base shadow-lg shadow-emerald-500/30 font-bold disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
