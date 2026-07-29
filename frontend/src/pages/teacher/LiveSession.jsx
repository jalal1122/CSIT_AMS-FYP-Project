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
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Session Header (Red indicates LIVE) */}
      <header className="bg-danger/10 border-b border-danger/20 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
            </span>
            <div>
              <h1 className="text-lg font-bold text-danger">LIVE SESSION</h1>
              <p className="text-xs text-danger/80">Data Structures • Sec A • Lecture</p>
            </div>
          </div>
          <button 
            onClick={handleEndSession}
            className="bg-danger text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-danger/90 transition-colors shadow-lg shadow-danger/20"
          >
            <StopCircle className="w-5 h-5" /> End Session
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: QR Code Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="glass p-8 flex-1 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
            
            <h2 className="text-xl font-bold text-white mb-8 text-center">Scan to mark attendance</h2>
            
            <div className="bg-white p-4 rounded-2xl shadow-2xl mb-8 relative">
              {/* This would be an actual QR code component in production */}
              <div className="w-64 h-64 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 rounded-xl font-mono text-sm break-all text-center p-4">
                [QR Data: {qrToken}]
              </div>
              
              {/* Scan overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent w-full h-20 -translate-y-20 animate-[scan_3s_ease-in-out_infinite]"></div>
            </div>

            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Refreshing in</span>
                <span className="text-primary font-mono font-bold">{countdown}s</span>
              </div>
              <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(countdown / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Feed Panel */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-140px)]">
          <div className="glass flex-1 flex flex-col overflow-hidden">
            
            <div className="p-6 border-b border-white/10 bg-surface-light/50 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Live Feed
              </h3>
              <div className="flex gap-3 text-sm">
                <span className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-1 rounded-full font-medium">
                  {presentCount} Present
                </span>
                {pendingCount > 0 && (
                  <span className="bg-accent/10 text-accent border border-accent/20 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {pendingCount} Pending
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {attendance.map((student) => (
                <div key={student.id} className="bg-surface-light p-4 rounded-lg border border-white/5 flex items-center justify-between animate-in slide-in-from-right-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      student.status === "Present" ? "bg-secondary/20 text-secondary" : "bg-accent/20 text-accent"
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{student.name}</h4>
                      <p className="text-xs text-text-muted font-mono">{student.rollNo} • {student.time}</p>
                    </div>
                  </div>
                  
                  <div>
                    {student.status === "Present" ? (
                      <span className="text-secondary font-medium text-sm flex items-center gap-1">
                        <Check className="w-4 h-4" /> Marked
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button className="p-2 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg transition-colors" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg transition-colors" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="text-center p-8 text-text-muted text-sm border-2 border-dashed border-white/5 rounded-xl">
                Waiting for more students to scan...
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
