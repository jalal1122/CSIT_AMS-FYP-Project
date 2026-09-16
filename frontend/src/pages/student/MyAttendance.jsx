import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, Info } from "lucide-react";
import api from "../../services/api";
import { formatPKTDate, formatPKTTime } from "../../utils/dateUtils";
import EmptyState from "../../components/shared/EmptyState";


export default function MyAttendance() {
  const { allocationId } = useParams();
  const { user } = useSelector(state => state.auth);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjectInfo, setSubjectInfo] = useState(null);

  useEffect(() => {
    const fetchAttendanceDetails = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/v2/academic/student/class/${allocationId}/attendance`);
        const data = res.data.data;
        setSessions(data.sessions || []);
        setSubjectInfo(data.subject || null);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendanceDetails();
  }, [allocationId]);

  return (
    <div className="flex flex-col">
      <main className="max-w-4xl mx-auto w-full p-3 sm:p-4 md:p-8 flex-1 space-y-4 sm:space-y-6">
        
        <div className="mb-2 flex items-center gap-3 sm:gap-4">
          <Link to="/student/dashboard" className="p-1.5 sm:p-2 -ml-1 sm:-ml-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight truncate">Attendance Details</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 truncate">{subjectInfo?.name || "Subject Name"}</p>
          </div>
        </div>
        <div className="card p-4 sm:p-6 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-sky-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">{subjectInfo?.name} ({subjectInfo?.code})</h2>
            <p className="text-xs sm:text-sm text-slate-500">{subjectInfo?.teacher}</p>
          </div>
          <div className="flex gap-2 sm:gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="text-center px-2 sm:px-4 border-r border-slate-100 flex-1 md:flex-initial">
              <p className="text-xl sm:text-2xl font-black text-emerald-500">{sessions.filter(s => s.status === 'Present' || s.status === 'Present (Manual)' || s.status === 'Late').length}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Present</p>
            </div>
            <div className="text-center px-2 sm:px-4 border-r border-slate-100 flex-1 md:flex-initial">
              <p className="text-xl sm:text-2xl font-black text-rose-500">{sessions.filter(s => s.status === 'Absent').length}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Absent</p>
            </div>
            <div className="text-center pl-2 sm:pl-4 flex-1 md:flex-initial">
              <p className="text-xl sm:text-2xl font-black text-sky-500">{sessions.length}</p>
              <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Total</p>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading records...</div>
          ) : sessions.length === 0 ? (
            <EmptyState icon={Calendar} title="No Records" subtitle="No attendance records found for this class." />
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Date & Time</th>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Status</th>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Type</th>
                    <th className="px-4 sm:px-6 py-3.5 sm:py-4">Marked At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map(session => (
                    <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">{formatPKTDate(session.date, { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                            <p className="text-[11px] sm:text-xs font-medium text-slate-500">{formatPKTTime(session.date, { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                        {(session.status === 'Present' || session.status === 'Present (Manual)' || session.status === 'Late') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> {session.status}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </span>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                        <span className="text-xs sm:text-sm font-medium text-slate-600">{session.type}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-xs sm:text-sm text-slate-500">
                        {session.markedAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {formatPKTTime(session.markedAt, { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
