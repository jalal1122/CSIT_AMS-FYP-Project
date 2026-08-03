import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, GraduationCap, BarChart2, ShieldAlert } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import ReportFilterBar from "../../components/reports/ReportFilterBar";
import { fetchV2Reports, exportV2Report } from "../../store/slices/analyticsSlice";
import EmptyState from "../../components/shared/EmptyState";

export default function HODReports() {
  const dispatch = useDispatch();
  const { examEligibility, interDisciplineBenchmark, loading } = useSelector((state) => state.analytics);
  const [currentFilters, setCurrentFilters] = useState(null);

  const handleFilterChange = (filterPayload) => {
    setCurrentFilters(filterPayload);
    dispatch(fetchV2Reports({ target: "exam-eligibility", ...filterPayload }));
    dispatch(fetchV2Reports({ target: "inter-discipline-benchmark", ...filterPayload }));
  };

  const handleExport = (target, format) => {
    if (!currentFilters) return;
    dispatch(exportV2Report({ target, ...currentFilters, format }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Academic Leadership Reports</h1>
          <p className="text-slate-600 mt-1">Executive summaries for Deans and HODs</p>
        </div>
      </div>

      {/* Reusable Filter Bar */}
      <ReportFilterBar onFilterChange={handleFilterChange} userRole="admin" />

      {loading && currentFilters && (
        <div className="text-center text-slate-500 py-10">Aggregating executive insights...</div>
      )}

      {!loading && !currentFilters && (
        <div className="card p-10 bg-slate-50/50 flex items-center justify-center">
          <EmptyState 
            icon={GraduationCap} 
            title="Select Filters" 
            subtitle="Choose a timeframe and departments to generate HOD reports." 
          />
        </div>
      )}

      {!loading && currentFilters && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Report 22: Inter-Discipline Benchmark */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Inter-Discipline Benchmark</h2>
                  <p className="text-sm text-slate-500">Comparative average engagement across disciplines</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("inter-discipline-benchmark", "xlsx")}
                className="btn-secondary flex items-center justify-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {interDisciplineBenchmark && interDisciplineBenchmark.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={interDisciplineBenchmark} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#64748b'}}
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <RechartsTooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="averageAttendance" fill="#6366f1" name="Avg Attendance %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState 
                icon={BarChart2} 
                title="No Benchmark Data" 
                subtitle="No attendance records found for the selected disciplines." 
              />
            )}
          </div>

          {/* Report 21: Official Exam Eligibility */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">Exam Eligibility Matrix</h2>
                  <p className="text-sm text-slate-500">Official clearance sheet based on 75% threshold</p>
                </div>
              </div>
              <button 
                onClick={() => handleExport("exam-eligibility", "pdf")}
                className="btn-secondary flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>

            {examEligibility && examEligibility.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Roll No</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3 text-right">Total Sessions</th>
                      <th className="px-4 py-3 text-right">Attended</th>
                      <th className="px-4 py-3 text-right">Overall %</th>
                      <th className="px-4 py-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examEligibility.slice(0, 10).map((student) => (
                      <tr key={student.studentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700">{student.rollNo || "N/A"}</td>
                        <td className="px-4 py-3">{student.name}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{student.total}</td>
                        <td className="px-4 py-3 text-right font-medium">{student.present}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={student.percentage >= 75 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                            {student.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            student.status === "Eligible" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {student.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {examEligibility.length > 10 && (
                  <div className="mt-4 text-center text-sm text-slate-500">
                    Showing top 10 rows. Export the report to view all {examEligibility.length} students.
                  </div>
                )}
              </div>
            ) : (
              <EmptyState 
                icon={ShieldAlert} 
                title="No Eligibility Data" 
                subtitle="No attendance records available for eligibility calculation." 
              />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
