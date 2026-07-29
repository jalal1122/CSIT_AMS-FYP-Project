import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { QrCode, AlertTriangle, Book, History, LayoutDashboard, Settings } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 relative pb-28 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-sky-600 tracking-tight uppercase">AttendX Student Portal</h1>
            </div>
            {/* Mobile Avatar */}
            <div className="sm:hidden flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border border-sky-200">
                {(user?.name || "S").charAt(0)}
              </div>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <Link to="/student/dashboard" className="px-3 py-2 text-sm font-semibold text-sky-600 bg-sky-50 rounded-lg flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link to="/student/classes" className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg whitespace-nowrap transition-colors">
              Classes
            </Link>
            <Link to="/student/reports" className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg whitespace-nowrap transition-colors">
              Reports
            </Link>
            <Link to="/student/schedule" className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg whitespace-nowrap transition-colors">
              Schedule
            </Link>
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
              <button className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-full transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <Link to="/student/profile" className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-slate-200 group">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold border border-sky-200 group-hover:bg-sky-200 transition-colors">
                  {(user?.name || "S").charAt(0)}
                </div>
              </Link>
            </div>
          </nav>
        </div>
      </header>

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
            {currentSubjects.map(sub => {
              const percentage = Math.round((sub.present / sub.total) * 100);
              const isDefaulter = percentage < 75;

              return (
                <div key={sub.id} className="card p-6 border-slate-200 hover:border-sky-300 hover:shadow-md transition-all">
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
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "past" && (
          <div className="card p-12 text-center text-slate-400 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center bg-slate-50/50 min-h-[300px]">
            <History className="w-12 h-12 mb-4 text-slate-300" />
            <p className="text-lg font-bold text-slate-600">No past semesters found.</p>
            <p className="text-sm font-medium mt-2">This is your first semester in the system.</p>
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
