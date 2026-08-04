import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { QrCode, AlertTriangle, Book, History, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { fetchStudentDashboard, fetchStudentHistory } from "../../store/slices/studentSlice";
import { logoutUser } from "../../store/slices/authSlice";
import NotificationCenter from "../../components/layout/NotificationCenter";

export default function StudentDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { dashboardData, historyData, isLoading } = useSelector(state => state.student);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    dispatch(fetchStudentDashboard());
    dispatch(fetchStudentHistory());
  }, [dispatch]);

  const currentSubjects = dashboardData || [];
  const pastSemesters = historyData || [];

  const hasDefaulter = currentSubjects.some(s => {
    if (s.total === 0) return false;
    return (s.present / s.total) < 0.75;
  });

  if (isLoading && !dashboardData) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col">
      <main className="max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8 flex-1">
        
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
          <p className="text-slate-500 font-medium mt-1">Track your attendance and academic progress.</p>
        </div>

        {hasDefaulter && activeTab === "current" && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900">Attendance Warning</h4>
              <p className="text-sm font-medium text-amber-700/90 mt-1">
                Your attendance in one or more subjects has fallen below the 75% requirement. You are at risk of being barred from final exams.
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-2 border-b border-slate-200">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "current" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setActiveTab("current")}
          >
            <Book className="w-4 h-4" /> Current Semester
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "past" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setActiveTab("past")}
          >
            <History className="w-4 h-4" /> Past Semesters
          </button>
        </div>

        {activeTab === "current" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSubjects.length === 0 ? (
              <div className="col-span-full card p-12 text-center text-slate-400 border-dashed border-2 border-slate-200">
                <Book className="w-12 h-12 mb-4 text-slate-300 mx-auto" />
                <p className="text-lg font-bold text-slate-600">No active subjects found.</p>
              </div>
            ) : currentSubjects.map(sub => {
              const percentage = sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 0;
              const isDefaulter = percentage < 75;

              return (
                <Link to={`/student/classes/${sub.id}`} key={sub.id} className="card p-6 border-slate-200 hover:border-sky-300 hover:shadow-md transition-all block text-left">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded">
                      {sub.code}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2">{sub.name}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-8">{sub.teacher}</p>
                  
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-semibold text-slate-700">{sub.present} / {sub.total} Classes</span>
                      <span className={`text-2xl font-black ${isDefaulter ? "text-rose-500" : "text-emerald-500"}`}>{percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isDefaulter ? "bg-rose-500" : "bg-emerald-500"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {activeTab === "past" && (
          <div className="space-y-8">
            {pastSemesters.length === 0 ? (
              <div className="card p-12 text-center text-slate-400 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center bg-slate-50/50 min-h-[300px]">
                <History className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-bold text-slate-600">No past semesters found.</p>
                <p className="text-sm font-medium mt-2">This is your first semester in the system.</p>
              </div>
            ) : (
              pastSemesters.map((semData) => (
                <div key={semData.sem} className="card p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Semester {semData.sem}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 rounded-l-lg font-semibold">Subject</th>
                          <th className="px-4 py-3 font-semibold text-center">Attendance</th>
                          <th className="px-4 py-3 rounded-r-lg font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {semData.subjects.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-800">{sub.name}</td>
                            <td className="px-4 py-3 text-center text-slate-600 font-mono">{sub.attendance}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center px-2 py-1 rounded font-bold font-mono text-xs border ${
                                sub.status === "Cleared" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* Floating Action Button for Scanning */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button 
          onClick={() => navigate("/student/scan")}
          className="bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/40 flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95"
        >
          <QrCode className="w-6 h-6" /> Scan Attendance
        </button>
      </div>
    </div>
  );
}
