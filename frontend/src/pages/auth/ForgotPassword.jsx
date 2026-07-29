import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 relative overflow-hidden">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Reset Password</h2>
          <p className="text-text-muted mt-2">Enter your email to receive reset instructions</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded text-danger text-sm text-center">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-6 p-3 bg-secondary/10 border border-secondary/20 rounded text-secondary text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full bg-surface-light border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-primary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary hover:text-primary-dark text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
