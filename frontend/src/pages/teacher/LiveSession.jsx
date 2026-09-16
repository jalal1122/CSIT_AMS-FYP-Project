import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { StopCircle, Users, AlertCircle, Check, X, Settings, ArrowLeft } from "lucide-react";
import { 
  fetchLiveAttendance, 
  endLiveSession, 
  updateAttendanceStatus,
  refreshQrToken,
  resetSession,
  fetchSessionDetails
} from "../../store/slices/sessionSlice";
import { QRCodeSVG } from "qrcode.react";
import LiveSessionSecurityModal from "../../components/teacher/LiveSessionSecurityModal";
import socket from "../../services/socket";
import api from "../../services/api";

export default function LiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentSession, liveFeed, qrToken, qrRefreshRate } = useSelector(state => state.session);
  const [countdown, setCountdown] = useState(qrRefreshRate || 15);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);

  // QR token refresh timer
  useEffect(() => {
    setCountdown(qrRefreshRate || 15);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          dispatch(refreshQrToken(sessionId));
          return qrRefreshRate || 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [dispatch, sessionId, qrRefreshRate]);

  // Live feed websocket
  useEffect(() => {
    const initSession = async () => {
      if (!currentSession || currentSession._id !== sessionId) {
        dispatch(fetchSessionDetails(sessionId));
      }
    };
    initSession();

    dispatch(fetchLiveAttendance(sessionId));
    
    // Ensure socket is connected before emitting
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      socket.emit("join-session", sessionId);
    };

    if (socket.connected) {
      onConnect();
    } else {
      socket.on("connect", onConnect);
    }
    
    socket.on("attendance:updated", () => {
      dispatch(fetchLiveAttendance(sessionId));
    });

    socket.on("qr:updated", (data) => {
      // Optional: if backend ever pushes qr updates
      if(data.qrToken) {
        // Redux state will be out of sync if we manually update here without dispatching,
        // but the polling already handles QR refresh.
      }
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("attendance:updated");
      socket.off("qr:updated");
      if (socket.connected) {
        socket.emit("leave-session", sessionId);
        socket.disconnect();
      }
    };
  }, [dispatch, sessionId]);

  const handleEndSession = () => {
    setIsEndConfirmOpen(true);
  };

  const handleConfirmEnd = async () => {
    setIsEndConfirmOpen(false);
    await dispatch(endLiveSession(sessionId));
    dispatch(resetSession());
    navigate("/teacher/dashboard");
  };

  const handleStatusUpdate = async (attendanceId, status) => {
    await dispatch(updateAttendanceStatus({ attendanceId, status }));
    dispatch(fetchLiveAttendance(sessionId)); // Refresh immediately
  };

  const attendance = liveFeed || [];
  const presentCount = attendance.filter(a => a.status === "Present").length;
  const pendingCount = attendance.filter(a => a.status === "Pending").length;

  return (
    <div className="flex flex-col">
      <header className="max-w-7xl mx-auto w-full p-2.5 sm:p-4 md:p-8 space-y-4 sm:space-y-6">
        <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button onClick={handleEndSession} className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <h1 className="text-lg sm:text-2xl font-extrabold text-rose-700 tracking-tight truncate">LIVE SESSION</h1>
              </div>
              <p className="text-xs sm:text-sm font-medium text-rose-600/80 mt-0.5 truncate">{currentSession?.allocationId?.subjectId?.name} ({currentSession?.allocationId?.batchId?.name} - Sec {currentSession?.sectionName})</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-rose-100">
            <button 
              onClick={() => setIsSecurityModalOpen(true)}
              className="bg-white text-slate-600 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-sm"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="inline">Security</span>
            </button>
            <button 
              onClick={handleEndSession}
              className="bg-rose-500 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
            >
              <StopCircle className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="inline">End Session</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        
        {/* Left: QR Code Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="card p-4 sm:p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent pointer-events-none"></div>
            
            <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-8 text-center relative z-10">Scan to mark attendance</h2>
            
            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl shadow-sky-100/50 mb-4 sm:mb-8 relative z-10 border border-sky-100 group max-w-full">
              {/* Actual QR code component */}
              <div className="w-[200px] h-[200px] sm:w-64 sm:h-64 bg-slate-50 border-2 border-dashed border-sky-200 flex items-center justify-center text-slate-400 rounded-2xl font-mono text-sm break-all text-center p-2 sm:p-4 group-hover:border-sky-400 transition-colors">
                {qrToken ? (
                  <QRCodeSVG value={qrToken} size={190} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                    <p className="text-slate-400 text-xs sm:text-sm font-semibold">Loading QR...</p>
                  </div>
                )}
              </div>
              
              {/* Scan overlay effect */}
              <div className="absolute inset-x-3 sm:inset-x-5 top-3 sm:top-5 bg-gradient-to-b from-transparent via-sky-400/30 to-transparent w-auto h-16 sm:h-20 -translate-y-16 sm:-translate-y-20 animate-[scan_3s_ease-in-out_infinite] rounded-2xl overflow-hidden pointer-events-none"></div>
            </div>

            <div className="w-full max-w-xs space-y-2 relative z-10">
              <div className="flex justify-between text-xs sm:text-sm font-semibold">
                <span className="text-slate-500">Refreshing in</span>
                <span className="text-sky-600 font-mono font-bold text-sm sm:text-base">{countdown}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 mt-4 sm:mt-6 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / (qrRefreshRate || currentSession?.securityConfig?.qrRefreshRate || 15)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Feed Panel */}
        <div className="lg:col-span-7 flex flex-col min-h-[420px] lg:h-[calc(100vh-140px)]">
          <div className="card p-0 flex-1 flex flex-col overflow-hidden shadow-md">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500" /> Live Feed
              </h3>
              <div className="flex gap-3 text-sm">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full font-bold shadow-sm">
                  {presentCount} Present
                </span>
                {pendingCount > 0 && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5" /> {pendingCount} Pending
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {attendance.map((student) => (
                <div key={student.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold border ${
                      student.status === "Present" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-slate-800 font-bold text-sm">{student.name}</h4>
                        {student.isSuspicious && (
                          <span className="flex items-center gap-1 bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded" title={student.flagReason}>
                            <AlertCircle className="w-3 h-3" /> Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5"><span className="text-slate-600 font-semibold">{student.rollNo}</span> • {student.time}</p>
                    </div>
                  </div>
                  
                  <div>
                    {student.status === "Present" || student.status === "Present (Manual)" ? (
                      <span className="text-emerald-600 font-bold text-sm flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md">
                        <Check className="w-4 h-4" /> Marked
                      </span>
                    ) : student.status === "Leave" ? (
                      <span className="text-amber-600 font-bold text-sm flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md">
                        On Leave
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStatusUpdate(student.id, "Present (Manual)")}
                          className="p-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors shadow-sm" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(student.id, "Absent")}
                          className="p-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors shadow-sm" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(student.id, "Leave")}
                          className="text-amber-600 text-xs font-semibold hover:underline ml-2">
                          Leave
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="text-center p-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 font-medium">
                Waiting for more students to scan...
              </div>
            </div>

          </div>
        </div>

      </main>

      <LiveSessionSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        sessionId={sessionId}
        currentConfig={currentSession?.securityConfig}
      />

      {isEndConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-rose-100">
            <h3 className="text-xl font-bold text-slate-800 mb-2">End Live Session?</h3>
            <p className="text-slate-500 mb-6">
              All students who have not scanned will be automatically marked <span className="font-bold text-rose-600">Absent</span>. This cannot be undone without creating a retroactive session.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEndConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEnd}
                className="flex-1 py-2.5 rounded-lg bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
              >
                Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
