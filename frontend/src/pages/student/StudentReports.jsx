import React, { useState } from "react";
import UniversalFilterSidebar from "../../components/reports/UniversalFilterSidebar";
import { useDispatch, useSelector } from "react-redux";
import { fetchV2Reports } from "../../store/slices/analyticsSlice";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import EmptyState from "../../components/shared/EmptyState";
import { ShieldCheck, ShieldAlert, FileSpreadsheet, LayoutDashboard, LogOut, BookOpen, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { logoutUser } from "../../store/slices/authSlice";
import { exportV2Report } from "../../store/slices/analyticsSlice";
import { Download } from "lucide-react";

export default function StudentReports() {
  const dispatch = useDispatch();
  const { reportData, isLoading } = useSelector(state => state.analytics);
  const { user } = useSelector(state => state.auth);
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

  const summary = reportData?.summary?.[0] || {
    totalScans: 0,
    totalPresents: 0,
    totalAbsents: 0,
    totalLeaves: 0,
    manualOverrides: 0
  };

  // Safe Buffer Calculation
  // M = (P / 0.75) - T
  const presents = summary.totalPresents + summary.manualOverrides;
  const safeBufferRaw = summary.totalScans > 0 ? (presents / 0.75) - summary.totalScans : 0;
  const safeBuffer = Math.floor(safeBufferRaw);
  
  const currentPercentage = summary.totalScans > 0 ? Math.round((presents / summary.totalScans) * 100) : 0;
  const isAtRisk = currentPercentage < 75;

  const donutData = [
    { name: "Present", value: summary.totalPresents, color: "#10b981" },
    { name: "Manual Present", value: summary.manualOverrides, color: "#f59e0b" },
    { name: "Absent", value: summary.totalAbsents, color: "#ef4444" },
    { name: "Leave", value: summary.totalLeaves, color: "#3b82f6" },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-1 space-y-8">
        
        <div className="flex justify-end">
          <button 
            onClick={handleExport}
            disabled={!hasSearched || isLoading}
            className="btn-outline flex items-center gap-2 px-4 py-2 disabled:opacity-50"
          >
            {isLoading ? (
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
            <UniversalFilterSidebar onFilterChange={handleFilterChange} userRole="student" />
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {!hasSearched ? (
              <EmptyState 
                icon={BookOpen} 
                title="Your Academic Trace"
                message="Select subjects or timeframes from the sidebar to visualize your attendance performance."
              />
            ) : isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Safe Buffer Widget */}
                  <div className={`card p-6 border ${isAtRisk ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'} shadow-sm flex flex-col justify-center`}>
                    <div className="flex items-center gap-4">
                      {isAtRisk ? (
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                          <ShieldAlert className="w-8 h-8" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                      )}
                      
                      <div>
                        <h3 className={`text-lg font-bold ${isAtRisk ? 'text-red-800' : 'text-emerald-800'}`}>
                          {isAtRisk ? 'At Risk (Below 75%)' : 'Safe Buffer'}
                        </h3>
                        <p className={`text-sm font-medium mt-1 ${isAtRisk ? 'text-red-700/90' : 'text-emerald-700/90'}`}>
                          {isAtRisk 
                            ? `You are currently at ${currentPercentage}%. You cannot afford to miss any more classes in this scope.`
                            : `You are at ${currentPercentage}%. You can safely miss ${Math.max(0, safeBuffer)} more class(es) without falling below the 75% threshold.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary KPI */}
                  <div className="card bg-white p-6 border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Classes</p>
                      <h3 className="text-4xl font-extrabold text-slate-800 mt-2">{summary.totalScans}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" /> Selected Scope
                      </p>
                    </div>
                    <div className="w-20 h-20">
                      {/* Mini visual indicator */}
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                          <Pie
                            data={[{ value: presents }, { value: summary.totalScans - presents }]}
                            cx="50%" cy="50%"
                            innerRadius={25} outerRadius={35}
                            dataKey="value"
                            startAngle={90} endAngle={-270}
                            stroke="none"
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#e2e8f0" />
                          </Pie>
                         </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Status Breakdown Donut */}
                <div className="card bg-white p-6 border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6">Status Breakdown</h3>
                  {summary.totalScans === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm">No attendance records found for this scope.</div>
                  ) : (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%" cy="50%"
                            innerRadius={80} outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                {/* Per-Subject Breakdown Table */}
                <div className="card bg-white p-6 border-slate-200 shadow-sm mt-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                    Subject Breakdown
                  </h3>
                  
                  {reportData?.subjects?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">No subject data available.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Subject Code</th>
                            <th className="px-4 py-3">Subject Name</th>
                            <th className="px-4 py-3 text-right">Classes Held</th>
                            <th className="px-4 py-3 text-right">Attended</th>
                            <th className="px-4 py-3 text-right">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData?.subjects?.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-medium text-slate-700">{sub.subjectCode}</td>
                              <td className="px-4 py-3 text-slate-600">{sub.subjectName}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{sub.totalScans}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{sub.presents}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded font-bold ${
                                  sub.attendancePercentage < 75 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {sub.attendancePercentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
