import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Edit2, Info, Users, Trash2, History } from "lucide-react";
import api from "../../services/api";
import EmptyState from "../../components/shared/EmptyState";
import { addToast } from "../../store/slices/toastSlice";

export default function SessionHistory() {
  const { allocationId, sectionName } = useParams();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/v2/academic/teacher/class/${allocationId}/${sectionName}/sessions?limit=50`);
      setSessions(res.data.data.sessions || res.data.data);
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



  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session? This will remove attendance for all students in this session.")) return;
    try {
      // Keep using the correct route here if it exists in backend, else it will 404. We will add a session delete route in Phase 3 if missing.
      await api.delete(`/api/v2/session/${id}`);
      dispatch(addToast({ title: "Success", message: "Session deleted successfully", type: "success" }));
      fetchSessions();
    } catch (err) {
      dispatch(addToast({ title: "Error", message: err.response?.data?.message || "Failed to delete session", type: "error" }));
    }
  };

  return (
    <div className="flex flex-col">
      <main className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-1 space-y-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/teacher/class/${allocationId}/${sectionName}`} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Session History</h1>
              <p className="text-sm font-medium text-slate-500 mt-0.5">Section {sectionName}</p>
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
                          <p className="font-bold text-slate-800 text-sm">{new Date(session.startTime).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(session.startTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - {session.endTime ? new Date(session.endTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Ongoing'}
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
                        <span className="font-semibold">{session.attendanceRecords?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* 
                          TODO: Implement session editing route (to manually modify student attendance in a past session)
                        */}
                        <button className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-md transition-colors" title="Edit Session">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(session._id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="Delete Session">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
