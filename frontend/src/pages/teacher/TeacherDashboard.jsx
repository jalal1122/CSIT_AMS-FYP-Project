import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { BookOpen, Users, Clock, PlayCircle, History, Filter } from "lucide-react";
import StartSessionModal from "../../components/teacher/StartSessionModal";
import Badge from "../../components/shared/Badge";
import { fetchTeacherDashboard, fetchTeacherHistory } from "../../store/slices/teacherSlice";
import { startLiveSession } from "../../store/slices/sessionSlice";

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { activeAllocations, pastClasses, isLoading } = useSelector(state => state.teacher);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);

  useEffect(() => {
    dispatch(fetchTeacherDashboard());
    dispatch(fetchTeacherHistory());
  }, [dispatch]);

  const handleOpenModal = (alloc) => {
    setSelectedAllocation(alloc);
    setIsModalOpen(true);
  };

  const handleStartSession = async (settings) => {
    try {
      const res = await dispatch(startLiveSession({
        allocationId: selectedAllocation._id,
        sectionName: selectedAllocation.sectionName || selectedAllocation.section,
        type: settings.type,
        securityConfig: {
          requireLocation: settings.radius > 0,
          locationRadius: settings.radius,
          manualApprovalRequired: settings.manualApproval
        }
      })).unwrap();
      
      setIsModalOpen(false);
      navigate(`/teacher/session/live/${res.session._id}`);
    } catch (err) {
      alert(err);
    }
  };

  if (isLoading && activeAllocations.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-sky-600 tracking-tight">AttendX Teacher Portal</h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Welcome, {user?.name || "Teacher"}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border border-sky-200">
              {user?.name?.charAt(0) || "T"}
            </div>
            <button 
              className="text-rose-500 text-sm font-semibold hover:bg-rose-50 px-3 py-1.5 rounded transition-colors"
              onClick={() => {/* logout */}}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 flex-1">
        
        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "active" 
                ? "border-sky-500 text-sky-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setActiveTab("active")}
          >
            <PlayCircle className="w-4 h-4" /> Active Classes
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "past" 
                ? "border-sky-500 text-sky-600" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
            onClick={() => setActiveTab("past")}
          >
            <History className="w-4 h-4" /> History & Reports
          </button>
        </div>

        {activeTab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAllocations.map(alloc => (
              <div key={`${alloc._id}-${alloc.section}`} className="card p-6 group relative overflow-hidden flex flex-col h-full border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-sky-100/50 blur-3xl rounded-full pointer-events-none group-hover:bg-sky-200/50 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 border border-sky-200 px-2.5 py-1 rounded">
                    {alloc.subjectCode}
                  </span>
                  <Badge variant="neutral">Sem {alloc.semester}</Badge>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{alloc.subjectName}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{alloc.batch} • Section {alloc.section}</p>
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" /> {alloc.students}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" /> 3 Cr
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => handleOpenModal(alloc)}
                    className="w-full btn-success py-3 flex items-center justify-center gap-2"
                  >
                    Start Live Session <PlayCircle className="w-5 h-5" />
                  </button>
                  <Link to={`/teacher/class/${alloc._id}/${alloc.section}`} className="block text-center mt-4 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
                    View Roster & Stats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "past" && (
          <div className="space-y-6">
            <div className="card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 w-full md:w-auto">
                <Filter className="w-4 h-4" /> 
                <span className="text-sm font-semibold text-slate-700">Filter History:</span>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <select className="input flex-1 py-2">
                  <option>All Subjects</option>
                  <option>Data Structures</option>
                </select>
                <select className="input flex-1 py-2">
                  <option>All Sections</option>
                  <option>Section A</option>
                </select>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Subject & Section</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Attendance</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastClasses.map((session) => (
                      <tr key={session._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-700 text-sm font-medium">{session.date}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-800 font-semibold text-sm">{session.subject}</div>
                          <div className="text-xs text-slate-500 mt-0.5">Section {session.section}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{session.type}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-800 font-bold">{session.present}</span>
                            <span className="text-slate-400 font-medium">/ {session.total}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ml-2 font-bold ${
                              (session.present/session.total) >= 0.75 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}>
                              {Math.round((session.present/session.total)*100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link to={`/teacher/class/${session.allocationId || 'unknown'}/${session.section}?session=${session._id}`} className="text-sm text-sky-600 hover:text-sky-700 hover:underline font-semibold transition-colors">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <StartSessionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStartSession}
        className={selectedAllocation ? `${selectedAllocation.subjectCode} - ${selectedAllocation.subjectName}` : ""}
      />
    </div>
  );
}
