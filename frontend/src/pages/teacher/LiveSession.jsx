import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StopCircle, Users, AlertCircle, Check, X } from "lucide-react";

export default function LiveSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [countdown, setCountdown] = useState(15);
  const [qrToken, setQrToken] = useState("sample-qr-token-12345");
  
  const [attendance, setAttendance] = useState([
    { id: "1", name: "Muhammad Ali", rollNo: "2022-001", status: "Present", time: "10:02 AM" },
    { id: "2", name: "Fatima Khan", rollNo: "2022-002", status: "Present", time: "10:05 AM" },
    { id: "3", name: "Omar Sheikh", rollNo: "2022-003", status: "Pending", time: "10:06 AM" },
  ]);

  // Mock countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // In real app, fetch new QR token here
          setQrToken(`new-token-${Math.random().toString(36).substring(7)}`);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleEndSession = () => {
    if(window.confirm("Are you sure you want to end this live session? All unscanned students will be marked Absent.")) {
      navigate("/teacher/dashboard");
    }
  };

  const presentCount = attendance.filter(a => a.status === "Present").length;
  const pendingCount = attendance.filter(a => a.status === "Pending").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Session Header (Red indicates LIVE) */}
      <header className="bg-rose-50 border-b border-rose-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
            <div>
              <h1 className="text-lg font-bold text-rose-700 tracking-tight">LIVE SESSION</h1>
              <p className="text-xs font-semibold text-rose-600/80 mt-0.5">Data Structures • Sec A • Lecture</p>
            </div>
          </div>
          <button 
            onClick={handleEndSession}
            className="bg-rose-500 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200"
          >
            <StopCircle className="w-5 h-5" /> End Session
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: QR Code Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="card p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-transparent pointer-events-none"></div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-10 text-center relative z-10">Scan to mark attendance</h2>
            
            <div className="bg-white p-5 rounded-3xl shadow-xl shadow-sky-100/50 mb-10 relative z-10 border border-sky-100 group">
              {/* This would be an actual QR code component in production */}
              <div className="w-64 h-64 bg-slate-50 border-2 border-dashed border-sky-200 flex items-center justify-center text-slate-400 rounded-2xl font-mono text-sm break-all text-center p-4 group-hover:border-sky-400 transition-colors">
                [QR Data: {qrToken}]
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
                      <h4 className="text-slate-800 font-bold text-sm">{student.name}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5"><span className="text-slate-600 font-semibold">{student.rollNo}</span> • {student.time}</p>
                    </div>
                  </div>
                  
                  <div>
                    {student.status === "Present" ? (
                      <span className="text-emerald-600 font-bold text-sm flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md">
                        <Check className="w-4 h-4" /> Marked
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button className="p-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors shadow-sm" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors shadow-sm" title="Reject">
                          <X className="w-4 h-4" />
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
    </div>
  );
}
