import React, { useState } from "react";
import UniversalFilterSidebar from "../../components/reports/UniversalFilterSidebar";
import { useDispatch, useSelector } from "react-redux";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import { AlertTriangle, Users, BookOpen, Fingerprint, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import EmptyState from "../../components/shared/EmptyState";

export default function AdminReports() {
  const dispatch = useDispatch();
  const { reportData, isReportLoading } = useSelector(state => state.analytics);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPayload, setCurrentPayload] = useState(null);

  const handleFilterChange = (payload) => {
    setCurrentPayload(payload);
    dispatch(fetchV2Reports({
      target: "universal",
      timeframe: payload.timeframe,
      filters: payload.filters
    }));
    setHasSearched(true);
  };

  const handleExport = () => {
    if (!currentPayload) return;
    dispatch(exportV2Report({
      target: "universal",
      timeframe: currentPayload.timeframe,
      filters: currentPayload.filters,
      format: "xlsx"
    }));
  };

  const summary = reportData?.summary?.[0] || {};
  const students = reportData?.students || [];

  const atRiskStudents = students.filter(s => s.attendancePercentage < 75);
  
  const manualOverrideRate = summary.totalScans > 0 
    ? Math.round((summary.manualOverrides / summary.totalScans) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Analytics & Reports</h2>
          <p className="text-slate-500 text-sm mt-1">Analyze multi-level attendance trends and defaulters.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={!hasSearched || isReportLoading}
          className="btn-outline flex items-center gap-2 px-4 py-2 disabled:opacity-50"
        >
          {isReportLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export to Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <UniversalFilterSidebar onFilterChange={handleFilterChange} userRole="admin" />
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {!hasSearched ? (
            <EmptyState 
              icon={BookOpen} 
              title="Universal Reporting Engine"
              message="Select your criteria from the sidebar to dynamically construct a report across the university."
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
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{summary.totalScans?.toLocaleString() || 0}</h3>
                  </div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-5 border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Overall Presence</p>
                    <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                      {summary.totalScans > 0 ? ((summary.totalPresents / summary.totalScans) * 100).toFixed(1) : 0}%
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-5 border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">Manual Overrides</p>
                    <h3 className="text-2xl font-bold text-amber-600 mt-1">{manualOverrideRate}%</h3>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Data Visualization Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* At-Risk Radar */}
                <div className="card bg-white p-5 border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> At-Risk Radar (&lt; 75%)
                  </h3>
                  {atRiskStudents.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No students are currently below the 75% threshold in this selection.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {atRiskStudents.slice(0, 50).map(student => (
                        <div key={student._id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.rollNo} • {student.discipline}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{student.attendancePercentage}%</p>
                            <p className="text-[10px] text-slate-400">{student.presents}/{student.totalScans} presents</p>
                          </div>
                        </div>
                      ))}
                      {atRiskStudents.length > 50 && (
                        <p className="text-xs text-center text-slate-400 mt-2">Showing 50 of {atRiskStudents.length} at-risk students. Export for full list.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Top Students Comparison */}
                <div className="card bg-white p-5 border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-sky-500" /> Cohort Distribution (Top 20)
                  </h3>
                  {students.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">
                      No student data available for this selection.
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      {students.length <= 10 ? (
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
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
