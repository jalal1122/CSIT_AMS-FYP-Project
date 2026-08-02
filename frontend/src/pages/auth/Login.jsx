import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login, clearError } from "../../store/slices/authSlice.js";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, require2FA, tempToken } = useSelector((state) => state.auth);
  const [otp, setOtp] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login({ identifier, password }));

    if (login.fulfilled.match(result)) {
      const { require2FA: serverRequire2FA, mustChangePassword, user } = result.payload;

      if (serverRequire2FA) {
        return; // Wait for OTP
      }

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

  const handleValidate2FA = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(import("../../store/slices/authSlice.js").then(m => m.validate2FA({ tempToken, otp })));

    if (result.type === "auth/validate2FA/fulfilled") {
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="card w-full max-w-md p-10 relative z-10 shadow-xl shadow-sky-100/50 border border-slate-100">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-sky-600 tracking-tight mb-2">CSIT AMS</h1>
          <p className="text-slate-500 font-medium">
            {require2FA ? "Two-Factor Authentication" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-semibold text-center shadow-sm">
            {error}
          </div>
        )}

        {!require2FA ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                required
                className="input py-3"
                placeholder="Enter your ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">
                  Password
                </label>
                <button 
                  type="button" 
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                className="input py-3"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 text-base shadow-lg shadow-sky-500/30 font-bold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center pt-4 border-t border-slate-100 mt-6">
              <p className="text-sm font-medium text-slate-500">
                Don't have an account? <span className="text-slate-400">Contact Administrator</span>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleValidate2FA} className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-600">
                Please enter the 6-digit authentication code from your authenticator app.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Authentication Code
              </label>
              <input
                type="text"
                required
                maxLength="6"
                className="input py-3 text-center tracking-widest text-lg font-mono"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full btn-primary py-3.5 text-base shadow-lg shadow-sky-500/30 font-bold"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
            
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
