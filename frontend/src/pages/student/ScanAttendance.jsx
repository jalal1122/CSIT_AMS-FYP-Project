import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Smartphone, ScanLine, AlertCircle, CheckCircle } from "lucide-react";
// import { Html5QrcodeScanner } from "html5-qrcode"; // Will be used in real implementation

export default function ScanAttendance() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("scanning"); // scanning | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Mocking the scan flow for demonstration
  const simulateScan = (type) => {
    setStatus("processing");
    setTimeout(() => {
      if (type === "success") {
        setSuccessData({ subject: "Data Structures", section: "A", time: new Date().toLocaleTimeString() });
        setStatus("success");
      } else {
        setErrorMessage("You are too far from the classroom. GPS verification failed.");
        setStatus("error");
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-surface-light border-b border-white/10 p-4 shrink-0">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link to="/student/dashboard" className="text-text-muted hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-white tracking-tight">Scan QR Code</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {status === "scanning" && (
            <div className="glass p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
              
              <div className="mb-8 relative w-64 h-64 mx-auto border-2 border-primary/50 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {/* Simulated Camera View */}
                <ScanLine className="w-16 h-16 text-primary/50 animate-pulse" />
                
                {/* Scanning overlay animation */}
                <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_#4F46E5] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Align QR Code</h2>
              <p className="text-sm text-text-muted mb-8">Point your camera at the teacher's screen to mark attendance.</p>
              
              <div className="flex gap-4 text-xs text-text-muted w-full justify-center">
                <div className="flex items-center gap-1 bg-surface-light px-3 py-1.5 rounded-full border border-white/5">
                  <MapPin className="w-3 h-3 text-secondary" /> GPS Active
                </div>
                <div className="flex items-center gap-1 bg-surface-light px-3 py-1.5 rounded-full border border-white/5">
                  <Smartphone className="w-3 h-3 text-secondary" /> Device Bound
                </div>
              </div>

              {/* Dev Simulation Buttons */}
              <div className="mt-8 pt-4 border-t border-white/10 w-full flex justify-center gap-2">
                <button onClick={() => simulateScan("success")} className="text-xs text-text-muted hover:text-secondary">Simulate Success</button>
                <button onClick={() => simulateScan("error")} className="text-xs text-text-muted hover:text-danger">Simulate Error</button>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="glass p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 border-4 border-white/10 border-t-primary rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying...</h2>
              <p className="text-sm text-text-muted">Checking location and device fingerprint.</p>
            </div>
          )}

          {status === "success" && (
            <div className="glass p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Attendance Marked!</h2>
              <p className="text-text-muted mb-6">You have been marked present for the session.</p>
              
              <div className="w-full bg-surface-light p-4 rounded-lg border border-white/5 mb-8 text-left">
                <p className="text-sm text-text-muted mb-1">Subject</p>
                <p className="font-medium text-white">{successData?.subject} (Sec {successData?.section})</p>
                <p className="text-sm text-text-muted mt-3 mb-1">Time Marked</p>
                <p className="font-medium text-white">{successData?.time}</p>
              </div>

              <button 
                onClick={() => navigate("/student/dashboard")}
                className="w-full bg-surface-light text-white font-medium py-3 rounded-lg hover:bg-white/5 transition-colors border border-white/10"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="glass p-8 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-danger/20 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-danger" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-danger/90 mb-8">{errorMessage}</p>
              
              <button 
                onClick={() => setStatus("scanning")}
                className="w-full bg-gradient-primary text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity mb-3"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate("/student/dashboard")}
                className="w-full text-text-muted font-medium py-3 rounded-lg hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
