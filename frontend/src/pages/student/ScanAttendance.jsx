import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Smartphone, ScanLine, AlertCircle, CheckCircle } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../services/api";
import { formatPKTTime } from "../../utils/dateUtils";
import socket from "../../services/socket";

export default function ScanAttendance() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("scanning"); // scanning | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    socket.on("session:ended", () => {
      setSessionEnded(true);
      setStatus("error");
      setErrorMessage("The session has been ended by the teacher. You can no longer mark attendance.");
    });
    return () => {
      socket.off("session:ended");
    };
  }, []);
  useEffect(() => {
    if (status === "scanning") {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.max(160, Math.floor(minEdge * 0.75));
            return { width: edge, height: edge };
          }
        },
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

    // Generate or get persistent device fingerprint
    let deviceId = localStorage.getItem("csit_ams_device_id");
    if (!deviceId) {
      try {
        // Use FingerprintJS for a more stable fingerprint
        const FingerprintJS = await import("@fingerprintjs/fingerprintjs");
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        deviceId = result.visitorId;
      } catch {
        // Fallback: combine multiple stable signals
        const signals = [
          navigator.userAgent,
          navigator.language,
          screen.width,
          screen.height,
          screen.colorDepth,
          Intl.DateTimeFormat().resolvedOptions().timeZone
        ].join("|");
        // Hash the signals
        const encoder = new TextEncoder();
        const data = encoder.encode(signals);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        deviceId = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
      }
      localStorage.setItem("csit_ams_device_id", deviceId);
    }

    const markWithLocation = async (lat = null, lon = null) => {
      try {
        const payload = { qrToken: decodedText, deviceId };
        if (lat !== null && lon !== null) {
          payload.location = { latitude: lat, longitude: lon };
        }
        
        const res = await api.post("/api/v2/attendance/mark", payload);
        
        setSuccessData({
          subject: res.data.data.subjectName || "Subject",
          section: res.data.data.sectionName || res.data.data.section,
          time: formatPKTTime(new Date())
        });
        setStatus("success");
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Failed to mark attendance.");
        setStatus("error");
      }
    };

    if (!navigator.geolocation) {
      // Proceed without location if not supported
      return markWithLocation();
    }

    // Try to get location, timeout after 5 seconds
    navigator.geolocation.getCurrentPosition(
      (position) => {
        markWithLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        // Proceed without location, let backend decide if it's fatal
        markWithLocation();
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const onScanFailure = (error) => {
    // Ignore routine scan failures
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-3 sm:p-4 shrink-0 shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3 sm:gap-4">
          <Link to="/student/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 sm:p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">Scan QR Code</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-2.5 sm:p-4">
        <div className="w-full max-w-md">
          
          {status === "scanning" && (
            <div className="card p-3.5 sm:p-8 flex flex-col items-center text-center relative overflow-hidden bg-white shadow-xl shadow-sky-100/50">
              
              <div id="qr-reader" className="w-full max-w-sm mb-4 sm:mb-6 rounded-lg overflow-hidden border-2 border-sky-100"></div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">Align QR Code</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mb-6 sm:mb-8">Point your camera at the teacher's screen to mark attendance.</p>
              
              <div className="flex gap-4 text-xs font-semibold text-slate-600 w-full justify-center">
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 text-emerald-700">
                  <MapPin className="w-3.5 h-3.5" /> GPS Required
                </div>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="card p-6 sm:p-12 flex flex-col items-center text-center shadow-xl shadow-sky-100/50">
              <div className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Verifying...</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500">Checking location and device fingerprint.</p>
            </div>
          )}

          {status === "success" && (
            <div className="card p-4 sm:p-8 flex flex-col items-center text-center shadow-xl shadow-emerald-100/50 border-emerald-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 border border-emerald-200">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Attendance Marked!</h2>
              <p className="text-slate-500 font-medium mb-6 sm:mb-8 text-sm">You have been marked present for the session.</p>
              
              <div className="w-full bg-slate-50 p-3.5 sm:p-5 rounded-xl border border-slate-200 mb-6 sm:mb-8 text-left shadow-inner">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-1">Subject</p>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{successData?.subject} (Sec {successData?.section})</p>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-3 sm:mt-4 mb-1">Time Marked</p>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{successData?.time}</p>
              </div>

              <button 
                onClick={() => navigate("/student/dashboard")}
                className="w-full btn-secondary py-2.5 sm:py-3 text-sm sm:text-base shadow-sm"
              >
                Back to Dashboard
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="card p-4 sm:p-8 flex flex-col items-center text-center shadow-xl shadow-rose-100/50 border-rose-200">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6 border border-rose-200">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Verification Failed</h2>
              <p className="text-rose-600 font-medium mb-6 sm:mb-8 text-xs sm:text-sm">{errorMessage}</p>
              
              <button 
                onClick={() => setStatus("scanning")}
                className="w-full btn-primary py-2.5 sm:py-3 text-sm sm:text-base mb-3 shadow-sm"
              >
                Try Again
              </button>
              <button 
                onClick={() => navigate("/student/dashboard")}
                className="w-full py-2.5 sm:py-3 rounded-lg font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors text-sm sm:text-base"
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
