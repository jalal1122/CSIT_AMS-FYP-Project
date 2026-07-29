import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setupProfile, clearError } from "../../store/slices/authSlice.js";

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
  const strengthColors = ["bg-gray-500", "bg-danger", "bg-accent", "bg-secondary", "bg-secondary"];
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  const handleSetup = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match");
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 relative overflow-hidden">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Set Up Profile</h2>
          <p className="text-text-muted mt-2">Welcome {user?.name}, please create a new password to secure your account.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              New Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full ${strength >= level ? strengthColors[strength] : 'bg-surface-light'}`}
                    />
                  ))}
                </div>
                <span className={`text-xs ${strength >= 3 ? 'text-secondary' : 'text-text-muted'}`}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || strength < 2 || password !== confirm}
            className="w-full bg-gradient-primary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
