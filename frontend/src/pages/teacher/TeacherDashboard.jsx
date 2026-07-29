import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BookOpen, Users, Clock, PlayCircle, History, Filter } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");

  const activeAllocations = [
    { _id: "alloc1", subjectName: "Data Structures", subjectCode: "CS301", batch: "BSIT 2026", section: "A", semester: 3, students: 45 },
    { _id: "alloc2", subjectName: "Web Development", subjectCode: "CS401", batch: "BSCS 2025", section: "C", semester: 5, students: 38 },
  ];

  const pastClasses = [
    { _id: "sess1", subject: "Data Structures", section: "A", date: "Oct 12, 2023", type: "Lecture", present: 42, total: 45 },
    { _id: "sess2", subject: "Web Development", section: "C", date: "Oct 10, 2023", type: "Lab", present: 35, total: 38 },
  ];

  const handleStartSession = (allocationId) => {
    navigate(`/teacher/session/live/${allocationId}`); // Typically opens modal first, but we'll jump for now
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-surface-light border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AttendX Teacher</h1>
            <p className="text-xs text-text-muted">Welcome, {user?.name || "Teacher"}</p>
          </div>
          <button 
            className="text-danger text-sm font-medium hover:bg-danger/10 px-3 py-1.5 rounded transition-colors"
            onClick={() => {/* logout */}}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Tabs */}
        <div className="flex space-x-1 border-b border-white/10">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "active" ? "border-secondary text-secondary" : "border-transparent text-text-muted hover:text-white"
            }`}
            onClick={() => setActiveTab("active")}
          >
            <PlayCircle className="w-4 h-4" /> Active Classes
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "past" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-white"
            }`}
            onClick={() => setActiveTab("past")}
          >
            <History className="w-4 h-4" /> History & Reports
          </button>
        </div>

        {activeTab === "active" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAllocations.map(alloc => (
              <div key={alloc._id} className="glass p-6 group relative overflow-hidden flex flex-col h-full">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 blur-3xl rounded-full pointer-events-none group-hover:bg-secondary/20 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <span className="font-mono text-xs font-bold text-secondary bg-secondary/10 px-2 py-1 rounded">
                    {alloc.subjectCode}
                  </span>
                  <span className="text-xs text-text-muted bg-white/5 px-2 py-1 rounded">Sem {alloc.semester}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{alloc.subjectName}</h3>
                <p className="text-sm text-text-muted mb-6">{alloc.batch} • Section {alloc.section}</p>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1.5 text-sm text-white">
                    <Users className="w-4 h-4 text-text-muted" /> {alloc.students}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-white">
                    <Clock className="w-4 h-4 text-text-muted" /> 3 Cr
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    onClick={() => handleStartSession(alloc._id)}
                    className="w-full bg-gradient-to-r from-secondary to-emerald-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-secondary/20 transition-all"
                  >
                    Start Live Session <PlayCircle className="w-5 h-5" />
                  </button>
                  <Link to={`/teacher/class/${alloc._id}`} className="block text-center mt-3 text-sm text-text-muted hover:text-white transition-colors">
                    View Roster & Stats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "past" && (
          <div className="space-y-6">
            <div className="glass p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 text-text-muted w-full md:w-auto">
                <Filter className="w-4 h-4" /> 
                <span className="text-sm font-medium">Filter History:</span>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <select className="flex-1 bg-surface-light border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
                  <option>All Subjects</option>
                  <option>Data Structures</option>
                </select>
                <select className="flex-1 bg-surface-light border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary">
                  <option>All Sections</option>
                  <option>Section A</option>
                </select>
              </div>
            </div>

            <div className="glass overflow-hidden">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-surface-light border-b border-white/10 text-text-muted text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Subject & Section</th>
                    <th className="p-4 font-semibold">Type</th>
                    <th className="p-4 font-semibold">Attendance</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {pastClasses.map((session) => (
                    <tr key={session._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white text-sm">{session.date}</td>
                      <td className="p-4">
                        <div className="text-white font-medium text-sm">{session.subject}</div>
                        <div className="text-xs text-text-muted">Section {session.section}</div>
                      </td>
                      <td className="p-4 text-sm text-text-muted">{session.type}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white font-medium">{session.present}</span>
                          <span className="text-text-muted">/ {session.total}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ml-2 ${
                            (session.present/session.total) >= 0.75 ? "bg-secondary/10 text-secondary" : "bg-danger/10 text-danger"
                          }`}>
                            {Math.round((session.present/session.total)*100)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Link to={`/teacher/class/alloc1?session=${session._id}`} className="text-sm text-primary hover:text-primary-light font-medium transition-colors">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
