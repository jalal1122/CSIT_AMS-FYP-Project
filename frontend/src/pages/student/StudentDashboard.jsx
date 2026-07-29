import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { QrCode, AlertTriangle, Book, History } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("current");

  const currentSubjects = [
    { id: "1", name: "Data Structures", code: "CS301", teacher: "Dr. Ali Khan", present: 22, total: 24 },
    { id: "2", name: "Linear Algebra", code: "MTH202", teacher: "Prof. Sarah", present: 18, total: 24 }, // 75%
    { id: "3", name: "Digital Logic", code: "EE201", teacher: "Engr. Usman", present: 16, total: 24 }, // Defaulter < 75%
  ];

  const pastSemesters = [
    { sem: 2, subjects: [
      { id: "p1", name: "Programming Fundamentals", grade: "A", attendance: "92%" },
      { id: "p2", name: "Calculus I", grade: "B+", attendance: "85%" },
    ]}
  ];

  const hasDefaulter = currentSubjects.some(s => (s.present / s.total) < 0.75);

  return (
    <div className="min-h-screen bg-surface relative pb-24">
      {/* Header */}
      <header className="bg-surface-light border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AttendX</h1>
            <p className="text-xs text-text-muted">Student Portal</p>
          </div>
          <Link to="/student/profile" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-lg transition-colors">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">{user?.name || "Student"}</p>
              <p className="text-xs text-text-muted">{user?.username || "ID"}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
              {(user?.name || "S").charAt(0)}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {hasDefaulter && activeTab === "current" && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-danger shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-danger">Attendance Warning</h4>
              <p className="text-sm text-danger/80 mt-1">
                Your attendance in one or more subjects has fallen below the 75% requirement. You are at risk of being barred from final exams.
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-1 border-b border-white/10">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "current" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-white"
            }`}
            onClick={() => setActiveTab("current")}
          >
            <Book className="w-4 h-4" /> Current Semester
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "past" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-white"
            }`}
            onClick={() => setActiveTab("past")}
          >
            <History className="w-4 h-4" /> Past Semesters
          </button>
        </div>

        {activeTab === "current" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSubjects.map(sub => {
              const percentage = Math.round((sub.present / sub.total) * 100);
              const isDefaulter = percentage < 75;

              return (
                <div key={sub.id} className="glass p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {sub.code}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white leading-tight mb-1">{sub.name}</h3>
                  <p className="text-sm text-text-muted mb-6">{sub.teacher}</p>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white">{sub.present} / {sub.total} Classes</span>
                      <span className={`font-bold ${isDefaulter ? "text-danger" : "text-secondary"}`}>{percentage}%</span>
                    </div>
                    <div className="w-full bg-surface-light h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isDefaulter ? "bg-danger" : "bg-secondary"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "past" && (
          <div className="glass p-6 text-center text-text-muted border-dashed border-2 border-white/5">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No past semesters found.</p>
            <p className="text-sm opacity-70 mt-1">This is your first semester in the system.</p>
          </div>
        )}

      </main>

      {/* Floating Action Button for Scanning */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
        <button 
          onClick={() => navigate("/student/scan")}
          className="bg-gradient-primary hover:bg-gradient-to-r hover:from-primary-dark hover:to-primary text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold transition-transform hover:scale-105 active:scale-95"
        >
          <QrCode className="w-6 h-6" /> Scan Attendance
        </button>
      </div>
    </div>
  );
}
