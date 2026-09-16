import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Info, Users, History, X, Eye } from "lucide-react";
import api from "../../services/api";
import EmptyState from "../../components/shared/EmptyState";
import { addToast } from "../../store/slices/toastSlice";
import { formatPKTDate, formatPKTTime } from "../../utils/dateUtils";

import SessionDetailsModal from "../../components/teacher/SessionDetailsModal";

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
      const res = await api.get(`/api/v2/session/${session._id}/details`);
      setSessionDetails(res.data.data.details || res.data.data || []);
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
      <main className="max-w-6xl mx-auto w-full p-3 sm:p-4 md:p-8 flex-1 space-y-4 sm:space-y-6">
        <div className="mb-2 sm:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link to={`/teacher/class/${allocationId}/${sectionName}`} className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight text-slate-900 truncate">
                Session History
              </h1>
              {meta && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 truncate">
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
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-3.5 sm:px-6 py-3.5 sm:py-4">Date & Time</th>
                    <th className="px-3.5 sm:px-6 py-3.5 sm:py-4">Type</th>
                    <th className="px-3.5 sm:px-6 py-3.5 sm:py-4">Attendees</th>
                    <th className="px-3.5 sm:px-6 py-3.5 sm:py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map(session => (
                    <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 sm:px-6 py-3.5 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">{formatPKTDate(session.startTime, { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-500">
                              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {formatPKTTime(session.startTime, { hour: '2-digit', minute: '2-digit', hour12: true })} - {session.endTime ? formatPKTTime(session.endTime, { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Ongoing'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 sm:px-6 py-3.5 sm:py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          session.type === 'Retroactive' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                          {session.type}
                        </span>
                      </td>
                      <td className="px-3.5 sm:px-6 py-3.5 sm:py-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 text-xs sm:text-sm">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">{session.attendanceRecords?.length || session.present || 0}</span>
                        </div>
                      </td>
                      <td className="px-3.5 sm:px-6 py-3.5 sm:py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleViewDetails(session)} className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors flex items-center gap-1 sm:gap-1.5 shadow-sm">
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <SessionDetailsModal 
        isOpen={!!selectedSession} 
        onClose={closeModal} 
        isLoading={isDetailsLoading} 
        sessionDetails={sessionDetails} 
      />
    </div>
  );
}
