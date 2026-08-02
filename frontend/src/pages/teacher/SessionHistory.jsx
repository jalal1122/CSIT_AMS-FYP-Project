import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Edit2, Info, Users, Trash2 } from "lucide-react";
import api from "../../services/api";
import EmptyState from "../../components/shared/EmptyState";
import moment from "moment";
import toast from "react-hot-toast";

export default function SessionHistory() {
  const { allocationId, sectionName } = useParams();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [allocationId, sectionName]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/v2/sessions?allocationId=${allocationId}&sectionName=${sectionName}`);
      setSessions(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load session history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this session? This will remove attendance for all students in this session.")) return;
    try {
      await api.delete(`/api/v2/sessions/${id}`);
      toast.success("Session deleted successfully");
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete session");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/teacher/class/${allocationId}/${sectionName}`} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-sky-600 tracking-tight">Session History</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Section {sectionName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full p-4 md:p-8 flex-1 space-y-6">
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
                          <p className="font-bold text-slate-800 text-sm">{moment(session.startTime).format('MMM DD, YYYY')}</p>
                          <p className="text-xs font-medium text-slate-500">
                            {moment(session.startTime).format('hh:mm A')} - {session.endTime ? moment(session.endTime).format('hh:mm A') : 'Ongoing'}
                          </p>
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
