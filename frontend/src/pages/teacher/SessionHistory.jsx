import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Info, Users, History, X, Eye } from "lucide-react";
import api from "../../services/api";
import EmptyState from "../../components/shared/EmptyState";
import { addToast } from "../../store/slices/toastSlice";
import { formatPKTDate, formatPKTTime } from "../../utils/dateUtils";

export default function SessionHistory() {
  const { allocationId, sectionName } = useParams();
  const [sessions, setSessions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Details Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  
  const dispatch = useDispatch();

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/v2/academic/teacher/class/${allocationId}/${sectionName}/sessions?limit=50`);
      setSessions(res.data.data.sessions || res.data.data);
      if (res.data.data.subject) {
        setMeta({
          subject: res.data.data.subject,
          batch: res.data.data.batch,
          teacher: res.data.data.teacher
        });
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ title: "Error", message: "Failed to load session history", type: "error" }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [allocationId, sectionName]);

  const handleViewDetails = async (session) => {
    setSelectedSession(session);
    setSessionDetails([]);
    setIsDetailsLoading(true);
    try {
      // The live attendance endpoint returns all attendance records for a session
      const res = await api.get(`/api/v2/session/${session._id}/live`);
      setSessionDetails(res.data.data.liveFeed || res.data.data || []);
    } catch (err) {
      dispatch(addToast({ title: "Error", message: "Failed to load session details", type: "error" }));
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSession(null);
    setSessionDetails([]);
  };

  return (
    <div className="flex flex-col relative">
      <main className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-1 space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/teacher/class/${allocationId}/${sectionName}`} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Session History
              </h1>
              {meta && (
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                  {meta.subject?.name} <span className="text-slate-300">•</span> {sectionName}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <EmptyState icon={History} title="No Sessions Yet" subtitle="You haven't conducted any sessions for this class." />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Attendees</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map(session => (
                  <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{formatPKTDate(session.startTime, { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {formatPKTTime(session.startTime, { hour: '2-digit', minute: '2-digit', hour12: true })} - {session.endTime ? formatPKTTime(session.endTime, { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Ongoing'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        session.type === 'Retroactive' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {session.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span className="font-semibold">{session.attendanceRecords?.length || session.present || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleViewDetails(session)} className="px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500" />
                <h3 className="font-bold text-slate-800 text-lg">Session Attendance Details</h3>
              </div>
              <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isDetailsLoading ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
                  Loading attendance records...
                </div>
              ) : sessionDetails.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No attendance records found for this session.</p>
                </div>
              ) : (
                <div className="space-y-1 border border-slate-100 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center text-xs font-semibold uppercase text-slate-500">
                    <div className="flex-1">Student</div>
                    <div className="w-24 text-right">Status</div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {sessionDetails.map((record) => (
                      <div key={record.id || record._id} className="flex items-center px-4 py-3 hover:bg-slate-50/50">
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 text-sm">{record.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{record.rollNo}</p>
                        </div>
                        <div className="w-24 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            ['Present', 'Present (Manual)', 'Late'].includes(record.status) 
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
