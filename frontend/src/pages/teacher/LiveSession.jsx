import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { StopCircle, Users, AlertCircle, Check, X, Settings, ArrowLeft } from "lucide-react";
import { 
  fetchLiveAttendance, 
  endLiveSession, 
  updateAttendanceStatus,
  refreshQrToken,
  resetSession 
} from "../../store/slices/sessionSlice";
import { QRCodeSVG } from "qrcode.react";
import LiveSessionSecurityModal from "../../components/teacher/LiveSessionSecurityModal";
import socket from "../../services/socket";

export default function LiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentSession, liveFeed, qrToken, qrRefreshRate } = useSelector(state => state.session);
  const [countdown, setCountdown] = useState(qrRefreshRate || 15);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // QR token refresh timer
  useEffect(() => {
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
    dispatch(fetchLiveAttendance(sessionId));
    
    socket.connect();
    socket.emit("join-session", sessionId);
    
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
      socket.emit("leave-session", sessionId);
      socket.off("attendance:updated");
      socket.off("qr:updated");
      socket.disconnect();
    };
  }, [dispatch, sessionId]);

  const handleEndSession = async () => {
    if(window.confirm("Are you sure you want to end this live session? All unscanned students will be marked Absent.")) {
      await dispatch(endLiveSession(sessionId));
      dispatch(resetSession());
      navigate("/teacher/dashboard");
    }
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
      <header className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <button onClick={handleEndSession} className="p-2 -ml-2 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h1 className="text-2xl font-extrabold text-rose-700 tracking-tight">LIVE SESSION</h1>
              </div>
              <p className="text-sm font-medium text-rose-600/80 mt-0.5">{currentSession?.subjectName} ({currentSession?.batchName} - Sec {currentSession?.sectionName})</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={() => setIsSecurityModalOpen(true)}
              className="bg-white text-slate-600 px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-sm"
            >
              <Settings className="w-5 h-5" /> <span className="hidden sm:inline">Security</span>
            </button>
            <button 
              onClick={handleEndSession}
              className="bg-rose-500 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
            >
              <StopCircle className="w-5 h-5" /> <span className="hidden sm:inline">End Session</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: QR Code Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="card p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent pointer-events-none"></div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-10 text-center relative z-10">Scan to mark attendance</h2>
            
            <div className="bg-white p-5 rounded-3xl shadow-xl shadow-sky-100/50 mb-10 relative z-10 border border-sky-100 group">
              {/* Actual QR code component */}
              <div className="w-64 h-64 bg-slate-50 border-2 border-dashed border-sky-200 flex items-center justify-center text-slate-400 rounded-2xl font-mono text-sm break-all text-center p-4 group-hover:border-sky-400 transition-colors">
                {qrToken ? (
                  <QRCodeSVG value={qrToken} size={224} />
                ) : (
                  <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                    <p className="text-slate-400 text-sm font-semibold">Loading QR...</p>
                  </div>
                )}
              </div>
              
              {/* Scan overlay effect */}
              <div className="absolute inset-x-5 top-5 bg-gradient-to-b from-transparent via-sky-400/30 to-transparent w-[256px] h-20 -translate-y-20 animate-[scan_3s_ease-in-out_infinite] rounded-2xl overflow-hidden pointer-events-none"></div>
            </div>

            <div className="w-full max-w-xs space-y-2 relative z-10">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-slate-500">Refreshing in</span>
                <span className="text-sky-600 font-mono font-bold text-base">{countdown}s</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-sky-500 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Feed Panel */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)]">
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
    </div>
  );
}
