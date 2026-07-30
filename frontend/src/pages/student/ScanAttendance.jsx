import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Smartphone, ScanLine, AlertCircle, CheckCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../services/api";

export default function ScanAttendance() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("scanning"); // scanning | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const scannerRef = useRef(null);
  useEffect(() => {
    if (status === "scanning") {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [status]);

  const onScanSuccess = async (decodedText) => {
    if (status !== "scanning") return;
    setStatus("processing");
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await api.post("/api/v2/attendance/mark", {
            qrToken: decodedText,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
          
          setSuccessData({
            subject: res.data.data.subjectName,
            section: res.data.data.sectionName,
            time: new Date().toLocaleTimeString()
          });
          setStatus("success");
        } catch (error) {
          setErrorMessage(error.response?.data?.message || "Failed to mark attendance.");
          setStatus("error");
        }
      },
      (error) => {
        setErrorMessage("Unable to retrieve your location for verification.");
        setStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const onScanFailure = (error) => {
    // Ignore routine scan failures
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 shrink-0 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <Link to="/student/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Scan QR Code</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          
          {status === "scanning" && (
            <div className="card p-4 sm:p-8 flex flex-col items-center text-center relative overflow-hidden bg-white shadow-xl shadow-sky-100/50">
              
              <div id="qr-reader" className="w-full max-w-sm mb-6 rounded-lg overflow-hidden border-2 border-sky-100"></div>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Align QR Code</h2>
              <p className="text-sm font-medium text-slate-500 mb-8">Point your camera at the teacher's screen to mark attendance.</p>
              
              <div className="flex gap-4 text-xs font-semibold text-slate-600 w-full justify-center">
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-emerald-700">
                  <MapPin className="w-3.5 h-3.5" /> GPS Required
                </div>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="card p-12 flex flex-col items-center text-center shadow-xl shadow-sky-100/50">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying...</h2>
              <p className="text-sm font-medium text-slate-500">Checking location and device fingerprint.</p>
            </div>
          )}

          {status === "success" && (
            <div className="card p-8 flex flex-col items-center text-center shadow-xl shadow-emerald-100/50 border-emerald-200">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 border border-emerald-200">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Attendance Marked!</h2>
              <p className="text-slate-500 font-medium mb-8">You have been marked present for the session.</p>
              
              <div className="w-full bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8 text-left shadow-inner">
                <p className="text-sm font-semibold text-slate-500 mb-1">Subject</p>
                <p className="font-bold text-slate-800">{successData?.subject} (Sec {successData?.section})</p>
                <p className="text-sm font-semibold text-slate-500 mt-4 mb-1">Time Marked</p>
                <p className="font-bold text-slate-800">{successData?.time}</p>
              </div>

              <button 
                onClick={() => navigate("/student/dashboard")}
                className="w-full btn-secondary py-3 text-base shadow-sm"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="card p-8 flex flex-col items-center text-center shadow-xl shadow-rose-100/50 border-rose-200">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 border border-rose-200">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Verification Failed</h2>
              <p className="text-rose-600 font-medium mb-8">{errorMessage}</p>
              
              <button 
                onClick={() => setStatus("scanning")}
                className="w-full btn-primary py-3 text-base mb-3 shadow-sm"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate("/student/dashboard")}
                className="w-full py-3 rounded-lg font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
