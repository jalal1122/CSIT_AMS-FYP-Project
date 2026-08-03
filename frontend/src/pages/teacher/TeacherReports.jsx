import React, { useState } from "react";
import UniversalFilterSidebar from "../../components/reports/UniversalFilterSidebar";
import { useDispatch, useSelector } from "react-redux";
import { fetchV2Reports } from "../../store/slices/analyticsSlice";
import { AlertTriangle, Users, BookOpen, Fingerprint } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import EmptyState from "../../components/shared/EmptyState";
import { Link } from "react-router-dom";
import { logoutUser } from "../../store/slices/authSlice";
import NotificationCenter from "../../components/layout/NotificationCenter";
import { LayoutDashboard, FileSpreadsheet } from "lucide-react";

export default function TeacherReports() {
  const dispatch = useDispatch();
  const { reportData, isReportLoading } = useSelector(state => state.analytics);
  const { user } = useSelector(state => state.auth);

  const [hasSearched, setHasSearched] = useState(false);

  const handleFilterChange = (payload) => {
    dispatch(fetchV2Reports({
      target: "universal",
      timeframe: payload.timeframe,
      filters: payload.filters
    }));
    setHasSearched(true);
  };

  const summary = reportData?.summary?.[0] || {};
  const students = reportData?.students || [];

  const atRiskStudents = students.filter(s => s.attendancePercentage < 75);
  
  const manualOverrideRate = summary.totalScans > 0 
    ? Math.round((summary.manualOverrides / summary.totalScans) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header aligned with TeacherDashboard */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-sky-600 tracking-tight">Classroom Command Center</h1>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Reporting & Analytics</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
            <Link to="/teacher/dashboard" className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap">
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>
            <Link to="/teacher/reports" className="px-3 py-2 text-sm font-semibold text-sky-600 bg-sky-50 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2">
               <FileSpreadsheet className="w-4 h-4" /> Reports
            </Link>
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 ml-2">
              <NotificationCenter />
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold border border-sky-200">
                {user?.name?.charAt(0) || "T"}
              </div>
              <button 
                className="text-rose-500 text-sm font-semibold hover:bg-rose-50 px-3 py-1.5 rounded transition-colors"
                onClick={() => dispatch(logoutUser())}
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <UniversalFilterSidebar onFilterChange={handleFilterChange} userRole="teacher" />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {!hasSearched ? (
              <EmptyState 
                icon={BookOpen} 
                title="Universal Reporting Engine"
                message="Select your criteria from the sidebar to dynamically construct a report across your classes and students."
              />
            ) : isReportLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Top KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card bg-white p-5 border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Total Scans</p>
                      <h3 className="text-2xl font-bold text-slate-800">{summary.totalScans || 0}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="card bg-white p-5 border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">Manual Override Rate</p>
                      <h3 className="text-2xl font-bold text-slate-800">{manualOverrideRate}%</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="card bg-white p-5 border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 font-medium">At-Risk Students</p>
                      <h3 className="text-2xl font-bold text-red-600">{atRiskStudents.length}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* At-Risk Radar */}
                  <div className="card bg-white p-5 border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" /> At-Risk Radar (&lt; 75%)
                    </h3>
                    {atRiskStudents.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm">
                        No students are currently at risk in this scope. Great job!
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {atRiskStudents.map(student => (
                          <div key={student._id} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-lg">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                              <p className="text-xs text-slate-500">{student.rollNo}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-red-600">{student.attendancePercentage}%</p>
                              <p className="text-xs text-slate-500">{student.totalScans} Total Classes</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Student Comparison Matrix (Radar Chart) */}
                  <div className="card bg-white p-5 border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Student Comparison Matrix</h3>
                    {students.length === 0 ? (
                      <div className="text-center py-10 text-slate-500 text-sm">
                        No students found for this filter.
                      </div>
                    ) : (
                      <div className="h-80">
                        {/* We use Bar Chart because Radar gets messy with too many students. If < 8, Radar is cool. */}
                        {students.length <= 8 && students.length > 2 ? (
                           <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={students}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} />
                              <Radar name="Attendance %" dataKey="attendancePercentage" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                              <RechartsTooltip />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={students.slice(0, 20)} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                              <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                              <Bar dataKey="attendancePercentage" fill="#6366f1" radius={[4, 4, 0, 0]} name="Attendance %" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                        {students.length > 20 && (
                          <p className="text-xs text-center text-slate-400 mt-2">Showing top 20 students for comparison.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
