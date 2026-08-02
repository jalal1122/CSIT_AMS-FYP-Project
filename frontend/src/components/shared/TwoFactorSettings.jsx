import React, { useState } from "react";
import { Shield, ShieldAlert, ShieldCheck, Copy, Check } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { checkAuth } from "../../store/slices/authSlice";

export default function TwoFactorSettings() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [copied, setCopied] = useState(false);
  
  const is2FAEnabled = user?.twoFactorEnabled;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await api.post("/api/v2/auth/2fa/generate");
      setQrCodeUrl(res.data.data.qrCodeUrl);
      setSecret(res.data.data.secret);
      toast.success("2FA code generated. Please scan it with your authenticator app.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate 2FA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnable = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    
    try {
      await api.post("/api/v2/auth/2fa/enable", { otp });
      toast.success("Two-Factor Authentication enabled successfully!");
      setQrCodeUrl("");
      setSecret("");
      setOtp("");
      dispatch(checkAuth()); // Refresh user data to update twoFactorEnabled flag
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to enable 2FA");
    }
  };

  const handleDisable = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    
    try {
      await api.post("/api/v2/auth/2fa/disable", { otp });
      toast.success("Two-Factor Authentication disabled.");
      setOtp("");
      dispatch(checkAuth()); // Refresh user data
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to disable 2FA");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${is2FAEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          {is2FAEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Two-Factor Authentication (2FA)</h2>
          <p className="text-sm text-slate-500">
            {is2FAEnabled 
              ? "Your account is secured with two-factor authentication."
              : "Add an extra layer of security to your account."}
          </p>
        </div>
      </div>

      {!is2FAEnabled && !qrCodeUrl && (
        <div className="space-y-4">
          <p className="text-slate-600 text-sm">
            Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to log in.
          </p>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary py-2.5 px-6"
          >
            {isGenerating ? "Generating..." : "Set up 2FA"}
          </button>
        </div>
      )}

      {!is2FAEnabled && qrCodeUrl && (
        <div className="space-y-6">
          <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl">
            <h3 className="font-bold text-sky-800 mb-2">1. Scan the QR Code</h3>
            <p className="text-sm text-sky-700 mb-4">
              Use an authenticator app like Google Authenticator or Authy to scan this QR code.
            </p>
            <div className="bg-white p-4 inline-block rounded-xl shadow-sm border border-slate-200">
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-sky-700 mb-2 font-medium">Or enter this code manually:</p>
              <div className="flex items-center gap-2">
                <code className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-mono text-sm tracking-wider">
                  {secret}
                </code>
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-white rounded-md transition-colors"
                  title="Copy secret"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border border-slate-200 rounded-xl">
            <h3 className="font-bold text-slate-800 mb-2">2. Verify the Code</h3>
            <p className="text-sm text-slate-500 mb-4">
              Enter the 6-digit code generated by your authenticator app to enable 2FA.
            </p>
            <form onSubmit={handleEnable} className="flex gap-3">
              <input 
                type="text" 
                placeholder="000000" 
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="input max-w-[150px] text-center tracking-widest font-mono text-lg"
              />
              <button 
                type="submit" 
                disabled={otp.length !== 6}
                className="btn-primary"
              >
                Verify & Enable
              </button>
              <button 
                type="button" 
                onClick={() => { setQrCodeUrl(""); setSecret(""); setOtp(""); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {is2FAEnabled && (
        <div className="space-y-4 border-t border-slate-100 pt-6 mt-2">
          <p className="text-sm text-slate-600 mb-4">
            If you want to turn off two-factor authentication, please enter the current 6-digit code from your authenticator app.
          </p>
          <form onSubmit={handleDisable} className="flex gap-3">
            <input 
              type="text" 
              placeholder="000000" 
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input max-w-[150px] text-center tracking-widest font-mono text-lg"
            />
            <button 
              type="submit" 
              disabled={otp.length !== 6}
              className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold shadow-sm transition-colors"
            >
              Disable 2FA
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
