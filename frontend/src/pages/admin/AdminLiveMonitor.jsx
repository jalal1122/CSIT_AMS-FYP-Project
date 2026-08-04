import { useState, useEffect } from "react";
import { PlayCircle, Users, Activity, Loader2, MapPin, Search } from "lucide-react";
import api from "../../services/api";
import { useDispatch } from "react-redux";
import { addToast } from "../../store/slices/toastSlice";

export default function AdminLiveMonitor() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const res = await api.get("/api/v2/session/active-all");
      setSessions(res.data.data);
    } catch (error) {
      dispatch(addToast({ title: "Error", message: error.response?.data?.message || "Failed to fetch live sessions", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(
    (s) =>
      s.allocationId.subjectId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.teacherId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.allocationId.subjectId.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="text-emerald-500 w-7 h-7" />
            Live Session Monitor
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time overview of all active classes across the university
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subject or teacher..."
            className="input-field pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading live sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <PlayCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Active Sessions</h3>
          <p className="text-slate-500 mt-2 max-w-sm">
            {searchTerm ? "No live sessions match your search." : "There are currently no classes taking place in the system."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div key={session._id} className="card overflow-hidden hover:shadow-md transition-shadow relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="p-5 border-b border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex items-center gap-1.5 uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Live Now
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {session.type}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 line-clamp-1">
                  {session.allocationId.subjectId.name}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {session.allocationId.subjectId.code} • Sec {session.sectionName}
                </p>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                    {session.teacherId.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 leading-none">{session.teacherId.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{session.teacherId.info?.designation || "Teacher"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Scans
                    </p>
                    <p className="text-xl font-bold text-slate-800">{session.stats?.present || 0}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${(session.stats?.suspicious || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1 ${(session.stats?.suspicious || 0) > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                      Flags
                    </p>
                    <p className={`text-xl font-bold ${(session.stats?.suspicious || 0) > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                      {session.stats?.suspicious || 0}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Started at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
