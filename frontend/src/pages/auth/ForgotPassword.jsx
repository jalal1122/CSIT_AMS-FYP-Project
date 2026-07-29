import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../../services/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await api.post("/api/v2/auth/forgot-password", { email });
      setMessage(res.data.message || "A password reset link has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="card w-full max-w-md p-10 relative z-10 shadow-xl shadow-sky-100/50 border border-slate-100">
        
        <Link to="/login" className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">Reset Password</h2>
          <p className="text-slate-500 font-medium">Enter your email to receive reset instructions</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-semibold text-center shadow-sm">
            {error}
          </div>
        )}
        
        {message ? (
          <div className="mb-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-center flex flex-col items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="font-semibold text-sm">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="input py-3"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3.5 text-base shadow-lg shadow-sky-500/30 font-bold"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
