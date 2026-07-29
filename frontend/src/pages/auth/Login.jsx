import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearError } from "../../store/slices/authSlice.js";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ identifier, password }));

    if (login.fulfilled.match(result)) {
      const { mustChangePassword, user } = result.payload;

      if (mustChangePassword) {
        navigate("/setup-profile");
        return;
      }

      // Route by role
      const routes = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
      };
      navigate(routes[user.role] || "/login");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-primary/20 blur-3xl -z-10 rounded-full" />
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">AttendX</h1>
          <p className="text-text-muted mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Username or Email
            </label>
            <input
              type="text"
              required
              className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Enter your ID"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-text-muted">
                Password
              </label>
              <button 
                type="button" 
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-primary hover:text-primary-dark transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
